# Project Structure Reference — archly.cloud

Quick navigation guide for the compartmentalized platform architecture.

---

## Directory Layout

```
editor/
├── ARCHITECTURE.md              ← Core architecture overview
├── COMPARTMENTALIZATION.md      ← Layer boundaries & patterns
├── DOCKER_SETUP.md              ← Docker deployment guide
├── DEPLOYMENT_CHECKLIST.md      ← Pre-flight checks
├── PROJECT_STRUCTURE.md         ← This file (navigation)
│
├── .env.template                ← Unified env template (copy to .env.local)
├── docker-compose.yml           ← Production compose
├── docker-compose.dev.yml       ← Development compose
├── Dockerfile                   ← Frontend production image
├── Dockerfile.dev               ← Frontend dev image
│
├── package.json                 ← Monorepo root (Turbo)
├── turbo.json                   ← Turbo build pipeline
├── prd.md                       ← Product requirements
├── trd.md                       ← Technical requirements
├── design_refrence_doc.md       ← UI/UX design system
│
├── apps/
│   ├── editor/                  ← Next.js Platform Layer
│   │   ├── app/                 ← Next.js App Router
│   │   │   ├── page.tsx         ← Landing page
│   │   │   ├── dashboard/       ← Project browser (Figma-style)
│   │   │   ├── editor/          ← Editor wrapper shell
│   │   │   ├── marketplace/     ← Gallery + clone features
│   │   │   └── api/             ← REST endpoints
│   │   ├── components/
│   │   │   ├── Editor.tsx       ← Main editor wrapper
│   │   │   ├── tools/           ← ⭐ All tools live here
│   │   │   │   ├── SelectionTool.tsx
│   │   │   │   ├── TransformTool.tsx
│   │   │   │   └── ...
│   │   │   ├── Dashboard.tsx
│   │   │   └── Marketplace.tsx
│   │   ├── lib/
│   │   ├── public/
│   │   ├── package.json
│   │   └── next.config.ts
│   │
│   └── (other apps if needed)
│
├── packages/
│   ├── core/                    ← Domain Logic (No View Concepts)
│   │   ├── src/
│   │   │   ├── schemas/         ← Zod schemas (nodes, materials)
│   │   │   ├── scene/           ← Scene graph operations
│   │   │   ├── selection/       ← Selection logic
│   │   │   ├── spatial/         ← Raycasting, bounds
│   │   │   ├── events/          ← Pure domain events
│   │   │   └── utils/
│   │   └── package.json
│   │
│   ├── ui/                      ← Design System (Radix + Tailwind)
│   │   ├── src/
│   │   │   ├── components/      ← Button, Panel, Modal, etc.
│   │   │   ├── styles/          ← Tailwind config, globals.css
│   │   │   ├── tokens/          ← Colors, typography, spacing
│   │   │   └── hooks/           ← useMediaQuery, etc.
│   │   └── package.json
│   │
│   ├── viewer/                  ← 3D Canvas (Three.js + React Three Fiber)
│   │   ├── src/
│   │   │   ├── canvas/
│   │   │   │   ├── Viewer.tsx   ← Main canvas component
│   │   │   │   └── Camera.tsx
│   │   │   ├── systems/         ← Renderer systems
│   │   │   │   ├── LightSystem.ts
│   │   │   │   └── MaterialSystem.ts
│   │   │   ├── loaders/         ← Asset loading from R2
│   │   │   ├── hooks/
│   │   │   │   └── useViewer.ts
│   │   │   └── types/
│   │   └── package.json
│   │
│   ├── editor/                  ← Editor Logic (Tools Registry, Hooks)
│   │   ├── src/
│   │   │   ├── hooks/
│   │   │   │   └── useEditor.ts
│   │   │   ├── context/
│   │   │   │   └── EditorContext.tsx
│   │   │   ├── commands/        ← Command palette
│   │   │   ├── shortcuts/       ← Keyboard shortcuts
│   │   │   ├── inspector/       ← Properties panel
│   │   │   └── undo-redo/       ← History
│   │   └── package.json
│   │
│   ├── database/                ← Prisma ORM Schema (Optional)
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── package.json
│   │
│   ├── eslint-config/
│   ├── typescript-config/
│   ├── mcp/
│   └── (other shared packages)
│
├── services/                    ← Microservices (outside monorepo)
│   ├── collab/                  ← Yjs WebSocket Server
│   │   ├── src/
│   │   │   ├── index.ts         ← Server entry
│   │   │   ├── lib/
│   │   │   │   ├── logger.ts
│   │   │   │   └── id-gen.ts
│   │   │   └── server/
│   │   │       └── yjs-server.ts
│   │   ├── Dockerfile           ← Production image
│   │   ├── Dockerfile.dev       ← Dev image
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── database/                ← Database init scripts
│       └── init.sql             ← Schema, tables, indexes
│
└── tooling/                     ← Build tools, linters
    ├── eslint-config/
    └── (others)
```

