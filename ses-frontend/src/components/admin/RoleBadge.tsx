import { Badge } from '@/components/ui/badge';
import type { Role } from '@/api/types';

interface RoleBadgeProps {
  role: Role;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  switch (role) {
    case 'ADMIN':
      return <Badge variant="warning">Admin</Badge>;
    case 'ORGANIZER':
      return <Badge variant="info">Organizer</Badge>;
    case 'USER':
    default:
      return <Badge variant="muted">User</Badge>;
  }
}
