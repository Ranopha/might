const SESSION_STORAGE_KEY = 'might.anonymous-session.v1'

export function getOrCreateSessionKey() {
  const existing = window.localStorage.getItem(SESSION_STORAGE_KEY)
  if (existing) return existing

  const sessionKey = crypto.randomUUID()
  window.localStorage.setItem(SESSION_STORAGE_KEY, sessionKey)
  return sessionKey
}
