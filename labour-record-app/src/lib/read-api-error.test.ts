import { describe, expect, it } from 'vitest'
import { readApiError } from './read-api-error'

function jsonRes(body: unknown, status = 400) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

describe('readApiError', () => {
  it('returns a specific error string from a valid { error } JSON body', async () => {
    const res = jsonRes({ error: 'Delete failed' })
    expect(await readApiError(res)).toEqual({ error: 'Delete failed' })
  })

  it('returns a specific joined message from a valid { errors: [...] } JSON body', async () => {
    const res = jsonRes({ errors: ['Max rows per sheet must be a positive whole number (or blank to use the default)'] }, 422)
    const result = await readApiError(res)
    expect(result.error).toBe('Max rows per sheet must be a positive whole number (or blank to use the default)')
    expect(result.errors).toEqual(['Max rows per sheet must be a positive whole number (or blank to use the default)'])
  })

  it('joins multiple errors in the errors array', async () => {
    const res = jsonRes({ errors: ['A is required', 'B is required'] }, 422)
    expect((await readApiError(res)).error).toBe('A is required, B is required')
  })

  it('falls back to the default message for a non-JSON (HTML) body instead of throwing', async () => {
    const res = new Response('<html><body>Not Found</body></html>', {
      status: 404,
      headers: { 'content-type': 'text/html' },
    })
    expect(await readApiError(res)).toEqual({ error: 'Something went wrong. Please try again.' })
  })

  it('falls back to the default message for an empty body', async () => {
    const res = new Response('', { status: 500 })
    expect(await readApiError(res)).toEqual({ error: 'Something went wrong. Please try again.' })
  })

  it('falls back to the default message for a valid but empty JSON object', async () => {
    const res = jsonRes({})
    expect(await readApiError(res)).toEqual({ error: 'Something went wrong. Please try again.' })
  })

  it('accepts a custom fallback message', async () => {
    const res = new Response('<html>Server Error</html>', { status: 500 })
    expect(await readApiError(res, 'Sync failed')).toEqual({ error: 'Sync failed' })
  })
})
