import { createBrowserRouter, Outlet } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import {
  RedirectIfAuthed,
  RequireAuth,
  RequireRole,
  RoleHomeRedirect,
} from './guards';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { EventsPage } from '@/pages/public/EventsPage';
import { EventDetailPage } from '@/pages/public/EventDetailPage';
import { MyBookingsPage } from '@/pages/public/MyBookingsPage';
import { ProfilePage } from '@/pages/public/ProfilePage';
import { OrganizerDashboardPage } from '@/pages/organizer/OrganizerDashboardPage';
import { CreateEventPage } from '@/pages/organizer/CreateEventPage';
import { EditEventPage } from '@/pages/organizer/EditEventPage';
import { EventBookingsPage } from '@/pages/organizer/EventBookingsPage';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { AdminCreateUserPage } from '@/pages/admin/AdminCreateUserPage';
import { AdminVenuesPage } from '@/pages/admin/AdminVenuesPage';
import { AdminEventsPage } from '@/pages/admin/AdminEventsPage';
import { ForbiddenPage } from '@/pages/errors/ForbiddenPage';
import { NotFoundPage } from '@/pages/errors/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <RedirectIfAuthed>
        <LoginPage />
      </RedirectIfAuthed>
    ),
  },
  {
    path: '/register',
    element: (
      <RedirectIfAuthed>
        <RegisterPage />
      </RedirectIfAuthed>
    ),
  },
  {
    element: <AppShell />,
    children: [
      { index: true, element: <RoleHomeRedirect /> },
      { path: 'events', element: <EventsPage /> },
      { path: 'events/:id', element: <EventDetailPage /> },
      {
        element: (
          <RequireAuth>
            <Outlet />
          </RequireAuth>
        ),
        children: [
          { path: 'bookings', element: <MyBookingsPage /> },
          { path: 'profile', element: <ProfilePage /> },
          {
            path: 'organizer',
            element: (
              <RequireRole roles={['ORGANIZER']}>
                <OrganizerDashboardPage />
              </RequireRole>
            ),
          },
          {
            path: 'organizer/events/new',
            element: (
              <RequireRole roles={['ORGANIZER']}>
                <CreateEventPage />
              </RequireRole>
            ),
          },
          {
            path: 'organizer/events/:id/edit',
            element: (
              <RequireRole roles={['ORGANIZER', 'ADMIN']}>
                <EditEventPage />
              </RequireRole>
            ),
          },
          {
            path: 'organizer/events/:id/bookings',
            element: (
              <RequireRole roles={['ORGANIZER', 'ADMIN']}>
                <EventBookingsPage />
              </RequireRole>
            ),
          },
          {
            path: 'admin',
            element: (
              <RequireRole roles={['ADMIN']}>
                <AdminDashboardPage />
              </RequireRole>
            ),
          },
          {
            path: 'admin/users',
            element: (
              <RequireRole roles={['ADMIN']}>
                <AdminUsersPage />
              </RequireRole>
            ),
          },
          {
            path: 'admin/users/new',
            element: (
              <RequireRole roles={['ADMIN']}>
                <AdminCreateUserPage />
              </RequireRole>
            ),
          },
          {
            path: 'admin/venues',
            element: (
              <RequireRole roles={['ADMIN']}>
                <AdminVenuesPage />
              </RequireRole>
            ),
          },
          {
            path: 'admin/events',
            element: (
              <RequireRole roles={['ADMIN']}>
                <AdminEventsPage />
              </RequireRole>
            ),
          },
        ],
      },
      { path: 'forbidden', element: <ForbiddenPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
