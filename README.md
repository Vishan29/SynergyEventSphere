# SynergyEventSphere

A full-stack event management platform.

> **Tagline:** *Where events come together.*

This is a monorepo with two side-by-side projects:

| Folder         | Stack                                  | Description                              |
| -------------- | -------------------------------------- | ---------------------------------------- |
| `ses-backend/` | Spring Boot 3.5, Java 21, PostgreSQL   | REST API at `:8080` with JWT auth        |
| `ses-frontend/`| React 18 + TypeScript + Vite           | Web client at `:5173` (proxies to API)   |

---

## Quick start

```bash
# 1. Start the backend (in ses-backend/)
./gradlew bootRun

# 2. In another shell, start the frontend (in ses-frontend/)
pnpm install        # or npm install / yarn install
pnpm dev
```

The frontend's Vite dev server proxies `/api/*` → `http://localhost:8080`,
so you don't need extra CORS configuration during development.

Open `http://localhost:5173`.

---

## Run with Docker

A `docker-compose.yaml` at the repo root builds and wires three services:

| Service    | Image                  | Host port            | Notes                                  |
| ---------- | ---------------------- | -------------------- | -------------------------------------- |
| `db`       | `postgres:16-alpine`   | `5432`               | Data persisted in the `ses-db-data` volume |
| `backend`  | `ses-backend:local`    | `8080`               | Multi-stage Gradle → JRE 21 build      |
| `frontend` | `ses-frontend:local`   | `5173` (→ container 80) | nginx serves the Vite bundle and reverse-proxies `/api/*` to `backend:8080` |

### 1. Provide a JWT signing secret

The backend refuses to start without one. Create a root-level `.env`
(git-ignored) containing at minimum:

```bash
echo "APP_JWT_SECRET=$(openssl rand -base64 48)" > .env
```

Optional overrides you can drop into the same file:

```dotenv
POSTGRES_DB=eventsphere
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=5432
BACKEND_PORT=8080
FRONTEND_PORT=5173
APP_JWT_EXPIRATION_MS=3600000
VITE_OAUTH_ENABLED=false
JAVA_OPTS=-Xms256m -Xmx512m
```

### 2. Build & launch

```bash
docker compose up --build           # foreground, with logs
docker compose up --build -d        # detached
```

Open `http://localhost:5173`. The browser talks only to the frontend's
nginx, which forwards `/api/*` to the backend over the internal compose
network — same single-origin model as the Vite dev proxy.

### 3. Useful commands

```bash
docker compose logs -f backend      # tail one service
docker compose exec db psql -U postgres -d eventsphere
docker compose down                 # stop + remove containers
docker compose down -v              # ...and wipe the DB volume
```

### Rebuilding after code changes

`docker compose up --build` rebuilds any service whose context changed.
Dependency layers are cached, so subsequent builds are fast as long as
`build.gradle` / `pnpm-lock.yaml` are stable.

---

## Project layout

See:
- `ses-backend/HELP.md` and `ses-backend/postman/` for backend docs.
- `ses-frontend/README.md` for frontend setup, architecture, and the
  honest list of backend gaps that the UI handles without faking.

---

## Roles

The app supports three roles enforced both server-side (Spring Security)
and on the frontend (route guards + role-aware UI):

- **USER** — browse events, book / cancel / re-book.
- **ORGANIZER** — create and manage their own events; view bookings on
  those events.
- **ADMIN** — manages venues, users, and any event in the system. Only
  admins can create new organizer or admin accounts.

---

## License

Internal project. Add a `LICENSE` file at the root if you intend to
publish.
