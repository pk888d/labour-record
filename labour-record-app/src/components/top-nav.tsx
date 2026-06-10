'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

function IconBtn({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex items-center justify-center w-8 h-8 rounded-lg border border-[var(--ts-border)] text-[var(--ts-text-secondary)] hover:text-[var(--ts-gold)] hover:border-[var(--ts-gold)] transition-colors"
    >
      {children}
    </button>
  )
}

export function TopNav() {
  const router = useRouter()
  return (
    <div className="ts-topnav print:hidden flex items-center gap-2 px-4 py-2 border-b border-[var(--ts-border)] bg-[var(--ts-navy-mid)] sticky top-0 z-30">
      <IconBtn onClick={() => router.back()} label="Previous page">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
      </IconBtn>
      <IconBtn onClick={() => router.forward()} label="Next page">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
      </IconBtn>
      <Link
        href="/dashboard"
        title="Home"
        aria-label="Home"
        className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[var(--ts-border)] text-[var(--ts-text-secondary)] hover:text-[var(--ts-gold)] hover:border-[var(--ts-gold)] transition-colors text-xs font-medium"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5 12 3l9 6.5" /><path d="M5 9v11h14V9" /><path d="M9 20v-6h6v6" /></svg>
        Home
      </Link>
    </div>
  )
}
