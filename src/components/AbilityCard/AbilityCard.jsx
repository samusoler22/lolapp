import { stripHtml } from '../../utils/htmlStripper.js'
import styles from './AbilityCard.module.css'

/**
 * @param {{
 *   label: string,       'Passive' | 'Q' | 'W' | 'E' | 'R'
 *   name: string,
 *   description: string,
 *   imageUrl: string,
 *   isActive: boolean,
 *   onClick: () => void
 * }} props
 */
export default function AbilityCard({
  label,
  name,
  description,
  imageUrl,
  isActive,
  onClick,
}) {
  const cleanDesc = stripHtml(description)

  return (
    <div className={styles.wrapper}>
      <button
        className={`${styles.card} ${isActive ? styles.active : ''}`}
        onClick={onClick}
        aria-pressed={isActive}
        title={name}
      >
        <div className={styles.iconWrapper}>
          <img
            src={imageUrl}
            alt={`${name} icon`}
            className={styles.icon}
            loading="lazy"
            draggable={false}
          />
          <div className={styles.iconOverlay} />
        </div>
        <span className={styles.label}>{label}</span>
        <span className={styles.name}>{name}</span>
      </button>

      <div className={`${styles.description} ${isActive ? styles.descriptionOpen : ''}`}>
        <div className={styles.descriptionInner}>
          <p className={styles.descText}>{cleanDesc}</p>
        </div>
      </div>
    </div>
  )
}
