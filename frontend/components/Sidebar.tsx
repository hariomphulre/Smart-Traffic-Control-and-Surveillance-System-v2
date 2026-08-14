'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { CgMenuGridR } from 'react-icons/cg'
import { IoMdListBox } from 'react-icons/io'
import { MdOutlineMonitor } from 'react-icons/md'
import { RiKeyFill, RiShieldUserFill } from 'react-icons/ri'
import { FiLogOut, FiMoon, FiSun } from 'react-icons/fi'
import type { IconType } from 'react-icons'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { FaSignOutAlt } from 'react-icons/fa'

type NavItem = {
  href?: string
  icon: IconType
  title: string
}

const navItems: NavItem[] = [
  { href: '/iam', icon: RiShieldUserFill, title: 'IAM' },
  { href: '/sessions', icon: MdOutlineMonitor, title: 'Sessions' },
  { href: '/audit-logs', icon: IoMdListBox, title: 'Audit Logs' },
  { icon: RiKeyFill, title: 'Passkeys' },
]

const Sidebar = () => {
  const pathname = usePathname()
  const router = useRouter()
  const { session, isAuthenticated, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const handleLogout = async () => {
    await logout()
    router.replace('/login')
  }

  return (
    <div className="h-full w-12 border-r dark:border-[#3c4043] dark:bg-[#131314] flex flex-col">
      <div className="flex pr-0.5 h-[48.99px] border-b dark:border-[#3c4043] items-center justify-center">
        <CgMenuGridR className="h-8 w-8 text-gray-300" />
      </div>

      <div className="flex justify-center flex-1">
        <nav className="w-full text-[#9aa0a6]">
          <ul className="flex flex-col items-stretch">
            {navItems.map(({ href, icon: Icon, title }) => {
              const isActive = !!href && (pathname === href || pathname.startsWith(`${href}/`))
              const className = `group flex items-center justify-center mt-2 py-2.5 transition-colors border-l-4 ${
                isActive
                  ? 'border-[#8AB4F8] text-[#8AB4F8] bg-gradient-to-r from-[#8AB4F8]/35 to-transparent'
                  : 'border-transparent hover:text-white'
              }`
              const iconClassName = `h-5 w-5 transition-colors ${
                isActive ? 'text-[#8AB4F8]' : 'text-[#9aa0a6] group-hover:text-white'
              }`

              return (
                <li key={title}>
                  {href ? (
                    <Link href={href} title={title} className={className}>
                      <Icon className={iconClassName} />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      title={title}
                      className={`${className} w-full cursor-default`}
                    >
                      <Icon className={iconClassName} />
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>
      </div>

      {/* Bottom actions: theme toggle + logout */}
      <div className="border-t border-[#dadce0] dark:border-[#3c4043] flex flex-col items-center gap-1">
        <button
          onClick={toggleTheme}
          className="p-2 py-3 hover:cursor-pointer rounded-lg transition-colors"
          aria-label="Toggle theme"
          title="Toggle theme"
          type="button"
        >
          {theme === 'light' ? (
            <FiMoon className="w-5 h-5 text-[#669DF6] dark:text-[#669DF6]" />
          ) : (
            <FiSun className="w-5 h-5 text-[#669DF6]" />
          )}
        </button>

        {/* Full width divider above Logout icon */}
        {isAuthenticated && (
          <div className="flex w-full py-1 border-t border-[#3c4043] items-center justify-center">
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 hover:cursor-pointer rounded-lg transition-colors text-[#9aa0a6] hover:text-red-400"
              aria-label="Sign out"
              title="Sign out"
            >
              <FaSignOutAlt className="w-4.5 h-4.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Sidebar
