// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { beforeEach, expect, test, vi } from 'vitest'
import { TalkScreen } from './TalkScreen'

const mockedApi = vi.hoisted(() => ({
  companionSettings: {
    current: Symbol('companionSettings.current'),
  },
  manifestation: {
    current: Symbol('manifestation.current'),
    generate: Symbol('manifestation.generate'),
  },
  talk: {
    appendUserMessage: Symbol('talk.appendUserMessage'),
    ensureSession: Symbol('talk.ensureSession'),
    latestTurn: Symbol('talk.latestTurn'),
    listMessages: Symbol('talk.listMessages'),
  },
}))

vi.mock('../../convex/_generated/api', () => ({ api: mockedApi }))

vi.mock('convex/react', () => ({
  useAction: () => vi.fn(async () => ({ status: 'failed' })),
  useMutation: () => vi.fn(async () => undefined),
  useQuery: (query: symbol) => {
    if (query === mockedApi.talk.listMessages) return []
    if (query === mockedApi.companionSettings.current) {
      return { name: 'Might', appearance: 'orb' }
    }
    return undefined
  },
}))

vi.mock('../components/companion/CompanionPresence', () => ({
  CompanionPresence: () => <div data-testid="companion-presence" />,
}))

beforeEach(() => {
  window.localStorage.clear()
  Object.defineProperty(window, 'scrollTo', {
    configurable: true,
    value: vi.fn(),
  })
})

test('keeps the fixed-room backdrop after choosing the house form', () => {
  render(<TalkScreen />)

  fireEvent.click(screen.getByRole('button', { name: 'Keep this form' }))

  const chat = document.querySelector('.talk-screen--chat')
  expect(chat).toBeInTheDocument()
  expect(chat?.querySelector('.talk-room-scene__background')).toHaveAttribute(
    'src',
    '/assets/room/might-room-background-v1.png',
  )
  expect(window.scrollTo).toHaveBeenCalledWith({
    top: 0,
    left: 0,
    behavior: 'auto',
  })
})
