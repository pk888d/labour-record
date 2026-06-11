import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
      <p className="text-6xl font-bold text-[var(--ts-gold)]" style={{ fontFamily: 'var(--font-heading)' }}>404</p>
      <h1 className="text-xl font-semibold text-[var(--ts-text-primary)] mt-2" style={{ fontFamily: 'var(--font-heading)' }}>
        Page not found
      </h1>
      <p className="text-sm text-[var(--ts-text-muted)] mt-2 max-w-md">
        The page you&apos;re looking for doesn&apos;t exist, or the record may have been moved,
        renamed or deleted. Try opening it again from the navigation.
      </p>
      <div className="flex gap-3 mt-6">
        <Link href="/dashboard"
          className="px-4 py-2 rounded-lg bg-[var(--ts-gold)] text-[var(--ts-navy)] text-sm font-semibold hover:bg-[var(--ts-gold-light)] transition-colors">
          Go to Dashboard
        </Link>
        <Link href="/establishments"
          className="px-4 py-2 rounded-lg border border-[var(--ts-border)] text-[var(--ts-text-secondary)] text-sm hover:text-[var(--ts-gold)] hover:border-[var(--ts-gold)] transition-colors">
          Establishments
        </Link>
      </div>
    </div>
  )
}
