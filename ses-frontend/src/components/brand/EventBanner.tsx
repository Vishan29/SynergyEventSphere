import { CalendarDays } from 'lucide-react';
import { eventGradient } from '@/lib/banner';
import { cn } from '@/lib/cn';

interface EventBannerProps {
  seed: string | number;
  title?: string;
  className?: string;
}

// Renders a deterministic gradient banner (no image upload backend),
// with the event title overlaid for readable framing.
export function EventBanner({ seed, title, className }: EventBannerProps) {
  const gradient = eventGradient(String(seed));
  return (
    <div
      className={cn(
        'relative flex aspect-[16/7] w-full items-end overflow-hidden rounded-t-2xl p-4 text-white',
        className,
      )}
      style={{ backgroundImage: gradient }}
      aria-hidden={!title}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      <div className="absolute right-3 top-3 rounded-full bg-white/20 p-2 backdrop-blur">
        <CalendarDays className="h-4 w-4" />
      </div>
      {title ? (
        <span className="relative line-clamp-2 text-lg font-semibold leading-tight drop-shadow">
          {title}
        </span>
      ) : null}
    </div>
  );
}
