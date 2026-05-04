# Docker Quick Start — Archly.cloud

Unified Docker Compose setup for complete platform: database + collab server + frontend.

## Setup (2 minutes)

### 1. Copy environment file

```bash
cp .env.example .env.local
```

Edit `.env.local` and set your values:
- `POSTGRES_PASSWORD` — any secure password for local dev
- `BETTER_AUTH_SECRET` — generate with `openssl rand -base64 32` (min 32 chars)
- R2 credentials — optional, skip if not uploading files yet
- OAuth keys — optional, skip if not testing social login

### 2. Start all services

```bash
docker-compose up -d
```

Wait for all to be healthy:
```bash
docker-compose ps
# All 3 should show "healthy" or "running"
```

### 3. Initialize database

First run only. Applies Prisma migrations:

```bash
docker-compose exec frontend npx prisma migrate deploy
npx prisma generate
```

## Services

| Service | Port | Purpose |
|---------|------|---------|
| **postgres** | 5432 | PostgreSQL database |
| **collab** | 1234 | Yjs WebSocket server (real-time sync) |
| **frontend** | 3002 | Next.js app (dashboard, editor, API) |

## Common Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f frontend
docker-compose logs -f collab
docker-compose logs -f postgres

# Restart a service
docker-compose restart frontend

# Connect to database
docker-compose exec postgres psql -U archly -d archly

# Rebuild images (after code changes)
docker-compose build

# Full reset (destroys database)
docker-compose down -v
docker-compose up -d
```

## Development vs Production

The unified `docker-compose.yml` uses `NODE_ENV` to control behavior:

**Development** (NODE_ENV=development in .env.local):
- Frontend mounts source code for hot reload
- Yjs/Collab rebuilds with `Dockerfile.dev` (nodemon)
- All services log at debug level
- Database persists between restarts

**Production** (NODE_ENV=production in .env.local):
- Frontend uses immutable production image
- Yjs/Collab use slim production image
- All services log at info level
- Database persists between restarts

## Health Checks

All services include health checks. Docker waits for postgres to be healthy before starting frontend + collab.

```bash
# Check service health
docker-compose ps

# Manually test health
curl http://localhost:3002           # Frontend
curl http://localhost:1234/health    # Collab
psql -U archly -d archly -h localhost  # Postgres
```

## Environment Variables

See `.env.example` for all available vars. Key ones:

| Var | Purpose | Example |
|-----|---------|---------|
| `POSTGRES_PASSWORD` | DB password | `my_secure_pw` |
| `BETTER_AUTH_SECRET` | Auth secret (32+ chars) | Generated with openssl |
| `DATABASE_URL` | Prisma connection | Built from POSTGRES_* vars |
| `NEXT_PUBLIC_APP_URL` | Frontend URL | `http://localhost:3002` |
| `NEXT_PUBLIC_WS_URL` | Collab WebSocket | `ws://localhost:1234` |
| `R2_*` | Cloudflare R2 storage | Optional |
| `NODE_ENV` | Environment mode | `development` or `production` |

## Troubleshooting

**Port already in use:**
```bash
# Check what's using port
lsof -i :3002   # Frontend
lsof -i :1234   # Collab
lsof -i :5432   # Postgres

# Or change port in docker-compose.yml
```

**Database connection refused:**
```bash
# Ensure postgres is healthy
docker-compose logs postgres

# Wait a few seconds, retry
docker-compose restart frontend
```

**Yjs server not connecting:**
```bash
# Check collab logs
docker-compose logs collab

# Ensure DATABASE_URL is correct in .env.local
# Ensure frontend can reach collab at ws://localhost:1234
```

**Forgot .env.local:**
```bash
# You'll see: Environment variable not found errors
cp .env.example .env.local
# Edit and fill in values
docker-compose restart
```

## Next Steps

1. **Access the app**: http://localhost:3002
2. **Create account**: Use any email (or OAuth if configured)
3. **Create project**: Dashboard → "+ New Project"
4. **Real-time sync**: Open project in two browser tabs — edits sync live
5. **Marketplace**: Publish projects, clone from community

## Architecture

```
┌──────────────────────────────────────────────────┐
│  docker-compose.yml                              │
│  ├─ postgres:5432    (PostgreSQL)                │
│  │  └─ Stores: users, projects, scenes, activity│
│  ├─ collab:1234      (Yjs WebSocket)            │
│  │  └─ Real-time sync, awareness, persistence   │
│  └─ frontend:3002    (Next.js)                   │
│     └─ Dashboard, editor, marketplace, API      │
└──────────────────────────────────────────────────┘
         All configured via .env.local
```

## File Reference

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Unified orchestration (all 3 services) |
| `.env.example` | Template with all vars (copy to .env.local) |
| `.env.local` | Actual values (never commit) |
| `Dockerfile` | Production frontend build |
| `services/collab/Dockerfile` | Production collab build |
| `services/database/init.sql` | Database initialization |
