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
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex space-x-1 overflow-x-auto py-3">
          {items.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`px-4 py-2 rounded-md whitespace-nowrap transition-all duration-200 text-sm font-medium ${
                pathname === item.path
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
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
