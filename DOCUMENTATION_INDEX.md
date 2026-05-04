# Documentation Index — archly.cloud Platform

Complete guide to all documentation files. Start here.

---

## 📋 Start Here

**New to the project?** Read in this order:

1. **[PLATFORM_SETUP.md](PLATFORM_SETUP.md)** (5 min read)
   - What you just built (5 layers)
   - Quick start (copy .env, docker-compose up)
   - Common tasks
   - Troubleshooting

2. **[ARCHITECTURE.md](ARCHITECTURE.md)** (15 min read)
   - System overview (diagram)
   - Layer definitions (what goes where)
   - Collaboration & presence engine
   - Database schema
   - Data flow examples

3. **[COMPARTMENTALIZATION.md](COMPARTMENTALIZATION.md)** (20 min read)
   - Strict layer boundaries
   - Dependency rules (downward only)
   - Circular dependency prevention
   - Real-world patterns (how to add features)
   - Testing layer boundaries

4. **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** (10 min read)
   - Directory layout with full paths
   - Quick command reference
   - Debugging guide
   - Performance & security checklists

5. **[DOCKER_SETUP.md](DOCKER_SETUP.md)** (15 min read)
   - Local development (docker-compose)
   - Production build & deploy
   - Database operations
   - Health checks
   - Troubleshooting

6. **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** (25 min read, when shipping)
   - Pre-deployment (1 week before)
   - Pre-launch (48 hours)
   - Deployment steps (day of)
   - Smoke tests
   - Rollback procedure
   - Incident response

---

## 📑 By Use Case

### **I want to understand the system**
1. Read: **PLATFORM_SETUP.md** (overview)
2. Read: **ARCHITECTURE.md** (deep dive)
3. Skim: **COMPARTMENTALIZATION.md** (boundaries)

### **I want to add a feature**
1. Read: **COMPARTMENTALIZATION.md** → "Adding a New Feature"
2. Reference: **PROJECT_STRUCTURE.md** → "When Adding Features"
3. Check: **COMPARTMENTALIZATION.md** → Layer definitions

### **I want to set up Docker locally**
1. Read: **PLATFORM_SETUP.md** → "Quick Start"
2. Reference: **DOCKER_SETUP.md** → full Docker guide
3. Troubleshoot: **DOCKER_SETUP.md** → "Troubleshooting"

### **I'm deploying to production**
1. Read: **DEPLOYMENT_CHECKLIST.md** (entire document)
2. Reference: **DOCKER_SETUP.md** → "Production Deployment"
3. Prep: **PLATFORM_SETUP.md** → "Environment Checklist"

### **I need to debug something**
1. Check: **PROJECT_STRUCTURE.md** → "Debugging Guide"
2. Check: **DOCKER_SETUP.md** → "Troubleshooting"
3. Reference: **ARCHITECTURE.md** → "Data Flow Examples"

### **I need to understand a layer**
1. Read: **COMPARTMENTALIZATION.md** → Layer definition
2. Check: **PROJECT_STRUCTURE.md** → Directory layout
3. Review: **ARCHITECTURE.md** → Layer definitions

---

## 📚 Reference Materials

### **Product & Design**
- **[prd.md](prd.md)** — Product requirements (features, personas, success metrics)
- **[trd.md](trd.md)** — Technical requirements (R2 uploads, CORS, cloning, black box contract)
- **[design_refrence_doc.md](design_refrence_doc.md)** — UI/UX design system (glassmorphism, colors, motion)

### **Project Configuration**
- **[.env.template](.env.template)** — Environment variables (database, auth, storage, logging)
- **[docker-compose.yml](docker-compose.yml)** — Production orchestration
- **[docker-compose.dev.yml](docker-compose.dev.yml)** — Development with hot reload
- **[Dockerfile](Dockerfile)** — Frontend production image
- **[Dockerfile.dev](Dockerfile.dev)** — Frontend dev image
- **[services/collab/package.json](services/collab/package.json)** — Yjs server dependencies
- **[services/database/init.sql](services/database/init.sql)** — Database schema

### **Architecture & Layer Docs**
- **[ARCHITECTURE.md](ARCHITECTURE.md)** — System design, data flow, database schema
- **[COMPARTMENTALIZATION.md](COMPARTMENTALIZATION.md)** — Layer boundaries, patterns, rules
- **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** — Directory layout, quick reference

### **Operations & Deployment**
- **[DOCKER_SETUP.md](DOCKER_SETUP.md)** — Local dev, production build, troubleshooting
- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** — Pre-flight checks, launch, rollback
- **[PLATFORM_SETUP.md](PLATFORM_SETUP.md)** — Quick start, common tasks

---

## 🎯 Core Concepts

### **The 5 Layers** (dependency flows downward)

