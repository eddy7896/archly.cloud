# Platform Setup & Quick Start — archly.cloud

Getting the collaborative 3D architectural design platform up and running.

---

## What You Just Built

A enterprise-grade, fully compartmentalized SaaS platform consisting of:

1. **Frontend (apps/editor)** — Next.js dashboard, marketplace, editor UI
2. **3D Viewer (packages/viewer)** — WebGL canvas with Three.js
3. **Collaboration Server (services/collab)** — Yjs WebSocket for real-time sync
4. **PostgreSQL** — Users, projects, organizations, activity logs, Yjs snapshots
5. **Docker Compose** — All services orchestrated together

---

## Architecture at a Glance

```
5 Layers (Dependency Downward Only)
┌─────────────────┐
│  apps/editor    │  Platform UI: Dashboard, Marketplace, Tools
├─────────────────┤
│ packages/editor │  Editor Logic: useEditor hook, shortcuts
├─────────────────┤
│packages/viewer  │  3D Canvas: Three.js rendering
├─────────────────┤
│ packages/core   │  Domain Logic: Scene graph, pure logic
├─────────────────┤
│ packages/ui     │  Design System: Radix + Tailwind components
└─────────────────┘

Microservices (External)
┌─────────────────┐
│services/collab  │  Yjs WebSocket Server (port 1234)
├─────────────────┤
│   PostgreSQL    │  Database (port 5432)
└─────────────────┘
```

---

## Files You Got

### **Documentation**

| File | What It Is |
|------|-----------|
| **ARCHITECTURE.md** | System design, layer definitions, data flow |
| **COMPARTMENTALIZATION.md** | Layer boundaries, what goes where, circular dependency prevention |
| **DOCKER_SETUP.md** | Docker & container operations, troubleshooting |
| **DEPLOYMENT_CHECKLIST.md** | Pre-flight checks, incident response, rollback |
| **PROJECT_STRUCTURE.md** | Directory layout, quick reference, debugging tips |
| **PLATFORM_SETUP.md** | This file (getting started) |

### **Docker & Environment**

| File | What It Is |
|------|-----------|
| **.env.template** | Environment variable template (copy to .env.local) |
| **docker-compose.yml** | Production orchestration |
| **docker-compose.dev.yml** | Development (hot reload) |
| **Dockerfile** | Frontend production image |
| **Dockerfile.dev** | Frontend dev image |
| **services/collab/Dockerfile** | Collab server production |
| **services/collab/Dockerfile.dev** | Collab server dev |
| **services/database/init.sql** | Database schema (auto-runs) |

---

## Quick Start (5 minutes)

### 1. Create Environment File

```bash
cp .env.template .env.local
```

Edit `.env.local` with actual values:
```env
# Database (use any password for local dev)
POSTGRES_PASSWORD=dev_password

# Auth (generate random 32+ char string)
BETTER_AUTH_SECRET=your_secret_here_min_32_chars

# Storage (optional for local dev)
R2_ENDPOINT=https://xxxx.r2.cloudflarestorage.com
R2_BUCKET=archly-assets
R2_ACCESS_KEY_ID=your_key
R2_SECRET_ACCESS_KEY=your_secret
```

### 2. Start All Services

```bash
docker-compose -f docker-compose.dev.yml up
```

Services will be ready in ~30 seconds:
- **Frontend:** http://localhost:3002
- **Collab Server:** ws://localhost:1234 (automatic)
- **PostgreSQL:** localhost:5432 (internal only)

### 3. Test It Works

Open http://localhost:3002 in browser.

```bash
# If frontend doesn't load, check logs:
docker-compose logs frontend

# If collab server won't start, check:
docker-compose logs collab

# Database connection issues:
docker-compose logs postgres
```

---

## What Runs on Each Port

| Port | Service | Purpose |
|------|---------|---------|
| **3002** | Frontend (Next.js) | Dashboard, marketplace, editor UI |
| **1234** | Collab Server | WebSocket for real-time sync |
| **5432** | PostgreSQL | Database (internal network only) |

---

## Development Workflow

### **Start Dev Environment**

```bash
# Terminal 1: Start services
docker-compose -f docker-compose.dev.yml up

# Terminal 2: Watch frontend logs
docker-compose logs -f frontend

# Terminal 3: Watch collab logs
docker-compose logs -f collab
```

