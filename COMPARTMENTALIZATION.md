# Compartmentalization Guide — archly.cloud

Decoupled layer architecture with strict boundaries for maintainability and scalability.

---

## The Four Layers (Dependency Graph)

```
apps/editor
    ↓↑
packages/editor
    ↓↑
packages/viewer
    ↓↑
packages/core ← (no upward dependencies)
    ↓↑
packages/ui

packages/database (shared)
```

**Golden Rule:** Dependency flows downward only. Upward imports = architecture violation.

---

## Layer 1: packages/core (Domain Logic)

**Purpose:** Pure data structures and business logic. Zero view coupling.

**Imports:**
- TypeScript stdlib only
- `zod`, `lodash`, `date-fns` (utility libraries)
- Other core packages

**Exports:**
- Node schemas (geometry, materials)
- Scene graph operations
- Selection logic
- Spatial queries (raycasting, AABB)
- Cloning/duplication engine
- Property schemas
- Event types (pure domain events)

**What Lives Here:**
```
packages/core/src/
  ├── schemas/          # Zod schemas for nodes, materials, geometry
  ├── scene/            # Scene graph, hierarchy operations
  ├── selection/        # Selection state, queries (no UI)
  ├── spatial/          # Raycasting, bounds, collision
  ├── events/           # Domain event types
  ├── utils/            # Pure functions
  └── types/            # TypeScript types
```

**Example: Node Schema**
```typescript
// packages/core/src/schemas/node.ts
import { z } from 'zod';

export const NodeSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['mesh', 'light', 'camera', 'group']),
  name: z.string(),
  transform: TransformSchema,
  material: MaterialSchema,
  // NO "floorplan" or "paintPreview" enum — those are view concerns
});

export type Node = z.infer<typeof NodeSchema>;

// Pure function — no React, no Three.js
export function cloneNode(node: Node): Node {
  return JSON.parse(JSON.stringify(node));
}
```

