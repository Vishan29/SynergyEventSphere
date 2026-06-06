import { cn } from '@/lib/cn';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  indicatorClassName?: string;
  ariaLabel?: string;
}

export function Progress({
  value,
  max = 100,
  className,
  indicatorClassName,
  ariaLabel,
}: ProgressProps) {
  const safeMax = max > 0 ? max : 1;
  const pct = Math.max(0, Math.min(100, (value / safeMax) * 100));
  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn(
        'h-2 w-full overflow-hidden rounded-full bg-secondary',
        className,
      )}
    >
      <div
        className={cn('h-full rounded-full bg-brand-gradient', indicatorClassName)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
