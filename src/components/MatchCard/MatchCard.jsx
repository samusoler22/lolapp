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

const rowVariants = {
  hidden:  { opacity: 0, y: 8 },
  visible: i => ({
    opacity: 1,
    y: 0,
    transition: { type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 0.35, delay: Math.min(i * 0.05, 0.3) },
  }),
}

const RESULT_LABELS = {
  win:    'Win',
  loss:   'Loss',
  remake: 'Remake',
}

const ROLE_ABBR = {
  Top: 'TOP', Jungle: 'JGL', Mid: 'MID', Bot: 'BOT', Support: 'SUP',
}

function formatDate(dateStr) {
  if (!dateStr) return 'Unknown date'
  const d = new Date(dateStr.replace(' ', 'T') + 'Z')
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

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
 * Table row representation of a pro match. Slots in as a grid row inside
 * ProMatchList's <pm-table> container.
 *
 * @param {{
 *   match: object,
 *   version: string,
 *   itemIndex: Map,
 *   index: number
 * }} props
 */
export default function MatchCard({ match, version, itemIndex, index }) {
  const {
    result, kills, deaths, assists, items,
    date, duration, tournament,
    playerName, team, role, opponentChampion,
  } = match
  const playerDisplay = cleanPlayerName(playerName)
  const durationDisplay = formatDuration(duration)
  const itemSlots = [...items.slice(0, 6), ...Array(Math.max(0, 6 - items.length)).fill(null)]
  const oppId = opponentChampion ? champNameToId(opponentChampion) : null

  return (
    <motion.div
      className={styles.row}
      variants={rowVariants}
      initial="hidden"
      animate="visible"
      custom={index}
    >
      {/* Col 1 — Result */}
      <div className={`${styles.result} ${styles[result]}`}>
        <span className={styles.resultBar} />
        {RESULT_LABELS[result]}
      </div>

      {/* Col 2 — Player */}
      <div className={styles.player}>
        <div className={styles.playerHead}>
          <span className={styles.playerName}>{playerDisplay}</span>
          {role && <span className={styles.rolePill}>{ROLE_ABBR[role] ?? role}</span>}
          {team && <span className={styles.team}>{team}</span>}
        </div>
        <span className={styles.playerMeta}>
          {formatDate(date)}
          {durationDisplay && <> · {durationDisplay}</>}
          {tournament && <> · {tournament.length > 30 ? tournament.slice(0, 28) + '…' : tournament}</>}
        </span>
      </div>

      {/* Col 3 — Opponent */}
      <div className={styles.vs}>
        <span className={styles.vsLabel}>vs</span>
        {oppId && (
          <img
            src={getChampionIconUrl(version, `${oppId}.png`)}
            alt={opponentChampion}
            title={opponentChampion}
            className={styles.vsIcon}
            draggable={false}
            onError={e => { e.currentTarget.style.display = 'none' }}
          />
        )}
      </div>

      {/* Col 4 — KDA */}
      <div className={styles.kda}>
        <span className={styles.k}>{kills}</span>
        <span className={styles.sep}>/</span>
        <span className={styles.d}>{deaths}</span>
        <span className={styles.sep}>/</span>
        <span className={styles.a}>{assists}</span>
        {deaths > 0 && (
          <span className={styles.kdaRatio}>
            {((kills + assists) / deaths).toFixed(2)}
          </span>
        )}
      </div>

      {/* Col 5 — Items */}
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
