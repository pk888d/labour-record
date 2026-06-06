import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateDocx } from '@/lib/export/docx-generator'
import { generatePdf } from '@/lib/export/pdf-generator'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const formTask = await prisma.formTask.findUnique({
    where: { id },
    include: { cycle: true },
  })
  if (!formTask) {
    return NextResponse.json({ error: 'FormTask not found' }, { status: 404 })
  }

  const { cycle } = formTask
  const cycleId = cycle.id
  const formCode = formTask.formCode

  // Determine next version number
  const lastDoc = await prisma.generatedDocument.findFirst({
    where: { formTaskId: id, formCode },
    orderBy: { versionNo: 'desc' },
  })
  const versionNo = (lastDoc?.versionNo ?? 0) + 1

  const monthStr = String(cycle.month).padStart(2, '0')
  const baseFileName = `${formCode}_${cycle.year}_${monthStr}_v${versionNo}`

  let docxPath: string | undefined
  let pdfPath: string | undefined
  const generateErrors: string[] = []

  try {
    docxPath = await generateDocx(cycleId, formCode, baseFileName)
  } catch (err) {
    generateErrors.push(`DOCX: ${err instanceof Error ? err.message : String(err)}`)
  }

  if (docxPath) {
    try {
      pdfPath = await generatePdf(docxPath)
    } catch (err) {
      generateErrors.push(`PDF: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // If no files were generated, return error without creating a document record
  if (!docxPath && !pdfPath) {
    return NextResponse.json({ errors: generateErrors }, { status: 422 })
  }

  const doc = await prisma.generatedDocument.create({
    data: {
      formTaskId: id,
      formCode,
      docxPath: docxPath ?? null,
      pdfPath: pdfPath ?? null,
      templateVersion: '1.0',
      versionNo,
      fileName: baseFileName,
    },
  })

  if (generateErrors.length === 0) {
    await prisma.formTask.update({
      where: { id },
      data: { status: 'EXPORTED' },
    })
  }

  return NextResponse.json({
    id: doc.id,
    fileName: doc.fileName,
    docxPath: doc.docxPath,
    pdfPath: doc.pdfPath,
    versionNo: doc.versionNo,
    warnings: generateErrors.length > 0 ? generateErrors : undefined,
  }, { status: 201 })
}
