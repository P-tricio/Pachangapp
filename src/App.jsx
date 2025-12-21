import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { StoreProvider, useStore } from './context/StoreContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useLocation } from 'react-router-dom';
import { Ban } from 'lucide-react';
import MainLayout from './layouts/MainLayout';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Rankings from './pages/Rankings';
import History from './pages/History';
import Profile from './pages/Profile';
import Vote from './pages/Vote';
import MatchDetails from './pages/MatchDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminUsers from './pages/AdminUsers';
import JoinLeague from './pages/JoinLeague';
import SuperAdminDashboard from './pages/SuperAdminDashboard';

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
  const { currentUser, userProfile, playersLoading, isSuperAdmin, setCurrentLeagueId } = useStore();
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // 1. Logic Helpers
  const isExcludedPath = location.pathname === '/join-league' || location.pathname === '/super-admin' || location.pathname === '/create-league';
  const hasLeagues = userProfile?.leagues && Object.keys(userProfile.leagues).length > 0;
  // Wait, useNavigate is NOT in AppContent scope in original file? 
  // Line 41: const AppContent = () => { ... }
  // Line 3 imported `useNavigate`? No, Line 3 imports `StoreProvider`.
  // Line 2 imports `Navigate` (component).
  // I need to add `useNavigate` to imports and use it in `AppContent` because `Navigate` component return within Effect is not possible (Effect returns cleanup fn).
  // Actually, I can render <Navigate /> in the return statements IF I do it in render logic.
  // But purely side-effect logic (setting state) is better in Effect.
  // Let's stick to Conditional Rendering for the Redirect (return <Navigate ... />).
  // And Effect for the State Update (setCurrentLeagueId).

  // Revised approach for simpler React:
  // 5. Global Profile exists, but USER HAS NO LEAGUES -> Redirect to Join
  // 6. User HAS leagues but Invalid Context (Ghost User) -> Auto-switch to first league
  // This is a side-effect (state update), cannot be done in render.
  React.useEffect(() => {
    if (user && userProfile && !playersLoading && hasLeagues && !currentUser) {
      const firstLeagueId = Object.keys(userProfile.leagues)[0];
      console.log("[App] Auto-switching to league:", firstLeagueId);
      setCurrentLeagueId(firstLeagueId);
    }
  }, [user, userProfile, playersLoading, hasLeagues, currentUser, setCurrentLeagueId]);

  if (user && userProfile && !playersLoading && !hasLeagues && !isExcludedPath && !isSuperAdmin) {
    return <Navigate to="/join-league" replace />;
  }

  // 5. Blocked user (Check global status)
  if (userProfile?.status === 'blocked') {
    return <BlockedView />;
  }

  return (
    <>
      <ScrollToTop />
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
        <Route path="/join-league" element={<ProtectedRoute><JoinLeague /></ProtectedRoute>} />
        <Route path="/super-admin" element={<ProtectedRoute><SuperAdminDashboard /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
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
