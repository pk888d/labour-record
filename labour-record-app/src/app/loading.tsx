// Route-level fallback shown while a server component segment streams in.
export default function Loading() {
  return (
    <div className="p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-7 w-48 rounded bg-[var(--ts-navy-mid)]" />
        <div className="h-4 w-32 rounded bg-[var(--ts-navy-mid)]" />
        <div className="space-y-2 pt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 rounded bg-[var(--ts-navy-mid)]" />
          ))}
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  )
}
