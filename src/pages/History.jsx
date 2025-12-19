import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import { Calendar, ChevronRight, Clock, MapPin, ChevronDown, User } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import clsx from 'clsx';

const History = () => {
    const { currentMatch, pastMatches } = useStore();
    const [expandedMatchId, setExpandedMatchId] = useState(null);

    const toggleMatch = (id) => {
        setExpandedMatchId(prev => prev === id ? null : id);
    };



    return (
        <div className="pb-4">
            <h1 className="text-3xl font-black text-white mb-6 uppercase tracking-tight">Historial de <span className="text-neon-green">Partidos</span></h1>

            <div className="space-y-4">
                {/* NEXT MATCH CARD */}
                <Link to="/match">
                    <Card className="p-4 mb-6 border-l-4 border-l-neon-green bg-slate-800/80 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 bg-neon-green text-slate-900 text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wider">
                            Próximo
                        </div>

                        <div className="flex items-center space-x-4">
                            {/* Standardized Thumbnail to match other items */}
                            <div className="flex flex-col items-center justify-center bg-slate-900 w-12 h-12 rounded-lg border border-neon-green/50 group-hover:border-neon-green transition-colors">
                                <Calendar size={18} className="text-neon-green" />
                                <span className="text-[10px] font-bold text-slate-300 uppercase leading-none mt-1">
                                    {/* Format: "15 ene" */}
                                    {(() => {
                                        try {
                                            if (!currentMatch?.date) return 'Próx';
                                            const d = new Date(currentMatch.date);
                                            if (isNaN(d.getTime())) return 'Próx';
                                            return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', '');
                                        } catch (e) { return 'Próx'; }
                                    })()}
                                </span>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 text-slate-300 mb-1">
                                    <Clock size={14} className="text-neon-green flex-shrink-0" />
                                    <span className="text-sm font-bold truncate capitalize">
                                        {/* Format: "Miércoles - 15-01-25" */}
                                        {(() => {
                                            try {
                                                if (!currentMatch?.date) return 'Sin fecha';
                                                const d = new Date(currentMatch.date);
                                                if (isNaN(d.getTime())) return 'Sin fecha';
                                                const weekday = d.toLocaleDateString('es-ES', { weekday: 'long' });
                                                const dateParts = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-');
                                                return `${weekday} - ${dateParts} · ${currentMatch.time || '--:--'}`;
                                            } catch (e) { return 'Sin fecha'; }
                                        })()}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2 text-slate-500">
                                    <MapPin size={14} className="flex-shrink-0" />
                                    <span className="text-xs truncate">{currentMatch.location}</span>
                                </div>
                            </div>


                            <ChevronRight className="text-slate-600 group-hover:text-neon-green transition-colors" />
                        </div>
                    </Card>
                </Link>

                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 pl-1">Anteriores</h2>

                {pastMatches.map(match => (
                    <div key={match.id} onClick={() => toggleMatch(match.id)} className="cursor-pointer transition-all">
                        <Card className={clsx(
                            "p-4 border-l-4 transition-all overflow-hidden",
                            expandedMatchId === match.id ? "border-l-neon-green bg-slate-800" : "border-l-transparent hover:bg-slate-800/50"
                        )}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="flex flex-col items-center justify-center bg-slate-900 w-12 h-12 rounded-lg border border-slate-700">
                                        <Calendar size={18} className="text-slate-400" />
                                        <span className="text-[10px] font-bold text-slate-300 uppercase">{match.date}</span>
                                    </div>

                                    <div>
                                        <div className="text-xl font-black text-white tracking-widest">{match.score}</div>
                                        <div className="text-xs text-slate-500">Resultado Final</div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <div className="text-right">
                                        <p className="text-[10px] text-yellow-500 font-bold uppercase">MVP</p>
                                        <p className="text-xs font-bold text-white truncate max-w-[80px] sm:max-w-none">{match.mvp}</p>
                                    </div>
                                    <div className="relative">
                                        <img src={match.mvpPhoto || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'} alt="MVP" className="w-10 h-10 rounded-full border border-yellow-500/50 object-cover" />
                                        {match.mvpRating && (
                                            <div className="absolute -bottom-1 -right-2 bg-yellow-400 text-slate-900 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-slate-900 shadow-sm">
                                                {match.mvpRating}
                                            </div>
                                        )}
                                    </div>
                                    <ChevronDown size={20} className={clsx("text-slate-600 transition-transform duration-300", expandedMatchId === match.id ? "rotate-180 text-neon-green" : "")} />
                                </div>
                            </div>

                            {/* EXPANDED DETAILS */}
                            {expandedMatchId === match.id && (
                                <div className="mt-6 pt-6 border-t border-slate-700 animate-in fade-in slide-in-from-top-2">
                                    {!match.teams ? (
                                        <p className="text-center text-slate-500 text-sm italic">Detalles no disponibles para este partido.</p>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4">
                                            {/* TEAM A */}
                                            <div className="bg-slate-900/50 rounded-xl p-3">
                                                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 text-center">Equipo A</h4>
                                                <div className="space-y-2">
                                                    {match.teams.teamA?.map(p => {
                                                        const stats = match.playerStats?.[p.id];
                                                        return (
                                                            <div key={p.id} className="flex items-center justify-between text-sm text-slate-300">
                                                                <div className="flex items-center space-x-2">
                                                                    <User size={12} className="text-slate-600" />
                                                                    <span>{p.alias || p.name}</span>
                                                                </div>
                                                                <div className="flex space-x-1">
                                                                    {stats?.goals > 0 && <span className="bg-green-500/20 text-green-500 text-[10px] font-bold px-1.5 rounded">{stats.goals}G</span>}
                                                                    {stats?.assists > 0 && <span className="bg-blue-500/20 text-blue-500 text-[10px] font-bold px-1.5 rounded">{stats.assists}A</span>}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* TEAM B */}
                                            <div className="bg-slate-900/50 rounded-xl p-3">
                                                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 text-center">Equipo B</h4>
                                                <div className="space-y-2">
                                                    {match.teams.teamB?.map(p => {
                                                        const stats = match.playerStats?.[p.id];
                                                        return (
                                                            <div key={p.id} className="flex items-center justify-between text-sm text-slate-300">
                                                                <div className="flex items-center space-x-2">
                                                                    <User size={12} className="text-slate-600" />
                                                                    <span>{p.alias || p.name}</span>
                                                                </div>
                                                                <div className="flex space-x-1">
                                                                    {stats?.goals > 0 && <span className="bg-green-500/20 text-green-500 text-[10px] font-bold px-1.5 rounded">{stats.goals}G</span>}
                                                                    {stats?.assists > 0 && <span className="bg-blue-500/20 text-blue-500 text-[10px] font-bold px-1.5 rounded">{stats.assists}A</span>}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default History;
