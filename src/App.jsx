import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useChampions } from './hooks/useChampions.js'
import { fetchAllItems } from './services/dataDragon.js'
import { buildItemIndex } from './utils/itemNormalizer.js'
import AppBar from './components/AppBar/AppBar.jsx'
import ChampionGrid from './components/ChampionGrid/ChampionGrid.jsx'
import ChampionDetail from './components/ChampionDetail/ChampionDetail.jsx'
import styles from './App.module.css'

export default function App() {
  const { champions, version, loading, error } = useChampions()
  const [selectedChampion, setSelectedChampion] = useState(null)
  const [itemIndex, setItemIndex] = useState(null)

  // Load item catalog once version is known
  useEffect(() => {
    if (!version) return
    fetchAllItems(version)
      .then(rawItems => setItemIndex(buildItemIndex(rawItems)))
      .catch(err => console.error('[App] Failed to load items:', err))
  }, [version])

  // Update page title
  useEffect(() => {
    document.title = selectedChampion
      ? `${selectedChampion.name} — League Codex`
      : 'League Codex'
  }, [selectedChampion])

  const handleSelectChampion = (id, name) => {
    const champ = champions.find(c => c.id === id)
    setSelectedChampion({ id, name, title: champ?.title, tags: champ?.tags })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBack = () => {
    setSelectedChampion(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className={styles.app}>
      {/* Sticky top bar — shows back button when a champion is selected */}
      <AppBar
        version={version}
        championCount={champions?.length}
        selectedName={selectedChampion?.name}
        onBack={selectedChampion ? handleBack : null}
      />

      {/* Loading state */}
      {loading && (
        <div className={styles.fullLoader}>
          <div className={styles.loaderInner}>
            <div className={styles.loaderSpinner} />
            <p className={styles.loaderText}>Loading champions</p>
            <div className={styles.loaderBar}>
              <div className={styles.loaderBarFill} />
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className={styles.errorState}>
          <p className={styles.errorTitle}>Failed to load</p>
          <p className={styles.errorMsg}>Could not connect to Riot Data Dragon API.</p>
          <button
            className={styles.retryBtn}
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      )}

      {/* Main app */}
      {!loading && !error && (
        <AnimatePresence mode="wait" initial={false}>
          {!selectedChampion ? (
            <ChampionGrid
              key="champion-grid"
              champions={champions}
              version={version}
              onSelectChampion={handleSelectChampion}
            />
          ) : (
            <ChampionDetail
              key={`detail-${selectedChampion.id}`}
              championId={selectedChampion.id}
              championName={selectedChampion.name}
              championTitle={selectedChampion.title}
              championTags={selectedChampion.tags}
              version={version}
              itemIndex={itemIndex || new Map()}
              onBack={handleBack}
            />
          )}
        </AnimatePresence>
      )}
    </div>
  )
}
