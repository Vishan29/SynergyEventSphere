import {
  format,
  formatDistanceToNowStrict,
  isAfter,
  isBefore,
  parseISO,
} from 'date-fns';
import type { EventStatus } from '@/api/types';

// Backend Event.dateTime is LocalDateTime (no timezone). We treat it as
// the user's local time, which matches the way organizers pick times.
export function parseLocalDateTime(value: string | null | undefined): Date | null {
  if (!value) return null;
  // parseISO is forgiving and handles strings without a Z suffix.
  const d = parseISO(value);
  return isNaN(d.getTime()) ? null : d;
}

export function formatLocalDateTime(value: string | null | undefined): string {
  const d = parseLocalDateTime(value);
  if (!d) return '—';
  return format(d, "EEE, MMM d, yyyy 'at' h:mm a");
}

export function formatDateOnly(value: string | null | undefined): string {
  const d = parseLocalDateTime(value);
  if (!d) return '—';
  return format(d, 'MMM d, yyyy');
}

export function formatTimeOnly(value: string | null | undefined): string {
  const d = parseLocalDateTime(value);
  if (!d) return '—';
  return format(d, 'h:mm a');
}

export function relativeTime(value: string | null | undefined): string {
  const d = parseLocalDateTime(value);
  if (!d) return '';
  const now = new Date();
  const past = isBefore(d, now);
  const distance = formatDistanceToNowStrict(d);
  return past ? `${distance} ago` : `in ${distance}`;
}

export function isPast(value: string | null | undefined): boolean {
  const d = parseLocalDateTime(value);
  if (!d) return false;
  return isBefore(d, new Date());
}

export function isFuture(value: string | null | undefined): boolean {
  const d = parseLocalDateTime(value);
  if (!d) return false;
  return isAfter(d, new Date());
}

// Convert a Date to the LocalDateTime string format that Spring expects
// (no timezone, no fractional seconds): "2026-05-10T18:30:00".
export function toLocalDateTimeString(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm:ss");
}

// `<input type="datetime-local">` value: "2026-05-10T18:30".
export function toDatetimeLocalValue(value: string | null | undefined): string {
  const d = parseLocalDateTime(value);
  if (!d) return '';
  return format(d, "yyyy-MM-dd'T'HH:mm");
}

export function fromDatetimeLocalValue(value: string): string {
  // The input gives "yyyy-MM-ddTHH:mm"; backend wants "yyyy-MM-ddTHH:mm:ss".
  if (!value) return '';
  return value.length === 16 ? `${value}:00` : value;
}

// Defense-in-depth: even if the backend returns SCHEDULED, treat it as
// COMPLETED in the UI when the date has passed (clock-skew safety).
export function effectiveStatus(
  status: EventStatus,
  dateTime: string | null | undefined,
): EventStatus {
  if (status === 'CANCELLED') return 'CANCELLED';
  if (isPast(dateTime)) return 'COMPLETED';
  return status;
}
