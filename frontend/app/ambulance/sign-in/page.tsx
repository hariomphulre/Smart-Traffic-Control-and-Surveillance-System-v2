'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FiTruck } from 'react-icons/fi'

const DRIVER_STORAGE_KEY = 'ambulance_driver'

export default function AmbulanceSignIn() {
  const router = useRouter()
  const [driverId, setDriverId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!driverId.trim() || !password.trim()) {
      setError('Please enter driver ID and password')
      return
    }

    // Demo auth: accept any non-empty credentials
    const driver = {
      id: driverId.trim(),
      name: `Driver ${driverId}`,
      signedInAt: new Date().toISOString(),
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(DRIVER_STORAGE_KEY, JSON.stringify(driver))
    }
    router.push('/ambulance/driver')
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="gcloud-card p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[#fce8e6] dark:bg-[#ea4335]/20 flex items-center justify-center mb-4">
            <FiTruck className="w-8 h-8 text-[#d93025] dark:text-[#f28b82]" />
          </div>
          <h1 className="text-xl font-medium text-[#202124] dark:text-[#e8eaed]">
            Ambulance Driver Sign In
          </h1>
          <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] mt-1">
            Emergency vehicle routing & signal control
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="driverId"
              className="block text-sm font-medium text-[#202124] dark:text-[#e8eaed] mb-2"
            >
              Driver ID
            </label>
            <input
              id="driverId"
              type="text"
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              placeholder="e.g. AMB-001"
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
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-sm text-[#d93025] dark:text-[#f28b82]">{error}</p>
          )}

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-lg bg-[#1a73e8] hover:bg-[#1557b0] dark:bg-[#8ab4f8] dark:hover:bg-[#aecbfa] text-white dark:text-[#202124] font-medium transition-colors"
          >
            Sign In
          </button>
        </form>

        <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mt-6 text-center">
          Demo: Use any driver ID and password to sign in.
        </p>
      </div>
    </div>
  )
}
