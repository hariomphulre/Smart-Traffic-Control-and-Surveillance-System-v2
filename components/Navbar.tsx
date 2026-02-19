'use client'

import Link from 'next/link'
import { useTheme } from '@/context/ThemeContext'
import { FiSun, FiMoon } from 'react-icons/fi'

export default function Navbar() {
  const { theme, toggleTheme } = useTheme()

  return (
    <nav className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 transition-colors">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo/Brand */}
          <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            Traffic Control & Surveillance
          </Link>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <FiMoon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            ) : (
              <FiSun className="w-5 h-5 text-gray-300" />
            )}
          </button>
        </div>
      </div>
    </nav>
  )
}

