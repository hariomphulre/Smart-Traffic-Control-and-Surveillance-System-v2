'use client'

import { useAuth } from '@/context/AuthContext'
import { usePathname, useRouter } from 'next/navigation'
import React, { useEffect } from 'react'

const PUBLIC_PATHS = ['/login']

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  )

  useEffect(() => {
    if (loading) return
    if (!isAuthenticated && !isPublic) {
      router.replace('/login')
    }
    if (isAuthenticated && pathname === '/login') {
      router.replace('/analytics')
    }
  }, [loading, isAuthenticated, isPublic, pathname, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#131314]">
        <div className="w-8 h-8 border-4 border-[#3c4043] border-t-[#8AB4F8] rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated && !isPublic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#131314]">
        <div className="w-8 h-8 border-4 border-[#3c4043] border-t-[#8AB4F8] rounded-full animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}
