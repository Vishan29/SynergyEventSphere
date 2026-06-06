import { Badge } from '@/components/ui/badge';
import type { EventStatus } from '@/api/types';
import { effectiveStatus } from '@/lib/dates';

interface EventStatusBadgeProps {
  status: EventStatus;
  dateTime?: string | null;
}

export function EventStatusBadge({ status, dateTime }: EventStatusBadgeProps) {
  const eff = effectiveStatus(status, dateTime);
  switch (eff) {
    case 'CANCELLED':
      return <Badge variant="destructive">Cancelled</Badge>;
    case 'COMPLETED':
      return <Badge variant="muted">Completed</Badge>;
    case 'SCHEDULED':
    default:
      return <Badge variant="info">Scheduled</Badge>;
  }
}
