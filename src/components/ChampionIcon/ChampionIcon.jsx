import { motion } from 'framer-motion'
import { getChampionIconUrl } from '../../services/dataDragon.js'
import styles from './ChampionIcon.module.css'

const iconVariants = {
  hidden:  { opacity: 0, scale: 0.75, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 340, damping: 30 },
  },
  exit: {
    opacity: 0,
    scale: 0.85,
    transition: { duration: 0.1 },
  },
}

/**
 * @param {{ champion: object, version: string, onClick: () => void }} props
 */
export default function ChampionIcon({ champion, version, onClick }) {
  const iconUrl = getChampionIconUrl(version, champion.image.full)

  return (
    <motion.button
      className={styles.iconBtn}
      variants={iconVariants}
      whileHover={{ scale: 1.08, zIndex: 2, transition: { type: 'spring', stiffness: 400, damping: 28 } }}
      whileTap={{ scale: 0.94, transition: { duration: 0.1 } }}
      onClick={onClick}
      title={champion.name}
      aria-label={`Select ${champion.name}`}
    >
      <div className={styles.iconWrapper}>
        <img
          src={iconUrl}
          alt={champion.name}
          className={styles.icon}
          loading="eager"
          draggable={false}
        />
        <div className={styles.glow} />
      </div>
      <span className={styles.name}>{champion.name}</span>
    </motion.button>
  )
}
