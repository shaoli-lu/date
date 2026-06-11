'use client'

import { useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export default function PasskeyView({ session }: { session: Session }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const handleRegister = async () => {
    setLoading(true)
    setMessage(null)
    const { error } = await supabase.auth.registerPasskey()
    if (error) {
      setMessage({ text: error.message, type: 'error' })
    } else {
      setMessage({ text: 'Passkey registered successfully! You can now sign in with biometrics.', type: 'success' })
    }
    setLoading(false)
  }

  const handleSignIn = async () => {
    setLoading(true)
    setMessage(null)
    const { error } = await supabase.auth.signInWithPasskey()
    if (error) {
      setMessage({ text: error.message, type: 'error' })
    } else {
      setMessage({ text: 'Signed in with passkey!', type: 'success' })
    }
    setLoading(false)
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      gap: '2rem',
    }}>
      {/* Icon */}
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(102,252,241,0.15) 0%, rgba(69,162,158,0.15) 100%)',
        border: '1px solid var(--glass-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '36px',
        boxShadow: '0 0 40px rgba(102,252,241,0.1)',
      }}>
        🔑
      </div>

      {/* Heading */}
      <div style={{ textAlign: 'center', maxWidth: '320px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text-heading)' }}>
          Passkey Authentication
        </h2>
        <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: 1.6 }}>
          Passkeys use biometric authentication (Face ID, Touch ID, or fingerprint) for fast, secure sign-in — no passwords needed.
        </p>
      </div>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: '360px',
        background: 'rgba(31, 40, 51, 0.6)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--glass-border)',
        borderRadius: '20px',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--secondary-color)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Signed in as
          </span>
          <span style={{ color: 'var(--text-heading)', fontSize: '0.95rem', wordBreak: 'break-all' }}>
            {session.user?.email ?? session.user?.phone ?? 'Unknown'}
          </span>
        </div>

        <div style={{ height: '1px', background: 'var(--glass-border)' }} />

        {/* Register button */}
        <button
          id="register-passkey-btn"
          onClick={handleRegister}
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.875rem 1rem',
            borderRadius: '12px',
            border: 'none',
            background: loading ? 'rgba(102,252,241,0.4)' : 'var(--primary-color)',
            color: '#0b0c10',
            fontWeight: 700,
            fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          {loading ? (
            <>
              <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
              Processing…
            </>
          ) : (
            <>🔑 Register a Passkey</>
          )}
        </button>

        {/* Sign-in with passkey button */}
        <button
          id="signin-passkey-btn"
          onClick={handleSignIn}
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.875rem 1rem',
            borderRadius: '12px',
            border: '1px solid var(--glass-border)',
            background: 'transparent',
            color: 'var(--text-heading)',
            fontWeight: 600,
            fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          ✨ Sign in with Passkey
        </button>

        {/* Message */}
        {message && (
          <div style={{
            padding: '0.875rem 1rem',
            borderRadius: '10px',
            background: message.type === 'success'
              ? 'rgba(102, 252, 241, 0.1)'
              : 'rgba(255, 75, 75, 0.1)',
            border: `1px solid ${message.type === 'success' ? 'rgba(102,252,241,0.3)' : 'rgba(255,75,75,0.3)'}`,
            color: message.type === 'success' ? 'var(--primary-color)' : 'var(--danger-color)',
            fontSize: '0.875rem',
            lineHeight: 1.5,
          }}>
            {message.text}
            {message.text.includes('Relying Party') && (
              <span style={{ display: 'block', marginTop: '0.5rem', opacity: 0.8 }}>
                Ensure the RP ID is the bare domain (e.g. <code>date-nu-nine.vercel.app</code>) and the full origin is listed under Allowed Origins in Supabase.
              </span>
            )}
            {message.text.includes('Passkeys are disabled') && (
              <span style={{ display: 'block', marginTop: '0.5rem' }}>
                Enable Passkeys in Supabase Dashboard → Authentication → Passkeys.
              </span>
            )}
          </div>
        )}
      </div>

      {/* Info footer */}
      <p style={{ fontSize: '0.78rem', color: 'var(--text-main)', opacity: 0.6, textAlign: 'center', maxWidth: '280px' }}>
        Passkeys are stored securely on your device and never leave it.
      </p>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
