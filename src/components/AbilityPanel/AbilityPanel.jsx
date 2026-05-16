import { useState } from 'react'
import AbilityCard from '../AbilityCard/AbilityCard.jsx'
import {
  getSpellIconUrl,
  getPassiveIconUrl,
} from '../../services/dataDragon.js'
import { stripHtml } from '../../utils/htmlStripper.js'
import styles from './AbilityPanel.module.css'

const LABELS = ['Passive', 'Q', 'W', 'E', 'R']
const CAPS   = ['Innate · Passive', 'Active · Q', 'Active · W', 'Active · E', 'Ultimate · R']

/**
 * @param {{
 *   passive: object,
 *   spells: object[],
 *   version: string
 * }} props
 */
export default function AbilityPanel({ passive, spells, version }) {
  const [activeIndex, setActiveIndex] = useState(0)

  if (!passive || !spells) return null

  const abilities = [
    {
      slot:        'Passive',
      cap:         CAPS[0],
      name:        passive.name,
      description: passive.description,
      imageUrl:    getPassiveIconUrl(version, passive.image?.full ?? ''),
    },
    ...spells.map((spell, i) => ({
      slot:        LABELS[i + 1],
      cap:         CAPS[i + 1],
      name:        spell.name,
      description: spell.description,
      imageUrl:    getSpellIconUrl(version, spell.image.full),
    })),
  ]

  const current = abilities[activeIndex]

  return (
    <>
      <div className={styles.row}>
        {abilities.map((a, i) => (
          <AbilityCard
            key={a.slot}
            slot={a.slot}
            name={a.name}
            cap={a.cap}
            imageUrl={a.imageUrl}
            isActive={activeIndex === i}
            onClick={() => setActiveIndex(i)}
          />
        ))}
      </div>

      {current && (
        <div className={styles.detail} key={current.slot}>
          <p className={styles.detailCap}>{current.cap}</p>
          <h3 className={styles.detailName}>{current.name}</h3>
          <p className={styles.detailText}>{stripHtml(current.description)}</p>
        </div>
      )}
    </>
  )
}
