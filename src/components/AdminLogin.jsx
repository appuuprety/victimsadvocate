import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { Btn, Field, Input, Spinner, COLORS } from './ui'
import ColoradoLogo from './ColoradoLogo'

export default function AdminLogin({ onLogin, passwordRecovery = false, onPasswordUpdated, onCancelPasswordRecovery, adminError = '', onClaimSuperAdmin }) {
  const [mode, setMode] = useState(() => new URLSearchParams(window.location.search).get('invite') ? 'register' : 'signIn')
  const [email, setEmail] = useState('')
  const [resetEmail, setResetEmail] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [inviteToken, setInviteToken] = useState(() => new URLSearchParams(window.location.search).get('invite') || '')
  const [registerPassword, setRegisterPassword] = useState('')
  const [confirmRegisterPassword, setConfirmRegisterPassword] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [resetSent, setResetSent] = useState(false)

  function clearStatus() {
    setError('')
    setNotice('')
  }

  async function signIn() {
    if (!email || !password) return setError('Email and password are required.')
    setLoading(true)
    clearStatus()
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) { setError(err.message); setLoading(false) } else onLogin()
  }

  async function sendResetEmail() {
    if (!resetEmail) return setError('Enter your staff email.')
    setLoading(true)
    clearStatus()
    const { error: err } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/admin`,
    })
    setLoading(false)
    if (err) return setError(err.message)
    setResetSent(true)
    setNotice('Password reset email sent. Check your inbox and follow the link to set a new password.')
  }

  function openResetRequest() {
    setMode('requestReset')
    setResetEmail('')
    setResetSent(false)
    clearStatus()
  }

  function cancelResetRequest() {
    setMode('signIn')
    setResetEmail('')
    setResetSent(false)
    clearStatus()
  }

  function openRegistration() {
    setMode('register')
    setRegisterEmail('')
    setInviteToken(new URLSearchParams(window.location.search).get('invite') || '')
    setRegisterPassword('')
    setConfirmRegisterPassword('')
    clearStatus()
  }

  function cancelRegistration() {
    setMode('signIn')
    setRegisterEmail('')
    setInviteToken('')
    setRegisterPassword('')
    setConfirmRegisterPassword('')
    clearStatus()
  }

  async function registerUser() {
    if (!registerEmail || !inviteToken || !registerPassword || !confirmRegisterPassword) return setError('Invite token, email, and password are required.')
    if (registerPassword.length < 6) return setError('Password must be at least 6 characters.')
    if (registerPassword !== confirmRegisterPassword) return setError('Passwords do not match.')
    setLoading(true)
    clearStatus()
    const { data, error: err } = await supabase.auth.signUp({
      email: registerEmail,
      password: registerPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/admin?invite=${encodeURIComponent(inviteToken)}`,
      },
    })
    setLoading(false)
    if (err) return setError(err.message)

    setRegisterPassword('')
    setConfirmRegisterPassword('')
    if (data.session) {
      const { error: inviteError } = await supabase.rpc('accept_admin_invite', { invite_token: inviteToken })
      if (inviteError) return setError(inviteError.message)
      setNotice('Account created. You are signed in.')
      onLogin()
    } else {
      setNotice('Account created. Check your email to confirm your account, then sign in from the invite link.')
    }
  }

  async function updatePassword() {
    if (!newPassword || !confirmPassword) return setError('Enter and confirm your new password.')
    if (newPassword.length < 6) return setError('Password must be at least 6 characters.')
    if (newPassword !== confirmPassword) return setError('Passwords do not match.')
    setLoading(true)
    clearStatus()
    const { error: err } = await supabase.auth.updateUser({ password: newPassword })
    setLoading(false)
    if (err) return setError(err.message)
    setNewPassword('')
    setConfirmPassword('')
    setNotice('Password updated. You can now sign in with your new password.')
    onPasswordUpdated?.()
  }

  async function cancelPasswordRecovery() {
    setNewPassword('')
    setConfirmPassword('')
    clearStatus()
    await supabase.auth.signOut()
    onCancelPasswordRecovery?.()
  }

  if (passwordRecovery) return (
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
          <h2 style={{ margin: 0, fontSize: 22, color: COLORS.primary }}>Reset Password</h2>
          <p style={{ margin: '8px 0 0', color: COLORS.textMuted, fontSize: 14 }}>Enter a new password for your staff account.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="New Password">
            <Input value={newPassword} onChange={setNewPassword} type="password" placeholder="New password" autoComplete="new-password" />
          </Field>
          <Field label="Confirm Password">
            <Input value={confirmPassword} onChange={setConfirmPassword} type="password" placeholder="Confirm password" autoComplete="new-password" />
          </Field>
          {error && <p style={{ color: COLORS.danger, fontSize: 13, margin: 0 }}>{error}</p>}
          {notice && <p style={{ color: COLORS.success, fontSize: 13, margin: 0 }}>{notice}</p>}
          <Btn onClick={updatePassword} disabled={loading} style={{ width: '100%', marginTop: 4 }}>
            {loading
              ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Spinner />Updating…</span>
              : 'Update Password'
            }
          </Btn>
          <Btn variant="ghost" onClick={cancelPasswordRecovery} disabled={loading} style={{ width: '100%' }}>
            Cancel and Return to Sign In
          </Btn>
        </div>
      </div>
    </div>
  )

  if (mode === 'requestReset') return (
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
          <h2 style={{ margin: 0, fontSize: 22, color: COLORS.primary }}>Forgot Password</h2>
          <p style={{ margin: '8px 0 0', color: COLORS.textMuted, fontSize: 14 }}>Enter your staff email to receive a reset link.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Staff Email">
            <Input
              value={resetEmail}
              onChange={v => { setResetEmail(v); clearStatus(); setResetSent(false) }}
              type="email"
              placeholder="admin@covictims.org"
              autoComplete="email"
            />
          </Field>
          {error && <p style={{ color: COLORS.danger, fontSize: 13, margin: 0 }}>{error}</p>}
          {notice && <p style={{ color: COLORS.success, fontSize: 13, margin: 0 }}>{notice}</p>}
          <Btn onClick={sendResetEmail} disabled={loading || resetSent} style={{ width: '100%', marginTop: 4 }}>
            {loading
              ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Spinner />Sending…</span>
              : resetSent ? 'Reset Email Sent' : 'Send Reset Email'
            }
          </Btn>
          <Btn variant="ghost" onClick={cancelResetRequest} disabled={loading} style={{ width: '100%' }}>
            Cancel
          </Btn>
        </div>
      </div>
    </div>
  )

  if (mode === 'register') return (
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
          <h2 style={{ margin: 0, fontSize: 22, color: COLORS.primary }}>Accept Admin Invite</h2>
          <p style={{ margin: '8px 0 0', color: COLORS.textMuted, fontSize: 14 }}>Use your invite token to register for admin access.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Invite Token">
            <Input
              value={inviteToken}
              onChange={v => { setInviteToken(v); clearStatus() }}
              placeholder="Paste invite token"
              autoComplete="off"
            />
          </Field>
          <Field label="Staff Email">
            <Input
              value={registerEmail}
              onChange={v => { setRegisterEmail(v); clearStatus() }}
              type="email"
              placeholder="staff@example.org"
              autoComplete="email"
            />
          </Field>
          <Field label="Password">
            <Input
              value={registerPassword}
              onChange={v => { setRegisterPassword(v); clearStatus() }}
              type="password"
              placeholder="Create password"
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirm Password">
            <Input
              value={confirmRegisterPassword}
              onChange={v => { setConfirmRegisterPassword(v); clearStatus() }}
              type="password"
              placeholder="Confirm password"
              autoComplete="new-password"
            />
          </Field>
          {error && <p style={{ color: COLORS.danger, fontSize: 13, margin: 0 }}>{error}</p>}
          {notice && <p style={{ color: COLORS.success, fontSize: 13, margin: 0 }}>{notice}</p>}
          <Btn onClick={registerUser} disabled={loading} style={{ width: '100%', marginTop: 4 }}>
            {loading
              ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Spinner />Creating…</span>
              : 'Create Account from Invite'
            }
          </Btn>
          <Btn variant="ghost" onClick={cancelRegistration} disabled={loading} style={{ width: '100%' }}>
            Cancel
          </Btn>
        </div>
      </div>
    </div>
  )

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
            <Input value={email} onChange={setEmail} type="email" placeholder="admin@covictims.org" autoComplete="username" />
          </Field>
          <Field label="Password">
            <div style={{ position: 'relative' }}>
              <Input
                value={password}
                onChange={setPassword}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  padding: 6, borderRadius: 6, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: COLORS.textSecondary,
                }}
              >
                {showPassword ? (
                  // eye-off
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  // eye
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </Field>
          {error && <p style={{ color: COLORS.danger, fontSize: 13, margin: 0 }}>{error}</p>}
          {adminError && <p style={{ color: COLORS.danger, fontSize: 13, margin: 0 }}>{adminError}</p>}
          {notice && <p style={{ color: COLORS.success, fontSize: 13, margin: 0 }}>{notice}</p>}
          {onClaimSuperAdmin && (
            <div style={{ background: '#FFF8DC', border: '1px solid #E8D48B', borderRadius: 12, padding: 12 }}>
              <p style={{ color: COLORS.textSecondary, fontSize: 13, margin: '0 0 10px', lineHeight: 1.5 }}>
                No approved admin profile is attached to this session. If this is the first admin account, claim the initial super admin role.
              </p>
              <Btn variant="warm" onClick={onClaimSuperAdmin} style={{ width: '100%' }}>
                Claim Initial Super Admin
              </Btn>
            </div>
          )}
          <Btn onClick={signIn} disabled={loading} style={{ width: '100%', marginTop: 4 }}>
            {loading
              ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Spinner />Signing in…</span>
              : 'Sign In'
            }
          </Btn>
          <button
            type="button"
            onClick={openResetRequest}
            disabled={loading}
            style={{
              background: 'transparent',
              border: 'none',
              color: loading ? COLORS.textMuted : COLORS.primary,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Georgia, serif',
              fontSize: 13,
              padding: 4,
              textDecoration: 'underline',
            }}
          >
            Forgot your password?
          </button>
          <button
            type="button"
            onClick={openRegistration}
            disabled={loading}
            style={{
              background: 'transparent',
              border: 'none',
              color: loading ? COLORS.textMuted : COLORS.primary,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Georgia, serif',
              fontSize: 13,
              padding: 4,
              textDecoration: 'underline',
            }}
          >
            Accept an admin invite
          </button>
        </div>
       
      </div>
    </div>
  )
}
