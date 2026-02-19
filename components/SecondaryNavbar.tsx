'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SecondaryNavItem {
  name: string
  path: string
}

interface SecondaryNavbarProps {
  items: SecondaryNavItem[]
}

export default function SecondaryNavbar({ items }: SecondaryNavbarProps) {
  const pathname = usePathname()

  if (items.length === 0) return null

  return (
    <nav className="bg-white dark:bg-[#292a2d] border-b border-[#dadce0] dark:border-[#3c4043]">
      <div className="max-w-full px-4">
        <div className="flex items-center gap-1 overflow-x-auto py-2">
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
        </div>
      </div>
    </nav>
  )
}
