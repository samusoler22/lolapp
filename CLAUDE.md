# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev    # Vite dev server
npm run build  # production build
npm run lint   # ESLint (no --fix)
```

No test suite configured.

## Architecture

React 19 + Vite 7 + CSS Modules + Framer Motion SPA. No router — `App.jsx` is a two-view state machine: `selectedChampion === null` shows `ChampionGrid`, otherwise `ChampionDetail`.

**Data flow:** hooks (`src/hooks/`) call services (`src/services/`); components never fetch directly.

| Hook | Service | Source | Cache |
|---|---|---|---|
| `useChampions` | `dataDragon.js` | Riot Data Dragon | none (startup) |
| `useChampionDetail` | `dataDragon.js` | Riot Data Dragon | in-memory Map |
| `useWinRate` | `winrate.js` | LoLalytics (Vite proxy) | localStorage 1h |
| `useMatchups` | `matchups.js` | LoLalytics (Vite proxy) | localStorage 1h |
| `useProMatches` | `leaguepedia.js` | Leaguepedia MediaWiki API | localStorage 10min |

The item catalog (`fetchAllItems`) is loaded once in `App.jsx` after the version resolves, then passed as a prebuilt `Map<normalizedName, itemData>` (`itemIndex`) into `ProMatchList` — never re-fetched per champion.

**Vite proxy:** `/api/stats/*` → `https://lolalytics.com`. Dev only; prod needs a server-side proxy.

**Win rate** is HTML stream-scraped (first `XX.XX%` in 40–65% range). Falls back to a deterministic hash-based estimate shown as "(est.)".

**Matchups** try the LoLalytics JSON API first, then fall back to scraping `/counters/` page links.

**Pro matches** (`leaguepedia.js`) use a two-pass cargoquery: games first, then lane opponents in a second request. `origin=*` satisfies CORS — no proxy needed.

**3D models** (`ChampionModel`) use `@google/model-viewer` pulling `.glb` files from `cdn.modelviewer.lol`. Lazy-loaded via `React.lazy`; silently hidden on error.

**CSS tokens** all live in `src/styles/global.css`. Some token names are legacy and misleading (e.g. `--color-dark-cyan` is orange `#ff6a1a`). Do not rename them — every CSS module references them.

**Item name normalization** (`src/utils/itemNormalizer.js`): Leaguepedia and Data Dragon names differ; both sides are normalized to lowercase with punctuation stripped, plus a small `ALIASES` map for known mismatches.

## Agent team workflow

When given a phase plan, follow `.claude/rules/implementation_rule.md`: Coordinator (main agent) → Scout → Engineer + Auditor in parallel. Role definitions are in `.claude/agents/`.
