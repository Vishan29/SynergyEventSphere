import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LoginResponse, UserSummary } from '@/api/types';

interface AuthState {
  token: string | null;
  expiresAt: string | null;
  issuedAt: string | null;
  user: UserSummary | null;
  hydrated: boolean;
  setSession: (session: LoginResponse) => void;
  setUser: (user: UserSummary) => void;
  clear: () => void;
  isAuthenticated: () => boolean;
  isExpired: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      expiresAt: null,
      issuedAt: null,
      user: null,
      hydrated: false,
      setSession: (session) => {
        // Mirror token + expiry into raw localStorage keys for the
        // axios interceptor (which can't subscribe to Zustand).
        localStorage.setItem('ses.auth.token', session.token);
        localStorage.setItem('ses.auth.expiresAt', session.expiresAt);
        set({
          token: session.token,
          expiresAt: session.expiresAt,
          issuedAt: session.issuedAt,
          user: session.user,
        });
      },
      setUser: (user) => set({ user }),
      clear: () => {
        localStorage.removeItem('ses.auth.token');
        localStorage.removeItem('ses.auth.expiresAt');
        set({ token: null, expiresAt: null, issuedAt: null, user: null });
      },
      isAuthenticated: () => {
        const { token, expiresAt } = get();
        if (!token || !expiresAt) return false;
        return new Date(expiresAt).getTime() > Date.now();
      },
      isExpired: () => {
        const { expiresAt } = get();
        if (!expiresAt) return true;
        return new Date(expiresAt).getTime() <= Date.now();
      },
    }),
    {
      name: 'ses.auth',
      partialize: (state) => ({
        token: state.token,
        expiresAt: state.expiresAt,
        issuedAt: state.issuedAt,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Keep raw keys (used by axios interceptor) in sync after a
          // page reload re-hydrates the Zustand store from storage.
          if (state.token) {
            localStorage.setItem('ses.auth.token', state.token);
          }
          if (state.expiresAt) {
            localStorage.setItem('ses.auth.expiresAt', state.expiresAt);
          }
        }
        useAuthStore.setState({ hydrated: true });
      },
    },
  ),
);
