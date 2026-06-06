import Link from 'next/link'

type Props = {
  title: string
  subtitle?: string
  action?: { label: string; href: string }
}

export function PageHeader({ title, subtitle, action }: Props) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2d3d] bg-[#0f1923]">
      <div>
        <h1 className="text-base font-semibold text-white">{title}</h1>
        {subtitle && <p className="text-xs text-[#4a6a8a] mt-0.5">{subtitle}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="px-3 py-1.5 bg-[#1a5adc] text-white text-xs font-medium rounded hover:bg-[#2a6aec]"
        >
          {action.label}
        </Link>
      )}
    </div>
  )
}
