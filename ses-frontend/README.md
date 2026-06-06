# SynergyEventSphere — Frontend (`ses-frontend`)

The web frontend for **SynergyEventSphere** (SES). Built with React 18 +
TypeScript + Vite, talks to the Spring Boot REST API in `../ses-backend`.

> **Tagline:** *Where events come together.*

---

## Quick start

### Prerequisites
- Node.js **>= 18**
- A JavaScript package manager: **pnpm** (recommended), **npm**, or **yarn**.
- A running backend at `http://localhost:8080` (see `../ses-backend/README.md`
  / `HELP.md`). The Vite dev server proxies `/api/*` to the backend, so a
  separate CORS configuration is **not** required for local development.

### Install & run

```bash
# from /ses-frontend
pnpm install        # or: npm install / yarn install
pnpm dev            # starts Vite on http://localhost:5173
```

Other scripts:

| Script            | What it does                            |
| ----------------- | --------------------------------------- |
| `pnpm dev`        | Vite dev server with HMR                |
| `pnpm build`      | TypeScript build + production bundle    |
| `pnpm preview`    | Preview the production bundle locally   |
| `pnpm lint`       | ESLint over the whole project           |
| `pnpm typecheck`  | `tsc -b --noEmit` for fast type checks  |

### Environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

| Variable               | Default | Notes                                                      |
| ---------------------- | ------- | ---------------------------------------------------------- |
| `VITE_API_BASE_URL`    | (empty) | Empty in dev → Vite proxy. Set to deployed origin in prod. |
| `VITE_OAUTH_ENABLED`   | `false` | Flip to `true` when the backend ships OAuth callbacks.     |

---

## What's inside

- **React 18 + TypeScript** strict mode, Vite 6, React Router 6
- **TanStack Query 5** for server state (caching, retries, paged data)
- **Zustand** for tiny client state (auth session, theme)
- **Axios** with interceptors (JWT bearer + 401 handler)
- **React Hook Form + Zod** for every form
- **Tailwind CSS** + shadcn-style primitives over Radix
- **lucide-react** icons, **date-fns**, **sonner** toasts, **jose** for
  JWT decoding
- Light/Dark mode (Tailwind `class` strategy) with system-preference
  fallback and persistence under `ses.theme`
- Branded SynergyEventSphere theming with brand gradient
  (`#6366F1 → #06B6D4 → #F59E0B`) used across hero, banners, CTAs

### Folder layout

```
src/
├── api/            # axios client, types, per-resource modules
├── components/
│   ├── ui/         # button, input, dialog, table, etc. (shadcn-style)
│   ├── brand/      # Logo, Wordmark, BrandHero, EventBanner, ThemeToggle, Avatar
│   ├── layout/     # AppShell, Navbar, Footer
│   ├── events/     # EventCard, EventStatusBadge, EventForm
│   ├── bookings/   # BookingStatusBadge
│   ├── admin/      # RoleBadge
│   ├── auth/       # SocialAuthButtons (with coming-soon dialog)
│   └── common/     # Paginator, EmptyState, ConfirmDialog, FormField,
│                   # ErrorBoundary, Countdown, SessionExpiryBanner
├── hooks/          # useAuth, useUrlState
├── pages/
│   ├── auth/       # LoginPage, RegisterPage
│   ├── public/     # EventsPage, EventDetailPage, MyBookingsPage, ProfilePage
│   ├── organizer/  # OrganizerDashboardPage, CreateEventPage,
│   │               # EditEventPage, EventBookingsPage
│   ├── admin/      # AdminDashboardPage, AdminUsersPage, AdminCreateUserPage,
│   │               # AdminVenuesPage, AdminEventsPage
│   └── errors/     # ForbiddenPage, NotFoundPage
├── routes/         # router.tsx + RequireAuth, RequireRole, RoleHomeRedirect
├── stores/         # auth.store.ts, theme.store.ts
├── lib/            # cn, dates, ics, csv, banner, initials, errors, validation
├── styles/         # globals.css with Tailwind layers
├── App.tsx
└── main.tsx
```

---

## Role-based routing

The frontend hard-routes users to a role-appropriate home and gates each
section with `RequireRole`.

| Path                                     | USER | ORGANIZER | ADMIN |
| ---------------------------------------- | :--: | :-------: | :---: |
| `/login`, `/register`                    |  ✓   |     ✓     |   ✓   |
| `/`                                      | →`/events` | →`/organizer` | →`/admin` |
| `/events`, `/events/:id`                 |  ✓   |     ✓     |   ✓   |
| `/bookings`                              |  ✓   |     ✓     |   ✓   |
| `/profile`                               |  ✓   |     ✓     |   ✓   |
| `/organizer/**`                          |  —   |     ✓     |   ✓¹  |
| `/admin/**`                              |  —   |     —     |   ✓   |

¹ Admins can use the organizer event editor and bookings page to act on
any event in the system (`/admin/events` links there).

---

## Highlights

