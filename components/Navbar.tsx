'use client'

import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo/Brand */}
          <Link href="/" className="text-2xl font-bold hover:text-blue-200 transition-colors">
            Adv. Traffic Control & Surveillance System
          </Link>
        </div>
      </div>
    </nav>
  )
}

