// Shared Tech Sakthi branding for output/print surfaces (items 1 & 2).

// Diagonal repeating watermark. A SINGLE fixed layer painted from one tiled SVG
// background — the previous version rendered 60 rotated DOM nodes, which made the
// print engine spool slowly and show a blank/loading preview first (item #3).
// One node with a repeating background prints cheaply and tiles per page.
export function Watermark({ text = 'TECH SAKTHI' }: { text?: string }) {
  const tile = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200'>` +
      `<text x='10' y='120' transform='rotate(-30 150 100)' ` +
      `font-family='Arial, sans-serif' font-size='22' font-weight='800' ` +
      `letter-spacing='3' fill='#000'>${text}</text>` +
    `</svg>`,
  )
  return (
    <div aria-hidden className="ts-watermark" style={{
      position: 'fixed',
      inset: 0,
      zIndex: 0,
      pointerEvents: 'none',
      backgroundImage: `url("data:image/svg+xml,${tile}")`,
      backgroundRepeat: 'repeat',
      opacity: 0.07,
    }} />
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
