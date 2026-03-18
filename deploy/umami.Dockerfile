# deploy/umami.Dockerfile
FROM node:20-alpine AS builder

RUN apk add --no-cache git bash

# Clone the Umami repository
RUN git clone https://github.com/umami-software/umami.git /app
WORKDIR /app

# Install dependencies
RUN yarn install --frozen-lockfile

# INJECT THE BASE PATH DURING BUILD
ARG BASE_PATH=/stats
ENV BASE_PATH=$BASE_PATH
ENV NEXT_TELEMETRY_DISABLED=1

# Build the Next.js application
RUN yarn build-docker

# Remove dev dependencies to keep the final image smaller
RUN yarn install --production --ignore-scripts --prefer-offline

# --- Runner Stage ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache curl bash

# Copy the built app and Umami's database migration scripts
COPY --from=builder /app ./

EXPOSE 3000

# Run Umami's native docker start script (runs migrations, then starts server)
CMD ["yarn", "start-docker"]