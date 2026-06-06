import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { cn } from '@/lib/cn';

interface WordmarkProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  asLink?: boolean;
  to?: string;
}

const sizes = {
  sm: { logo: 24, text: 'text-base' },
  md: { logo: 32, text: 'text-lg' },
  lg: { logo: 44, text: 'text-2xl' },
};

export function Wordmark({
  className,
  size = 'md',
  asLink = true,
  to = '/',
}: WordmarkProps) {
  const s = sizes[size];
  const inner = (
    <div className={cn('flex items-center gap-2', className)}>
      <Logo size={s.logo} />
      <span className={cn('font-bold tracking-tight', s.text)}>
        <span className="text-primary">Synergy</span>
        <span className="text-foreground">EventSphere</span>
      </span>
    </div>
  );

  if (!asLink) return inner;
  return (
    <Link to={to} className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {inner}
    </Link>
  );
}
