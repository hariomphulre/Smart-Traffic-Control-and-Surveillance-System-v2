'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FiUserPlus } from 'react-icons/fi'

export default function SignupPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const result = await response.json()
      if (!response.ok) {
        setError(result.error || 'Registration failed')
        return
      }

      router.push(`/profile/${result.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="gcloud-card p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[#e8f0fe] dark:bg-[#669DF6]/20 flex items-center justify-center mb-4">
            <FiUserPlus className="w-8 h-8 text-[#1a73e8] dark:text-[#8ab4f8]" />
          </div>
          <h1 className="text-xl font-medium text-[#202124] dark:text-[#e8eaed]">
            Create Account
          </h1>
          <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] mt-1 text-center">
            Register your identity for Signal-X IAM
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-[#202124] dark:text-[#e8eaed] mb-2"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              className="w-full px-4 py-3 rounded-lg border border-[#dadce0] dark:border-[#3c4043] bg-white dark:bg-[#202124] text-[#202124] dark:text-[#e8eaed] placeholder-[#9aa0a6] focus:outline-none focus:ring-2 focus:ring-[#1a73e8]"
              autoComplete="username"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[#202124] dark:text-[#e8eaed] mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-lg border border-[#dadce0] dark:border-[#3c4043] bg-white dark:bg-[#202124] text-[#202124] dark:text-[#e8eaed] placeholder-[#9aa0a6] focus:outline-none focus:ring-2 focus:ring-[#1a73e8]"
              autoComplete="new-password"
            />
          </div>

          {error && (
            <p className="text-sm text-[#d93025] dark:text-[#f28b82]">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg bg-[#1a73e8] hover:bg-[#1557b0] dark:bg-[#8ab4f8] dark:hover:bg-[#aecbfa] text-white dark:text-[#202124] font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mt-6 text-center">
          Already have an account?{' '}
          <Link href="/login" className="text-[#1a73e8] dark:text-[#8ab4f8] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
