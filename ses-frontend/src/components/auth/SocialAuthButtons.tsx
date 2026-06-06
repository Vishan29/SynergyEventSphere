import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Provider = 'google' | 'microsoft' | 'facebook';

const OAUTH_ENABLED = import.meta.env.VITE_OAUTH_ENABLED === 'true';

const providerLabel: Record<Provider, string> = {
  google: 'Google',
  microsoft: 'Microsoft',
  facebook: 'Facebook',
};

function ProviderIcon({ provider }: { provider: Provider }) {
  // Lightweight inline marks so we don't depend on any external assets.
  if (provider === 'google') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <path
          fill="#EA4335"
          d="M12 11v3.2h5.4c-.2 1.4-.9 2.6-2 3.4l3.3 2.5c1.9-1.8 3-4.4 3-7.5 0-.7-.1-1.4-.2-2.1H12z"
        />
        <path
          fill="#34A853"
          d="M5.5 14.3l-1 .8L1 18c1.7 3 4.7 5 8.4 5 2.7 0 5-1 6.7-2.6l-3.3-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.7-5.6-4z"
        />
        <path fill="#FBBC05" d="M1 6L4.5 8.7C5.4 6.3 7.5 4.7 10 4.7c1.4 0 2.6.5 3.6 1.4L16.5 3.3C14.7 1.7 12.4 1 10 1 6.3 1 3.3 3 1.6 6L1 6z" />
        <path
          fill="#4285F4"
          d="M22 12c0-.7-.1-1.4-.2-2.1H12V14h5.5c-.2 1.5-.9 2.7-2 3.5l3.3 2.5C20.9 18.2 22 15.3 22 12z"
        />
      </svg>
    );
  }
  if (provider === 'microsoft') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <rect width="10" height="10" x="2" y="2" fill="#F35325" />
        <rect width="10" height="10" x="12" y="2" fill="#81BC06" />
        <rect width="10" height="10" x="2" y="12" fill="#05A6F0" />
        <rect width="10" height="10" x="12" y="12" fill="#FFBA08" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#1877F2"
        d="M22 12a10 10 0 10-11.6 9.9V15h-2.5v-3h2.5V9.6c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5H15c-1.2 0-1.6.7-1.6 1.5V12H16l-.4 3h-2.2v6.9A10 10 0 0022 12z"
      />
    </svg>
  );
}

export function SocialAuthButtons() {
  const [openProvider, setOpenProvider] = useState<Provider | null>(null);

  const handleClick = (provider: Provider) => {
    if (OAUTH_ENABLED) {
      // Future-proofed entry point: when the backend exposes
      // /api/auth/oauth/<provider>/callback returning a LoginResponse,
      // redirect here. Keeps UI behavior stable across the rollout.
      window.location.assign(`/api/auth/oauth/${provider}`);
      return;
    }
    setOpenProvider(provider);
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {(['google', 'microsoft', 'facebook'] as Provider[]).map((p) => (
          <Button
            key={p}
            variant="outline"
            type="button"
            onClick={() => handleClick(p)}
            aria-label={`Continue with ${providerLabel[p]}`}
            className="bg-muted text-foreground hover:bg-muted/70 dark:bg-muted/60 dark:hover:bg-muted"
          >
            <ProviderIcon provider={p} />
            <span className="hidden sm:inline">{providerLabel[p]}</span>
          </Button>
        ))}
      </div>

      <Dialog
        open={openProvider !== null}
        onOpenChange={(open) => !open && setOpenProvider(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Social sign-in is coming soon</DialogTitle>
            <DialogDescription>
              SynergyEventSphere doesn't support
              {openProvider ? ` ${providerLabel[openProvider]} ` : ' '}
              sign-in just yet. For now, please use email and password — we'll
              flip this on the moment our backend exposes the OAuth callback.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