```
5. apps/editor              ← Platform UI (dashboard, marketplace, tools)
4. packages/editor          ← Editor logic (useEditor hook, shortcuts)
3. packages/viewer          ← 3D canvas (Three.js, rendering)
2. packages/core            ← Domain logic (scene graph, pure logic)
1. packages/ui              ← Design system (Radix + Tailwind)
```

**Golden Rule:** Import only from layers below. Never up. See **COMPARTMENTALIZATION.md**.

### **Real-Time Collaboration**

- **Yjs (CRDT)** — Conflict-free replicated data type
- **WebSocket** — Low-latency bidirectional communication
- **PostgreSQL** — Persistent snapshots & recovery
- **Presence** — Ephemeral cursor/activity state

See **ARCHITECTURE.md** → "Real-Time Collaboration & Presence Engine"

### **Docker Services**

| Service | Port | Role |
|---------|------|------|
| **frontend** | 3002 | Next.js platform UI |
| **collab** | 1234 | Yjs WebSocket server |
| **postgres** | 5432 | PostgreSQL database |

See **DOCKER_SETUP.md** → "Service Architecture"

### **Environment (Unified)**

Single `.env.local` for all services. Sections:
- Database (PostgreSQL credentials)
- Frontend (URLs, Next.js config)
- Auth (BetterAuth secret, OAuth creds)
- Storage (Cloudflare R2)
- Collaboration (Yjs config)
- Logging

See **.env.template** for full template.

---

## 🚀 Quick Commands

```bash
# Local development
docker-compose -f docker-compose.dev.yml up

# Production build & deploy
docker build -t archly-frontend:1.0.0 -f Dockerfile .
docker build -t archly-collab:1.0.0 -f services/collab/Dockerfile .
docker-compose -f docker-compose.yml up -d

# Database operations
docker-compose exec frontend npx prisma migrate dev
docker-compose exec postgres psql -U archly -d archly

# Debugging
docker-compose logs -f frontend
docker-compose logs -f collab
docker-compose ps
```

See **PROJECT_STRUCTURE.md** → "Quick Command Reference"

---

## ⚡ Key Files at a Glance

| File | Size | What It Is | When to Read |
|------|------|-----------|--------------|
| **PLATFORM_SETUP.md** | Short | Getting started | First (5 min) |
| **ARCHITECTURE.md** | Medium | System design & layers | Second (15 min) |
| **COMPARTMENTALIZATION.md** | Long | Layer rules & patterns | Before coding |
| **DOCKER_SETUP.md** | Long | Docker operations | When using Docker |
| **DEPLOYMENT_CHECKLIST.md** | Long | Pre-flight & launch | Before shipping |
| **PROJECT_STRUCTURE.md** | Long | Directory layout & reference | For navigation |
| **.env.template** | Medium | Environment variables | Before first run |
| **prd.md** | Short | Product vision & features | To understand goals |
| **trd.md** | Short | Technical requirements | For edge cases |

---

## 📊 Architecture at a Glance

```
┌─────────────────────────────────────────┐
│        Browser (Client Layer)           │
├─────────────────────────────────────────┤
│                                         │
│  apps/editor (Next.js, port 3002)      │ ← Dashboard, marketplace, tools
│       ↓↑                                │
│  packages/editor (Editor logic)         │ ← useEditor hook, shortcuts
│       ↓↑                                │
│  packages/viewer (Three.js canvas)      │ ← 3D rendering
│       ↓↑                                │
│  packages/core (Domain logic)           │ ← Scene graph, pure functions
│       ↓↑                                │
│  packages/ui (Design system)            │ ← Radix + Tailwind components
│                                         │
└─────────────────────────────────────────┘
         ↓↑ WebSocket    ↓↑ REST API    ↓↑ Assets
         │               │              │
┌────────┴───────────────┴──────────────┴──────────┐
│        Deployment Layer (Docker)                 │
├──────────────────────────────────────────────────┤
│                                                  │
│  collab server (Yjs, port 1234)  ←→  postgres  │
│       ↑                                   ↑      │
│       └──────────────────────────────────┘      │
│                                                  │
│  Environment: .env.local (unified)              │
└──────────────────────────────────────────────────┘
         ↓
    Cloudflare R2 (Assets CDN)
```

See **ARCHITECTURE.md** for full diagram and data flows.

---

## ✅ Checklists

### **Before First Run**
- [ ] Copy `.env.template` → `.env.local`
- [ ] Edit `.env.local` with values (database password, auth secret)
- [ ] `docker-compose -f docker-compose.dev.yml up`
- [ ] Open http://localhost:3002

### **Before First Code Change**
- [ ] Read **COMPARTMENTALIZATION.md** (layer rules)
- [ ] Read **PROJECT_STRUCTURE.md** (directory layout)
- [ ] Understand which layer your change goes in

### **Before Production Deploy**
- [ ] Read **DEPLOYMENT_CHECKLIST.md** (entire document)
- [ ] Run pre-deployment checklist (1 week before)
- [ ] Run pre-launch checklist (48 hours before)
- [ ] Execute deployment steps (day of)

