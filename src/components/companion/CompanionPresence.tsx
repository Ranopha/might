import { useState } from 'react'
import { useQuery } from 'convex/react'
import { motion, useReducedMotion } from 'motion/react'
import { api } from '../../../convex/_generated/api'
import { getOrCreateSessionKey } from '../../lib/session'
import { Orb } from './Orb'

type CompanionPresenceProps = {
  compact?: boolean
  state?: 'idle' | 'thinking'
}

export function CompanionPresence({
  compact = false,
  state = 'idle',
}: CompanionPresenceProps) {
  const [sessionKey] = useState(getOrCreateSessionKey)
  const reduceMotion = useReducedMotion()
  const manifestation = useQuery(api.manifestation.current, {
    clientSessionKey: sessionKey,
  })
  const settings = useQuery(api.companionSettings.current, {
    clientSessionKey: sessionKey,
  })
  const isGenerating =
    manifestation?.status === 'generating_brief' ||
    manifestation?.status === 'generating_image'
  const companionName = settings?.name ?? manifestation?.name ?? 'Might'
  const useGeneratedAppearance =
    settings === undefined
      ? manifestation?.status === 'ready'
      : settings.appearance === 'generated'

  if (
    !useGeneratedAppearance ||
    manifestation?.status !== 'ready' ||
    manifestation.imageUrl === null
  ) {
    return (
      <Orb
        compact={compact}
        state={isGenerating ? 'thinking' : state}
        name={companionName}
      />
    )
  }

  return (
    <motion.figure
      className={`companion-stage${compact ? ' companion-stage--compact' : ''}`}
      aria-label={`${companionName} in its original generated companion form`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: reduceMotion || compact ? 0 : [0, -5, 0],
      }}
      transition={{
        opacity: { duration: 0.7 },
        scale: { duration: 0.8, type: 'spring', bounce: 0.18 },
        y: { duration: 7.2, repeat: Infinity, ease: 'easeInOut' },
      }}
    >
      <span className="companion-stage__aura" aria-hidden="true" />
      <img
        className="companion-stage__image"
        src={manifestation.imageUrl}
        alt={`${companionName}, your original Webtoon-style companion`}
      />
      <span className="companion-stage__sheen" aria-hidden="true" />
      <span className="companion-stage__shadow" aria-hidden="true" />
    </motion.figure>
  )
}
