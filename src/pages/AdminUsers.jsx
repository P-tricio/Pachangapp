import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import { Search, Shield, Ban, CheckCircle, ChevronLeft, Trash2, Settings, Zap } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import clsx from 'clsx';

const AdminUsers = () => {
    const {
        players,
        currentUser,
        updateUserStatus,
        updateUserRole,
        removeUserFromLeague,
        clearDatabase,
        isAdmin,
        currentLeagueData,
        generateInviteCode,
        updateLeagueMetadata
    } = useStore();

    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [leagueName, setLeagueName] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);

    // Initialize state with current data
    useEffect(() => {
        if (currentLeagueData?.metadata?.name) {
            setLeagueName(currentLeagueData.metadata.name);
        }
    }, [currentLeagueData]);

    // Redirect if not admin
    useEffect(() => {
        if (!isAdmin) {
            navigate('/');
        }
    }, [isAdmin, navigate]);

    const filteredPlayers = useMemo(() => {
        return players.filter(p =>
            (p.alias || p.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.realName || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [players, searchTerm]);

    const handleUpdateLeagueName = async () => {
        if (!leagueName.trim()) return;
        try {
            await updateLeagueMetadata({ name: leagueName.trim() });
            setIsEditingName(false);
            alert("Nombre de la liga actualizado correctamente.");
        } catch (error) {
            console.error(error);
            alert("Error al actualizar el nombre.");
        }
    };

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
        if (window.confirm(`¿Seguro que quieres EXPULSAR a ${p.alias || p.name} de esta liga?\n\nSu perfil global se mantendrá intacto, pero perderá sus estadísticas en esta competición.`)) {
            await removeUserFromLeague(p.id);
        }
    };

    if (!isAdmin) {
        return null; // Don't show anything while redirecting
    }

    return (
        <div className="min-h-screen bg-slate-900 section-padding pb-24">
            <div className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 p-4">
                <div className="flex items-center space-x-4 mb-1">
                    <button onClick={() => navigate('/')} className="p-2 -ml-2 text-slate-400 hover:text-white">
                        <ChevronLeft />
                    </button>
                    <h1 className="text-2xl font-black text-white tracking-tight uppercase">
                        Administración <span className="text-neon-green">Liga</span>
                    </h1>
                </div>
                <p className="text-xs text-slate-500 ml-10 mb-4">Configura tu liga y gestiona los participantes.</p>
            </div>

            <div className="p-4 space-y-8">

                {/* 1. SECTION: LEAGUE CONFIG */}
                <section>
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Settings size={14} /> Configuración General
                    </h2>

                    <Card className="bg-slate-800 p-6 space-y-6">
                        {/* League Name */}
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                                Nombre de la Liga
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={leagueName}
                                    onChange={(e) => setLeagueName(e.target.value)}
                                    disabled={!isEditingName}
                                    className={clsx(
                                        "w-full bg-slate-900 border-2 rounded-xl py-3 px-4 font-bold text-white focus:outline-none transition-all",
                                        isEditingName ? "border-neon-green/50 focus:border-neon-green shadow-lg shadow-neon-green/10" : "border-slate-700 text-slate-400"
                                    )}
                                    placeholder="Ej: Liga de los Jueves"
                                />
                                {isEditingName ? (
                                    <Button
                                        size="sm"
                                        onClick={handleUpdateLeagueName}
                                        className="h-full bg-neon-green text-black hover:bg-neon-green/90"
                                    >
                                        Guardar
                                    </Button>
                                ) : (
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => setIsEditingName(true)}
                                        className="h-full"
                                    >
                                        Editar
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="border-t border-slate-700/50"></div>

                        {/* Invite Code */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-white font-bold uppercase text-sm mb-1">Código de Invitación</h3>
                                <p className="text-slate-400 text-xs">Comparte este código para que otros se unan.</p>
                            </div>
                            <div className="text-right">
                                {currentLeagueData?.metadata?.inviteCode ? (
                                    <div className="flex flex-col items-end gap-2">
                                        <div
                                            className="bg-indigo-500/10 border border-indigo-500/50 text-indigo-300 font-mono text-xl px-4 py-2 rounded-lg tracking-widest cursor-pointer hover:bg-indigo-500/20 transition-colors"
                                            onClick={() => {
                                                navigator.clipboard.writeText(currentLeagueData.metadata.inviteCode);
                                                alert("Código copiado al portapapeles");
                                            }}
                                        >
                                            {currentLeagueData.metadata.inviteCode}
                                        </div>
                                        <button
                                            onClick={generateInviteCode}
                                            className="text-[10px] text-slate-500 hover:text-white underline"
                                        >
                                            Regenerar nuevo
                                        </button>
                                    </div>
                                ) : (
                                    <Button size="sm" onClick={generateInviteCode} className="bg-indigo-600 hover:bg-indigo-500 border-none">
                                        Generar Código
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card>
                </section>

                {/* 2. SECTION: USER MANAGEMENT */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Zap size={14} /> Gestión de Jugadores ({filteredPlayers.length})
                        </h2>

                        <div className="relative w-40">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-800 text-white text-xs pl-8 pr-3 py-2 rounded-lg border border-slate-700 focus:border-neon-green focus:outline-none transition-colors"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        {filteredPlayers.map(p => (
                            <Card key={p.id} className={clsx(
                                "p-4 flex items-center justify-between transition-all group hover:bg-slate-800/80",
                                p.status === 'blocked' ? "opacity-50 grayscale" : "bg-slate-800"
                            )}>
                                <div className="flex items-center space-x-3">
                                    <div className="relative">
                                        <img
                                            src={p.photo || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'}
                                            className="w-10 h-10 rounded-full object-cover border-2 border-slate-700"
                                        />
                                        {p.role === 'admin' && (
                                            <div className="absolute -top-1 -right-1 bg-neon-green text-black rounded-full p-0.5">
                                                <Shield size={10} fill="currentColor" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm text-white flex items-center gap-2">
                                            {p.alias || p.name}
                                            {p.status === 'blocked' && <span className="text-[10px] bg-red-500 text-white px-1 rounded uppercase">Bloqueado</span>}
                                        </h3>
                                        <p className="text-[10px] text-slate-500">{p.realName}</p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                    {/* Toggle Admin */}
                                    <button
                                        onClick={() => handleToggleRole(p)}
                                        disabled={p.id === currentUser?.id}
                                        className={clsx(
                                            "p-2 rounded-lg transition-colors",
                                            p.role === 'admin' ? "bg-neon-green/10 text-neon-green" : "bg-slate-700 text-slate-400 hover:text-white"
                                        )}
                                    >
                                        <Shield size={16} />
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
                                        {p.status === 'blocked' ? <CheckCircle size={16} /> : <Ban size={16} />}
                                    </button>

                                    {/* Delete User */}
                                    <button
                                        onClick={() => handleDeleteUser(p)}
                                        disabled={p.id === currentUser?.id}
                                        className="p-2 rounded-lg bg-slate-700 text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                        title="Eliminar usuario"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </Card>
                        ))}

                        {filteredPlayers.length === 0 && (
                            <div className="text-center py-10 text-slate-500 text-sm">
                                No se encontraron jugadores.
                            </div>
                        )}
                    </div>
                </section>


                {/* Nuclear Reset Option */}
                <div className="py-8 border-t border-slate-800 mt-10">
                    <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-xl flex items-center justify-between">
                        <div>
                            <h2 className="text-red-500 font-bold text-sm italic mb-1 flex items-center gap-2"><Trash2 size={16} /> BORRADO DE EMERGENCIA</h2>
                            <p className="text-slate-500 text-[10px]">Reiniciar toda la liga desde cero.</p>
                        </div>
                        <Button
                            size="sm"
                            variant="secondary"
                            className="bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white"
                            onClick={clearDatabase}
                        >
                            REINICIAR
                        </Button>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default AdminUsers;
