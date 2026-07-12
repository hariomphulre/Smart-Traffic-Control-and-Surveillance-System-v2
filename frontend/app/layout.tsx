import type { Metadata } from 'next'
import { Inter,JetBrains_Mono } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import SecondaryNavbar from '@/components/SecondaryNavbar'
import { ThemeProvider } from '@/context/ThemeContext'
import { LocationFilterProvider } from '@/context/LocationFilterContext'
import Sidebar from '@/components/Sidebar'

const inter = Inter({ subsets: ['latin'] })
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

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
  { name: 'Surveillance', path: '/simulation/surveillance' },
  { name: 'Logs', path: '/logs' },
  { name: 'Challan Records', path: '/challan-records' },
  { name: 'Accident/Fire Reports', path: '/accident-reports' },
  { name: 'Images', path: '/images' },
  { name: 'Signal Simulation', path: '/simulation/traffic-signal' },
]

const secondaryNavDropdowns = {
  // 'Simulation': [
  //   { name: 'Surveillance', path: '/simulation/surveillance'},
  //   { name: 'Traffic Signal', path: '/simulation/traffic-signal'}
  // ],
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
    <html lang="en" suppressHydrationWarning className={jetbrainsMono.variable}>
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
          {/* <LocationFilterProvider>
            <div className=""><Navbar /></div>
            
            <div className="flex flex-row">
              <Sidebar/>
              <div className="w-full">
                <SecondaryNavbar items={secondaryNavItems} dropdowns={secondaryNavDropdowns} />
                <main className="min-h-screen transition-colors">
                  {children}
                </main>
              </div>
            </div>
          </LocationFilterProvider> */}
          <LocationFilterProvider>
            <div className="fixed top-0 left-0 right-0 z-50">
              <Navbar />
            </div>

            <div className="min-[1150px]:hidden pt-13 min-h-screen flex items-center justify-center px-6 bg-[#f8f9fa] dark:bg-[#131314]">
              <p className="max-w-md text-center text-base sm:text-lg font-medium text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed">
                This website is designed for laptops, and desktop computers.
              </p>
            </div>

            <div className="hidden min-[1150px]:block">
              <div className="fixed left-0 top-13 bottom-0">
                <Sidebar />
              </div>

              <div className="ml-12 pt-13 h-screen flex flex-col">
                <div className="sticky top-0 z-40">
                  <SecondaryNavbar items={secondaryNavItems} dropdowns={secondaryNavDropdowns} />
                </div>

                <main className="flex-1 overflow-y-auto">
                  {children}
                </main>
              </div>
            </div>

          </LocationFilterProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

