'use client'

export function PrintButton() {
  return (
    <div className="no-print" style={{ padding: '8px 16px', background: '#f5f5f5', borderBottom: '1px solid #ccc' }}>
      <button
        onClick={() => window.print()}
        style={{
          padding: '6px 16px',
          background: '#1a5adc',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 500,
        }}
      >
        Print / Save as PDF
      </button>
      <span style={{ marginLeft: '12px', fontSize: '11px', color: '#666' }}>
        Use your browser's Print dialog (Ctrl+P / Cmd+P)
      </span>
    </div>
  )
}
