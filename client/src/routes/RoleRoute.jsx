import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Restricts to specific roles. Redirects others to their home. */
export default function RoleRoute({ roles, children }) {
  const { user } = useAuth();
  const allowed = Array.isArray(roles) ? roles : [roles];

  if (!user) return <Navigate to="/login" replace />;
  if (!allowed.includes(user.role)) {
    const home = user.role === 'architect' ? '/architect/dashboard' : '/dashboard';
    return <Navigate to={home} replace />;
  }
  return children;
}
