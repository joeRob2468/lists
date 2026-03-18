# deploy/umami.Dockerfile
FROM node:20-alpine AS builder
RUN apk add --no-cache git bash
RUN npm install -g pnpm
RUN git clone https://github.com/umami-software/umami.git /app
WORKDIR /app

RUN pnpm install

ARG BASE_PATH=/stats
ENV BASE_PATH=$BASE_PATH
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy

RUN pnpm run build-docker
RUN pnpm install --prod --ignore-scripts --prefer-offline

FROM node:20-alpine AS runner
RUN npm install -g pnpm
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache curl bash
COPY --from=builder /app ./
EXPOSE 3000

CMD ["pnpm", "run", "start-docker"]