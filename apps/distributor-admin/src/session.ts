import type { OperatorSessionData } from './types'

const OPERATOR_SESSION_STORAGE_KEY = 'saimeng-distributor-session'

export function getStoredOperatorSession(): OperatorSessionData | null {
  const rawValue = window.localStorage.getItem(OPERATOR_SESSION_STORAGE_KEY)
  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue) as OperatorSessionData
  } catch {
    window.localStorage.removeItem(OPERATOR_SESSION_STORAGE_KEY)
    return null
  }
}

export function setStoredOperatorSession(session: OperatorSessionData | null) {
  if (!session) {
    window.localStorage.removeItem(OPERATOR_SESSION_STORAGE_KEY)
    return
  }

  window.localStorage.setItem(OPERATOR_SESSION_STORAGE_KEY, JSON.stringify(session))
}
