import React from 'react';
import { useStore } from '../context/StoreContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, ArrowUp, ArrowDown, Minus } from 'lucide-react';


import clsx from 'clsx';

const Rankings = () => {
    const { getLeaderboard } = useStore();
    const sortedPlayers = getLeaderboard;

    const top3 = sortedPlayers.slice(0, 3);
    const rest = sortedPlayers.slice(3);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="pb-24 min-h-screen bg-slate-900 px-4 pt-10">
            <h1 className="text-3xl font-black text-white mb-12 uppercase tracking-tight text-center">Clasificación <span className="text-neon-green">GENERAL</span></h1>

            {/* PODIUM SECTION */}
            <div className="flex justify-center items-end mt-16 mb-12 space-x-2 sm:space-x-4">
                {/* 2nd Place */}
                {top3[1] && <PodiumStep player={top3[1]} rank={2} delay={0.2} />}

                {/* 1st Place */}
                {top3[0] && <PodiumStep player={top3[0]} rank={1} delay={0} />}

                {/* 3rd Place */}
                {top3[2] && <PodiumStep player={top3[2]} rank={3} delay={0.4} />}
            </div>

            {/* LIST SECTION */}
            <div className="flex items-center space-x-4 mb-4 mt-8 px-4 opacity-50">
                <div className="h-px bg-slate-700 flex-1"></div>
                <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Listado Completo</span>
                <div className="h-px bg-slate-700 flex-1"></div>
            </div>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-1.5"
            >
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 mb-2 opacity-70">
                    <div className="col-span-1 text-center">#</div>
                    <div className="col-span-5 pl-2">Jugador</div>
                    <div className="col-span-1 text-center">PJ</div>
                    <div className="col-span-2 text-center">Med</div>
                    <div className="col-span-3 text-right pr-2">G / A</div>
                </div>

                {sortedPlayers.map((p, index) => (
                    <motion.div key={`rank-row-${p.id}`} variants={item}>
                        <Link to={`/profile/${p.id}`} className="block group">
                            <div className={clsx(
                                "grid grid-cols-12 gap-2 w-full items-center bg-slate-800/40 p-2 rounded-lg border border-white/5 hover:bg-slate-800 transition-all active:scale-95 relative overflow-hidden backdrop-blur-sm",
                                index === 0 ? "border-l-2 border-l-yellow-400 bg-yellow-900/10" :
                                    index === 1 ? "border-l-2 border-l-slate-300 bg-slate-800/60" :
                                        index === 2 ? "border-l-2 border-l-orange-500 bg-orange-900/10" : "hover:border-neon-green/30"
                            )}>
                                <div className={clsx("col-span-1 font-mono font-bold text-center text-xs", index < 3 ? "text-white" : "text-slate-600")}>
                                    {index + 1}
                                </div>

                                <div className="col-span-5 flex items-center space-x-3 pl-2">
                                    <div className="relative">
                                        <img src={p.photo} alt={p.name} className="w-8 h-8 rounded-full object-cover ring-2 ring-white/5" />
                                        {index < 3 && <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-neon-green border border-slate-900"></div>}
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="font-bold text-white text-xs leading-tight truncate">{p.alias || p.name}</p>
                                        <p className="text-[9px] text-slate-500 font-medium uppercase tracking-wider">{p.realName || p.name}</p>
                                    </div>
                                </div>

                                <div className="col-span-1 flex justify-center">
                                    <span className="font-mono font-bold text-slate-400 text-[10px] bg-slate-950/80 px-1.5 py-0.5 rounded border border-white/5">{p.stats.mp}</span>
                                </div>

                                <div className="col-span-2 flex justify-center">
                                    <div className="bg-slate-950/50 rounded py-0.5 px-2 border border-white/5 min-w-[32px] text-center">
                                        <span className={clsx("font-black text-xs",
                                            p.average >= 8 ? "text-neon-green/90" :
                                                p.average >= 6 ? "text-yellow-400/90" : "text-red-400/90"
                                        )}>{p.average}</span>
                                    </div>

                                    {/* Trend Indicator */}
                                    {(() => {
                                        const prev = p.previousRating ?? p.average;
                                        const diff = (parseFloat(p.average) - parseFloat(prev)).toFixed(1);
                                        const isUp = diff > 0;
                                        const isDown = diff < 0;

                                        if (!isUp && !isDown) return null;

                                        return (
                                            <div className={clsx("flex items-center ml-1", isUp ? "text-neon-green" : "text-red-500")}>
                                                {isUp ? <ArrowUp size={10} strokeWidth={3} /> : <ArrowDown size={10} strokeWidth={3} />}
                                                <span className="text-[9px] font-bold">{Math.abs(diff)}</span>
                                            </div>
                                        );
                                    })()}
                                </div>

                                <div className="col-span-3 text-right text-xs font-mono flex justify-end items-center space-x-1.5 pr-2">
                                    <div className="flex flex-col items-center leading-none">
                                        <span className="text-[9px] text-slate-600 font-bold mb-0.5">G</span>
                                        <span className="text-neon-green font-black text-sm">{p.stats.goals}</span>
                                    </div>
                                    <div className="h-6 w-px bg-slate-800 mx-1"></div>
                                    <div className="flex flex-col items-center leading-none">
                                        <span className="text-[9px] text-slate-600 font-bold mb-0.5">A</span>
                                        <span className="text-blue-400 font-bold text-sm">{p.stats.assists}</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
};

const PodiumStep = ({ player, rank, delay }) => {
    const isFirst = rank === 1;
    const height = isFirst ? 'h-44' : rank === 2 ? 'h-32' : 'h-24';

    // Premium Color Configs
    const configs = {
        1: {
            stepGradient: "from-yellow-500/30 to-yellow-600/10",
            stepBorder: "border-yellow-500/50",
            textGlow: "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]",
            rankBox: "bg-yellow-400 text-black shadow-[0_0_15px_rgba(250,204,21,0.6)]",
            avatarBorder: "border-yellow-400/60 shadow-[0_0_20px_rgba(250,204,21,0.3)]",
            trophyOpacity: "opacity-20 text-yellow-500"
        },
        2: {
            stepGradient: "from-slate-300/20 to-slate-400/5",
            stepBorder: "border-slate-300/30",
            textGlow: "text-slate-300",
            rankBox: "bg-slate-300 text-slate-900 shadow-[0_0_10px_rgba(203,213,225,0.4)]",
            avatarBorder: "border-slate-300/40",
            trophyOpacity: "opacity-10 text-slate-300"
        },
        3: {
            stepGradient: "from-orange-500/20 to-orange-600/5",
            stepBorder: "border-orange-500/30",
            textGlow: "text-orange-400",
            rankBox: "bg-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.4)]",
            avatarBorder: "border-orange-500/40",
            trophyOpacity: "opacity-10 text-orange-500"
        }
    };

    const config = configs[rank];

    return (
        <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay, type: "spring", stiffness: 150, damping: 15 }}
            className="flex flex-col items-center w-1/3 max-w-[120px] relative"
        >
            <Link to={`/profile/${player.id}`} className="flex flex-col items-center group w-full">
                <div className="relative mb-3 z-10">
                    <div className={clsx("rounded-full p-1 border-2 transition-all duration-300 group-hover:scale-110", config.avatarBorder)}>
                        <img src={player.photo} alt={player.name} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover" />
                    </div>
                    <div className={clsx("absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center font-black text-xs border border-slate-900 z-20", config.rankBox)}>
                        {rank}
                    </div>
                </div>

                <div className="text-center mb-3 min-h-[40px]">
                    <p className="font-black text-white text-xs sm:text-sm uppercase truncate max-w-full leading-tight">{player.alias}</p>
                    <p className={clsx("font-extrabold text-[10px] sm:text-xs", config.textGlow)}>{player.average} PTS</p>
                </div>

                <div className={clsx(
                    "w-full rounded-t-2xl border-x border-t transition-all duration-500 backdrop-blur-md bg-gradient-to-t relative overflow-hidden",
                    config.stepGradient,
                    config.stepBorder,
                    height
                )}>
                    {/* Glossy Reflection */}
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>

                    <div className="w-full h-full flex flex-col items-center justify-center pt-2">
                        <div className={clsx("transition-transform duration-700 group-hover:scale-125 mb-4", config.trophyOpacity)}>
                            <Trophy size={isFirst ? 48 : 32} />
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

export default Rankings;
