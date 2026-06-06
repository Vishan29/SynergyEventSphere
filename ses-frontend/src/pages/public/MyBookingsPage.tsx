import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CalendarX, MapPin, RefreshCcw, Ticket } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import {
  bookEvent,
  cancelBooking,
  listMyBookings,
} from '@/api/bookings';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Paginator } from '@/components/common/Paginator';
import { BookingStatusBadge } from '@/components/bookings/BookingStatusBadge';
import { EventStatusBadge } from '@/components/events/EventStatusBadge';
import { useUrlState } from '@/hooks/useUrlState';
import { handleApiError } from '@/lib/errors';
import {
  effectiveStatus,
  formatLocalDateTime,
  isFuture,
  isPast,
} from '@/lib/dates';

const defaultState = { tab: 'active', page: '0', size: '10' };

export function MyBookingsPage() {
  const [state, setState] = useUrlState(defaultState);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const args = {
    page: Number(state.page) || 0,
    size: Number(state.size) || 10,
    sort: 'bookingTime,desc',
  };

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', 'me', args],
    queryFn: () => listMyBookings(args),
    placeholderData: (prev) => prev,
  });

  const cancelMutation = useMutation({
    mutationFn: (bookingId: number) => cancelBooking(bookingId),
    onMutate: (id) => setPendingId(id),
    onSettled: () => setPendingId(null),
    onSuccess: () => {
      toast.success('Booking cancelled');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (err) => handleApiError(err),
  });

  const rebookMutation = useMutation({
    mutationFn: (eventId: number) => bookEvent(eventId),
    onMutate: (id) => setPendingId(id),
    onSettled: () => setPendingId(null),
    onSuccess: () => {
      toast.success('Re-booked successfully');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (err) => handleApiError(err),
  });

  const all = data?.content ?? [];
  const active = all.filter((b) => b.status === 'BOOKED');
  const cancelled = all.filter((b) => b.status === 'CANCELLED');

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">My bookings</h1>
        <p className="text-muted-foreground">
          Track every event you've booked, cancel if your plans change, or
          re-book the ones you miss.
        </p>
      </header>

      <Tabs
        value={state.tab ?? 'active'}
        onValueChange={(v) => setState({ tab: v })}
      >
        <TabsList>
          <TabsTrigger value="active">
            Active ({active.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({cancelled.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {isLoading ? (
            <BookingsSkeleton />
          ) : active.length === 0 ? (
            <EmptyState
              icon={Ticket}
              title="No active bookings"
              description="When you book an event it'll show up here."
              action={
                <Button asChild variant="gradient">
                  <Link to="/events">Browse events</Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {active.map((b) => (
                <Card key={b.id}>
                  <CardContent className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/events/${b.eventId}`}
                          className="text-base font-semibold hover:underline"
                        >
                          {b.eventTitle}
                        </Link>
                        <EventStatusBadge
                          status={b.eventStatus}
                          dateTime={b.eventDateTime}
                        />
                        <BookingStatusBadge status={b.status} />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                        <span>{formatLocalDateTime(b.eventDateTime)}</span>
                        {b.eventLocation ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {b.eventLocation}
                          </span>
                        ) : null}
                        <span>Booking #{b.id}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={
                          isPast(b.eventDateTime) ||
                          effectiveStatus(b.eventStatus, b.eventDateTime) !==
                            'SCHEDULED' ||
                          (cancelMutation.isPending && pendingId === b.id)
                        }
                        onClick={() => cancelMutation.mutate(b.id)}
                      >
                        Cancel booking
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4">
          {isLoading ? (
            <BookingsSkeleton />
          ) : cancelled.length === 0 ? (
            <EmptyState
              icon={CalendarX}
              title="No cancelled bookings"
              description="Once you cancel a booking it'll appear here."
            />
          ) : (
            <div className="space-y-3">
              {cancelled.map((b) => (
                <Card key={b.id}>
                  <CardContent className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/events/${b.eventId}`}
                          className="text-base font-semibold hover:underline"
                        >
                          {b.eventTitle}
                        </Link>
                        <EventStatusBadge
                          status={b.eventStatus}
                          dateTime={b.eventDateTime}
                        />
                        <BookingStatusBadge status={b.status} />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatLocalDateTime(b.eventDateTime)}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => rebookMutation.mutate(b.eventId)}
                      disabled={
                        !isFuture(b.eventDateTime) ||
                        b.eventStatus === 'CANCELLED' ||
                        (rebookMutation.isPending && pendingId === b.eventId)
                      }
                    >
                      <RefreshCcw />
                      Re-book
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {data && data.totalElements > 0 ? (
        <Paginator
          page={data.number}
          size={data.size}
          totalPages={data.totalPages}
          totalElements={data.totalElements}
          onPageChange={(p) => setState({ page: String(p) })}
          onSizeChange={(s) => setState({ size: String(s), page: '0' })}
        />
      ) : null}
    </div>
  );
}

function BookingsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, idx) => (
        <Skeleton key={idx} className="h-24 w-full rounded-2xl" />
      ))}
    </div>
  );
}
