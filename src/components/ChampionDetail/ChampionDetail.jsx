import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, lazy, Suspense } from 'react'
import { useChampionDetail } from '../../hooks/useChampionDetail.js'
import { useWinRate } from '../../hooks/useWinRate.js'
import { useMatchups } from '../../hooks/useMatchups.js'
import { useProMatches } from '../../hooks/useProMatches.js'
import {
  getChampionSkinSplashUrl,
  getChampionSkinLoadingUrl,
  getChampionSkinTileUrl,
} from '../../services/dataDragon.js'
import Section from '../Section/Section.jsx'
import AbilityPanel from '../AbilityPanel/AbilityPanel.jsx'
import WinRateBar from '../WinRateBar/WinRateBar.jsx'
import ChampionLore from '../ChampionLore/ChampionLore.jsx'
import ProMatchList from '../ProMatchList/ProMatchList.jsx'
const ChampionModel = lazy(() => import('../ChampionModel/ChampionModel.jsx'))
import styles from './ChampionDetail.module.css'

const detailVariants = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0,  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.22, ease: [0.55, 0, 1, 0.45] } },
}

const fadeVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit:    { opacity: 0, transition: { duration: 0.18 } },
}

/**
 * @param {{
 *   championId: string,
 *   championName?: string,
 *   championTitle?: string,
 *   championTags?: string[],
 *   version: string,
 *   itemIndex: Map,
 *   onBack: () => void
 * }} props
 */
