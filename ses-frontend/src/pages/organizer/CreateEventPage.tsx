import { EventForm } from '@/components/events/EventForm';

export function CreateEventPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Create a new event</h1>
        <p className="text-muted-foreground">
          Pick a venue, set the date, and you're ready to take bookings.
        </p>
      </header>
      <EventForm mode="create" />
    </div>
  );
}
