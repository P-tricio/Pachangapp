import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, ShieldOff, Lock, Unlock, User } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const UserManagementModal = ({ isOpen, onClose }) => {
    const { players, updateUserStatus, updateUserRole, currentUser } = useStore();

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Shield className="text-neon-green" size={24} />
                                Gestión de Usuarios
                            </h2>
                            <p className="text-slate-400 text-sm mt-1">Administra permisos y accesos.</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                            <X className="text-slate-400" size={24} />
                        </button>
                    </div>

                    {/* User List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {players.map((player) => (
                            <div
                                key={player.id}
                                className={`flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl border ${player.status === 'blocked' ? 'bg-red-500/5 border-red-500/20' : 'bg-slate-800/50 border-slate-700/50'} transition-colors`}
                            >
                                {/* User Info */}
                                <div className="flex items-center gap-4 w-full sm:w-auto mb-4 sm:mb-0">
                                    <div className="relative">
                                        {player.photo ? (
                                            <img src={player.photo} alt={player.alias} className="w-12 h-12 rounded-full object-cover border-2 border-slate-600" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-600">
                                                <span className="text-slate-400 font-bold text-lg">{player.alias?.charAt(0).toUpperCase()}</span>
                                            </div>
                                        )}
                                        {player.role === 'admin' && (
                                            <div className="absolute -top-1 -right-1 bg-neon-green text-slate-900 rounded-full p-0.5 border border-slate-900">
                                                <Shield size={12} fill="currentColor" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-left">
                                        <h3 className={`font-bold ${player.status === 'blocked' ? 'text-slate-500 line-through' : 'text-white'}`}>
                                            {player.alias}
                                        </h3>
                                        <p className="text-xs text-slate-500">{player.email || 'Sin email'}</p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                    {/* Role Toggle */}
                                    {/* Prevent demoting self */}
                                    <button
                                        onClick={() => {
                                            if (player.id === currentUser?.id) return;
                                            updateUserRole(player.id, player.role === 'admin' ? 'user' : 'admin');
                                        }}
                                        disabled={player.id === currentUser?.id}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${player.role === 'admin'
                                                ? 'bg-neon-green/10 text-neon-green hover:bg-neon-green/20'
                                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                            }`}
                                    >
                                        {player.role === 'admin' ? (
                                            <>
                                                <ShieldOff size={14} /> Admin
                                            </>
                                        ) : (
                                            <>
                                                <Shield size={14} /> User
                                            </>
                                        )}
                                    </button>

                                    {/* Block Toggle */}
                                    <button
                                        onClick={() => {
                                            if (player.id === currentUser?.id) return;
                                            updateUserStatus(player.id, player.status === 'blocked' ? 'active' : 'blocked');
                                        }}
                                        disabled={player.id === currentUser?.id}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${player.status === 'blocked'
                                                ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                            }`}
                                    >
                                        {player.status === 'blocked' ? (
                                            <>
                                                <Unlock size={14} /> Bloqueado
                                            </>
                                        ) : (
                                            <>
                                                <Lock size={14} /> Bloquear
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default UserManagementModal;