---

## Key Files

| File | Purpose |
|------|---------|
| `.env.template` | Environment variable template (copy to `.env.local`) |
| `.env.local` | Actual config (never commit) — used by all Docker services |
| `ARCHITECTURE.md` | System overview, layer definitions, data flow |
| `COMPARTMENTALIZATION.md` | Layer boundaries, what goes where, patterns |
| `DOCKER_SETUP.md` | Docker & container operations |
| `DEPLOYMENT_CHECKLIST.md` | Pre-flight & deployment steps |
| `docker-compose.yml` | Production orchestration |
| `docker-compose.dev.yml` | Development orchestration (hot reload) |
| `Dockerfile` | Frontend production image |
| `services/collab/Dockerfile` | Collab server production image |
| `services/database/init.sql` | Database schema + tables |

---

## Quick Command Reference

### **Local Development (No Docker)**
```bash
npm run dev              # Start all services (Turbo)
npm run build            # Build all packages
npm run check-types      # TypeScript check
npm run lint:fix         # Auto-fix linting errors
```

### **Docker Development**
```bash
docker-compose -f docker-compose.dev.yml up

# In another terminal:
docker-compose -f docker-compose.dev.yml logs -f frontend
docker-compose -f docker-compose.dev.yml exec frontend bash
```

### **Production Build & Deploy**
```bash
npm run build
docker build -t archly-frontend:1.0.0 -f Dockerfile .
docker build -t archly-collab:1.0.0 -f services/collab/Dockerfile .
docker-compose -f docker-compose.yml up -d
```

### **Database Operations**
```bash
# Migrations (if using Prisma)
docker-compose exec frontend npx prisma migrate dev --name <name>
docker-compose exec frontend npx prisma migrate deploy

# Direct SQL
docker-compose exec postgres psql -U archly -d archly

# Backup
docker-compose exec postgres pg_dump -U archly archly > backup.sql

# Restore
docker-compose exec postgres psql -U archly archly < backup.sql
```

### **Debugging**
```bash
# View logs
docker-compose logs <service>
docker-compose logs --tail=50 -f frontend

# Into container
docker-compose exec frontend bash
docker-compose exec collab npm run dev

# Check status
docker-compose ps
docker stats
```

---

## Architecture Layers (Dependency Order)

```
1. packages/core
   └─ Pure domain logic, no frameworks, no view concepts
   └─ ❌ Never imports: three.js, React, viewer, editor, apps
   └─ ✅ Imports: zod, date-fns, lodash (utilities only)

2. packages/ui
   └─ Design system components & tokens
   └─ ❌ Never imports: core, viewer, editor, apps
   └─ ✅ Imports: react, radix-ui, tailwindcss, framer-motion

3. packages/viewer
   └─ 3D canvas & rendering systems
   └─ ❌ Never imports: editor, apps
   └─ ✅ Imports: core, ui, three.js, r3f

4. packages/editor
   └─ Editor logic, hooks, shortcuts
   └─ ❌ Never imports: apps (but used BY apps)
   └─ ✅ Imports: core, ui, viewer (as component only)

5. apps/editor
   └─ Platform UI (dashboard, marketplace, tools)
   └─ ✅ Imports: everything
```

**Golden Rule:** Only import from layers below. Never up.

---

## Features by Layer

### **packages/core**
- Node schemas (geometry, materials, transforms)
- Scene graph CRUD
- Selection queries
- Spatial queries (raycasting, bounds)
- Duplication/cloning logic
- Pure utility functions

### **packages/ui**
- Button, Panel, Modal, Card components
- Glassmorphism wrapper
- Icon library
- Loading skeletons
- Color tokens, typography tokens

### **packages/viewer**
- 3D scene rendering
- Camera control
- Asset loading (GLB, PNG from R2)
- Viewer state (useViewer hook)
- Lighting, shadows, post-processing

### **packages/editor**
- `useEditor` hook (editor state)
- Keyboard shortcuts
- Command palette
- Inspector/properties panel
- Undo/redo system
- Tool registry

