# Visual Design & UI Reference: archly.cloud

## 1. Core Philosophy
The design language of **archly.cloud** operates on a dual-axis depending on the user's context:
1.  **Platform & Landing Layer ("Google Antigravity"):** Spatial, floaty, deeply immersive, and physics-driven. UI elements feel like they are suspended in zero-gravity over a dark void, utilizing heavy liquid glass effects.
2.  **Dashboard & Workspace (Figma/Miro Stylized):** High-density utility. Once inside the app, the UI must get out of the way. It requires strict, clean visual hierarchies, thin borders, and frictionless navigation, ensuring the 3D files remain the absolute focus.

**CRITICAL RULE:** The underlying Pascal 3D Editor is a visual "Black Box." The platform UI must gracefully float *over* or *around* the editor canvas without interfering with its internal WebGL layout.

---

## 2. Color System & Typography
The palette is hyper-minimalist to allow the vibrant colors and lighting of user-generated 3D architectural models to pop.

### Color Palette
*   **Canvas Void (Background):** `#050505` to `#0A0A0A` (Deepest off-black).
*   **Surface Liquid (Panels/Cards):** `rgba(255, 255, 255, 0.03)` to `rgba(255, 255, 255, 0.08)`.
*   **Borders (Glass Edge):** `rgba(255, 255, 255, 0.1)` with a top-edge highlight of `rgba(255, 255, 255, 0.2)` to simulate light catching glass.
*   **Primary Text:** `#EDEDED` (Soft White).
*   **Secondary/Muted Text:** `#888888`.
*   **Presence Accents:** Neon/Electric colors strictly reserved for multiplayer avatars, cursors, and active selection borders (e.g., Electric Blue `#00E5FF`, Neon Pink `#FF007F`).

### Typography
*   **Primary Font:** Inter or Geist (Sans-serif). Clean, highly legible at small sizes for complex dashboard menus.
*   **Display Font (Landing Page):** A slightly extended or geometric sans-serif (e.g., Space Grotesk) for massive, impactful "Antigravity" hero headers.

---

## 3. Materiality: "Liquid Glass" & "Antigravity" Specs
All modals, navbars, and floating panels must adhere to these CSS/Tailwind specifications to achieve the signature look.

*   **Backdrop Blur:** Heavy. `backdrop-blur-xl` or `backdrop-blur-2xl` (`16px` to `24px` blur radius).
*   **Background:** Barely there. `bg-white/5`.
*   **Border:** 1px solid `border-white/10`.
*   **Box Shadow (Antigravity glow):** `shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]`.
*   **Inner Glow (Liquid edge):** Add a subtle inner shadow `shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]` to give panels a 3D bevel.

---

## 4. Module-Specific UI Guidelines

### 4.1 The Landing Page (Google Antigravity)
*   **Layout:** Unbound by grids. Elements should feel like they exist in a 3D space.
*   **Hero Section:** A massive, center-aligned typography lockup. Behind it, a slow-rotating, highly lit 3D architectural model. As the user scrolls, the text fades up/away (Z-axis translation), and the 3D model scales up to consume the screen.
*   **Bento Box:** Feature cards should not be rigidly attached. They should have a slight "float" animation (Y-axis bobbing) and react to mouse movement with subtle tilt (Framer Motion `useTransform`).

### 4.2 The Dashboard (Figma/Miro Stylized)
*   **Layout Structure:** Fixed 100vh layout. No page scrolling; only internal container scrolling.
*   **Left Sidebar (The Navigator):** 
    *   Fixed width (e.g., `240px`).
    *   Contains nested accordion menus for Org > Team > Project.
    *   Hover states on list items should be a subtle `bg-white/5` with a `border-radius` of `6px`.
*   **Top Bar (Global Actions):** Search bar (center), Notification Bell, Avatar Stack (showing who is online in the workspace).
*   **Main Canvas (File Browser):** 
    *   Masonry or CSS Grid of "Project Cards".
    *   **Project Cards:** Minimalist. A large thumbnail area, with the project name and last edited date directly below in standard Inter font.
    *   **Hover Interaction:** The static `.png` thumbnail cross-fades into a live React Three Fiber `<Canvas>` showing a spinning 3D preview.

### 4.3 The Marketplace / Community
*   **Search & Filter:** A sticky, frosted-glass header (`sticky top-0 z-50 backdrop-blur-xl`). Pills for tags ("Parametric", "Lighting") that turn white when active.
*   **Card Design:** Dribbble-style. Edge-to-edge images with creator avatars overlapping the bottom-right corner.
*   **Duplication Action:** The "Clone" button should be the only highly saturated, solid-color button on the screen to drive the primary growth metric.

---

## 5. Motion & Interaction (Framer Motion)
Linear animations are strictly forbidden. All movement must use spring physics to feel tactile and weighty.

*   **Standard Spring (Panels, Modals, Menus):** 
    ```javascript
    transition={{ type: "spring", stiffness: 300, damping: 30 }}
    ```
*   **Float Effect (Landing page Antigravity):**
    ```javascript
    animate={{ y: [0, -10, 0] }}
    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
    ```
*   **Page Transitions:** Cross-fades with a slight scale-down of the outgoing view (`scale: 0.98`, `opacity: 0`) and scale-up of the incoming view.

## 6. Integrating the Pascal Editor
When the user clicks a project, the Figma-style dashboard dissolves.
*   The **Pascal Editor** claims 100% of the viewport.
*   The archly.cloud platform layer recedes to a single, hyper-minimalist floating glass toolbar at the top-center of the screen containing: `[Project Name] | [Avatar Stack (Presence)] | [Share Button] | [Export]`.