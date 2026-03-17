FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/env/package.json ./packages/env/
COPY packages/common/package.json ./packages/common/

RUN pnpm install --frozen-lockfile

# Copy source and build
COPY . .
RUN pnpm --filter "@repo/*" build

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_UMAMI_WEBSITE_ID
ENV VITE_UMAMI_WEBSITE_ID=$VITE_UMAMI_WEBSITE_ID

RUN pnpm --filter web build

FROM nginx:alpine AS runner
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]