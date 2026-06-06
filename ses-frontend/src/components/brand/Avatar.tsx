import { AvatarFallback, AvatarRoot } from '@/components/ui/avatar';
import { initials } from '@/lib/initials';
import { cn } from '@/lib/cn';

interface AvatarProps {
  name: string | null | undefined;
  className?: string;
}

export function Avatar({ name, className }: AvatarProps) {
  return (
    <AvatarRoot className={cn('h-9 w-9', className)}>
      <AvatarFallback>{initials(name)}</AvatarFallback>
    </AvatarRoot>
  );
}
