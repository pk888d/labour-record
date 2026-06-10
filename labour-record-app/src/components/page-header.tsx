import Link from 'next/link'

type Props = {
  title: string
  subtitle?: string
  action?: { label: string; href: string }
}

export function PageHeader({ title, subtitle, action }: Props) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--ts-border)] bg-[var(--ts-navy-mid)]">
      <div>
        <h1 className="text-base font-semibold text-[var(--ts-text-primary)]" style={{ fontFamily: 'var(--font-heading)' }}>{title}</h1>
        {subtitle && <p className="text-xs text-[var(--ts-text-muted)] mt-0.5">{subtitle}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="px-3 py-1.5 bg-[var(--ts-gold)] text-[var(--ts-navy)] text-xs font-semibold rounded-lg hover:bg-[var(--ts-gold-light)] transition-colors"
        >
          {action.label}
        </Link>
      )}
    </div>
  )
}
