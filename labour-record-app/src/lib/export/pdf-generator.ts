import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'

const execAsync = promisify(exec)

/** Minimal shape needed from child_process.exec — kept narrow so tests can inject a fake. */
export type ExecFn = (command: string) => Promise<{ stdout: string; stderr: string }>

export const PDF_UNAVAILABLE_MESSAGE =
  'PDF export requires LibreOffice on the server — install libreoffice or download DOCX instead.'

// Cached for the process lifetime: the soffice binary doesn't appear/disappear
// mid-process, so one probe is enough and avoids spawning a shell on every export.
let cachedAvailability: boolean | null = null

/**
 * Checks whether the `soffice` (LibreOffice) binary is reachable on PATH.
 * The exec function is injectable so this can be unit-tested without LibreOffice installed.
 */
export async function isPdfAvailable(execFn: ExecFn = execAsync): Promise<boolean> {
  if (cachedAvailability !== null) {
    return cachedAvailability
  }
  try {
    await execFn('which soffice')
    cachedAvailability = true
  } catch {
    cachedAvailability = false
  }
  return cachedAvailability
}

/** Test-only: clears the cached availability so each test starts fresh. */
export function _resetPdfAvailabilityCache(): void {
  cachedAvailability = null
}

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
