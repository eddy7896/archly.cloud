# Archly.cloud Platform Architecture

## System Overview

Three-tier decoupled architecture for a collaborative 3D architectural design SaaS platform.

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer (Browser)                    │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │   apps/editor (Next.js - 3002)                       │   │
│  │  - Dashboard (Figma-style workspace)                 │   │
│  │  - Marketplace                                        │   │
│  │  - Editor wrapper/shell                              │   │
│  │  - Auth UI                                            │   │
│  │  - Real-time collaboration indicators                │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓↑                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   packages/viewer (WebGL/Three.js canvas)            │   │
│  │  - 3D rendering (Viewer systems)                     │   │
│  │  - Asset loading from Cloudflare R2                  │   │
│  │  - Camera/view state                                 │   │
│  │  - Read-only/Editor state rendering                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓↑                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   packages/editor (Editor logic/tools)               │   │
│  │  - Tools (paint, select, transform, etc.)            │   │
│  │  - Keyboard shortcuts                                │   │
│  │  - Editor state management (useEditor hook)          │   │
│  │  - Command palette                                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓↑                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   packages/core (Domain logic)                       │   │
│  │  - Scene graph (no Three.js, no view concepts)       │   │
│  │  - Pure data structures & logic                      │   │
│  │  - Node schemas, selection, spatial queries          │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓↑                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   packages/ui (Radix + Tailwind components)          │   │
│  │  - Shared UI components (buttons, panels, modals)    │   │
│  │  - Design system tokens (colors, typography)         │   │
│  │  - Glassmorphism component library                   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ↓                    ↓                    ↓
    WebSocket          REST API              Asset CDN
    (Yjs sync)      (Platform ops)      (Cloudflare R2)
         │                    │                    │
