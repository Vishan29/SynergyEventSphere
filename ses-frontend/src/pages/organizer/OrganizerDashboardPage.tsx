import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarCheck,
  CalendarPlus,
  CalendarRange,
  CalendarX,
  Plus,
  Ticket,
} from 'lucide-react';
import { listMyEvents } from '@/api/events';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/common/EmptyState';
import { EventStatusBadge } from '@/components/events/EventStatusBadge';
import { effectiveStatus, formatLocalDateTime } from '@/lib/dates';

export function OrganizerDashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['events', 'mine', { all: true }],
    queryFn: () => listMyEvents({ size: 200, sort: 'dateTime,desc' }),
  });

  const events = data?.content ?? [];
  const stats = events.reduce(
    (acc, e) => {
      const eff = effectiveStatus(e.status, e.dateTime);
      acc.total += 1;
      acc.bookings += e.bookedSeats;
      if (eff === 'SCHEDULED') acc.upcoming += 1;
      else if (eff === 'COMPLETED') acc.completed += 1;
      else if (eff === 'CANCELLED') acc.cancelled += 1;
      return acc;
    },
    { total: 0, upcoming: 0, completed: 0, cancelled: 0, bookings: 0 },
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Organizer dashboard</h1>
          <p className="text-muted-foreground">
            A snapshot of every event you've put on the sphere.
          </p>
        </div>
        <Button asChild variant="gradient" size="lg">
          <Link to="/organizer/events/new">
            <Plus />
            New event
          </Link>
        </Button>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          icon={CalendarRange}
          label="Total events"
          value={stats.total}
          loading={isLoading}
        />
        <StatCard
          icon={CalendarPlus}
          label="Upcoming"
          value={stats.upcoming}
          loading={isLoading}
        />
        <StatCard
          icon={CalendarCheck}
          label="Completed"
          value={stats.completed}
          loading={isLoading}
        />
        <StatCard
          icon={CalendarX}
          label="Cancelled"
          value={stats.cancelled}
          loading={isLoading}
        />
        <StatCard
          icon={Ticket}
          label="Active bookings"
          value={stats.bookings}
          loading={isLoading}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent events</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : events.length === 0 ? (
            <EmptyState
              icon={CalendarPlus}
              title="No events yet"
              description="Create your first event to start accepting bookings."
              action={
                <Button asChild variant="gradient">
                  <Link to="/organizer/events/new">Create your first event</Link>
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>When</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>{formatLocalDateTime(event.dateTime)}</TableCell>
                    <TableCell>
                      <EventStatusBadge
                        status={event.status}
                        dateTime={event.dateTime}
                      />
                    </TableCell>
                    <TableCell>
                      {event.bookedSeats} / {event.capacity}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            navigate(`/organizer/events/${event.id}/bookings`)
                          }
                        >
                          Bookings
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/events/${event.id}`)}
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={
                            effectiveStatus(event.status, event.dateTime) !==
                            'SCHEDULED'
                          }
                          onClick={() =>
                            navigate(`/organizer/events/${event.id}/edit`)
                          }
                        >
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: typeof CalendarRange;
  label: string;
  value: number;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-5">
        <div className="rounded-full bg-primary/10 p-2.5 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
          <div className="text-2xl font-bold">
            {loading ? <Skeleton className="h-7 w-12" /> : value}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
