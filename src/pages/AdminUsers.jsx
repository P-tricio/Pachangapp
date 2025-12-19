import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import { Search, Shield, Ban, CheckCircle, ChevronLeft, User, Trash2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import clsx from 'clsx';

const AdminUsers = () => {
    const { players, currentUser, updateUserStatus, updateUserRole, deleteUser } = useStore();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    // Redirect if not admin
    React.useEffect(() => {
        if (currentUser && currentUser.role !== 'admin') {
            navigate('/');
        }
    }, [currentUser, navigate]);

    const filteredPlayers = useMemo(() => {
        return players.filter(p =>
            (p.alias || p.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.realName || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [players, searchTerm]);

    const handleToggleStatus = (p) => {
        const newStatus = p.status === 'blocked' ? 'active' : 'blocked';
        if (window.confirm(`¿Seguro que quieres ${newStatus === 'blocked' ? 'BLOQUEAR' : 'ACTIVAR'} a ${p.alias}?`)) {
            updateUserStatus(p.id, newStatus);
        }
    };

    const handleToggleRole = (p) => {
        const newRole = p.role === 'admin' ? 'user' : 'admin';
        if (window.confirm(`¿Seguro que quieres cambiar el rol de ${p.alias} a ${newRole.toUpperCase()}?`)) {
            updateUserRole(p.id, newRole);
        }
    };

    const handleDeleteUser = async (p) => {
        if (window.confirm(`⚠️ PELIGRO ⚠️\n\n¿Estás seguro de que quieres eliminar DEFINITIVAMENTE a ${p.alias || p.name}?\n\nEsta acción no se puede deshacer y perderá todo su historial.`)) {
            await deleteUser(p.id);
        }
    };

    if (!currentUser || currentUser.role !== 'admin') {
        return null; // Don't show anything while redirecting
    }

    return (
        <div className="min-h-screen bg-slate-900 section-padding pb-24">
            <div className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 p-4">
                <div className="flex items-center space-x-4 mb-4">
                    <button onClick={() => navigate('/')} className="p-2 -ml-2 text-slate-400 hover:text-white">
                        <ChevronLeft />
                    </button>
                    <h1 className="text-2xl font-black text-white tracking-tight uppercase">
                        Gestión <span className="text-neon-green">Usuarios</span>
                    </h1>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar jugador..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-800 text-white pl-10 pr-4 py-3 rounded-xl border border-slate-700 focus:border-neon-green focus:outline-none transition-colors"
                    />
                </div>
            </div>

            <div className="p-4 space-y-3">
                {filteredPlayers.map(p => (
                    <Card key={p.id} className={clsx(
                        "p-4 flex items-center justify-between transition-all",
                        p.status === 'blocked' ? "opacity-50 grayscale" : "bg-slate-800"
                    )}>
                        <div className="flex items-center space-x-3">
                            <div className="relative">
                                <img
                                    src={p.photo || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'}
                                    className="w-12 h-12 rounded-full object-cover border-2 border-slate-700"
                                />
                                {p.role === 'admin' && (
                                    <div className="absolute -top-1 -right-1 bg-neon-green text-black rounded-full p-0.5">
                                        <Shield size={10} fill="currentColor" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    {p.alias || p.name}
                                    {p.status === 'blocked' && <span className="text-[10px] bg-red-500 text-white px-1 rounded uppercase">Bloqueado</span>}
                                </h3>
                                <p className="text-xs text-slate-500">{p.realName}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            {/* Toggle Admin */}
                            <button
                                onClick={() => handleToggleRole(p)}
                                disabled={p.id === currentUser?.id}
                                className={clsx(
                                    "p-2 rounded-lg transition-colors",
                                    p.role === 'admin' ? "bg-neon-green/10 text-neon-green" : "bg-slate-700 text-slate-400 hover:text-white"
                                )}
                            >
                                <Shield size={18} />
                            </button>

                            {/* Block/Unblock */}
                            <button
                                onClick={() => handleToggleStatus(p)}
                                disabled={p.id === currentUser?.id}
                                className={clsx(
                                    "p-2 rounded-lg transition-colors",
                                    p.status === 'blocked' ? "bg-red-500/10 text-red-500" : "bg-slate-700 text-slate-400 hover:text-red-400"
                                )}
                            >
                                {p.status === 'blocked' ? <CheckCircle size={18} /> : <Ban size={18} />}
                            </button>

                            {/* Delete User */}
                            <button
                                onClick={() => handleDeleteUser(p)}
                                disabled={p.id === currentUser?.id}
                                className="p-2 rounded-lg bg-slate-700 text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                title="Eliminar usuario"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </Card>
                ))}

                {filteredPlayers.length === 0 && (
                    <div className="text-center py-10 text-slate-500">
                        No se encontraron jugadores.
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminUsers;
