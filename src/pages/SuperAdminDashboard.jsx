import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { db } from '../firebase/config';
import { collection, doc, getDocs, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ShieldAlert, Database, Plus, Trash2, ExternalLink, RefreshCw, Users, Ban, CheckCheck, Shield } from 'lucide-react';

const SuperAdminDashboard = () => {
    const { currentUser, userProfile, isSuperAdmin, currentLeagueId, setCurrentLeagueId, players, globalUsers, deleteUser, updateUserStatus, updateUserRole } = useStore();
    // ...
    // ...
    // In Render:
    <section>
        <h2 className="text-xl font-bold text-white flex items-center mb-4">
            <Users className="mr-2 text-purple-400" /> Usuarios Globales ({Object.keys(globalUsers || {}).length})
        </h2>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 max-h-64 overflow-y-auto">
            <table className="w-full text-sm text-left text-slate-400">
                {/* THEAD ... */}
                <tbody>
                    {Object.values(globalUsers || {}).map(p => (
                        <tr key={p.id} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/50">
                            <td className="py-2 px-2 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden">
                                    {p.photo && <img src={p.photo} alt="" className="w-full h-full object-cover" />}
                                </div>
                                <div>
                                    <div className="text-white font-bold">{p.alias || p.name}</div>
                                    <div className="text-xs">{p.email}</div>
                                </div>
                            </td>
                            {/* Role display for global users is tricky because role may be league-dependent. 
                                        globalUsers object in StoreContext (line 170) stores whatever is in 'users' doc.
                                        Usually 'role' in users doc is 'user' or 'superAdmin' (global role).
                                        League roles are in leagues/{id}/members.
                                    */}
                            <td className="py-2 px-2 text-right">
                                <span className={`px-2 py-1 rounded text-xs ${p.role === 'admin' ? 'bg-red-500/10 text-red-500' : 'bg-slate-700 text-slate-300'}`}>
                                    {p.role || 'user'}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </section>
    const [leagues, setLeagues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newLeagueName, setNewLeagueName] = useState("");
    const [showCreate, setShowCreate] = useState(false);

    useEffect(() => {
        fetchLeagues();
    }, []);

    const fetchLeagues = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, 'leagues'));
            const loadedLeagues = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setLeagues(loadedLeagues);
        } catch (error) {
            console.error("Error fetching leagues:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateLeague = async (e) => {
        e.preventDefault();
        if (!newLeagueName.trim()) return;

        const leagueId = newLeagueName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now().toString().slice(-4);

        try {
            await setDoc(doc(db, 'leagues', leagueId), {
                metadata: {
                    name: newLeagueName,
                    createdAt: new Date().toISOString(),
                    createdBy: currentUser?.id || 'admin',
                    inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase()
                }
            });

            // Initialize System Config for the new league
            await setDoc(doc(db, 'leagues', leagueId, 'system', 'config'), {
                currentMatch: {
                    id: `match_${Date.now()}`,
                    date: new Date().toISOString().split('T')[0],
                    time: '20:30',
                    location: 'Campo Nuevo',
                    status: 'upcoming',
                    mvp: null,
                    attendance: {},
                    guestPlayers: [],
                    teams: null
                },
                votes: {},
                mvpVotes: {},
                announcement: { title: "Bienvenido", message: "Nueva liga creada.", type: "info", isVisible: true }
            });

            // Add Creator as Admin Member
            // Fix: Use userProfile (Global) instead of currentUser (League) because SuperAdmin might not be in the current context
            if (userProfile) { // changed from currentUser
                await setDoc(doc(db, 'leagues', leagueId, 'members', userProfile.id), {
                    stats: { mp: 0, goals: 0, assists: 0, mvp: 0 },
                    averageRating: 5.0,
                    role: 'admin', // Creator is admin
                    joinedAt: new Date().toISOString()
                });

                // Update User's myLeagues (assuming we modify StoreContext to use this later)
                // For now, it's just a backend update
                await updateDoc(doc(db, 'users', userProfile.id), {
                    [`leagues.${leagueId}`]: 'admin'
                });
            }

            alert("Liga creada exitosamente");
            setNewLeagueName("");
            setShowCreate(false);
            fetchLeagues();
        } catch (error) {
            console.error("Error creating league:", error);
            alert("Error al crear la liga");
        }
    };

    const switchToLeague = (id) => {
        if (setCurrentLeagueId) {
            setCurrentLeagueId(id);
            alert(`Cambiado contexto a: ${id}`);
        } else {
            alert("El StoreContext no soporta cambio de liga aún (setCurrentLeagueId faltante).");
        }
    };

    const deleteLeague = async (id) => {
        if (!window.confirm(`PELIGRO: ¿Borrar la liga ${id}? Esto no se puede deshacer.`)) return;
        const confirmName = prompt(`Escribe "${id}" para confirmar.`);
        if (confirmName !== id) return;

        try {
            await deleteDoc(doc(db, 'leagues', id));
            // Note: This won't delete subcollections (matches, members) automatically in standard Firestore without a recursive function.
            // For MVP, we just delete the root doc so it disappears from lists.
            alert("Liga eliminada (Documento raíz).");
            fetchLeagues();
        } catch (error) {
            console.error(error);
            alert("Error al eliminar");
        }
    };

    if (!currentUser) return <div className="p-10 text-white">Cargando...</div>;

    // Strict Access Control
    if (!isSuperAdmin) {
        return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-red-500 font-bold">ACCESO DENEGADO</div>;
    }

    // Let's verify imports first.
    // I need to update the destructuring in line 7: const { currentUser, isAdmin, currentLeagueId... }
    // Then use `if (!isSuperAdmin) ...`

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6 pb-24">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-red-500 flex items-center space-x-3">
                        <ShieldAlert size={32} />
                        <span>SUPER ADMIN</span>
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Gestión Global del Sistema</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-400">Liga Actual</p>
                    <p className="font-bold text-neon-green">{currentLeagueId}</p>
                </div>
            </header>

            {/* LEAGUES SECTION */}
            <section className="mb-12">
                <div className="flex justify-between items-end mb-4">
                    <h2 className="text-xl font-bold text-white flex items-center">
                        <Database className="mr-2 text-blue-400" /> Ligas Activas
                    </h2>
                    <button
                        onClick={() => setShowCreate(!showCreate)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center"
                    >
                        <Plus size={16} className="mr-1" /> Nueva Liga
                    </button>
                </div>

                {showCreate && (
                    <form onSubmit={handleCreateLeague} className="bg-slate-900 p-4 rounded-xl border border-blue-500/30 mb-6 animate-fadeIn">
                        <label className="block text-xs text-slate-400 mb-1">Nombre de la nueva liga</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newLeagueName}
                                onChange={e => setNewLeagueName(e.target.value)}
                                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none"
                                placeholder="Ej: Torneo Verano 2025"
                            />
                            <button type="submit" className="bg-blue-600 text-white px-6 rounded-lg font-bold">Crear</button>
                        </div>
                    </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {leagues.map(league => (
                        <div key={league.id} className={`p-4 rounded-xl border ${league.id === currentLeagueId ? 'bg-blue-900/10 border-blue-500' : 'bg-slate-900 border-slate-800'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg text-white">{league.metadata?.name || league.id}</h3>
                                {league.id === currentLeagueId && (
                                    <span className="bg-blue-500 text-xs px-2 py-0.5 rounded text-white font-bold">ACTIVA</span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 mb-4 font-mono">ID: {league.id}</p>

                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={() => switchToLeague(league.id)}
                                    disabled={league.id === currentLeagueId}
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-xs py-2 rounded-lg flex items-center justify-center"
                                >
                                    <ExternalLink size={14} className="mr-1" /> Entrar
                                </button>
                                <button
                                    onClick={() => deleteLeague(league.id)}
                                    className="px-3 bg-red-900/20 hover:bg-red-900/40 text-red-500 rounded-lg flex items-center justify-center"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* USERS PREVIEW */}
            <section>
                <h2 className="text-xl font-bold text-white flex items-center mb-4">
                    <Users className="mr-2 text-purple-400" /> Usuarios Globales ({Object.keys(globalUsers || {}).length})
                </h2>
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 max-h-96 overflow-y-auto">
                    <table className="w-full text-sm text-left text-slate-400">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-950/50">
                            <tr>
                                <th className="px-2 py-2">Usuario</th>
                                <th className="px-2 py-2 text-center">Estado</th>
                                <th className="px-2 py-2 text-center">Rol Global</th>
                                <th className="px-2 py-2 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.values(globalUsers || {}).map(p => (
                                <tr key={p.id} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/50 transition-colors">
                                    <td className="py-3 px-2 flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full overflow-hidden border-2 ${p.status === 'blocked' ? 'border-red-500 grayscale' : 'border-slate-700'}`}>
                                            {p.photo ? <img src={p.photo} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-800 flex items-center justify-center text-xs font-bold">{p.alias?.[0]}</div>}
                                        </div>
                                        <div>
                                            <div className="text-white font-bold flex items-center gap-2">
                                                {p.alias || p.name}
                                                {p.id === currentUser?.id && <span className="text-[10px] bg-neon-green/10 text-neon-green px-1.5 py-0.5 rounded border border-neon-green/20">TÚ</span>}
                                            </div>
                                            <div className="text-xs font-mono opacity-50">{p.email}</div>
                                        </div>
                                    </td>

                                    <td className="py-3 px-2 text-center">
                                        <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold ${p.status === 'blocked' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                            {p.status || 'Active'}
                                        </span>
                                    </td>

                                    <td className="py-3 px-2 text-center">
                                        <span className={`px-2 py-1 rounded text-xs ${p.role === 'admin' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-slate-700 text-slate-300'}`}>
                                            {p.role || 'user'}
                                        </span>
                                    </td>

                                    <td className="py-3 px-2 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {/* ROLE TOGGLE */}
                                            <button
                                                onClick={() => {
                                                    const newRole = p.role === 'admin' ? 'user' : 'admin';
                                                    if (window.confirm(`¿Cambiar rol de ${p.alias} a ${newRole}?`)) {
                                                        updateUserRole(p.id, newRole);
                                                    }
                                                }}
                                                title="Cambiar Rol (User/Admin)"
                                                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                                            >
                                                <Shield size={16} className={p.role === 'admin' ? 'text-red-500' : ''} />
                                            </button>

                                            {/* STATUS TOGGLE */}
                                            <button
                                                onClick={() => {
                                                    const newStatus = p.status === 'blocked' ? 'active' : 'blocked';
                                                    updateUserStatus(p.id, newStatus);
                                                }}
                                                title={p.status === 'blocked' ? "Desbloquear" : "Bloquear"}
                                                className={`p-2 hover:bg-slate-700 rounded-lg transition-colors ${p.status === 'blocked' ? 'text-green-500 hover:text-green-400' : 'text-orange-500 hover:text-orange-400'}`}
                                            >
                                                {p.status === 'blocked' ? <CheckCheck size={16} /> : <Ban size={16} />}
                                            </button>

                                            {/* DELETE */}
                                            <button
                                                onClick={() => {
                                                    const confirm1 = window.confirm(`¿ELIMINAR USUARIO ${p.alias}?\nEsta acción borrará su perfil global permanentemente.`);
                                                    if (confirm1) {
                                                        const confirm2 = window.confirm("¿Seguro? No se puede deshacer.");
                                                        if (confirm2) deleteUser(p.id);
                                                    }
                                                }}
                                                title="Eliminar Usuario"
                                                className="p-2 hover:bg-red-900/30 rounded-lg text-slate-600 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default SuperAdminDashboard;
