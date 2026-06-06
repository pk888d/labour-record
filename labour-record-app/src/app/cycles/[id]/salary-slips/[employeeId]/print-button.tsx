'use client'
export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="px-5 py-2 bg-[#1a5adc] text-white text-sm font-medium rounded hover:bg-[#2a6aec] print:hidden"
    >
      Print Slip
    </button>
  )
}
