import { useMemo } from 'react'
import styles from './ParticleBackground.module.css'

const PARTICLE_COUNT = 30

export default function ParticleBackground() {
  const particles = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      left:     `${(i * 37 + 5) % 100}%`,
      size:     2 + (i % 4),
      duration: `${10 + (i * 7) % 16}s`,
      delay:    `${-(i * 3) % 18}s`,
      opacity:  0.3 + (i % 4) * 0.15,
    }))
  }, [])

  return (
    <div className={styles.background} aria-hidden="true">
      {/* Animated gradient overlay */}
      <div className={styles.gradientLayer} />

      {/* Scanline effect */}
      <div className={styles.scanline} />

      {/* Floating particles */}
      <div className={styles.particleField}>
        {particles.map(p => (
          <span
            key={p.id}
            className={styles.particle}
            style={{
              left:              p.left,
              width:             `${p.size}px`,
              height:            `${p.size}px`,
              animationDuration: p.duration,
              animationDelay:    p.delay,
              opacity:           p.opacity,
            }}
          />
        ))}
      </div>

      {/* Vignette */}
      <div className={styles.vignette} />
    </div>
  )
}
