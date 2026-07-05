'use client'
import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { TopNav } from '@/components/top-nav'

/**
 * App chrome (sidebar + top nav) for regular pages.
 * The /login screen is standalone and renders without the shell.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname === '/login') {
    return <>{children}</>
  }
  return (
    <div className="flex min-h-screen">
      <div className="print:hidden"><Sidebar /></div>
      <main className="flex-1 overflow-auto print:w-full flex flex-col min-w-0">
        <TopNav />
        <div className="flex-1 min-h-0">{children}</div>
      </main>
    </div>
  )
}
