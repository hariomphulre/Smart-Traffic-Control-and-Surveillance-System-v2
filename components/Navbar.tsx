'use client'

import Link from 'next/link'
import { useTheme } from '@/context/ThemeContext'
import { FiSun, FiMoon, FiMenu } from 'react-icons/fi'

export default function Navbar() {
  const { theme, toggleTheme } = useTheme()

  return (
    <nav className="bg-white dark:bg-[#202124] border-b border-[#dadce0] dark:border-[#3c4043] sticky top-0 z-50">
      <div className="max-w-full px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo/Brand */}
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-[#f8f9fa] dark:hover:bg-[#35363a] rounded-lg transition-colors">
              <FiMenu className="w-5 h-5 text-[#5f6368] dark:text-[#9aa0a6]" />
            </button>
            <Link href="/" className="flex items-center gap-2 text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#202124] dark:hover:text-[#e8eaed] transition-colors">
              <span className="text-sm font-medium">Smart Traffic Control System</span>
            </Link>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-[#f8f9fa] dark:hover:bg-[#35363a] rounded-lg transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <FiMoon className="w-5 h-5 text-[#5f6368] dark:text-[#9aa0a6]" />
              ) : (
                <FiSun className="w-5 h-5 text-[#9aa0a6]" />
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

