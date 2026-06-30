'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { FaFireAlt, FaPlusSquare } from 'react-icons/fa'
import { LuCctv } from 'react-icons/lu'
import { TbTrafficLights } from 'react-icons/tb'

interface SecondaryNavItem {
  name: string
  path: string
}

interface DropdownItem {
  name: string
  path: string
}

interface SecondaryNavbarProps {
  items: SecondaryNavItem[]
  dropdowns?: { [key: string]: DropdownItem[] }
}

export default function SecondaryNavbar({ items, dropdowns }: SecondaryNavbarProps) {
  const pathname = usePathname()
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isDropdownActive = (dropdownItems: DropdownItem[]) => {
    const basePath = dropdownItems[0]?.path.split('/').slice(0, 2).join('/')

    if (!basePath) return false

    return pathname === basePath || pathname.startsWith(`${basePath}/`)
  }

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  const openMenu = (name: string) => {
    clearCloseTimer()
    setOpenDropdown(name)
  }

  const closeMenuWithDelay = () => {
    clearCloseTimer()
    closeTimerRef.current = setTimeout(() => {
      setOpenDropdown(null)
    }, 140)
  }

  useEffect(() => () => clearCloseTimer(), [])

  if (items.length === 0 && !dropdowns) return null

  return (
    <nav className="relative border-b border-[#dadce0] bg-white dark:border-[#3c4043] dark:bg-[#131314]">
      <div className="flex max-w-full px-4">
        <div className="flex flex-wrap items-center gap-1 overflow-visible py-1.5">
          {/* Regular nav items */}
          {items.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`shrink-0 rounded px-4 py-[7px] text-sm font-medium whitespace-nowrap transition-colors ${
                pathname === item.path
                  ? 'text-[#1a73e8] dark:text-[#8ab4f8] bg-[#e8f0fe] dark:bg-[#1a73e8]/10'
                  : 'text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f8f9fa] dark:hover:bg-[#35363a]'
              }`}
            >
              {item.name}
            </Link>
          ))}

          {/* Dropdown items */}
          {dropdowns &&
            Object.entries(dropdowns).map(([dropdownName, dropdownItems]) => (
              <div
                key={dropdownName}
                className="relative shrink-0"
                onMouseEnter={() => openMenu(dropdownName)}
                onMouseLeave={closeMenuWithDelay}
              >
                <button
                  type="button"
                  className={`flex items-center gap-2 rounded px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                    isDropdownActive(dropdownItems)
                      ? 'bg-[#e8f0fe] text-[#1a73e8] dark:bg-[#1a73e8]/10 dark:text-[#8ab4f8]'
                      : 'text-[#5f6368] hover:bg-[#f8f9fa] dark:text-[#9aa0a6] dark:hover:bg-[#35363a]'
                  }`}
                  aria-haspopup="menu"
                  aria-expanded={openDropdown === dropdownName}
                >
                  {dropdownName}
                </button>

                <div
                  onMouseEnter={() => openMenu(dropdownName)}
                  onMouseLeave={closeMenuWithDelay}
                  className={`absolute left-0 top-full z-[9999] mt-1 w-44 rounded-lg border border-[#dadce0] bg-white shadow-xl transition-all duration-100 dark:border-[#3c4043] dark:bg-[#35363a] ${
                    openDropdown === dropdownName
                      ? 'visible translate-y-0 opacity-100 pointer-events-auto'
                      : 'invisible -translate-y-1 opacity-0 pointer-events-none'
                  }`}
                  role="menu"
                >
                  {dropdownItems.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`flex items-start gap-0 px-4 py-3 text-sm whitespace-nowrap transition-colors ${
                        pathname === item.path
                          ? 'bg-[#e8f0fe] text-[#1a73e8] dark:bg-[#1a73e8]/10 dark:text-[#8ab4f8]'
                          : 'text-[#202124] hover:text-[#1a73e8] dark:text-[#e8eaed] dark:hover:text-[#8ab4f8] hover:bg-[#1a73e8]/10'
                      }`}
                      role="menuitem"
                    >
                      <div className="">
                        {item.path.includes('ambulance') && ( <FaPlusSquare className="h-4 w-4 hover:text-[#1a73e8] dark:hover:text-[#8ab4f8] mr-3" />)}
                        {item.path.includes('fire-brigade') && ( <FaFireAlt className="h-4 w-4 hover:text-[#1a73e8] dark:hover:text-[#8ab4f8] mr-3" />)}
                        {item.path.includes('surveillance') && ( <LuCctv className="h-4 w-4 hover:text-[#1a73e8] dark:hover:text-[#8ab4f8] mr-3" />)}
                        {item.path.includes('traffic-signal') && ( <TbTrafficLights className="h-4 w-4 hover:text-[#1a73e8] dark:hover:text-[#8ab4f8] mr-3" />)}
                      </div>
                      <div className="leading-tight">
                        <div className="font-medium">{item.name}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </nav>
  )
}
