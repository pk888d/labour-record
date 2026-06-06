'use client'
export function PrintAllButton() {
  return (
    <button
      onClick={() => window.print()}
      className="px-4 py-1.5 bg-[#1a3a6a] text-[#4a9eff] text-xs rounded border border-[#2a4a8a] hover:bg-[#1e4a7a]"
    >
      Print All
    </button>
  )
}
