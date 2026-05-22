'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { FiChevronDown, FiTruck, FiShield } from 'react-icons/fi'

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

  if (items.length === 0 && !dropdowns) return null

  return (
    <nav className="bg-white dark:bg-[#292a2d] border-b border-[#dadce0] dark:border-[#3c4043] relative">
      <div className="max-w-full px-4">
        <div className="flex items-center gap-1 overflow-x-auto overflow-visible py-2">
          {/* Regular nav items */}
          {items.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded transition-colors ${
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
              <div key={dropdownName} className="relative">
                <button
                  onMouseEnter={() => setOpenDropdown(dropdownName)}
                  onMouseLeave={() => setOpenDropdown(null)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium whitespace-nowrap text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#f8f9fa] dark:hover:bg-[#35363a] rounded transition-colors"
                >
                  {dropdownName}
                  <FiChevronDown className={`w-4 h-4 transition-transform ${openDropdown === dropdownName ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown menu - overlay */}
                {openDropdown === dropdownName && (
                  <div
                    onMouseEnter={() => setOpenDropdown(dropdownName)}
                    onMouseLeave={() => setOpenDropdown(null)}
                    className="absolute left-0 top-full mt-1 w-64 bg-white dark:bg-[#35363a] border border-[#dadce0] dark:border-[#3c4043] rounded-lg shadow-xl py-2 z-[9999]"
                  >
                    {dropdownItems.map((item, idx) => (
                      <Link
                        key={item.path}
                        href={item.path}
                        className={`flex items-start gap-3 px-4 py-3 text-sm whitespace-nowrap transition-colors ${
                          pathname === item.path
                            ? 'text-[#1a73e8] dark:text-[#8ab4f8] bg-[#e8f0fe] dark:bg-[#1a73e8]/10'
                            : 'text-[#202124] dark:text-[#e8eaed] hover:bg-[#f8f9fa] dark:hover:bg-[#3c4043]'
                        }`}
                      >
                        <div className="pt-0.5">
                          {item.name.includes('Ambulance') ? (
                            <FiTruck className="w-5 h-5 text-red-500" />
                          ) : (
                            <FiShield className="w-5 h-5 text-orange-500" />
                          )}
                        </div>
                        <div className="leading-tight">
                          <div className="font-medium">{item.name.replace('🚑 ', '').replace('🚒 ', '')}</div>
                          <div className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">{idx === 0 ? 'Ambulance routing & hospital access' : 'Fire brigade routing & station access'}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </nav>
  )
}