export default function ChampionDetail({
  championId, championName, championTitle, championTags,
  version, itemIndex, onBack,
}) {
  const { data, loading: detailLoading } = useChampionDetail(championId, version)
  const { rate, isEstimate, loading: winRateLoading } = useWinRate(championId, version)
  const { best, worst } = useMatchups(championId, version)
  const { matches, loading: matchesLoading, error: matchesError } = useProMatches(
    championName || data?.name || championId
  )

  // Active skin
  const [activeSkinNum, setActiveSkinNum] = useState(0)
  const skins = data?.skins ?? []
  useEffect(() => { setActiveSkinNum(0) }, [championId])

  const skinDisplayName = activeSkinNum === 0
    ? (data?.name ?? championName)
    : (skins.find(s => s.num === activeSkinNum)?.name ?? '')

  const splashUrl = getChampionSkinSplashUrl(championId, activeSkinNum)
  const portraitUrl = getChampionSkinLoadingUrl(championId, activeSkinNum)

  const winCount = matches?.filter(m => m.result === 'win').length ?? 0
  const recentN  = matches?.length ?? 0

  return (
    <motion.article
      className={styles.wrapper}
      variants={detailVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* ── HERO ───────────────────────────────────────── */}
      <header className={styles.hero}>
        <div className={styles.heroArt}>
          <motion.img
            key={`splash-${activeSkinNum}`}
            src={splashUrl}
            alt=""
            className={styles.heroSplash}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            onError={e => { e.currentTarget.style.display = 'none' }}
            draggable={false}
          />
        </div>
        <div className={styles.heroVeil} />

        <div className={styles.heroInner}>
          {/* Left column: name, title, tags, quick stats */}
          <div className={styles.heroText}>
            <p className={styles.eyebrow}>
              Champion · {(data?.tags ?? championTags)?.[0] ?? '—'}
            </p>
            <h1 className={styles.championName}>{data?.name ?? championName}</h1>
            <p className={styles.championTitle}>{data?.title ?? championTitle ?? ''}</p>

            <div className={styles.tagsRow}>
              {(data?.tags ?? championTags)?.map(tag => (
                <span key={tag} className={styles.tag}>{tag}</span>
              ))}
            </div>

            <div className={styles.quickStats}>
              <Stat label="Win rate"   value={rate != null ? rate.toFixed(1) : '—'} unit="%" />
              <Stat label="Skins"      value={data ? data.skins.length : '—'} />
              <Stat
                label="Recent record"
                value={recentN ? `${winCount}` : '—'}
                unit={recentN ? `W / ${recentN - winCount}L` : null}
              />
              <Stat label="Patch"      value={version || '—'} mono />
            </div>
          </div>

          {/* Right column: portrait card — uses the 3D model viewer if available */}
          <div className={styles.heroPortrait} key={`portrait-${championId}-${activeSkinNum}`}>
            {data ? (
              <Suspense fallback={<PortraitFallback url={portraitUrl} championId={championId} activeSkinNum={activeSkinNum} />}>
                <ChampionModel
                  championId={championId}
                  championKey={data.key}
                  skinNum={activeSkinNum}
                  skinName={skins.find(s => s.num === activeSkinNum)?.name}
                  hero
                />
              </Suspense>
            ) : (
              <PortraitFallback url={portraitUrl} championId={championId} activeSkinNum={activeSkinNum} />
            )}
            <div className={styles.portraitTag}>
              <span>
                {activeSkinNum === 0 ? 'Base · No. ' : 'Skin · No. '}
                <span className={styles.portraitNum}>{String(activeSkinNum).padStart(2, '0')}</span>
              </span>
              <span>{skinDisplayName}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── BODY ───────────────────────────────────────── */}
      <div className={styles.body}>
        <AnimatePresence mode="wait">
          {detailLoading || !data ? (
            <motion.div
              key="loader"
              variants={fadeVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={styles.loader}
            >
              <div className={styles.loaderSpinner} />
              <span>Loading champion…</span>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              variants={fadeVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={styles.sections}
            >
              {/* Section 01 — Skins */}
              {skins.length > 1 && (
                <Section
                  num="01"
                  title="Skins"
                  blurb="Pick a skin to switch the splash and portrait above."
                >
                  <div className={styles.skinsRow}>
                    {skins.map(skin => (
                      <button
                        key={skin.num}
                        className={`${styles.skinCard} ${activeSkinNum === skin.num ? styles.skinCardActive : ''}`}
                        onClick={() => setActiveSkinNum(skin.num)}
                        title={skin.name}
                      >
                        <div className={styles.skinArt}>
                          <img
                            src={getChampionSkinTileUrl(championId, skin.num)}
                            alt={skin.name}
                            loading="lazy"
                            draggable={false}
                            crossOrigin="anonymous"
                            onError={e => {
                              // Keep crossOrigin to prevent ORB warnings
                              const el = e.currentTarget
                              if (!el.dataset.f1) {
                                el.dataset.f1 = '1'
                                el.src = getChampionSkinLoadingUrl(championId, skin.num)
                              } else if (!el.dataset.f2) {
                                el.dataset.f2 = '1'
                                el.src = getChampionSkinSplashUrl(championId, skin.num)
                              } else {
                                el.onerror = null
                              }
                            }}
                          />
                        </div>
                        <div className={styles.skinMeta}>
                          <span className={styles.skinName}>
                            {skin.num === 0 ? `${data.name} (Base)` : skin.name}
                          </span>
                          <span className={styles.skinNum}>SKIN {String(skin.num).padStart(2, '0')}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </Section>
              )}

              {/* Section 02 — Abilities */}
              <Section
                num="02"
                title="Abilities"
                blurb="The kit, in five lines. Tap any ability to read the full description."
              >
                <AbilityPanel
                  passive={data.passive}
                  spells={data.spells}
                  version={version}
                />
              </Section>

              {/* Section 03 — Win rate */}
              <Section
                num="03"
                title="Win rate"
                blurb="Live pull from the ranked data feed, with best & worst matchups against the current meta."
              >
                <WinRateBar
                  rate={rate}
                  isEstimate={isEstimate}
                  loading={winRateLoading}
                  best={best}
                  worst={worst}
                  version={version}
                />
              </Section>

              {/* Section 04 — Lore */}
              <Section
                num="04"
                title="Lore"
                blurb="A short passage from the official biography, plus playing tips from both sides of the fight."
              >
                <ChampionLore
                  lore={data.lore}
                  allytips={data.allytips}
                  enemytips={data.enemytips}
                />
              </Section>

              {/* Section 05 — Pro Matches */}
              <Section
                num="05"
                title="Pro player matches"
                blurb="Recent results from professional play. Filter by role to see how this champion performs across the map."
              >
                <ProMatchList
                  matches={matches}
                  loading={matchesLoading}
                  error={matchesError}
                  version={version}
                  itemIndex={itemIndex}
                />
              </Section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  )
}

/* ── Inline helpers ─────────────────────────────────────────────── */

function Stat({ label, value, unit, mono }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <span className={`${styles.statValue} ${mono ? styles.statValueMono : ''}`}>
        {value}
        {unit ? <span className={styles.statUnit}>{unit}</span> : null}
      </span>
    </div>
  )
}

function PortraitFallback({ url, championId, activeSkinNum }) {
  return (
    <img
      src={url}
      alt=""
      className={styles.portraitImg}
      draggable={false}
      onError={e => {
        const el = e.currentTarget
        if (!el.dataset.f1) {
          el.dataset.f1 = '1'
          el.style.objectPosition = 'center 20%'
          el.src = getChampionSkinSplashUrl(championId, activeSkinNum)
        } else {
          el.onerror = null
          el.style.display = 'none'
        }
      }}
    />
  )
}
