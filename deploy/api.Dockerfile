FROM node:20-alpine AS builder
# pnpm version comes from packageManager in package.json
RUN corepack enable
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/env/package.json ./packages/env/
COPY packages/common/package.json ./packages/common/

RUN pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm --filter "@repo/*" build
RUN pnpm --filter api build

RUN pnpm --filter api deploy --prod --legacy /app/out
RUN cp -r apps/api/dist /app/out/dist
RUN cp apps/api/drizzle.config.js /app/out/
RUN cp -r apps/api/drizzle /app/out/drizzle


FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/out ./

COPY deploy/start-api.sh ./start.sh
RUN chmod +x ./start.sh

EXPOSE 3001
CMD ["./start.sh"]