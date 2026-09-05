// @vitest-environment jsdom
import { beforeEach, expect, test } from 'vitest'
import { createPrivateRoom, getOrCreateSessionKey, listPrivateRooms, selectPrivateRoom } from './session'

beforeEach(() => window.localStorage.clear())

test('a new private room has a different bearer and the previous room can be restored', () => {
  const original = getOrCreateSessionKey()
  const second = createPrivateRoom()
  expect(second).not.toBe(original)
  expect(getOrCreateSessionKey()).toBe(second)
  expect(listPrivateRooms()).toHaveLength(2)
  selectPrivateRoom(original)
  expect(getOrCreateSessionKey()).toBe(original)
  expect(listPrivateRooms()).toHaveLength(2)
  expect(() => selectPrivateRoom('unknown-room-000000000000000000000000')).toThrow()
  expect(getOrCreateSessionKey()).toBe(original)
})
