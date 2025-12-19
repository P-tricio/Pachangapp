import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider, useStore } from './context/StoreContext';
import { AuthProvider } from './context/AuthContext';
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
    <h1 className="text-3xl font-black text-white mb-2 uppercase">Cuenta Bloqueada</h1>
    <p className="text-slate-400 mb-8 max-w-xs mx-auto">
      Tu acceso a la plataforma ha sido suspendido por un administrador.
    </p>
    <div className="text-xs text-slate-600 font-mono">
      Contacta con el admin para más info.
    </div>
  </div>
);

const AppContent = () => {
  const { currentUser } = useStore();

  if (currentUser?.status === 'blocked') {
    return <BlockedView />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Main Layout Routes (With Bottom Bar) */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="rankings" element={<Rankings />} />
        <Route path="history" element={<History />} />
        <Route path="profile/:id?" element={<Profile />} />
        <Route path="match" element={<MatchDetails />} />
        <Route path="admin/users" element={<AdminUsers />} />
      </Route>

      {/* Standalone Routes (Fullscreen) */}
      <Route path="/vote" element={<Vote />} />

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
