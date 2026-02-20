import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from './components/ThemeProvider'
import FloatingDarkModeButton from './components/FloatingDarkModeButton'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Auth System',
  description: 'Secure authentication system with Next.js and FastAPI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <ThemeProvider>
          <div className="min-h-screen bg-primary-bg dark:bg-dark-bg transition-colors duration-300">
            {children}
            <FloatingDarkModeButton />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
