import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { LogOut, Settings, Share2, Grid, Edit2, Camera, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Save, X, Copy, Check } from 'lucide-react';
import clsx from 'clsx';
import Card from '../components/ui/Card';

import { useParams, useNavigate } from 'react-router-dom';

const Profile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { players, updatePlayerProfile, updatePlayerCard, updatePlayerPhoto, getLeaderboard, isAdmin, currentUser } = useStore();
    const { logout, user: authUser } = useAuth(); // Get raw authUser too

    // Helper: Card Tiers
    const getCardTier = (rating) => {
        const r = Number(rating);
        if (r >= 75) return 'gold';
        if (r >= 60) return 'silver';
        return 'bronze';
    };

    const tierStyles = {
        gold: {
            bg: "bg-gradient-to-br from-yellow-600/20 via-yellow-900/20 to-slate-900",
            border: "border-yellow-500/50",
            shadow: "shadow-[0_0_30px_rgba(234,179,8,0.2)]",
            text: "text-yellow-400"
        },
        silver: {
            bg: "bg-gradient-to-br from-slate-400/20 via-slate-600/10 to-slate-900",
            border: "border-slate-400/50",
            shadow: "shadow-[0_0_30px_rgba(148,163,184,0.2)]",
            text: "text-slate-300"
        },
        bronze: {
            bg: "bg-gradient-to-br from-orange-700/20 via-orange-900/10 to-slate-900",
            border: "border-orange-600/50",
            shadow: "shadow-[0_0_30px_rgba(194,65,12,0.2)]",
            text: "text-orange-400"
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Failed to logout", error);
        }
    };

    // Logic: If ID param exists, view that player. Else, view ME (currentUser)
    // Firestore IDs are strings, DO NOT cast to Number.
    const targetId = id || currentUser?.id;
    const isOwner = currentUser && targetId === currentUser.id;
    const canEdit = isOwner || isAdmin;

    // Use Leaderboard data to get accurate derived stats
    const leaderboard = getLeaderboard;
    const meRaw = players.find(p => p.id === targetId);




    const [isEditing, setIsEditing] = useState(false);
    const [isQRVisible, setIsQRVisible] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    // Safely derived values for hooks (meRaw might be undefined initially)
    const initialTempAlias = meRaw?.alias || meRaw?.name || '';
    const initialAttributes = meRaw?.attributes || { rit: 50, tir: 50, pas: 50, reg: 50, def: 50, fis: 50 };
    const initialPosition = meRaw?.position || 'MED';
    const initialNationality = meRaw?.nationality || 'es';

    const [tempAlias, setTempAlias] = useState(initialTempAlias);
    const [attributes, setAttributes] = useState(initialAttributes);
    const [position, setPosition] = useState(initialPosition);
    const [nationality, setNationality] = useState(initialNationality);
    const fileInputRef = useRef(null);

    // Update state when data arrives
    useEffect(() => {
        if (meRaw) {
            setTempAlias(meRaw.alias || meRaw.name);
            setAttributes(meRaw.attributes || { rit: 50, tir: 50, pas: 50, reg: 50, def: 50, fis: 50 });
            setPosition(meRaw.position || 'MED');
            setNationality(meRaw.nationality || 'es');
        }
    }, [meRaw]);

    // Use Leaderboard data to get accurate derived stats
    const meStats = meRaw ? (leaderboard.find(p => p.id === meRaw.id) || meRaw) : null;
    const derivedOverall = meStats?.stats?.mp > 0 ? Math.round(Number(meStats.average) * 10) : 50;
    const currentTier = getCardTier(derivedOverall);
    const tierConfig = tierStyles[currentTier];
    const TOTAL_POINTS = derivedOverall * 6;

    // AUTO-LEVELING: Sync attributes with budget changes (Avg up/down)
    useEffect(() => {
        if (!meRaw || !meStats) return;

        const storedSum = Object.values(meRaw.attributes || {}).reduce((a, b) => a + b, 0);
        const delta = TOTAL_POINTS - storedSum;

        if (delta !== 0) {
            console.log(`Auto-balancing stats: ${delta > 0 ? '+' : ''}${delta} points`);

            let newAttrs = { ...(meRaw.attributes || initialAttributes) };
            const keys = Object.keys(newAttrs);

            let remaining = Math.abs(delta);
            const direction = delta > 0 ? 1 : -1;
            let i = 0;

            // Distribute points evenly
            while (remaining > 0) {
                const key = keys[i % keys.length];
                // Check bounds (0-99)
                if (direction === 1 && newAttrs[key] < 99) {
                    newAttrs[key]++;
                    remaining--;
                } else if (direction === -1 && newAttrs[key] > 0) {
                    newAttrs[key]--;
                    remaining--;
                }
                i++;
                if (i > 1000) break; // Safety break
            }

            // Persist changes immediately
            // Note: Be careful with infinite loops here. 
            // We only update if delta != 0. 
            // Previous logic was stable, keeping it essentially the same.
            updatePlayerCard(meRaw.id, { attributes: newAttrs });
        }
    }, [derivedOverall, meRaw?.attributes]);


    // Guard: Loading & Error States (Rendered AFTER hooks)
    if (!meRaw) {
        // 1. Still loading players data?
        if (players.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen text-white space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-neon-green"></div>
                    <p>Cargando datos...</p>
                </div>
            );
        }

        // 2. Players loaded, but Auth User has no profile?
        if (authUser && !id && !currentUser) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen text-white p-6 text-center space-y-4">
                    <div className="text-red-500 font-bold text-xl">Perfil No Encontrado</div>
                    <p className="text-slate-400">Tu usuario existe, pero no tiene ficha de jugador.</p>
                    <button
                        onClick={handleLogout}
                        className="bg-neon-green text-slate-900 font-bold py-2 px-6 rounded-xl hover:bg-neon-green/90 transition-colors"
                    >
                        Cerrar Sesión y Reparar
                    </button>
                </div>
            );
        }

        // 3. ID specified but not found
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-white space-y-4">
                <p>Jugador no encontrado</p>
                <button onClick={() => navigate('/')} className="text-neon-green underline">Volver al Inicio</button>
            </div>
        );
    }

    const usedPoints = Object.values(attributes).reduce((a, b) => a + b, 0);
    const remainingPoints = TOTAL_POINTS - usedPoints;

    const handleAttributeChange = (attr, delta) => {
        const createNewValue = (prev) => {
            const current = prev[attr];
            const next = current + delta;

            // Bounds check (0-99)
            if (next < 0 || next > 99) return prev;

            // Budget check (only if increasing)
            if (delta > 0 && remainingPoints <= 0) return prev;

            return { ...prev, [attr]: next };
        };
        setAttributes(createNewValue);
    };

    const saveCard = () => {
        updatePlayerProfile(meRaw.id, tempAlias);
        updatePlayerCard(meRaw.id, {
            position,
            nationality,
            attributes
        });
        setIsEditing(false);
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (file) {
            try {
                const compressedBase64 = await compressImage(file);
                updatePlayerPhoto(meRaw.id, compressedBase64);
            } catch (error) {
                console.error("Error compressing image:", error);
                alert("Error al procesar la imagen. Intenta con una más pequeña.");
            }
        }
    };

    // Helper: Compress Image to avoid Firestore 1MB limit
    const compressImage = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 300;
                    const MAX_HEIGHT = 300;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress to JPEG 70%
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    };

    const POSITIONS = ['POR', 'DEF', 'MED', 'DEL'];
    const NATIONALITIES = ['es', 'ar', 'br', 'fr', 'it', 'de', 'pt', 'gb', 'uy', 'co'];

    // Helper to get flag URL
    const getFlagUrl = (code) => `https://flagcdn.com/w40/${code}.png`;

    const cyclePosition = () => {
        const idx = POSITIONS.indexOf(position);
        setPosition(POSITIONS[(idx + 1) % POSITIONS.length]);
    };

    const cycleNationality = () => {
        const idx = NATIONALITIES.indexOf(nationality);
        setNationality(NATIONALITIES[(idx + 1) % NATIONALITIES.length]);
    };

    return (
        <div className="pt-2 pb-24 px-4 bg-slate-900 min-h-screen">
            {/* Header removed - using Global TopBar */}

            {isEditing && (
                <div className="mb-6 bg-slate-800/80 border border-neon-green/30 p-4 rounded-xl animate-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-white uppercase tracking-wider text-sm">Editor de Carta</h3>
                        <div className={clsx("text-sm font-mono font-bold px-2 py-1 rounded", remainingPoints >= 0 ? "bg-neon-green/20 text-neon-green" : "bg-red-500/20 text-red-500")}>
                            {remainingPoints >= 0 ? `${remainingPoints} Puntos Restantes` : `${remainingPoints} Exceso`}
                        </div>
                    </div>

                    {/* Alias Input (Moved here) */}
                    <div className="mb-4">
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Alias / Nombre</label>
                        <input
                            value={tempAlias}
                            onChange={(e) => setTempAlias(e.target.value)}
                            className="w-full bg-slate-900 border-slate-700 text-white rounded-lg p-2 font-black uppercase tracking-wider focus:border-neon-green focus:outline-none"
                            placeholder="TU NOMBRE"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <button onClick={cyclePosition} className="bg-slate-900 p-2 rounded-lg border border-slate-700 text-white font-bold text-center hover:border-neon-green transition-colors">
                            Posición: <span className="text-neon-green">{position}</span>
                        </button>
                        <button onClick={cycleNationality} className="bg-slate-900 p-2 rounded-lg border border-slate-700 text-white font-bold text-center hover:border-neon-green transition-colors">
                            Nación: <span className="text-2xl leading-none ml-2">{nationality}</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                        {Object.entries(attributes).map(([key, val]) => (
                            <div key={key} className="flex items-center justify-between">
                                <span className="text-slate-400 font-bold uppercase text-xs w-8">{key}</span>
                                <div className="flex items-center space-x-2">
                                    <button onClick={() => handleAttributeChange(key, -1)} className="w-6 h-6 rounded bg-slate-700 text-white flex items-center justify-center hover:bg-red-500/50">-</button>
                                    <span className="font-mono text-white font-bold w-6 text-center">{val}</span>
                                    <button onClick={() => handleAttributeChange(key, 1)} className={clsx("w-6 h-6 rounded bg-slate-700 text-white flex items-center justify-center", remainingPoints <= 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-neon-green/50")}>+</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex space-x-3 mt-4">
                        <button onClick={saveCard} disabled={remainingPoints < 0} className="flex-1 bg-neon-green disabled:bg-slate-600 disabled:text-slate-400 text-slate-900 font-bold py-2 rounded-lg flex items-center justify-center space-x-2">
                            <Save size={18} /> <span>Guardar</span>
                        </button>
                        <button onClick={() => setIsEditing(false)} className="bg-slate-700 text-white p-2 rounded-lg">
                            <X size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* MAIN CARD */}
            <div className="relative w-full max-w-sm mx-auto aspect-[4/5] mb-6 transform transition-all">
                {/* Border / Container */}
                <div className={clsx(
                    "absolute inset-0 rounded-[2.5rem] border overflow-hidden transition-all duration-500",
                    isEditing ? "border-neon-green shadow-[0_0_40px_rgba(57,255,20,0.2)] bg-slate-900/80" : `${tierConfig.bg} ${tierConfig.border} ${tierConfig.shadow}`
                )}>
                    {/* Top Info */}
                    <div className="absolute top-6 left-6 text-white">
                        <div className="flex items-start space-x-1">
                            <div className="text-5xl font-black leading-none">{derivedOverall}</div>
                            {/* Trend Indicator */}
                            {(() => {
                                const avg = meStats?.average || 5.0;
                                const prev = meStats?.previousRating ?? avg;
                                const diff = Math.round((parseFloat(avg) - parseFloat(prev)) * 10);
                                const isUp = diff > 0;
                                const isDown = diff < 0;

                                if (!isUp && !isDown) return null;

                                return (
                                    <div className={clsx("flex items-center mt-1", isUp ? "text-neon-green" : "text-red-500")}>
                                        {isUp ? <ArrowUp size={14} strokeWidth={3} /> : <ArrowDown size={14} strokeWidth={3} />}
                                        <span className="text-xs font-bold leading-none">{Math.abs(diff)}</span>
                                    </div>
                                );
                            })()}
                        </div>
                        <div className="text-sm font-bold tracking-widest uppercase text-slate-300 mt-1">{isEditing ? position : (meRaw.position || 'MED')}</div>
                    </div>

                    <div className="absolute top-6 right-6 flex flex-col items-center space-y-2">
                        <img
                            src={getFlagUrl(isEditing ? nationality : (meRaw.nationality || 'es'))}
                            alt="Flag"
                            className="w-8 h-5 object-cover rounded shadow-md border border-white/10"
                        />
                        <div className="w-6 h-6 rounded-full border border-slate-600 flex items-center justify-center overflow-hidden bg-slate-800">
                            {/* Club Icon Placeholder */}
                            <div className="w-3 h-3 bg-slate-500 rounded-full"></div>
                        </div>
                    </div>

                    {/* Player Photo */}
                    <div className="absolute top-20 left-1/2 -translate-x-1/2 w-48 h-48">
                        <div className={clsx("w-full h-full rounded-full border-4 overflow-hidden relative group transition-colors", isEditing ? "border-neon-green" : "border-slate-800")}>
                            <img
                                src={meRaw.photo || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'}
                                alt="Player"
                                className="w-full h-full object-cover"
                            />
                            {/* Edit Overlay */}
                            <div
                                onClick={() => isEditing && fileInputRef.current.click()}
                                className={clsx(
                                    "absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity cursor-pointer",
                                    isEditing ? "opacity-100" : "opacity-0"
                                )}
                            >
                                <Camera className="text-neon-green" size={32} />
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" disabled={!isEditing} />
                        </div>
                    </div>

                    {/* Name & Divider */}
                    <div className="absolute bottom-24 w-full text-center px-4">
                        <h2 className="text-3xl font-black text-white uppercase tracking-wider">{isEditing ? tempAlias : (meRaw.alias || meRaw.name)}.</h2>
                        <div className="w-12 h-1 bg-neon-green mx-auto mt-2 rounded-full shadow-[0_0_10px_#39ff14]"></div>
                    </div>

                    {/* Attributes Row */}
                    <div className="absolute bottom-8 w-full flex justify-center space-x-4 px-4">
                        <StatItem label="RIT" value={isEditing ? attributes.rit : (meRaw.attributes?.rit || 50)} />
                        <StatItem label="TIR" value={isEditing ? attributes.tir : (meRaw.attributes?.tir || 50)} />
                        <StatItem label="PAS" value={isEditing ? attributes.pas : (meRaw.attributes?.pas || 50)} />
                        <StatItem label="REG" value={isEditing ? attributes.reg : (meRaw.attributes?.reg || 50)} />
                        <StatItem label="DEF" value={isEditing ? attributes.def : (meRaw.attributes?.def || 50)} />
                        <StatItem label="FIS" value={isEditing ? attributes.fis : (meRaw.attributes?.fis || 50)} />
                    </div>
                </div>
            </div>

            {/* Action Row */}
            {!isEditing && canEdit && (
                <div className="flex space-x-3 mb-6">
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex-1 bg-neon-green text-slate-900 font-bold py-3.5 rounded-full shadow-lg shadow-neon-green/20 flex items-center justify-center space-x-2 active:scale-95 transition-transform"
                    >
                        <Edit2 size={18} />
                        <span>Editar Tarjeta</span>
                    </button>
                    <button
                        onClick={handleLogout}
                        className="p-3.5 bg-slate-800 rounded-full text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors border border-slate-700"
                        title="Cerrar Sesión"
                    >
                        <LogOut size={20} />
                    </button>
                    <button
                        onClick={() => setIsQRVisible(true)}
                        className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-slate-300 hover:text-white border border-slate-700 hover:border-neon-green transition-colors"
                    >
                        <Share2 size={20} />
                    </button>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <StatCard label="MEDIA" value={meStats.average || "7.5"} sub="Pts/P" subColor="text-neon-green" />
                <StatCard label="MVPS" value={meStats.stats.mvp} sub="Totales" subColor="text-slate-500" />
                <StatCard label="PARTIDOS" value={meStats.stats.mp} sub="Jugados" subColor="text-slate-500" />
            </div>

            {/* Detailed Stats Stub */}
            {/* Detailed Stats Card */}
            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="w-1 h-4 bg-neon-green rounded-full"></div>
                    <h3 className="font-bold text-white uppercase tracking-wider text-xs">Estadísticas de Temporada</h3>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center divide-x divide-slate-700/50">
                    <div className="flex flex-col items-center">
                        <span className="text-2xl font-black text-white">{meStats.stats.mp}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Partidos</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-2xl font-black text-white">{meStats.stats.goals}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Goles</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-2xl font-black text-white">{meStats.stats.assists}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Asist.</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-2xl font-black text-neon-green">
                            {meStats.stats.mp > 0
                                ? ((meStats.stats.goals + meStats.stats.assists) / meStats.stats.mp).toFixed(1)
                                : '0.0'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">G+A/P</span>
                    </div>
                </div>
            </div>

            <div className="h-4"></div>

            {/* QR MODAL */}
            {isQRVisible && (
                <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-neon-green rounded-3xl p-8 w-full max-w-sm shadow-[0_0_50px_rgba(57,255,20,0.2)] relative">
                        <button
                            onClick={() => setIsQRVisible(false)}
                            className="absolute top-4 right-4 text-slate-500 hover:text-white"
                        >
                            <X size={24} />
                        </button>

                        <div className="text-center space-y-6">
                            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Comparte tu Ficha</h3>

                            {(() => {
                                // Construct the specific URL for this player, avoiding generic '/profile'
                                const shareUrl = `${window.location.origin}/profile/${meRaw.id}`;

                                return (
                                    <>
                                        <div className="bg-white p-4 rounded-xl inline-block mx-auto shadow-xl">
                                            <img
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}&color=0f172a&bgcolor=ffffff`}
                                                alt="QR Code"
                                                className="w-48 h-48 mix-blend-multiply"
                                            />
                                        </div>

                                        <p className="text-slate-400 text-sm font-medium">Escanea para ver las estadísticas de <span className="text-neon-green font-bold">{meRaw.alias}</span></p>

                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(shareUrl);
                                                setIsCopied(true);
                                                setTimeout(() => setIsCopied(false), 2000);
                                            }}
                                            className={clsx(
                                                "w-full py-4 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all",
                                                isCopied ? "bg-neon-green text-slate-900" : "bg-slate-800 text-white hover:bg-slate-700"
                                            )}
                                        >
                                            {isCopied ? <Check size={20} /> : <Copy size={20} />}
                                            <span>{isCopied ? '¡Enlace Copiado!' : 'Copiar Enlace'}</span>
                                        </button>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Sub-components
const StatItem = ({ label, value }) => (
    <div className="text-center">
        <div className="text-lg font-black text-white leading-none">{value}</div>
        <div className="text-[10px] font-bold text-slate-400 uppercase">{label}</div>
    </div>
);

const StatCard = ({ label, value, sub, subColor }) => (
    <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700 flex flex-col items-center justify-center relative overflow-hidden">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</span>
        <span className="text-3xl font-black text-white">{value}</span>
        <div className={clsx("text-xs font-medium mt-1 flex items-center", subColor)}>
            {sub}
        </div>
    </div>
);

export default Profile;
