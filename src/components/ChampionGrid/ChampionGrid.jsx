import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ChampionIcon from '../ChampionIcon/ChampionIcon.jsx'
import { getChampionIconUrl } from '../../services/dataDragon.js'
import styles from './ChampionGrid.module.css'

const ALL_TAGS = ['Fighter', 'Tank', 'Mage', 'Assassin', 'Marksman', 'Support']

const gridVariants = {
  visible: { opacity: 1, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } },
  hidden:  { opacity: 0 },
  exit:    { opacity: 0, transition: { duration: 0.2,  ease: [0.55, 0, 1, 0.45] } },
}

/**
 * @param {{
 *   champions: object[],
 *   version: string,
 *   onSelectChampion: (id: string) => void
 * }} props
 */
export default function ChampionGrid({ champions, version, onSelectChampion }) {
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState(null)
  const [sortBy, setSortBy] = useState('alpha')
  const [gridReady, setGridReady] = useState(false)
  const [loadedCount, setLoadedCount] = useState(0)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = champions.filter(c => {
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.title?.toLowerCase().includes(q)
      const matchesTag = !activeTag || c.tags.includes(activeTag)
      return matchesSearch && matchesTag
    })
    if (sortBy === 'alpha') {
      list = list.slice().sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortBy === 'role') {
      list = list.slice().sort(
        (a, b) => a.tags[0].localeCompare(b.tags[0]) || a.name.localeCompare(b.name)
      )
    }
    return list
  }, [champions, search, activeTag, sortBy])

  const tagCounts = useMemo(() => {
    const out = { All: champions.length }
    ALL_TAGS.forEach(t => { out[t] = champions.filter(c => c.tags.includes(t)).length })
    return out
  }, [champions])

  // Preload all champion icon images before revealing the grid
  useEffect(() => {
    if (!champions.length || !version) return

    setGridReady(false)
    setLoadedCount(0)

    let cancelled = false
    let done = 0
    const total = champions.length
    const step = Math.max(1, Math.floor(total / 10))

    champions.forEach(champion => {
      const img = new Image()
      img.onload = img.onerror = () => {
        done++
        if (!cancelled) {
          if (done % step === 0 || done >= total) setLoadedCount(done)
          if (done >= total) setGridReady(true)
        }
      }
      img.src = getChampionIconUrl(version, champion.image.full)
    })

    return () => { cancelled = true }
  }, [champions, version])

  const percent = champions.length > 0
    ? Math.round((loadedCount / champions.length) * 100)
    : 0

  return (
    <motion.main
      className={styles.wrapper}
      variants={gridVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* ── Editorial header ──────────────────────────── */}
      <div className={styles.header}>
        <p className={styles.eyebrow}>The champion library</p>
        <h1 className={styles.title}>
          Every <em>champion</em>,<br /> every matchup,<br /> every match.
        </h1>
        <p className={styles.sub}>
          Browse abilities, win rates and recent pro play for the full roster.
          Use search, role filters or sort to narrow things down.
        </p>
      </div>

      {/* ── Controls (search + sort) ─────────────────── */}
      <div className={styles.controls}>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by name or title…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search champions"
          />
          {search ? (
            <kbd
              className={`${styles.kbd} ${styles.kbdClear}`}
              onClick={() => setSearch('')}
              role="button"
              aria-label="Clear search"
            >
              Clear
            </kbd>
          ) : (
            <kbd className={styles.kbd}>⌘ K</kbd>
          )}
        </div>

        <div className={styles.sortWrap}>
          <select
            className={styles.sortSelect}
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            aria-label="Sort champions"
          >
            <option value="alpha">Sort · A → Z</option>
            <option value="role">Sort · by role</option>
          </select>
        </div>
      </div>

      {/* ── Role tabs ────────────────────────────────── */}
      <nav className={styles.tags} role="group" aria-label="Filter by role">
        <button
          className={`${styles.tagBtn} ${!activeTag ? styles.tagActive : ''}`}
          onClick={() => setActiveTag(null)}
        >
          All <span className={styles.tagCount}>{tagCounts.All}</span>
        </button>
        {ALL_TAGS.map(tag => (
          <button
            key={tag}
            className={`${styles.tagBtn} ${activeTag === tag ? styles.tagActive : ''}`}
            onClick={() => setActiveTag(activeTag === tag ? null : tag)}
          >
            {tag} <span className={styles.tagCount}>{tagCounts[tag]}</span>
          </button>
        ))}
      </nav>

      {/* ── Meta row ─────────────────────────────────── */}
      <div className={styles.metaRow}>
        <span>Showing {filtered.length} / {champions.length}</span>
        <span>{activeTag ?? 'All roles'}</span>
      </div>

      <AnimatePresence mode="wait">
        {!gridReady ? (
          /* ── Skeleton state ──────────────────────────── */
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className={styles.loadingInfo}>
              <span className={styles.loadingText}>Loading champions…</span>
              <div className={styles.progressBar}>
                <motion.div
                  className={styles.progressFill}
                  animate={{ width: `${percent}%` }}
                  transition={{ ease: 'easeOut', duration: 0.3 }}
                />
              </div>
              <span className={styles.progressCount}>{loadedCount} / {champions.length}</span>
            </div>

            <div className={styles.grid}>
              {filtered.map((_, i) => (
                <div
                  key={i}
                  className={styles.skeletonCard}
                  style={{ animationDelay: `${(i % 16) * 0.05}s` }}
                />
              ))}
            </div>
          </motion.div>

        ) : filtered.length === 0 ? (
          <div className={styles.empty}>No champions match your filters.</div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={styles.grid}
          >
            {filtered.map((champion, i) => (
              <ChampionIcon
                key={champion.id}
                champion={champion}
                version={version}
                index={i}
                onClick={() => onSelectChampion(champion.id, champion.name)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  )
}
