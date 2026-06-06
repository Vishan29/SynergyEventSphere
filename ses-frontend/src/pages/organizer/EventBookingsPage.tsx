import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Download, Search, Ticket } from 'lucide-react';
import { listBookingsByEvent } from '@/api/bookings';
import { getEvent } from '@/api/events';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Paginator } from '@/components/common/Paginator';
import { EmptyState } from '@/components/common/EmptyState';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import { useUrlState } from '@/hooks/useUrlState';
import { formatLocalDateTime } from '@/lib/dates';
import { downloadCsv, toCsv } from '@/lib/csv';

const defaultState = { page: '0', size: '20', q: '' };

export function EventBookingsPage() {
  const { id } = useParams<{ id: string }>();
  const eventId = Number(id);
  const [state, setState] = useUrlState(defaultState);
  const [exportState, setExportState] = useState<'idle' | 'preparing'>(
    'idle',
  );

  const { data: event } = useQuery({
    queryKey: ['events', eventId],
    queryFn: () => getEvent(eventId),
    enabled: !isNaN(eventId),
  });

  const args = {
    page: Number(state.page) || 0,
    size: Number(state.size) || 20,
    sort: 'bookingTime,desc',
  };

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', 'by-event', eventId, args],
    queryFn: () => listBookingsByEvent(eventId, args),
    enabled: !isNaN(eventId),
    placeholderData: (prev) => prev,
  });

  const filtered = useMemo(() => {
    const q = (state.q ?? '').trim().toLowerCase();
    if (!q) return data?.content ?? [];
    return (data?.content ?? []).filter(
      (b) =>
        b.userName.toLowerCase().includes(q) ||
        String(b.userId).includes(q) ||
        String(b.id).includes(q),
    );
  }, [data, state.q]);

  const handleExport = async () => {
    setExportState('preparing');
    try {
      // Fetch all pages so the CSV reflects the full dataset, not just
      // the current page.
      const pageSize = 200;
      let pageIdx = 0;
      const all: typeof filtered = [];
      // Loop bounded by totalPages + a small safety cap.
      for (let i = 0; i < 20; i += 1) {
        const page = await listBookingsByEvent(eventId, {
          page: pageIdx,
          size: pageSize,
          sort: 'bookingTime,desc',
        });
        all.push(...page.content);
        if (page.last || page.content.length === 0) break;
        pageIdx += 1;
      }
      const csv = toCsv(all, [
        { key: 'id', header: 'Booking ID' },
        { key: 'userId', header: 'Attendee ID' },
        { key: 'userName', header: 'Attendee name' },
        { key: 'status', header: 'Status' },
        { key: 'bookingTime', header: 'Booked at' },
      ]);
      const filename = `bookings-event-${eventId}-${Date.now()}.csv`;
      downloadCsv(filename, csv);
    } finally {
      setExportState('idle');
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <Link
          to="/organizer"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Back to dashboard
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">
          Bookings {event ? `• ${event.title}` : ''}
        </h1>
        <p className="text-muted-foreground">
          {event
            ? `${event.bookedSeats} active of ${event.capacity} capacity`
            : 'Loading…'}
        </p>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Attendees</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={state.q ?? ''}
                onChange={(e) => setState({ q: e.target.value })}
                placeholder="Filter by name…"
                className="w-56 pl-9"
              />
            </div>
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={exportState === 'preparing'}
            >
              <Download />
              {exportState === 'preparing' ? 'Preparing…' : 'Export CSV'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : !data || data.content.length === 0 ? (
            <EmptyState
              icon={Ticket}
              title="No bookings yet"
              description="As attendees book this event, they'll appear here."
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking</TableHead>
                    <TableHead>Attendee</TableHead>
                    <TableHead>Booked at</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">#{b.id}</TableCell>
                      <TableCell>
                        <div>{b.userName}</div>
                        <div className="text-xs text-muted-foreground">
                          ID {b.userId}
                        </div>
                      </TableCell>
                      <TableCell>{formatLocalDateTime(b.bookingTime)}</TableCell>
                      <TableCell>
                        <BookingStatusBadge status={b.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Paginator
                page={data.number}
                size={data.size}
                totalPages={data.totalPages}
                totalElements={data.totalElements}
                onPageChange={(p) => setState({ page: String(p) })}
                onSizeChange={(s) => setState({ size: String(s), page: '0' })}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
