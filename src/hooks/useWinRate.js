import { useState, useEffect } from 'react'
import { fetchWinRate } from '../services/winrate.js'

/**
 * Fetches win rate for a champion, with automatic fallback to estimate.
 *
 * @param {string|null} championId
 * @param {string|null} version
 * @returns {{ rate: number|null, isEstimate: boolean, loading: boolean }}
 */
export function useWinRate(championId, version) {
  const [state, setState] = useState({
    rate: null,
    isEstimate: false,
    loading: false,
  })

  useEffect(() => {
    if (!championId || !version) return

    let cancelled = false
    setState({ rate: null, isEstimate: false, loading: true })

    fetchWinRate(championId, version).then(({ rate, isEstimate }) => {
      if (!cancelled) setState({ rate, isEstimate, loading: false })
    })

    return () => { cancelled = true }
  }, [championId, version])

  return state
}
