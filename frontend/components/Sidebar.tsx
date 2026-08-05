'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CgMenuGridR } from 'react-icons/cg'
import { IoMdListBox } from 'react-icons/io'
import { MdOutlineMonitor } from 'react-icons/md'
import { RiKeyFill, RiShieldUserFill } from 'react-icons/ri'
import type { IconType } from 'react-icons'

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

  return (
    <div className="h-full w-12 border-r dark:border-[#3c4043] dark:bg-[#131314]">
      <div className="flex pr-0.5 h-[48.99px] border-b dark:border-[#3c4043] items-center justify-center">
        <CgMenuGridR className="h-8 w-8 text-gray-300" />
      </div>
      <div className="flex justify-center">
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
                isActive
                  ? 'text-[#8AB4F8]'
                  : 'text-[#9aa0a6] group-hover:text-white'
              }`

              return (
                <li key={title}>
                  {href ? (
                    <Link href={href} title={title} className={className}>
                      <Icon className={iconClassName} />
                    </Link>
                  ) : (
                    <button type="button" title={title} className={`${className} w-full cursor-default`}>
                      <Icon className={iconClassName} />
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </div>
  )
}

export default Sidebar
