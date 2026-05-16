import styles from './AppBar.module.css'

/**
 * Sticky top app bar. Shows brand + meta on the grid view, swaps to
 * a back button + champion name when viewing a champion detail page.
 *
 * @param {{
 *   version?: string,
 *   championCount?: number,
 *   selectedName?: string,
 *   onBack?: (() => void) | null
 * }} props
 */
export default function AppBar({ version, championCount, selectedName, onBack }) {
  return (
    <header className={styles.appbar}>
      {onBack ? (
        <button className={styles.back} onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          All champions
        </button>
      ) : (
        <span className={styles.spacer} aria-hidden="true" />
      )}

      <div className={styles.brand}>
        <span className={styles.mark} aria-hidden="true" />
        <span>
          League <em>Codex</em>
        </span>
      </div>

      <div className={styles.meta}>
        {selectedName ? (
          <span>{selectedName}</span>
        ) : (
          <>
            <span><span className={styles.dot} />Live{version ? ` · patch ${version}` : ''}</span>
            {championCount ? <span>{championCount} champions</span> : null}
          </>
        )}
      </div>
    </header>
  )
}
