export function Info({ text }: { text: string }) {
  return (
    <span className="relative group inline-flex items-center ml-1 align-middle">
      <span className="text-[#3a6a9a] cursor-help text-[10px] leading-none select-none">ⓘ</span>
      <span className="absolute left-0 bottom-full mb-1.5 z-50 hidden group-hover:block w-60 bg-[#0a1520] border border-[#2a4a6a] rounded p-2 text-[10px] text-[#8ab8d8] leading-relaxed shadow-xl pointer-events-none whitespace-normal">
        {text}
      </span>
    </span>
  )
}
