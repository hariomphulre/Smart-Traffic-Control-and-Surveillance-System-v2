'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useRouter } from 'next/navigation'
import { FiLogOut, FiMoon, FiSun } from 'react-icons/fi'

export default function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const { session, isAuthenticated, logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.replace('/login')
  }

  return (
    <nav className="bg-white dark:bg-[#131314] border-b border-[#dadce0] dark:border-[#3c4043] sticky top-0 z-60">
      <div className="max-w-full max-h-100 px-4">
        <div className="flex min-h-13 justify-between">
          <div className="flex items-center">
            <div className="flex flex-col sm:flex-row sm:gap-3 gap-1 sm:mb-0 mb-1 text-[#5f6368] dark:text-[#9aa0a6] transition-colors">
              <Link href="/sessions">
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
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-[#f8f9fa] dark:hover:bg-[#35363a] rounded-lg transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <FiMoon className="w-5 h-5 text-[#669DF6] dark:text-[#669DF6]" />
              ) : (
                <FiSun className="w-5 h-5 text-[#669DF6]" />
              )}
            </button>
            {isAuthenticated && (
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 hover:bg-[#f8f9fa] dark:hover:bg-[#35363a] rounded-lg transition-colors text-[#9aa0a6] hover:text-[#8AB4F8]"
                aria-label="Sign out"
                title="Sign out"
              >
                <FiLogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
