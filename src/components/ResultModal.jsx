import React, { useState, useEffect } from 'react';
import { Minus, Plus } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const ResultModal = ({ isOpen, onClose, initialData, currentMatch, onConfirm }) => {
    const [scoreA, setScoreA] = useState(0);
    const [scoreB, setScoreB] = useState(0);
    const [playerStats, setPlayerStats] = useState({});

    // Initialize state when modal opens or initialData changes
    useEffect(() => {
        if (isOpen) {
            setScoreA(initialData?.result?.scoreA || 0);
            setScoreB(initialData?.result?.scoreB || 0);
            setPlayerStats(initialData?.playerStats || {});
        }
    }, [isOpen, initialData]);

    const handleStatChange = (playerId, type, delta) => {
        setPlayerStats(prev => {
            const currentStats = prev[playerId] || { goals: 0, assists: 0 };
            const currentVal = currentStats[type] || 0;
            const newVal = Math.max(0, currentVal + delta);

            // Only update if value changed
            if (newVal === currentVal) return prev;

            const newStats = {
                ...prev,
                [playerId]: {
                    ...currentStats,
                    [type]: newVal
                }
            };

            // SIDE EFFECT: Update Total Score (Only for GOALS)
            // We do this here, calculated from the NEW stats state?
            // BETTER: Calculate the diff and apply to score.

            if (type === 'goals') {
                const diff = newVal - currentVal;
                // Identify team
                const isTeamA = currentMatch.teams?.teamA?.some(p => p.id === playerId);
                const isTeamB = currentMatch.teams?.teamB?.some(p => p.id === playerId);

                if (isTeamA) setScoreA(s => Math.max(0, s + diff));
                else if (isTeamB) setScoreB(s => Math.max(0, s + diff));
            }

            return newStats;
        });
    };

    // Correct approach to avoid "Double Update" issue in StrictMode:
    // Update both states in a single handler, NOT inside the setter callback.
    const safeUpdateStat = (playerId, type, delta) => {
        const currentStats = playerStats[playerId] || { goals: 0, assists: 0 };
        const currentVal = currentStats[type] || 0;
        const newVal = Math.max(0, currentVal + delta);

        if (newVal === currentVal) return;

        // 1. Update Stats
        setPlayerStats(prev => ({
            ...prev,
            [playerId]: {
                ...currentStats,
                [type]: newVal
            }
        }));

        // 2. Update Score (if goal)
        if (type === 'goals') {
            const diff = newVal - currentVal;
            const isTeamA = currentMatch.teams?.teamA?.some(p => p.id === playerId);
            const isTeamB = currentMatch.teams?.teamB?.some(p => p.id === playerId);

            if (isTeamA) setScoreA(s => Math.max(0, s + diff));
            else if (isTeamB) setScoreB(s => Math.max(0, s + diff));
        }
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl relative flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-800">
                    <h3 className="text-xl font-black text-white uppercase italic text-center">Resultado y Estadísticas</h3>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-8">
                    {/* 1. SCORES */}
                    <div className="flex items-center justify-center space-x-6">
                        <div className="flex flex-col items-center">
                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-2">Equipo A</label>
                            <input
                                type="number"
                                value={scoreA}
                                onChange={e => setScoreA(Number(e.target.value))}
                                className="w-20 h-20 bg-slate-800 border-2 border-slate-700 rounded-2xl text-center text-4xl font-black text-white focus:border-neon-green outline-none"
                            />
                        </div>
                        <span className="text-slate-600 font-black text-2xl">-</span>
                        <div className="flex-col items-center flex">
                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-2">Equipo B</label>
                            <input
                                type="number"
                                value={scoreB}
                                onChange={e => setScoreB(Number(e.target.value))}
                                className="w-20 h-20 bg-slate-800 border-2 border-slate-700 rounded-2xl text-center text-4xl font-black text-white focus:border-neon-green outline-none"
                            />
                        </div>
                    </div>

                    {/* 2. PLAYER STATS */}
                    <div>
                        <h4 className="text-xs font-bold text-neon-green uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">Goleadores y Asistentes</h4>
                        <div className="space-y-6">
                            {['teamA', 'teamB'].map(teamKey => {
                                const teamPlayers = currentMatch.teams?.[teamKey];
                                if (!teamPlayers) return null;

                                return (
                                    <div key={teamKey}>
                                        <h5 className="text-[10px] font-bold text-slate-500 uppercase mb-3">{teamKey === 'teamA' ? 'Equipo A' : 'Equipo B'}</h5>
                                        <div className="space-y-3">
                                            {teamPlayers.map(p => {
                                                const stats = playerStats[p.id] || { goals: 0, assists: 0 };

                                                return (
                                                    <div key={p.id} className="flex items-center justify-between bg-slate-800/50 p-2 rounded-lg">
                                                        <span className="text-sm font-bold text-slate-300 truncate w-24">{p.alias || p.name}</span>

                                                        <div className="flex items-center space-x-4">
                                                            {/* Goals */}
                                                            <div className="flex items-center space-x-1">
                                                                <button onClick={() => safeUpdateStat(p.id, 'goals', -1)} className="w-6 h-6 flex items-center justify-center bg-slate-700 rounded text-slate-400 hover:text-white"><Minus size={12} /></button>
                                                                <span className="w-4 text-center text-sm font-bold text-white">{stats.goals}</span>
                                                                <span className="text-[10px] text-slate-500 font-bold mr-1">G</span>
                                                                <button onClick={() => safeUpdateStat(p.id, 'goals', 1)} className="w-6 h-6 flex items-center justify-center bg-neon-green/20 text-neon-green rounded hover:bg-neon-green hover:text-slate-900"><Plus size={12} /></button>
                                                            </div>

                                                            {/* Assists */}
                                                            <div className="flex items-center space-x-1">
                                                                <button onClick={() => safeUpdateStat(p.id, 'assists', -1)} className="w-6 h-6 flex items-center justify-center bg-slate-700 rounded text-slate-400 hover:text-white"><Minus size={12} /></button>
                                                                <span className="w-4 text-center text-sm font-bold text-white">{stats.assists}</span>
                                                                <span className="text-[10px] text-slate-500 font-bold mr-1">A</span>
                                                                <button onClick={() => safeUpdateStat(p.id, 'assists', 1)} className="w-6 h-6 flex items-center justify-center bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500 hover:text-white"><Plus size={12} /></button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-6 border-t border-slate-800 bg-slate-900 sticky bottom-0 rounded-b-2xl flex space-x-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 bg-slate-800 text-slate-400 font-bold rounded-xl text-xs uppercase hover:bg-slate-700 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => onConfirm(scoreA, scoreB, playerStats)}
                        className="flex-1 py-4 bg-neon-green text-slate-900 font-bold rounded-xl text-xs uppercase shadow-[0_0_20px_rgba(57,255,20,0.4)] hover:shadow-[0_0_30px_rgba(57,255,20,0.6)] transition-shadow"
                    >
                        Confirmar Resultado
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResultModal;
