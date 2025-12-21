import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { updateProfile } from 'firebase/auth';
import { db } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore';

// Generic Football Avatar (Placeholder)
const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/166/166344.png';

const Register = () => {
    const { registerWithEmail } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [alias, setAlias] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!email || !password || !alias) {
            setError('Por favor, rellena todos los campos.');
            setLoading(false);
            return;
        }

        try {
            const userCredential = await registerWithEmail(email, password);
            const user = userCredential.user;

            // 1. Update Auth Profile
            await updateProfile(user, {
                displayName: alias
            });

            // Small delay to ensure Auth state is fully propagated to Firestore
            await new Promise(resolve => setTimeout(resolve, 500));

            // 2. Create Firestore Document (User Profile)
            const userData = {
                id: user.uid,
                name: alias,
                alias: alias,
                realName: alias,
                email: user.email || email,
                photo: DEFAULT_AVATAR,
                nationality: 'es',
                position: 'MED',
                role: 'user',
                status: 'active',
                attributes: { rit: 50, tir: 50, pas: 50, reg: 50, def: 50, fis: 50 },
                stats: { mp: 0, goals: 0, assists: 0, mvp: 0 },
                averageRating: 5.0,
                leagues: {} // Initialize empty leagues map
            };

            await setDoc(doc(db, 'users', user.uid), userData);

            navigate('/join-league');
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setError('Este correo ya está registrado. Por favor, inicia sesión.');
            } else {
                setError('Error al registrarse: ' + err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
            <h1 className="text-3xl font-black text-white mb-2 tracking-tighter uppercase italic">
                Únete al <span className="text-neon-green">Equipo</span>
            </h1>
            <p className="text-slate-400 mb-8 max-w-xs mx-auto text-sm">
                Crea tu perfil de jugador y empieza a competir.
            </p>

            {error && <div className="bg-red-500/10 text-red-500 p-3 rounded-lg mb-4 text-xs font-bold">{error}</div>}

            <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
                <div>
                    <input
                        type="text"
                        placeholder="Alias (Nombre de Jugador)"
                        value={alias}
                        onChange={(e) => setAlias(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-neon-green placeholder-slate-500"
                    />
                </div>
                <div>
                    <input
                        type="email"
                        placeholder="Correo Electrónico"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-neon-green placeholder-slate-500"
                    />
                </div>
                <div>
                    <input
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-neon-green placeholder-slate-500"
                    />
                </div>

                <button
                    disabled={loading}
                    type="submit"
                    className="w-full bg-neon-green text-slate-900 font-bold py-4 rounded-xl hover:bg-neon-green/90 transition-all active:scale-95 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                >
                    {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                </button>
            </form>

            <div className="mt-8 text-slate-500 text-sm">
                ¿Ya tienes cuenta? <Link to="/login" className="text-white underline hover:text-neon-green">Inicia Sesión</Link>
            </div>
        </div>
    );
};

export default Register;
