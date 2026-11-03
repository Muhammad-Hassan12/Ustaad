# Deployment guide

This guide covers deploying the FastAPI multi-agent backend on an Ubuntu 24.04 LTS VPS with Caddy HTTPS termination (`api.ustaad.systems`), alongside either Vercel hosting (`www.ustaad.systems`) or self-hosted Next.js 16 on the same server. Supabase provides managed PostgreSQL storage for session records, mock interview transcripts and optional daily server-quota counters.

## 1. Prepare the server and domain

Use Ubuntu 24.04 LTS, Python 3.12, Node.js 22 (required when building or hosting the Next.js 16 frontend on the server) and a dedicated non-root SSH account with `sudo` privileges. Because Ustaad delegates model inference and search queries to external HTTPS APIs rather than local GPU or CPU model weights, a lightweight 1–2 vCPU server with 1–2 GB RAM comfortably serves the FastAPI backend; allocate at least 2–4 GB RAM (or swap) if running `next build` directly on the VPS.

Configure DNS `A` records pointing your API hostname (for example `api.example.com`) to the VPS IPv4 address. Open TCP `80` and `443` in both the cloud firewall and host firewall while keeping port `8000` bound privately behind Caddy:

```bash
sudo apt-get update
sudo apt-get install -y build-essential python3.12 python3.12-venv git curl ca-certificates xz-utils ufw
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

Review existing firewall rules before enabling UFW on shared hosts.

## 2. Check out the repository and install backend dependencies

```bash
export USTAAD_ROOT="$HOME/Ustaad"
git clone https://github.com/Muhammad-Hassan12/Ustaad.git "$USTAAD_ROOT"
cd "$USTAAD_ROOT/backend"
python3.12 -m venv venv
venv/bin/pip install --upgrade pip
venv/bin/pip install -r requirements.txt
```

Test dependencies (`requirements-dev.txt`) are omitted on production servers unless running verification suites locally.

## 3. Configure Supabase and backend environment

Follow [Supabase configuration](SUPABASE_SETUP.md) to execute [`backend/db/schemas.sql`](../backend/db/schemas.sql) in a dedicated Supabase project. Create `backend/.env` from `backend/.env.example` and restrict permissions:

```bash
cp .env.example .env
chmod 600 .env
```

Set the required server variables in `backend/.env`:

```dotenv
GEMINI_API_KEY=YOUR_GOOGLE_AI_STUDIO_KEY
GEMINI_MODEL=gemini-3.1-flash-lite
SERPER_API_KEY=YOUR_SERPER_API_KEY
SUPABASE_URL=https://PROJECT.supabase.co
SUPABASE_SERVICE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
CORS_ORIGINS=https://www.example.com,https://example.com
```

`GEMINI_MODEL` remains locked to `gemini-3.1-flash-lite` for shared default requests. Keep `SUPABASE_SERVICE_KEY`, `GEMINI_API_KEY` and `SERPER_API_KEY` exclusively on the backend host. Optional `KAGGLE_LLM_URL` may be configured if operating a secondary OpenAI-compatible failover endpoint for `429`/`503` responses on the default server key.

## 4. Supervise FastAPI with systemd

Create `/etc/systemd/system/ustaad-api.service` (substituting the deployment user and absolute repository path):

```ini
[Unit]
Description=Ustaad FastAPI multi-agent backend
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=DEPLOY_USER
WorkingDirectory=/home/DEPLOY_USER/Ustaad/backend
EnvironmentFile=/home/DEPLOY_USER/Ustaad/backend/.env
ExecStart=/home/DEPLOY_USER/Ustaad/backend/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Enable and verify the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now ustaad-api
systemctl status ustaad-api --no-pager
curl --fail http://127.0.0.1:8000/health
```

Run a single Uvicorn worker process when relying on the in-memory `status_queues` dictionary for immediate Server-Sent Events (`GET /api/pipeline/status/{session_id}`). If a client reconnects or refreshes after a queue detaches, the endpoint automatically falls back to lightweight Supabase state polling until completion.

## 5. Terminate HTTPS with Caddy

Install Caddy from its official Debian/Ubuntu repository and add a reverse-proxy block for the API domain in `/etc/caddy/Caddyfile`:

```caddyfile
api.example.com {
    request_body {
        max_size 6MB
    }
    reverse_proxy 127.0.0.1:8000 {
        flush_interval -1
    }
}
```

`flush_interval -1` disables response buffering so Server-Sent Events stream immediately as each pipeline stage starts and finishes. `max_size 6MB` accommodates multipart form overhead above FastAPI's 5 MiB PDF limit. Validate and reload Caddy:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
curl --fail https://api.example.com/health
```

## 6. Frontend deployment on Vercel (recommended)

Deploying `frontend/` on Vercel offloads static asset delivery and Node.js build memory from small student or hobbyist VPS instances while keeping API credentials on the VPS:

1. Import the repository into Vercel.
2. Configure **Root Directory** as `frontend`, **Framework Preset** as `Next.js`, **Node.js Version** as `22.x`, **Install Command** as `npm ci`, and **Build Command** as `npm run build`.
3. Set the single public environment variable for Production and Preview environments:

| Vercel environment variable | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://api.example.com` |

4. Add the deployed Vercel domain (for example `https://www.example.com`) to `CORS_ORIGINS` in `backend/.env` and restart `ustaad-api`.
5. Rebuild on Vercel whenever `NEXT_PUBLIC_API_URL` changes, because `NEXT_PUBLIC_` values are inlined at build time.

Browser-supplied BYOK keys (`ustaad_byok_v2` in `localStorage`) travel directly over HTTPS from the user's browser to `https://api.example.com` via request headers (`X-LLM-Provider`, `X-LLM-Model`, `X-LLM-API-Key`, `X-LLM-Region`) and never pass through Vercel serverless functions or database tables.

## 7. Self-hosting the frontend or using Docker Compose

To build and serve Next.js 16 directly on a server with Node.js 22 installed:

```bash
cd "$USTAAD_ROOT/frontend"
cp .env.example .env.local
npm ci --no-audit --no-fund
npm run build
npm run start -- --hostname 127.0.0.1 --port 3000
```

Alternatively, to run the backend inside Docker using the repository's non-root `python:3.12-slim` image:

```bash
docker compose up -d --build
curl --fail http://127.0.0.1:8000/health
```

## 8. Updating an existing deployment

1. Pull the reviewed Git revision while preserving `backend/.env` and `frontend/.env.local`.
2. Update Python packages if `backend/requirements.txt` changed: `backend/venv/bin/pip install -r backend/requirements.txt`.
3. Restart the backend service during a low-traffic window (`sudo systemctl restart ustaad-api`) because restarting Uvicorn interrupts active in-flight background pipeline tasks. Completed session states remain intact in Supabase and resume cleanly from `/dashboard/{session_id}`.
4. Confirm `curl --fail http://127.0.0.1:8000/health` and `GET /api/keys/providers`.

