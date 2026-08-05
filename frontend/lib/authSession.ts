export const AUTH_SESSION_KEY = 'signalx_session'

export type AuthSession = {
  sessionId: string
  userId: string
  username: string
  roles: string[]
  location?: string
  loginAt: string
  isGuest?: boolean
}

export function readAuthSession(): AuthSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthSession
    if (!parsed?.sessionId || !parsed?.userId) return null
    return {
      ...parsed,
      roles: Array.isArray(parsed.roles) ? parsed.roles : [],
    }
  } catch {
    return null
  }
}

export function writeAuthSession(session: AuthSession) {
  if (typeof window === 'undefined') return
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session))
}

export function clearAuthSession() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(AUTH_SESSION_KEY)
}

export function isAdminSession(session: AuthSession | null | undefined): boolean {
  return (session?.roles ?? []).some((r) => r.toLowerCase() === 'admin')
}
