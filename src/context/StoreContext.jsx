import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { db } from '../firebase/config';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const StoreContext = createContext();

export const useStore = () => useContext(StoreContext);

// MOCK_PLAYERS removed for production cleanup

const INITIAL_MATCH_STATE = {
    id: `match_${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    time: '20:30',
    location: 'Campo de Fútbol Local',
    status: 'upcoming',
    mvp: null,
    attendance: {},
    guestPlayers: [],
    teams: null
};

export const StoreProvider = ({ children }) => {
    const { user: authUser, logout } = useAuth();
    const [players, setPlayers] = useState([]);
    const [playersLoading, setPlayersLoading] = useState(true);
    const [currentMatch, setCurrentMatch] = useState(INITIAL_MATCH_STATE);
    const [pastMatches, setPastMatches] = useState([]);

    // Independent Voting State 
    const [votingStatus, setVotingStatus] = useState('open');
    const [votes, setVotes] = useState({}); // Ratings: { userId: { targetId: 1-10 } }
    const [mvpVotes, setMvpVotes] = useState({}); // MVP Votes: { userId: targetId }

    // Announcement State
    const [announcement, setAnnouncement] = useState({
        title: "",
        message: "",
        type: "info",
        isVisible: false
    });

    // Notification State
    const [notifications, setNotifications] = useState([]);

    // Notification Actions
    const sendNotification = async (userId, title, message, type = 'info', link = null) => {
        try {
            const notifRef = doc(collection(db, 'users', userId, 'notifications'));
            await setDoc(notifRef, {
                title,
                message,
                type,
                link,
                read: false,
                createdAt: new Date().toISOString()
            });
        } catch (error) {
            console.error("Error sending notification:", error);
        }
    };

    const markAsRead = async (notificationId) => {
        if (!currentUser) return;
        try {
            const notifRef = doc(db, 'users', currentUser.id, 'notifications', notificationId);
            await updateDoc(notifRef, { read: true });
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const clearNotifications = async () => {
        if (!currentUser) return;
        notifications.forEach(n => {
            if (!n.read) markAsRead(n.id);
        });
    };

    const sendNotificationToAll = async (title, message, type = 'info', link = null) => {
        // Iterate all players and send notification
        // Note: In real app, use Cloud Functions. Here we loop client-side (Admin only).
        console.log("Sending Mass Notification:", title);
        const promises = players.map(p => sendNotification(p.id, title, message, type, link));
        await Promise.all(promises);
    };

    const updateAnnouncement = async (announcementData) => {
        const configRef = doc(db, 'system', 'config');
        await updateDoc(configRef, {
            announcement: announcementData
        });

        // Trigger Notification if becoming visible
        if (announcementData.isVisible) {
            await sendNotificationToAll(
                "Nuevo Comunicado: " + announcementData.title,
                announcementData.message,
                announcementData.type === 'urgent' ? 'warning' : 'info',
                '/'
            );
        }
    };

    // Nuclear Cleanup Function
    const clearDatabase = async () => {
        if (!window.confirm("❗ ¿ESTÁS SEGURO? Esto borrará TODOS los jugadores, partidos y configuraciones. No se puede deshacer.")) return;

        try {
            // Delete matches
            const matchPromises = (pastMatches || []).filter(m => m.id).map(m => {
                return deleteDoc(doc(db, 'matches', String(m.id)));
            });
            // Delete players
            const playerPromises = (players || []).filter(p => p.id).map(p => {
                return deleteDoc(doc(db, 'users', String(p.id)));
            });
            // Reset config
            const configPromise = setDoc(doc(db, 'system', 'config'), {
                votingStatus: 'open',
                votes: {},
                mvpVotes: {},
                currentMatch: INITIAL_MATCH_STATE,
                announcement: { title: "", message: "", type: "info", isVisible: false }
            });

            await Promise.all([...matchPromises, ...playerPromises, configPromise]);
            alert("Base de datos limpiada. La aplicación se reiniciará.");
            window.location.reload();
        } catch (error) {
            console.error("Error clearing database:", error);
            alert("Error al limpiar la base de datos.");
        }
    };

    // 2. Real-time Listeners
    // Users
    useEffect(() => {
        if (!authUser) {
            setPlayers([]); // Clear on logout
            setPlayersLoading(false);
            return;
        }

        setPlayersLoading(true);

        const q = query(collection(db, 'users'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setPlayers(usersData);
            setPlayersLoading(false);
        }, (error) => {
            console.error("Error fetching users:", error);
            setPlayersLoading(false);
        });

        return () => unsubscribe();
    }, [authUser]);

    // Current Match (System Config)
    useEffect(() => {
        if (!authUser) return;

        const docRef = doc(db, 'system', 'config');
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setCurrentMatch(data.currentMatch);

                // Notification Trigger: Check if status changed to 'played_pending_votes'
                // This logic is tricky in snapshot listener. Ideally move to SetMatchResult action.
                // WE WILL DO IT IN ACTIONS to avoid loops.

                if (data.currentMatch.status === 'played_pending_votes') {
                    setVotingStatus('open');
                } else {
                    setVotingStatus('closed');
                }

                if (data.votes) setVotes(data.votes);
                if (data.mvpVotes) setMvpVotes(data.mvpVotes);
                if (data.announcement) setAnnouncement(data.announcement); // Sync Announcement

            } else {
                // Seed System Config
                setDoc(docRef, {
                    currentMatch: INITIAL_MATCH_STATE,
                    votes: {},
                    mvpVotes: {},
                    announcement: { title: "", message: "", type: "info", isVisible: false }
                });
            }
        }, (error) => {
            console.error("Error fetching config:", error);
        });
        return () => unsubscribe();
    }, [authUser]);

    // Match History
    useEffect(() => {
        if (!authUser) {
            setPastMatches([]);
            return;
        }

        const q = query(collection(db, 'matches'), orderBy('id', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const matchesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setPastMatches(matchesData);
        }, (error) => {
            console.error("Error fetching matches:", error);
        });
        return () => unsubscribe();
    }, [authUser]);

    // Notifications Listener
    useEffect(() => {
        if (!authUser) {
            setNotifications([]);
            return;
        }

        // We need the user's Firestore ID, which matches authUser.uid
        const q = query(collection(db, 'users', authUser.uid, 'notifications'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setNotifications(notifs);
        }, (error) => {
            console.error("Error fetching notifications:", error);
        });
        return () => unsubscribe();
    }, [authUser]);


    // Derived State and Helpers
    const getLeaderboard = useMemo(() => {
        return players.map(p => {
            const average = p.averageRating || 5.0; // Default to 5.0 now
            const score = average * (p.stats.mp || 0);
            const displayName = p.alias || p.name;
            return { ...p, score, average: average.toFixed(1), displayName };
        }).sort((a, b) => {
            const diff = parseFloat(b.average) - parseFloat(a.average);
            if (diff !== 0) return diff; // 1. Average Rating
            return (b.stats.mp || 0) - (a.stats.mp || 0); // 2. Matches Played
        });
    }, [players]);

    const currentUser = useMemo(() => {
        if (!authUser) return null;
        return players.find(p => p.id === authUser.uid);
    }, [authUser, players]);

    const isAdmin = currentUser?.role === 'admin';

    // ACTIONS (Write to Firestore)

    const castVote = async (playerId, value) => {
        // Optimistic
        setVotes(prev => ({ ...prev, [playerId]: value }));

        // DB: votes are stored in system/config for the current match
        // Structure: votes: { [voterId]: { [targetId]: value } } ? 
        // No, current logic is simple: votes[targetId] = count.
        // But for security/multiple voters we need structure. 
        // For MVP refactor: we'll stick to simple aggregation stored in DB?
        // Wait, the previous logic was `votes` = map of `playerId` -> `count`?
        // No, `votes` was just local state in the previous implementation logic?
        // Looking at `castVote`: `setVotes(prev => ({ ...prev, [playerId]: value }))`.
        // This implies one user voting for many players? 
        // Or is it "Who I voted for"? 
        // The Tinder card triggers `castVote(p.id, 1)` or `-1`.
        // So `votes` is "My Votes".

        // If we want GLOBAL voting persistence (so I can resume later), we should store it under my `uid` in `system/config`?
        // Or better: `system/config/votes/{myUid}`. 
        // For simplicity now: I won't persist "My Pending Votes" to DB to avoid complex merging. 
        // `votes` stays local for the session until `closeMatchCycle`?
        // NO. `closeMatchCycle` is called by ADMIN. Admin needs to see EVERYONE's votes.
        // So `castVote` MUST write to DB.

        if (!currentUser) return;
        if (playerId === currentUser.id) {
            console.warn("Self-voting is not allowed.");
            return;
        }

        // We'll store votes as: votes: { [voterUid]: { [targetId]: value } }
        const configRef = doc(db, 'system', 'config');
        // We need to merge deeply. using updateDoc with dot notation
        await updateDoc(configRef, {
            [`votes.${currentUser.id}.${playerId}`]: value
        });
    };

    const castMvpVote = async (playerId) => {
        if (!currentUser) return;
        setMvpVotes(prev => ({ ...prev, [currentUser.id]: playerId }));
        const configRef = doc(db, 'system', 'config');
        await updateDoc(configRef, {
            [`mvpVotes.${currentUser.id}`]: playerId
        });
    };

    // Helper to get aggregated votes for Admin (derived)
    // We override the local `votes` with the aggregated map?
    // Reuse `votes` state for "My Votes" or "All Votes"?
    // Let's make `votes` be "All Votes" from DB (synced in useEffect).

    // Derived: My Votes (for UI consistency)
    // const myVotes = votes[currentUser?.id] || {}; 

    const updatePlayerProfile = async (playerId, newAlias) => {
        // Optimistic
        setPlayers(prev => prev.map(p =>
            p.id == playerId ? { ...p, alias: newAlias } : p
        ));
        const playerRef = doc(db, 'users', String(playerId));
        await updateDoc(playerRef, { alias: newAlias });
    };

    const updatePlayerCard = async (playerId, cardData) => {
        // Auto-calculate Rating & Trend
        let updates = { ...cardData };

        if (cardData.attributes) {
            const player = players.find(p => p.id === playerId);
            const oldRating = player?.averageRating || 5.0;

            // Calculate new average (Attributes are 0-99)
            // Average = Sum / 6 / 10 (to get 0.0 - 9.9 scale)
            const sum = Object.values(cardData.attributes).reduce((a, b) => a + b, 0);
            const newRating = parseFloat(((sum / 6) / 10).toFixed(1));

            updates = {
                ...updates,
                averageRating: newRating,
                previousRating: oldRating, // Capture trend
                lastRatingUpdate: new Date().toISOString()
            };
        }

        setPlayers(prev => prev.map(p =>
            p.id == playerId ? { ...p, ...updates } : p
        ));
        const playerRef = doc(db, 'users', String(playerId));
        await updateDoc(playerRef, updates);
    };

    const updatePlayerPhoto = async (playerId, newPhotoUrl) => {
        setPlayers(prev => prev.map(p =>
            p.id == playerId ? { ...p, photo: newPhotoUrl } : p
        ));
        const playerRef = doc(db, 'users', String(playerId));
        await updateDoc(playerRef, { photo: newPhotoUrl });
    };

    const setAttendance = async (playerId, status) => {
        const configRef = doc(db, 'system', 'config');
        await updateDoc(configRef, {
            [`currentMatch.attendance.${playerId}`]: status
        });
    };

    // Admin Actions
    const toggleVoting = async () => {
        // This is redundant if we depend on match status, but kept for manual toggle override
        // We won't persist this independent toggle, we rely on setMatchResult for status.
        setVotingStatus(prev => prev === 'open' ? 'closed' : 'open');
    };

    const updateMatchDetails = async (updates) => {
        const configRef = doc(db, 'system', 'config');
        // Construct update object with dot notation for nested fields
        const firestoreUpdates = {};
        Object.keys(updates).forEach(key => {
            firestoreUpdates[`currentMatch.${key}`] = updates[key];
        });
        await updateDoc(configRef, firestoreUpdates);
    };

    const addGuestPlayer = async (name) => {
        const newGuest = {
            id: `guest_${Date.now()}`,
            name: name,
            alias: name,
            photo: null,
            role: 'guest',
            status: 'confirmed'
        };
        const configRef = doc(db, 'system', 'config');
        // arrayUnion would be better but we need to read first? No, we can append.
        // Firestore `arrayUnion` needs import. For now, let's read/write or just use currentMatch from state.
        const updatedGuests = [...(currentMatch.guestPlayers || []), newGuest];
        await updateDoc(configRef, {
            'currentMatch.guestPlayers': updatedGuests
        });
    };

    const removeGuestPlayer = async (guestId) => {
        const updatedGuests = (currentMatch.guestPlayers || []).filter(g => g.id !== guestId);
        const configRef = doc(db, 'system', 'config');
        await updateDoc(configRef, {
            'currentMatch.guestPlayers': updatedGuests
        });
    };

    const generateTeams = async () => {
        // Logic remains the same, but we WRITE to DB at the end
        // ... (Include logic copy or refactor) ...
        // 1. Get Confirmations
        const regularConfirmed = players.filter(p => currentMatch.attendance?.[p.id] === 'confirmed');
        const guestConfirmed = currentMatch.guestPlayers || [];

        // 2. Sort Regulars by Rating (Desc)
        const sorted = [...regularConfirmed].sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));

        const teamA = [];
        const teamB = [];

        // 3. Pair Logic 
        for (let i = 0; i < sorted.length; i += 2) {
            const p1 = sorted[i];
            const p2 = sorted[i + 1];

            if (!p2) {
                if (teamA.length < teamB.length) teamA.push(p1);
                else if (teamB.length < teamA.length) teamB.push(p1);
                else (Math.random() > 0.5 ? teamA : teamB).push(p1);
            } else {
                if (Math.random() > 0.5) {
                    teamA.push(p1);
                    teamB.push(p2);
                } else {
                    teamA.push(p2);
                    teamB.push(p1);
                }
            }
        }

        // 4. Guests
        const guests = [...guestConfirmed].sort(() => Math.random() - 0.5);
        guests.forEach(g => {
            if (teamA.length <= teamB.length) {
                teamA.push(g);
            } else {
                teamB.push(g);
            }
        });

        // 5. Avg
        const getAvg = (team) => {
            const counted = team.filter(p => !p.isGuest && p.averageRating);
            if (!counted.length) return 0;
            return (counted.reduce((acc, p) => acc + p.averageRating, 0) / counted.length).toFixed(1);
        };

        // 6. DB Update
        const configRef = doc(db, 'system', 'config');
        await updateDoc(configRef, {
            'currentMatch.teams': {
                teamA,
                teamB,
                avgA: getAvg(teamA),
                avgB: getAvg(teamB)
            }
        });

        // Trigger Notification
        await sendNotificationToAll(
            "¡Equipos Generados!",
            "Los equipos para el próximo partido ya están listos. Entra para ver tu equipo.",
            "action",
            "/match"
        );
    };

    const clearTeams = async () => {
        if (!isAdmin) return;
        const configRef = doc(db, 'system', 'config');
        await updateDoc(configRef, {
            'currentMatch.teams': null
        });
    };

    // STAGE 2: Set Result & Open Voting (or Update Result)
    const setMatchResult = async (scoreA, scoreB, playerStats) => {
        const configRef = doc(db, 'system', 'config');

        // Determine new status: Only advance if it's currently 'upcoming'
        // If it's already 'played_pending_votes' or 'voting_closed', keep it as is.
        let newStatus = currentMatch.status;
        if (currentMatch.status === 'upcoming') {
            newStatus = 'played_pending_votes';
        }

        await updateDoc(configRef, {
            'currentMatch.status': newStatus,
            'currentMatch.result': { scoreA, scoreB },
            'currentMatch.playerStats': playerStats
        });
        // Voting status is handled by listener on 'status'

        // Trigger Notification if opened voting
        if (newStatus === 'played_pending_votes') {
            await sendNotificationToAll(
                "¡Votaciones Abiertas!",
                "El partido ha terminado. Valora a tus compañeros y elige al MVP.",
                "success",
                "/vote"
            );
        }
    };

    // STAGE 3: Close Voting (Admin Only)
    const closeVoting = async () => {
        const configRef = doc(db, 'system', 'config');
        await updateDoc(configRef, {
            'currentMatch.status': 'voting_closed'
        });
    };

    // STAGE 4: Finalize & Archive
    const finalizeMatch = async () => {
        try {
            console.log("Finalizing match...");

            // Check precondition
            if (!currentMatch.result) {
                alert("Error: No hay resultado registrado para este partido.");
                return;
            }

            // Must calculate MVP from `votes` (which is now All Votes from DB)
            // votes structure from DB listener: { voterUid: { targetId: val } }

            // CALCULATE RATINGS FIRST so we can use them for tie-breaking
            const playerMatchRatings = {};
            if (votes) {
                Object.values(votes).forEach(userVotes => {
                    Object.entries(userVotes).forEach(([pid, rating]) => {
                        if (!playerMatchRatings[pid]) playerMatchRatings[pid] = [];
                        playerMatchRatings[pid].push(Number(rating));
                    });
                });
            }

            // Helper to get average for a player
            const getMatchAvg = (pid) => {
                const ratings = playerMatchRatings[pid];
                if (!ratings || ratings.length === 0) return 0;
                return ratings.reduce((a, b) => a + b, 0) / ratings.length;
            };

            // NEW MVP LOGIC: Use mvpVotes { userId: targetPlayerId }
            let voteCounts = {};
            if (mvpVotes) {
                Object.values(mvpVotes).forEach(targetId => {
                    voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
                });
            }

            let mvpId = null;
            let maxVotes = -1;
            let candidates = [];

            // 1. Find Max Votes
            Object.keys(voteCounts).forEach(pid => {
                const val = voteCounts[pid];
                if (val > maxVotes) {
                    maxVotes = val;
                }
            });

            // 2. Identify Candidates (All tied for first)
            Object.keys(voteCounts).forEach(pid => {
                if (voteCounts[pid] === maxVotes) {
                    candidates.push(pid);
                }
            });

            // 3. Resolve Tie (Hierarchy: Votes > Match Rating > Goals+Assists > Coin Flip)
            if (candidates.length === 1) {
                mvpId = candidates[0];
            } else if (candidates.length > 1) {
                console.log("MVP Tie detected between:", candidates);

                // Helper for G+A
                const getGA = (pid) => {
                    const stats = (currentMatch.playerStats && currentMatch.playerStats[pid]) || { goals: 0, assists: 0 };
                    return (stats.goals || 0) + (stats.assists || 0);
                };

                candidates.sort((a, b) => {
                    const diffRating = getMatchAvg(b) - getMatchAvg(a);
                    if (Math.abs(diffRating) > 0.01) return diffRating; // 1. Match Rating

                    const diffGA = getGA(b) - getGA(a);
                    if (diffGA !== 0) return diffGA; // 2. Goals + Assists

                    return 0; // Still tied
                });

                mvpId = candidates[0];
                console.log(`Tie broken! Winner: ${mvpId}`);
            }

            // Calculate MVP's Match Rating (For Display)
            let mvpMatchRating = null;
            if (mvpId) {
                const avg = getMatchAvg(mvpId);
                if (avg > 0) mvpMatchRating = avg.toFixed(1);
            }

            const mvpPlayer = players.find(p => p.id == mvpId);

            // 2. Archive
            const newRecord = {
                id: Date.now(),
                date: new Date(currentMatch.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
                fullDate: currentMatch.date,
                score: `${currentMatch.result.scoreA} - ${currentMatch.result.scoreB}`,
                mvp: mvpPlayer ? (mvpPlayer.alias || mvpPlayer.name) : 'Por Votación',
                mvpId: mvpId, // Save ID
                mvpRating: mvpMatchRating, // Save Rating
                mvpPhoto: mvpPlayer ? mvpPlayer.photo : null,
                // New: Archive full data for History Details
                teams: currentMatch.teams || null,
                playerStats: currentMatch.playerStats || null
            };

            console.log("Archiving match:", newRecord);
            // Add to 'matches' collection
            await setDoc(doc(db, 'matches', String(newRecord.id)), newRecord);

            // 3. Update Player Profiles (Stats) - Use Batch
            const matchStats = currentMatch.playerStats || {};
            // FIX: Update ALL players who were confirmed, regardless of if they scored or got MVP votes.
            const playersToUpdate = players.filter(p =>
                (currentMatch.attendance && currentMatch.attendance[p.id] === 'confirmed') ||
                p.id == mvpId
            );

            // Calculate Match Ratings for each player from `votes` (Reuse map if needed, but it's cheap)
            // ... (Already calculated above, but variable scope issue if we don't lift it.
            // Let's rely on the previous calculation or just recalc/hoist)
            // Ideally refactor, but for now recalc is safe/easy:

            // ... already declared playerMatchRatings above if we move block ...
            // We just moved the block up. So we can remove the second declaration or just let it exist if redundant but cheap.
            // Actually, I inserted the block BEFORE archiving. 
            // So `playerMatchRatings` IS available if I declared it with `const`.

            // Wait, I inserted it into `ReplacementContent` block. 
            // `playersToUpdate` loop is BELOW that block in the file (Line 513).
            // So I can use `playerMatchRatings` directly.

            await Promise.all(playersToUpdate.map(async (p) => {
                const pStats = matchStats[p.id] || { goals: 0, assists: 0 };
                const isMvp = (p.id == mvpId);

                // Calculate New Average Rating
                let newAverage = p.averageRating || 5.0;
                let oldRating = p.averageRating || 5.0; // For Trend
                const currentMp = p.stats?.mp || 0;
                const matchRatings = playerMatchRatings[p.id] || [];

                if (matchRatings.length > 0) {
                    const matchAvg = matchRatings.reduce((a, b) => a + b, 0) / matchRatings.length;
                    // Cumulative Average: (OldAvg * OldMP + MatchAvg) / (OldMP + 1)
                    // Note: We use Math.round or toFixed(1)
                    // Weighted Average strategy:
                    const totalScore = (oldRating * currentMp) + matchAvg;
                    newAverage = parseFloat((totalScore / (currentMp + 1)).toFixed(1));
                }

                const currentStats = p.stats || { mp: 0, goals: 0, assists: 0, mvp: 0 };

                const newStats = {
                    mp: currentMp + 1,
                    goals: (currentStats.goals || 0) + (pStats.goals || 0),
                    assists: (currentStats.assists || 0) + (pStats.assists || 0),
                    mvp: isMvp ? (currentStats.mvp || 0) + 1 : (currentStats.mvp || 0)
                };

                const playerRef = doc(db, 'users', String(p.id));
                await updateDoc(playerRef, {
                    stats: newStats,
                    averageRating: newAverage,
                    previousRating: oldRating,
                    lastRatingUpdate: new Date().toISOString()
                });
            }));


            // 4. Reset Next Match
            const nextDate = new Date(currentMatch.date);
            nextDate.setDate(nextDate.getDate() + 7);

            const nextMatchState = {
                ...INITIAL_MATCH_STATE,
                id: `match_${Date.now()}`,
                date: nextDate.toISOString().split('T')[0],
                time: currentMatch.time,
                // location: Inherit from INITIAL_MATCH_STATE (Default)
                status: 'pending_confirmation' // New flow: Pending confirmation by Admin
            };

            const configRef = doc(db, 'system', 'config');
            // Reset config and clear votes
            await updateDoc(configRef, {
                currentMatch: nextMatchState,
                votes: {},
                mvpVotes: {}
            });

            console.log("Match finalized successfully.");

            // Trigger Notification
            await sendNotificationToAll(
                "Resultados Publicados",
                `MVP: ${mvpPlayer ? (mvpPlayer.alias || mvpPlayer.name) : 'N/A'}. Marcador: ${currentMatch.result?.scoreA}-${currentMatch.result?.scoreB}`,
                "success",
                "/"
            );

            alert("Partido finalizado y archivado correctamente.");

        } catch (error) {
            console.error("Error executing finalizeMatch:", error);
            alert(`Error al finalizar partido: ${error.message}`);
        }
    };

    const updateUserStatus = async (uid, newStatus) => {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, { status: newStatus });
    };

    const updateUserRole = async (uid, newRole) => {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, { role: newRole });
    };

    // New: Confirm Match Action
    const confirmMatch = async () => {
        const configRef = doc(db, 'system', 'config');
        await updateDoc(configRef, {
            'currentMatch.status': 'upcoming'
        });
    };

    const completeOnboarding = async (uid) => {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, { hasSeenOnboarding: true });
        // Optimistic update
        setPlayers(prev => prev.map(p => p.id === uid ? { ...p, hasSeenOnboarding: true } : p));
    };

    const deleteUser = async (uid) => {
        const userRef = doc(db, 'users', uid);
        await deleteDoc(userRef);
        setPlayers(prev => prev.filter(p => p.id !== uid));
    };

    const value = {
        players,
        currentMatch,
        currentUser,
        isAdmin,
        votingStatus,
        votes,
        mvpVotes,
        announcement,
        pastMatches,
        notifications,
        setMatchResult,
        finalizeMatch,
        closeVoting,
        castVote,
        castMvpVote,
        getLeaderboard,
        setCurrentMatch,
        updateMatchDetails,
        addGuestPlayer,
        removeGuestPlayer,
        generateTeams,
        clearTeams, // Export
        toggleVoting,
        updatePlayerProfile,
        updatePlayerPhoto,
        setAttendance,
        updatePlayerCard,
        updateUserStatus,
        updateUserRole,
        confirmMatch,
        updateAnnouncement,
        completeOnboarding,
        deleteUser,
        clearDatabase,
        sendNotification,
        markAsRead,
        clearNotifications
    };

    return (
        <StoreContext.Provider value={value}>
            {children}
        </StoreContext.Provider>
    );
};
