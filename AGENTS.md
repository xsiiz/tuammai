# AGENTS.md — ท่วมมั้ย (Tuammai) Web Application

> **Mandatory Rule:** AI agents, developers, and autonomous assistants working on this repository **MUST** read and strictly adhere to `rules.md` before executing any task or generating code.

---

## 1. Project Overview & Vision

**"ท่วมมั้ย" (Tuammai)** is an interactive, real-time flood monitoring and dam water level tracking web application for Thailand. It delivers an intuitive, visually engaging experience featuring:
- A tactile **3D Low-Relief (นูนต่ำ) Interactive Map of Thailand** on the landing page.
- Visual status indicators for major dams and real-time reservoir capacity levels.
- Contextual drill-down capabilities (Country → Region → Dam/Station detail).
- Custom UI iconography crafted with **Nano Banana 2**.

---

## 2. Agent Operational Roles

When handling tasks within this repository, agents should adopt the relevant role profile:

### 2.1. 3D Map & Visualization Agent (`Agent-Geo3D`)
- **Primary Focus:** Three.js / React Three Fiber / Mapbox GL 3D integration.
- **Key Responsibilities:**
  - Render the 3D low-relief elevation map of Thailand.
  - Optimize terrain mesh/heightmap assets for smooth 60fps performance on both desktop and mobile.
  - Implement region-level camera movements, boundary highlights, and smooth drill-down transitions.
  - Plot 3D pin/billboard markers over geographic dam coordinates.

### 2.2. Data & Domain Logic Agent (`Agent-DamData`)
- **Primary Focus:** Dam hydrology, water level calculations, and external API pipelines.
- **Key Responsibilities:**
  - Define and parse dam telemetry data models (storage percentage, inflow/outflow, capacity thresholds).
  - Implement color-coded threshold logic:
    - 🔴 Critical (> 95%)
    - 🟡 Warning (> 80%)
    - 🟢 Normal (< 80%)
  - Manage modal states and drill-down historical graphs (e.g., 7-day water inflow trends).

### 2.3. Design & Asset Generation Agent (`Agent-NanoBanana`)
- **Primary Focus:** Iconography and UI aesthetic consistency.
- **Key Responsibilities:**
  - Generate and manage prompts/configurations for **Nano Banana 2** icon generation.
  - Maintain consistent design styling for all app icons:
    - Dam & Reservoir status pins
    - Region selection icons (North, Northeast, Central, East, West, South)
    - Warning & alert badges
    - Water flow and weather state icons
  - Ensure export formats (SVG/PNG/WebP) are optimized for low latency.

---

## 3. Core Functional Requirements & Workflow

```
[Landing Page]
      │
      ▼
[3D Low-Relief Thailand Map] ── (Nano Banana 2 UI Icons)
      │
      ├─── Click Region ──────► [Regional Drill-Down View]
      │                               │
      └─── Click Dam Marker           └── Filtered Dam List & Local Basin
               │
               ▼
      [Dam Detail Modal / Drawer]
      - Reservoir Capacity (%)
      - Current Storage (MCM)
      - Daily Inflow / Outflow
      - 7-Day Trend Chart & Alert Level
```

### 3.1. Landing Page & 3D Low-Relief Map
- **Style:** Tactile, matte-finish low-relief clay/topographic 3D style representing Thailand's elevation.
- **Default View:** Complete country overview displaying key national dams (e.g., เขื่อนภูมิพล, เขื่อนสิริกิติ์, เขื่อนป่าสักชลสิทธิ์, เขื่อนศรีนครินทร์).
- **Dam Labels:** Interactive floating tags displaying the dam name and current percentage gauge.

### 3.2. Drill-Down Navigation
- **Hierarchy:**
  1. **National Level (ภาพรวมประเทศ):** Overview of all regions and national reservoir averages.
  2. **Regional Level (รายภาค):** Triggered by clicking on a region (ภาคเหนือ, ภาคกลาง, ภาคอีสาน, etc.) or regional quick-filters. Smoothly moves the 3D camera to frame the selected territory and exposes localized dams and river basins.
  3. **Dam Detail View (ข้อมูลเชิงลึกรายเขื่อน):** Triggered by clicking a dam name or marker. Displays a detailed panel with:
     - Full dam name and managing authority (EGAT / RID)
     - Current water volume vs. maximum retention capacity
     - Historical level comparisons
     - Flood risk advisory status

### 3.3. Iconography with Nano Banana 2
- All custom icons must use the designated **Nano Banana 2** style template:
  - Clean silhouettes with soft isometric/3D lighting cues matching the low-relief terrain.
  - Unified color scheme calibrated with water level alert indicators.
  - Exported to `/public/assets/icons/nano-banana/`.

---

## 4. Agent Guidelines & Coding Standards

1. **Rule File Precedence:** Always check `rules.md` before applying architectural patterns, state changes, or API updates.
2. **Performance Constraints:** 3D shaders and geometries must be lazy-loaded; texture sizes must not exceed 2048x2048 to ensure accessibility on mobile web browsers.
3. **Accessibility & Fallback:** If WebGL or 3D acceleration is unsupported on the client device, provide a clean, high-contrast 2D fallback map view.
4. **Bilingual Support:** Ensure key UI labels and dam names support Thai (TH - default) and English (EN).