'use client'

export function PrintButton({ orientation = 'landscape' }: { orientation?: 'landscape' | 'portrait' }) {
  function setOrientation(o: 'landscape' | 'portrait') {
    const url = new URL(window.location.href)
    url.searchParams.set('orientation', o)
    window.location.href = url.toString()
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '5px 12px',
    fontSize: '12px',
    cursor: 'pointer',
    border: '1px solid #ccc',
    background: active ? '#1a5adc' : 'white',
    color: active ? 'white' : '#333',
  })

  return (
    <div className="no-print" style={{ padding: '8px 16px', background: '#f5f5f5', borderBottom: '1px solid #ccc', display: 'flex', alignItems: 'center', gap: '12px' }}>
      <button
        onClick={() => window.print()}
        style={{
          padding: '6px 16px', background: '#1a5adc', color: 'white', border: 'none',
          borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 500,
        }}
      >
        Print / Save as PDF
      </button>
      <div style={{ display: 'flex' }}>
        <button style={{ ...tabStyle(orientation === 'landscape'), borderRadius: '4px 0 0 4px' }}
          onClick={() => setOrientation('landscape')}>Landscape</button>
        <button style={{ ...tabStyle(orientation === 'portrait'), borderLeft: 'none', borderRadius: '0 4px 4px 0' }}
          onClick={() => setOrientation('portrait')}>Portrait</button>
      </div>
      <span style={{ fontSize: '11px', color: '#666' }}>
        Use your browser&apos;s Print dialog (Ctrl+P / Cmd+P)
      </span>
    </div>
  )
}
