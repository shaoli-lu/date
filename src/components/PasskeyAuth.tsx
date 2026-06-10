import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Modal from '@/components/Modal';

// Accept optional session prop
export default function PasskeyAuth({ session }: { session?: any }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const isLoggedIn = !!session;

  const handleSignIn = async () => {
    setLoading(true);
    setMessage('');
    const { error } = await supabase.auth.signInWithPasskey();
    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Signed in with passkey!');
    }
    setLoading(false);
    setModalOpen(false);
  };

  const handleRegister = async () => {
    setLoading(true);
    setMessage('');
    const { error } = await supabase.auth.registerPasskey();
    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Passkey registered successfully!');
    }
    setLoading(false);
    setModalOpen(false);
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setModalOpen(true)}
        className="btn-primary"
        style={{ marginTop: '1rem', padding: '0.75rem 1.2rem' }}
      >
        Passkey Authentication
      </button>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="passkey-auth" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          {!isLoggedIn && (
            <p style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>
              To register a passkey you must first sign in using the magic link.
            </p>
          )}

          {/* Sign‑in button */}
          {!isLoggedIn && (
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="btn-primary"
              style={{ minWidth: '200px', padding: '0.75rem 1rem' }}
            >
              {loading ? 'Processing...' : 'Sign in with Passkey'}
            </button>
          )}

          {/* Register button */}
          {isLoggedIn && (
            <button
              onClick={handleRegister}
              disabled={loading}
              className="btn-primary"
              style={{ minWidth: '200px', padding: '0.75rem 1rem', background: 'var(--secondary-color)', color: '#fff' }}
            >
              {loading ? 'Processing...' : 'Register Passkey'}
            </button>
          )}

          {message && (
            <p
              style={{
                color:
                  message.includes('error') || message.includes('failed')
                    ? 'var(--danger-color)'
                    : 'var(--primary-color)',
              }}
            >
              {message}
              {message.includes('Relying Party') && (
                <span style={{ display: 'block', marginTop: '0.5rem' }}>
                  Ensure the RP ID in Supabase is the bare domain (e.g.,{' '}
                  <code>date-nu-nine.vercel.app</code>) and that the full origin ({' '}
                  <code>https://date-nu-nine.vercel.app</code>) is listed under Allowed Origins.
                </span>
              )}
              {message.includes('Passkeys are disabled') && (
                <span style={{ display: 'block', marginTop: '0.5rem', color: 'var(--danger-color)' }}>
                  Please enable Passkeys in the Supabase Dashboard → Authentication → Passkeys.
                </span>
              )}
            </p>
          )}
        </div>
      </Modal>
    </>
  );
}
