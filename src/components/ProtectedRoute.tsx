import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'customer' | 'restaurant_owner' | 'admin'>;
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, userRole, loading, roleLoading } = useAuth();
  const navigate = useNavigate();
  const [stalled, setStalled] = useState(false);
  const [roleTimedOut, setRoleTimedOut] = useState(false);

  useEffect(() => {
    if (!loading && !(allowedRoles && roleLoading)) {
      setStalled(false);
      setRoleTimedOut(false);
      return;
    }
    const t = setTimeout(() => setStalled(true), 12000);
    const rt = setTimeout(() => setRoleTimedOut(true), 10000);
    return () => {
      clearTimeout(t);
      clearTimeout(rt);
    };
  }, [loading, roleLoading, allowedRoles]);

  if (loading || (allowedRoles && roleLoading && !roleTimedOut)) {
    return (
      <div className="h-full w-full bg-[#F5F5F7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#536DFE]/30 border-t-[#536DFE] rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Loading...</p>
          {stalled && (
            <button
              onClick={() => navigate('/auth', { replace: true })}
              className="text-xs text-[#536DFE] font-semibold underline mt-2"
            >
              Taking too long? Sign in again
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    if (userRole === 'admin') return <Navigate to="/admin" replace />;
    if (userRole === 'restaurant_owner') return <Navigate to="/dashboard" replace />;
    return <Navigate to="/home" replace />;
  }

  if (allowedRoles && !userRole) {
    if (user) return <Navigate to="/auth" replace />;
    return <Navigate to="/home" replace />;
  }

  if (!allowedRoles && userRole === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
