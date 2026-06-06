import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Users } from 'lucide-react';
import type { EventSummary } from '@/api/types';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { EventBanner } from '@/components/brand/EventBanner';
import { EventStatusBadge } from './EventStatusBadge';
import { formatLocalDateTime, relativeTime } from '@/lib/dates';

interface EventCardProps {
  event: EventSummary;
}

export function EventCard({ event }: EventCardProps) {
  const venueLine = [event.venueName, event.location].filter(Boolean).join(' • ');
  const seats = `${event.bookedSeats} / ${event.capacity ?? 0} seats booked`;
  return (
    <Link
      to={`/events/${event.id}`}
      className="group block focus-visible:outline-none"
      aria-label={`View ${event.title}`}
    >
      <Card className="flex h-full flex-col overflow-hidden transition-all group-hover:-translate-y-0.5 group-hover:shadow-lg group-focus-visible:ring-2 group-focus-visible:ring-ring">
        <EventBanner seed={`${event.id}-${event.title}`} />
        <CardContent className="flex flex-1 flex-col gap-3 pt-5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-base font-semibold leading-tight">
              {event.title}
            </h3>
            <EventStatusBadge status={event.status} dateTime={event.dateTime} />
          </div>
          <div className="space-y-1.5 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>{formatLocalDateTime(event.dateTime)}</span>
              <span className="text-xs opacity-70">({relativeTime(event.dateTime)})</span>
            </div>
            {venueLine ? (
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" />
                <span className="line-clamp-1">{venueLine}</span>
              </div>
            ) : null}
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5" />
              <span>{seats}</span>
            </div>
          </div>
          <Progress
            value={event.bookedSeats}
            max={event.capacity ?? 0}
            ariaLabel="Booked seats"
          />
          <div className="mt-auto pt-1 text-xs text-muted-foreground">
            By {event.organizerName ?? 'Unknown organizer'}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
