import React, { useState } from 'react';
import Card from './ui/Card';
import { Megaphone, X, Save, Eye, EyeOff } from 'lucide-react';

const AnnouncementModal = ({ isOpen, onClose, currentAnnouncement, onSave }) => {
    const [form, setForm] = useState(currentAnnouncement || {
        title: '',
        message: '',
        type: 'info',
        isVisible: false
    });

    if (!isOpen) return null;

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <Card className="w-full max-w-sm bg-slate-900 border-neon-green/30 relative">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-slate-400 hover:text-white"
                >
                    <X size={20} />
                </button>

                <div className="flex items-center space-x-2 text-neon-green mb-6">
                    <Megaphone size={24} />
                    <h3 className="text-xl font-black uppercase italic">Comunicado</h3>
                </div>

                <div className="space-y-4 mb-6">
                    {/* Visibility Toggle */}
                    <div className="flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-slate-700">
                        <span className="text-sm font-bold text-slate-300 uppercase">Visible en Home</span>
                        <button
                            onClick={() => handleChange('isVisible', !form.isVisible)}
                            className={`p-2 rounded-lg transition-colors ${form.isVisible ? 'bg-neon-green text-slate-900' : 'bg-slate-700 text-slate-500'}`}
                        >
                            {form.isVisible ? <Eye size={20} /> : <EyeOff size={20} />}
                        </button>
                    </div>

                    {/* Type Selector */}
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Tipo de Mensaje</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => handleChange('type', 'info')}
                                className={`p-2 rounded-lg text-xs font-bold uppercase transition-colors border ${form.type === 'info' ? 'bg-blue-500/20 border-blue-500 text-blue-500' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                            >
                                Info
                            </button>
                            <button
                                onClick={() => handleChange('type', 'warning')}
                                className={`p-2 rounded-lg text-xs font-bold uppercase transition-colors border ${form.type === 'warning' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                            >
                                Aviso
                            </button>
                            <button
                                onClick={() => handleChange('type', 'urgent')}
                                className={`p-2 rounded-lg text-xs font-bold uppercase transition-colors border ${form.type === 'urgent' ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                            >
                                Urgente
                            </button>
                        </div>
                    </div>

                    {/* Title Input */}
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">Título</label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={e => handleChange('title', e.target.value)}
                            placeholder="EJ: PARTIDO CANCELADO"
                            className="w-full bg-slate-800 border-slate-700 text-white rounded-lg p-3 mt-1 focus:border-neon-green focus:outline-none font-bold placeholder:font-normal placeholder:text-slate-600"
                        />
                    </div>

                    {/* Message Input */}
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">Mensaje</label>
                        <textarea
                            value={form.message}
                            onChange={e => handleChange('message', e.target.value)}
                            placeholder="Detalles del comunicado..."
                            className="w-full bg-slate-800 border-slate-700 text-white rounded-lg p-3 mt-1 focus:border-neon-green focus:outline-none h-24 resize-none placeholder:text-slate-600"
                        />
                    </div>
                </div>

                <button
                    onClick={() => onSave(form)}
                    className="w-full bg-neon-green text-slate-900 font-bold py-3 rounded-xl uppercase tracking-wider flex items-center justify-center space-x-2 hover:bg-neon-green/90 transition-colors"
                >
                    <Save size={18} />
                    <span>Publicar Cambios</span>
                </button>
            </Card>
        </div>
    );
};

export default AnnouncementModal;
