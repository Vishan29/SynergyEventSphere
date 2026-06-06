import { format } from 'date-fns';
import type { EventResponse } from '@/api/types';
import { parseLocalDateTime } from './dates';

// Generates a minimal RFC 5545-ish .ics file for an event so users can
// "Add to calendar" without any backend changes. We treat the backend's
// LocalDateTime as floating local time (no TZ) which is what most
// calendar apps expect for personal events.
export function eventToIcs(event: EventResponse): string {
  const start = parseLocalDateTime(event.dateTime);
  if (!start) return '';
  // Default to a 2-hour event since we don't have an end time.
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

  const dtFormat = (d: Date) => format(d, "yyyyMMdd'T'HHmmss");
  const venue = event.venue
    ? `${event.venue.name}, ${event.venue.location}`
    : [event.customVenueName, event.customLocation].filter(Boolean).join(', ');
  const description = (event.description ?? '').replace(/\n/g, '\\n');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SynergyEventSphere//SES//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:event-${event.id}@synergyeventsphere`,
    `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}`,
    `DTSTART:${dtFormat(start)}`,
    `DTEND:${dtFormat(end)}`,
    `SUMMARY:${event.title.replace(/[\r\n,;]/g, ' ')}`,
    description ? `DESCRIPTION:${description}` : '',
    venue ? `LOCATION:${venue.replace(/[\r\n,;]/g, ' ')}` : '',
    `STATUS:${event.status === 'CANCELLED' ? 'CANCELLED' : 'CONFIRMED'}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  return lines.join('\r\n');
}

export function downloadIcs(event: EventResponse) {
  const ics = eventToIcs(event);
  if (!ics) return;
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${event.title.replace(/[^a-z0-9-_]+/gi, '_')}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
