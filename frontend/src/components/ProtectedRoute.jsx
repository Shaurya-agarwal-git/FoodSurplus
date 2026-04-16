import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Spinner = () => (
  <div className="min-h-screen bg-dark-bg flex items-center justify-center">
    <div className="text-center">
      <svg className="animate-spin w-10 h-10 text-primary mx-auto mb-3" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <p className="text-gray-400 text-sm">Loading...</p>
    </div>
  </div>
);

const getDashboard = (role) =>
  role === 'admin' ? '/admin/dashboard' : role === 'donor' ? '/donor/dashboard' : '/receiver/dashboard';

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

export function RequireRole({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!roles.includes(user.role)) return <Navigate to={getDashboard(user.role)} replace />;
  return children;
}

export function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (user) return <Navigate to={getDashboard(user.role)} replace />;
  return children;
}
