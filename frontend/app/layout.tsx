import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import SecondaryNavbar from '@/components/SecondaryNavbar'
import { ThemeProvider } from '@/context/ThemeContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Signal-X',
  description: 'Adv. Traffic Control, Surveillance & Emergency Response System',
  icons: {
    icon: '/signal-x.png',
    shortcut: '/signal-x.png',
    apple: '/signal-x.png',
    other: [
      { rel: 'icon', url: '/signal-x.png', sizes: '16x16' },
      { rel: 'icon', url: '/signal-x.png', sizes: '32x32' },
      { rel: 'mask-icon', url: '/signal-x.png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Signal-X',
  },
  applicationName: 'Signal-X',
}

const secondaryNavItems = [
  { name: 'Analytics', path: '/analytics' },
  { name: 'Logs', path: '/logs' },
  { name: 'Challan Records', path: '/challan-records' },
  { name: 'Accident/Fire Reports', path: '/accident-reports' },
  // { name: 'Simulation', path: '/simulation' },
  { name: 'Images', path: '/images' },
]

const secondaryNavDropdowns = {
  'Simulation': [
    { name: 'Surveillance', path: '/simulation/surveillance'},
    { name: 'Traffic Signal', path: '/simulation/traffic-signal'}
  ],
  'Emergency Response': [
    { name: 'Ambulance', path: '/emergency-response/ambulance/simulation' },
    { name: 'Fire brigade', path: '/emergency-response/fire-brigade/simulation' },
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

