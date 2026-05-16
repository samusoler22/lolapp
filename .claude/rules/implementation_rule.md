---
description: Reference rule for any code creation or implementation task. Activates the multi-agent workflow using Claude Code Agent Teams: the main agent IS the Coordinator and must never delegate that role.
---

# Implementation Rule

This rule governs every code creation, modification, or refactoring task in this project.
Whenever a phase plan is received, this workflow must be followed in full — no shortcuts.

> **Requires:** `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in settings (already set in `settings.local.json`).

---

## Team Roles

| Agent | Responsibility |
|---|---|
| **Coordinator** | **The main agent. Always.** Never spawned. Creates the team, briefs teammates, monitors progress, delivers the phase report. |
| **Scout** | Surveys the codebase — Glob/Grep/Read only. Reports to Coordinator via `SendMessage`. Never writes code. |
| **Engineer** | Implements the phase. Communicates directly with the Auditor during implementation. |
| **Auditor** | Reviews the Engineer's work in real-time. Sends feedback directly to the Engineer. Sends final verdict to the Coordinator. |

Full role definitions live in `.claude/agents/`.

---

## Workflow

### Step 1 — User submits a phase
The user provides a phase goal, scope, and context.
**The main agent immediately assumes the Coordinator role.** No coordinator agent is ever spawned.

### Step 2 — Coordinator creates the Agent Team
Use `TeamCreate`. Teammates: `scout`, `engineer`, `auditor`.

### Step 3 — Coordinator creates tasks
Using `TaskCreate`:
- **Scout task** — no dependencies, starts immediately.
- **Engineer task** — `blocked_by: [scout_task_id]`.
- **Auditor task** — `blocked_by: [scout_task_id]` only (NOT blocked by Engineer — they run in parallel).

### Step 4 — Coordinator briefs and spawns the Scout
Send a full briefing via `SendMessage`: phase goal, relevant file paths, patterns to look for, what to produce. Spawn the Scout agent. Teammates start with a blank context window — be explicit.

### Step 5 — Scout surveys the codebase
The Scout uses Glob, Grep, and Read to find relevant files, identify reusable logic, and flag conflicts. It marks its task complete and sends its report to the Coordinator.

### Step 6 — Coordinator spawns Engineer AND Auditor simultaneously
Once the Scout reports:
- Brief **both** the Engineer and the Auditor via `SendMessage` with the Scout's findings and phase goal.
- Spawn both agents **at the same time** (parallel `run_in_background: true`).
- Tell each one the other's teammate name so they can message each other directly.
- The Engineer implements; the Auditor reviews work as it arrives.

### Step 7 — Engineer ↔ Auditor work in parallel
- The **Engineer** writes code incrementally and sends updates directly to the **Auditor** via `SendMessage`.
- The **Auditor** reviews each update and sends feedback or approval directly back to the **Engineer**.
- They iterate peer-to-peer without routing through the Coordinator.
- When the Auditor is satisfied, it sends the final approval to the **Coordinator** via `SendMessage`.
- If the same issue persists after two Engineer iterations, the Auditor escalates to the Coordinator.

### Step 8 — Coordinator receives Auditor approval
The Coordinator waits for the Auditor's final verdict. Once approved:
1. Shut down Engineer and Auditor via `SendMessage` (shutdown_request).
2. Mark all tasks completed via `TaskUpdate`.
3. Call `TeamDelete`.
4. Deliver the phase report to the user.

---

## Phase Report (delivered by Coordinator)

```
## Phase [N] — [Phase Name] ✓

**Goal:** <one-line summary>

**Files changed:**
- path/to/file.jsx — <what changed>
- path/to/file.module.css — <what changed>

**Scout findings used:** <brief note>
**Auditor verdict:** Approved — <any notable notes>

**Next phase:** [N+1] — [Name] (if applicable)
```

---

## Agent Teams Tools Reference

| Tool | Used by | Purpose |
|---|---|---|
| `TeamCreate` | Coordinator (main agent) | Spin up teammates |
| `TeamDelete` | Coordinator (main agent) | Clean up after phase closes |
| `TaskCreate` | Coordinator (main agent) | Create tasks with dependency chains |
| `TaskList` | Coordinator (main agent) | Monitor all task statuses |
| `TaskGet` | Coordinator (main agent) | Get details on a specific task |
| `TaskUpdate` | All | Mark tasks complete, assign owners |
| `TaskOutput` | Coordinator (main agent) | Collect teammate output |
| `SendMessage` | All | Direct inter-agent communication |

---

## Non-negotiable rules

- **The main agent is always the Coordinator.** Never spawn a coordinator agent.
- **Scout always runs first.** No code is written before the Scout reports.
- **Engineer and Auditor always run in parallel.** They are spawned at the same time and communicate directly.
- **Only the Auditor approves a phase.** The Coordinator and Engineer cannot self-approve.
- **Scope is a hard boundary.** Out-of-scope issues are logged, not fixed.
- **Engineer principles:** simple · readable · minimal comments · no over-engineering.
- **No phase is skipped.** Every phase — even small ones — runs the full workflow.
- **Teammates need explicit context.** Use `SendMessage` — they start with a blank context window.
- **Clean up.** Call `TeamDelete` when the phase closes.

---

## Project context (LoL Champion Explorer)

- Stack: React 18 + Vite 7 + Framer Motion 11 + CSS Modules
- Services: `src/services/` | Hooks: `src/hooks/` | Utils: `src/utils/` | Components: `src/components/`
- Global styles and CSS vars: `src/styles/global.css`
- Vite proxy: `/api/lolalytics/*` → `https://lolalytics.com/*`
- Color palette: blood reds (`#400000`→`#900000`), gold `#c89b3c`, text `#e8d5a3`
