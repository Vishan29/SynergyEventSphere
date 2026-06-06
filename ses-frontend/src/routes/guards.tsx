import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, roleHomePath } from '@/hooks/useAuth';
import type { Role } from '@/api/types';

interface RequireAuthProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  }
  return <>{children}</>;
}

interface RequireRoleProps {
  roles: Role[];
  children: ReactNode;
}

export function RequireRole({ roles, children }: RequireRoleProps) {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  }
  if (!role || !roles.includes(role)) {
    return <Navigate to="/forbidden" replace />;
  }
  return <>{children}</>;
}

export function RoleHomeRedirect() {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return <Navigate to="/events" replace />;
  return <Navigate to={roleHomePath(role)} replace />;
}

export function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { isAuthenticated, role } = useAuth();
  if (isAuthenticated) return <Navigate to={roleHomePath(role)} replace />;
  return <>{children}</>;
}
