import { useCallback, useEffect, useState } from 'react'

const AUDIO_PREFERENCES_KEY = 'might.audio-preferences.v1'
const DEFAULT_VOLUME = 34

type StoredAudioPreferences = {
  soundEffectsEnabled: boolean
  volume: number
}

function readAudioPreferences(): StoredAudioPreferences {
  try {
    const stored = window.localStorage.getItem(AUDIO_PREFERENCES_KEY)
    if (stored === null) {
      return { soundEffectsEnabled: true, volume: DEFAULT_VOLUME }
    }
    const parsed = JSON.parse(stored) as Partial<StoredAudioPreferences>
    return {
      soundEffectsEnabled: parsed.soundEffectsEnabled !== false,
      volume:
        typeof parsed.volume === 'number' && Number.isFinite(parsed.volume)
          ? Math.min(100, Math.max(0, Math.round(parsed.volume)))
          : DEFAULT_VOLUME,
    }
  } catch {
    return { soundEffectsEnabled: true, volume: DEFAULT_VOLUME }
  }
}

export function useAudioPreferences() {
  const [preferences, setPreferences] = useState(readAudioPreferences)

  useEffect(() => {
    try {
      window.localStorage.setItem(AUDIO_PREFERENCES_KEY, JSON.stringify(preferences))
    } catch {
      // The preference remains active for this page when storage is unavailable.
    }
  }, [preferences])

  const setSoundEffectsEnabled = useCallback((soundEffectsEnabled: boolean) => {
    setPreferences((current) => ({ ...current, soundEffectsEnabled }))
  }, [])
  const setVolume = useCallback((volume: number) => {
    setPreferences((current) => ({
        ...current,
        volume: Math.min(100, Math.max(0, Math.round(volume))),
    }))
  }, [])

  return {
    ...preferences,
    setSoundEffectsEnabled,
    setVolume,
  }
}

export async function playMightSoundPreview(volume: number) {
  const AudioContextConstructor =
    window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  if (AudioContextConstructor === undefined || volume <= 0) return

  const context = new AudioContextConstructor()
  const master = context.createGain()
  master.gain.setValueAtTime(0.0001, context.currentTime)
  master.gain.exponentialRampToValueAtTime(
    Math.max(0.0001, (volume / 100) * 0.12),
    context.currentTime + 0.035,
  )
  master.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.72)
  master.connect(context.destination)

  const first = context.createOscillator()
  const second = context.createOscillator()
  first.type = 'sine'
  second.type = 'sine'
  first.frequency.setValueAtTime(523.25, context.currentTime)
  second.frequency.setValueAtTime(659.25, context.currentTime + 0.16)
  first.connect(master)
  second.connect(master)
  first.start(context.currentTime)
  first.stop(context.currentTime + 0.48)
  second.start(context.currentTime + 0.16)
  second.stop(context.currentTime + 0.7)

  await context.resume()
  window.setTimeout(() => void context.close(), 900)
}
