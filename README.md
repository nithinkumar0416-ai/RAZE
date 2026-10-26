# ⚡ RAZE AI — NEXT-GENERATION AI ASSISTANT
### "THINK BEYOND LIMITS."
> **Intelligence that moves with you. Your personal intelligence for thinking, creating, researching, and getting things done. Designed with a premium cinematic aesthetic inspired by cosmic particle intelligence and a distraction-free modern GPT chat workspace.**

[![Status: NEURAL SYSTEM ONLINE](https://img.shields.io/badge/System-NEURAL%20ONLINE-00E5FF.svg)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-38BDF8.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Frontend-Vite%20%2B%20React%2019-blue.svg)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-v24+-green.svg)](https://nodejs.org/)
[![SQLite](https://img.shields.io/badge/Database-SQLite%20WAL-lightgrey.svg)](https://nodejs.org/api/sqlite.html)

---

## 🌌 Visual Design & Cinematic Aesthetic

RAZE AI combines two complementary visual experiences:
1. **Immersive Cinematic Home Screen:**
   - **Void Black Canvas (`#030407`):** Deep cosmic void providing maximum contrast.
   - **Luminous Particle Silhouette:** Over 1,500 real-time canvas particles contouring the human cranial arch, neck, and shoulders.
   - **Volumetric Blue-White Light Rays:** Vertical columns of coherent light descending into the user's extended cupped palm.
   - **Thermal Energy Palm Aura:** Warm red-orange glow (`#FF5722`) cradling the focal point of the light stream.
   - **True 3D Interactive Parallax:** Multi-depth layer tracking for stars (0.2), silhouette (0.6), and hand (1.0).
   - **Interactive Palm Pulse:** Hovering cursor near the palm intensifies the energy aura; clicking triggers an explosive radial burst.
2. **Distraction-Free Modern AI Chat Workspace:**
   - Clean, modern layout inspired by state-of-the-art conversational AI interfaces.
   - Collapsible conversation sidebar with search and history management.
   - 5 cognitive modes (**Think**, **Research**, **Build**, **Create**, **Analyze**).
   - Syntax-highlighted code blocks with one-click copy and Markdown rendering.
   - Floating input capsule with auto-expanding textarea.

---

## ⚡ The 5 Specialized Agent Modes

Unlike generic conversational chatbots, RAZE executes distinct cognitive loops:

| Mode | Core Focus | Primary Capabilities |
| :--- | :--- | :--- |
| 🧠 **THINK** | Deep Algorithmic Reasoning | Multi-step problem decomposition, boundary state exploration, and formal proof synthesis. |
| 🔍 **RESEARCH** | Live Academic & Technical Intelligence | Live search across RFCs, whitepapers, and academic repositories with real cited links. |
| 🔨 **BUILD** | Autonomous Project & Task Execution | Translates natural language intents into prioritized subtasks, dependencies, and execution graphs. |
| ✨ **CREATE** | Specifications & Synthesis | Drafts system architectures, API design contracts, prompt scaffolds, and technical documentation. |
| 🛡️ **ANALYZE** | Verification, AST & Safety Audits | Performs AST boundary inspection, mutation testing resilience scoring, and OWASP vulnerability scans. |

---

## 🛠️ Complete Application Architecture

```
RAZE Platform
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── canvas/
│   │   │   │   └── RazeCinematicCanvas.tsx  # 60fps HTML5 Canvas Particle Engine & Parallax
│   │   │   └── layout/
│   │   │       └── RazeNavbar.tsx            # Futuristic top navigation & online status beacon
│   │   ├── pages/
│   │   │   ├── RazeHeroPage.tsx              # Cinematic fullscreen hero & capabilities showcase
│   │   │   ├── RazeAgentPage.tsx             # Conversational workspace across all 5 modes
│   │   │   ├── RazeTasksPage.tsx             # NL Intent Decomposer & Task Execution Center
│   │   │   ├── RazeResearchPage.tsx          # Live search aggregator & cited references
│   │   │   ├── RazeProjectsPage.tsx          # Project manager & user-approved persistent memory notes
│   │   │   ├── RazeActivityPage.tsx          # Chronological immutable audit feed
│   │   │   └── RazeSettingsPage.tsx          # Demo mode, provider config, motion & sound settings
│   │   ├── services/
│   │   │   └── api.ts                        # Unified REST API client
│   │   └── types/
│   │       └── index.ts                      # Strict TypeScript interfaces
└── server/
    ├── src/
    │   ├── db/
    │   │   └── database.ts                   # SQLite WAL schema (profiles, conversations, tasks, notes)
    │   ├── services/
    │   │   ├── raze-agent-service.ts         # 5 cognitive mode execution loops
    │   │   ├── task-service.ts               # Background asynchronous task worker
    │   │   └── research-service.ts           # Academic research aggregator
    │   └── routes/
    │       ├── agent.ts                      # POST /api/agent/chat, POST /api/agent/plan
    │       ├── tasks.ts                      # POST, GET, PATCH, /cancel, /execute
    │       ├── research.ts                   # POST /api/research
    │       ├── projects.ts                   # GET, POST /api/projects
    │       ├── notes.ts                      # GET, POST, DELETE /api/notes
    │       └── activity.ts                   # GET /api/activity
```

---

## 🚀 Quickstart & Hackathon Presentation Guide

### 1. Requirements
- Node.js v20+ or v24+
- npm v10+

### 2. Install Dependencies
```bash
npm install
npm --prefix server install
npm --prefix client install
```

### 3. Run Development Environment
```bash
# Starts Express backend (port 3001) and Vite client (port 5173) concurrently
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

### 4. Build for Production
```bash
npm run build
npm start
```
The server on **`http://localhost:3001`** will serve both the backend API and the compiled frontend assets from `client/dist`.

---

## 🏆 Hackathon Demo Script (Recommended Walkthrough)

1. **The Awakening (Hero Screen):**
   - Move mouse across the screen to demonstrate the 3D parallax on stars, particle silhouette, and light beams.
   - Hover cursor over the cupped hand in the center to show the thermal energy aura intensify.
   - Click the palm to trigger the radial particle shockwave.
   - Click **"AWAKEN RAZE"** to smoothly enter the working AI workspace.

2. **5 Cognitive Modes in Action (`/agent`):**
   - Click a suggested prompt like *"Research a topic for my hackathon"* or *"Create a project execution plan"*.
   - Switch between **Think**, **Research**, **Build**, **Create**, and **Analyze** pills to see distinct execution styles and metadata outputs.
   - Click **"Bridge to Task Runner"** on an output to immediately transition the plan into the Task Center.

3. **Autonomous Task Execution Center (`/tasks`):**
   - Enter a natural language goal: *"Implement self-healing websocket reconnect with exponential backoff"*.
   - Click **"DECOMPOSE PLAN"** — RAZE breaks the vision into 4 prioritized, sequential steps.
   - Click **"Approve & Schedule"** — tasks are persisted to SQLite.
   - Click **"Execute"** on a task to watch the real asynchronous background execution update from *Planned* to *Running* to *Completed*.

4. **Live Research Explorer (`/research`):**
   - Click a suggested query like *"Autonomous AI verification architectures"*.
   - Review the Executive Synthesis and the verified academic citation cards with direct links.

5. **Project Organization & Persistent Memory (`/projects`):**
   - View project completion gauges.
   - Add a long-term memory note (e.g. *"Axiom: Always generate TypeScript definitions for API payloads"*).
   - Show how memory notes persist in SQLite and can be deleted to purge context.

6. **System Telemetry & Settings (`/settings`):**
   - Inspect live backend health diagnostics.
   - Toggle **Hackathon Demo Mode** (guarantees 100% offline uptime with zero external API dependencies) or configure Claude / OpenAI provider keys.

---

## 🔒 Security Guarantee
- All private API keys and database tokens reside strictly in server-side environment variables (`server/.env`).
- Never leaked into client JavaScript bundles.
- Isolated session storage per user identity.

---

## 📜 License
Apache-2.0 © 2026 RAZE Intelligence Systems.
