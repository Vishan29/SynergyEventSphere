import { apiClient } from './client';
import type {
  CreateUserRequest,
  CreateUserResponse,
  LoginRequest,
  LoginResponse,
} from './types';

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>(
    '/api/auth/login',
    payload,
  );
  return data;
}

export async function register(
  payload: CreateUserRequest,
): Promise<CreateUserResponse> {
  const { data } = await apiClient.post<CreateUserResponse>(
    '/api/auth/register',
    payload,
  );
  return data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/api/auth/logout');
}

export async function logoutAll(): Promise<void> {
  await apiClient.post('/api/auth/logout-all');
}
