import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import SecondaryNavbar from '@/components/SecondaryNavbar'
import { ThemeProvider } from '@/context/ThemeContext'

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
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <Navbar />
          <SecondaryNavbar items={secondaryNavItems} />
          <main className="min-h-screen transition-colors">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}

