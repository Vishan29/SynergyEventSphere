import { apiClient, toQueryParams } from './client';
import type {
  BookingResponse,
  BookingSummary,
  Page,
  PageQuery,
} from './types';

export async function bookEvent(eventId: number): Promise<BookingResponse> {
  const { data } = await apiClient.post<BookingResponse>('/api/bookings', {
    eventId,
  });
  return data;
}

export async function cancelBooking(id: number): Promise<BookingResponse> {
  const { data } = await apiClient.post<BookingResponse>(
    `/api/bookings/${id}/cancel`,
  );
  return data;
}

export async function getBooking(id: number): Promise<BookingResponse> {
  const { data } = await apiClient.get<BookingResponse>(`/api/bookings/${id}`);
  return data;
}

export async function listMyBookings(
  query: PageQuery = {},
): Promise<Page<BookingSummary>> {
  const params = toQueryParams(query);
  const { data } = await apiClient.get<Page<BookingSummary>>(
    '/api/bookings/me',
    { params },
  );
  return data;
}

export async function listBookingsByEvent(
  eventId: number,
  query: PageQuery = {},
): Promise<Page<BookingSummary>> {
  const params = toQueryParams(query);
  const { data } = await apiClient.get<Page<BookingSummary>>(
    `/api/bookings/by-event/${eventId}`,
    { params },
  );
  return data;
}
