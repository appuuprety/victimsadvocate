import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { Btn, Field, Input, Spinner, COLORS } from './ui'
import ColoradoLogo from './ColoradoLogo'

export default function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function signIn() {
    if (!email || !password) return setError('Email and password are required.')
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) { setError(err.message); setLoading(false) } else onLogin()
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F2D5E, #1B4D8E)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Georgia, serif',
      padding: 16,
      colorScheme: 'light',
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <div style={{ background: '#FFFFFF', borderRadius: 20, padding: 40, width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <div style={{ background: COLORS.primary, borderRadius: 50, padding: 10 }}>
              <ColoradoLogo size={40} />
            </div>
          </div>
          <h2 style={{ margin: 0, fontSize: 22, color: COLORS.primary }}>Admin Sign In</h2>
          <p style={{ margin: '8px 0 0', color: COLORS.textMuted, fontSize: 14 }}>Colorado Victim Resources — Staff Portal</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Email">
            <Input value={email} onChange={setEmail} type="email" placeholder="admin@covictims.org" />
          </Field>
          <Field label="Password">
            <Input value={password} onChange={setPassword} type="password" placeholder="••••••••" />
          </Field>
          {error && <p style={{ color: COLORS.danger, fontSize: 13, margin: 0 }}>{error}</p>}
          <Btn onClick={signIn} disabled={loading} style={{ width: '100%', marginTop: 4 }}>
            {loading
              ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Spinner />Signing in…</span>
              : 'Sign In'
            }
          </Btn>
        </div>
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: COLORS.textMuted }}>
          Create accounts in Supabase → Authentication → Users
        </p>
      </div>
    </div>
  )
}
