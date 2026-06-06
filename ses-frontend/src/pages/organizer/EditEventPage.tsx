import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { getEvent } from '@/api/events';
import { EventForm } from '@/components/events/EventForm';
import { Skeleton } from '@/components/ui/skeleton';
import { effectiveStatus } from '@/lib/dates';

export function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const eventId = Number(id);
  const { data, isLoading } = useQuery({
    queryKey: ['events', eventId],
    queryFn: () => getEvent(eventId),
    enabled: !isNaN(eventId),
  });

  if (isLoading) {
    return <Skeleton className="h-[40rem] w-full rounded-2xl" />;
  }
  if (!data) {
    return (
      <div className="text-center text-muted-foreground">Event not found.</div>
    );
  }

  const eff = effectiveStatus(data.status, data.dateTime);
  const isLocked = eff !== 'SCHEDULED';

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Edit event</h1>
        <p className="text-muted-foreground">
          Make changes to <span className="font-medium">{data.title}</span>.
        </p>
      </header>
      {isLocked ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
          <div>
            <p className="font-medium">This event is no longer editable.</p>
            <p className="text-muted-foreground">
              Events that have already started or have been cancelled cannot
              be modified. Showing read-only details below.
            </p>
          </div>
        </div>
      ) : null}
      <EventForm mode="edit" initial={data} key={data.id} />
    </div>
  );
}
