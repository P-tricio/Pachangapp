import React from 'react';
import { useStore } from '../context/StoreContext';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

import { Calendar, Crown, ArrowRight, Clock, ChevronRight, Shield, ToggleLeft, ToggleRight, Scale, Minus, Plus, User, CheckCircle, Megaphone, AlertCircle, Info, AlertTriangle, Trophy } from 'lucide-react';
import ResultModal from '../components/ResultModal';
import AnnouncementModal from '../components/AnnouncementModal';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import FootballFieldIcon from '../components/ui/FootballFieldIcon';
import OnboardingTour from '../components/OnboardingTour';

// Import local avatars
import avatarStriker from '../assets/avatars/avatar_striker.png';
import avatarMidfielder from '../assets/avatars/avatar_midfielder.png';
import avatarDefender from '../assets/avatars/avatar_defender.png';
import avatarStreet from '../assets/avatars/avatar_street.png';

const AVATARS = [avatarStriker, avatarMidfielder, avatarDefender, avatarStreet];

const getAvatar = (user) => {
    if (user?.photo) return user.photo;
    if (!user) return AVATARS[0];

    // Deterministic selection based on CharCode sum of ID
    const charCodeSum = user.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return AVATARS[charCodeSum % AVATARS.length];
};

const Home = () => {

    const [isEditingMatch, setIsEditingMatch] = React.useState(false);
    const [isResultModalOpen, setIsResultModalOpen] = React.useState(false);
    const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = React.useState(false);

    const { currentMatch, players, isAdmin, closeVoting, finalizeMatch, updateMatchDetails, currentUser, pastMatches, setMatchResult, confirmMatch, announcement, updateAnnouncement, completeOnboarding } = useStore();
    const navigate = useNavigate();


    // useMemo to prevent re-creation on every render which might mess up effects
    const steps = React.useMemo(() => [
        {
            targetId: 'tour-profile',
            title: 'TU PERFIL DE JUGADOR',
            content: 'Aquí puedes ver tus estadísticas acumuladas, gestionar tu cuenta y personalizar tu foto.'
        },
        {
            targetId: 'tour-next-match',
            title: 'PRÓXIMO PARTIDO',
            content: 'La tarjeta más importante. Consulta cuándo y dónde se juega, y pulsa para confirmar tu asistencia.'
        },
        {
            targetId: 'tour-mvp',
            title: 'MVP DE LA SEMANA',
            content: 'El rey de la jornada anterior. ¡Juega bien, marca goles y recibe votos para aparecer aquí!'
        },
        {
            targetId: 'tour-ranking',
            title: 'CLASIFICACIÓN GENERAL',
            content: 'Consulta el ranking en el menú para ver quién va líder. ¡Los puntos se ganan jugando, marcando, asistiendo y siendo MVP!'
        }
    ], []);

    const showOnboarding = currentUser && !isAdmin && !currentUser.hasSeenOnboarding;

    // Local state for match editing
    const [matchForm, setMatchForm] = React.useState({
        date: currentMatch.date,
        time: currentMatch.time,
        location: currentMatch.location
    });

    const handleSaveMatch = () => {
        updateMatchDetails(matchForm);
        setIsEditingMatch(false);
    };

    // Dynamic MVP: Get from last match WITH an MVP
    const mvpMatch = pastMatches.find(m => m.mvpId || (m.mvp && m.mvp !== 'Por Votación'));
    const lastMVP = mvpMatch ? players.find(p => p.id === mvpMatch.mvpId || p.alias === mvpMatch.mvp) : null;

    // Get stats from that specific match
    const mvpMatchStats = (mvpMatch && mvpMatch.playerStats && lastMVP)
        ? mvpMatch.playerStats[lastMVP.id]
        : { goals: 0, assists: 0 };

    return (
        <div className="space-y-6 pt-2 relative">
            <OnboardingTour
                isOpen={showOnboarding}
                steps={steps}
                onComplete={() => completeOnboarding(currentUser.id)}
            />

            {/* Edit Match Modal */}
            {isEditingMatch && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <Card className="w-full max-w-sm bg-slate-900 border-neon-green/30">
                        <h3 className="text-xl font-black text-white mb-4 uppercase italic">Editar Partido</h3>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase">Fecha</label>
                                <input
                                    type="date"
                                    value={matchForm.date}
                                    onChange={e => setMatchForm({ ...matchForm, date: e.target.value })}
                                    className="w-full bg-slate-800 border-slate-700 text-white rounded-lg p-3 mt-1 focus:border-neon-green focus:outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">Hora</label>
                                    <input
                                        type="time"
                                        value={matchForm.time}
                                        onChange={e => setMatchForm({ ...matchForm, time: e.target.value })}
                                        className="w-full bg-slate-800 border-slate-700 text-white rounded-lg p-3 mt-1 focus:border-neon-green focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase">Ubicación</label>
                                    <input
                                        type="text"
                                        value={matchForm.location}
                                        onChange={e => setMatchForm({ ...matchForm, location: e.target.value })}
                                        className="w-full bg-slate-800 border-slate-700 text-white rounded-lg p-3 mt-1 focus:border-neon-green focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex space-x-3">
                            <button onClick={handleSaveMatch} className="flex-1 bg-neon-green text-slate-900 font-bold py-3 rounded-xl uppercase tracking-wider">
                                Guardar
                            </button>
                            <button onClick={() => setIsEditingMatch(false)} className="px-4 bg-slate-800 text-white font-bold py-3 rounded-xl uppercase tracking-wider">
                                Cancelar
                            </button>
                        </div>
                    </Card>
                </div>
            )}

            <header className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-3">
                    <FootballFieldIcon className="w-8 h-12" />
                    <div>
                        <h1 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">
                            Pachang<span className="text-neon-green">App</span>
                        </h1>
                        <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Fútbol Amateur</p>
                    </div>
                </div>
                <Link to={`/profile/${currentUser?.id}`} id="tour-profile" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 overflow-hidden cursor-pointer hover:border-neon-green transition-colors">
                    {/* User Avatar (from Store) */}
                    <img
                        src={getAvatar(currentUser)}
                        alt="User"
                        className="w-full h-full object-cover opacity-90"
                    />
                </Link>
            </header>

            {/* ADMIN DASHBOARD */}
            {
                isAdmin && (
                    <section className="mb-6">
                        <Card className="bg-slate-900 border-neon-green/50 border-dashed">
                            <div className="flex items-center space-x-2 mb-4 text-neon-green">
                                <Shield size={18} />
                                <h3 className="text-xs font-bold uppercase tracking-widest">Panel de Administrador</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {currentMatch.status === 'pending_confirmation' && (
                                    <button
                                        onClick={() => {
                                            if (window.confirm("¿Confirmar partido y abrir convocatoria?")) confirmMatch();
                                        }}
                                        className="col-span-2 p-3 rounded-lg border flex items-center justify-center space-x-2 transition-all active:scale-95 bg-orange-500/20 border-orange-500 text-orange-500 hover:bg-orange-500/30"
                                    >
                                        <CheckCircle size={20} />
                                        <span className="text-xs font-bold uppercase">Confirmar y Abrir Convocatoria</span>
                                    </button>
                                )}

                                {currentMatch.status === 'played_pending_votes' && (
                                    <>
                                        <button
                                            onClick={() => {
                                                console.log("CERRAR VOTACION CLIECKED");
                                                closeVoting();
                                            }}
                                            className="p-3 rounded-lg border flex flex-col items-center justify-center transition-all active:scale-95 bg-red-500/20 border-red-500 text-red-500 hover:bg-red-500/30"
                                        >
                                            <ToggleLeft size={24} />
                                            <span className="text-[10px] font-bold mt-1 uppercase">Cerrar Votación</span>
                                        </button>

                                        <button
                                            onClick={() => setIsResultModalOpen(true)}
                                            className="p-3 rounded-lg border flex flex-col items-center justify-center transition-all active:scale-95 bg-yellow-500/20 border-yellow-500 text-yellow-500 hover:bg-yellow-500/30"
                                        >
                                            <Scale size={24} />
                                            <span className="text-[10px] font-bold mt-1 uppercase">Modificar Resultado</span>
                                        </button>
                                    </>
                                )}

                                {currentMatch.status === 'voting_closed' && (
                                    <>
                                        <button
                                            onClick={() => {
                                                console.log("FINALIZAR PARTIDO CLICKED");
                                                finalizeMatch();
                                            }}
                                            className="p-3 rounded-lg border flex flex-col items-center justify-center transition-all active:scale-95 bg-neon-green/20 border-neon-green text-neon-green hover:bg-neon-green/30"
                                        >
                                            <Crown size={24} />
                                            <span className="text-[10px] font-bold mt-1 uppercase">Finalizar Partido</span>
                                        </button>

                                        <button
                                            onClick={() => setIsResultModalOpen(true)}
                                            className="p-3 rounded-lg border flex flex-col items-center justify-center transition-all active:scale-95 bg-yellow-500/20 border-yellow-500 text-yellow-500 hover:bg-yellow-500/30"
                                        >
                                            <Scale size={24} />
                                            <span className="text-[10px] font-bold mt-1 uppercase">Modificar Resultado</span>
                                        </button>
                                    </>
                                )}

                                <button
                                    onClick={() => setIsEditingMatch(true)}
                                    className="p-3 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 flex flex-col items-center justify-center hover:bg-slate-700 hover:text-white transition-colors"
                                >
                                    <Calendar size={24} />
                                    <span className="text-[10px] font-bold mt-1 uppercase">Editar Partido</span>
                                </button>

                                {currentMatch.status === 'upcoming' && (
                                    <button
                                        onClick={() => setIsResultModalOpen(true)}
                                        className="p-3 rounded-lg border flex flex-col items-center justify-center transition-all active:scale-95 bg-yellow-500/20 border-yellow-500 text-yellow-500 hover:bg-yellow-500/30"
                                    >
                                        <Scale size={24} />
                                        <span className="text-[10px] font-bold mt-1 uppercase">Modificar Resultado</span>
                                    </button>
                                )}



                                <button
                                    onClick={() => navigate('/admin/users')}
                                    className="p-3 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 flex flex-col items-center justify-center hover:border-neon-green hover:text-white transition-colors"
                                >
                                    <User size={24} />
                                    <span className="text-[10px] font-bold mt-1 uppercase">Usuarios</span>
                                </button>

                                <button
                                    onClick={() => setIsAnnouncementModalOpen(true)}
                                    className="p-3 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 flex flex-col items-center justify-center hover:border-neon-green hover:text-white transition-colors"
                                >
                                    <Megaphone size={24} />
                                    <span className="text-[10px] font-bold mt-1 uppercase">Comunicado</span>
                                </button>
                            </div>
                        </Card>
                    </section>
                )
            }

            {/* Announcement Modal (Admin) */}
            {
                isAnnouncementModalOpen && (
                    <AnnouncementModal
                        isOpen={isAnnouncementModalOpen}
                        onClose={() => setIsAnnouncementModalOpen(false)}
                        currentAnnouncement={announcement}
                        onSave={async (data) => {
                            await updateAnnouncement(data);
                            setIsAnnouncementModalOpen(false);
                        }}
                    />
                )
            }

            {/* Active Announcement Banner (Public) */}
            {
                announcement?.isVisible && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className={clsx(
                            "rounded-xl p-4 mb-6 border flex items-start space-x-3 shadow-lg",
                            announcement.type === 'urgent' && "bg-red-500/10 border-red-500 text-red-500",
                            announcement.type === 'warning' && "bg-yellow-500/10 border-yellow-500 text-yellow-500",
                            announcement.type === 'info' && "bg-blue-500/10 border-blue-500 text-blue-500"
                        )}
                    >
                        <div className="flex-shrink-0 mt-0.5">
                            {announcement.type === 'urgent' && <AlertCircle size={24} />}
                            {announcement.type === 'warning' && <AlertTriangle size={24} />}
                            {announcement.type === 'info' && <Info size={24} />}
                        </div>
                        <div>
                            <h3 className="font-bold uppercase text-sm mb-1">{announcement.title}</h3>
                            <p className="text-xs opacity-90 leading-relaxed font-medium">{announcement.message}</p>
                        </div>
                    </motion.div>
                )
            }

            {/* Result Modal */}
            {
                isResultModalOpen && (
                    <ResultModal
                        isOpen={isResultModalOpen}
                        onClose={() => setIsResultModalOpen(false)}
                        initialData={currentMatch}
                        currentMatch={currentMatch}
                        onConfirm={async (scoreA, scoreB, stats) => {
                            await setMatchResult(scoreA, scoreB, stats);
                            setIsResultModalOpen(false);
                        }}
                    />
                )
            }

            {/* Match Status Section */}
            <section className="space-y-6">
                {/* 1. Voting Card */}
                {currentMatch.status === 'played_pending_votes' && (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-r from-neon-green to-blue-500 rounded-2xl blur opacity-30 animate-pulse"></div>
                        <Card className="relative border-neon-green/30 text-center space-y-4 py-10">
                            <h2 className="text-3xl font-black text-white leading-none">VOTACIONES<br /><span className="text-neon-green">ABIERTAS</span></h2>
                            <p className="text-slate-400 text-sm">El partido ha terminado. ¡Es hora de juzgar!</p>
                            <Button
                                variant="primary"
                                onClick={() => navigate('/vote')}
                                className="animate-bounce-slow mt-4"
                            >
                                VOTAR AHORA <ArrowRight size={20} className="ml-2" />
                            </Button>
                        </Card>
                    </motion.div>
                )}

                {/* 1.5 Voting Closed Banner */}
                {currentMatch.status === 'voting_closed' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card className="border-yellow-500/30 bg-slate-800/50 text-center py-8">
                            <Clock size={40} className="mx-auto text-yellow-500 mb-4 animate-pulse" />
                            <h2 className="text-2xl font-black text-white uppercase italic">Votación Cerrada</h2>
                            <p className="text-slate-400 text-sm mt-2">Calculando resultados y MVP...</p>
                        </Card>
                    </motion.div>
                )}

                {/* 2. Next Match Card */}
                {(currentMatch.status === 'upcoming' || currentMatch.status === 'pending_confirmation' || currentMatch.status === 'played_pending_votes' || currentMatch.status === 'voting_closed') && (
                    <motion.div>
                        <h2 className="text-slate-400 font-bold text-xs tracking-widest uppercase mb-4">
                            {currentMatch.status === 'pending_confirmation' ? 'Próximo (Pendiente)' : (currentMatch.status === 'upcoming' ? 'Próximo Partido' : 'Partido en Curso')}
                        </h2>
                        <Link to="/match">
                            <Card id="tour-next-match" className={clsx(
                                "border-l-4 hover:bg-slate-800 transition-colors group cursor-pointer relative overflow-hidden",
                                currentMatch.status === 'pending_confirmation' ? "border-l-orange-500" : "border-l-neon-green"
                            )}>
                                <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                                    <Calendar size={100} />
                                </div>
                                <div className="flex justify-between items-start relative z-10">
                                    <div>
                                        <div className="flex items-center text-neon-green mb-1 space-x-2">
                                            <Clock size={16} />
                                            <span className="font-bold text-sm capitalize">
                                                {new Date(currentMatch.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}, {currentMatch.time}
                                            </span>
                                        </div>
                                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                                            {currentMatch.location}
                                        </h3>
                                        <div className="mt-3 inline-flex items-center space-x-2 text-xs font-bold text-slate-400 group-hover:text-white transition-colors">
                                            <span>Gestionar Asistencia</span>
                                            <ChevronRight size={14} />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    </motion.div>
                )}
            </section>

            {/* Last MVP Section */}
            <section>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                        <Crown size={18} className="text-yellow-400" />
                        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">MVP de la semana</h3>
                    </div>
                </div>

                {lastMVP && (
                    <Link to={`/profile/${lastMVP.id}`}>
                        <Card id="tour-mvp" className="flex items-center space-x-4 bg-gradient-to-br from-slate-800 to-slate-900 border-yellow-500/20 hover:border-yellow-500/50 transition-colors cursor-pointer group mb-6">
                            <div className="w-20 h-20 rounded-full border-2 border-yellow-400 p-1 relative">
                                <img src={mvpMatch.mvpPhoto || getAvatar(lastMVP)} alt={lastMVP.name} className="w-full h-full rounded-full object-cover" />
                                <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-slate-900 text-xs font-bold px-2 py-0.5 rounded-full shadow-lg">
                                    {mvpMatch.mvpRating || lastMVP.stats.average}
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center space-x-2">
                                    <h4 className="text-xl font-bold text-white group-hover:text-yellow-400 transition-colors">{lastMVP.alias || lastMVP.name}</h4>
                                    <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">{new Date(mvpMatch.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                                </div>
                                <p className="text-sm text-slate-400">"{mvpMatchStats.goals} Goles · {mvpMatchStats.assists} Asistencias"</p>
                            </div>
                        </Card>
                    </Link>
                )}


            </section>
        </div >
    );
};

/**
 * Result Modal Component
 * Handles input of scores and player stats (Goals/Assists)
 */
export default Home;
