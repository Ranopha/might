const SESSION_STORAGE_KEY = 'might.anonymous-session.v1'
const ROOMS_STORAGE_KEY = 'might.private-rooms.v1'

type LocalRoom = { key: string; label: string }

export function getOrCreateSessionKey() {
  const existing = window.localStorage.getItem(SESSION_STORAGE_KEY)
  if (existing) return existing

  const sessionKey = crypto.randomUUID()
  window.localStorage.setItem(SESSION_STORAGE_KEY, sessionKey)
  return sessionKey
}

export function listPrivateRooms(): LocalRoom[] {
  const current = getOrCreateSessionKey()
  let rooms: LocalRoom[] = []
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(ROOMS_STORAGE_KEY) ?? '[]')
    if (Array.isArray(parsed)) rooms = parsed.filter((room): room is LocalRoom =>
      typeof room?.key === 'string' && room.key.length >= 32 && room.key.length <= 256 && typeof room.label === 'string')
  } catch { /* The current room stays accessible if the room list is malformed. */ }
  if (!rooms.some(room => room.key === current)) rooms.push({ key: current, label: `Room ${rooms.length + 1}` })
  return rooms
}

export function createPrivateRoom() {
  const rooms = listPrivateRooms()
  if (rooms.length >= 20) throw new Error('This device already holds twenty rooms.')
  const room = { key: crypto.randomUUID(), label: `Room ${rooms.length + 1}` }
  window.localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify([...rooms, room]))
  window.localStorage.setItem(SESSION_STORAGE_KEY, room.key)
  return room.key
}

export function selectPrivateRoom(key: string) {
  const rooms = listPrivateRooms()
  if (!rooms.some(room => room.key === key)) throw new Error('Room is unavailable on this device.')
  window.localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(rooms))
  window.localStorage.setItem(SESSION_STORAGE_KEY, key)
}
