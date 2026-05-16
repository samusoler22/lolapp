import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ChampionIcon from '../ChampionIcon/ChampionIcon.jsx'
import { getChampionIconUrl } from '../../services/dataDragon.js'
import styles from './ChampionGrid.module.css'

const ALL_TAGS = ['Fighter', 'Tank', 'Mage', 'Assassin', 'Marksman', 'Support']

// Outer wrapper — fades the whole grid in/out when navigating to a champion
const gridVariants = {
  visible: { opacity: 1, scale: 1,    transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } },
  hidden:  { opacity: 0, scale: 0.98 },
  exit:    { opacity: 0, scale: 0.98, transition: { duration: 0.2,  ease: [0.55, 0, 1, 0.45] } },
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
  const [gridReady, setGridReady] = useState(false)
  const [loadedCount, setLoadedCount] = useState(0)

  const filtered = useMemo(() => {
    return champions.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase())
      const matchesTag = !activeTag || c.tags.includes(activeTag)
      return matchesSearch && matchesTag
    })
  }, [champions, search, activeTag])

  // Preload all champion icon images before revealing the grid
  useEffect(() => {
    if (!champions.length || !version) return

    setGridReady(false)
    setLoadedCount(0)

    let cancelled = false
    let done = 0
    const total = champions.length
    // Update progress roughly every 10% to limit re-renders
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
    <motion.div
      className={styles.wrapper}
      variants={gridVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.titleAccent}>League</span> of Legends
        </h1>
        <p className={styles.subtitle}>Select a Champion</p>
      </div>

      {/* Controls — always visible */}
      <div className={styles.controls}>
        <div className={styles.searchWrapper}>
          <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search champion..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search champions"
          />
          {search && (
            <button
              className={styles.clearBtn}
              onClick={() => setSearch('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <div className={styles.tagFilters} role="group" aria-label="Filter by role">
          <button
            className={`${styles.tagBtn} ${!activeTag ? styles.tagActive : ''}`}
            onClick={() => setActiveTag(null)}
          >
            All
          </button>
          {ALL_TAGS.map(tag => (
            <button
              key={tag}
              className={`${styles.tagBtn} ${activeTag === tag ? styles.tagActive : ''}`}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!gridReady ? (
          /* ── Skeleton loading state ──────────────────────── */
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
                  className={styles.skeletonIcon}
                  style={{ animationDelay: `${(i % 16) * 0.05}s` }}
                />
              ))}
            </div>
          </motion.div>

        ) : (
          /* ── Real grid — all icons appear at once ────────── */
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <p className={styles.count}>
              {filtered.length} champion{filtered.length !== 1 ? 's' : ''}
            </p>

            {/* motion.div propagates "hidden"→"visible" to ChampionIcon without stagger */}
            <motion.div
              className={styles.grid}
              initial="hidden"
              animate="visible"
              variants={{ hidden: {}, visible: {} }}
            >
              {filtered.map(champion => (
                <ChampionIcon
                  key={champion.id}
                  champion={champion}
                  version={version}
                  onClick={() => onSelectChampion(champion.id, champion.name)}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
