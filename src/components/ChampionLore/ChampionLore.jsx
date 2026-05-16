import styles from './ChampionLore.module.css'

/**
 * @param {{
 *   lore: string,
 *   allytips: string[],
 *   enemytips: string[]
 * }} props
 */
export default function ChampionLore({ lore, allytips, enemytips }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Lore</h2>

      {lore && <p className={styles.loreText}>{lore}</p>}

      {(allytips?.length > 0 || enemytips?.length > 0) && (
        <div className={styles.tips}>
          {allytips?.length > 0 && (
            <div className={styles.tipGroup}>
              <h3 className={styles.tipTitle}>
                <span className={styles.tipAlly}>▲</span>
                Playing As
              </h3>
              <ul className={styles.tipList}>
                {allytips.map((tip, i) => (
                  <li key={i} className={styles.tipItem}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {enemytips?.length > 0 && (
            <div className={styles.tipGroup}>
              <h3 className={styles.tipTitle}>
                <span className={styles.tipEnemy}>▼</span>
                Playing Against
              </h3>
              <ul className={styles.tipList}>
                {enemytips.map((tip, i) => (
                  <li key={i} className={styles.tipItem}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