- **Search & filter events** — paged, sortable, URL-synced filters
  (status, upcoming-only, date range, sort, page size) over the
  `/api/events` endpoint. Search box matches **event titles** (per the
  backend's `EventRepository.search`).
- **Book / cancel / re-book** — clean optimistic flow over `/api/bookings`.
  Re-booking after a cancel reuses the original booking row (the backend
  is idempotent on `(user_id, event_id)`).
- **Add to calendar (.ics)** on every event detail.
- **Print-friendly** event detail (`@media print` strips chrome).
- **Capacity hint when editing events** — the form blocks reducing
  capacity below the active booking count and surfaces the backend's
  `409` if it slips through.
- **Cancel-event warning** — confirm dialog reads "This will also cancel
  N active bookings", because the backend bulk-cancels every active
  booking on cancel.
- **Organizer dashboard** with KPI tiles + recent events table, plus a
  per-event bookings page with **CSV export** (full dataset, not just
  current page).
- **Admin dashboard** with user/role/venue/event counts, plus a
  consolidated event manager that supports client-side filter by
  organizer and venue (the backend doesn't expose those query params).

---

## Backend caveats handled honestly

The backend is finished and we did **not** modify it. A few intentional
gaps that we chose to surface clearly instead of fake:

### OAuth (Google / Microsoft / Facebook)
The backend has no OAuth endpoints. The login & register pages still
render the three social buttons, but clicking one opens a
**"Social sign-in is coming soon"** dialog. The flow is structured so
that when the backend ships `/api/auth/oauth/{provider}`, only
`SocialAuthButtons` needs to change — and we already gate the redirect
behind `VITE_OAUTH_ENABLED`.

### CORS
The backend enables Spring Security CORS but does not register a
`CorsConfigurationSource` bean. We solve this **on the frontend side**
in development with a Vite proxy:

```ts
// vite.config.ts
server: { proxy: { '/api': { target: 'http://localhost:8080', changeOrigin: true } } }
```

For production deployments you'll need either to (a) add a CORS bean to
the backend or (b) host frontend + backend on the same origin behind a
reverse proxy.

### Public-register accepts any role
`POST /api/auth/register` is `permitAll` and the service does not
verify the caller's role — meaning anyone could self-register as
`ADMIN`. The frontend mitigates this by:

- Hard-coding `role: 'USER'` on the public `/register` form.
- Hosting the privileged role picker only on the auth-gated
  `/admin/users/new` page.

This is a **backend hardening item** (we recommend gating the role
field server-side for non-admin callers).

### Missing endpoints — what the UI cannot do
The following look obvious but the backend does not yet expose them.
Rather than ship dead UI, we left clear notes in-app and documented the
gap here:

| Capability                       | Backend status                     |
| -------------------------------- | ---------------------------------- |
| Edit profile (name, contactNo)   | no `PUT /api/users/me`             |
| Change password                  | no endpoint                        |
| Forgot / reset password          | no endpoint                        |
| Email verification               | no endpoint                        |
| Delete user                      | no endpoint                        |
| Change a user's role             | no endpoint                        |
| List active sessions             | no endpoint (`logout-all` exists)  |
| Filter `/api/users` server-side  | client-side filter (search by name/email/role) |
| Filter events by organizer/venue | client-side filter on admin page   |
| `/actuator/health`               | permit-listed but actuator dep missing |

When the backend grows any of these, the natural place to add UI is
`pages/public/ProfilePage.tsx` and `pages/admin/AdminUsersPage.tsx`.

---

## Architectural notes

- **JWT is stored in `localStorage`** under `ses.auth.token` and read by
  the axios interceptor before every request. The token is dropped
  pre-flight if `expiresAt` has passed, so 401s only happen for genuine
  revocations.
- **Session expiry banner** appears when the token is within 5 minutes
  of expiry, prompting the user to sign in again before mid-action
  failure.
- **Date types** — backend `Event.dateTime`, `bookingTime`, and entity
  timestamps are `LocalDateTime` (no timezone); login `issuedAt` /
  `expiresAt` are `Instant` (UTC). The `lib/dates.ts` helpers
  encapsulate both forms.
- **Effective event status** — backend derives `COMPLETED` from
  `(stored=SCHEDULED && dateTime < now)`. The UI trusts the API but also
  re-derives client-side for robustness against clock skew
  (`lib/dates.ts → effectiveStatus`).
- **Pagination** — every paged page syncs `page`, `size`, `sort` (and
  filters) to the URL via `useUrlState`, so any view is bookmarkable.
- **Theming** — the brand gradient is centralized in
  `tailwind.config.ts → backgroundImage.brand-gradient`. The light/dark
  toggle uses Tailwind's `class` strategy and persists to
  `localStorage['ses.theme']` (read inline in `index.html` to avoid
  flash).

---

## Useful test accounts

The backend's Postman collection at
`../ses-backend/postman/SES-EMS.postman_collection.json` registers a
fresh `ADMIN`, two `ORGANIZER`s, and two `USER`s with a per-run suffix
so you can run it once before exploring the UI.
