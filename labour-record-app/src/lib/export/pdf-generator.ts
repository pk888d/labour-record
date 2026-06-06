import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'

const execAsync = promisify(exec)

export async function generatePdf(docxPath: string): Promise<string> {
  if (!fs.existsSync(docxPath)) {
    throw new Error(`DOCX file not found: ${docxPath}`)
  }

  const outDir = path.dirname(docxPath)

  const { stderr } = await execAsync(
    `soffice --headless --convert-to pdf --outdir "${outDir}" "${docxPath}"`
  )

  // execAsync throws on non-zero exit code; rely on PDF existence rather than stderr
  // LibreOffice emits benign noise (fontconfig, JVM, dconf) to stderr on many systems

  const pdfPath = docxPath.replace(/\.docx$/, '.pdf')
  if (!fs.existsSync(pdfPath)) {
    const hint = stderr ? ` stderr: ${stderr.slice(0, 200)}` : ''
    throw new Error(`PDF not generated at expected path: ${pdfPath}.${hint}`)
  }

  return pdfPath
}
