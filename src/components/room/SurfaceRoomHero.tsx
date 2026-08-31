import { motion, useReducedMotion } from 'motion/react'
import { CompanionPresence } from '../companion/CompanionPresence'

type SurfaceRoomVariant = 'me' | 'found' | 'connections'
type SurfaceRoomState = 'idle' | 'active' | 'replied' | 'connected'

type SurfaceRoomHeroProps = {
  variant: SurfaceRoomVariant
  kicker: string
  title: string
  description: string
  titleId: string
  state?: SurfaceRoomState
}

const assetByVariant: Record<SurfaceRoomVariant, string> = {
  me: '/assets/surfaces/me-memory-herbarium-v1.png',
  found: '/assets/surfaces/found-world-knock-v1.png',
  connections: '/assets/surfaces/connections-two-way-thread-v1.png',
}

export function SurfaceRoomHero({
  variant,
  kicker,
  title,
  description,
  titleId,
  state = 'idle',
}: SurfaceRoomHeroProps) {
  const reduceMotion = useReducedMotion()
  const assetMotion = surfaceAssetMotion(variant, state, Boolean(reduceMotion))

  return (
    <section
      className={`surface-room-hero surface-room-hero--${variant} is-${state}`}
      aria-labelledby={titleId}
    >
      <div className="surface-room-hero__visuals" aria-hidden="true">
        <img
          className="surface-room-hero__background"
          src="/assets/room/might-room-background-v1.png"
          alt=""
          draggable={false}
        />

        {variant === 'found' ? (
          <div className="surface-room-hero__companion">
            <CompanionPresence state={state === 'active' ? 'thinking' : 'idle'} />
          </div>
        ) : null}

        <motion.img
          className="surface-room-hero__asset"
          src={assetByVariant[variant]}
          alt=""
          draggable={false}
          initial={false}
          animate={assetMotion.animate}
          transition={assetMotion.transition}
        />

        <img
          className="surface-room-hero__foreground"
          src="/assets/room/might-room-foreground-frame-v3.png"
          alt=""
          draggable={false}
        />
      </div>

      <motion.div
        className="surface-room-hero__copy"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.62, delay: 0.12 }}
      >
        <p className="kicker">{kicker}</p>
        <h1 id={titleId}>{title}</h1>
        <p>{description}</p>
      </motion.div>
    </section>
  )
}

function surfaceAssetMotion(
  variant: SurfaceRoomVariant,
  state: SurfaceRoomState,
  reduceMotion: boolean,
) {
  if (reduceMotion) {
    return {
      animate: { opacity: state === 'idle' && variant !== 'me' ? 0.66 : 1, x: 0, y: 0, scale: 1 },
      transition: { duration: 0.2 },
    }
  }

  if (variant === 'me') {
    return {
      animate: { opacity: 1, x: 0, y: [0, -4, 0], scale: [1, 1.006, 1] },
      transition: { duration: 10.8, repeat: Infinity, ease: 'easeInOut' as const },
    }
  }

  if (variant === 'found') {
    if (state === 'idle') {
      return {
        animate: { opacity: 0.66, x: [8, 4, 8], y: [1, -2, 1], scale: 0.99 },
        transition: { duration: 8.2, repeat: Infinity, ease: 'easeInOut' as const },
      }
    }
    if (state === 'active') {
      return {
        animate: { opacity: 0.9, x: [10, 2, 10], y: [2, -4, 2], scale: 0.995 },
        transition: { duration: 4.8, repeat: Infinity, ease: 'easeInOut' as const },
      }
    }
    return {
      animate: { opacity: 1, x: [0, -5, 0], y: [0, -3, 0], scale: 1 },
      transition: { duration: 7.2, repeat: Infinity, ease: 'easeInOut' as const },
    }
  }

  if (state === 'connected') {
    return {
      animate: { opacity: 1, x: 0, y: [0, -3, 0], scale: [0.995, 1.015, 1] },
      transition: { duration: 8.4, repeat: Infinity, ease: 'easeInOut' as const },
    }
  }
  if (state === 'replied') {
    return {
      animate: { opacity: 0.92, x: 0, y: [0, -4, 0], scale: [0.99, 1.008, 0.99] },
      transition: { duration: 6.8, repeat: Infinity, ease: 'easeInOut' as const },
    }
  }
  if (state === 'active') {
    return {
      animate: { opacity: 0.74, x: 0, y: [0, -2, 0], scale: 0.995 },
      transition: { duration: 7.4, repeat: Infinity, ease: 'easeInOut' as const },
    }
  }
  return {
    animate: { opacity: 0.64, x: 0, y: 0, scale: 0.985 },
    transition: { duration: 0.7, ease: 'easeOut' as const },
  }
}
