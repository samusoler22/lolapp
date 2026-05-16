import { motion } from 'framer-motion'
import ItemIcon from '../ItemIcon/ItemIcon.jsx'
import { getChampionIconUrl } from '../../services/dataDragon.js'
import styles from './MatchCard.module.css'

// Leaguepedia display names that don't map cleanly to Data Dragon IDs
const LEAGUEPEDIA_TO_DD = {
  'Wukong':         'MonkeyKing',
  'Nunu & Willump': 'Nunu',
  'Renata Glasc':   'Renata',
  "Cho'Gath":       'Chogath',
  "Kai'Sa":         'Kaisa',
  "Kha'Zix":        'Khazix',
  "Bel'Veth":       'Belveth',
}

function champNameToId(name) {
  if (!name) return null
  return LEAGUEPEDIA_TO_DD[name] ?? name.replace(/[^A-Za-z0-9]/g, '')
}

const cardVariants = {
  hidden:  { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 220, damping: 26 } },
}

const RESULT_LABELS = {
  win:    'Victory',
  loss:   'Defeat',
  remake: 'Remake',
}

const ROLE_ABBR = {
  Top: 'TOP', Jungle: 'JGL', Mid: 'MID', Bot: 'BOT', Support: 'SUP',
}

function formatDate(dateStr) {
  if (!dateStr) return 'Unknown date'
  const d = new Date(dateStr.replace(' ', 'T') + 'Z')
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

/**
 * Handles both MM:SS strings and decimal-minutes floats from Leaguepedia.
 */
function formatDuration(raw) {
  if (!raw) return ''
  const s = String(raw).trim()
  if (/^\d+:\d{2}$/.test(s)) return s
  const mins = parseFloat(s)
  if (isNaN(mins) || mins <= 0) return ''
  const m = Math.floor(mins)
  const sec = Math.round((mins - m) * 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

function cleanPlayerName(link) {
  if (!link) return 'Unknown'
  return String(link).replace(/\s*\([^)]*\)/g, '').trim() || 'Unknown'
}

/**
 * @param {{
 *   match: object,
 *   version: string,
 *   itemIndex: Map,
 *   index: number
 * }} props
 */
export default function MatchCard({ match, version, itemIndex, index }) {
  const { result, kills, deaths, assists, items, date, duration, tournament, playerName, team, role, opponentChampion } = match
  const playerDisplay = cleanPlayerName(playerName)
  const durationDisplay = formatDuration(duration)

  // Pad items to always show 6 slots
  const itemSlots = [...items.slice(0, 6), ...Array(Math.max(0, 6 - items.length)).fill(null)]

  return (
    <motion.div
      className={`${styles.card} ${styles[result]}`}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={index}
    >
      {/* Left: player info + meta */}
      <div className={styles.info}>
        <div className={styles.player}>
          <span className={`${styles.badge} ${styles[`badge_${result}`]}`}>
            {RESULT_LABELS[result]}
          </span>
          <span className={styles.playerName}>{playerDisplay}</span>
          {role && <span className={styles.roleBadge}>{ROLE_ABBR[role] ?? role}</span>}
          {team && <span className={styles.team}>{team}</span>}
        </div>
        <div className={styles.meta}>
          <span className={styles.date}>{formatDate(date)}</span>
          {durationDisplay && <span className={styles.duration}>{durationDisplay}</span>}
          {tournament && (
            <span className={styles.tournament} title={tournament}>
              {tournament.length > 30 ? tournament.slice(0, 28) + '…' : tournament}
            </span>
          )}
        </div>
      </div>

      {/* Opponent champion */}
      {opponentChampion && (() => {
        const ddId = champNameToId(opponentChampion)
        return ddId ? (
          <div className={styles.vsSection}>
            <span className={styles.vsLabel}>vs</span>
            <img
              src={getChampionIconUrl(version, `${ddId}.png`)}
              alt={opponentChampion}
              title={opponentChampion}
              className={styles.vsIcon}
              draggable={false}
              onError={e => { e.currentTarget.style.display = 'none' }}
            />
          </div>
        ) : null
      })()}

      {/* Center: K/D/A */}
      <div className={styles.kda}>
        <div className={styles.kdaScore}>
          <span className={styles.kills}>{kills}</span>
          <span className={styles.slash}>/</span>
          <span className={styles.deaths}>{deaths}</span>
          <span className={styles.slash}>/</span>
          <span className={styles.assists}>{assists}</span>
        </div>
        <div className={styles.kdaLabel}>K / D / A</div>
        {deaths > 0 && (
          <div className={styles.ratio}>
            {((kills + assists) / deaths).toFixed(1)} KDA
          </div>
        )}
      </div>

      {/* Right: items */}
      <div className={styles.items}>
        {itemSlots.map((itemName, i) =>
          itemName ? (
            <ItemIcon
              key={`${itemName}-${i}`}
              itemName={itemName}
              version={version}
              itemIndex={itemIndex}
            />
          ) : (
            <div key={`empty-${i}`} className={styles.emptySlot} />
          )
        )}
      </div>
    </motion.div>
  )
}
