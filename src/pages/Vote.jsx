import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import clsx from 'clsx';
import Confetti from 'react-confetti';

const Vote = () => {
    const { players, castVote, castMvpVote, currentUser, currentMatch, votes, mvpVotes } = useStore();
    const navigate = useNavigate();

    // Exclude current user and guests (if logic requires, but guests ARE in teams so they might be votable now?)
    // User wanted guests to NOT be votable previously? No, user said "todos registrados".
    // But safely: Get all from Teams.

    // Source of Truth: Teams
    const allTeamPlayers = currentMatch.teams
        ? [...(currentMatch.teams.teamA || []), ...(currentMatch.teams.teamB || [])]
        : [];

    // Filter once to get all candidates (except self)
    const allCandidates = allTeamPlayers.filter(p => p.id !== currentUser?.id);

    // Initial state logic to find where we left off
    const [currentIndex, setCurrentIndex] = useState(() => {
        // Find the first player index that hasn't been voted for in this match session
        const firstUnvotedIndex = allCandidates.findIndex(p => !votes?.[currentUser?.id]?.[p.id]);
        return firstUnvotedIndex !== -1 ? firstUnvotedIndex : 0;
    });

    // The current active queue for display purposes (still shows remaining count correctly)
    const votingQueue = allCandidates; // Queue is now the full stable list

    const hasAlreadyFinished = currentUser && currentMatch.status === 'played_pending_votes' && mvpVotes?.[currentUser.id];

    useEffect(() => {
        if (!currentUser || currentMatch.status !== 'played_pending_votes' || hasAlreadyFinished) {
            console.log("Voting not available or already completed. Redirecting...");
            const timer = setTimeout(() => navigate('/'), 100);
            return () => clearTimeout(timer);
        }
    }, [currentUser, currentMatch.status, hasAlreadyFinished, navigate]);

    const [isFinished, setIsFinished] = useState(false);
    const [selectedMVP, setSelectedMVP] = useState(null);
    const [sliderValue, setSliderValue] = useState(6); // Default starting score

    // Reset slider when player changes
    useEffect(() => {
        setSliderValue(6);
    }, [currentIndex]);

    // If all candidates are voted for, we move to MVP
    useEffect(() => {
        const remainingToVote = allCandidates.filter(p => !votes?.[currentUser?.id]?.[p.id]);
        if (remainingToVote.length === 0 && !hasAlreadyFinished && !isFinished) {
            setIsFinished(true);
        }
    }, [allCandidates, votes, currentUser.id, hasAlreadyFinished, isFinished]);

    if (!currentUser || hasAlreadyFinished) {
        return null;
    }

    const currentPlayer = allCandidates[currentIndex];

    // Final safety guard for transition frames
    if (!isFinished && !currentPlayer) {
        return null;
    }

    const handleConfirmVote = () => {
        if (currentPlayer) {
            castVote(currentPlayer.id, sliderValue);
        }

        if (currentIndex < allCandidates.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setIsFinished(true);
        }
    };

    const submitFinalContext = async () => {
        if (selectedMVP) {
            await castMvpVote(selectedMVP);
        }
        navigate('/');
    };

    if (isFinished) {
        return (
            <div className="min-h-screen bg-slate-900 section-padding p-6 flex flex-col justify-center relative overflow-hidden">
                <Confetti numberOfPieces={200} recycle={false} />
                <h1 className="text-3xl font-black text-center text-white mb-8 z-10">ELIJE AL <span className="text-yellow-400">MVP</span></h1>

                <div className="grid grid-cols-2 gap-4 mb-8 z-10">
                    {/* Reuse allTeamPlayers (calculated above or re-calc here if scope issue) */}
                    {(currentMatch.teams ? [...(currentMatch.teams.teamA || []), ...(currentMatch.teams.teamB || [])] : players.filter(p => currentMatch.attendance?.[p.id] === 'confirmed'))
                        .filter(p => p.id !== currentUser?.id)
                        .map(p => (
                            <div
                                key={p.id}
                                onClick={() => setSelectedMVP(p.id)}
                                className={clsx(
                                    "relative bg-slate-800 p-2 rounded-xl border-2 transition-all cursor-pointer",
                                    selectedMVP === p.id ? "border-yellow-400 bg-slate-700" : "border-slate-700 hover:border-slate-500"
                                )}
                            >
                                <img src={p.photo} alt={p.name} className="w-full h-24 object-cover rounded-lg mb-2" />
                                <p className="text-center font-bold text-white text-sm">{p.alias || p.name}</p>
                                {selectedMVP === p.id && (
                                    <div className="absolute top-2 right-2 bg-yellow-400 text-black rounded-full p-1">
                                        <Check size={16} strokeWidth={3} />
                                    </div>
                                )}
                            </div>
                        ))}
                </div>

                <Button onClick={submitFinalContext} disabled={!selectedMVP} variant={selectedMVP ? 'primary' : 'secondary'} className="z-10">
                    CONFIRMAR Y SALIR
                </Button>
            </div>
        );
    }

    return (
        <div className="h-screen bg-slate-900 flex flex-col items-center justify-center p-4 overflow-hidden relative">
            <h2 className="absolute top-10 text-slate-500 text-sm font-bold tracking-widest uppercase">
                JUGADOR {currentIndex + 1} / {votingQueue.length}
            </h2>

            <div className="relative w-full max-w-sm h-full max-h-[650px] flex flex-col justify-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentPlayer.id}
                        initial={{ scale: 0.9, opacity: 0, x: 200 }}
                        animate={{ scale: 1, opacity: 1, x: 0 }}
                        exit={{ scale: 0.9, opacity: 0, x: -200 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="relative w-full aspect-[3/4] mb-4"
                    >
                        <Card className="h-full w-full flex flex-col items-center justify-center p-0 overflow-hidden relative border-2 border-slate-700 shadow-2xl">
                            <img src={currentPlayer.photo} className="absolute inset-0 w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-90" />

                            <div className="absolute bottom-0 w-full p-6 text-center z-10 bg-gradient-to-t from-slate-900 to-transparent pt-20">
                                <h2 className="text-4xl font-black text-white drop-shadow-lg uppercase tracking-wider">{currentPlayer.alias || currentPlayer.name}</h2>
                                <p className="text-slate-300 font-medium text-sm mt-1">¿Cómo ha jugado hoy?</p>
                            </div>
                        </Card>
                    </motion.div>
                </AnimatePresence>

                {/* Slider UI */}
                <div className="mt-2 w-full px-2 z-20">
                    <div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-3xl border border-slate-700 shadow-xl flex flex-col items-center">
                        <div className="w-full flex justify-between items-center mb-4">
                            <span className="text-slate-400 font-bold text-xs uppercase">Mal</span>
                            <div className={clsx("text-6xl font-black transition-colors",
                                sliderValue <= 4 ? "text-red-500" :
                                    sliderValue <= 7 ? "text-yellow-400" : "text-neon-green"
                            )}>
                                {sliderValue}
                            </div>
                            <span className="text-slate-400 font-bold text-xs uppercase">Top</span>
                        </div>

                        <input
                            type="range"
                            min="1"
                            max="10"
                            step="1"
                            value={sliderValue}
                            onChange={(e) => setSliderValue(Number(e.target.value))}
                            className={clsx(
                                "w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer mb-6 transition-colors",
                                sliderValue <= 4 ? "accent-red-500" :
                                    sliderValue <= 7 ? "accent-yellow-400" : "accent-neon-green"
                            )}
                        />

                        <button
                            onClick={handleConfirmVote}
                            className="w-full py-4 bg-white text-slate-900 font-black rounded-xl text-lg hover:bg-slate-200 transition-colors uppercase tracking-wider shadow-lg"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Vote;
