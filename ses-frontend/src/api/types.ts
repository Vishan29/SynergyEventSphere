// Mirrors com.ses.ems.* DTOs in ses-backend.
// LocalDateTime fields arrive without a timezone (e.g. "2026-05-10T18:30:00").
// Instant fields arrive in UTC with a trailing Z.

export type Role = 'USER' | 'ORGANIZER' | 'ADMIN';
export type EventStatus = 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';
export type BookingStatus = 'BOOKED' | 'CANCELLED';

export interface UserSummary {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface UserProfile extends UserSummary {
  contactNo?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  tokenType: 'Bearer';
  issuedAt: string;
  expiresAt: string;
  user: UserSummary;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: Role;
  contactNo?: string;
}

export interface CreateUserResponse {
  id: number;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface VenueSummary {
  id: number;
  name: string;
  location: string;
  capacity: number;
}

export interface CreateVenueRequest {
  name: string;
  location: string;
  capacity: number;
}

export interface EventSummary {
  id: number;
  title: string;
  dateTime: string;
  status: EventStatus;
  venueName?: string | null;
  location?: string | null;
  capacity: number;
  bookedSeats: number;
  organizerId: number;
  organizerName: string;
}

export interface EventResponse {
  id: number;
  title: string;
  description?: string | null;
  dateTime: string;
  status: EventStatus;
  organizer: UserSummary;
  venue?: VenueSummary | null;
  customVenueName?: string | null;
  customLocation?: string | null;
  capacity: number;
  bookedSeats: number;
  availableSeats: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  dateTime: string;
  venueId?: number | null;
  customVenueName?: string;
  customLocation?: string;
  capacity?: number;
}

export type UpdateEventRequest = CreateEventRequest;

export interface EventRef {
  id: number;
  title: string;
  dateTime: string;
  status: EventStatus;
  venueName?: string | null;
  location?: string | null;
}

export interface BookingSummary {
  id: number;
  status: BookingStatus;
  bookingTime: string;
  eventId: number;
  eventTitle: string;
  eventDateTime: string;
  eventStatus: EventStatus;
  eventLocation?: string | null;
  userId: number;
  userName: string;
}

export interface BookingResponse {
  id: number;
  status: BookingStatus;
  bookingTime: string;
  user: UserSummary;
  event: EventRef;
  createdAt: string;
  updatedAt: string;
}

export interface Page<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface ApiError {
  timestamp?: string;
  status: number;
  error?: string;
  message: string;
  path?: string;
  violations?: { field: string; message: string }[];
}

export interface PageQuery {
  page?: number;
  size?: number;
  sort?: string;
}

export interface EventSearchQuery extends PageQuery {
  status?: EventStatus;
  from?: string;
  to?: string;
  q?: string;
  upcomingOnly?: boolean;
}
