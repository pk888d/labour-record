import { Watermark } from '@/components/print-brand'

export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        aside { display: none !important; }
        main { background: white !important; color: black !important; padding: 0 !important; overflow: visible !important; }
        body { background: white !important; color: black !important; }
        /* @page orientation is injected per-form (landscape default, portrait optional) */
        * { box-sizing: border-box; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #000; padding: 2px 4px; font-size: 9px; line-height: 1.2; }
        th { background: #f0f0f0; font-weight: bold; text-align: center; }
        .totals-row { font-weight: bold; background: #f9f9f9; }
        .form-page { padding: 4mm; font-family: Arial, sans-serif; position: relative; z-index: 1; }
        .form-header { text-align: center; margin-bottom: 6px; }
        .form-header h2 { font-size: 12px; font-weight: bold; margin: 2px 0; }
        .form-header p { font-size: 10px; margin: 1px 0; }
        /* Title, rule and period stay centred; establishment / manager / reg-cert
           details (the last two lines) are left-aligned as in the statutory forms. */
        .form-header p:nth-last-of-type(-n+2) { text-align: left; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 6px; font-size: 9px; }
        .no-print { display: block; }
        @media print { .no-print { display: none !important; } .ts-watermark { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      `}</style>
      <Watermark />
      {children}
    </>
  )
}
