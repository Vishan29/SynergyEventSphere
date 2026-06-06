import { Wordmark } from '@/components/brand/Wordmark';

export function Footer() {
  return (
    <footer className="border-t bg-background/60">
      <div className="container flex flex-col items-start justify-between gap-3 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center">
        <Wordmark size="sm" />
        <p>© {new Date().getFullYear()} SynergyEventSphere. Where events come together.</p>
      </div>
    </footer>
  );
}
