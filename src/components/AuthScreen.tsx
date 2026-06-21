'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import HelpModal from './HelpModal'
import { motion } from 'framer-motion'

export default function AuthScreen() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [passkeyLoading, setPasskeyLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null)
  const [isHelpOpen, setIsHelpOpen] = useState(false)

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
    <>
      <div className="scrollable-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '12px' }}>
        <div className="glass-panel" style={{ padding: '28px 24px', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <div style={{ marginBottom: '24px' }}>
            <Image src="/logo.png" alt="SwiftNotes Logo" width={80} height={80} style={{ borderRadius: '20px' }} />
          </div>
          <h1 style={{ marginBottom: '8px' }}>Welcome to SwiftNotes</h1>
          <p style={{ color: 'var(--text-main)', marginBottom: '32px' }}>Lightning-fast voice-driven notes and tasks.</p>

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
          <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: 1.5, opacity: 0.88, marginBottom: '16px' }}>
            New here? First sign in with a magic link, then register a passkey from the Passkey tab for next-time biometric login.
          </p>

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

      {/* Floating Action Button for Help Guide */}
      <motion.button
        id="help-trigger-fab"
        type="button"
        onClick={() => setIsHelpOpen(true)}
        aria-label="Help Guide"
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          width: '46px',
          height: '46px',
          borderRadius: '50%',
          border: '1px solid rgba(102, 252, 241, 0.3)',
          background: 'rgba(31, 40, 51, 0.85)',
          color: 'var(--primary-color)',
          fontSize: '1.2rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4), 0 0 15px rgba(102, 252, 241, 0.1)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          zIndex: 99,
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
      >
        ❓
      </motion.button>

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </>
  )
}
