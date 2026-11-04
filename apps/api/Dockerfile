# Build from the repository root: docker build -f apps/api/Dockerfile .

# Stage 1: build — full toolchain, workspace dependencies, esbuild bundle.
FROM node:26-alpine AS build
WORKDIR /app
RUN corepack enable
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile --filter @pokewishlist/api...
COPY packages/shared packages/shared
COPY apps/api apps/api
COPY db db
RUN pnpm --filter @pokewishlist/api build
# `docker compose run migrate` uses this stage: it has tsx and the db/ SQL files.

# Stage 2: runtime — only the bundle (no node_modules, no sources, no toolchain).
FROM node:26-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3001
COPY --from=build /app/apps/api/dist/server.mjs ./server.mjs
USER node
EXPOSE 3001
HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3001/health || exit 1
CMD ["node", "server.mjs"]
