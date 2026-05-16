import { useState } from 'react'
import AbilityCard from '../AbilityCard/AbilityCard.jsx'
import {
  getSpellIconUrl,
  getPassiveIconUrl,
} from '../../services/dataDragon.js'
import styles from './AbilityPanel.module.css'

const LABELS = ['Passive', 'Q', 'W', 'E', 'R']

/**
 * @param {{
 *   passive: object,
 *   spells: object[],
 *   version: string
 * }} props
 */
export default function AbilityPanel({ passive, spells, version }) {
  const [activeIndex, setActiveIndex] = useState(null)

  if (!passive || !spells) return null

  const abilities = [
    {
      label:       'Passive',
      name:        passive.name,
      description: passive.description,
      imageUrl:    getPassiveIconUrl(version, passive.image?.full ?? ''),
    },
    ...spells.map((spell, i) => ({
      label:       LABELS[i + 1],
      name:        spell.name,
      description: spell.description,
      imageUrl:    getSpellIconUrl(version, spell.image.full),
    })),
  ]

  const handleClick = index => {
    setActiveIndex(prev => (prev === index ? null : index))
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Abilities</h2>
      <div className={styles.abilityRow}>
        {abilities.map((ability, i) => (
          <AbilityCard
            key={ability.label}
            {...ability}
            isActive={activeIndex === i}
            onClick={() => handleClick(i)}
          />
        ))}
      </div>
    </section>
  )
}
