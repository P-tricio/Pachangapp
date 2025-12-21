import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Bell, Check, X, Info, AlertTriangle, Trophy, Users, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
    const { notifications, markAsRead, clearNotifications, deleteNotification, currentLeagueId, setCurrentLeagueId } = useStore();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const unreadCount = notifications.filter(n => !n.read).length;

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = async (notif) => {
        if (!notif.read) {
            await markAsRead(notif.id);
        }

        // Switch league if notification belongs to a different one
        if (notif.leagueId && notif.leagueId !== currentLeagueId && setCurrentLeagueId) {
            console.log("Switching context to league:", notif.leagueId);
            setCurrentLeagueId(notif.leagueId);
        }

        if (notif.link) {
            setIsOpen(false);
            navigate(notif.link);
        }
    };

    const handleDelete = (e, id) => {
        e.stopPropagation();
        deleteNotification(id);
    };

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <Trophy size={16} className="text-neon-green" />;
            case 'warning': return <AlertTriangle size={16} className="text-yellow-500" />;
            case 'action': return <Shield size={16} className="text-blue-500" />;
            default: return <Info size={16} className="text-slate-400" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-slate-800 transition-colors"
            >
                <Bell size={24} className={clsx("transition-colors", isOpen ? "text-neon-green" : "text-white")} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-[100]"
                    >
                        <div className="flex justify-between items-center p-3 border-b border-slate-800 bg-slate-950/50">
                            <h3 className="text-xs font-black uppercase text-slate-300 tracking-wider">Notificaciones</h3>
                            {notifications.length > 0 && (
                                <button onClick={clearNotifications} className="text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors">
                                    Borrar Todo
                                </button>
                            )}
                        </div>

                        <div className="max-h-80 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                                    <Bell size={24} className="mb-2 opacity-20" />
                                    <span className="text-xs font-medium">No tienes notificaciones</span>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-800">
                                    {notifications.map(notif => (
                                        <div
                                            key={notif.id}
                                            onClick={() => handleNotificationClick(notif)}
                                            className={clsx(
                                                "p-4 cursor-pointer hover:bg-slate-800/50 transition-colors relative group",
                                                !notif.read && "bg-slate-800/30"
                                            )}
                                        >
                                            {!notif.read && (
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-neon-green"></div>
                                            )}
                                            <div className="flex items-start space-x-3">
                                                <div className="mt-0.5 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                                                    {getIcon(notif.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    {notif.leagueName && (
                                                        <span className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5 tracking-wider">
                                                            {notif.leagueName}
                                                        </span>
                                                    )}
                                                    <p className={clsx("text-sm font-bold leading-none mb-1 pr-4", !notif.read ? "text-white" : "text-slate-400")}>
                                                        {notif.title}
                                                    </p>
                                                    <p className="text-xs text-slate-500 leading-snug line-clamp-2">
                                                        {notif.message}
                                                    </p>
                                                    <span className="text-[9px] text-slate-600 mt-2 block font-mono">
                                                        {new Date(notif.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>

                                                {/* Delete Button */}
                                                <button
                                                    onClick={(e) => handleDelete(e, notif.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-500 transition-all absolute top-2 right-2"
                                                    title="Borrar notificación"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell;
