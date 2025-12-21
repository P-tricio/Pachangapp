import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ArrowRight, Loader2 } from 'lucide-react';
import FootballFieldIcon from '../components/ui/FootballFieldIcon';

const JoinLeague = () => {
    const { joinLeague } = useStore();
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleJoin = async (e) => {
        e.preventDefault();
        setError(null);
        if (!code.trim()) return;

        setLoading(true);
        try {
            await joinLeague(code.trim().toUpperCase());
            // Success assumes page reload or redirect handled by joinLeague or below
            // Since joinLeague mostly updates state, we might want to redirect HOME manually if it doesn't reload
            navigate('/');
        } catch (err) {
            console.error(err);
            setError(err.message || "Error al unirse a la liga.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 section-padding flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <div className="flex justify-center mb-6">
                        <FootballFieldIcon className="w-20 h-28" />
                    </div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight">
                        Unirse a una <span className="text-neon-green">Liga</span>
                    </h1>
                    <p className="text-slate-400">
                        Introduce el código de invitación que te ha dado el administrador.
                    </p>
                </div>

                <Card className="bg-slate-800/50 border-slate-700 p-6">
                    <form onSubmit={handleJoin} className="space-y-6">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                                Código de Invitación
                            </label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                placeholder="EJ: X7K9P2"
                                className="w-full bg-slate-900 border-2 border-slate-700 focus:border-neon-green text-center text-2xl font-black text-white rounded-xl py-4 tracking-[0.5em] focus:outline-none transition-colors placeholder:text-slate-700 uppercase"
                                maxLength={8}
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm font-bold text-center animate-pulse">
                                {error}
                            </div>
                        )}

                        <Button
                            variant="primary"
                            className="w-full py-4 text-lg shadow-lg shadow-neon-green/20"
                            disabled={loading || code.length < 3}
                        >
                            {loading ? (
                                <Loader2 className="animate-spin mx-auto" />
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    ENTRAR EN LIGA <ArrowRight size={20} />
                                </span>
                            )}
                        </Button>
                    </form>
                </Card>

                <button
                    onClick={async () => {
                        await logout();
                        navigate('/login');
                    }}
                    className="w-full text-slate-500 text-sm font-bold hover:text-red-500 transition-colors uppercase mt-4"
                >
                    ¿Te has equivocado de cuenta? Cerrar Sesión
                </button>
            </div>
        </div>
    );
};

export default JoinLeague;
