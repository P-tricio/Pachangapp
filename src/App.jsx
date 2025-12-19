import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider, useStore } from './context/StoreContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useLocation } from 'react-router-dom';
import { Ban } from 'lucide-react';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Rankings from './pages/Rankings';
import History from './pages/History';
import Profile from './pages/Profile';
import Vote from './pages/Vote';
import MatchDetails from './pages/MatchDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminUsers from './pages/AdminUsers';

const BlockedView = () => (
  <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
    <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
      <Ban size={48} className="text-red-500" />
    </div>
    <h1 className="text-3xl font-black text-white mb-2 uppercase italic">Cuenta Bloqueada</h1>
    <p className="text-slate-400 mb-8 max-w-xs mx-auto text-sm">
      Tu acceso a la plataforma ha sido suspendido por un administrador.
    </p>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AppContent = () => {
  const { currentUser, playersLoading } = useStore();
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();

  // 1. Initial Loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-neon-green"></div>
      </div>
    );
  }

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  // 2. Logged in but profile loading (only block if authenticated)
  if (user && playersLoading && !isAuthPage) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-neon-green"></div>
      </div>
    );
  }

  // 3. User logged in but profile missing (Reset case) -> Go to Auth to recreate/register
  if (user && !currentUser && !playersLoading && !isAuthPage) {
    return <Navigate to="/login" replace />;
  }

  // 4. Fully logged in and profile exists -> Don't stay on Login/Register
  if (user && currentUser && isAuthPage) {
    return <Navigate to="/" replace />;
  }

  // 5. Blocked user
  if (currentUser?.status === 'blocked') {
    return <BlockedView />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Main Layout Routes (With Bottom Bar) */}
      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<Home />} />
        <Route path="rankings" element={<Rankings />} />
        <Route path="history" element={<History />} />
        <Route path="profile/:id?" element={<Profile />} />
        <Route path="match" element={<MatchDetails />} />
        <Route path="admin/users" element={<AdminUsers />} />
      </Route>

      {/* Standalone Routes (Fullscreen) */}
      <Route path="/vote" element={<ProtectedRoute><Vote /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </StoreProvider>
    </AuthProvider>
  );
}

export default App;
