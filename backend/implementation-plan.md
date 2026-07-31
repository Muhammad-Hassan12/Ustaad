# Ustaad Backend — DigitalOcean Deployment

**Goal:** Get the FastAPI backend running on the DigitalOcean droplet, served over real HTTPS via Caddy (no ngrok), and connected to both frontend domains.

**Targets that must stay live and working:**
- `https://ustaad-virid.vercel.app/`
- `https://www.ustaad.systems/`

Both are served by the same Vercel project, so they'll point at the same backend URL.

---

## 0. Pre-flight

- [ ] Confirm DO droplet is provisioned and reachable via SSH
- [ ] Confirm DigitalOcean credit is active and covers the droplet tier chosen
- [ ] Confirm local project directory is up to date and ready to push/copy over

---

## 1. Provision the DO droplet

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3-pip python3-venv nginx git ufw
```

Firewall:
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

- [ ] Droplet reachable
- [ ] Firewall rules applied

---

## 2. Get the backend code onto the droplet

Since you're deploying from your local directory rather than a fresh clone, use `rsync` or `scp` to push it over (or connect via Antigravity's Remote SSH and edit/deploy directly).

```bash
rsync -avz --exclude 'venv' --exclude '__pycache__' --exclude '.env' \
  /path/to/local/Ustaad/ root@<droplet-ip>:/root/Ustaad/
```

Then set up the environment on the droplet:
```bash
cd Ustaad
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Env vars (`.env` on the droplet, set up fresh — don't rsync `.env` over unencrypted):
- Gemini API key
- Serper.dev key (`gl=pk`)
- Supabase URL + service key
- Any ReportLab / PDF-related config

- [ ] Code transferred to droplet
- [ ] venv created, deps installed
- [ ] `.env` created directly on droplet with correct values

---

## 3. Run the backend with PM2

```bash
pm2 start "uvicorn main:app --host 0.0.0.0 --port 8000" --name ustaad-api
pm2 save
pm2 startup
```

Sanity check locally on droplet:
```bash
curl localhost:8000/health
```

- [ ] PM2 process running
- [ ] `/health` responds
- [ ] `pm2 startup` configured so it survives a droplet reboot

---

## 4. DNS — point subdomain at droplet

In **Name.com** (`ustaad.systems` registrar), add:

| Type | Host | Value |
|---|---|---|
| A | `api` | `<DO droplet IP>` |

- [ ] A record added
- [ ] Propagated (check with `dig api.ustaad.systems` or `nslookup`)

---

## 5. Caddy — automatic HTTPS (no ngrok)

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

`/etc/caddy/Caddyfile`:
```
api.ustaad.systems {
    reverse_proxy localhost:8000
}
```

```bash
sudo systemctl reload caddy
```

- [ ] Caddy installed
- [ ] Caddyfile configured
- [ ] Cert auto-provisioned (verify via browser padlock or `curl -v`)

---

## 6. Verify backend end-to-end on the HTTPS URL

```bash
curl https://api.ustaad.systems/health
```

Manually test (via curl or Postman):
- [ ] SSE streaming endpoint(s)
- [ ] Serper.dev calls resolve correctly with `gl=pk` from DO region
- [ ] Supabase read/write works
- [ ] PDF generation (ReportLab) works and returns valid file
- [ ] Any agent-to-agent orchestration completes without timeout

---

## 7. Update CORS on backend

Confirm FastAPI CORS middleware explicitly allows:
- `https://ustaad-virid.vercel.app`
- `https://www.ustaad.systems`
- `https://ustaad.systems` (non-www, if used)

```python
origins = [
    "https://ustaad-virid.vercel.app",
    "https://www.ustaad.systems",
    "https://ustaad.systems",
]
```

- [ ] CORS origins updated
- [ ] Backend restarted (`pm2 restart ustaad-api`)

---

## 8. Update Vercel env var

1. Vercel dashboard → project → **Settings → Environment Variables**
2. Set backend base URL var (e.g. `NEXT_PUBLIC_API_URL`) to:
   ```
   https://api.ustaad.systems
   ```
3. Redeploy (trigger via dashboard or push a trivial commit)

- [ ] Env var set
- [ ] Redeployed successfully

---

## 9. Verify both frontends live

- [ ] `https://ustaad-virid.vercel.app/` — full flow test (query → SSE stream → PDF export)
- [ ] `https://www.ustaad.systems/` — same full flow test
- [ ] Browser DevTools → Network tab confirms requests hit `api.ustaad.systems` with 200 responses, no CORS errors
- [ ] Mobile/incognito spot-check on both domains

---

## Notes

- Antigravity IDE via Remote SSH → use for direct backend debugging/edits on the droplet going forward.
- Submission URL (`ustaad-virid.vercel.app`) is unaffected by the custom domain addition — Vercel keeps the `.vercel.app` alias live by default.
- Once PM2 + Caddy are both configured with `pm2 startup` and Caddy's systemd service enabled, the backend survives droplet reboots without manual intervention.
