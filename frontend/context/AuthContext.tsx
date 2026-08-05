'use client'

import {
  clearAuthSession,
  isAdminSession,
  readAuthSession,
  writeAuthSession,
  type AuthSession,
} from '@/lib/authSession'
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

type AuthContextValue = {
  session: AuthSession | null
  loading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  setSession: (session: AuthSession) => void
  logout: () => Promise<void>
  refreshSession: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function endSessionOnClose(sessionId: string) {
  const url = `/api/auth/logout?sessionId=${encodeURIComponent(sessionId)}`
  const body = JSON.stringify({ sessionId })

  try {
    // keepalive survives tab close; preferred when available
    void fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Id': sessionId,
      },
      body,
      keepalive: true,
    })
  } catch {
    // ignore
  }

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' })
      navigator.sendBeacon(url, blob)
    }
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshSession = useCallback(async () => {
    const local = readAuthSession()
    if (!local?.sessionId) {
      setSessionState(null)
      setLoading(false)
      return false
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'X-Session-Id': local.sessionId },
      })
      if (!res.ok) {
        clearAuthSession()
        setSessionState(null)
        setLoading(false)
        return false
      }
      const data = await res.json()
      const next: AuthSession = {
        sessionId: data.sessionId,
        userId: data.userId,
        username: data.username,
        roles: Array.isArray(data.roles) ? data.roles : local.roles,
        location: data.location ?? local.location,
        loginAt: data.loginAt ?? local.loginAt,
        isGuest: local.isGuest || data.username?.toLowerCase() === 'guest',
      }
      writeAuthSession(next)
      setSessionState(next)
      setLoading(false)
      return true
    } catch {
      // Offline / API down — keep local session so UI still works
      setSessionState(local)
      setLoading(false)
      return true
    }
  }, [])

  useEffect(() => {
    refreshSession()
  }, [refreshSession])

  // Auto logout + end DB session when the website/tab is closed
  useEffect(() => {
    const handlePageHide = () => {
      const local = readAuthSession()
      const sessionId = local?.sessionId
      if (!sessionId) return
      endSessionOnClose(sessionId)
      clearAuthSession()
    }

    window.addEventListener('pagehide', handlePageHide)
    window.addEventListener('beforeunload', handlePageHide)
    return () => {
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('beforeunload', handlePageHide)
    }
  }, [])

  const setSession = useCallback((next: AuthSession) => {
    writeAuthSession(next)
    setSessionState(next)
  }, [])

  const logout = useCallback(async () => {
    const local = readAuthSession()
    const sessionId = local?.sessionId || session?.sessionId
    if (sessionId) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Id': sessionId,
          },
          body: JSON.stringify({ sessionId }),
        })
      } catch {
        // Still clear local session even if API fails
      }
    }
    clearAuthSession()
    setSessionState(null)
  }, [session?.sessionId])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      loading,
      isAuthenticated: !!session?.sessionId,
      isAdmin: isAdminSession(session),
      setSession,
      logout,
      refreshSession,
    }),
    [session, loading, setSession, logout, refreshSession]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
