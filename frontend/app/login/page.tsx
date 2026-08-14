'use client'

import { useAuth } from '@/context/AuthContext'
import { parseApiResponse } from '@/lib/parseApiResponse'
import {
  startAuthentication,
  type PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { useRouter } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'
import { RiFingerprintFill } from 'react-icons/ri'
import { GoPasskeyFill } from 'react-icons/go'
import { MdKey } from 'react-icons/md'

type AuthSuccessPayload = {
  sessionId: string
  userId: string
  username: string
  roles?: string[]
  location?: string
  loginAt?: string
  isGuest?: boolean
}

function asAuthSuccess(
  result: {
    sessionId?: string
    userId?: string
    username?: string
    roles?: string[]
    location?: string
    loginAt?: string
  },
  isGuest?: boolean
): AuthSuccessPayload | null {
  if (!result.sessionId || !result.userId || !result.username) return null
  return {
    sessionId: result.sessionId,
    userId: result.userId,
    username: result.username,
    roles: result.roles,
    location: result.location,
    loginAt: result.loginAt,
    isGuest,
  }
}

export default function LoginPage() {
  const router = useRouter()
  const { setSession } = useAuth()

  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [guestLoading, setGuestLoading] = useState(false)

  // Turnstile CAPTCHA state & ref
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [siteKey, setSiteKey] = useState(
    () => process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '',
  )
  const turnstileRef = useRef<TurnstileInstance | null>(null)

  useEffect(() => {
    // In next dev, NEXT_PUBLIC_* is already available client-side.
    // Still fetch for Docker/runtime where the key is only on the server.
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
      setSiteKey(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)
      return
    }

    let cancelled = false
    fetch('/api/turnstile/site-key')
      .then((res) => res.json())
      .then((data: { siteKey?: string }) => {
        if (!cancelled && typeof data.siteKey === 'string' && data.siteKey) {
          setSiteKey(data.siteKey)
        }
      })
      .catch(() => {
        // Leave siteKey empty; Turnstile will not render until key is available.
      })
    return () => {
      cancelled = true
    }
  }, [])

  const resetCaptcha = () => {
    setCaptchaToken(null)
    turnstileRef.current?.reset()
  }

  const persistAndGo = (payload: AuthSuccessPayload) => {
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

    if (!captchaToken) {
      setError('Please complete the CAPTCHA verification')
      return
    }

    setLoading(true)
    try {
      const challengeRes = await fetch('/api/auth/login-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          captchaToken,
        }),
      })
      const challengeResult = await parseApiResponse<{
        error?: string
        options?: PublicKeyCredentialRequestOptionsJSON
        userId?: string
      }>(challengeRes)

      if (!challengeRes.ok) {
        setError(challengeResult.error || 'Failed to start authentication')
        resetCaptcha()
        return
      }
      if (!challengeResult.options) {
        setError('Failed to start authentication')
        resetCaptcha()
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
      const verifyResult = await parseApiResponse<{
        error?: string
        sessionId?: string
        userId?: string
        username?: string
        roles?: string[]
        location?: string
        loginAt?: string
      }>(verifyRes)

      if (!verifyRes.ok) {
        setError(verifyResult.error || 'Authentication failed')
        resetCaptcha()
        return
      }

      const session = asAuthSuccess(verifyResult)
      if (!session) {
        setError('Authentication failed')
        resetCaptcha()
        return
      }
      persistAndGo(session)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      resetCaptcha()
    } finally {
      setLoading(false)
    }
  }

  const handleGuestLogin = async () => {
    setError('')

    if (!captchaToken) {
      setError('Please complete the CAPTCHA verification')
      return
    }

    setGuestLoading(true)
    try {
      const res = await fetch('/api/auth/guest-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ captchaToken }),
      })
      const result = await parseApiResponse<{
        error?: string
        sessionId?: string
        userId?: string
        username?: string
        roles?: string[]
        location?: string
        loginAt?: string
      }>(res)

      if (!res.ok) {
        setError(result.error || 'Guest login failed')
        resetCaptcha()
        return
      }
      const session = asAuthSuccess(result, true)
      if (!session) {
        setError('Guest login failed')
        resetCaptcha()
        return
      }
      persistAndGo(session)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Guest login failed')
      resetCaptcha()
    } finally {
      setGuestLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#131314] flex flex-col">
      <div className="flex items-center h-14 pl-5">
        <div className="flex flex-col sm:flex-row sm:gap-3 gap-1 sm:mb-0 mb-1 text-[#5f6368] dark:text-[#9aa0a6] transition-colors">
          <div className="hover:text-[#202124] dark:hover:text-[#e8eaed] transition-colors text-[25px] sm:mt-0 mt-2 font-medium min-w-21">
            Signal-X
          </div>
          <div className="text-xl pt-1.5 font-light">
            Adv. Traffic Control, Surveillance & Emergency Response System
          </div>
        </div>
      </div>

      {/* Screen size constraint message for small screens */}
      <div className="min-[1150px]:hidden flex-1 flex items-center justify-center px-6 bg-[#131314]">
        <p className="max-w-md text-center text-base sm:text-lg font-medium text-[#9aa0a6] leading-relaxed">
          This website is designed for laptops, and desktop computers.
        </p>
      </div>

      {/* Main content only visible on large screens */}
      <div className="hidden min-[1150px]:flex flex-1 items-center justify-center px-10 py-10 relative">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute w-300 h-170 object-cover z-0 rounded-[30] opacity-75"
        >
          <source src="/Login_background.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        <div className="relative z-10 w-full max-w-md ml-20 bg-[#131314]/80 backdrop-blur-xl border border-[#3c4043] rounded-[25] shadow-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-[#3c4043]/60">
            <h1 className="text-xl font-medium text-[#e8eaed]">IAM User Login</h1>
          </div>

          <form onSubmit={handleFingerprintLogin} className="p-6 pt-5 space-y-5">
            {/* Username Input */}
            <div>
              <div className="relative">
                <GoPasskeyFill className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-[#9aa0a6]" />
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter IAM username"
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-[#3c4043] bg-[#202124]/80 text-[#e8eaed] placeholder-[#9aa0a6] focus:outline-none focus:ring-2 focus:ring-[#8AB4F8]"
                />
              </div>
            </div>

            {/* Cloudflare Turnstile CAPTCHA UI */}
            {error && <p className="text-sm text-[#f28b82] text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading || guestLoading || !captchaToken}
              className="w-full py-3 px-4 rounded-lg border border-[#3c4043] hover:border-[#669DF6] text-[#669DF6] group hover:text-[#AECBFA] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <RiFingerprintFill className={`h-5 w-5 text-[#669DF6] group-hover:text-[#AECBFA] ${loading ? 'animate-pulse' : ''}`} />
              {loading ? 'Authenticating...' : 'Login with Fingerprint'}
            </button>

            <div className="flex justify-center my-1">
              {siteKey ? (
                <Turnstile
                  ref={turnstileRef}
                  siteKey={siteKey}
                  onSuccess={(token) => {
                    setCaptchaToken(token)
                    setError('')
                  }}
                  onExpire={() => setCaptchaToken(null)}
                  onError={() => setError('CAPTCHA verification failed')}
                  options={{
                    theme: 'dark',
                  }}
                />
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#3c4043]/60" />
              <span className="text-xs text-[#5f6368]">or</span>
              <div className="flex-1 h-px bg-[#3c4043]/60" />
            </div>

            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={loading || guestLoading || !captchaToken}
              className="w-full py-3 px-4 rounded-lg border border-[#3c4043] hover:border-[#669DF6] text-[#669DF6] group hover:text-[#AECBFA] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <MdKey className="h-5 w-5" />
              {guestLoading ? 'Request Access' : 'Guest Passkey'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )

}
