import { useEffect, useState } from 'react';
import { TimerReset } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const WARN_THRESHOLD_MS = 5 * 60 * 1000;

// Surfaces when the access token is within 5 minutes of expiry so the
// user can re-authenticate before being kicked out mid-action.
export function SessionExpiryBanner() {
  const expiresAt = useAuthStore((s) => s.expiresAt);
  const { signOut } = useAuth();
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!expiresAt) return;
    const timer = window.setInterval(() => setTick((n) => n + 1), 30_000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  if (!expiresAt) return null;
  const msLeft = new Date(expiresAt).getTime() - Date.now();
  if (msLeft <= 0) return null;
  if (msLeft > WARN_THRESHOLD_MS) return null;
  const minutes = Math.max(1, Math.round(msLeft / 60_000));

  return (
    <div className="border-b bg-amber-500/15 text-amber-900 dark:text-amber-200">
      <div className="container flex flex-col items-start gap-2 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2">
          <TimerReset className="h-4 w-4" />
          Your session expires in about {minutes} minute{minutes === 1 ? '' : 's'}.
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => signOut({ silent: true })}
        >
          Sign in again
        </Button>
      </div>
    </div>
  );
}