---

## 🔗 Cross-References

### **Want to understand how a feature flows?**
→ **ARCHITECTURE.md** → "Data Flow Examples"

### **Want to add a new tool?**
→ **COMPARTMENTALIZATION.md** → "Adding a New Feature" → Example: Measure Tool

### **Want to add domain logic?**
→ **COMPARTMENTALIZATION.md** → "Layer 1: packages/core"

### **Docker issues?**
→ **DOCKER_SETUP.md** → "Troubleshooting"

### **WebSocket not working?**
→ **PROJECT_STRUCTURE.md** → "Debugging Guide" → "WebSocket not connecting?"

### **Database slow?**
→ **PROJECT_STRUCTURE.md** → "Debugging Guide" → "Database query slow?"

---

## 📝 File Organization

```
Documentation (What to Read)
├─ PLATFORM_SETUP.md              ← Quick start (READ FIRST)
├─ ARCHITECTURE.md                ← System design (READ SECOND)
├─ COMPARTMENTALIZATION.md        ← Layer rules (READ BEFORE CODING)
├─ DOCKER_SETUP.md                ← Docker guide
├─ DEPLOYMENT_CHECKLIST.md        ← Production checklist
├─ PROJECT_STRUCTURE.md           ← Directory reference
├─ DOCUMENTATION_INDEX.md         ← This file
├─ prd.md                          ← Product requirements
├─ trd.md                          ← Technical requirements
└─ design_refrence_doc.md         ← UI/UX design system

Configuration (What to Edit)
├─ .env.template                   ← Copy to .env.local
├─ docker-compose.yml              ← Production
├─ docker-compose.dev.yml          ← Development
├─ Dockerfile                      ← Frontend prod image
├─ Dockerfile.dev                  ← Frontend dev image
├─ services/collab/Dockerfile      ← Collab server prod
├─ services/collab/Dockerfile.dev  ← Collab server dev
└─ services/database/init.sql     ← Database schema

Code (What to Modify)
├─ apps/editor/                    ← Platform UI, tools
├─ packages/core/                  ← Domain logic
├─ packages/editor/                ← Editor hooks
├─ packages/viewer/                ← 3D canvas
├─ packages/ui/                    ← Design system
└─ services/collab/src/            ← Yjs server
```

---

## 🎓 Learning Path

**Total time: ~2 hours**

| Duration | Task | File |
|----------|------|------|
| 5 min | Understand what you built | PLATFORM_SETUP.md |
| 15 min | Learn system design | ARCHITECTURE.md |
| 20 min | Understand layer boundaries | COMPARTMENTALIZATION.md |
| 10 min | Navigate the codebase | PROJECT_STRUCTURE.md |
| 15 min | Set up Docker locally | DOCKER_SETUP.md + run it |
| 10 min | Make a small change | Add a button to dashboard |
| 15 min | Understand deployment | DEPLOYMENT_CHECKLIST.md (skim) |
| 5 min | Bookmark for reference | This file + keep open |

---

## 💡 Pro Tips

1. **Keep COMPARTMENTALIZATION.md bookmarked** — Reference it every time you code
2. **Use PROJECT_STRUCTURE.md as a map** — Find files quickly
3. **Docker volumes are your friend** — Changes auto-reload in dev
4. **WebSocket debugging** → Open DevTools, Network tab, filter by "WS"
5. **Database debugging** → `docker-compose exec postgres psql -U archly -d archly`
6. **Feature not showing?** → Check layer boundaries didn't break (circular import)
7. **Performance issues?** → Check ARCHITECTURE.md → "Data Flow Examples"

---

## 📞 When You're Stuck

| Problem | Read |
|---------|------|
| "What layer does X go in?" | COMPARTMENTALIZATION.md |
| "Where is the file X?" | PROJECT_STRUCTURE.md (directory layout) |
| "How do I add feature Y?" | COMPARTMENTALIZATION.md → "Adding a New Feature" |
| "Docker won't start" | DOCKER_SETUP.md → "Troubleshooting" |
| "WebSocket not connecting" | PROJECT_STRUCTURE.md → "Debugging" |
| "Ready to ship" | DEPLOYMENT_CHECKLIST.md (entire thing) |

---

## ✨ You Now Have

✅ **5-layer architecture** with strict boundaries  
✅ **Real-time collaboration** (Yjs + WebSocket)  
✅ **Docker orchestration** (dev + prod)  
✅ **PostgreSQL persistence** with backups  
✅ **Unified environment** (.env.local)  
✅ **Comprehensive documentation** (this index)  
✅ **Deployment checklist** (pre-flight to rollback)  
✅ **Troubleshooting guide** (common issues)  

**Everything is ready to build. Start with PLATFORM_SETUP.md.** 🚀