┌────────┴────────────────────┴────────────────────┴──────────┐
│                    Deployment Layer                          │
├───────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────┐  │
│  │ Next.js Frontend │  │ Yjs Sync Server  │  │ PostgreSQL │  │
│  │  (port 3002)     │  │  (port 1234)     │  │  (5432)    │  │
│  └──────────────────┘  └──────────────────┘  └────────────┘  │
│          ↓                    ↓                    ↓            │
│  ┌───────────────────────────────────────────────────────┐   │
│  │         Docker Compose (docker-compose.yml)           │   │
│  │  - frontend service                                    │   │
│  │  - collab service (Yjs WebSocket server)              │   │
│  │  - postgres service                                    │   │
│  │  - nginx reverse proxy (optional)                      │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                                │
│         Environment: .env.local (unified config)              │
└────────────────────────────────────────────────────────────────┘
```

---

## Layer Definitions & Responsibilities

### 1. **apps/editor** (Next.js Platform Layer)
**Port:** 3002
**Role:** Platform UI, workspace management, authentication, marketplace.

**Responsibilities:**
- Dashboard (Figma-style project browser)
- Marketplace (gallery, creator profiles, clone feature)
- Authentication (magic links, OAuth, email/password)
- Workspace/Organization/Team/Project navigation
- Real-time presence indicators (who's online)
- User/team management UI
- Project creation, deletion, sharing, publishing
- Invite/access control flows

**API Consumption:**
- REST endpoints for project CRUD, user auth, team management
- WebSocket for presence/activity streams (via Yjs)
- Asset upload pre-signed URL generation
- Search queries (marketplace, projects)

**Constraints:**
- Must **NOT** know about editor tools, phases, or paint mode
- Must **NOT** render 3D scenes directly (use `<Viewer>` component)
- Treat Pascal Editor as a black box wrapped in a shell component

---

### 2. **packages/viewer** (WebGL/Three.js Rendering)
**Role:** Standalone 3D canvas and rendering systems.

**Responsibilities:**
- 3D scene rendering (Three.js)
- Asset loading from Cloudflare R2
- Camera and view controls
- Renderer systems (lighting, materials, post-processing)
- Viewer-specific state (camera transform, render target)
- Present scene graph to Three.js
- Handle CORS/Tainted Canvas issues
- Lazy-load .glb, .png, etc. from CDN

**Constraints:**
- Must **NOT** import `apps/editor` or editor-specific modules
- Must **NOT** know about tools, keyboard shortcuts, or editor modes
- Must **NOT** manage document state (that's `packages/core`)
- Editor features injected via props/children (composition)

---

### 3. **packages/editor** (Editor Tools & Logic)
**Role:** Editing experience, tools, shortcuts, command palette.

**Responsibilities:**
- Editor tools (selection, transform, paint, draw, etc.)
- Keyboard shortcuts & command palette
- `useEditor` hook (editor state/context)
- Tool panels & inspector UI
- Undo/redo integration
- Cursor badges & feedback
- Floorplan helpers, paint preview
- Action menus, context menus
- Mode management (paint mode, selection mode, etc.)

**Constraints:**
- Must **NOT** import `packages/viewer` directly
- Must **NOT** know about database, REST API, or authentication
- Tools live **only** in `apps/editor/components/tools/`
- Uses composition to pass tool UI into `<Viewer>`

---

### 4. **packages/core** (Domain Logic)
**Role:** Pure data structures and business logic. No rendering, no view concepts.

**Responsibilities:**
- Scene graph (node schemas, hierarchies)
- Pure node logic (geometry, materials, transforms)
- Selection management (no UI)
- Spatial queries (raycasting, bounds checks)
- Event system (pure domain events, no React)
- Node creation/deletion/modification logic
- Cloning/duplication logic
- Property schemas and validation
- No Three.js imports
- No React imports
- No view-specific enums (e.g., no "floorplan" or "paint preview" state here)

**Constraints:**
- **CORE IS IMMUTABLE:** No imports of `packages/viewer`, `packages/editor`, `apps/editor`
- No framework coupling
- No rendering code
- Pure TypeScript/functions

---

### 5. **packages/ui** (Design System)
**Role:** Shared UI components and design tokens.

**Responsibilities:**
- Radix UI wrapper components
- Tailwind CSS tokens and utilities
- Glassmorphism component library
- Typography system (Geist, Inter)
- Color palette tokens
- Animated components (Framer Motion)
- Modal, panel, button, badge primitives
- Loading states, skeletons
- Accessibility helpers

**Consumption:**
- Used by `apps/editor` and `packages/editor` for UI
- No business logic
- Pure presentational

---

## Real-Time Collaboration & Presence Engine

### **Yjs (CRDT) Sync Server** (New service)
**Port:** 1234 (WebSocket)
**Language:** Node.js
**Purpose:** Synchronize document state across all connected clients.

**Responsibilities:**
- Maintain Yjs document instances per project
- Broadcast CRDT updates to connected clients
- Handle client join/leave events
- Persist document snapshots to PostgreSQL (yjsDocumentBlob)
- Emit presence events (cursor position, selection, activity)

**Integration:**
- Clients connect via WebSocket to subscribe to a project room
- Binary Yjs protocol for sync
- Optional presence extension for cursor tracking
- Recoverable state (snapshot + transaction log)

---

### **Presence Engine** (Embedded in Yjs server + viewer)
**Responsibilities:**
- Track active users per project
- Broadcast cursor positions, selection changes
- User avatars & color coding
- Activity indicators (who's editing, who's idle)
- Ephemeral state (does not persist to DB)
- Optimistic rendering in viewer

---

## Deployment Architecture

### **Docker Services (docker-compose.yml)**

1. **Frontend** (`frontend` service)
   - Image: Custom Next.js Docker image
   - Port: 3002 (published to 80 via nginx if needed)
   - Environment: .env.local (shared)
   - Volumes: None (built into image)

2. **Collaboration Server** (`collab` service)
   - Image: Custom Node.js + Yjs Docker image
   - Port: 1234 (internal WebSocket)
   - Environment: .env.local (shared)
   - Database: PostgreSQL connection string from .env.local

3. **PostgreSQL** (`postgres` service)
   - Image: postgres:17-alpine
   - Port: 5432 (internal only)
   - Volume: postgres data persistence
   - Environment: POSTGRES_PASSWORD from .env.local

4. **Reverse Proxy** (`nginx` service) [Optional]
   - Routes /api/* to frontend
   - Routes /ws to collab server
   - Serves static assets

### **Unified Environment File (.env.local)**
Single source of truth for all services.

```env
# Database
POSTGRES_USER=archly
POSTGRES_PASSWORD=<secure-password>
POSTGRES_DB=archly
DATABASE_URL=postgresql://archly:password@postgres:5432/archly

# Frontend (Next.js)
NEXT_PUBLIC_API_URL=http://localhost:3002
NEXT_PUBLIC_WS_URL=ws://localhost:1234
NEXT_PUBLIC_R2_URL=https://cdn.archly.cloud

# Authentication
BETTER_AUTH_SECRET=<secret>
BETTER_AUTH_URL=http://localhost:3002

# OAuth (Google, GitHub)
GOOGLE_CLIENT_ID=<id>
GOOGLE_CLIENT_SECRET=<secret>

# Email (Resend)
RESEND_API_KEY=<key>

