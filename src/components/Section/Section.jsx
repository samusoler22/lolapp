import styles from './Section.module.css'

/**
 * Two-column editorial section with a sticky numbered header on the left
 * and content on the right. Used to lay out the ChampionDetail body.
 *
 * @param {{
 *   num: string,         // "01", "02", etc — purely cosmetic
 *   title: string,
 *   blurb?: string,
 *   children: React.ReactNode
 * }} props
 */
export default function Section({ num, title, blurb, children }) {
  return (
    <section className={styles.section}>
      <div className={styles.head}>
        {num && <span className={styles.num}>{num}</span>}
        <h2 className={styles.title}>{title}</h2>
        {blurb && <p className={styles.blurb}>{blurb}</p>}
      </div>
      <div className={styles.body}>
        {children}
      </div>
    </section>
  )
}
