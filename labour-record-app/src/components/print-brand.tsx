// Shared Tech Sakthi branding for output/print surfaces (items 1 & 2).

// Diagonal repeating watermark. Fixed so it tiles across every printed page.
export function Watermark({ text = 'TECH SAKTHI' }: { text?: string }) {
  const cells = Array.from({ length: 60 })
  return (
    <div aria-hidden className="ts-watermark" style={{
      position: 'fixed',
      inset: 0,
      zIndex: 0,
      pointerEvents: 'none',
      overflow: 'hidden',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '60px',
      transform: 'rotate(-30deg) scale(1.6)',
      transformOrigin: 'center',
      opacity: 0.07,
    }}>
      {cells.map((_, i) => (
        <span key={i} style={{
          fontSize: '22px',
          fontWeight: 800,
          letterSpacing: '3px',
          color: '#000',
          whiteSpace: 'nowrap',
          fontFamily: 'Arial, sans-serif',
        }}>{text}</span>
      ))}
    </div>
  )
}

// Establishment/document header for printed documents. The Tech Sakthi logo is
// intentionally NOT placed here — it brands the app, not the establishment's
// statutory documents (the Tech Sakthi watermark serves that purpose instead).
export function BrandHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
      <div style={{ fontWeight: 700, fontSize: 12 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 10, color: '#555' }}>{subtitle}</div>}
    </div>
  )
}
