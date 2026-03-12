#!/bin/bash

# --- PATH AUTOMATION ---
cd "$(dirname "$0")/.."

# --- CONFIGURATION ---
COMPOSE_FILE="deploy/docker-compose.yml"
ENV_FILE=".env"

# --- VALIDATION ---
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "Error: Could not find $COMPOSE_FILE at $(pwd)"
    exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: $ENV_FILE not found at $(pwd)"
    exit 1
fi

# Load variables into the shell for Docker interpolation
export $(grep -v '^#' "$ENV_FILE" | xargs)

# --- COMMANDS ---
case "$1" in
    up)
        echo "Starting $COMPOSE_PROJECT_NAME..."
        docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --remove-orphans
        ;;
    down)
        echo "Stopping $COMPOSE_PROJECT_NAME..."
        docker compose -f "$COMPOSE_FILE" down
        ;;
    logs)
        # Usage: ./scripts/prod.sh logs [optional_service_name]
        docker compose -f "$COMPOSE_FILE" logs -f "$2"
        ;;
    pull)
        echo "Pulling latest images from GHCR..."
        docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" pull
        ;;
    prune)
        echo "Cleaning up old images and build cache..."
        docker image prune -f
        docker builder prune -f
        ;;
    status)
        echo "Current Status:"
        docker compose -f "$COMPOSE_FILE" ps
        ;;
    *)
        echo "Usage: $0 {up|down|logs|pull|prune|status}"
        echo "Example: $0 logs api"
        exit 1
        ;;
esac