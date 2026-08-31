// @vitest-environment jsdom

import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'
import { useAudioPreferences } from './audioPreferences'

beforeEach(() => window.localStorage.clear())

test('keeps non-secret audio preferences on this device', async () => {
  const first = renderHook(() => useAudioPreferences())
  expect(first.result.current.soundEffectsEnabled).toBe(true)
  expect(first.result.current.volume).toBe(34)

  act(() => {
    first.result.current.setSoundEffectsEnabled(false)
    first.result.current.setVolume(27)
  })
  expect(first.result.current.soundEffectsEnabled).toBe(false)
  expect(first.result.current.volume).toBe(27)
  await waitFor(() => {
    expect(window.localStorage.getItem('might.audio-preferences.v1')).toBe(
      JSON.stringify({ soundEffectsEnabled: false, volume: 27 }),
    )
  })
  first.unmount()

  const restored = renderHook(() => useAudioPreferences())
  expect(restored.result.current.soundEffectsEnabled).toBe(false)
  expect(restored.result.current.volume).toBe(27)
})
