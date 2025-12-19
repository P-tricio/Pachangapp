import React from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { Home, Trophy, Calendar, User } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import clsx from 'clsx';
import { motion } from 'framer-motion';

const SoccerBallIcon = ({ size = 24, className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        {/* Simple geometric approximation of a ball (Hex/Pentagon style is hard, using Dribbble style for now or simple lines) */}
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
    </svg>
);

const MainLayout = () => {
    const { currentMatch, votingStatus } = useStore();
    const isVotingOpen = votingStatus === 'open';

    return (
        <div className="flex flex-col min-h-screen bg-slate-900 text-slate-100 font-sans pb-20">
            {/* Main Content Area */}
            <main className="flex-grow p-4 overflow-y-auto w-full max-w-md mx-auto">
                <Outlet />
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50">
                <div className="relative flex items-center h-16 px-2 max-w-md mx-auto">
                    {/* Conditional Layout: 5 Columns (Voting Open) vs 4 Columns (Voting Closed) */}

                    {isVotingOpen ? (
                        <>
                            {/* Left Group */}
                            <div className="flex flex-1 justify-around">
                                <NavItem to="/" icon={<Home size={24} />} label="Inicio" />
                                <NavItem to="/rankings" icon={<Trophy size={24} />} label="Ranking" />
                            </div>

                            {/* Central Floating Button */}
                            <div className="w-20 flex justify-center -mt-8 relative z-10">
                                <Link to="/vote">
                                    <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="w-16 h-16 bg-neon-green rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(57,255,20,0.5)] border-4 border-slate-950"
                                    >
                                        <SoccerBallIcon size={32} className="text-slate-950" />
                                    </motion.div>
                                </Link>
                            </div>

                            {/* Right Group */}
                            <div className="flex flex-1 justify-around">
                                <NavItem to="/history" icon={<Calendar size={24} />} label="Partidos" />
                                <NavItem to="/profile" icon={<User size={24} />} label="Perfil" />
                            </div>
                        </>
                    ) : (
                        /* Uniform 4-item grid when voting is closed */
                        <div className="grid grid-cols-4 w-full h-full">
                            <NavItem to="/" icon={<Home size={24} />} label="Inicio" />
                            <NavItem to="/rankings" icon={<Trophy size={24} />} label="Ranking" />
                            <NavItem to="/history" icon={<Calendar size={24} />} label="Partidos" />
                            <NavItem to="/profile" icon={<User size={24} />} label="Perfil" />
                        </div>
                    )}
                </div>
            </nav>
        </div>
    );
};

const NavItem = ({ to, icon, label }) => {
    return (
        <NavLink
            to={to}
            className={({ isActive }) => clsx(
                "flex flex-col items-center justify-center w-full h-full transition-colors duration-200 tap-highlight-transparent",
                isActive ? "text-neon-green" : "text-slate-500 hover:text-slate-300"
            )}
        >
            <div className="mb-1">{icon}</div>
            <span className="text-[10px] font-medium tracking-wide uppercase">{label}</span>
        </NavLink>
    );
};

export default MainLayout;
