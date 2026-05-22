'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import EmergencyDashboard from '@/components/emergency/EmergencyDashboard'

export default function AmbulanceSimulationPage() {
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem('emergency_driver')
    if (!stored) {
      router.push('/emergency-response/sign-in')
      return
    }
    try {
      const d = JSON.parse(stored)
      if (d.vehicleType !== 'ambulance') router.push('/emergency-response/sign-in')
    } catch {
      router.push('/emergency-response/sign-in')
    }
  }, [router])

  return (
    <div className="fixed inset-0 z-50 bg-[#0B1220]">
      <EmergencyDashboard defaultRole="emergency-ambulance" />
    </div>
  )
}
