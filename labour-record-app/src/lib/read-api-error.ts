// Shared helper for reading an error body off a failed (`!res.ok`) fetch
// Response. Every API route in this app returns JSON on error, but a body
// can arrive as something else entirely — a reverse-proxy path mismatch
// (TEC-45 class of bug), Next's default not-found HTML page, a raw platform
// 500/502 HTML page, or an edge-runtime error thrown before the route
// handler even runs. `res.json()` throws a SyntaxError on any of those, and
// call sites that don't handle it either surface a raw "Not Found" /
// unhandled-rejection console error, or (worse) silently re-enable the
// button with no feedback at all (TEC-52).
//
// Use this in place of a bare `await res.json()` in the `!res.ok` branch:
// it never throws, and it preserves today's specific per-field/per-route
// messages (e.g. the settings 422 `errors` array) when the body does parse.
export async function readApiError(
  res: Response,
  fallback = 'Something went wrong. Please try again.',
): Promise<{ error: string; errors?: string[] }> {
  let data: unknown
  try {
    data = await res.json()
  } catch {
    return { error: fallback }
  }

  if (data && typeof data === 'object') {
    const d = data as { error?: unknown; errors?: unknown }
    if (Array.isArray(d.errors) && d.errors.length > 0 && d.errors.every((e) => typeof e === 'string')) {
      return { error: d.errors.join(', '), errors: d.errors as string[] }
    }
    if (typeof d.error === 'string' && d.error.trim() !== '') {
      return { error: d.error }
    }
  }

  return { error: fallback }
}
