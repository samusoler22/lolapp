import { useState } from 'react'
import MatchCard from '../MatchCard/MatchCard.jsx'
import styles from './ProMatchList.module.css'

const ROLE_ORDER = ['Top', 'Jungle', 'Mid', 'Bot', 'Support']
const ROLE_ABBR  = { Top: 'TOP', Jungle: 'JGL', Mid: 'MID', Bot: 'BOT', Support: 'SUP' }

/**
 * @param {{
 *   matches: object[],
 *   loading: boolean,
 *   error: Error|null,
 *   version: string,
 *   itemIndex: Map
 * }} props
 */
export default function ProMatchList({ matches, loading, error, version, itemIndex }) {
  const [activeRole, setActiveRole] = useState('All')

  // Detect which roles exist in the data, preserving canonical order
  const availableRoles = ROLE_ORDER.filter(r => matches.some(m => m.role === r))

  // Filtered list: for a specific role show last 5; for 'All' show last 5 overall
  const filtered = activeRole === 'All'
    ? matches.slice(0, 5)
    : matches.filter(m => m.role === activeRole).slice(0, 5)

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Pro Player Matches</h2>

      {/* Role filter buttons — only shown when data is loaded */}
      {!loading && !error && availableRoles.length > 0 && (
        <div className={styles.roleFilters}>
          <button
            className={`${styles.roleBtn} ${activeRole === 'All' ? styles.roleBtnActive : ''}`}
            onClick={() => setActiveRole('All')}
          >
            All
          </button>
          {availableRoles.map(role => (
            <button
              key={role}
              className={`${styles.roleBtn} ${activeRole === role ? styles.roleBtnActive : ''}`}
              onClick={() => setActiveRole(role)}
            >
              {ROLE_ABBR[role] ?? role}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className={styles.skeletons}>
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className={styles.skeletonCard} />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className={styles.errorMsg}>
          <span>⚠</span>
          <span>
            Could not load pro matches.
          <br />
          <small style={{ opacity: 0.6, fontSize: '0.75em' }}>{error.message}</small>
          </span>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className={styles.empty}>
          {activeRole === 'All'
            ? 'No recent pro matches found for this champion.'
            : `No recent pro matches found for ${ROLE_ABBR[activeRole] ?? activeRole}.`}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className={styles.list}>
          {filtered.map((match, i) => (
            <MatchCard
              key={`${match.playerName}-${match.date}-${i}`}
              match={match}
              version={version}
              itemIndex={itemIndex}
              index={i}
            />
          ))}
        </div>
      )}
    </section>
  )
}
