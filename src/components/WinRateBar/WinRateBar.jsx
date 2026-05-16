import { getChampionIconUrl } from '../../services/dataDragon.js'
import styles from './WinRateBar.module.css'

function getTier(rate) {
  if (rate >= 54) return { label: 'STRONG PICK', color: '#2da05a' }
  if (rate >= 52) return { label: 'GOOD PICK',   color: '#4caf70' }
  if (rate >= 50) return { label: 'AVERAGE',      color: '#c8a84b' }
  if (rate >= 48) return { label: 'BELOW AVG',    color: '#e07842' }
  return             { label: 'WEAK PICK',     color: '#e05252' }
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
  const tier    = rate != null ? getTier(rate) : null
  const percent = rate != null ? `${rate.toFixed(1)}%` : '--'
  const delta   = rate != null ? rate - 50 : null
  const deltaUp = delta != null && delta >= 0

  const hasMatchups = best.length > 0 || worst.length > 0

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Win Rate</h2>

      <div
        className={styles.card}
        style={tier ? { '--tier-color': tier.color } : {}}
      >
        {loading ? (
          <div className={styles.skeleton}>
            <div className={styles.skeletonPercent} />
            <div className={styles.skeletonBadge} />
            <div className={styles.skeletonDelta} />
          </div>
        ) : (
          <>
            <div className={styles.ambientGlow} />

            <div className={styles.layout}>

              {/* ── Left: win rate stats ───────────────────────── */}
              <div className={styles.statsCol}>
                <div className={styles.statRow}>
                  <span
                    className={styles.bigPercent}
                    style={tier ? { color: tier.color } : {}}
                  >
                    {percent}
                  </span>

                  {tier && (
                    <span
                      className={styles.tierBadge}
                      style={{ borderColor: tier.color, color: tier.color }}
                    >
                      ◆ {tier.label}
                    </span>
                  )}
                </div>

                {delta != null && (
                  <div
                    className={styles.delta}
                    style={{ color: deltaUp ? '#4caf70' : '#e05252' }}
                  >
                    {deltaUp ? (
                      <svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
                        <polygon points="5,1 9,9 1,9" />
                      </svg>
                    ) : (
                      <svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
                        <polygon points="5,9 9,1 1,1" />
                      </svg>
                    )}
                    <span>
                      {deltaUp ? '+' : '−'}{Math.abs(delta).toFixed(1)}% {deltaUp ? 'above' : 'below'} average
                    </span>
                  </div>
                )}

                {isEstimate && (
                  <p className={styles.estimateNote}>
                    * Estimated — live data unavailable
                  </p>
                )}
              </div>

              {/* ── Right: matchup icons ────────────────────────── */}
              {hasMatchups && (
                <div className={styles.matchupsCol}>

                  {best.length > 0 && (
                    <div className={styles.matchupGroup}>
                      <span className={styles.matchupLabel} style={{ color: '#4caf70' }}>
                        <svg width="8" height="8" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
                          <polygon points="5,1 9,9 1,9" />
                        </svg>
                        Best into
                      </span>
                      <div className={styles.matchupIcons}>
                        {best.map(id => (
                          <img
                            key={id}
                            src={getChampionIconUrl(version, `${id}.png`)}
                            alt={id}
                            className={styles.matchupIcon}
                            title={id}
                            draggable={false}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {worst.length > 0 && (
                    <div className={styles.matchupGroup}>
                      <span className={styles.matchupLabel} style={{ color: '#e05252' }}>
                        <svg width="8" height="8" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
                          <polygon points="5,9 9,1 1,1" />
                        </svg>
                        Weak vs
                      </span>
                      <div className={styles.matchupIcons}>
                        {worst.map(id => (
                          <img
                            key={id}
                            src={getChampionIconUrl(version, `${id}.png`)}
                            alt={id}
                            className={styles.matchupIcon}
                            title={id}
                            draggable={false}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          </>
        )}
      </div>
    </section>
  )
}
