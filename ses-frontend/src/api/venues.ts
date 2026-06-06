import { apiClient, toQueryParams } from './client';
import type {
  CreateVenueRequest,
  Page,
  PageQuery,
  VenueSummary,
} from './types';

export interface VenueSearchQuery extends PageQuery {
  q?: string;
}

export async function searchVenues(
  query: VenueSearchQuery = {},
): Promise<Page<VenueSummary>> {
  const params = toQueryParams(query);
  const { data } = await apiClient.get<Page<VenueSummary>>('/api/venues', {
    params,
  });
  return data;
}

export async function getVenue(id: number): Promise<VenueSummary> {
  const { data } = await apiClient.get<VenueSummary>(`/api/venues/${id}`);
  return data;
}

export async function createVenue(
  payload: CreateVenueRequest,
): Promise<VenueSummary> {
  const { data } = await apiClient.post<VenueSummary>('/api/venues', payload);
  return data;
}

export async function deleteVenue(id: number): Promise<void> {
  await apiClient.delete(`/api/venues/${id}`);
}
