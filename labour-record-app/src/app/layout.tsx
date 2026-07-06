import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import './globals.css'
import { AppShell } from '@/components/app-shell'

const inter = Inter({ subsets: ['latin'], variable: '--font-body' })
const poppins = Poppins({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-heading' })

export const metadata: Metadata = {
  title: 'Mustearly — Compliance Manager',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${poppins.variable}`} style={{ margin: 0, fontFamily: 'var(--font-body)' }}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
