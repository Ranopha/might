import { motion, useReducedMotion } from 'motion/react'

type OrbProps = {
  compact?: boolean
  state?: 'idle' | 'thinking'
}

export function Orb({ compact = false, state = 'idle' }: OrbProps) {
  const reduceMotion = useReducedMotion()
  const duration = state === 'thinking' ? 2.8 : 6.8

  return (
    <motion.div
      aria-label="Might in its original glowing orb form"
      className={`orb-stage${compact ? ' orb-stage--compact' : ''}`}
      initial={{ opacity: 0, scale: 0.82 }}
      animate={{ opacity: 1, scale: 1, y: reduceMotion ? 0 : [0, -7, 0] }}
      transition={{
        opacity: { duration: 0.7 },
        scale: { duration: 0.9, type: 'spring', bounce: 0.22 },
        y: { duration, repeat: Infinity, ease: 'easeInOut' },
      }}
    >
      <div className="orb-aura" />
      <motion.div
        className="orb"
        animate={
          reduceMotion
            ? undefined
            : {
                scale: state === 'thinking' ? [1, 1.045, 0.99, 1] : [1, 1.025, 1],
                rotate: [0, 3, -2, 0],
              }
        }
        transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="orb__veil orb__veil--one" />
        <div className="orb__veil orb__veil--two" />
        <div className="orb__heart" />
        <div className="orb__shine" />
      </motion.div>
      <div className="orb-shadow" />
    </motion.div>
  )
}
