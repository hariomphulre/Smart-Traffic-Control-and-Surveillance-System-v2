import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import AppShell from '@/components/AppShell'
import { ThemeProvider } from '@/context/ThemeContext'

const inter = Inter({ subsets: ['latin'] })
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  )
}
