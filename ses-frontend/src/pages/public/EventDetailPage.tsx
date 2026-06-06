import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  CalendarDays,
  CalendarPlus,
  Edit2,
  MapPin,
  Printer,
  Ticket,
  Users,
  XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { getEvent, cancelEvent } from '@/api/events';
import { bookEvent, cancelBooking, listMyBookings } from '@/api/bookings';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { EventBanner } from '@/components/brand/EventBanner';
import { EventStatusBadge } from '@/components/events/EventStatusBadge';
import { Countdown } from '@/components/common/Countdown';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useAuth } from '@/hooks/useAuth';
import { handleApiError } from '@/lib/errors';
import { downloadIcs } from '@/lib/ics';
import {
  effectiveStatus,
  formatLocalDateTime,
  isPast,
  parseLocalDateTime,
} from '@/lib/dates';

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const eventId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, hasRole } = useAuth();
  const [confirmCancel, setConfirmCancel] = useState(false);

  const { data: event, isLoading } = useQuery({
    queryKey: ['events', eventId],
    queryFn: () => getEvent(eventId),
    enabled: !isNaN(eventId),
  });

  // Find user's booking on this event (if any) so we can render the
  // right CTA: Book / You're booked + Cancel / Re-book.
  const { data: myBookings } = useQuery({
    queryKey: ['bookings', 'me', { all: true }],
    queryFn: () => listMyBookings({ size: 200, sort: 'bookingTime,desc' }),
    enabled: !!user,
  });

  const myBooking = useMemo(
    () => myBookings?.content.find((b) => b.eventId === eventId),
    [myBookings, eventId],
  );

  const bookMutation = useMutation({
    mutationFn: () => bookEvent(eventId),
    onSuccess: () => {
      toast.success('Booking confirmed');
      queryClient.invalidateQueries({ queryKey: ['events', eventId] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (err) => handleApiError(err),
  });

  const cancelBookingMutation = useMutation({
    mutationFn: (bookingId: number) => cancelBooking(bookingId),
    onSuccess: () => {
      toast.success('Booking cancelled');
      queryClient.invalidateQueries({ queryKey: ['events', eventId] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (err) => handleApiError(err),
  });

  const cancelEventMutation = useMutation({
    mutationFn: () => cancelEvent(eventId),
    onSuccess: () => {
      toast.success('Event cancelled');
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setConfirmCancel(false);
    },
    onError: (err) => handleApiError(err),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  if (!event) {
    return (
      <div className="text-center text-muted-foreground">Event not found.</div>
    );
  }

  const eff = effectiveStatus(event.status, event.dateTime);
  const past = isPast(event.dateTime);
  const isFull = event.bookedSeats >= event.capacity;
  const venueLine = event.venue
    ? `${event.venue.name} • ${event.venue.location}`
    : [event.customVenueName, event.customLocation].filter(Boolean).join(' • ');

  const eventBookable = eff === 'SCHEDULED' && !past && !isFull;

  const canBook = user
    ? eventBookable && (!myBooking || myBooking.status === 'CANCELLED')
    : eventBookable;

  const handleBook = () => {
    if (!user) {
      navigate('/login', { state: { from: `/events/${eventId}` } });
      return;
    }
    bookMutation.mutate();
  };

  const isOwnerOrAdmin =
    hasRole('ADMIN') || (user && event.organizer.id === user.id);

  return (
    <article className="space-y-6">
      <Link
        to="/events"
        className="inline-block text-sm text-muted-foreground hover:underline"
      >
        ← Back to events
      </Link>

      <Card className="overflow-hidden">
        <EventBanner seed={`${event.id}-${event.title}`} title={event.title} />
        <CardContent className="space-y-6 pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <EventStatusBadge status={event.status} dateTime={event.dateTime} />
            <Countdown dateTime={event.dateTime} />
          </div>

          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">When</div>
                <div className="text-muted-foreground">
                  {formatLocalDateTime(event.dateTime)}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">Where</div>
                <div className="text-muted-foreground">
                  {venueLine || 'Location TBA'}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div className="w-full">
                <div className="font-medium">Capacity</div>
                <div className="text-muted-foreground">
                  {event.bookedSeats} / {event.capacity} booked •{' '}
                  {event.availableSeats} available
                </div>
                <Progress
                  className="mt-2"
                  value={event.bookedSeats}
                  max={event.capacity}
                  ariaLabel="Booked seats"
                />
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Ticket className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">Organizer</div>
                <div className="text-muted-foreground">
                  {event.organizer.name}
                </div>
              </div>
            </div>
          </div>

          {event.description ? (
            <div>
              <h2 className="mb-2 text-base font-semibold">About this event</h2>
              <p className="whitespace-pre-line text-sm text-muted-foreground">
                {event.description}
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2 no-print">
            {myBooking && myBooking.status === 'BOOKED' ? (
              <>
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2"
                  disabled
                >
                  You're booked • #{myBooking.id}
                </Button>
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={() => cancelBookingMutation.mutate(myBooking.id)}
                  disabled={cancelBookingMutation.isPending || past}
                >
                  <XCircle />
                  Cancel my booking
                </Button>
              </>
            ) : (
              <Button
                variant="gradient"
                size="lg"
                onClick={handleBook}
                disabled={!canBook || bookMutation.isPending}
                title={
                  isFull
                    ? 'This event is fully booked'
                    : eff !== 'SCHEDULED'
                      ? 'This event is not open for bookings'
                      : undefined
                }
              >
                <Ticket />
                {bookMutation.isPending
                  ? 'Booking…'
                  : !user
                    ? 'Sign in to book'
                    : myBooking?.status === 'CANCELLED'
                      ? 'Re-book this event'
                      : 'Book this event'}
              </Button>
            )}

            <Button
              variant="outline"
              size="lg"
              onClick={() => downloadIcs(event)}
              disabled={!parseLocalDateTime(event.dateTime)}
            >
              <CalendarPlus />
              Add to calendar
            </Button>

            <Button
              variant="ghost"
              size="lg"
              onClick={() => window.print()}
            >
              <Printer />
              Print
            </Button>

            {isOwnerOrAdmin ? (
              <>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() =>
                    navigate(`/organizer/events/${event.id}/edit`)
                  }
                  disabled={past || eff === 'CANCELLED'}
                >
                  <Edit2 />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={() => setConfirmCancel(true)}
                  disabled={past || eff === 'CANCELLED'}
                >
                  Cancel event
                </Button>
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancel this event?"
        description={
          <>
            This will <strong>cancel all {event.bookedSeats} active booking
            {event.bookedSeats === 1 ? '' : 's'}</strong> on this event. This
            cannot be undone.
          </>
        }
        confirmLabel="Yes, cancel event"
        cancelLabel="Keep event"
        destructive
        loading={cancelEventMutation.isPending}
        onConfirm={() => cancelEventMutation.mutate()}
      />
    </article>
  );
}
