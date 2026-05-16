import { useState, useEffect } from 'react'
import { fetchLatestVersion, fetchAllChampions } from '../services/dataDragon.js'

/**
 * Fetches and returns the full champion roster + current patch version.
 * Should be called once at the app root.
 *
 * @returns {{
 *   champions: object[],   sorted alphabetically by name
 *   version: string|null,  Data Dragon patch string e.g. "16.4.1"
 *   loading: boolean,
 *   error: Error|null
 * }}
 */
export function useChampions() {
  const [state, setState] = useState({
    champions: [],
    version: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const version = await fetchLatestVersion()
        if (cancelled) return
        // Emit version immediately so App can start loading items in parallel
        setState(s => ({ ...s, version }))
        const data = await fetchAllChampions(version)
        if (cancelled) return
        const champions = Object.values(data).sort((a, b) =>
          a.name.localeCompare(b.name)
        )
        setState({ champions, version, loading: false, error: null })
      } catch (err) {
        if (!cancelled) {
          setState(s => ({ ...s, loading: false, error: err }))
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return state
}
