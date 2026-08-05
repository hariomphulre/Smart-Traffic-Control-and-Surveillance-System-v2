'use client'

import AuthGate from '@/components/AuthGate'
import Navbar from '@/components/Navbar'
import SecondaryNavbar from '@/components/SecondaryNavbar'
import Sidebar from '@/components/Sidebar'
import { AuthProvider } from '@/context/AuthContext'
import { LocationFilterProvider } from '@/context/LocationFilterContext'
import { usePathname } from 'next/navigation'
import React from 'react'

const secondaryNavItems = [
  { name: 'Analytics', path: '/analytics' },
  { name: 'Surveillance', path: '/simulation/surveillance' },
  { name: 'Logs', path: '/logs' },
  { name: 'Challan Records', path: '/challan-records' },
  { name: 'Accident/Fire Reports', path: '/accident-reports' },
  { name: 'Images', path: '/images' },
  { name: 'Signal Simulation', path: '/simulation/traffic-signal' },
]

const secondaryNavDropdowns = {
  'Emergency Response': [
    { name: 'Ambulance', path: '/emergency-response/ambulance/simulation' },
    { name: 'Fire brigade', path: '/emergency-response/fire-brigade/simulation' },
  ],
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLogin = pathname === '/login' || pathname.startsWith('/login/')

  return (
    <AuthProvider>
      <LocationFilterProvider>
        <AuthGate>
          {isLogin ? (
            <div className="min-h-screen bg-[#131314]">{children}</div>
          ) : (
            <>
              <div className="fixed top-0 left-0 right-0 z-50">
                <Navbar />
              </div>

              <div className="min-[1150px]:hidden pt-13 min-h-screen flex items-center justify-center px-6 bg-[#f8f9fa] dark:bg-[#131314]">
                <p className="max-w-md text-center text-base sm:text-lg font-medium text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed">
                  This website is designed for laptops, and desktop computers.
                </p>
              </div>

              <div className="hidden min-[1150px]:block">
                <div className="fixed left-0 top-13 bottom-0">
                  <Sidebar />
                </div>

                <div className="ml-12 pt-13 h-screen flex flex-col">
                  <div className="sticky top-0 z-40">
                    <SecondaryNavbar
                      items={secondaryNavItems}
                      dropdowns={secondaryNavDropdowns}
                    />
                  </div>

                  <main className="flex-1 overflow-y-auto">{children}</main>
                </div>
              </div>
            </>
          )}
        </AuthGate>
      </LocationFilterProvider>
    </AuthProvider>
  )
}
