'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { startAuthentication } from '@simplewebauthn/browser'
import { FiKey, FiShield } from 'react-icons/fi'

const SESSION_STORAGE_KEY = 'signalx_session'

export default function LoginPage() {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!userId.trim()) {
        setError('Please enter your User ID')
        return
      }

      const challengeRes = await fetch('/api/auth/login-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId.trim() }),
      })

      const challengeResult = await challengeRes.json()
      if (!challengeRes.ok) {
        setError(challengeResult.error || 'Failed to start authentication')
        return
      }

      const authResult = await startAuthentication({ optionsJSON: challengeResult.options })

      const verifyRes = await fetch('/api/auth/login-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId.trim(), cred: authResult }),
      })

      const verifyResult = await verifyRes.json()
      if (!verifyRes.ok) {
        setError(verifyResult.error || 'Authentication failed')
        return
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify({
            sessionId: verifyResult.sessionId,
            userId: verifyResult.userId,
            username: verifyResult.username,
            loginAt: new Date().toISOString(),
          })
        )
      }

      setSuccess(true)
      setTimeout(() => router.push('/sessions'), 1200)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Something went wrong during login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="gcloud-card p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[#e8f0fe] dark:bg-[#669DF6]/20 flex items-center justify-center mb-4">
            <FiShield className="w-8 h-8 text-[#1a73e8] dark:text-[#8ab4f8]" />
          </div>
          <h1 className="text-xl font-medium text-[#202124] dark:text-[#e8eaed]">
            Sign In to Signal-X
          </h1>
          <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] mt-1 text-center">
            Authenticate with your registered passkey
          </p>
        </div>

        {success ? (
          <div className="text-center py-6">
            <p className="text-[#1e8e3e] dark:text-[#81c995] font-medium">Login successful!</p>
            <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] mt-2">Redirecting to sessions...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="userId"
                className="block text-sm font-medium text-[#202124] dark:text-[#e8eaed] mb-2"
              >
                User ID
              </label>
              <input
                id="userId"
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="e.g. user_1730..."
                className="w-full px-4 py-3 rounded-lg border border-[#dadce0] dark:border-[#3c4043] bg-white dark:bg-[#202124] text-[#202124] dark:text-[#e8eaed] placeholder-[#9aa0a6] focus:outline-none focus:ring-2 focus:ring-[#1a73e8] font-mono text-sm"
                autoComplete="username"
              />
              <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mt-2">
                Use the ID from signup (shown after registration).
              </p>
            </div>

            {error && (
              <p className="text-sm text-[#d93025] dark:text-[#f28b82]">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg bg-[#1a73e8] hover:bg-[#1557b0] dark:bg-[#8ab4f8] dark:hover:bg-[#aecbfa] text-white dark:text-[#202124] font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FiKey className="w-4 h-4" />
              {loading ? 'Authenticating...' : 'Authenticate with Passkey'}
            </button>
          </form>
        )}

        <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mt-6 text-center">
          No account?{' '}
          <Link href="/signup" className="text-[#1a73e8] dark:text-[#8ab4f8] hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
