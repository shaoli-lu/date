'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

export default function AuthScreen() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Check your email for the magic link!')
    }
    setLoading(false)
  }

  return (
    <div className="scrollable-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel" style={{ padding: '40px 24px', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <div style={{ marginBottom: '24px' }}>
          <Image src="/logo.png" alt="Date Logo" width={80} height={80} style={{ borderRadius: '20px' }} />
        </div>
        <h1 style={{ marginBottom: '8px' }}>Welcome to Date</h1>
        <p style={{ color: 'var(--text-main)', marginBottom: '32px' }}>Your elegant calendar and tasks.</p>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input 
            type="email" 
            placeholder="Enter your email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Sending...' : 'Send Magic Link'}
          </button>
        </form>

        {message && (
          <p style={{ marginTop: '20px', color: message.includes('Check') ? 'var(--primary-color)' : 'var(--danger-color)' }}>
            {message}
          </p>
        )}
      </div>
    </div>
  )
}
