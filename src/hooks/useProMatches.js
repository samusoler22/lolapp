import { useState, useEffect } from 'react'
import { fetchProMatches } from '../services/leaguepedia.js'

const CACHE_PREFIX = 'proMatches_'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

function cacheGet(championName) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + championName)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL_MS) { localStorage.removeItem(CACHE_PREFIX + championName); return null }
    return data
  } catch { return null }
}

function cacheSet(championName, matches) {
  try {
    localStorage.setItem(CACHE_PREFIX + championName, JSON.stringify({ data: matches, ts: Date.now() }))
  } catch {}
}

/**
 * Fetches the last 5 pro player games for a champion.
 * Retries on transient errors (max 2 retries), but NOT on rate-limit errors.
 * Results are cached in memory for the session.
 *
 * @param {string|null} championName — Leaguepedia champion spelling
 * @returns {{ matches: object[], loading: boolean, error: Error|null }}
 */
export function useProMatches(championName) {
  const [state, setState] = useState({
    matches: [],
    loading: false,
    error: null,
  })

  useEffect(() => {
    if (!championName) return

    // Return cached result immediately (localStorage survives StrictMode double-mount)
    const cached = cacheGet(championName)
    if (cached) {
      setState({ matches: cached, loading: false, error: null })
      return
    }

    let cancelled = false
    setState({ matches: [], loading: true, error: null })

    const fetchWithRetry = async (attempt = 0) => {
      try {
        const matches = await fetchProMatches(championName)
        if (!cancelled) {
          cacheSet(championName, matches)
          setState({ matches, loading: false, error: null })
        }
      } catch (err) {
        if (cancelled) return
        const isRateLimit = err.message.includes('ratelimited')
        if (!isRateLimit && attempt < 2) {
          setTimeout(() => fetchWithRetry(attempt + 1), 1500 * (attempt + 1))
        } else {
          setState({ matches: [], loading: false, error: err })
        }
      }
    }

    fetchWithRetry()
    return () => { cancelled = true }
  }, [championName])

  return state
}
