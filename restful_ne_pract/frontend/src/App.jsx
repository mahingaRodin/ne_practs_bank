import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import OtpPage from './pages/OtpPage';
import DashboardPage from './pages/DashboardPage';
import ParkingsPage from './pages/ParkingsPage';
import RegisterParkingPage from './pages/RegisterParkingPage';
import CarEntryPage from './pages/CarEntryPage';
import CarExitPage from './pages/CarExitPage';
import EntriesPage from './pages/EntriesPage';
import OutgoingReportPage from './pages/OutgoingReportPage';
import EnteredReportPage from './pages/EnteredReportPage';
import UsersPage from './pages/UsersPage';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/verify-otp" element={<PublicRoute><OtpPage /></PublicRoute>} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="parkings" element={<ParkingsPage />} />
        <Route path="parkings/register" element={<ProtectedRoute adminOnly><RegisterParkingPage /></ProtectedRoute>} />
        <Route path="entries" element={<EntriesPage />} />
        <Route path="entries/new" element={<CarEntryPage />} />
        <Route path="entries/exit" element={<CarExitPage />} />
        <Route path="reports/outgoing" element={<ProtectedRoute adminOnly><OutgoingReportPage /></ProtectedRoute>} />
        <Route path="reports/entered" element={<ProtectedRoute adminOnly><EnteredReportPage /></ProtectedRoute>} />
        <Route path="users" element={<ProtectedRoute adminOnly><UsersPage /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
