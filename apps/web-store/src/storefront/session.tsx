import { createContext, useContext, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { getStoredSession, setStoredSession } from './api'
import type { SessionData } from './api'

interface SessionContextValue {
  session: SessionData | null
  setSession: (session: SessionData | null) => void
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined)

export function StorefrontSessionProvider({ children }: PropsWithChildren) {
  const [session, updateSession] = useState<SessionData | null>(() => getStoredSession())

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      setSession(nextSession) {
        updateSession(nextSession)
        setStoredSession(nextSession)
      },
    }),
    [session],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useStorefrontSession() {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useStorefrontSession 必须在 StorefrontSessionProvider 内使用')
  }
  return context
}
