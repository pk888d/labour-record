'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { section: 'Workspace', items: [
    { href: '/cycles', label: 'Monthly Cycles', icon: '↻' },
  ]},
  { section: 'Masters', items: [
    { href: '/establishments', label: 'Establishments', icon: '🏢' },
    { href: '/employees', label: 'Employees', icon: '👥' },
    { href: '/holidays', label: 'Holidays', icon: '📅' },
    { href: '/wage-rules', label: 'Wage Rules', icon: '⚙️' },
  ]},
  { section: 'Output', items: [
    { href: '/exports', label: 'Exports', icon: '↓' },
  ]},
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-48 min-h-screen bg-[#0f1923] border-r border-[#1e2d3d] flex flex-col">
      <div className="px-4 py-4 border-b border-[#1e2d3d]">
        <p className="text-sm font-bold text-white">LabourRecord</p>
        <p className="text-[10px] text-[#4a6a8a] mt-0.5">Compliance Manager</p>
      </div>
      <nav className="flex-1 py-2">
        {navItems.map((group) => (
          <div key={group.section}>
            <p className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-widest text-[#4a6a8a]">
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
                    'flex items-center gap-2 mx-1.5 px-3 py-1.5 rounded text-xs',
                    active
                      ? 'bg-[#1a3050] text-[#4a9eff] font-semibold'
                      : 'text-[#7a9ab8] hover:bg-[#1a2a3a] hover:text-[#c8d8e8]'
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
