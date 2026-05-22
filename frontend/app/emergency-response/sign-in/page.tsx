'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FiTruck, FiShield, FiArrowRight } from 'react-icons/fi'

type VehicleType = 'ambulance' | 'fire-brigade' | null

export default function EmergencyResponseSignIn() {
  const router = useRouter()
  const [step, setStep] = useState<'select' | 'login'>('select')
  const [vehicleType, setVehicleType] = useState<VehicleType>(null)
  const [driverId, setDriverId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleVehicleTypeSelect = (type: VehicleType) => {
    setVehicleType(type)
    setStep('login')
    setError('')
    setDriverId('')
    setPassword('')
  }

  const handleBackToSelect = () => {
    setStep('select')
    setError('')
  }

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
      name: `${vehicleType === 'ambulance' ? 'Ambulance' : 'Fire Brigade'} Driver ${driverId}`,
      vehicleType: vehicleType,
      signedInAt: new Date().toISOString(),
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('emergency_driver', JSON.stringify(driver))
    }

    // Route to appropriate dashboard
    const route =
      vehicleType === 'ambulance'
        ? '/emergency-response/ambulance/simulation'
        : '/emergency-response/fire-brigade/simulation'
    router.push(route)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f3460] via-[#1a1a2e] to-[#16213e] dark:from-[#0a0a0a] dark:via-[#1a1a1a] dark:to-[#0f0f0f] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {step === 'select' ? (
          // Vehicle Type Selection
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent mb-2">
                Emergency Response System
              </h1>
              <p className="text-sm text-gray-400">
                Select your vehicle type to proceed
              </p>
            </div>

            {/* Ambulance Card */}
            <button
              onClick={() => handleVehicleTypeSelect('ambulance')}
              className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-br from-[#ff6b6b] to-[#ee5a52] p-6 text-left transition-all hover:shadow-2xl hover:shadow-red-500/20 active:scale-95"
            >
              <div className="relative z-10 flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                      <FiTruck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">Ambulance</h2>
                      <p className="text-xs text-white/80">Emergency medical response</p>
                    </div>
                  </div>
                  <p className="text-sm text-white/90 mt-2">
                    Route optimization to hospitals with smart signal control
                  </p>
                </div>
                <FiArrowRight className="w-5 h-5 text-white mt-1" />
              </div>
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
            </button>

            {/* Fire Brigade Card */}
            <button
              onClick={() => handleVehicleTypeSelect('fire-brigade')}
              className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-br from-[#ffd93d] to-[#ff6b6b] p-6 text-left transition-all hover:shadow-2xl hover:shadow-yellow-500/20 active:scale-95"
            >
              <div className="relative z-10 flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                      <FiShield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">Fire Brigade</h2>
                      <p className="text-xs text-white/80">Emergency firefighting response</p>
                    </div>
                  </div>
                  <p className="text-sm text-white/90 mt-2">
                    Rapid fire station routing with adaptive traffic management
                  </p>
                </div>
                <FiArrowRight className="w-5 h-5 text-white mt-1" />
              </div>
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
            </button>

            <p className="text-xs text-gray-500 text-center mt-8">
              Smart traffic signal control system for emergency vehicles
            </p>
          </div>
        ) : (
          // Login Form
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mx-auto mb-4">
                {vehicleType === 'ambulance' ? (
                  <FiTruck className="w-7 h-7 text-white" />
                ) : (
                  <FiShield className="w-7 h-7 text-white" />
                )}
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">
                {vehicleType === 'ambulance' ? 'Ambulance' : 'Fire Brigade'} Driver
              </h1>
              <p className="text-sm text-gray-400">Emergency response sign in</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Driver ID
                  </label>
                  <input
                    type="text"
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                    placeholder={
                      vehicleType === 'ambulance' ? 'e.g. AMB-001' : 'e.g. FB-001'
                    }
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/15 transition"
                    autoComplete="username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/15 transition"
                    autoComplete="current-password"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-all active:scale-95"
                >
                  Sign In
                </button>

                <button
                  type="button"
                  onClick={handleBackToSelect}
                  className="w-full py-2 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 font-medium transition-colors border border-white/10"
                >
                  Back to Selection
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
