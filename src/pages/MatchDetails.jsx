import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, CheckCircle2, XCircle, HelpCircle, Users, AlertTriangle, Trash2, Shuffle, ChevronLeft, Plus } from 'lucide-react';
import Card from '../components/ui/Card';
import clsx from 'clsx';
import ResultModal from '../components/ResultModal';

const MatchDetails = () => {
    const { currentMatch, setAttendance, players, currentUser, addGuestPlayer, removeGuestPlayer, generateTeams, clearTeams, isAdmin, confirmMatch, updateMatchDetails, setMatchResult } = useStore();
    const navigate = useNavigate();

    const isPending = currentMatch.status === 'pending_confirmation';
    const isUpcoming = currentMatch.status === 'upcoming';
    const isLocked = !isUpcoming; // Locked if pending, played, or closed
    const [guestName, setGuestName] = React.useState('');
    const [isFinishing, setIsFinishing] = useState(false);

    // Use centralized user
    const me = currentUser;

    const handleResetMatch = () => {
        if (window.confirm("¿Seguro que quieres reiniciar el partido? Se borrarán los resultados.")) {
            updateMatchDetails({
                status: 'pending_confirmation',
                result: null,
                playerStats: {}
            });
            navigate('/');
        }
    };

    const handleAttendance = (status) => {
        setAttendance(me.id, status);
    };

    const handleAdminToggleStatus = (p) => {
        if (!isAdmin || p.isGuest || !isUpcoming) return; // Guests managed via remove, Only upcoming matches

        const cycle = ['pending', 'confirmed', 'maybe', 'declined'];
        const currentIndex = cycle.indexOf(p.status);
        const nextStatus = cycle[(currentIndex + 1) % cycle.length];

        setAttendance(p.id, nextStatus);
    };

    const handleAddGuest = () => {
        if (guestName.trim()) {
            addGuestPlayer(guestName.trim());
            setGuestName('');
        }
    };

    const regularAttendance = players.map(p => ({
        ...p,
        status: currentMatch.attendance?.[p.id] || 'pending',
        isGuest: false
    }));

    const guestAttendance = (currentMatch.guestPlayers || []).map(g => ({
        ...g,
        status: 'confirmed', // Guests are always confirmed
        isGuest: true
    }));

    const attendanceList = [...regularAttendance, ...guestAttendance];

    const confirmedCount = attendanceList.filter(p => p.status === 'confirmed').length;

    return (
        <div className="pb-24 pt-4">
            {/* Header with Back Button */}
            <div className="flex items-center mb-6">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-white">
                    <ChevronLeft size={28} />
                </button>
                <h1 className="text-2xl font-black text-white ml-2">PRÓXIMO <span className="text-neon-green">PARTIDO</span></h1>
            </div>

            {/* Match Info Card */}
            <Card className="mb-8 border-l-4 border-l-neon-green relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Calendar size={120} />
                </div>

                <div className="relative z-10 space-y-4">
                    <div className="flex items-start space-x-3">
                        <Calendar className="text-neon-green mt-1" size={20} />
                        <div>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Fecha</p>
                            <p className="text-lg font-bold text-white">
                                {(() => {
                                    try {
                                        if (!currentMatch?.date) return 'Fecha pendiente';
                                        const d = new Date(currentMatch.date);
                                        if (isNaN(d.getTime())) return 'Fecha pendiente';
                                        return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
                                    } catch (e) { return 'Fecha pendiente'; }
                                })()}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start space-x-3">
                        <Clock className="text-neon-green mt-1" size={20} />
                        <div>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Hora</p>
                            <p className="text-lg font-bold text-white">{currentMatch.time}</p>
                        </div>
                    </div>

                    <div className="flex items-start space-x-3">
                        <MapPin className="text-neon-green mt-1" size={20} />
                        <div>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Lugar</p>
                            <p className="text-lg font-bold text-white">{currentMatch.location}</p>

                        </div>
                    </div>
                </div>
            </Card>

            {/* Pending Confirmation Banner */}
            {isPending && (
                <div className="bg-orange-500/10 border border-orange-500/50 rounded-xl p-4 mb-6 flex items-center space-x-3 text-orange-400">
                    <AlertTriangle size={24} className="flex-shrink-0" />
                    <div>
                        <h3 className="font-bold uppercase text-sm">Partido Por Confirmar</h3>
                        <p className="text-xs opacity-80">El administrador aún no ha abierto la convocatoria.</p>
                        {isAdmin && (
                            <button
                                onClick={() => {
                                    if (window.confirm("¿Confirmar partido?")) confirmMatch();
                                }}
                                className="mt-2 bg-orange-500 text-black text-xs font-bold px-3 py-1.5 rounded uppercase"
                            >
                                Confirmar Ahora
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* TEAMS SECTION */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Equipos</h2>
                    {isAdmin && (
                        <div className="flex space-x-2">
                            {currentMatch.teams && (
                                <button
                                    onClick={() => {
                                        if (window.confirm("¿Estás seguro de que quieres borrar los equipos?")) clearTeams();
                                    }}
                                    className="text-xs font-bold bg-slate-800 text-red-400 px-3 py-1.5 rounded-lg border border-red-500/30 flex items-center space-x-1 hover:bg-red-500 hover:text-white transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                            <button
                                onClick={generateTeams}
                                className="text-xs font-bold bg-slate-800 text-neon-green px-3 py-1.5 rounded-lg border border-neon-green/30 flex items-center space-x-1 hover:bg-neon-green hover:text-slate-900 transition-colors"
                            >
                                <Shuffle size={14} />
                                <span>Generar Aleatorios</span>
                            </button>
                        </div>
                    )}
                </div>

                {
                    currentMatch.teams ? (
                        <div className="grid grid-cols-2 gap-4">
                            {/* Team A */}
                            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-3">
                                <h3 className="text-center font-black text-white italic uppercase mb-3 text-sm flex items-center justify-center space-x-2">
                                    <span>Equipo A</span>
                                    {currentMatch.teams.avgA && <span className="text-xs font-mono text-neon-green bg-neon-green/10 px-1.5 rounded">⭐ {currentMatch.teams.avgA}</span>}
                                </h3>
                                <div className="space-y-2">
                                    {currentMatch.teams.teamA.map(p => (
                                        <div key={p.id} className="flex items-center space-x-2 text-sm text-slate-300">
                                            <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-700">
                                                {p.photo ? (
                                                    <img src={p.photo} className="w-full h-full object-cover" alt={p.alias} />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-500">{p.alias.substring(0, 2)}</div>
                                                )}
                                            </div>
                                            <span className="truncate">{p.alias}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Team B */}
                            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-3">
                                <h3 className="text-center font-black text-white italic uppercase mb-3 text-sm text-neon-green flex items-center justify-center space-x-2">
                                    <span>Equipo B</span>
                                    {currentMatch.teams.avgB && <span className="text-xs font-mono text-neon-green bg-neon-green/10 px-1.5 rounded">⭐ {currentMatch.teams.avgB}</span>}
                                </h3>
                                <div className="space-y-2">
                                    {currentMatch.teams.teamB.map(p => (
                                        <div key={p.id} className="flex items-center space-x-2 text-sm text-slate-300">
                                            <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-700">
                                                {p.photo ? (
                                                    <img src={p.photo} className="w-full h-full object-cover" alt={p.alias} />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-500">{p.alias.substring(0, 2)}</div>
                                                )}
                                            </div>
                                            <span className="truncate">{p.alias}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 border-2 border-dashed border-slate-800 rounded-xl">
                            <Users className="mx-auto text-slate-600 mb-2" size={32} />
                            <p className="text-slate-500 text-sm font-medium">Equipos no definidos</p>
                        </div>
                    )
                }
            </div>

            {/* My Status Action */}
            {isUpcoming && (
                <div className="mb-8">
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Mi Asistencia</h2>
                    <div className="grid grid-cols-3 gap-3">
                        <StatusButton
                            active={me && currentMatch.attendance?.[me.id] === 'confirmed'}
                            onClick={() => me && handleAttendance('confirmed')}
                            icon={<CheckCircle2 size={24} />}
                            label="Voy"
                            variant="green"
                        />
                        <StatusButton
                            active={me && currentMatch.attendance?.[me.id] === 'maybe'}
                            onClick={() => me && handleAttendance('maybe')}
                            icon={<HelpCircle size={24} />}
                            label="Duda"
                            variant="yellow"
                        />
                        <StatusButton
                            active={me && currentMatch.attendance?.[me.id] === 'declined'}
                            onClick={() => me && handleAttendance('declined')}
                            icon={<XCircle size={24} />}
                            label="No voy"
                            variant="red"
                        />
                    </div>
                </div>
            )}

            {/* Attendance List */}
            <div>
                <div className="flex justify-between items-end mb-4">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Convocatoria</h2>
                    <span className="text-xs font-mono font-bold text-neon-green bg-neon-green/10 px-2 py-1 rounded">
                        {confirmedCount} / {players.length + (currentMatch.guestPlayers?.length || 0)} Confirmados
                    </span>
                </div>

                {/* Admin: Add Guest (Only Upcoming) */}
                {isAdmin && isUpcoming && (
                    <div className="flex space-x-2 mb-4">
                        <input
                            type="text"
                            placeholder="Añadir invitado..."
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-neon-green focus:outline-none placeholder:text-slate-500"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddGuest()}
                        />
                        <button
                            onClick={handleAddGuest}
                            disabled={!guestName.trim()}
                            className="bg-neon-green disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 p-2 rounded-lg"
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                )}

                <div className="bg-slate-800/50 rounded-xl border border-slate-700 divide-y divide-slate-700/50">
                    {attendanceList.map(p => (
                        <div key={p.id} className="flex items-center justify-between p-3 group">
                            <div className="flex items-center space-x-3 flex-1">
                                {p.isGuest ? (
                                    // Guest Avatar (Letter)
                                    <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500 flex items-center justify-center text-purple-400 font-bold text-xs uppercase">
                                        {p.alias.substring(0, 2)}
                                    </div>
                                ) : (
                                    // Regular Link Avatar
                                    <Link to={`/profile/${p.id}`}>
                                        <img src={p.photo || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'} alt={p.alias} className="w-8 h-8 rounded-full object-cover ring-2 ring-transparent group-hover:ring-neon-green transition-all" />
                                    </Link>
                                )}

                                <div className="flex items-center space-x-2">
                                    <Link to={p.isGuest ? '#' : `/profile/${p.id}`} className={clsx("font-bold text-sm transition-colors", p.isGuest ? "text-purple-400 cursor-default" : (me && p.id === me.id ? "text-white" : "text-slate-300 group-hover:text-neon-green"))}>
                                        {p.alias || p.name}
                                    </Link>
                                    {p.isGuest && <span className="text-[10px] font-bold bg-purple-500 text-white px-1.5 py-0.5 rounded">INVITADO</span>}
                                </div>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleAdminToggleStatus(p); }}
                                disabled={!isAdmin || p.isGuest || !isUpcoming}
                                className={clsx("flex items-center justify-end w-8 h-8 rounded-full transition-colors", isAdmin && !p.isGuest && isUpcoming ? "cursor-pointer hover:bg-white/10 active:scale-95" : "")}
                            >
                                {isAdmin && p.isGuest && isUpcoming ? (
                                    <span onClick={(e) => { e.stopPropagation(); removeGuestPlayer(p.id); }} className="text-slate-500 hover:text-red-500 transition-colors p-1 cursor-pointer">
                                        <Trash2 size={16} />
                                    </span>
                                ) : (
                                    <>
                                        {p.status === 'confirmed' && <CheckCircle2 size={18} className="text-neon-green" />}
                                        {p.status === 'maybe' && <HelpCircle size={18} className="text-yellow-500" />}
                                        {p.status === 'declined' && <XCircle size={18} className="text-red-500" />}
                                        {p.status === 'pending' && <span className="text-[10px] text-slate-500 font-bold uppercase">Pendiente</span>}
                                    </>
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            </div>







            {/* FINISH MATCH BUTTON & MODAL (Admin Only) */}
            {
                isAdmin && (
                    <div className="mt-12 mb-8">
                        <button
                            onClick={() => setIsFinishing(true)}
                            className="w-full bg-slate-800 border border-slate-700 text-slate-400 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-neon-green hover:text-slate-900 transition-colors flex items-center justify-center space-x-2"
                        >
                            <CheckCircle2 size={16} />
                            <span>Finalizar Partido</span>
                        </button>
                    </div>
                )
            }

            {/* MATCH RESULT MODAL (Admin Only) */}
            {
                isFinishing && (
                    <ResultModal
                        isOpen={isFinishing}
                        onClose={() => setIsFinishing(false)}
                        initialData={currentMatch}
                        currentMatch={currentMatch}
                        onConfirm={async (scoreA, scoreB, stats) => {
                            await setMatchResult(scoreA, scoreB, stats);
                            setIsFinishing(false);
                            navigate('/');
                        }}
                    />
                )
            }

        </div >
    );
};

const StatusButton = ({ active, onClick, icon, label, variant }) => {
    const variants = {
        green: "hover:bg-neon-green/20 hover:border-neon-green hover:text-neon-green",
        yellow: "hover:bg-yellow-500/20 hover:border-yellow-500 hover:text-yellow-500",
        red: "hover:bg-red-500/20 hover:border-red-500 hover:text-red-500"
    };

    const activeStyles = {
        green: "bg-neon-green text-slate-900 border-neon-green",
        yellow: "bg-yellow-500 text-slate-900 border-yellow-500",
        red: "bg-red-500 text-white border-red-500"
    };

    return (
        <button
            onClick={onClick}
            className={clsx(
                "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all active:scale-95",
                active ? activeStyles[variant] : `bg-slate-800 border-slate-700 text-slate-400 ${variants[variant]}`
            )}
        >
            <div className="mb-1">{icon}</div>
            <span className="text-xs font-bold">{label}</span>
        </button>
    );
};

export default MatchDetails;
