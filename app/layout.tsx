import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import SecondaryNavbar from '@/components/SecondaryNavbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Traffic Management Platform',
  description: 'Comprehensive traffic management and monitoring system',
}

const secondaryNavItems = [
  { name: 'Analytics', path: '/analytics' },
  { name: 'Logs', path: '/logs' },
  { name: 'Challan Records', path: '/challan-records' },
  { name: 'Accident/Fire Reports', path: '/accident-reports' },
  { name: 'Images', path: '/images' },
]

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <SecondaryNavbar items={secondaryNavItems} />
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
      </body>
    </html>
  )
}

