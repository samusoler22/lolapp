import { useEffect, useRef } from 'react'
import { getChampionIconUrl } from '../../services/dataDragon.js'
import styles from './WinRateBar.module.css'

function getTier(rate) {
  if (rate >= 54) return { label: 'Strong Pick', color: '#5fb47b' }
  if (rate >= 52) return { label: 'Good Pick',   color: '#7cc792' }
  if (rate >= 50) return { label: 'Balanced',    color: '#e8c47a' }
  if (rate >= 48) return { label: 'Below Avg',   color: '#d99a6d' }
  return             { label: 'Weak Pick',     color: '#d97777' }
}

/**
 * @param {{
 *   rate: number|null,
 *   isEstimate: boolean,
 *   loading: boolean,
 *   best: string[],
 *   worst: string[],
 *   version: string
 * }} props
 */
export default function WinRateBar({ rate, isEstimate, loading, best = [], worst = [], version }) {
  const fillRef = useRef(null)

  // Animate the bar fill on mount / rate change
  useEffect(() => {
    if (rate == null || !fillRef.current) return
    const el = fillRef.current
    el.style.width = '0%'
    const id = requestAnimationFrame(() => {
      // Map 40–60 range onto 0–100% so movement is visible
      const clamped = Math.min(Math.max(rate, 40), 60)
      const pct = ((clamped - 40) / 20) * 100
      el.style.width = `${pct}%`
    })
    return () => cancelAnimationFrame(id)
  }, [rate])

  if (loading || rate == null) {
    return (
      <div className={styles.card}>
        <div className={styles.skeleton}>
          <div className={styles.skeletonBig} />
          <div className={styles.skeletonBar} />
        </div>
      </div>
    )
  }

  const tier  = getTier(rate)
  const delta = rate - 50
  const up    = delta >= 0
  const deltaColor = up ? 'var(--color-win)' : 'var(--color-loss)'

  const hasMatchups = best.length > 0 || worst.length > 0

  return (
    <div
      className={styles.card}
      style={{ '--tier-color': tier.color, '--delta-color': deltaColor }}
    >
      {/* Left: numeric + bar */}
      <div className={styles.statsCol}>
        <div className={styles.bigWrap}>
          <span className={styles.big} style={{ color: tier.color }}>
            {rate.toFixed(1)}<span className={styles.bigPct}>%</span>
          </span>
        </div>

        <span className={styles.tierBadge} style={{ borderColor: tier.color, color: tier.color }}>
          <span className={styles.tierDot} style={{ background: tier.color }} />
          {tier.label}
        </span>

        <div className={styles.delta} style={{ color: deltaColor }}>
          {up ? (
            <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
              <polygon points="6,1 11,11 1,11" />
            </svg>
          ) : (
            <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
              <polygon points="6,11 11,1 1,1" />
            </svg>
          )}
          <span>{up ? '+' : '−'}{Math.abs(delta).toFixed(1)} pts vs 50% baseline</span>
        </div>

        <div className={styles.bar}>
          <div className={styles.barFill} ref={fillRef} style={{ background: tier.color }} />
          <div className={styles.barMark} />
        </div>
        <div className={styles.barRange}>
          <span>40%</span>
          <span>60%</span>
        </div>

        {isEstimate && (
          <p className={styles.estimateNote}>* Estimated — live data unavailable.</p>
        )}
      </div>

      {/* Right: matchup icons */}
      {hasMatchups && (
        <div className={styles.matchupsCol}>
          {best.length > 0 && (
            <div className={styles.matchupGroup}>
              <div className={styles.matchupHead}>
                <span className={styles.matchupLabel} style={{ color: 'var(--color-win)' }}>
                  <svg width="9" height="9" viewBox="0 0 12 12" fill="currentColor"><polygon points="6,1 11,11 1,11"/></svg>
                  Best into
                </span>
                <span className={styles.matchupCount}>{best.length} matchups</span>
              </div>
              <div className={styles.matchupIcons}>
                {best.map(id => (
                  <img
                    key={id}
                    src={getChampionIconUrl(version, `${id}.png`)}
                    alt={id}
                    title={id}
                    className={styles.matchupIcon}
                    draggable={false}
                  />
                ))}
              </div>
            </div>
          )}

          {worst.length > 0 && (
            <div className={styles.matchupGroup}>
              <div className={styles.matchupHead}>
                <span className={styles.matchupLabel} style={{ color: 'var(--color-loss)' }}>
                  <svg width="9" height="9" viewBox="0 0 12 12" fill="currentColor"><polygon points="6,11 11,1 1,1"/></svg>
                  Weak vs
                </span>
                <span className={styles.matchupCount}>{worst.length} matchups</span>
              </div>
              <div className={styles.matchupIcons}>
                {worst.map(id => (
                  <img
                    key={id}
                    src={getChampionIconUrl(version, `${id}.png`)}
                    alt={id}
                    title={id}
                    className={styles.matchupIcon}
                    draggable={false}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
