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
    <nav className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 transition-colors">
      <div className="container mx-auto px-4">
        <div className="flex space-x-1 overflow-x-auto py-3">
          {items.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`px-4 py-2 rounded-md whitespace-nowrap transition-all text-sm font-medium ${
                pathname === item.path
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
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
