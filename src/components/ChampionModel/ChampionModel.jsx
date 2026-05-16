import { useEffect, useRef, useState } from 'react'
import '@google/model-viewer'
import styles from './ChampionModel.module.css'

const CDN = 'https://cdn.modelviewer.lol/lol/models'

const VIEWER_PROPS = {
  'auto-rotate': '',
  'camera-controls': '',
  'shadow-intensity': '1',
  'shadow-softness': '0.8',
  'exposure': '1.1',
  'environment-image': 'neutral',
}

/**
 * @param {{
 *   championId: string,   — e.g. "Ahri"
 *   championKey: string,  — numeric string from Data Dragon e.g. "103"
 *   skinNum: number,      — skin.num (0 = base)
 *   skinName?: string,    — display name of active skin
 *   hero?: boolean,       — if true, renders minimal viewer for the hero section
 * }} props
 */
export default function ChampionModel({ championId, championKey, skinNum, chromaId, skinName, hero }) {
  const ref = useRef(null)
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'

  const skinId = parseInt(championKey, 10) * 1000 + skinNum
  const effectiveId = chromaId ?? skinId
  const src = `${CDN}/${championId.toLowerCase()}/${effectiveId}/model-lite.glb`

  // Reset on src change
  useEffect(() => { setStatus('loading') }, [src])

  // model-viewer fires native DOM events — use ref to listen
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onLoad  = () => setStatus('ready')
    const onError = () => setStatus('error')
    el.addEventListener('load', onLoad)
    el.addEventListener('error', onError)
    return () => {
      el.removeEventListener('load', onLoad)
      el.removeEventListener('error', onError)
    }
  })

  /* ── Hero variant ─────────────────────────────────────────────────── */
  if (hero) {
    // On error keep the empty wrapper so grid column doesn't collapse
    if (status === 'error') return <div className={styles.heroWrap} />
    return (
      <div className={styles.heroWrap}>
        {status === 'loading' && (
          <div className={styles.loader}>
            <div className={styles.spinner} />
          </div>
        )}
        <model-viewer
          ref={ref}
          src={src}
          {...VIEWER_PROPS}
          className={styles.heroViewer}
          style={{ opacity: status === 'ready' ? 1 : 0 }}
        />
      </div>
    )
  }

  /* ── Showcase variant (standalone section) ────────────────────────── */
  if (status === 'error') return null

  const displaySkin = skinName && skinName !== 'default' ? skinName : null

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <span className={styles.label}>3D Model</span>
        {displaySkin && <span className={styles.skinName}>{displaySkin}</span>}
      </div>

      <div className={styles.stage}>
        {status === 'loading' && (
          <div className={styles.loader}>
            <div className={styles.spinner} />
            <span>Loading 3D model…</span>
          </div>
        )}
        <model-viewer
          ref={ref}
          src={src}
          {...VIEWER_PROPS}
          className={styles.viewer}
          style={{ opacity: status === 'ready' ? 1 : 0 }}
        />
      </div>

      <p className={styles.hint}>Drag to rotate · Scroll to zoom</p>
    </section>
  )
}
