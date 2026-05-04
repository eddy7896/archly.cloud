# Platform Layer Implementation — archly.cloud

Complete setup of `apps/editor` (Next.js platform UI), API routes, and component structure.

---

## What's Implemented

### **Components (apps/editor/components/)**

1. **Dashboard.tsx** — Figma-style project browser
   - Left sidebar: Teams navigation
   - Main area: Project grid with cards
   - Create/delete projects
   - Team selection with projects list

2. **ProjectCard.tsx** — Individual project card
   - Thumbnail (static or 3D preview)
   - Project name, last edited date
   - Hover actions: Open, Delete
   - Published badge

3. **Editor.tsx** — Editor shell wrapper
   - Top bar: Project name, presence, share, export
   - Left tools panel: Tool selection (selection, transform, paint, draw)
   - Right inspector panel: Node properties
   - Main canvas: Renders Viewer component
   - Tools injected as children

4. **Marketplace.tsx** — Community gallery
   - Search & category filter
   - Featured projects carousel
   - Grid of published projects
   - Clone button (pointer-based duplication)
   - Creator profile links
   - Rating & download count

5. **Tools/** — Tool components
   - **SelectionTool.tsx** — Select and highlight nodes
   - **TransformTool.tsx** — Translate, rotate, scale

6. **Modals/** — Dialog components
   - **CreateProjectModal.tsx** — Create new project form

### **Pages (apps/editor/app/)**

1. **dashboard/page.tsx** — `/dashboard`
   - Protected route (requires auth)
   - Renders Dashboard component
   - Fetches user's organization

2. **editor/[id]/page.tsx** — `/editor/:id`
   - Protected route
   - Renders Editor shell
   - Checks user access level (owner/editor/viewer/commenter)

3. **marketplace/page.tsx** — `/marketplace`
   - Protected route
   - Renders Marketplace component
   - Shows published projects from all users

### **API Routes (apps/editor/app/api/)**

1. **projects/route.ts** — `GET | POST /api/projects`
   - List projects by team (GET)
   - Create new project (POST)

2. **projects/[id]/route.ts** — `GET | PATCH | DELETE /api/projects/[id]`
   - Get project details
   - Update project (name, description)
   - Delete project

3. **projects/clone/route.ts** — `POST /api/projects/clone`
   - Clone project (pointer-based)
   - Copies Yjs state, shares R2 URLs
   - Records in cloneHistory

4. **marketplace/search/route.ts** — `GET /api/marketplace/search`
   - Search published projects
   - Filter by query & category
   - Sort by downloads or rating

5. **marketplace/featured/route.ts** — `GET /api/marketplace/featured`
   - Featured projects for homepage

### **Libraries (apps/editor/lib/)**

1. **auth.ts** — BetterAuth configuration
   - Magic links, OAuth (Google, GitHub), Email/Password
   - Session management
   - User authentication

2. **api-client.ts** — API client functions
   - REST calls to backend
   - Error handling
   - Request/response formatting
   - Organized by resource (projects, teams, marketplace)

---

## Architecture

```
apps/editor/
├── lib/
│   ├── auth.ts                    BetterAuth setup
│   └── api-client.ts              REST API wrapper
├── components/
│   ├── Dashboard.tsx              Project browser (Figma-style)
│   ├── ProjectCard.tsx            Individual project card
│   ├── Editor.tsx                 Editor shell + top bar
│   ├── Marketplace.tsx            Gallery + clone feature
│   ├── tools/
│   │   ├── SelectionTool.tsx      Select tool
│   │   └── TransformTool.tsx      Transform tool
│   ├── editor/
│   │   └── EditorTopBar.tsx       Top toolbar
│   └── modals/
│       └── CreateProjectModal.tsx Create project modal
├── app/
│   ├── page.tsx                   Home (landing page)
│   ├── dashboard/
│   │   └── page.tsx               Project browser
│   ├── editor/
│   │   └── [id]/page.tsx          Editor shell
│   ├── marketplace/
│   │   └── page.tsx               Gallery
│   └── api/
│       ├── projects/
│       │   ├── route.ts           List/create projects
│       │   ├── [id]/route.ts      Get/update/delete project
│       │   └── clone/route.ts     Clone project (marketplace)
│       └── marketplace/
│           ├── search/route.ts    Search published
│           └── featured/route.ts  Featured gallery
└── next.config.ts
```

---

## User Flows

### **1. Create Project**

```
User clicks "Create Project"
→ Modal opens (name, description)
→ POST /api/projects
→ Backend creates row in projects table
→ Backend initializes empty Yjs document
→ Backend adds user as OWNER
→ Project added to dashboard grid
```

### **2. Open Editor**

```
User clicks project card
→ Navigates to /editor/[id]
→ Fetches project via GET /api/projects/[id]
→ Establishes WebSocket to collab server (Yjs)
→ Viewer renders 3D scene from Yjs state
→ Tools panel loads
→ Ready for editing
```

### **3. Edit in Real-Time**

```
User selects node with SelectionTool
→ Updates Yjs document (CRDT)
→ CRDT broadcasts to all connected clients
→ Viewer re-renders
→ Other users see change instantly
→ Changes persisted to PostgreSQL (collab server)
```

### **4. Publish to Marketplace**

```
User clicks "Publish" in editor
→ Modal: Title, description, category, tags
→ POST /api/projects/[id]/publish
→ Backend creates marketplace entry
→ isPublished = true
→ Project searchable in marketplace
→ Others can clone
```

### **5. Clone from Marketplace**

```
User views marketplace project
→ Clicks "Clone" button
→ POST /api/projects/clone { sourceId, targetTeamId }
→ Backend fetches source yjsDocumentBlob
→ Creates new project row with cloned blob
→ New project added to user's team
→ R2 URLs shared (not copied)
→ Instant clone (no file copy overhead)
```

---

## Component Props & Interfaces

### **Dashboard**
```typescript
interface DashboardProps {
  organizationId: string;
}
```

### **ProjectCard**
```typescript
interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    previewImageUrl?: string;
    updatedAt: string;
    isPublished: boolean;
  };
  onDelete?: () => void;
}
```

### **Editor**
```typescript
interface EditorProps {
  projectId: string;
  accessLevel: 'owner' | 'editor' | 'viewer' | 'commenter';
}
```

### **Marketplace**
```typescript
interface MarketplaceProps {
  userTeamId: string;
}
```

---

## API Client Usage

```typescript
import { projectsApi, marketplaceApi } from '@/lib/api-client';

// Projects
const projects = await projectsApi.list(teamId);
const project = await projectsApi.get(projectId);
await projectsApi.create({ teamId, name, description });
await projectsApi.update(id, { name });
await projectsApi.delete(id);
await projectsApi.clone(sourceId, teamId);
await projectsApi.publish(id, { title, description });

// Marketplace
const results = await marketplaceApi.search(query, category);
const featured = await marketplaceApi.getFeatured();
```

---

## Authentication Flow

1. **Login Page** — `/auth/login`
   - Email/password, magic link, OAuth
   - BetterAuth handles session

2. **Protected Routes**
   - Dashboard, Editor, Marketplace require session
   - `await auth.api.getSession()` in server component
   - Redirect to `/auth/login` if not authenticated

3. **API Routes**
   - Check session in route handler
   - Return 401 if unauthorized
   - Verify user has access to resource

---

## TODO: Database Integration

Each API route has TODO comments for database operations:

1. **GET /api/projects** → Query `projects` table by `teamId`
2. **POST /api/projects** → Insert into `projects`, add user as `OWNER`
3. **GET /api/projects/[id]** → Query `projects` by `id`, check `projectMembers`
4. **PATCH /api/projects/[id]** → Update `projects` row
5. **DELETE /api/projects/[id]** → Soft delete `projects` row
6. **POST /api/projects/clone** → Copy `yjsDocumentBlob`, insert new row
7. **GET /api/marketplace/search** → Query `marketplace` table, filter/sort
8. **GET /api/marketplace/featured** → Query top `marketplace` by downloads

---

## TODO: WebSocket Integration

Collab server integration (Yjs sync):

```typescript
// In Editor.tsx or client context
const yDocRef = useRef(new Y.Doc());
const wsProvider = useRef(
  new WebsocketProvider(
    process.env.NEXT_PUBLIC_WS_URL,
    `project_${projectId}`,
    yDocRef.current
  )
);

// Update scene when Yjs changes
yDocRef.current.on('update', (update, origin) => {
  if (origin !== 'local') {
    editor.updateScene(yDocRef.current.toJSON());
  }
});
```

---

## Styling

All components use:
- **Tailwind CSS** — Utility classes
- **Glassmorphism** — `bg-white/5`, `border-white/10`, `backdrop-blur-xl`
- **Dark mode** — `#0A0A0A` background, `#EDEDED` text
- **Responsive** — Grid adapts to screen size

### **Color Palette**
- Background: `#0A0A0A` → `#050505`
- Surface: `rgba(255, 255, 255, 0.03)` to `0.08`
- Border: `rgba(255, 255, 255, 0.1)`
- Text: `#EDEDED`
- Secondary: `#888888`

### **Component Classes**
- Panels: `bg-white/5 border border-white/10 backdrop-blur-xl`
- Buttons: `bg-white/10 hover:bg-white/20 text-white rounded`
- Inputs: `bg-white/5 border border-white/10 text-white`

---

## Error Handling

API client includes try/catch:
```typescript
try {
  const data = await projectsApi.list(teamId);
} catch (error) {
  console.error('Failed to fetch projects:', error);
  // Show user-friendly error message
}
```

Pages redirect on auth error:
```typescript
if (!session) {
  redirect('/auth/login');
}
```

Modal validates required fields:
```typescript
if (!name.trim()) {
  alert('Project name is required');
  return;
}
```

---

## Performance Optimizations

1. **API Caching** — Consider React Query or SWR for caching
2. **Lazy Loading** — Images loaded on-demand
3. **Code Splitting** — Route-based splitting (automatic with Next.js)
4. **Debounced Search** — 300ms delay on marketplace search
5. **Memoization** — ProjectCard wrapped with React.memo if needed

---

## Next Steps

1. **Integrate Prisma** — ORM for database queries
2. **Implement Yjs WebSocket** — Real-time sync
3. **Add BetterAuth routes** — Auth pages (/auth/login, /auth/signup, /auth/callback)
4. **Connect Presence Engine** — Show online users in editor
5. **Add Spatial Comments** — Comment on 3D nodes
6. **Implement Asset Upload** — Pre-signed R2 URLs
7. **Add Marketplace Publishing** — Publish button in editor
8. **Performance Profiling** — Test with many projects/users

---

## File Checklist

✅ lib/auth.ts — BetterAuth setup  
✅ lib/api-client.ts — API wrapper  
✅ components/Dashboard.tsx — Project browser  
✅ components/ProjectCard.tsx — Card component  
✅ components/Editor.tsx — Editor shell  
✅ components/Marketplace.tsx — Gallery  
✅ components/tools/SelectionTool.tsx — Selection tool  
✅ components/tools/TransformTool.tsx — Transform tool  
✅ components/modals/CreateProjectModal.tsx — Create modal  
✅ app/dashboard/page.tsx — Dashboard page  
✅ app/editor/[id]/page.tsx — Editor page  
✅ app/marketplace/page.tsx — Marketplace page  
✅ app/api/projects/route.ts — Projects list/create  
✅ app/api/projects/[id]/route.ts — Project CRUD  
✅ app/api/projects/clone/route.ts — Clone endpoint  
✅ app/api/marketplace/search/route.ts — Search endpoint  
✅ app/api/marketplace/featured/route.ts — Featured endpoint  

---

## Summary

Platform layer provides:
- Figma-style dashboard for project management
- Editor wrapper with tools panel & inspector
- Community marketplace with search & clone
- Authentication & access control
- Real-time collaboration foundation (Yjs-ready)
- API routes for all platform operations

All components follow the compartmentalized architecture (composition over coupling). Tools are separate, Viewer is standalone, core logic is pure.

Ready for database integration and real-time sync implementation.
