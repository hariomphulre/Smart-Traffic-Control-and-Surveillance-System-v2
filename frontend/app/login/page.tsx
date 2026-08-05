'use client'

import LocationBar from '@/components/LocationBar'
import { useAuth } from '@/context/AuthContext'
import { useLocationFilter } from '@/context/LocationFilterContext'
import { getViewLocationFilter } from '@/lib/iamLocation'
import { MAP_SIGNALS } from '@/map/MapData'
import { startAuthentication } from '@simplewebauthn/browser'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { FiKey, FiShield, FiUser } from 'react-icons/fi'
import { RiFingerprintFill } from 'react-icons/ri'

const DynamicMap = dynamic(() => import('@/components/RealMap'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-[#0a0a0a] text-[#8AB4F8] font-mono text-sm animate-pulse">
      Loading map...
    </div>
  ),
})

export default function LoginPage() {
  const router = useRouter()
  const { setSession } = useAuth()
  const { isMapOpen, setIsMapOpen, pathSegments, handleMapPinClick } = useLocationFilter()

  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [guestLoading, setGuestLoading] = useState(false)

  const persistAndGo = (payload: {
    sessionId: string
    userId: string
    username: string
    roles?: string[]
    location?: string
    loginAt?: string
    isGuest?: boolean
  }) => {
    setSession({
      sessionId: payload.sessionId,
      userId: payload.userId,
      username: payload.username,
      roles: Array.isArray(payload.roles) ? payload.roles : [],
      location: payload.location || 'India',
      loginAt: payload.loginAt || new Date().toISOString(),
      isGuest: !!payload.isGuest,
    })
    router.replace('/sessions')
  }

  const handleFingerprintLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!username.trim()) {
      setError('Username is required')
      return
    }

    setLoading(true)
    try {
      const locationFilter = getViewLocationFilter(pathSegments)
      const challengeRes = await fetch('/api/auth/login-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          ...locationFilter,
        }),
      })
      const challengeResult = await challengeRes.json()
      if (!challengeRes.ok) {
        setError(challengeResult.error || 'Failed to start authentication')
        return
      }

      const authResult = await startAuthentication({
        optionsJSON: challengeResult.options,
      })

      const verifyRes = await fetch('/api/auth/login-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: challengeResult.userId,
          cred: authResult,
        }),
      })
      const verifyResult = await verifyRes.json()
      if (!verifyRes.ok) {
        setError(verifyResult.error || 'Authentication failed')
        return
      }

      persistAndGo(verifyResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGuestLogin = async () => {
    setError('')
    setGuestLoading(true)
    try {
      const res = await fetch('/api/auth/guest-login', { method: 'POST' })
      const result = await res.json()
      if (!res.ok) {
        setError(result.error || 'Guest login failed')
        return
      }
      persistAndGo({ ...result, isGuest: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Guest login failed')
    } finally {
      setGuestLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#131314] flex flex-col">
      <div className="w-full flex items-center justify-between h-13 border-b border-[#3c4043] bg-[#131314] px-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#8AB4F8]/20 flex items-center justify-center">
            <FiShield className="w-5 h-5 text-[#8AB4F8]" />
          </div>
          <div>
            <p className="text-[#e8eaed] font-mono text-xl leading-none">Signal-X</p>
            <p className="text-xs text-[#9aa0a6] mt-0.5">Sign in to continue</p>
          </div>
        </div>
      </div>

      {isMapOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-[#131314] w-[95vw] h-[94vh] border-2 border-[#3c4043] rounded-2xl flex flex-col shadow-2xl overflow-hidden relative">
            <div className="h-12 border-b border-[#3c4043] bg-black flex items-center justify-between px-5 z-10 shrink-0">
              <h2 className="text-[#8AB4F8] font-mono text-lg flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                Global Signal Radar
              </h2>
              <button
                type="button"
                onClick={() => setIsMapOpen(false)}
                className="text-[#9aa0a6] hover:text-white transition-colors font-bold text-xl"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 relative z-0">
              <DynamicMap
                signals={MAP_SIGNALS}
                pathSegments={pathSegments}
                onPinClick={handleMapPinClick}
              />
            </div>
          </div>
        </div>
      )}

      <div className="w-full relative font-sans z-[55]">
        <LocationBar />
      </div>

      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-md bg-[#131314] border border-[#3c4043] rounded-xl shadow-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-[#3c4043] bg-gradient-to-r from-[#8AB4F8]/10 to-transparent">
            <h1 className="text-lg font-medium text-[#e8eaed]">Operator Login</h1>
            <p className="text-xs text-[#9aa0a6] mt-1">
              Select location, enter username, then authenticate with fingerprint.
            </p>
          </div>

          <form onSubmit={handleFingerprintLogin} className="p-6 space-y-5">
            <div>
              <label
                htmlFor="login-username"
                className="block text-sm font-medium text-[#e8eaed] mb-2"
              >
                Username
              </label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9aa0a6]" />
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="IAM username"
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-[#3c4043] bg-[#202124] text-[#e8eaed] placeholder-[#9aa0a6] focus:outline-none focus:ring-2 focus:ring-[#8AB4F8]"
                />
              </div>
            </div>

            {error && <p className="text-sm text-[#f28b82]">{error}</p>}

            <button
              type="submit"
              disabled={loading || guestLoading}
              className="w-full py-3 px-4 rounded-lg bg-[#8AB4F8] hover:bg-[#aecbfa] text-[#202124] font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <RiFingerprintFill className={`h-5 w-5 ${loading ? 'animate-pulse' : ''}`} />
              {loading ? 'Authenticating...' : 'Login with Fingerprint'}
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#3c4043]" />
              <span className="text-xs text-[#5f6368]">or</span>
              <div className="flex-1 h-px bg-[#3c4043]" />
            </div>

            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={loading || guestLoading}
              className="w-full py-3 px-4 rounded-lg border border-[#3c4043] text-[#8AB4F8] hover:bg-[#202124] font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FiKey className="h-4 w-4" />
              {guestLoading ? 'Entering...' : 'Guest Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
