# Shopping List

A real-time, collaborative shopping list application.

## Tech Stack

- Monorepo: Turborepo + pnpm workspaces
- Frontend: React, Vite, Mantine v7, React Query, @hello-pangea/dnd
- Backend: Fastify, Drizzle ORM (Postgres), @fastify/websocket, Zod
- Deployment: Docker, GitHub Actions (GHCR), Watchtower, Cloudflare Tunnels

## Local Development

### Prerequisites

- Node.js (v20+)
- pnpm (v8+)
- PostgreSQL

### Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with local database credentials and Google OAuth keys.
3. Run database migrations:
   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```
4. Start development servers:
   ```bash
   pnpm dev
   ```

## Production Deployment

The deployment architecture utilizes GitHub Actions to build Docker images and push them to the GitHub Container Registry (GHCR). A target server runs Watchtower to automatically pull new images and restart containers, routed securely through a Cloudflare Tunnel.

### 1. GitHub Repository Configuration

1. Navigate to repository **Settings > Secrets and variables > Actions**.
2. Under the **Variables** tab, add:
   - `VITE_API_URL`: The public URL of the API (e.g., `https://api.example.com`).
3. Under developer settings, generate a Personal Access Token (PAT) with the `read:packages` scope to allow the target server to pull images from GHCR.

### 2. Cloudflare Tunnel Configuration

1. Create a Cloudflare Tunnel via the Zero Trust dashboard.
2. Note the provided Tunnel Token.
3. Configure two public hostnames routing to the internal Docker network:
   - Frontend: `shopping.example.com` -> `HTTP://web:80`
   - API: `api.example.com` -> `HTTP://api:3001`

### 3. Google OAuth Configuration

Update the Google Cloud Console OAuth 2.0 Client ID with production URLs:

- Authorized JavaScript origins: `https://api.example.com`, `https://shopping.example.com`
- Authorized redirect URIs: `https://api.example.com/auth/callback/google`

### 4. Target Server Setup

1. Clone the repository on the target server.
2. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
3. Populate the `.env` file. Ensure `GITHUB_USERNAME` and `CLOUDFLARE_TUNNEL_TOKEN` are set.
4. Authenticate Docker with GHCR using the PAT generated in Step 1:
   ```bash
   docker login ghcr.io -u <GITHUB_USERNAME>
   ```
5. Start the infrastructure from the root directory:
   ```bash
   cd deploy
   docker compose up -d
   ```

### 5. Continuous Deployment

Pushing to the `production` branch automatically triggers the build and deploy pipeline.

```bash
git checkout production
git merge main
git push origin production
```

Watchtower on the target server will automatically detect the new images, apply database migrations upon container startup, and restart the services.
