import { useState } from 'react'
import { Btn, Input, Textarea, COLORS } from './ui'
import { buildShareLink, logShare } from '../lib/helpers'
import { ANON_KEY, SUPABASE_URL } from '../supabaseClient'
import { T } from '../lib/translations'

export default function ShareModal({ brochures, onClose, lang }) {
  const t = T[lang]
  const [tab, setTab] = useState('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [carrier, setCarrier] = useState('')
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const seen = new Set()
  const items = brochures.filter(b => {
    if (seen.has(b.id)) return false
    seen.add(b.id)
    return true
  }).map(b => ({
    id: b.id,
    title: b.title,
    link: b.link_url || buildShareLink(b),
  }))

  const CARRIERS = [
    { label: 'T-Mobile',     gateway: 'tmomail.net' },
    { label: 'AT&T',         gateway: 'txt.att.net' },
    { label: 'Verizon',      gateway: 'vtext.com' },
    { label: 'Sprint',       gateway: 'messaging.sprintpcs.com' },
    { label: 'Boost Mobile', gateway: 'sms.myboostmobile.com' },
    { label: 'Cricket',      gateway: 'sms.cricketwireless.net' },
    { label: 'Metro PCS',    gateway: 'mymetropcs.com' },
    { label: 'US Cellular',  gateway: 'email.uscc.net' },
    { label: 'Google Fi',    gateway: 'msg.fi.google.com' },
  ]

  function resetStatus() { setSent(false); setError('') }

  async function getFunctionErrorMessage(response) {
    const text = await response.text()
    if (text) {
      try {
        const body = JSON.parse(text)
        if (body?.error) return body.error
        if (body?.message) return body.message
      } catch {
        return text
      }
    }
    return `Send failed with status ${response.status}.`
  }

  async function invoke(to) {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      body: JSON.stringify({ to, brochures: items, message: message.trim() }),
      headers: {
        Authorization: `Bearer ${ANON_KEY}`,
        apikey: ANON_KEY,
        'Content-Type': 'application/json',
      },
    })
    if (!response.ok) throw new Error(await getFunctionErrorMessage(response))
  }

  async function sendEmail() {
    if (!email) return
    setSending(true); resetStatus()
    try {
      await invoke(email)
      setSent(true)
      items.forEach(b => logShare(b.id, 'email'))
    } catch (e) {
      setError(e?.message || 'Failed to send. Please try again.')
    } finally {
      setSending(false)
    }
  }

  async function sendSms() {
    if (!phone || !carrier) return
    const gatewayEmail = `${phone.replace(/\D/g, '')}@${carrier}`
    setSending(true); resetStatus()
    try {
      await invoke(gatewayEmail)
      setSent(true)
      items.forEach(b => logShare(b.id, 'sms'))
    } catch (e) {
      setError(e?.message || 'Failed to send. Please try again.')
    } finally {
      setSending(false)
    }
  }

  async function copyAll() {
    const resourcesText = items.map(b => `${b.title}\n${b.link}`).join('\n\n')
    const text = [message.trim(), resourcesText].filter(Boolean).join('\n\n')
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      setError('Copy failed. Please copy the link manually.')
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    items.forEach(b => logShare(b.id, 'link'))
  }

  const isMulti = items.length > 1

  return (
    <div
      role="presentation"
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,45,94,0.7)',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        zIndex: 1000, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
        style={{
          background: '#FFFFFF', borderRadius: 20,
          padding: '24px 24px 32px', width: '100%', maxWidth: 500,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        {/* Drag handle */}
        <div style={{ width: 40, height: 4, background: '#D3D1C7', borderRadius: 4, margin: '0 auto 20px' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ flex: 1, paddingRight: 12 }}>
            <h3 id="share-modal-title" style={{ margin: 0, fontSize: 18, fontFamily: 'Georgia, serif', color: COLORS.primary }}>
              {isMulti ? `Share ${items.length} Resources` : t.share_resource}
            </h3>
            {isMulti ? (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {items.map(b => (
                  <div key={b.id} style={{ fontSize: 12, color: COLORS.textMuted, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                    <span style={{ color: COLORS.primary, fontWeight: 700, flexShrink: 0 }}>·</span>
                    <span>{b.title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ margin: '4px 0 0', fontSize: 13, color: COLORS.textMuted }}>{items[0]?.title}</p>
            )}
          </div>
          <button onClick={onClose} aria-label="Close" style={{
            background: '#F5F3EE', border: 'none', cursor: 'pointer',
            fontSize: 18, color: COLORS.textSecondary, borderRadius: '50%',
            width: 32, height: 32, display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0,
          }}>×</button>
        </div>

        {/* Tabs */}
        <div role="tablist" style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {['email', 'text', 'link'].map(t2 => (
            <button key={t2} role="tab" aria-selected={tab === t2} onClick={() => { setTab(t2); resetStatus() }} style={{
              flex: 1, padding: '10px 0', borderRadius: 12, border: '1.5px solid',
              borderColor: tab === t2 ? COLORS.primary : '#E8E6DE',
              background: tab === t2 ? COLORS.primaryLight : '#FAFAF7',
              color: tab === t2 ? COLORS.primary : COLORS.textSecondary,
              fontWeight: 600, fontSize: 13, cursor: 'pointer',
              fontFamily: 'Georgia, serif', minHeight: 44,
              WebkitTapHighlightColor: 'transparent',
            }}>
              {t2 === 'email' ? `🔒 ${t.email_tab}` : t2 === 'text' ? `🔒 ${t.text_tab}` : t.link_tab}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: 18 }}>
          <p style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 0, marginBottom: 6 }}>
            Add a message
          </p>
          <Textarea
            value={message}
            onChange={v => { setMessage(v); resetStatus(); setCopied(false) }}
            placeholder="Optional note to include with the shared resource."
            rows={3}
          />
        </div>

        {tab === 'email' && (
          <div>
            <p style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 0, marginBottom: 4 }}>
              Recipient's email address
            </p>
            <Input
              value={email}
              onChange={v => { setEmail(v); resetStatus() }}
              placeholder="recipient@email.com"
              type="email"
              style={{ marginBottom: 8 }}
            />
            <p style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 0, marginBottom: 12 }}>
              Sent from the org's address — your personal email stays hidden.
            </p>
            {sent && <p style={{ fontSize: 13, color: '#2E7D4F', marginBottom: 10, fontWeight: 600 }}>✓ {items.length > 1 ? `${items.length} emails` : 'Email'} sent anonymously!</p>}
            {error && <p style={{ fontSize: 13, color: '#B91C1C', marginBottom: 10 }}>{error}</p>}
            <Btn style={{ width: '100%' }} onClick={sendEmail} disabled={sending || !email}>
              {sending ? 'Sending…' : sent ? 'Send Again' : 'Send Anonymously'}
            </Btn>
          </div>
        )}

        {tab === 'text' && (
          <div>
            <p style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 0, marginBottom: 12 }}>
              {t.text_label}
            </p>
            <Input
              value={phone}
              onChange={v => { setPhone(v); resetStatus() }}
              placeholder="9705550100"
              type="tel"
              style={{ marginBottom: 4 }}
            />
            <p style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 0, marginBottom: 10 }}>
              Digits only — no dashes or spaces.
            </p>
            <select
              value={carrier}
              onChange={e => { setCarrier(e.target.value); resetStatus() }}
              style={{
                width: '100%', padding: '11px 12px', borderRadius: 12,
                border: '1.5px solid #E8E6DE', fontSize: 14,
                color: carrier ? '#222' : COLORS.textMuted, background: '#FAFAF7',
                marginBottom: 12, cursor: 'pointer', appearance: 'none',
                WebkitAppearance: 'none', outline: 'none',
              }}
            >
              <option value="" disabled>Recipient's carrier…</option>
              {CARRIERS.map(c => (
                <option key={c.gateway} value={c.gateway}>{c.label}</option>
              ))}
            </select>
            <p style={{ fontSize: 12, color: COLORS.textMuted, marginTop: -6, marginBottom: 12 }}>
              Sent via email-to-SMS gateway — your number stays hidden.
            </p>
            {sent && <p style={{ fontSize: 13, color: '#2E7D4F', marginBottom: 10, fontWeight: 600 }}>✓ {items.length > 1 ? `${items.length} texts` : 'Text'} sent anonymously!</p>}
            {error && <p style={{ fontSize: 13, color: '#B91C1C', marginBottom: 10 }}>{error}</p>}
            <Btn style={{ width: '100%' }} onClick={sendSms} disabled={sending || !phone || !carrier}>
              {sending ? 'Sending…' : sent ? 'Send Again' : 'Send Anonymously'}
            </Btn>
          </div>
        )}

        {tab === 'link' && (
          <div>
            <p style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 0, marginBottom: 12 }}>{t.link_label}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {items.map(b => (
                <div key={b.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {isMulti && <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</div>}
                    <input
                      readOnly
                      value={b.link}
                      style={{
                        width: '100%', padding: '9px 12px', borderRadius: 10,
                        border: '1.5px solid #E8E6DE', fontSize: 12, fontFamily: 'monospace',
                        background: '#F5F3EE', color: '#444441', overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <Btn variant={copied ? 'success' : 'ghost'} onClick={copyAll} style={{ width: '100%' }}>
              {copied ? '✓ Copied!' : isMulti ? 'Copy All Links' : t.copy}
            </Btn>
          </div>
        )}
      </div>
    </div>
  )
}
