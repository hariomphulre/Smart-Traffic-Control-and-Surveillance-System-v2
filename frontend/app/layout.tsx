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
  icons: {
    icon: '/icon/favicon.ico',
    shortcut: '/icon/favicon.ico',
    apple: '/icon/apple-touch-icon.png',
    other: [
      { rel: 'icon', url: '/icon/favicon-16x16.png', sizes: '16x16' },
      { rel: 'icon', url: '/icon/favicon-32x32.png', sizes: '32x32' },
      { rel: 'mask-icon', url: '/icon/favicon.ico' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Traffic Management Platform',
  },
  applicationName: 'Traffic Management Platform',
}

const secondaryNavItems = [
  { name: 'Analytics', path: '/analytics' },
  { name: 'Logs', path: '/logs' },
  { name: 'Challan Records', path: '/challan-records' },
  { name: 'Accident/Fire Reports', path: '/accident-reports' },
  { name: 'Simulation', path: '/simulation' },
  { name: 'Images', path: '/images' },
]

const secondaryNavDropdowns = {
  'Emergency Response': [
    { name: 'Ambulance', path: '/emergency-response/ambulance/simulation' },
    { name: 'Fire Brigade', path: '/emergency-response/fire-brigade/simulation' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const dark = theme === 'dark' || (!theme && prefersDark);
                if (dark) document.documentElement.classList.add('dark');
                else document.documentElement.classList.remove('dark');
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <Navbar />
          <SecondaryNavbar items={secondaryNavItems} dropdowns={secondaryNavDropdowns} />
          <main className="min-h-screen transition-colors">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}

