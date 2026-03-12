import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/common/Layout';
import Dashboard from './pages/Dashboard';
import DeparturesList from './pages/DeparturesList';
import DepartureDetail from './pages/DepartureDetail';
import InterviewSession from './pages/InterviewSession';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import KnowledgeBase from './pages/KnowledgeBase';
import FlightRisk from './pages/FlightRisk';
import Login from './pages/Login';
import Landing from './pages/Landing';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/departures" element={<ProtectedRoute><Layout><DeparturesList /></Layout></ProtectedRoute>} />
      <Route path="/departures/:id" element={<ProtectedRoute><Layout><DepartureDetail /></Layout></ProtectedRoute>} />
      <Route path="/interviews/:id" element={<ProtectedRoute><Layout><InterviewSession /></Layout></ProtectedRoute>} />
      <Route path="/knowledge" element={<ProtectedRoute><Layout><KnowledgeBase /></Layout></ProtectedRoute>} />
      <Route path="/risk-map" element={<ProtectedRoute><Layout><FlightRisk /></Layout></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><Layout><Analytics /></Layout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
