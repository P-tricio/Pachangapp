import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import FootballFieldIcon from '../components/ui/FootballFieldIcon';

// Import local avatars
import avatarStriker from '../assets/avatars/avatar_striker.png';
import avatarMidfielder from '../assets/avatars/avatar_midfielder.png';
import avatarDefender from '../assets/avatars/avatar_defender.png';
import avatarStreet from '../assets/avatars/avatar_street.png';

const AVATARS = [avatarStriker, avatarMidfielder, avatarDefender, avatarStreet];

const getRandomAvatar = () => {
    const randomIndex = Math.floor(Math.random() * AVATARS.length);
    return AVATARS[randomIndex];
};

const Login = () => {
    const { loginWithGoogle, loginWithEmail, user } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Protection against race condition:
    // If we are actively logging in, we don't want the useEffect to redirect prematurely.
    // We want the handler to finish creating the profile FIRST, then redirect manually.
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Redirect handled by AppContent to avoid loops with missing profiles
    // BUT we also want to redirect if user visits /login while already auth'd
    useEffect(() => {
        if (user && !isSubmitting) {
            navigate('/');
        }
    }, [user, isSubmitting, navigate]);


    const handleGoogleLogin = async () => {
        setIsSubmitting(true); // Block auto-redirect
        try {
            const user = await loginWithGoogle();

            if (!user) {
                console.error("No user result from Google Login");
                setIsSubmitting(false); // Reset if cancelled
                return;
            }

            // Check if user profile exists
            const docRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                // Create Profile for Google User
                await setDoc(docRef, {
                    id: user.uid,
                    name: user.displayName,
                    alias: user.displayName, // Start with google name
                    realName: user.displayName,
                    email: user.email,
                    photo: user.photoURL || getRandomAvatar(), // Use Google Photo or Random Avatar
                    nationality: 'es',
                    position: 'MED',
                    role: 'user',
                    status: 'active', // Default status
                    attributes: { rit: 50, tir: 50, pas: 50, reg: 50, def: 50, fis: 50 },
                    stats: { mp: 0, goals: 0, assists: 0, mvp: 0 },
                    averageRating: 5.0
                });
            }

            // Manual Redirect after profile ensures readiness
            navigate('/');

        } catch (error) {
            console.error("Login failed", error);
            const errorMessage = error.code === 'auth/popup-blocked'
                ? "El navegador bloqueó el popup. Permite ventanas emergentes."
                : `Error al iniciar sesión: ${error.code || 'Error desconocido'}`;
            setError(errorMessage);
            setIsSubmitting(false);
        }
    };

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        setIsSubmitting(true); // Block auto-redirect

        try {
            const userCredential = await loginWithEmail(email, password);
            const user = userCredential.user;

            // Small delay to ensure Auth state is fully propagated
            await new Promise(resolve => setTimeout(resolve, 500));

            // Check if user profile exists (Self-Repair for Email Users)
            const docRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                console.log("Profile missing for email user. Recreating...");
                await setDoc(docRef, {
                    id: user.uid,
                    name: user.displayName || 'Jugador',
                    alias: user.displayName || 'Jugador',
                    realName: user.displayName || 'Jugador',
                    email: user.email,
                    photo: user.photoURL || getRandomAvatar(),
                    nationality: 'es',
                    position: 'MED',
                    role: 'user',
                    status: 'active',
                    attributes: { rit: 50, tir: 50, pas: 50, reg: 50, def: 50, fis: 50 },
                    stats: { mp: 0, goals: 0, assists: 0, mvp: 0 },
                    averageRating: 5.0
                });
            }

            navigate('/');

        } catch (err) {
            console.error(err);
            setError("Credenciales incorrectas o error en el servidor");
            setLoading(false);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
            {/* FOOTBALL FIELD ICON */}
            {/* FOOTBALL FIELD ICON */}
            <FootballFieldIcon className="mb-8 w-32 h-48" />

            <h1 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase italic">
                Pachang<span className="text-neon-green">App</span>
            </h1>
            <p className="text-slate-400 mb-8 max-w-xs mx-auto">
                Gestiona tus partidos, vota al MVP y domina el ranking.
            </p>

            {error && <div className="bg-red-500/10 text-red-500 p-3 rounded-lg mb-4 text-xs font-bold w-full max-w-sm">{error}</div>}

            {/* EMAIL FORM */}
            <form onSubmit={handleEmailLogin} className="w-full max-w-sm space-y-3 mb-6">
                <input
                    type="email"
                    placeholder="Correo Electrónico"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-neon-green placeholder-slate-500"
                />
                <input
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-neon-green placeholder-slate-500"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-neon-green text-slate-900 font-bold py-3 rounded-xl hover:bg-neon-green/90 transition-all active:scale-95 shadow-lg"
                >
                    {loading ? 'Entrando...' : 'Iniciar Sesión'}
                </button>
            </form>

            {/* DIVIDER */}
            <div className="flex items-center space-x-2 mb-6 w-full max-w-sm">
                <div className="h-px bg-slate-700 flex-1"></div>
                <span className="text-slate-500 text-xs">O continúa con</span>
                <div className="h-px bg-slate-700 flex-1"></div>
            </div>

            <button
                onClick={handleGoogleLogin}
                className="w-full max-w-sm bg-white text-slate-900 font-bold py-3 rounded-xl flex items-center justify-center space-x-3 hover:bg-gray-100 transition-all active:scale-95 border border-slate-200"
            >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                <span>Entrar con Google</span>
            </button>

            <div className="mt-8 text-slate-500 text-sm">
                ¿Aún no juegas? <Link to="/register" className="text-white underline hover:text-neon-green">Regístrate aquí</Link>
            </div>
        </div>
    );
};

export default Login;
