# Caddy Reverse Proxy Setup — archly.cloud

Unified reverse proxy routing all traffic through single domain.

## What is Caddy?

- HTTP/2 reverse proxy
- Auto HTTPS (Let's Encrypt in production)
- WebSocket support with header rewriting
- Built-in compression + security headers
- Reads from single Caddyfile

## Quick Setup (Local Development)

### 1. Edit /etc/hosts (Linux/Mac) or C:\Windows\System32\drivers\etc\hosts (Windows)

Add:
```
127.0.0.1  archly.local
```

### 2. Update .env.local

```bash
cp .env.example .env.local
```

Set:
```
CADDY_DOMAIN=archly.local
NEXT_PUBLIC_APP_URL=http://archly.local
NEXT_PUBLIC_API_URL=http://archly.local/api
NEXT_PUBLIC_WS_URL=ws://archly.local/ws
BETTER_AUTH_URL=http://archly.local
```

### 3. Start all services

```bash
docker-compose up -d
```

### 4. Access application

Open http://archly.local in browser.

## What Caddy Does

Routes all traffic to internal services:

```
http://archly.local
    ├─ /api/*  → frontend:3002 (Next.js API)
    ├─ /ws     → collab:1234 (Yjs WebSocket)
    └─ /*      → frontend:3002 (SPA + static assets)
```

WebSocket headers automatically upgraded:
- `Connection: upgrade`
- `Upgrade: websocket`
- `X-Real-IP` + `X-Forwarded-*` headers added

## Production Setup

### 1. Update Caddyfile

Uncomment the production block in Caddyfile:

```caddyfile
archly.cloud {
  # HTTPS auto-provisioned by Let's Encrypt
  # ... routes ...
}
```

### 2. Update .env

```
CADDY_DOMAIN=archly.cloud
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://archly.cloud
NEXT_PUBLIC_API_URL=https://archly.cloud/api
NEXT_PUBLIC_WS_URL=wss://archly.cloud/ws
BETTER_AUTH_URL=https://archly.cloud
```

### 3. DNS

Point `archly.cloud` A record to your server IP.

### 4. Start

```bash
docker-compose up -d
```

Caddy automatically:
- Obtains HTTPS certificate from Let's Encrypt
- Redirects HTTP → HTTPS
- Adds Strict-Transport-Security headers
- Renews certificate 30 days before expiry

## Routing Rules

| Path | Destination | Purpose |
|------|-------------|---------|
| `/api/*` | frontend:3002 | REST API endpoints |
| `/ws` | collab:1234 | WebSocket for live sync |
| `/*` | frontend:3002 | SPA app + static assets |

## Headers

Security headers automatically added:

```
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin

# Production only:
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; ...
```

## Caddy Admin API (Port 2019)

Caddy exposes admin API for runtime config changes:

```bash
# Get current config
curl http://localhost:2019/config/

# Reload Caddyfile without restart
curl -X POST http://localhost:2019/load \
  -H "Content-Type: application/json" \
  -d @Caddyfile
```

Disable in production by setting `admin off` in Caddyfile global options.

## Debugging

### Check Caddy status

```bash
docker-compose ps caddy
```

### View Caddy logs

```bash
docker-compose logs -f caddy
```

### Test reverse proxy

```bash
# Should return frontend response
curl http://archly.local

# Should return API response
curl http://archly.local/api/health

# Should upgrade to WebSocket
curl -i -N -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  http://archly.local/ws
```

### Verify routing

```bash
# All these should work:
curl http://archly.local              # Frontend
curl http://archly.local/api/projects # API endpoint
```

### Check DNS (production)

```bash
nslookup archly.cloud
# Should return your server IP
```

## Disable Caddy (use localhost:3002 instead)

If you don't want the reverse proxy:

1. Remove caddy service from docker-compose.yml
2. Remove Caddyfile
3. Set in .env.local:
   ```
   NEXT_PUBLIC_APP_URL=http://localhost:3002
   NEXT_PUBLIC_API_URL=http://localhost:3002/api
   NEXT_PUBLIC_WS_URL=ws://localhost:1234
   BETTER_AUTH_URL=http://localhost:3002
   ```
4. Access at http://localhost:3002

## Caddyfile Reference

See [Caddy docs](https://caddyserver.com/docs/) for full syntax.

Key directives used:
- `reverse_proxy` — forward requests to upstream
- `header_up` — modify request headers before forwarding
- `header` — add/modify response headers
- `encode` — compress responses (gzip)
- `rate_limit` — throttle requests
- `log` — structured logging to stdout

## Troubleshooting

**DNS not resolving:**
```bash
# Linux/Mac: check hosts file
cat /etc/hosts | grep archly.local

# Windows: check hosts file
type C:\Windows\System32\drivers\etc\hosts | find "archly.local"

# Flush DNS cache
# Linux: sudo systemctl restart systemd-resolved
# Mac: sudo dscacheutil -flushcache
# Windows: ipconfig /flushdns
```

**Caddy won't start:**
```bash
# Check Caddyfile syntax
docker-compose run --rm caddy caddy validate

# Check logs
docker-compose logs caddy
```

**WebSocket not connecting:**
```bash
# Check collab server is healthy
docker-compose ps collab

# Test direct connection
curl http://localhost:1234/health

# Check Caddy routing
docker-compose logs caddy | grep ws
```

**Port 80 in use:**
```bash
# Find what's using port 80
lsof -i :80

# Change Caddy port in docker-compose.yml:
ports:
  - "8080:80"    # Access at http://archly.local:8080
  - "443:443"
```

## File Reference

| File | Purpose |
|------|---------|
| `Caddyfile` | Reverse proxy configuration (routes, headers, logging) |
| `docker-compose.yml` | Caddy service definition + volumes |
| `.env.example` | CADDY_DOMAIN + updated URLs |
