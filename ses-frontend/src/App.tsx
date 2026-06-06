import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { router } from '@/routes/router';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { registerUnauthorizedHandler } from '@/api/client';
import { useAuthStore } from '@/stores/auth.store';
import { useThemeStore } from '@/stores/theme.store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    // The axios interceptor calls this when the API returns 401.
    // Clearing the auth store triggers route guards to redirect.
    registerUnauthorizedHandler(() => {
      const { token, clear } = useAuthStore.getState();
      if (token) {
        clear();
        // Use replace so the back button doesn't bounce to a 401-ed page.
        const target = '/login?expired=1';
        if (window.location.pathname !== '/login') {
          window.location.replace(target);
        }
      }
    });
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster
          richColors
          position="top-right"
          theme={theme}
          closeButton
        />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
