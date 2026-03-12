FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Install dependencies
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/env/package.json ./packages/env/
COPY packages/common/package.json ./packages/common/

RUN pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm --filter "@repo/*" build
RUN pnpm --filter api build

# --- Deployment stage ---
# This creates an isolated folder at /app/out with only the API and its deps
RUN pnpm --filter api deploy --prod --legacy /app/out

FROM node:20-alpine AS runner
WORKDIR /app

# 1. Copy the standalone production folder created by 'pnpm deploy'
COPY --from=builder /app/out ./

# 2. IMPORTANT: pnpm deploy doesn't copy the 'dist' folder (since it's ignored by git/pnpm)
# We must copy it manually from the builder's app/apps/api/dist
COPY --from=builder /app/apps/api/dist ./dist

# 3. Copy Drizzle config (needed for migrations)
COPY --from=builder /app/apps/api/drizzle.config.js ./ 
COPY --from=builder /app/apps/api/drizzle ./drizzle

# 4. Copy the start script
COPY deploy/start-api.sh ./start.sh
RUN chmod +x ./start.sh

EXPOSE 3001
CMD ["./start.sh"]