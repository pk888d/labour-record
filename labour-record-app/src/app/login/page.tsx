import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoginForm } from './login-form'
import { assetPath } from '@/lib/api-path'

export const metadata: Metadata = {
  title: 'Sign in — Mustearly',
}

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={assetPath('/tech-sakthi-logo.webp')} alt="Tech Sakthi" className="w-14 h-14 object-contain mb-4" />
      <h1 className="text-3xl font-bold text-[var(--ts-gold)]" style={{ fontFamily: 'var(--font-heading)' }}>
        Mustearly
      </h1>
      <p className="text-sm text-[var(--ts-text-muted)] mt-2">Paperless. Fearless. Audit-ready.</p>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  )
}
