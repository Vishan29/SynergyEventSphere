import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { parseLocalDateTime, relativeTime } from '@/lib/dates';

interface CountdownProps {
  dateTime: string | null | undefined;
}

// Lightweight ticker that re-renders the relative-time string every
// 30s so "starts in X" stays current without external state libraries.
export function Countdown({ dateTime }: CountdownProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((n) => n + 1), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const d = parseLocalDateTime(dateTime);
  if (!d) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
      <Clock className="h-3.5 w-3.5" />
      {relativeTime(dateTime)}
    </span>
  );
}