# Cloudflare R2
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_BUCKET=archly-assets
R2_ACCESS_KEY=<key>
R2_SECRET_KEY=<secret>
R2_PUBLIC_URL=https://cdn.archly.cloud

# Collaboration Server
YJS_PERSISTENCE_ENABLED=true
YJS_SNAPSHOT_INTERVAL=3600000

# Logging
LOG_LEVEL=info
```

---

## Data Flow Examples

### **User opens a project**
1. Browser → apps/editor (dashboard)
2. User clicks project card
3. Next.js fetches project metadata (API route)
4. Wraps Pascal Editor in shell component
5. Passes `documentId` + `accessLevel` to `<ArchlyEditor>`
6. Editor establishes WebSocket to collab server
7. Collab server streams Yjs document to client
8. Client renders 3D scene via `<Viewer>` + viewer systems
9. Real-time presence updates flow through presence engine

### **User clones marketplace scene**
1. Browser → marketplace (apps/editor)
2. "Clone" button → API call to `POST /api/projects/clone`
3. Backend fetches source project's `yjsDocumentBlob`
4. Inserts new Project row with cloned blob
5. Returns new project URL to client
6. Client navigates to new project
7. Yjs replicates state (no R2 assets copied—pointers retained)
8. Scene renders with original textures/models

### **Real-time collaboration edit**
1. User A selects node in editor
2. Editor tool fires `useScene` mutation
3. Mutation updates Yjs document
4. Yjs broadcasts CRDT delta to collab server
5. Collab server broadcasts to all connected clients (User B, C)
6. Presence engine emits "User A selected node X"
7. User B's viewer highlights selection box with User A's cursor color
8. Viewer renders in real-time (no page reload)

---

## Database Schema (Simplified)

```sql
-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name TEXT,
  billingPlan ENUM,
  createdAt TIMESTAMP
);

-- Teams (org container)
CREATE TABLE teams (
  id UUID PRIMARY KEY,
  organizationId UUID REFERENCES organizations,
  name TEXT
);

-- Projects (documents)
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  teamId UUID REFERENCES teams,
  name TEXT,
  yjsDocumentBlob BYTEA, -- Yjs state snapshot
  previewImageUrl TEXT,
  isPublished BOOLEAN,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);

-- Project Members (access control)
CREATE TABLE projectMembers (
  userId UUID,
  projectId UUID REFERENCES projects,
  role ENUM ('OWNER', 'EDITOR', 'VIEWER', 'COMMENTER'),
  PRIMARY KEY (userId, projectId)
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  role ENUM,
  avatarUrl TEXT
);

-- Activity Log (optional, for audit trail)
CREATE TABLE activity (
  id UUID PRIMARY KEY,
  projectId UUID REFERENCES projects,
  userId UUID,
  action TEXT,
  timestamp TIMESTAMP
);
```

---

## Development Workflow

### **Local Development (No Docker)**
```bash
npm run dev  # Turbo runs all workspaces
# apps/editor:3002
# Need manual Yjs server for WebSocket (or stub)
```

### **Docker Development**
```bash
docker-compose -f docker-compose.dev.yml up
# All services in one network
# Shared .env.local
# Hot reload via volume mounts
```

### **Production Build**
```bash
npm run build  # All packages + apps
docker build -t archly-frontend .
docker build -t archly-collab ./services/collab
docker-compose -f docker-compose.prod.yml up -d
```

---

## Key Architectural Rules

1. **Layer Isolation:** Core → Viewer → Editor → Apps (dependency direction only)
2. **No Circular Imports:** Enforce via ESLint + turbo boundaries
3. **Composition over Coupling:** Tools/features injected into Viewer, not embedded
4. **Stateless Sync:** All state flows through Yjs (single source of truth)
5. **Presence is Ephemeral:** Cursor/activity not persisted to DB
6. **Assets are Pointers:** Scene graph references R2 URLs, not file copies
7. **Editor is a Black Box:** Platform features don't modify editor internals
8. **Environment is Global:** One .env.local for all services (Docker)

---

## Next Steps

1. Create `services/collab` (Node.js + Yjs WebSocket server)
2. Create `services/database` (Prisma schema + migrations)
3. Create Dockerfiles for each service
4. Create `docker-compose.yml` (dev) and `docker-compose.prod.yml` (prod)
5. Create unified `.env.local` template
6. Implement REST API routes in `apps/editor` (project CRUD, auth, search)
7. Implement presence engine in viewer + collab server
8. Add marketplace features (publish, clone, search)
9. Set up CORS + R2 bucket policies
