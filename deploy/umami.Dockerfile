# deploy/umami.Dockerfile
ARG NODE_IMAGE_VERSION="22-alpine"
# Pinned to the Umami commit production was last built from; newer versions need Prisma 7 and a different layout.
ARG UMAMI_REF="b1e6c8f9ca70d499d6c1c22afc6d4c2821bf614c"
# pnpm 11+ fails on ignored dependency build scripts
ARG PNPM_VERSION="10"

FROM node:${NODE_IMAGE_VERSION} AS builder
ARG UMAMI_REF
ARG PNPM_VERSION
RUN apk add --no-cache git libc6-compat bash
RUN npm install -g pnpm@${PNPM_VERSION}
RUN git clone https://github.com/umami-software/umami.git /app && git -C /app checkout ${UMAMI_REF}
WORKDIR /app

RUN pnpm install --frozen-lockfile
RUN cp docker/middleware.ts ./src/middleware.ts

ARG BASE_PATH=/stats
ENV BASE_PATH=$BASE_PATH
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

RUN pnpm run build-docker

FROM node:${NODE_IMAGE_VERSION} AS runner
ARG PNPM_VERSION
WORKDIR /app

# Must match the Prisma version in Umami's package.json at UMAMI_REF
ARG PRISMA_VERSION="7.3.0"
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs \
    && apk add --no-cache curl bash \
    && npm install -g pnpm@${PNPM_VERSION}
# Exact versions: Umami's standalone output (copied below) links semver@7.7.4 from its lockfile, so a different
# version here leaves node_modules/semver pointing at an incomplete copy.
RUN pnpm --allow-build='@prisma/engines' --allow-build=prisma add npm-run-all@4.1.5 dotenv@18.0.5 chalk@6.0.1 semver@7.7.4 \
    prisma@${PRISMA_VERSION} \
    @prisma/client@${PRISMA_VERSION} \
    @prisma/adapter-pg@${PRISMA_VERSION}

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/generated ./generated
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs

EXPOSE 3000

ENV HOSTNAME=0.0.0.0
ENV PORT=3000

CMD ["pnpm", "run", "start-docker"]