import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { apiPath, assetPath } from './api-path'

describe('apiPath', () => {
  const original = process.env.NEXT_PUBLIC_BASE_PATH

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_BASE_PATH
  })

  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_BASE_PATH
    else process.env.NEXT_PUBLIC_BASE_PATH = original
  })

  it('returns the path unchanged when unset (dev/test)', () => {
    expect(apiPath('/api/employees')).toBe('/api/employees')
  })

  it('prefixes the path when set (production)', () => {
    process.env.NEXT_PUBLIC_BASE_PATH = '/mustearly'
    expect(apiPath('/api/employees')).toBe('/mustearly/api/employees')
  })

  it('prefixes paths with dynamic segments', () => {
    process.env.NEXT_PUBLIC_BASE_PATH = '/mustearly'
    expect(apiPath(`/api/cycles/${123}/sync-wages`)).toBe('/mustearly/api/cycles/123/sync-wages')
  })
})

describe('assetPath', () => {
  const original = process.env.NEXT_PUBLIC_BASE_PATH

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_BASE_PATH
  })

  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_BASE_PATH
    else process.env.NEXT_PUBLIC_BASE_PATH = original
  })

  it('returns the path unchanged when unset (dev/test)', () => {
    expect(assetPath('/tech-sakthi-logo.webp')).toBe('/tech-sakthi-logo.webp')
  })

  it('prefixes the path when set (production)', () => {
    process.env.NEXT_PUBLIC_BASE_PATH = '/mustearly'
    expect(assetPath('/tech-sakthi-logo.webp')).toBe('/mustearly/tech-sakthi-logo.webp')
  })

  it('prefixes nested help-screenshot paths', () => {
    process.env.NEXT_PUBLIC_BASE_PATH = '/mustearly'
    expect(assetPath('/help/dashboard.png')).toBe('/mustearly/help/dashboard.png')
  })
})
