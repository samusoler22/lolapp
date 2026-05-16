import { useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { lookupItem } from '../../utils/itemNormalizer.js'
import { getItemIconUrl } from '../../services/dataDragon.js'
import { stripHtml } from '../../utils/htmlStripper.js'
import styles from './ItemIcon.module.css'

// ── Stat definitions: key → { label, color, isPct } ──────────────────────────
// Colors by stat category matching user palette:
//   Red    → health / lifesteal / omnivamp
//   Purple → Ability Power
//   Orange → Attack Damage / Attack Speed
//   DkBlue → Mana / Mana Regen
//   LtBlue → Magic Resist
//   Yellow → Armor / Crit
//   Green  → Move Speed
//   Teal   → Ability Haste
const STAT_MAP = {
  FlatPhysicalDamageMod:   { label: 'Attack Damage',  color: '#fb923c', isPct: false },
  FlatMagicDamageMod:      { label: 'Ability Power',  color: '#c084fc', isPct: false },
  FlatHPPoolMod:           { label: 'Health',         color: '#f87171', isPct: false },
  FlatMPPoolMod:           { label: 'Mana',           color: '#60a5fa', isPct: false },
  FlatArmorMod:            { label: 'Armor',          color: '#fbbf24', isPct: false },
  FlatSpellBlockMod:       { label: 'Magic Resist',   color: '#67e8f9', isPct: false },
  FlatCritChanceMod:       { label: 'Crit Chance',    color: '#fde68a', isPct: true  },
  PercentAttackSpeedMod:   { label: 'Attack Speed',   color: '#fb923c', isPct: true  },
  FlatHPRegenMod:          { label: 'HP Regen',       color: '#f87171', isPct: false },
  FlatMPRegenMod:          { label: 'Mana Regen',     color: '#60a5fa', isPct: false },
  FlatMovementSpeedMod:    { label: 'Move Speed',     color: '#a3e635', isPct: false },
  PercentMovementSpeedMod: { label: 'Move Speed',     color: '#a3e635', isPct: true  },
  PercentLifeStealMod:     { label: 'Life Steal',     color: '#f87171', isPct: true  },
  PercentSpellVampMod:     { label: 'Omnivamp',       color: '#f87171', isPct: true  },
  FlatOmnivampMod:         { label: 'Omnivamp',       color: '#f87171', isPct: false },
  PercentOmnivampMod:      { label: 'Omnivamp',       color: '#f87171', isPct: true  },
  FlatCooldownMod:         { label: 'Ability Haste',  color: '#2dd4bf', isPct: false },
  PercentCooldownMod:      { label: 'Ability Haste',  color: '#2dd4bf', isPct: true  },
}

function formatStatValue(value, isPct) {
  if (!isPct) return `+${Math.round(value)}`
  // Data Dragon stores percentages as decimals (0.15 = 15%) for most stats
  const display = value <= 2 ? Math.round(value * 100) : Math.round(value)
  return `+${display}%`
}

/**
 * Extracts only the passive/active/unique text from a Data Dragon item description,
 * removing the <stats> block (which already appears as color-coded rows above).
 */
function getPassiveDescription(rawHtml) {
  if (!rawHtml) return ''
  // Remove the <stats>…</stats> section so we don't duplicate numbers
  const withoutStats = rawHtml.replace(/<stats>[\s\S]*?<\/stats>/gi, '')
  return stripHtml(withoutStats).replace(/\n{3,}/g, '\n\n').trim()
}

function parseStats(rawStats) {
  if (!rawStats) return []
  return Object.entries(rawStats)
    .filter(([key, val]) => STAT_MAP[key] && val > 0)
    .map(([key, val]) => {
      const def = STAT_MAP[key]
      return { label: def.label, color: def.color, value: formatStatValue(val, def.isPct) }
    })
}

/**
 * Renders a single item icon with a rich portal tooltip on hover.
 */
export default function ItemIcon({ itemName, version, itemIndex }) {
  const wrapperRef = useRef(null)
  const [tooltipPos, setTooltipPos] = useState(null)

  // Compute all item data upfront (hooks must run before any early return)
  const item = itemName ? lookupItem(itemIndex, itemName) : null
  const iconUrl = item ? getItemIconUrl(version, item.id) : null
  const cost    = item ? (item.gold?.total ?? item.gold?.base ?? '?') : '?'
  const description = item
    ? getPassiveDescription(item.description || '')
    : ''
  const stats = item ? parseStats(item.stats) : []

  const handleMouseEnter = useCallback(() => {
    if (!wrapperRef.current || !item) return
    const rect = wrapperRef.current.getBoundingClientRect()
    // Clamp X so tooltip never escapes viewport (tooltip max-width = 260px → half = 130)
    const x = Math.min(Math.max(rect.left + rect.width / 2, 134), window.innerWidth - 134)
    setTooltipPos({
      x,
      showAbove: rect.top > 200,
      anchorTop:    rect.top,
      anchorBottom: rect.bottom,
    })
  }, [item])

  const handleMouseLeave = useCallback(() => setTooltipPos(null), [])

  // ── Early returns (after all hooks) ──────────────────────────────────────
  if (!itemName) return <div className={styles.empty} />

  if (!item) {
    return (
      <div className={`${styles.iconWrapper} ${styles.unknown}`} title={itemName}>
        <div className={styles.unknownIcon}>?</div>
      </div>
    )
  }

  // ── Full render ───────────────────────────────────────────────────────────
  return (
    <div
      ref={wrapperRef}
      className={styles.iconWrapper}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <img
        src={iconUrl}
        alt={item.name}
        className={styles.icon}
        loading="lazy"
        draggable={false}
      />
      <div className={styles.overlay} />

      {tooltipPos && createPortal(
        <div
          className={styles.tooltip}
          style={tooltipPos.showAbove
            ? { bottom: `${window.innerHeight - tooltipPos.anchorTop + 10}px`, left: `${tooltipPos.x}px` }
            : { top:    `${tooltipPos.anchorBottom + 10}px`,                   left: `${tooltipPos.x}px` }
          }
        >
          {/* Header: name + cost */}
          <div className={styles.tooltipHeader}>
            <span className={styles.tooltipName}>{item.name}</span>
            <span className={styles.tooltipCost}>{cost}g</span>
          </div>

          {/* Colored stat rows */}
          {stats.length > 0 && (
            <div className={styles.tooltipStats}>
              {stats.map((s, i) => (
                <div key={i} className={styles.statRow}>
                  <span className={styles.statDot}  style={{ background: s.color }} />
                  <span className={styles.statValue} style={{ color: s.color }}>{s.value}</span>
                  <span className={styles.statLabel} style={{ color: s.color }}>{s.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Description */}
          {description && (
            <p className={styles.tooltipDesc}>{description}</p>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}
