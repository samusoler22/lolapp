import { useState, useEffect } from 'react'
import { fetchMatchups } from '../services/matchups.js'

/**
 * @param {string|null} championId
 * @param {string|null} version
 * @returns {{ best: string[], worst: string[], loading: boolean }}
 */
export function useMatchups(championId, version) {
  const [state, setState] = useState({ best: [], worst: [], loading: false })

  useEffect(() => {
    if (!championId || !version) return

    let cancelled = false
    setState({ best: [], worst: [], loading: true })

    fetchMatchups(championId, version).then(({ best, worst }) => {
      if (!cancelled) setState({ best, worst, loading: false })
    })

    return () => { cancelled = true }
  }, [championId, version])

  return state
}
