# Docker Setup Guide — archly.cloud

Complete guide to containerizing and deploying the archly.cloud platform.

---

## Quick Start

### 1. Create `.env.local` from template

```bash
cp .env.template .env.local
```

Edit `.env.local` with actual values:
- `POSTGRES_PASSWORD`: Strong password for DB
- `BETTER_AUTH_SECRET`: Random 32+ char secret
- `R2_*`: Cloudflare credentials (optional for local dev)
- `GOOGLE_*`, `GITHUB_*`: OAuth creds (optional for local dev)

### 2. Start Development Environment

```bash
docker-compose -f docker-compose.dev.yml up
```

Services will be available at:
- **Frontend:** http://localhost:3002
- **Collab Server:** ws://localhost:1234
- **PostgreSQL:** localhost:5432

### 3. Initialize Database (first time only)

```bash
# Migrations run automatically via frontend on startup
docker-compose -f docker-compose.dev.yml exec frontend npx prisma migrate deploy
```

---

## Service Architecture

### **Frontend (Next.js)**
- Port: 3002
- Serves dashboard, marketplace, editor UI
- Handles auth, project CRUD, asset uploads
- WebSocket connection to collab server

**Environment Variables:**
```env
NEXT_PUBLIC_APP_URL=http://localhost:3002
NEXT_PUBLIC_WS_URL=ws://localhost:1234
DATABASE_URL=postgresql://archly:password@postgres:5432/archly
```

**Dockerfile:** `Dockerfile` (prod), `Dockerfile.dev` (dev)

### **Collaboration Server (Node.js + Yjs)**
- Port: 1234
- Yjs WebSocket server for real-time sync
- Persists document state to PostgreSQL
- Handles presence (cursors, activity)

**Environment Variables:**
```env
YJS_PERSISTENCE_ENABLED=true
YJS_PERSISTENCE_DB_URL=postgresql://archly:password@postgres:5432/archly
YJS_SNAPSHOT_INTERVAL=3600000  # 1 hour
```

**Dockerfile:** `services/collab/Dockerfile`

### **PostgreSQL**
- Port: 5432
- Stores: Users, projects, organizations, teams, activity log
- Stores: Yjs document snapshots (for recovery)
- Initialized from `services/database/init.sql`

---

## Development Workflow

### **Local Dev (No Docker)**

```bash
npm run dev
# Runs Turbo with all workspaces
# Frontend: port 3002
# ⚠️ Collab server needs manual setup (Yjs testing required)
```

### **Docker Dev (Recommended)**

```bash
docker-compose -f docker-compose.dev.yml up
```

**Features:**
- Hot reload (volume mounts for src files)
- Shared `.env.local` across all services
- PostgreSQL data persists in `postgres_data_dev` volume
- Logs stream to terminal

**Access services:**
```bash
# Frontend logs
docker-compose -f docker-compose.dev.yml logs -f frontend

# Collab logs
docker-compose -f docker-compose.dev.yml logs -f collab

# Database shell
docker-compose -f docker-compose.dev.yml exec postgres psql -U archly -d archly

# Frontend shell (for Prisma CLI, etc.)
docker-compose -f docker-compose.dev.yml exec frontend bash
```

### **Building Images**

```bash
# Build all images locally
docker-compose build

# Build specific service
docker-compose build frontend
docker-compose build collab
```

### **Production Build**

```bash
# Build optimized images (production target)
docker build -t archly-frontend:1.0.0 -f Dockerfile .
docker build -t archly-collab:1.0.0 -f services/collab/Dockerfile .

# Start production stack
docker-compose -f docker-compose.yml up -d
```

---

## Environment Variables

### **Unified .env.local**

All services read from a single `.env.local` (shared via Docker compose env_file).

**Sections:**

1. **Database**
   - `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
   - `DATABASE_URL` (Prisma connection string)

2. **Frontend**
   - `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`
   - `NODE_ENV` (development/production)

3. **Auth**
   - `BETTER_AUTH_SECRET` (min 32 chars)
   - `BETTER_AUTH_URL`
   - OAuth creds: `GOOGLE_*`, `GITHUB_*`

4. **Storage (Cloudflare R2)**
   - `R2_ENDPOINT`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
   - `R2_PUBLIC_URL` (client-facing CDN URL)

5. **Collaboration**
   - `YJS_PERSISTENCE_ENABLED` (true/false)
   - `YJS_PERSISTENCE_DB_URL` (same as DATABASE_URL)
   - `YJS_SNAPSHOT_INTERVAL` (milliseconds)

6. **Logging**
   - `LOG_LEVEL` (debug/info/warn/error)

**See `.env.template` for full template.**

---

## Database Migrations

### **Using Prisma**

```bash
# Generate migration
docker-compose -f docker-compose.dev.yml exec frontend npx prisma migrate dev --name <migration_name>

# Deploy migration (prod)
docker-compose -f docker-compose.dev.yml exec frontend npx prisma migrate deploy

# View schema
docker-compose -f docker-compose.dev.yml exec frontend npx prisma studio
```

### **Direct SQL**

```bash
# Connect to PostgreSQL
docker-compose -f docker-compose.dev.yml exec postgres psql -U archly -d archly

