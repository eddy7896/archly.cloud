# Technical Requirements Document (TRD): archly.cloud

## 1. System Architecture Overview
archly.cloud is built on a decoupled architecture. The frontend is a Next.js React application handling routing, UI, and marketplace logic. The core 3D editor (WebGL/Three.js) is treated as an isolated component. State management relies on Yjs (CRDTs) over WebSockets for document sync, and Cloudflare R2 for zero-egress asset storage.

## 2. Technology Stack
* **Frontend/Framework:** Next.js (App Router), React, React Three Fiber (for dashboard previews).
* **Styling & Animation:** Tailwind CSS, Framer Motion, Radix UI (accessible primitives).
* **UI Theme:** Custom dark mode with heavy glassmorphism (`backdrop-blur`).
* **Database & ORM:** PostgreSQL, Prisma ORM.
* **Real-time Sync:** Yjs (CRDTs), `y-websocket` (Node.js containerized backend).
* **Storage/CDN:** Cloudflare R2 (S3-compatible API).

## 3. Database Schema (Relational Models)
* **Organization:** `id`, `name`, `billingPlan`.
* **User:** `id`, `email`, `role`, `avatarUrl`.
* **Team:** `id`, `organizationId`, `name`.
* **Project:** `id`, `teamId`, `name`, `yjsDocumentBlob`, `previewImageUrl`, `isPublished`.
* **ProjectMember (Mapping):** `userId`, `projectId`, `role` (Enum: `OWNER`, `EDITOR`, `VIEWER`, `COMMENTER`).

## 4. Critical Engineering Workflows

### 4.1 Cloudflare R2 Upload Pipeline
* **Requirement:** Next.js server memory must not be bottlenecked by heavy `.glb` or texture uploads.
* **Implementation:** 
  1. Client requests upload intent.
  2. Next.js server uses `@aws-sdk/client-s3` to generate a Pre-Signed `PUT` URL.
  3. Client uploads file directly to Cloudflare R2.
  4. Client updates Yjs document with the public R2 CDN URL.

### 4.2 Cross-Origin WebGL Security
* **Requirement:** 3D canvas must render external R2 assets without "Tainted Canvas" errors.
* **Implementation:** Cloudflare R2 bucket CORS policy must explicitly allow `GET` and `OPTIONS` methods from the `archly.cloud` domain, and expose the `Access-Control-Allow-Origin` header.

### 4.3 Pointer-Based Duplication Engine
* **Requirement:** Cloning a massive marketplace scene must be instant and cost-efficient.
* **Implementation:** When cloning, the backend fetches the `yjsDocumentBlob` (JSON/binary state) from the source project and inserts it as a new Project row for the cloning user. **No `.glb` or `.png` files are copied.** The new Yjs state retains pointers to the original Cloudflare R2 URLs.

### 4.4 The Editor "Black Box" Contract
* **Requirement:** The existing WebGL editor code must remain untouched by platform feature updates.
* **Implementation:** The editor is wrapped in a Next.js layout component:
  ```tsx
  <ArchlyEditor 
     documentId={project.yjsRoomId} 
     accessLevel={user.role} 
     userPresenceProfile={{ name: user.name, color: user.cursorColor }}
  />