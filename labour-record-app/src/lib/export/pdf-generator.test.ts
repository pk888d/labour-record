import { describe, expect, it, beforeEach } from 'vitest'
import {
  generatePdf,
  isPdfAvailable,
  _resetPdfAvailabilityCache,
  PDF_UNAVAILABLE_MESSAGE,
  type ExecFn,
} from './pdf-generator'

describe('isPdfAvailable', () => {
  beforeEach(() => {
    _resetPdfAvailabilityCache()
  })

  it('returns true when the probe exec resolves (soffice on PATH)', async () => {
    const fakeExec: ExecFn = async () => ({ stdout: '/usr/bin/soffice\n', stderr: '' })
    await expect(isPdfAvailable(fakeExec)).resolves.toBe(true)
  })

  it('returns false when the probe exec rejects (soffice missing)', async () => {
    const fakeExec: ExecFn = async () => {
      throw new Error('command not found: soffice')
    }
    await expect(isPdfAvailable(fakeExec)).resolves.toBe(false)
  })

  it('caches the result for the process lifetime — exec is only invoked once', async () => {
    let calls = 0
    const fakeExec: ExecFn = async () => {
      calls++
      return { stdout: '/usr/bin/soffice\n', stderr: '' }
    }
    await isPdfAvailable(fakeExec)
    await isPdfAvailable(fakeExec)
    await isPdfAvailable(fakeExec)
    expect(calls).toBe(1)
  })

  it('caches a negative result too — repeated calls do not re-probe', async () => {
    let calls = 0
    const fakeExec: ExecFn = async () => {
      calls++
      throw new Error('nope')
    }
    await isPdfAvailable(fakeExec)
    await isPdfAvailable(fakeExec)
    expect(calls).toBe(1)
  })

  it('a later injected exec is ignored once a cached value exists', async () => {
    const trueExec: ExecFn = async () => ({ stdout: 'ok', stderr: '' })
    const falseExec: ExecFn = async () => {
      throw new Error('nope')
    }
    await expect(isPdfAvailable(trueExec)).resolves.toBe(true)
    // Cache already populated — falseExec should never run, cached true wins.
    await expect(isPdfAvailable(falseExec)).resolves.toBe(true)
  })
})

describe('generatePdf', () => {
  it('throws a clear error when the DOCX file does not exist', async () => {
    await expect(generatePdf('/tmp/does-not-exist-labour-record.docx')).rejects.toThrow(
      /DOCX file not found/
    )
  })
})

describe('PDF_UNAVAILABLE_MESSAGE', () => {
  it('mentions LibreOffice and the DOCX fallback', () => {
    expect(PDF_UNAVAILABLE_MESSAGE).toMatch(/LibreOffice/)
    expect(PDF_UNAVAILABLE_MESSAGE).toMatch(/DOCX/)
  })
})