# Run SQL file
docker-compose -f docker-compose.dev.yml exec postgres psql -U archly -d archly < schema.sql
```

---

## Networking

### **Docker Compose Network**

All services communicate via internal `archly-network` bridge:

```
┌─────────────────────────────────────┐
│       docker network                │
│                                     │
│  frontend (3002) → postgres:5432    │
│  frontend (3002) → collab:1234 (WS) │
│  collab (1234) → postgres:5432      │
│                                     │
│  Host: localhost (published ports)  │
└─────────────────────────────────────┘
```

**Internal DNS:**
- Frontend: `frontend:3002` (inside docker)
- Collab: `collab:1234` (inside docker)
- PostgreSQL: `postgres:5432` (inside docker)

**From Host Machine:**
- Frontend: `http://localhost:3002`
- WebSocket: `ws://localhost:1234`
- PostgreSQL: `localhost:5432`

---

## Health Checks

All services include health checks:

```bash
# Check service status
docker-compose ps

# Check specific service
docker-compose logs frontend | tail -20

# Manual health check
curl http://localhost:3002/api/health
curl http://localhost:1234/health
docker-compose exec postgres pg_isready -U archly
```

---

## Persistence & Data

### **PostgreSQL Volume**

```bash
# View volume
docker volume ls | grep archly

# Inspect volume
docker volume inspect archly-postgres_data_dev

# Backup database
docker-compose exec postgres pg_dump -U archly archly > backup.sql

# Restore database
docker-compose exec postgres psql -U archly archly < backup.sql

# Delete data (WARNING: destructive)
docker volume rm archly-postgres_data_dev
```

### **Yjs Document Snapshots**

Documents stored in PostgreSQL `yjs_documents` table:
- Primary key: `doc_id` (project ID)
- Binary: `state` (encoded Yjs update)
- Timestamp: `updated_at`

---

## Troubleshooting

### **Frontend won't start**

```bash
docker-compose logs frontend
# Check for:
# - DATABASE_URL not set
# - Port 3002 already in use
# - Node dependencies not installed
```

**Fix:**
```bash
# Rebuild from scratch
docker-compose down -v
docker-compose -f docker-compose.dev.yml build --no-cache frontend
docker-compose -f docker-compose.dev.yml up frontend
```

### **Collab server won't connect**

```bash
docker-compose logs collab
# Check for:
# - DATABASE_URL not set
# - Port 1234 already in use
# - PostgreSQL not ready
```

**Fix:**
```bash
docker-compose up postgres  # Start DB first
docker-compose up collab    # Then start collab server
```

### **WebSocket connection fails**

```bash
# Test WebSocket from host
wscat -c ws://localhost:1234

# Check from frontend logs
docker-compose logs frontend | grep -i websocket
```

### **Database locked / migration fails**

```bash
# Kill other connections
docker-compose exec postgres psql -U archly -d archly -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE datname = 'archly' AND pid != pg_backend_pid();
"

# Retry migration
docker-compose exec frontend npx prisma migrate resolve --rolled-back <migration_name>
docker-compose exec frontend npx prisma migrate deploy
```

### **Out of disk space**

```bash
# Clean up Docker
docker system prune -a --volumes

# Rebuild
docker-compose build --no-cache
docker-compose up
```

---

## Production Deployment

### **Using docker-compose.prod.yml**

```bash
# Set environment
export NODE_ENV=production

# Create .env.local with prod secrets
cp .env.template .env.local
# Edit: strong DB password, real OAuth creds, R2 credentials, auth secret

# Build images
docker-compose -f docker-compose.yml build

# Start services
docker-compose -f docker-compose.yml up -d

# Check status
docker-compose ps
docker-compose logs
```

### **Using Kubernetes (Optional)**

Create `k8s/` directory with:
- `deployment.yaml` (frontend + collab)
- `statefulset.yaml` (postgres)
- `service.yaml` (expose frontend, collab)
- `configmap.yaml` (environment)
- `secret.yaml` (sensitive env vars)

```bash
kubectl apply -f k8s/
kubectl get pods
```

### **Using Docker Swarm (Optional)**

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml archly

# Check status
docker service ls
docker service logs archly_frontend
```

---

## Monitoring & Logging

### **Container Logs**

```bash
# Stream all logs
docker-compose logs -f

# Specific service
docker-compose logs -f frontend

# Follow last 50 lines
docker-compose logs --tail=50 frontend
```

### **Stats**

```bash
# CPU, memory, network usage
docker stats

# Specific service
docker stats archly-frontend
```

### **API Health Endpoints**

```bash
# Frontend
curl http://localhost:3002/api/health

# Collab server
curl http://localhost:1234/health
curl http://localhost:1234/stats

# Database (via frontend)
curl http://localhost:3002/api/db-health
```

---

## Security Notes

1. **Never commit `.env.local`** — use `.env.template`
2. **Rotate `BETTER_AUTH_SECRET`** regularly
3. **Use strong `POSTGRES_PASSWORD`** (>16 chars, mixed case, special chars)
4. **Restrict database access** — use internal network, no public port exposure
5. **Enable SSL/TLS** in production (nginx reverse proxy)
6. **Validate R2 bucket CORS** — only allow archly.cloud origin
7. **Audit logs** — check `activity` table for suspicious actions

---

## Cleanup

```bash
# Stop all services
docker-compose down

# Remove volumes (⚠️ deletes data)
docker-compose down -v

# Remove images
docker rmi archly-frontend archly-collab

# Prune unused Docker resources
docker system prune -a --volumes
```
