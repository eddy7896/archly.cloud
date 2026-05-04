# Product Requirements Document (PRD): archly.cloud

## 1. Executive Summary
**archly.cloud** is an enterprise-grade, collaborative, web-based 3D architectural design SaaS. It bridges the gap between complex 3D scene editing and frictionless, multi-tenant workspace management (similar to Figma or Miro). It features real-time collaboration, a presence engine, and a community marketplace for sharing and duplicating 3D architectural assets.

## 2. Product Vision & Goals
* **Vision:** To become the standard collaborative workspace for architectural firms and spatial designers, making 3D design as accessible and fluid as 2D vector editing.
* **Goals:**
  * Deliver a seamless multiplayer 3D experience without visual stuttering.
  * Provide enterprise-grade workspace organization (Organizations > Teams > Projects).
  * Build a growth engine via a community marketplace with a frictionless duplication system.

## 3. Target Audience & Personas
* **Lead Architect / Agency Owner:** Needs billing control, project isolation, and client presentation tools.
* **Spatial Designer / Editor:** Spends hours in the 3D editor; needs fast asset loading and zero-lag collaboration.
* **The Client (Viewer):** Non-technical. Needs a frictionless link to view the 3D model, see where the architect is pointing (presence), and leave spatial comments.
* **3D Creator:** Uses the marketplace to publish modular architectural assets (furniture, lighting) or complete templates to build a following.

## 4. Core Modules & Features

### 4.1 Onboarding & Authentication
* **Auth:** Magic links, OAuth (Google/GitHub), and standard Email/Password.
* **Paginated Wizard:** Captures User Role (Solo, Agency, Student) and provisions the top-level Workspace/Organization name.

### 4.2 Workspace Dashboard
* **UI/UX:** Dark mode (`#0A0A0A`) with liquid glassmorphism UI overlays. 
* **Organization:** Left sidebar for navigating Organizations, Teams, and Folders.
* **Interactive Previews:** Project cards use a lightweight WebGL canvas to show a rotating low-poly preview of the scene on hover.

### 4.3 3D Editor Wrapper & Access Control
* **The Black Box:** The core WebGL/CRDT editor is pre-built. The platform wraps this editor in a secure shell.
* **Role-Based Access Control (RBAC):**
  * *Owner/Editor:* Full bi-directional CRDT write access.
  * *Commenter:* Read-only 3D state, can write to a separate spatial comments layer.
  * *Viewer:* Read-only 3D state, broadcasts ephemeral presence (camera/cursor).

### 4.4 Community Marketplace
* **Public Gallery:** Searchable feed of published architectural scenes and components.
* **Pointer-Based Duplication:** A "Clone to Drafts" button that copies the scene graph state into the user's workspace instantly, without duplicating heavy 3D files.
* **Creator Profiles:** Public portfolios showcasing published templates and modular assets.

## 5. Success Metrics
* **Time-to-Value:** Percentage of users who successfully complete onboarding and duplicate their first sandbox project.
* **Collaboration Rate:** Number of sessions with 2+ concurrent active users.
* **Marketplace Velocity:** Number of scene duplications per week.