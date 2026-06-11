'use client'
import Link from 'next/link'
import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('App error boundary:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
      <p className="text-5xl font-bold text-[var(--ts-maroon)]" style={{ fontFamily: 'var(--font-heading)' }}>!</p>
      <h1 className="text-xl font-semibold text-[var(--ts-text-primary)] mt-2" style={{ fontFamily: 'var(--font-heading)' }}>
        Something went wrong
      </h1>
      <p className="text-sm text-[var(--ts-text-muted)] mt-2 max-w-md">
        An unexpected error occurred on this page. You can retry, or head back to the dashboard.
      </p>
      {error?.message && (
        <code className="mt-3 text-[11px] text-[var(--ts-text-muted)] bg-[var(--ts-navy-mid)] border border-[var(--ts-border)] rounded px-3 py-1.5 max-w-lg break-words">
          {error.message}
        </code>
      )}
      <div className="flex gap-3 mt-6">
        <button onClick={reset}
          className="px-4 py-2 rounded-lg bg-[var(--ts-gold)] text-[var(--ts-navy)] text-sm font-semibold hover:bg-[var(--ts-gold-light)] transition-colors">
          Try again
        </button>
        <Link href="/dashboard"
          className="px-4 py-2 rounded-lg border border-[var(--ts-border)] text-[var(--ts-text-secondary)] text-sm hover:text-[var(--ts-gold)] hover:border-[var(--ts-gold)] transition-colors">
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
