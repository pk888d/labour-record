'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { section: 'Workspace', items: [
    { href: '/dashboard', label: 'Dashboard', icon: '▦' },
    { href: '/cycles', label: 'Monthly Cycles', icon: '↻' },
    { href: '/calendar', label: 'Calendar', icon: '🗓' },
  ]},
  { section: 'Masters', items: [
    { href: '/establishments', label: 'Establishments', icon: '🏢' },
    { href: '/employees', label: 'Employees', icon: '👥' },
    { href: '/holidays', label: 'Holidays', icon: '📅' },
  ]},
  { section: 'Output', items: [
    { href: '/exports', label: 'Exports', icon: '↓' },
  ]},
  { section: 'System', items: [
    { href: '/audit', label: 'Audit Log', icon: '🛡' },
    { href: '/settings', label: 'Settings', icon: '⚙' },
  ]},
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-48 min-h-screen bg-[var(--ts-navy-mid)] border-r border-[var(--ts-border)] flex flex-col">
      <div className="flex items-center gap-2 px-4 py-4 border-b border-[var(--ts-border)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/tech-sakthi-logo.webp" alt="Tech Sakthi" className="w-8 h-8 object-contain" />
        <div>
          <p className="text-sm font-bold text-[var(--ts-gold)]" style={{ fontFamily: 'var(--font-heading)' }}>Mustearly</p>
          <p className="text-[10px] text-[var(--ts-text-muted)] mt-0.5">by Tech Sakthi</p>
        </div>
      </div>
      <nav className="flex-1 py-2">
        {navItems.map((group) => (
          <div key={group.section}>
            <p className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-widest text-[var(--ts-text-muted)]">
              {group.section}
            </p>
            {group.items.map((item) => {
              const active = pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 mx-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors',
                    active
                      ? 'bg-[var(--ts-navy-light)] text-[var(--ts-gold)] font-semibold border-l-2 border-[var(--ts-gold)]'
                      : 'text-[var(--ts-text-secondary)] hover:bg-[var(--ts-navy-light)] hover:text-[var(--ts-text-primary)]'
                  )}
                >
                  <span className="w-3.5 text-center">{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>
    </aside>
  )
}
