import { apiClient } from './client';
import type { UserProfile, UserSummary } from './types';

export async function getMe(): Promise<UserProfile> {
  const { data } = await apiClient.get<UserProfile>('/api/users/me');
  return data;
}

export async function listUsers(): Promise<UserSummary[]> {
  const { data } = await apiClient.get<UserSummary[]>('/api/users');
  return data;
}

export async function getUser(id: number): Promise<UserProfile> {
  const { data } = await apiClient.get<UserProfile>(`/api/users/${id}`);
  return data;
}
