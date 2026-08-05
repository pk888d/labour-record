'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { apiPath } from '@/lib/api-path'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch(apiPath('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        // Validate redirect target starts with "/" to avoid open redirects.
        const redirect = searchParams.get('redirect')
        const target = redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/dashboard'
        router.replace(target)
      } else {
        setError('Invalid password. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 w-full max-w-xs flex flex-col gap-3">
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        aria-label="Password"
        autoFocus
        className="px-4 py-2 rounded-lg bg-[var(--ts-navy-mid)] border border-[var(--ts-border)] text-sm text-[var(--ts-text-primary)] placeholder-[var(--ts-text-muted)] focus:outline-none focus:border-[var(--ts-gold)]"
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2 rounded-lg bg-[var(--ts-gold)] text-[var(--ts-navy)] text-sm font-semibold hover:bg-[var(--ts-gold-light)] transition-colors disabled:opacity-60"
      >
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
