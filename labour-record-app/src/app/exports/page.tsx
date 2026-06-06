import { prisma } from '@/lib/prisma'
import { FORM_DISPLAY_NAMES } from '@/types'
import type { FormCode } from '@/types'
import Link from 'next/link'
import { MONTH_NAMES } from '@/lib/export/form-data'

export default async function ExportsPage() {
  const docs = await prisma.generatedDocument.findMany({
    orderBy: { generatedAt: 'desc' },
    take: 100,
    include: {
      formTask: {
        include: {
          cycle: {
            include: {
              establishment: { select: { name: true } },
            },
          },
        },
      },
    },
  })

  return (
    <div className="p-6">
      <h1 className="text-sm font-semibold text-white mb-4">Export History</h1>

      {docs.length === 0 ? (
        <p className="text-xs text-[#5a8ab8]">No exports yet. Use the Print / Export button on a form task.</p>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#1e2d3d] text-[#5a8ab8]">
              <th className="text-left pb-2 pr-4">Form</th>
              <th className="text-left pb-2 pr-4">Establishment</th>
              <th className="text-left pb-2 pr-4">Period</th>
              <th className="text-left pb-2 pr-4">Version</th>
              <th className="text-left pb-2 pr-4">Generated</th>
              <th className="text-left pb-2 pr-4">Files</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((doc) => {
              const { formTask } = doc
              const { cycle } = formTask
              const display = FORM_DISPLAY_NAMES[doc.formCode as FormCode]
              const period = `${MONTH_NAMES[cycle.month]} ${cycle.year}`
              const generatedAt = new Date(doc.generatedAt).toLocaleString('en-IN', {
                dateStyle: 'short', timeStyle: 'short',
              })

              return (
                <tr key={doc.id} className="border-b border-[#111d2a] hover:bg-[#0f1923]">
                  <td className="py-2 pr-4 text-[#c8d8e8]">{display?.name ?? doc.formCode}</td>
                  <td className="py-2 pr-4 text-[#8ab0d0]">{cycle.establishment.name}</td>
                  <td className="py-2 pr-4 text-[#8ab0d0]">{period}</td>
                  <td className="py-2 pr-4 text-[#5a8ab8]">v{doc.versionNo}</td>
                  <td className="py-2 pr-4 text-[#5a8ab8]">{generatedAt}</td>
                  <td className="py-2 pr-4 flex gap-2">
                    {doc.docxPath && (
                      <span className="text-[#4a9eff]">DOCX ✓</span>
                    )}
                    {doc.pdfPath && (
                      <span className="text-[#4aff9f]">PDF ✓</span>
                    )}
                    {!doc.docxPath && !doc.pdfPath && (
                      <span className="text-[#f07070]">No files</span>
                    )}
                    <Link
                      href={`/print/${cycle.id}/${doc.formCode}`}
                      className="text-[#4a9eff] underline"
                      target="_blank"
                    >
                      Print
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
