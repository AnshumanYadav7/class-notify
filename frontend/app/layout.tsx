import type { Metadata } from 'next'
// Import the futuristic, minimal fonts from Google
import { Orbitron, Exo_2 } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from './theme-provider'

// Configure the fonts with weights and variables
const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-orbitron',
})

const exo2 = Exo_2({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  variable: '--font-exo2',
})

export const metadata: Metadata = {
  title: 'ASU Class Tracker',
  description: 'Real-time seat availability checker.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${orbitron.variable} ${exo2.variable} font-body bg-light-background dark:bg-dark-background transition-colors duration-300`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}