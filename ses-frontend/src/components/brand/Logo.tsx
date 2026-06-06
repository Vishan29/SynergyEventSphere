import { cn } from '@/lib/cn';

interface LogoProps {
  className?: string;
  size?: number;
}

// Three orbiting circles forming a sphere — the SES brand mark.
export function Logo({ className, size = 32 }: LogoProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={cn('shrink-0', className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="ses-logo-grad"
          x1="0"
          y1="0"
          x2="64"
          y2="64"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="55%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#ses-logo-grad)" opacity="0.12" />
      <circle cx="22" cy="26" r="11" stroke="url(#ses-logo-grad)" strokeWidth="3" fill="none" />
      <circle cx="42" cy="26" r="11" stroke="url(#ses-logo-grad)" strokeWidth="3" fill="none" />
      <circle cx="32" cy="42" r="11" stroke="url(#ses-logo-grad)" strokeWidth="3" fill="none" />
    </svg>
  );
}
