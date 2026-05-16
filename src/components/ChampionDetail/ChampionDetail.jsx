import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { useRef, useState, useEffect, lazy, Suspense } from 'react'
import { useChampionDetail } from '../../hooks/useChampionDetail.js'
import { useWinRate } from '../../hooks/useWinRate.js'
import { useMatchups } from '../../hooks/useMatchups.js'
import { useProMatches } from '../../hooks/useProMatches.js'
import {
  getChampionSkinSplashUrl,
  getChampionSkinLoadingUrl,
  getChampionSkinTileUrl,
} from '../../services/dataDragon.js'
import AbilityPanel from '../AbilityPanel/AbilityPanel.jsx'
import WinRateBar from '../WinRateBar/WinRateBar.jsx'
import ChampionLore from '../ChampionLore/ChampionLore.jsx'
import ProMatchList from '../ProMatchList/ProMatchList.jsx'
const ChampionModel = lazy(() => import('../ChampionModel/ChampionModel.jsx'))
import styles from './ChampionDetail.module.css'

const detailVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: -10, transition: { duration: 0.22, ease: [0.55, 0, 1, 0.45] } },
}

const contentVariants = {
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
}

const contentItemVariants = {
  hidden:  { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
}

/**
 * @param {{
 *   championId: string,
 *   version: string,
 *   itemIndex: Map,
 *   onBack: () => void
 * }} props
 */
export default function ChampionDetail({ championId, championName, championTitle, championTags, version, itemIndex, onBack }) {
  const { data, loading: detailLoading } = useChampionDetail(championId, version)
  const { rate, isEstimate, loading: winRateLoading } = useWinRate(championId, version)
  const { best, worst } = useMatchups(championId, version)
  const { matches, loading: matchesLoading, error: matchesError } = useProMatches(
    championName || data?.name || championId
  )

  // Active skin state (skin.num, not array index)
  const [activeSkinNum, setActiveSkinNum] = useState(0)
  const skins = data?.skins ?? []

  const activeSkin = skins.find(s => s.num === activeSkinNum)
  const skinDisplayName = activeSkinNum === 0
    ? (data?.name ?? championName)
    : (activeSkin?.name ?? '')

  // Parallax for splash image
  const splashRef = useRef(null)
  const { scrollY } = useScroll()
  const splashY = useTransform(scrollY, [0, 500], [0, -90])

  // Blurred background that materializes as the banner scrolls away
  const bgOpacity = useTransform(scrollY, [80, 420],  [0, 1])

  const splashUrl = getChampionSkinSplashUrl(championId, activeSkinNum)
  const portraitUrl = getChampionSkinLoadingUrl(championId, activeSkinNum)

  const allLoading = detailLoading || winRateLoading || matchesLoading

  return (
    <>
    {/* Fixed blurred background — sits behind content, fades in as banner scrolls away */}
    <motion.div
      className={styles.fixedBg}
      style={{ opacity: bgOpacity }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
    >
      <img
        src={splashUrl}
        className={styles.fixedBgImg}
        draggable={false}
        alt=""
      />
      <div className={styles.fixedBgOverlay} />
    </motion.div>

    {/* Back button — outside the motion wrapper so position:fixed isn't broken
        by the wrapper's transform animation */}
    <motion.button
      className={styles.backBtn}
      onClick={onBack}
      whileHover={{ x: -3 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.backIcon}>
        <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      All Champions
    </motion.button>

    <motion.div
      className={styles.wrapper}
      variants={detailVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >

      {/* Hero section: splash as blurred bg + loading art portrait (always shows champion) */}
      <motion.div
        className={styles.heroSection}
        ref={splashRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.05 }}
      >
        {/* Background: splash art — blurred + darkened, parallax */}
        <div className={styles.heroBgWrapper}>
          <motion.img
            src={splashUrl}
            aria-hidden="true"
            className={styles.heroBg}
            style={{ y: splashY }}
            onError={e => { e.currentTarget.style.display = 'none' }}
            loading="eager"
            draggable={false}
          />
        </div>
        <div className={styles.heroGradient} />

        {/* Foreground: 3-column grid — info | 3D model + skins | portrait */}
        <div className={styles.heroContent}>

          {/* Column 1: Name, title, tags — uses grid data instantly, replaced by full data when ready */}
          <div className={styles.heroInfo}>
            <h1 className={styles.championName}>{data?.name ?? championName}</h1>
            {(data?.title ?? championTitle) && (
              <p className={styles.championTitle}>{data?.title ?? championTitle}</p>
            )}
            <div className={styles.tags}>
              {(data?.tags ?? championTags)?.map(tag => (
                <span key={tag} className={styles.tag}>{tag}</span>
              ))}
            </div>
          </div>

          {/* Column 2 (wider): 3D model + chroma dots + skin selector */}
          <div className={styles.heroCenter}>
            {data && (
              <Suspense fallback={null}>
                <ChampionModel
                  championId={championId}
                  championKey={data.key}
                  skinNum={activeSkinNum}
                  skinName={skins.find(s => s.num === activeSkinNum)?.name}
                  hero
                />
              </Suspense>
            )}
            {skins.length > 1 && (
              <div className={styles.skinSelector}>
                {skins.map(skin => (
                  <button
                    key={skin.num}
                    className={`${styles.skinTile} ${activeSkinNum === skin.num ? styles.skinTileActive : ''}`}
                    onClick={() => setActiveSkinNum(skin.num)}
                    title={skin.name}
                  >
                    <img
                      src={getChampionSkinTileUrl(championId, skin.num)}
                      alt={skin.name}
                      loading="lazy"
                      draggable={false}
                      crossOrigin="anonymous"
                      onError={e => {
                        // Never remove crossOrigin — keeping CORS mode prevents ORB warnings.
                        // If the server returns HTML for a missing asset, the CORS error fires
                        // cleanly and we advance to the next fallback without browser warnings.
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
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Column 3: Loading art portrait + skin name below */}
          <div className={styles.portraitColumn}>
            <AnimatePresence mode="wait">
              <motion.img
                key={activeSkinNum}
                src={portraitUrl}
                alt={data?.name || championId}
                className={styles.heroPortrait}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                loading="eager"
                draggable={false}
                onError={e => {
                  const el = e.currentTarget
                  if (!el.dataset.f1) {
                    // Loading art failed → fall back to splash art
                    el.dataset.f1 = '1'
                    el.style.objectFit = 'cover'
                    el.style.objectPosition = 'center 20%'
                    el.src = getChampionSkinSplashUrl(championId, activeSkinNum)
                  } else {
                    el.onerror = null
                    el.style.display = 'none'
                  }
                }}
              />
            </AnimatePresence>
            <AnimatePresence mode="wait">
              <motion.p
                key={activeSkinNum}
                className={styles.skinName}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {skinDisplayName}
              </motion.p>
            </AnimatePresence>
          </div>

        </div>
      </motion.div>

      {/* Content area */}
      <div className={styles.content}>
        <AnimatePresence mode="wait">

          {allLoading ? (
            <motion.div
              key="skeleton"
              className={styles.unifiedLoader}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {/* Abilities skeleton */}
              <div className={styles.skSection}>
                <div className={styles.skTitle}>Abilities</div>
                <div className={styles.skIconRow}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className={styles.skCircle} />
                  ))}
                </div>
                <div className={`${styles.skBlock} ${styles.skAbilityBody}`} />
              </div>

              {/* Win Rate skeleton */}
              <div className={styles.skSection}>
                <div className={styles.skTitle}>Win Rate</div>
                <div className={`${styles.skBlock} ${styles.skWinRate}`} />
              </div>

              {/* Lore skeleton */}
              <div className={styles.skSection}>
                <div className={styles.skTitle}>Lore</div>
                <div className={styles.skLines}>
                  {[100, 93, 87, 62].map((w, i) => (
                    <div key={i} className={styles.skBlock} style={{ height: '13px', width: `${w}%` }} />
                  ))}
                </div>
              </div>

              {/* Pro Matches skeleton */}
              <div className={styles.skSection}>
                <div className={styles.skTitle}>Pro Player Matches</div>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={`${styles.skBlock} ${styles.skCard}`} />
                ))}
              </div>
            </motion.div>

          ) : data ? (
            <motion.div
              key="content"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={contentItemVariants}>
                <AbilityPanel
                  passive={data.passive}
                  spells={data.spells}
                  version={version}
                />
              </motion.div>

              <motion.div variants={contentItemVariants}>
                <WinRateBar
                  rate={rate}
                  isEstimate={isEstimate}
                  loading={false}
                  best={best}
                  worst={worst}
                  version={version}
                />
              </motion.div>

              <motion.div variants={contentItemVariants}>
                <ChampionLore
                  lore={data.lore}
                  allytips={data.allytips}
                  enemytips={data.enemytips}
                />
              </motion.div>

              <motion.div variants={contentItemVariants}>
                <ProMatchList
                  matches={matches}
                  loading={false}
                  error={matchesError}
                  version={version}
                  itemIndex={itemIndex}
                />
              </motion.div>
            </motion.div>
          ) : null}

        </AnimatePresence>
      </div>
    </motion.div>
    </>
  )
}