**❌ Never:**
- Import Three.js
- Import React, Hooks
- Import `packages/viewer`
- Import `packages/editor`
- Import `apps/editor`
- Reference "floorplan", "paint mode", "selection highlight" (view concerns)
- Use async/await for I/O (that's a viewer/editor concern)

**✅ Always:**
- Keep logic pure and testable
- Export types, enums, schemas
- Use composition over inheritance
- Document invariants

---

## Layer 2: packages/ui (Design System)

**Purpose:** Reusable UI components and design tokens.

**Imports:**
- `react`, `react-dom`
- `radix-ui/*`
- `tailwindcss`
- `framer-motion`
- `clsx`, `tailwind-merge`

**Exports:**
- Button, Panel, Modal, Badge, Card
- Glassmorphism wrapper component
- Tailwind config (colors, spacing)
- Typography styles
- Icon library
- Loading/skeleton states

**What Lives Here:**
```
packages/ui/src/
  ├── components/
  │   ├── Button.tsx
  │   ├── Panel.tsx
  │   ├── Modal.tsx
  │   ├── Glassmorphism.tsx
  │   └── ...
  ├── styles/
  │   ├── tailwind.config.js
  │   └── globals.css
  ├── tokens/
  │   ├── colors.ts
  │   ├── typography.ts
  │   └── spacing.ts
  └── hooks/
      └── useMediaQuery.ts (no editor or viewer concerns)
```

**Constraints:**
- Zero business logic
- No `useEditor`, `useViewer`, `useScene` hooks
- No dependencies on `packages/core`, `packages/viewer`, `packages/editor`
- Re-exports Radix components with light wrapping

---

## Layer 3: packages/viewer (3D Canvas)

**Purpose:** Standalone WebGL canvas and rendering systems.

**Imports:**
- Three.js
- React Three Fiber
- `packages/core` (read scene graph, no mutations)
- `packages/ui` (buttons, modals)

**Exports:**
- `<Viewer>` component (canvas + rendering)
- Renderer systems (lighting, materials, shadows)
- Camera controller
- Viewer state hook (`useViewer`)
- Asset loader (from R2)

**What Lives Here:**
```
packages/viewer/src/
  ├── canvas/
  │   ├── Viewer.tsx       # Main canvas component
  │   └── Camera.tsx       # Camera setup
  ├── systems/             # Viewer-specific renderers
  │   ├── LightSystem.ts
  │   ├── ShadowSystem.ts
  │   └── MaterialSystem.ts
  ├── loaders/             # Asset loading from R2
  │   ├── glb-loader.ts
  │   └── texture-loader.ts
  ├── hooks/
  │   └── useViewer.ts     # Viewer state (no editor concepts)
  └── types/
      └── viewer.types.ts
```

**Composition Pattern:** Features injected via props/children

```typescript
// packages/viewer/src/canvas/Viewer.tsx
import { Viewer as ViewerComponent } from '@pascal-app/viewer';

export function Viewer({ children, ...props }) {
  return (
    <ViewerComponent {...props}>
      {/* Editor tools/overlays injected here */}
      {children}
    </ViewerComponent>
  );
}
```

**❌ Never:**
- Import `packages/editor`
- Import `apps/editor`
- Reference tools, modes, shortcuts, selection UI
- Call `useEditor`
- Know about floorplan, paint mode, or editor-specific state

**✅ Always:**
- Accept features as children or props (composition)
- Keep rendering/performance optimizations here
- Handle Three.js setup, camera, asset loading
- Manage viewer-specific state (view transform, viewport)

---

## Layer 4: packages/editor (Editor Tools & Experience)

**Purpose:** Editing experience, tools, keyboard shortcuts, command palette.

**Imports:**
- React, hooks
- `packages/core` (mutations, queries)
- `packages/ui` (components)
- `packages/viewer` (as a component via import, not deep coupling)

**Exports:**
- `useEditor` hook
- Editor context/store
- Tool components (selection tool, transform tool, paint tool)
- Keyboard shortcuts handler
- Command palette
- Inspector UI
- Undo/redo system

**What Lives Here:**
```
packages/editor/src/
  ├── hooks/
  │   └── useEditor.ts     # Editor state hook
  ├── context/
  │   └── EditorContext.tsx  # Editor state management
  ├── tools/              # ⚠️ DO NOT ADD TOOLS HERE
  │   └── registry.ts     # Tool registry (reference only)
  ├── shortcuts/
  │   └── keyboard.ts
  ├── commands/
  │   └── palette.ts
  ├── inspector/
  │   └── Inspector.tsx
  └── undo-redo/
      └── history.ts
```

**Important:** Tools live **only** in `apps/editor/components/tools/`, NOT in `packages/editor`.

```
apps/editor/components/
  ├── tools/              # ← Tools ONLY here
  │   ├── SelectionTool.tsx
  │   ├── TransformTool.tsx
  │   ├── PaintTool.tsx
  │   └── DrawTool.tsx
  ├── Editor.tsx          # Wraps Viewer with tools
  └── ...
```

**❌ Never:**
- Add tools to packages/editor
- Import `apps/editor` (circular dependency)
- Keep view-specific state here (colors, theme — use packages/ui)

**✅ Always:**
- Use composition: tools as children of Viewer
- Inject tools into Viewer via `useEditor`
- Keep tool selection/mode state in `useEditor`
- Delegate rendering to tool components in apps/editor

---

## Layer 5: apps/editor (Platform Layer)

**Purpose:** Next.js app, dashboard, marketplace, editor wrapper, authentication.

**Imports:**
- Everything (packages/ui, packages/editor, packages/viewer, packages/core)
- Next.js, React
- Database (Prisma)
- External APIs (Cloudflare R2, Resend email, OAuth)

**Exports:**
- Next.js pages/routes
- API routes (REST)
- Dashboard components
- Marketplace components
- Editor shell component

**What Lives Here:**
```
apps/editor/
  ├── app/                # Next.js App Router
  │   ├── page.tsx        # Landing page
  │   ├── dashboard/      # Project browser (Figma style)
  │   ├── editor/         # Editor wrapper
  │   ├── marketplace/    # Marketplace gallery
  │   └── api/
  │       ├── projects/   # CRUD endpoints
  │       ├── auth/       # Auth routes
  │       ├── assets/     # Upload, download
  │       └── marketplace/ # Clone, publish
  ├── components/
  │   ├── Editor.tsx      # Main editor wrapper
  │   ├── tools/          # All tools (SelectionTool, etc.)
  │   ├── Dashboard.tsx
  │   ├── Marketplace.tsx
  │   └── shells/         # Layout shells
  ├── lib/
  │   ├── api-client.ts   # Backend API calls
  │   ├── r2-upload.ts    # Cloudflare R2 logic
  │   └── auth.ts         # BetterAuth setup
  └── styles/
      └── globals.css
```

**Responsibilities:**
- Dashboard (Figma-style UI, project cards, sidebar)
- Marketplace (gallery, search, clone button, creator profiles)
- Authentication (login, signup, invite flows)
- Project CRUD (create, delete, rename, share, publish)
- Editor wrapper (shell component around Viewer)
- All tools (selection, transform, paint, etc.)
- Real-time presence indicators (cursor badges, activity)
- Asset upload (pre-signed URLs from backend)

**Example: Editor Wrapper**
```typescript
// apps/editor/components/Editor.tsx
import { Viewer } from '@pascal-app/viewer';
import { useEditor } from '@pascal-app/editor';
import { SelectionTool } from './tools/SelectionTool';
import { TransformTool } from './tools/TransformTool';

export function Editor({ projectId, accessLevel }) {
  const editor = useEditor(projectId);

  return (
    <div>
      {/* Top bar with project name, presence, share, export */}
      <EditorTopBar project={editor.project} />

      {/* Main canvas + tools */}
      <Viewer
        scene={editor.scene}
        onPointerDown={editor.handlePointerDown}
        {...props}
      >
        {/* Tools injected as children */}
        {editor.activeTool === 'selection' && <SelectionTool />}
        {editor.activeTool === 'transform' && <TransformTool />}
        {editor.activeTool === 'paint' && <PaintTool />}
      </Viewer>

      {/* Inspector/properties panel */}
      <Inspector />

      {/* Command palette */}
      <CommandPalette />
    </div>
  );
}
```

**✅ Always:**
- This is the "surface" layer — any UI can go here
- Import and compose all lower layers
- Implement features via tool components + hooks
- Keep business logic in lower layers, UI here

---

## Cross-Layer Patterns

### **Reading Scene State**

```typescript
// ✅ OK: apps/editor imports from packages/core
import { useScene } from '@pascal-app/core';

function MyTool() {
  const scene = useScene();
  const selectedNode = scene.getSelectedNode();
  return <div>{selectedNode.name}</div>;
}
```

### **Mutating Scene State**

```typescript
// ✅ OK: Tool mutation via useScene
import { useScene } from '@pascal-app/core';

function TransformTool() {
  const scene = useScene();

  const handleDrag = (delta) => {
    scene.mutate(selectedId, { position: delta });
  };

  return <div onPointerMove={handleDrag} />;
}
```

### **Viewer Rendering**

```typescript
// ✅ OK: Viewer consumes scene state and renders
import { Viewer } from '@pascal-app/viewer';
import { useScene } from '@pascal-app/core';

function Canvas() {
  const scene = useScene();
  return <Viewer scene={scene} />;
}
```

### **Tool Composition (Injection)**

```typescript
// ✅ OK: Tools defined in apps/editor, injected into Viewer
import { Viewer } from '@pascal-app/viewer';

function Editor() {
  return (
    <Viewer>
      {/* Tools are children, not imported into Viewer */}
      <SelectionTool />
      <TransformTool />
    </Viewer>
  );
}
```

### **❌ Violation: Viewer imports tool**

```typescript
// ❌ WRONG: Viewer should not know about tools
import { SelectionTool } from '@packages/editor';

export function Viewer() {
  return <SelectionTool />; // ← Breaks encapsulation
}
```

---

## Real-Time Collaboration Integration

### **Yjs CRDT Updates Flow**

```
Yjs Document (server)
      ↓
  Client WebSocket
      ↓
  packages/core (useScene hook)
      ↓
  packages/viewer (re-renders Three.js)
      ↓
  apps/editor (tools + UI reflect changes)
```

### **Presence (Cursors, Activity)**

```
packages/editor (useEditor hook)
      ↓
  Presence overlay component (apps/editor)
      ↓
  Canvas annotation (packages/viewer as child)
```

**Keep separate:**
- Document state (Yjs, packages/core)
- Presentation (rendering, packages/viewer)
- Presence (cursors, badges, apps/editor)

---

## Circular Dependency Prevention

**Automated checks (ESLint + Turbo):**

```json
// turbo.json
{
  "rules": [
    { "forbid": "packages/core -> packages/viewer" },
    { "forbid": "packages/core -> packages/editor" },
    { "forbid": "packages/core -> apps/editor" },
    { "forbid": "packages/viewer -> packages/editor" },
    { "forbid": "packages/viewer -> apps/editor" }
  ]
}
```

**Manual review checklist:**
- [ ] `packages/core` has no Three.js imports
- [ ] `packages/core` has no React imports
- [ ] `packages/viewer` doesn't import `packages/editor`
- [ ] `packages/editor` tools don't live in `packages/editor/tools/`
- [ ] All tools are in `apps/editor/components/tools/`

---

## Testing Layer Boundaries

```typescript
// packages/core/__tests__/no-three-imports.test.ts
import { test } from 'vitest';

test('core has no three.js imports', () => {
  const source = readFileSync('./src/index.ts', 'utf-8');
  expect(source).not.toMatch(/from 'three'/);
  expect(source).not.toMatch(/from '@react-three/);
});
```

---

## Adding a New Feature

### **Scenario: Add a "Measure Tool"**

1. **Define domain logic** (packages/core)
   ```typescript
   // packages/core/src/tools/measure.ts
   export function calculateDistance(p1: Point, p2: Point): number {
     return Math.hypot(p2.x - p1.x, p2.y - p1.y);
   }
   ```

2. **Create tool component** (apps/editor/components/tools)
   ```typescript
   // apps/editor/components/tools/MeasureTool.tsx
   import { useEditor } from '@pascal-app/editor';
   import { calculateDistance } from '@pascal-app/core';

   export function MeasureTool() {
     // Tool UI, keyboard shortcuts, measurement display
   }
   ```

3. **Inject tool into editor** (apps/editor/components/Editor.tsx)
   ```typescript
   {editor.activeTool === 'measure' && <MeasureTool />}
   ```

4. **No changes needed** in packages/viewer (composition handles it)

---

## Summary

| Layer | Role | Imports From | Exports | Example |
|-------|------|--------------|---------|---------|
| **core** | Domain logic | None (typed deps only) | Schemas, queries, mutations | Node, scene graph |
| **ui** | Design system | react, radix | Buttons, panels, tokens | Button, Modal |
| **viewer** | 3D canvas | core, ui, three.js | Viewer component, systems | Camera, lights, shadows |
| **editor** | Editor logic | core, ui, viewer | useEditor, context | Shortcuts, command palette |
| **apps/editor** | Platform UI | Everything | Next.js pages, tools | Dashboard, marketplace, tools |

**Golden Rule:** Dependency flows down. Never up. Composition for features.
