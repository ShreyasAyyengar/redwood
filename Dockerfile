# syntax=docker/dockerfile:1

FROM oven/bun:1.4.0 AS bun
FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS dependencies
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
COPY package.json bun.lock .npmrc ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/backend/package.json ./apps/backend/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json
COPY patches ./patches
# Start a fresh cache after the failed tarball/integrity checks, and serialize
# writers. Limit downloads to reduce pressure on the deployment server.
RUN --mount=type=cache,id=redwood-bun-v2,target=/root/.bun/install/cache,sharing=locked \
    bun install --frozen-lockfile --network-concurrency=4 \
    || { install_status=$?; df -h /app /root/.bun/install/cache; \
         df -i /app /root/.bun/install/cache; exit "$install_status"; }

FROM dependencies AS build
COPY . .
ENV NODE_ENV=production

# These public values are embedded in the browser bundle by Next.js.
# Mark all six as build-time variables in Coolify.
ARG NEXT_PUBLIC_PROJECT_NAME
ARG NEXT_PUBLIC_WEBSITE_URL
ARG NEXT_PUBLIC_AUTH_BASE_URL
ARG NEXT_PUBLIC_NODE_ENV
ARG NEXT_PUBLIC_CONVEX_URL
ARG NEXT_PUBLIC_CONVEX_SITE_URL

# This is the only buildable workspace needed for the web image.
# Keep Next's compiler cache between builds without shipping it at runtime.
RUN --mount=type=cache,id=redwood-next,target=/app/apps/web/.next/cache,sharing=locked \
    bun run --cwd apps/web build

FROM base AS runtime
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
# Retain the tools used by Coolify's existing health checks.
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl wget \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /app/apps/web/public ./apps/web/public

USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
