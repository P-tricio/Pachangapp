import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { X, ChevronLeft, ChevronRight, Save, User } from 'lucide-react';
import clsx from 'clsx';
import ReactDOM from 'react-dom';

const EditTeamsModal = ({ isOpen, onClose, currentMatch }) => {
    const { updateMatchTeams, players } = useStore();
    const [teamA, setTeamA] = useState([]);
    const [teamB, setTeamB] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && currentMatch?.teams) {
            setTeamA(currentMatch.teams.teamA || []);
            setTeamB(currentMatch.teams.teamB || []);
        }
    }, [isOpen, currentMatch]);

    if (!isOpen) return null;

    const moveToB = (player) => {
        setTeamA(prev => prev.filter(p => p.id !== player.id));
        setTeamB(prev => [...prev, player]);
    };

    const moveToA = (player) => {
        setTeamB(prev => prev.filter(p => p.id !== player.id));
        setTeamA(prev => [...prev, player]);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateMatchTeams({ teamA, teamB });
            onClose();
        } catch (error) {
            console.error("Error saving teams:", error);
            alert("Error al guardar los equipos.");
        } finally {
            setLoading(false);
        }
    };

    // Calculate Dynamic Averages
    const getAvg = (team) => {
        const counted = team.filter(p => !p.isGuest && p.averageRating);
        if (!counted.length) return "0.0";
        return (counted.reduce((acc, p) => acc + p.averageRating, 0) / counted.length).toFixed(1);
    };

    const avgA = getAvg(teamA);
    const avgB = getAvg(teamB);

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center shrink-0">
                    <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                        <span>Editar Equipos</span>
                        <span className="text-xs bg-neon-green/10 text-neon-green px-2 py-0.5 rounded border border-neon-green/20">Manual</span>
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 grid md:grid-cols-2 gap-4 md:gap-8">

                    {/* Team A */}
                    <div className="flex flex-col h-full bg-slate-800/30 rounded-xl border border-slate-700/50 p-4">
                        <div className="flex justify-between items-end mb-4 pb-2 border-b border-white/5">
                            <h3 className="font-black text-white italic uppercase text-lg">Equipo A</h3>
                            <span className="text-sm font-mono text-neon-green bg-neon-green/5 px-2 py-1 rounded border border-neon-green/20">
                                ⭐ {avgA}
                            </span>
                        </div>
                        <div className="space-y-2 flex-1 overflow-y-auto min-h-[300px]">
                            {teamA.map(p => (
                                <div key={p.id} className="bg-slate-800 border border-slate-700 p-2 rounded-lg flex items-center justify-between group hover:border-slate-500 transition-colors">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden">
                                            {p.photo ? (
                                                <img src={p.photo} alt={p.alias} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-xs">
                                                    {p.alias?.substring(0, 2)}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-white">{p.alias}</p>
                                            {!p.isGuest && <p className="text-[10px] text-slate-400">Media: {p.averageRating?.toFixed(1) || '-'}</p>}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => moveToB(p)}
                                        className="p-2 bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white rounded-lg transition-colors"
                                        title="Mover al Equipo B"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            ))}
                            {teamA.length === 0 && (
                                <div className="text-center py-10 opacity-30 text-sm">Sin jugadores</div>
                            )}
                        </div>
                    </div>

                    {/* Team B */}
                    <div className="flex flex-col h-full bg-slate-800/30 rounded-xl border border-slate-700/50 p-4">
                        <div className="flex justify-between items-end mb-4 pb-2 border-b border-white/5">
                            <h3 className="font-black text-white italic uppercase text-lg text-neon-green">Equipo B</h3>
                            <span className="text-sm font-mono text-neon-green bg-neon-green/5 px-2 py-1 rounded border border-neon-green/20">
                                ⭐ {avgB}
                            </span>
                        </div>
                        <div className="space-y-2 flex-1 overflow-y-auto min-h-[300px]">
                            {teamB.map(p => (
                                <div key={p.id} className="bg-slate-800 border border-slate-700 p-2 rounded-lg flex items-center justify-between group hover:border-slate-500 transition-colors">
                                    <button
                                        onClick={() => moveToA(p)}
                                        className="p-2 bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white rounded-lg transition-colors"
                                        title="Mover al Equipo A"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <div className="flex items-center space-x-3 justify-end text-right">
                                        <div>
                                            <p className="font-bold text-sm text-white">{p.alias}</p>
                                            {!p.isGuest && <p className="text-[10px] text-slate-400">Media: {p.averageRating?.toFixed(1) || '-'}</p>}
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden">
                                            {p.photo ? (
                                                <img src={p.photo} alt={p.alias} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-xs">
                                                    {p.alias?.substring(0, 2)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {teamB.length === 0 && (
                                <div className="text-center py-10 opacity-30 text-sm">Sin jugadores</div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700 bg-slate-800 flex justify-end shrink-0 gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-400 hover:text-white font-bold text-sm transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-neon-green text-slate-900 px-6 py-2 rounded-lg font-black uppercase text-sm hover:opacity-90 transition-opacity flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span>Guardando...</span>
                        ) : (
                            <>
                                <Save size={18} />
                                <span>Guardar Cambios</span>
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>,
        document.body
    );
};

export default EditTeamsModal;
