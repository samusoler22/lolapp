import { motion } from 'framer-motion'
import { getChampionIconUrl } from '../../services/dataDragon.js'
import styles from './ChampionIcon.module.css'

const cardVariants = {
  hidden:  { opacity: 0, y: 10 },
  visible: i => ({
    opacity: 1,
    y: 0,
    transition: {
      type: 'tween',
      ease: [0.22, 1, 0.36, 1],
      duration: 0.4,
      delay: Math.min(i * 0.018, 0.4),
    },
  }),
}

/**
 * Portrait-style champion card used inside the directory grid.
 * Keeps the same default export name as before so ChampionGrid is unchanged.
 *
 * @param {{ champion: object, version: string, index?: number, onClick: () => void }} props
 */
export default function ChampionIcon({ champion, version, index = 0, onClick }) {
  // The Data Dragon "icon" image is a square crop. We use it as the card
  // portrait — the new layout reserves a 4:5 area so it's still attractive
  // even at the original square aspect.
  const iconUrl = getChampionIconUrl(version, champion.image.full)

  return (
    <motion.button
      className={styles.card}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={index}
      whileHover={{ y: -4, transition: { type: 'tween', duration: 0.2 } }}
      onClick={onClick}
      title={champion.name}
      aria-label={`Open ${champion.name}`}
    >
      <div className={styles.art}>
        <span className={styles.indexTag}>№{String(index + 1).padStart(2, '0')}</span>
        <img
          src={iconUrl}
          alt={champion.name}
          className={styles.image}
          loading="eager"
          draggable={false}
        />
        <span className={styles.cta}>View →</span>
      </div>

      <div className={styles.body}>
        <span className={styles.name}>{champion.name}</span>
        {champion.title && <span className={styles.title}>{champion.title}</span>}
        <div className={styles.tags}>
          {champion.tags.map(tag => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
        </div>
      </div>
    </motion.button>
  )
}