### **apps/editor**
- ✅ Dashboard (Figma-style)
- ✅ Marketplace (gallery, clone)
- ✅ Authentication (login, signup)
- ✅ Project CRUD (create, delete, share)
- ✅ **All tools** (SelectionTool, TransformTool, PaintTool, etc.)
- ✅ Real-time presence indicators
- ✅ Asset upload & download
- ✅ Export/import

---

## Real-Time Collaboration Stack

```
Frontend (apps/editor)
    ↓↑ WebSocket
Yjs Server (services/collab)
    ↓↑ SQL
PostgreSQL (yjs_documents table)
```

**Key Services:**
- **Frontend:** WebSocket client (Yjs protocol)
- **Collab Server:** Broadcasts CRDT updates, persists snapshots
- **Database:** Stores document state for recovery

---

## Deployment Architecture

```
┌─────────────────────────────────┐
│   Docker Compose Orchestration  │
├─────────────────────────────────┤
│                                 │
│  frontend (Next.js, :3002)  ←→  │
│  collab (Yjs, :1234)        ←→  │
│  postgres (DB, :5432)           │
│                                 │
│  Network: archly-network        │
│  Env: .env.local (shared)       │
│                                 │
└─────────────────────────────────┘
```

**Services:**
1. **postgres** — PostgreSQL database
2. **collab** — Yjs WebSocket collaboration server
3. **frontend** — Next.js platform & editor UI

---

## When Adding Features

### **New Domain Logic** → `packages/core`
(Node properties, scene operations, spatial queries)

### **New UI Component** → `packages/ui`
(Reusable button, panel, dialog styles)

### **New Viewer Feature** → `packages/viewer`
(Lighting system, camera mode, rendering optimization)

### **New Editor Feature** → `packages/editor`
(Keyboard shortcut, command, hook)

### **New Tool** → `apps/editor/components/tools/`
(⭐ All tools go here, never in packages)

### **New API Route** → `apps/editor/app/api/`
(CRUD endpoint, search, upload pre-signed URL)

### **New Page** → `apps/editor/app/`
(Dashboard, settings, profile, etc.)

---

## Testing

```bash
npm run test                    # Run all tests
npm run test:watch             # Watch mode
npm run test -- packages/core  # Single package

# Type checking
npm run check-types
npm run check-types -- --watch
```

---

## Performance Optimization Checklist

- [ ] Assets lazy-loaded from R2 (no eager fetch)
- [ ] Scene graph uses memoization (React.memo, useMemo)
- [ ] Viewer viewport culling enabled
- [ ] PostgreSQL queries indexed (check `/services/database/init.sql`)
- [ ] Yjs snapshots persisted periodically
- [ ] WebSocket frames are binary (not text)
- [ ] API routes use pagination for large results
- [ ] Frontend bundles code-split by route

---

## Security Checklist

- [ ] No hardcoded secrets (use `.env.local`)
- [ ] SQL injection prevented (Prisma parameterized queries)
- [ ] XSS protected (React auto-escaping, Content-Security-Policy)
- [ ] CORS configured (R2 bucket origin whitelist)
- [ ] RBAC enforced (project member roles)
- [ ] Rate limiting on API routes
- [ ] Session tokens validated on each request
- [ ] File uploads scanned (MIME type validation)

---

## Debugging Guide

### **WebSocket not connecting?**
1. Check `NEXT_PUBLIC_WS_URL` in .env.local
2. Verify collab server running: `docker-compose ps`
3. Check collab logs: `docker-compose logs collab`
4. Try: `wscat -c ws://localhost:1234`

### **Database query slow?**
1. Check indexes in `services/database/init.sql`
2. Run Prisma Studio: `npx prisma studio`
3. Check connections: `SELECT * FROM pg_stat_activity`
4. Profile: Enable query logging in PostgreSQL

### **Tools not appearing?**
1. Verify tools are in `apps/editor/components/tools/`
2. Check they're imported in `Editor.tsx`
3. Check `useEditor()` returns correct `activeTool`
4. Look at browser console for errors

### **Real-time sync broken?**
1. Verify WebSocket connection in DevTools (Network tab)
2. Check Yjs document encoding/decoding
3. Look at collab logs: `docker-compose logs collab`
4. Test broadcast: modify doc in one browser, check in another

---

## References

- **ARCHITECTURE.md** — Deep dive on system design
- **COMPARTMENTALIZATION.md** — Layer boundaries & patterns
- **DOCKER_SETUP.md** — Container operations
- **DEPLOYMENT_CHECKLIST.md** — Pre-flight & launch
- **prd.md** — Product requirements
- **trd.md** — Technical requirements
- **design_refrence_doc.md** — UI/UX design system
