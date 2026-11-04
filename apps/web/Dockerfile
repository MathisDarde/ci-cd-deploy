# Build from the repository root: docker build -f apps/web/Dockerfile .

# Stage 1: build
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile --ignore-scripts --filter @pokewishlist/web...
COPY packages/shared packages/shared
COPY apps/web apps/web
RUN pnpm --filter @pokewishlist/web build

# Stage 2: final image, without the build tools: only the output of nuxt build.
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=build /app/apps/web/.output ./.output
USER node
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
