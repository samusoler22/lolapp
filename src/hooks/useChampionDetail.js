import { useState, useEffect } from 'react'
import { fetchChampionDetail } from '../services/dataDragon.js'

// Module-level cache: survives navigation but not page refresh
const cache = new Map()

/**
 * Fetches full champion detail (spells + passive) when championId changes.
 * Results are cached in memory — second visit to the same champion is instant.
 *
 * @param {string|null} championId — e.g. "Jinx"
 * @param {string|null} version
 * @returns {{ data: object|null, loading: boolean, error: Error|null }}
 */
export function useChampionDetail(championId, version) {
  const cacheKey = championId && version ? `${version}:${championId}` : null
  const cached = cacheKey ? cache.get(cacheKey) ?? null : null

  const [state, setState] = useState({
    data: cached,
    loading: !cached,
    error: null,
  })

  useEffect(() => {
    if (!championId || !version) return
    const key = `${version}:${championId}`

    if (cache.has(key)) {
      setState({ data: cache.get(key), loading: false, error: null })
      return
    }

    let cancelled = false
    setState({ data: null, loading: true, error: null })

    fetchChampionDetail(version, championId)
      .then(data => {
        if (!cancelled) {
          cache.set(key, data)
          setState({ data, loading: false, error: null })
        }
      })
      .catch(err => {
        if (!cancelled) setState({ data: null, loading: false, error: err })
      })

    return () => { cancelled = true }
  }, [championId, version])

  return state
}
