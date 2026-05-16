import { fetchAllChampions } from './dataDragon.js'

const CACHE_TTL   = 60 * 60 * 1000
const CACHE_PREFIX = 'mu:'

function getCached(championId) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + championId)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    return Date.now() - ts < CACHE_TTL ? data : null
  } catch { return null }
}

function setCached(championId, data) {
  try {
    localStorage.setItem(CACHE_PREFIX + championId, JSON.stringify({ data, ts: Date.now() }))
  } catch {}
}

// Module-level lookup: lowercase/stripped name → Data Dragon id
let _champLookup = null

async function getChampLookup(version) {
  if (_champLookup) return _champLookup
  const champs = await fetchAllChampions(version)
  const lookup = {}
  for (const [id, champ] of Object.entries(champs)) {
    lookup[id.toLowerCase()]                              = id
    lookup[champ.name.toLowerCase().replace(/['\s.]/g, '')] = id
  }
  _champLookup = lookup
  return lookup
}

// Try to extract best/worst champion name arrays from any known LoLalytics JSON shape
function extractFromJson(json) {
  // Shape A: { counters: { best: [{champion, winrate}], worst: [...] } }
  if (json?.counters?.best?.length && json?.counters?.worst?.length) {
    const normalize = arr =>
      arr.slice(0, 5).map(c =>
        (c.champion || c.name || c.id || '').toLowerCase().replace(/['\s.]/g, '')
      )
    return {
      bestNames:  normalize(json.counters.best),
      worstNames: normalize(json.counters.worst),
    }
  }

  // Shape B: { matchups: [{champion, winrate}] } — sort by winrate
  if (Array.isArray(json?.matchups) && json.matchups.length > 1) {
    const sorted = [...json.matchups].sort((a, b) => (b.winrate ?? 0) - (a.winrate ?? 0))
    const normalize = arr =>
      arr.slice(0, 5).map(c =>
        (c.champion || c.name || '').toLowerCase().replace(/['\s.]/g, '')
      )
    return {
      bestNames:  normalize(sorted),
      worstNames: normalize([...sorted].reverse()),
    }
  }

  return null
}

/**
 * Fetches best/worst matchup champion IDs for a given champion.
 * Tries the LoLalytics JSON API first, then falls back to HTML link scraping.
 * Returns { best: [], worst: [] } on failure — always safe to call.
 *
 * @param {string} championId — Data Dragon id e.g. "Jinx"
 * @param {string} version    — e.g. "16.4.1"
 * @returns {Promise<{ best: string[], worst: string[] }>}
 */
export async function fetchMatchups(championId, version) {
  const cached = getCached(championId)
  if (cached) return cached

  const champLower = championId.toLowerCase()

  // ── Attempt 1: LoLalytics JSON API ────────────────────────────────────
  try {
    const res = await fetch(
      `/api/stats/api/champion/?champion=${championId}&role=default&tier=platinum_plus&region=all&patch=current`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (res.ok) {
      const json = await res.json()
      const extracted = extractFromJson(json)
      if (extracted) {
        const lookup = await getChampLookup(version)
        const result = {
          best:  extracted.bestNames.map(n => lookup[n]).filter(Boolean).slice(0, 3),
          worst: extracted.worstNames.map(n => lookup[n]).filter(Boolean).slice(0, 3),
        }
        if (result.best.length > 0 || result.worst.length > 0) {
          setCached(championId, result)
          return result
        }
      }
    }
  } catch { /* falls through */ }

  // ── Attempt 2: scan counters page HTML for /lol/NAME/ links ───────────
  try {
    const res = await fetch(`/api/stats/lol/${champLower}/counters/`, {
      signal: AbortSignal.timeout(6000),
    })
    if (res.ok) {
      const html      = await res.text()
      const lookup    = await getChampLookup(version)
      const skipWords = new Set([champLower, 'build', 'counters', 'runes', 'items', 'probuilds', 'tier', 'en'])
      const seen      = new Set()
      const ordered   = []

      for (const m of html.matchAll(/\/lol\/([a-z]{2,20})\//g)) {
        const name = m[1]
        if (!skipWords.has(name) && !seen.has(name)) {
          const id = lookup[name]
          if (id) { seen.add(name); ordered.push(id) }
        }
      }

      if (ordered.length >= 4) {
        // Convention: LoLalytics shows "good into" section before "bad into" section
        const result = {
          best:  ordered.slice(0, 3),
          worst: ordered.slice(-3),
        }
        setCached(championId, result)
        return result
      }
    }
  } catch { /* falls through */ }

  return { best: [], worst: [] }
}
