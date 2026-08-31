import { motion, useReducedMotion } from 'motion/react'

type OrbProps = {
  compact?: boolean
  state?: 'idle' | 'thinking'
}

export function Orb({ compact = false, state = 'idle' }: OrbProps) {
  const reduceMotion = useReducedMotion()
  const duration = state === 'thinking' ? 3.2 : 7.4

  return (
    <motion.div
      aria-label="Might in its original glowing orb form"
      className={`orb-stage${compact ? ' orb-stage--compact' : ''}`}
      initial={{ opacity: 0, scale: 0.82 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: reduceMotion || compact ? 0 : [0, -6, 0],
      }}
      transition={{
        opacity: { duration: 0.7 },
        scale: { duration: 0.9, type: 'spring', bounce: 0.22 },
        y: { duration, repeat: Infinity, ease: 'easeInOut' },
      }}
    >
      <motion.img
        className="orb__image"
        src="/assets/companion/might-orb-hero-v1.png"
        alt=""
        draggable={false}
        animate={
          reduceMotion
            ? undefined
            : {
                scale: state === 'thinking' ? [1, 1.035, 0.995, 1] : [1, 1.018, 1],
                rotate: state === 'thinking' ? [0, 1.2, -0.8, 0] : [0, 0.45, 0],
              }
        }
        transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.div>
  )
}
