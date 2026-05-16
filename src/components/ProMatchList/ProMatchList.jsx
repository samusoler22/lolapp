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

  const availableRoles = ROLE_ORDER.filter(r => matches?.some(m => m.role === r))

  const filtered = !matches
    ? []
    : activeRole === 'All'
      ? matches.slice(0, 6)
      : matches.filter(m => m.role === activeRole).slice(0, 6)

  return (
    <>
      {/* Controls */}
      {!loading && !error && availableRoles.length > 0 && (
        <div className={styles.controls}>
          <div className={styles.roleTabs}>
            <button
              className={`${styles.roleTab} ${activeRole === 'All' ? styles.roleTabActive : ''}`}
              onClick={() => setActiveRole('All')}
            >
              All
            </button>
            {availableRoles.map(role => (
              <button
                key={role}
                className={`${styles.roleTab} ${activeRole === role ? styles.roleTabActive : ''}`}
                onClick={() => setActiveRole(role)}
              >
                {ROLE_ABBR[role] ?? role}
              </button>
            ))}
          </div>
          <span className={styles.count}>
            {filtered.length} of {matches.length} matches
          </span>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className={styles.table}>
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className={styles.skeletonRow} />
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className={styles.errorMsg}>
          <span>⚠</span>
          <span>
            Could not load pro matches.
            <br />
            <small style={{ opacity: 0.6, fontSize: '0.78em' }}>{error.message}</small>
          </span>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filtered.length === 0 && (
        <div className={styles.empty}>
          {activeRole === 'All'
            ? 'No recent pro matches found for this champion.'
            : `No recent pro matches found for ${ROLE_ABBR[activeRole] ?? activeRole}.`}
        </div>
      )}

      {/* Table */}
      {!loading && !error && filtered.length > 0 && (
        <div className={styles.table}>
          <div className={styles.header}>
            <span>Result</span>
            <span>Player</span>
            <span>Opponent</span>
            <span>KDA</span>
            <span>Items</span>
          </div>
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
    </>
  )
}
