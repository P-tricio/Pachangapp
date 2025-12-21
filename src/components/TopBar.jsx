import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import clsx from 'clsx';
import FootballFieldIcon from './ui/FootballFieldIcon';
import NotificationBell from './NotificationBell';
import { useStore } from '../context/StoreContext';
import { ChevronLeft } from 'lucide-react';

const TopBar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { currentUser, getAvatar, myLeagues, currentLeagueId, setCurrentLeagueId, isSuperAdmin, currentLeagueData } = useStore();
    const [isOpen, setIsOpen] = React.useState(false);

    const handleLeagueChange = (e) => {
        const newId = e.target.value;
        if (newId !== currentLeagueId && setCurrentLeagueId) {
            setCurrentLeagueId(newId);
            // Optionally redirect to home or match to avoid 404s on sub-resources
            navigate('/');
        }
    };

    // Helper to determine what to show based on route
    const getHeaderConfig = () => {
        const path = location.pathname;

        if (path === '/') {
            return {
                type: 'brand',
                content: (
                    <div className="flex items-center space-x-3">
                        <FootballFieldIcon className="w-8 h-12" />
                        <div>
                            <h1 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">
                                Pachang<span className="text-neon-green">App</span>
                            </h1>
                            <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Fútbol Amateur</p>
                        </div>
                    </div>
                )
            };
        }

        if (path.startsWith('/profile')) {
            // Let Profile handle its own title if needed, or globalize it.
            // Requirement: "Eliminar headers individuales... unificar".
            // So we should show "MI PERFIL" or "FICHA DE JUGADOR".
            // We can check if it's viewing self or other.
            // But TopBar is outside the Profile content.
            // Let's keep it simple: "PERFIL".
            return { type: 'back', title: 'Perfil' };
        }



        switch (path) {
            case '/': return { type: 'brand' };
            case '/rankings': return { type: 'back', title: 'Clasificación' };
            case '/history': return { type: 'back', title: 'Historial' };
            case '/vote': return { type: 'back', title: 'Votar MVP' };
            case '/match': return { type: 'back', title: 'Detalles del Partido' };
            default: return { type: 'back', title: 'PachangApp' };
        }
    };

    const config = getHeaderConfig();

    return (
        <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-white/5 px-4 h-16 flex items-center justify-between transition-all duration-300">
            {/* LEFT SECTION */}
            <div className="flex items-center">
                {config.type === 'brand' ? (
                    config.content || (
                        <div className="flex items-center space-x-3">
                            <FootballFieldIcon className="w-6 h-9" />
                            <div>
                                <h1 className="text-lg font-black text-white italic tracking-tighter uppercase leading-none">
                                    Pachang<span className="text-neon-green">App</span>
                                </h1>
                            </div>
                        </div>
                    )
                ) : config.type === 'back' ? (
                    <button onClick={() => navigate(-1)} className="flex items-center text-slate-200 hover:text-white -ml-2 p-2">
                        <ChevronLeft size={24} />
                        <span className="text-lg font-bold uppercase ml-1">{config.title}</span>
                    </button>
                ) : (
                    // Type 'main' or fallback
                    <h1 className="text-xl font-black text-white uppercase tracking-tight">{config.title}</h1>
                )}
            </div>

            {/* RIGHT SECTION: Notifications + Avatar */}
            <div className="flex items-center space-x-3">

                {/* League Selector */}
                {/* League Selector - Always visible to allow Joining */}
                <div className="relative mr-2">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="group flex items-center space-x-1.5 bg-slate-800/50 hover:bg-slate-800 text-white font-bold py-1 px-2 rounded-full border border-slate-700/50 hover:border-neon-green/50 transition-all duration-300 outline-none"
                    >
                        <div className={clsx("w-1.5 h-1.5 rounded-full animate-pulse", myLeagues?.length > 0 ? "bg-neon-green/80" : "bg-red-500")}></div>
                        <span className="max-w-[60px] sm:max-w-[100px] truncate uppercase tracking-wider text-[9px] text-slate-300 group-hover:text-white transition-colors">
                            {currentLeagueData?.metadata?.name ||
                                (myLeagues?.length > 0 ? (myLeagues.find(l => l.id === currentLeagueId)?.name || currentLeagueId) : "SIN LIGA")
                            }
                        </span>
                        <span className="text-slate-500 group-hover:text-neon-green transition-colors text-[8px] transform group-hover:rotate-180 duration-300">▼</span>
                    </button>

                    {isOpen && (
                        <div
                            className="absolute right-0 mt-3 w-56 rounded-xl shadow-2xl bg-slate-900 ring-1 ring-slate-700 focus:outline-none z-50 overflow-hidden transform origin-top-right animate-in fade-in zoom-in-95 duration-200"
                        >
                            <div className="py-2">
                                <div className="px-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800/50 mb-1">
                                    Mis Ligas
                                </div>

                                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                    {/* Fallback for Default removed - only show if actually joined */}
                                    {/* if needed, we can show it ONLY for SuperAdmin */}
                                    {isSuperAdmin && !myLeagues?.find(l => l.id === 'default') && (
                                        <button
                                            onClick={() => {
                                                setCurrentLeagueId('default');
                                                setIsOpen(false);
                                                navigate('/');
                                            }}
                                            className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/50 flex items-center justify-between group transition-colors"
                                        >
                                            <span>Liga Principal (Admin)</span>
                                            {currentLeagueId === 'default' && <div className="w-1.5 h-1.5 rounded-full bg-neon-green"></div>}
                                        </button>
                                    )}

                                    {myLeagues.map(l => (
                                        <button
                                            key={l.id}
                                            onClick={() => {
                                                setCurrentLeagueId(l.id);
                                                setIsOpen(false);
                                                navigate('/');
                                            }}
                                            className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/50 flex items-center justify-between group transition-colors"
                                        >
                                            <span className="truncate pr-2">
                                                {l.id === currentLeagueId && currentLeagueData?.metadata?.name
                                                    ? currentLeagueData.metadata.name
                                                    : (l.id === 'default' ? 'Liga Principal' : (l.name || l.id))
                                                }
                                            </span>
                                            {currentLeagueId === l.id && <div className="w-1.5 h-1.5 rounded-full bg-neon-green"></div>}
                                        </button>
                                    ))}
                                </div>

                                <div className="my-1 border-t border-slate-800"></div>

                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        navigate('/join-league');
                                    }}
                                    className="w-full text-left px-4 py-3 text-xs font-bold text-neon-green hover:bg-neon-green/10 flex items-center gap-3 transition-colors"
                                >
                                    <div className="w-5 h-5 rounded-full bg-neon-green/20 flex items-center justify-center text-neon-green text-[10px]">+</div>
                                    <span className="uppercase tracking-wide">Unirse a otra liga</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>


                <NotificationBell />

                {currentUser && (
                    <Link to={`/profile/${currentUser.id}`} id="tour-profile" className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-700 overflow-hidden ml-1">
                        <img
                            src={currentUser.photo}
                            alt="Me"
                            className="w-full h-full object-cover"
                        />
                    </Link>
                )}
            </div>
        </header>
    );
};

export default TopBar;