### **Make Code Changes**

Changes to frontend code auto-reload (hot reload via volume mounts).

```bash
# Edit: apps/editor/app/page.tsx
# → Frontend automatically rebuilds and reloads browser
```

For database schema changes:

```bash
# Add migration (if using Prisma)
docker-compose exec frontend npx prisma migrate dev --name your_migration_name

# Or SQL directly
docker-compose exec postgres psql -U archly -d archly
# Type your SQL, press Enter
```

### **Stop Services**

```bash
docker-compose down        # Stop all
docker-compose down -v     # Stop + delete volumes (⚠️ deletes data)
```

---

## Key Concepts

### **Real-Time Collaboration**

Two users open the same project:

1. Browser A connects → WebSocket to collab server
2. Browser B connects → WebSocket to same room
3. User A edits → CRDT update sent to server
4. Server broadcasts to User B → User B sees change instantly
5. All updates persisted to PostgreSQL for recovery

**Technology:** Yjs (CRDT) + WebSocket + PostgreSQL

### **Presence (Cursors)**

Each connected user broadcasts:
- Cursor position
- Selection state
- Activity (idle/editing)

Rendered as colored cursor badges in the 3D view.

### **Layer Isolation**

- **packages/core** → Pure domain logic (scene graph, selections, spatial queries)
- **packages/ui** → Design system (buttons, panels, colors)
- **packages/viewer** → 3D rendering (Three.js, camera, lights)
- **packages/editor** → Editor logic (hooks, shortcuts, command palette)
- **apps/editor** → Platform UI (dashboard, marketplace, **all tools**)

**Rule:** Import flows downward only. Never up.

### **Asset Storage**

Models, textures, images stored in Cloudflare R2 (S3-compatible CDN).

- Client uploads file
- Gets pre-signed R2 URL from backend
- Uploads directly to R2 (bypasses server bandwidth)
- Client stores R2 URL in scene graph
- No file duplication on clone (URLs are pointers)

---

## Common Tasks

### **Add a New Tool**

Tools live in `apps/editor/components/tools/`. Example: SelectionTool.

```typescript
// apps/editor/components/tools/MyNewTool.tsx
import { useEditor } from '@pascal-app/editor';

export function MyNewTool() {
  const { scene } = useEditor();

  const handleClick = (e) => {
    // Modify scene
    scene.mutate(nodeId, { property: value });
  };

  return <div onClick={handleClick}>My Tool</div>;
}
```

Register in Editor:
```typescript
// apps/editor/components/Editor.tsx
{editor.activeTool === 'myNewTool' && <MyNewTool />}
```

### **Add Domain Logic**

New scene graph operations go in `packages/core`.

```typescript
// packages/core/src/scene/operations.ts
export function duplicateNode(node: Node): Node {
  return { ...node, id: generateId() };
}
```

### **Add UI Component**

Reusable buttons, panels, modals go in `packages/ui`.

```typescript
// packages/ui/src/components/MyPanel.tsx
import { Glassmorphism } from './Glassmorphism';

export function MyPanel({ children }) {
  return <Glassmorphism>{children}</Glassmorphism>;
}
```

### **Add API Route**

New endpoints in `apps/editor/app/api/`.

```typescript
// apps/editor/app/api/projects/[id]/route.ts
export async function GET(req, { params }) {
  const project = await db.projects.findUnique({
    where: { id: params.id }
  });
  return Response.json(project);
}
```

### **Add Database Table**

Edit `services/database/init.sql`, then restart:

```sql
CREATE TABLE myTable (
  id UUID PRIMARY KEY,
  ...
);
```

```bash
docker-compose down -v  # Delete old data
docker-compose up       # Reinit with new schema
```

---

## Deployment to Production

See **DEPLOYMENT_CHECKLIST.md** for full pre-flight & launch procedure.

**Quick version:**

```bash
# 1. Build images
docker build -t archly-frontend:1.0.0 -f Dockerfile .
docker build -t archly-collab:1.0.0 -f services/collab/Dockerfile .

# 2. Create prod .env.local with real secrets
cp .env.template .env.local
# Edit with production values

# 3. Start services
docker-compose -f docker-compose.yml up -d

# 4. Run migrations
docker-compose exec frontend npx prisma migrate deploy

# 5. Verify health
curl https://api.archly.cloud/api/health
curl https://collab.archly.cloud/health
```

