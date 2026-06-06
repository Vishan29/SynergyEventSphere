import { Badge } from '@/components/ui/badge';
import type { BookingStatus } from '@/api/types';

interface BookingStatusBadgeProps {
  status: BookingStatus;
}

export function BookingStatusBadge({ status }: BookingStatusBadgeProps) {
  if (status === 'BOOKED') return <Badge variant="success">Booked</Badge>;
  return <Badge variant="muted">Cancelled</Badge>;
}
