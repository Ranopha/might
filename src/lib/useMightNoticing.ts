import { useEffect, useRef } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { playMightCue, unlockMightAudio } from './audioPreferences'

// These are the same owned live queries used by the four product surfaces.
// A new session hydrates silently; only later changes play a cue.
export function useMightNoticing(sessionKey: string, soundEnabled: boolean, volume: number) {
  const args = { clientSessionKey: sessionKey }
  const memories = useQuery(api.memories.list, { ...args, limit: 30 })
  const manifestation = useQuery(api.manifestation.current, args)
  const signal = useQuery(api.worldSignals.latest, args)
  const match = useQuery(api.matches.latest, args)
  const connection = useQuery(api.connections.latest, args)
  const requestScan = useMutation(api.worldSignals.requestScan)
  const requestMatch = useMutation(api.matches.requestMatch)
  const requested = useRef(new Set<string>())
  const previous = useRef<string[] | null>(null)

  useEffect(() => {
    if (!soundEnabled) return
    const unlock = () => unlockMightAudio()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [soundEnabled])

  useEffect(() => {
    if (memories === undefined || manifestation === undefined || match === undefined || connection === undefined) return
    const events = [
      manifestation?.status === 'ready' ? manifestation.id : '',
      ...memories.map(memory => memory.id),
      match?.status === 'completed' && match.match && ['surfaced', 'needs_clarification'].includes(match.match.status) ? match.match.id : '',
      connection?.reply?.eventId ?? '',
    ].filter(Boolean)
    const old = previous.current
    previous.current = events
    if (old !== null && events.some(event => !old.includes(event)) && soundEnabled) {
      void playMightCue(volume).catch(() => undefined)
    }
  }, [memories, manifestation, match, connection, soundEnabled, volume])

  useEffect(() => {
    if (!memories?.length || signal === undefined) return
    // One allowlisted public source is observed in this competition slice.
    // Failed work remains visible on Might Found with its manual retry control.
    if (signal === null) {
      const requestId = `notice-${memories[0].id}`
      if (requested.current.has(requestId)) return
      requested.current.add(requestId)
      void requestScan({ clientSessionKey: sessionKey, clientRequestId: requestId }).catch(() => undefined)
    }
  }, [memories, signal, requestScan, sessionKey])

  useEffect(() => {
    if (!memories?.length || signal?.status !== 'completed' || !signal.signal || match === undefined || match?.worldSignalId === signal.signal.id) return
    const requestId = `notice-match-${signal.signal.id}`
    if (requested.current.has(requestId)) return
    requested.current.add(requestId)
    void requestMatch({ clientSessionKey: sessionKey, worldSignalId: signal.signal.id, clientRequestId: requestId }).catch(() => undefined)
  }, [memories, signal, match, requestMatch, sessionKey])
}