---

## Troubleshooting

### **Frontend won't start**

```bash
docker-compose logs frontend | tail -50
```

**Common issues:**
- Port 3002 already in use → `lsof -ti:3002 | xargs kill -9`
- DATABASE_URL not set → Check .env.local
- Node modules missing → `docker-compose build --no-cache frontend`

### **WebSocket not connecting**

```bash
# Check collab server is running
docker-compose ps

# Test WebSocket manually
wscat -c ws://localhost:1234

# Check frontend is trying correct URL
curl http://localhost:3002  # Check HTML for NEXT_PUBLIC_WS_URL
```

### **Database locked**

```bash
docker-compose exec postgres psql -U archly -d archly -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE datname = 'archly' AND pid != pg_backend_pid();
"
```

### **Out of disk space**

```bash
docker system prune -a --volumes
docker-compose build --no-cache
docker-compose up
```

---

## Architecture Rules (Golden)

1. ✅ **Dependency flows downward only**
   - apps/editor imports packages/*
   - packages/editor imports packages/core, packages/ui
   - packages/viewer imports packages/core, packages/ui
   - packages/core imports nothing ← Pure logic

2. ✅ **Core has zero view concepts**
   - No Three.js imports
   - No React imports
   - No floorplan, paint mode, editor tool references
   - Pure TypeScript/functions

3. ✅ **Tools live in apps/editor/components/tools/**
   - Never in packages/editor/tools/
   - Never in packages/core/

4. ✅ **Composition over coupling**
   - Tools are children of Viewer, not embedded
   - Editor features injected via props/children

5. ✅ **Single source of truth for env**
   - One `.env.local` for all services
   - No per-service env files (except secrets vault in prod)

6. ✅ **Docker is optional (local dev)**
   - Can run `npm run dev` without Docker
   - But collab server requires manual setup

---

## Next Steps

1. **Read ARCHITECTURE.md** → Understand the system design
2. **Read COMPARTMENTALIZATION.md** → Learn layer boundaries
3. **Run locally** → `docker-compose -f docker-compose.dev.yml up`
4. **Make a change** → Edit a file, see hot reload work
5. **Add a feature** → Pick a layer, follow the pattern
6. **Deploy** → Follow DEPLOYMENT_CHECKLIST.md

---

## Help & Support

- **Architecture questions?** → ARCHITECTURE.md
- **Layer boundaries?** → COMPARTMENTALIZATION.md
- **Docker issues?** → DOCKER_SETUP.md
- **Adding features?** → PROJECT_STRUCTURE.md → "When Adding Features"
- **Going to prod?** → DEPLOYMENT_CHECKLIST.md

---

## Tech Stack Summary

| Layer | Tech | Purpose |
|-------|------|---------|
| Frontend | Next.js 16, React 19, TypeScript | Platform UI |
| 3D | Three.js, React Three Fiber | WebGL rendering |
| State | Yjs (CRDT), WebSocket | Real-time sync |
| Auth | BetterAuth | Magic links, OAuth |
| Database | PostgreSQL, Prisma | Persistence |
| Storage | Cloudflare R2 | Asset CDN |
| UI | Radix UI, Tailwind CSS, Framer Motion | Design system |
| Docker | Docker Compose | Orchestration |
| Build | Turbo, Biome | Monorepo tooling |

---

## Environment Checklist

Before going to production, set these in `.env.local`:

- [ ] `POSTGRES_PASSWORD` — Strong password (16+ chars)
- [ ] `BETTER_AUTH_SECRET` — Random 32+ char string
- [ ] `DATABASE_URL` — Prod DB connection
- [ ] `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — From Google Cloud Console
- [ ] `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` — From GitHub
- [ ] `R2_*` — Cloudflare R2 credentials
- [ ] `NEXT_PUBLIC_APP_URL` — Production domain
- [ ] `NEXT_PUBLIC_WS_URL` — Production WebSocket URL
- [ ] `RESEND_API_KEY` — Email service (optional)
- [ ] `LOG_LEVEL` — Set to `info` or `warn`

---

## You're Ready

All infrastructure, documentation, and Docker setup is in place.

**Start with:** `docker-compose -f docker-compose.dev.yml up`

Then read ARCHITECTURE.md to understand the big picture.

Happy building! 🚀
