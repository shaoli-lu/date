'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

export default function AuthScreen() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [passkeyLoading, setPasskeyLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    })

    if (error) {
      setMessage({ text: error.message, success: false })
    } else {
      setMessage({ text: 'Check your email for the magic link!', success: true })
    }
    setLoading(false)
  }

  const handlePasskeySignIn = async () => {
    setPasskeyLoading(true)
    setMessage(null)
    const { error } = await supabase.auth.signInWithPasskey()
    if (error) {
      setMessage({ text: error.message, success: false })
    }
    setPasskeyLoading(false)
  }

  return (
    <div className="scrollable-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel" style={{ padding: '40px 24px', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <div style={{ marginBottom: '24px' }}>
          <Image src="/logo.png" alt="Date Logo" width={80} height={80} style={{ borderRadius: '20px' }} />
        </div>
        <h1 style={{ marginBottom: '8px' }}>Welcome to Date</h1>
        <p style={{ color: 'var(--text-main)', marginBottom: '32px' }}>Your elegant calendar and tasks.</p>

        {/* Passkey sign-in — shown prominently at the top */}
        <button
          id="signin-passkey-btn"
          type="button"
          onClick={handlePasskeySignIn}
          disabled={passkeyLoading}
          style={{
            width: '100%',
            padding: '14px',
            marginBottom: '16px',
            borderRadius: '8px',
            border: '1px solid var(--glass-border)',
            background: 'rgba(102, 252, 241, 0.08)',
            color: 'var(--primary-color)',
            fontWeight: 600,
            fontSize: '1rem',
            cursor: passkeyLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            opacity: passkeyLoading ? 0.6 : 1,
          }}
        >
          {passkeyLoading ? '⟳ Authenticating…' : '🔑 Sign in with Passkey'}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
          <span style={{ color: 'var(--text-main)', fontSize: '0.8rem' }}>or use magic link</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '14px' }}>
            {loading ? 'Sending…' : 'Send Magic Link'}
          </button>
        </form>

        {message && (
          <p style={{ marginTop: '20px', color: message.success ? 'var(--primary-color)' : 'var(--danger-color)' }}>
            {message.text}
          </p>
        )}
      </div>
    </div>
  )
}
