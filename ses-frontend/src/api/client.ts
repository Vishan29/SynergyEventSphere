import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ApiError } from './types';

// In dev VITE_API_BASE_URL is empty so requests go to /api/* and Vite's
// proxy forwards them to the Spring Boot backend. In prod it should be
// the deployed origin.
const baseURL = import.meta.env.VITE_API_BASE_URL ?? '';

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

const TOKEN_KEY = 'ses.auth.token';
const EXPIRES_AT_KEY = 'ses.auth.expiresAt';

let onUnauthorized: (() => void) | null = null;

export function registerUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiresAt = localStorage.getItem(EXPIRES_AT_KEY);
  if (token && expiresAt) {
    if (new Date(expiresAt).getTime() > Date.now()) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401 && onUnauthorized) {
      // Auth failed (token expired, revoked, or missing); let the auth
      // store decide what to do (clear state, redirect to /login).
      onUnauthorized();
    }
    return Promise.reject(error);
  },
);

export interface ParsedApiError {
  status: number;
  message: string;
  violations: { field: string; message: string }[];
}

export function parseApiError(err: unknown): ParsedApiError {
  if (axios.isAxiosError<ApiError>(err)) {
    const data = err.response?.data;
    return {
      status: err.response?.status ?? 0,
      message:
        data?.message ||
        err.message ||
        'Something went wrong. Please try again.',
      violations: data?.violations ?? [],
    };
  }
  if (err instanceof Error) {
    return { status: 0, message: err.message, violations: [] };
  }
  return { status: 0, message: 'Unknown error', violations: [] };
}

// Spring's PageRequest serializes `sort` as repeated `sort=field,direction`.
// Helper builds query params from a typed object, dropping null/undefined.
export function toQueryParams(
  input: Record<string, unknown> | object,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      for (const v of value) params.append(key, String(v));
    } else if (typeof value === 'boolean') {
      params.set(key, value ? 'true' : 'false');
    } else {
      params.set(key, String(value));
    }
  }
  return params;
}
