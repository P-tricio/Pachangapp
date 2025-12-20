import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import FootballFieldIcon from './ui/FootballFieldIcon';
import NotificationBell from './NotificationBell';
import { useStore } from '../context/StoreContext';
import { ChevronLeft } from 'lucide-react';

const TopBar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { currentUser, getAvatar } = useStore();

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
