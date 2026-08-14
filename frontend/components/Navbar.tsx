'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

export default function Navbar() {
  const { session, isAuthenticated } = useAuth()

  return (
    <nav className="bg-white dark:bg-[#131314] border-b border-[#dadce0] dark:border-[#3c4043] sticky top-0 z-60">
      <div className="max-w-full max-h-100 px-4">
        <div className="flex min-h-13 justify-between">
          <div className="flex items-center">
            <div className="flex flex-col sm:flex-row sm:gap-3 gap-1 sm:mb-0 mb-1 text-[#5f6368] dark:text-[#9aa0a6] transition-colors">
              <Link href="/analytics">
                <div className="hover:text-[#202124] dark:hover:text-[#e8eaed] transition-colors text-xl sm:mt-0 mt-2 font-medium min-w-21">
                  Signal-X
                </div>
              </Link>
              <div className="text-lg font-light">
                Adv. Traffic Control, Surveillance & Emergency Response System
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && session && (
              <span className="hidden md:inline text-sm text-[#9aa0a6] mr-1">
                {session.username}
              </span>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
