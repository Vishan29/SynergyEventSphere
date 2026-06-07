# syntax=docker/dockerfile:1.7
#
# Multi-stage build for the ses-frontend (Vite + React + TypeScript).
#   - Build stage: Node 20 + pnpm (via Corepack) -> static bundle in /app/dist.
#   - Runtime stage: nginx serves the bundle and reverse-proxies /api/* to
#     the backend container (see nginx.conf).
#
# Build:   docker build -t ses-frontend ./ses-frontend
# Run:     docker run --rm -p 5173:80 ses-frontend
#
# Build args (override at build time):
#   VITE_API_BASE_URL  - leave empty when served behind the bundled nginx
#                        proxy; set to an absolute URL for split deployments.
#   VITE_OAUTH_ENABLED - "true"/"false". Mirrors .env.example.

# ---- Build stage --------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

# Corepack ships with Node 16+ and lets us use the pnpm version pinned in
# package.json (or its bundled default) without a separate install step.
RUN corepack enable

# Install dependencies first so this layer is cached as long as the lockfile
# is unchanged.
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Vite reads VITE_* variables at build time and inlines them into the bundle.
ARG VITE_API_BASE_URL=""
ARG VITE_OAUTH_ENABLED="false"
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_OAUTH_ENABLED=$VITE_OAUTH_ENABLED

COPY . .
RUN pnpm run build

# ---- Runtime stage ------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

# Replace the default site config with our SPA + /api reverse-proxy setup.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Ship the compiled bundle.
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
# The base image already declares: CMD ["nginx", "-g", "daemon off;"]
