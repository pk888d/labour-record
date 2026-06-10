import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/sidebar'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Mustearly — Compliance Manager',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={geist.className} style={{ background: '#0d1117', color: '#c8d8e8', margin: 0 }}>
        <div className="flex min-h-screen">
          <div className="print:hidden"><Sidebar /></div>
          <main className="flex-1 overflow-auto print:w-full">{children}</main>
        </div>
      </body>
    </html>
  )
}
