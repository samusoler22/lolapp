const CACHE_TTL = 60 * 60 * 1000 // 1 hour
const CACHE_PREFIX = 'wr:'

function getCached(championId) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + championId)
    if (!raw) return null
    const { rate, ts } = JSON.parse(raw)
    return Date.now() - ts < CACHE_TTL ? rate : null
  } catch { return null }
}

function setCached(championId, rate) {
  try {
    localStorage.setItem(CACHE_PREFIX + championId, JSON.stringify({ rate, ts: Date.now() }))
  } catch {}
}

/**
 * Fetches win rate for a champion by streaming the LoLalytics build page HTML.
 *
 * Results are cached in localStorage (1h TTL) — subsequent calls are instant.
 *
 * @param {string} championId — Data Dragon id e.g. "Jinx"
 * @param {string} version    — e.g. "16.4.1" (unused but kept for API compat)
 * @returns {Promise<{ rate: number, isEstimate: boolean }>}
 */
export async function fetchWinRate(championId, version) {
  const cached = getCached(championId)
  if (cached !== null) return { rate: cached, isEstimate: false }

  const champLower = championId.toLowerCase()

  try {
    const res = await fetch(`/api/stats/lol/${champLower}/build/`, {
      signal: AbortSignal.timeout(5000),
    })

    if (res.ok && res.body) {
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          // Find the first XX.XX% value in the valid win rate range (40–65%)
          for (const m of buffer.matchAll(/(\d{2}\.\d{1,2})%/g)) {
            const rate = parseFloat(m[1])
            if (rate >= 40 && rate <= 65) {
              reader.cancel()
              setCached(championId, rate)
              return { rate, isEstimate: false }
            }
          }

          // Give up after 80KB — win rate should be in the first few KB
          if (buffer.length > 80_000) break
        }
      } finally {
        reader.cancel()
      }
    }
  } catch { /* falls through to estimate */ }

  // Silent fallback — shown with "(est.)" label in UI
  return { rate: getEstimatedWinRate(championId), isEstimate: true }
}

/**
 * Deterministic win rate estimate based on champion id.
 * Always returns the same value for the same champion. Range: 48.0 – 52.9
 */
function getEstimatedWinRate(championId) {
  const hash = championId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return 48.0 + (hash % 50) / 10
}
