import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/sidebar'
import { TopNav } from '@/components/top-nav'

const inter = Inter({ subsets: ['latin'], variable: '--font-body' })
const poppins = Poppins({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-heading' })

export const metadata: Metadata = {
  title: 'Mustearly — Compliance Manager',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${poppins.variable}`} style={{ margin: 0, fontFamily: 'var(--font-body)' }}>
        <div className="flex min-h-screen">
          <div className="print:hidden"><Sidebar /></div>
          <main className="flex-1 overflow-auto print:w-full flex flex-col min-w-0">
            <TopNav />
            <div className="flex-1 min-h-0">{children}</div>
          </main>
        </div>
      </body>
    </html>
  )
}
