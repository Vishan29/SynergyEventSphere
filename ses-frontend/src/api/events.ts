import { apiClient, toQueryParams } from './client';
import type {
  CreateEventRequest,
  EventResponse,
  EventSearchQuery,
  EventSummary,
  Page,
  PageQuery,
  UpdateEventRequest,
} from './types';

export async function searchEvents(
  query: EventSearchQuery = {},
): Promise<Page<EventSummary>> {
  const params = toQueryParams(query);
  const { data } = await apiClient.get<Page<EventSummary>>('/api/events', {
    params,
  });
  return data;
}

export async function getEvent(id: number): Promise<EventResponse> {
  const { data } = await apiClient.get<EventResponse>(`/api/events/${id}`);
  return data;
}

export async function listMyEvents(
  query: PageQuery = {},
): Promise<Page<EventSummary>> {
  const params = toQueryParams(query);
  const { data } = await apiClient.get<Page<EventSummary>>('/api/events/me', {
    params,
  });
  return data;
}

export async function createEvent(
  payload: CreateEventRequest,
): Promise<EventResponse> {
  const { data } = await apiClient.post<EventResponse>('/api/events', payload);
  return data;
}

export async function updateEvent(
  id: number,
  payload: UpdateEventRequest,
): Promise<EventResponse> {
  const { data } = await apiClient.put<EventResponse>(
    `/api/events/${id}`,
    payload,
  );
  return data;
}

export async function cancelEvent(id: number): Promise<EventResponse> {
  const { data } = await apiClient.post<EventResponse>(
    `/api/events/${id}/cancel`,
  );
  return data;
}
