FROM node:20-alpine AS builder
RUN apk add --no-cache git bash
RUN git clone https://github.com/umami-software/umami.git /app
WORKDIR /app

RUN yarn install --frozen-lockfile

ARG BASE_PATH=/stats
ENV BASE_PATH=$BASE_PATH
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy

RUN yarn build-docker
RUN yarn install --production --ignore-scripts --prefer-offline

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache curl bash
COPY --from=builder /app ./
EXPOSE 3000

CMD ["yarn", "start-docker"]