import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as auth from '@/api/auth';
import { useAuthStore } from '@/stores/auth.store';
import type { LoginRequest, LoginResponse, Role } from '@/api/types';

export function useAuth() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const session = useAuthStore();

  const signIn = useCallback(
    async (payload: LoginRequest): Promise<LoginResponse> => {
      const result = await auth.login(payload);
      session.setSession(result);
      // Drop any cached server state that belonged to the previous user.
      queryClient.clear();
      return result;
    },
    [session, queryClient],
  );

  const signOut = useCallback(
    async (options?: { silent?: boolean; everywhere?: boolean }) => {
      try {
        if (session.token) {
          if (options?.everywhere) {
            await auth.logoutAll();
          } else {
            await auth.logout();
          }
        }
      } catch {
        // Ignore network errors on logout — local state still cleared.
      }
      session.clear();
      queryClient.clear();
      if (!options?.silent) {
        toast.success(
          options?.everywhere
            ? 'Signed out from all devices'
            : 'Signed out',
        );
      }
      navigate('/login', { replace: true });
    },
    [session, queryClient, navigate],
  );

  return {
    user: session.user,
    token: session.token,
    expiresAt: session.expiresAt,
    isAuthenticated: session.isAuthenticated(),
    role: session.user?.role,
    hasRole: (...roles: Role[]) =>
      !!session.user && roles.includes(session.user.role),
    signIn,
    signOut,
    setUser: session.setUser,
  };
}

export function roleHomePath(role: Role | undefined): string {
  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'ORGANIZER':
      return '/organizer';
    case 'USER':
      return '/events';
    default:
      return '/login';
  }
}
