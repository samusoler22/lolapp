import styles from './AbilityCard.module.css'

/**
 * Header-style ability card. The expanded description lives in AbilityPanel
 * as a single rich detail block, not inline — keeps the row tidy.
 *
 * @param {{
 *   slot:    string,    'Passive' | 'Q' | 'W' | 'E' | 'R'
 *   name:    string,
 *   cap:     string,    e.g. "Ultimate · R"
 *   imageUrl: string,
 *   isActive: boolean,
 *   onClick: () => void
 * }} props
 */
export default function AbilityCard({ slot, name, cap, imageUrl, isActive, onClick }) {
  const slotLabel = slot === 'Passive' ? 'P' : slot

  return (
    <button
      className={`${styles.card} ${isActive ? styles.active : ''}`}
      onClick={onClick}
      aria-pressed={isActive}
      title={name}
    >
      <span className={styles.slot}>{slotLabel}</span>
      <div className={styles.iconWrap}>
        <img
          src={imageUrl}
          alt={`${name} icon`}
          className={styles.icon}
          loading="lazy"
          draggable={false}
        />
        <div className={styles.iconOverlay} />
      </div>
      <span className={styles.name}>{name}</span>
      <span className={styles.cap}>{cap}</span>
    </button>
  )
}
