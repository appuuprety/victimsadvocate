import { useState } from 'react'
import { Btn, Input, COLORS } from './ui'
import { buildShareLink, logShare } from '../lib/helpers'
import { supabase, ANON_KEY } from '../supabaseClient'
import { T } from '../lib/translations'

export default function ShareModal({ brochures, onClose, lang, palette = COLORS }) {
  const t = T[lang]
  const [tab, setTab] = useState('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [carrier, setCarrier] = useState('')
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

  const SEND_FAILURE_MESSAGE = "We couldn't send that. Please check the details and try again."

  async function invoke(to, item) {
    const { error } = await supabase.functions.invoke('send-email', {
      body: { to, brochureTitle: item.title, link: item.link },
      headers: {
        Authorization: `Bearer ${ANON_KEY}`,
        apikey: ANON_KEY,
      },
    })
    if (error) throw error
  }

  async function sendEmail() {
    if (!email) return
    const item = items[0]
    if (!item) return
    setSending(true); resetStatus()
    try {
      await invoke(email, item)
      await logShare(item.id, 'email')
      setSent(true)
    } catch (e) {
      console.error('Failed to send email share:', e)
      setError(SEND_FAILURE_MESSAGE)
    } finally {
      setSending(false)
    }
  }

  async function sendSms() {
    if (!phone || !carrier) return
    const item = items[0]
    if (!item) return
    const gatewayEmail = `${phone.replace(/\D/g, '')}@${carrier}`
    setSending(true); resetStatus()
    try {
      await invoke(gatewayEmail, item)
      await logShare(item.id, 'sms')
      setSent(true)
    } catch (e) {
      console.error('Failed to send text share:', e)
      setError(SEND_FAILURE_MESSAGE)
    } finally {
      setSending(false)
    }
  }

  async function copyAll() {
    const text = items.map(b => `${b.title}\n${b.link}`).join('\n\n')
    try { await navigator.clipboard.writeText(text) } catch {
      // Clipboard access can be unavailable in some browsers.
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
          background: palette.cardBg, borderRadius: 20,
          padding: '24px 24px 32px', width: '100%', maxWidth: 500,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        {/* Drag handle */}
        <div style={{ width: 40, height: 4, background: palette.border, borderRadius: 4, margin: '0 auto 20px' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ flex: 1, paddingRight: 12 }}>
            <h3 id="share-modal-title" style={{ margin: 0, fontSize: 18, fontFamily: 'Georgia, serif', color: palette.primary }}>
              {isMulti ? `Share ${items.length} Resources` : t.share_resource}
            </h3>
            {isMulti ? (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {items.map(b => (
                  <div key={b.id} style={{ fontSize: 12, color: palette.textMuted, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                    <span style={{ color: palette.primary, fontWeight: 700, flexShrink: 0 }}>·</span>
                    <span>{b.title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ margin: '4px 0 0', fontSize: 13, color: palette.textMuted }}>{items[0]?.title}</p>
            )}
          </div>
          <button onClick={onClose} aria-label="Close" style={{
            background: palette.pageBg, border: 'none', cursor: 'pointer',
            fontSize: 18, color: palette.textSecondary, borderRadius: '50%',
            width: 32, height: 32, display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0,
          }}>×</button>
        </div>

        {/* Tabs */}
        <div role="tablist" style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {['email', 'text', 'link'].map(t2 => (
            <button key={t2} role="tab" aria-selected={tab === t2} onClick={() => { setTab(t2); resetStatus() }} style={{
              flex: 1, padding: '10px 0', borderRadius: 12, border: '1.5px solid',
              borderColor: tab === t2 ? palette.primary : palette.border,
              background: tab === t2 ? palette.primaryLight : palette.pageBg,
              color: tab === t2 ? palette.primary : palette.textSecondary,
              fontWeight: 600, fontSize: 13, cursor: 'pointer',
              fontFamily: 'Georgia, serif', minHeight: 44,
              WebkitTapHighlightColor: 'transparent',
            }}>
              {t2 === 'email' ? `🔒 ${t.email_tab}` : t2 === 'text' ? `🔒 ${t.text_tab}` : t.link_tab}
            </button>
          ))}
        </div>

        {sent && (
          <div style={{
            padding: 16,
            borderRadius: 12,
            background: '#E1F5EE',
            border: '1.5px solid #B8E1CF',
            marginBottom: 16,
          }}>
            <p style={{ margin: '0 0 4px', fontSize: 15, color: palette.success, fontWeight: 700 }}>
              {tab === 'text' ? 'Text sent anonymously.' : 'Email sent anonymously.'}
            </p>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: palette.textSecondary }}>
              You can close this window to return to the resources page.
            </p>
            <Btn variant="success" palette={palette} onClick={onClose} style={{ width: '100%' }}>
              Close and Return to Resources.
            </Btn>
          </div>
        )}

        {tab === 'email' && (
          <div>
            <p style={{ fontSize: 14, color: palette.textSecondary, marginTop: 0, marginBottom: 4 }}>
              Recipient's email address
            </p>
            <Input
              value={email}
              onChange={v => { setEmail(v); resetStatus() }}
              placeholder="recipient@email.com"
              type="email"
              style={{ marginBottom: 8 }}
            />
            <p style={{ fontSize: 12, color: palette.textMuted, marginTop: 0, marginBottom: 12 }}>
              Sent from the org's address — your personal email stays hidden.
            </p>
            {error && <p style={{ fontSize: 13, color: '#B91C1C', marginBottom: 10 }}>{error}</p>}
            <Btn palette={palette} style={{ width: '100%' }} onClick={sendEmail} disabled={sending || !email}>
              {sending ? 'Sending…' : sent ? 'Send Again' : 'Send Anonymously'}
            </Btn>
          </div>
        )}

        {tab === 'text' && (
          <div>
            <p style={{ fontSize: 14, color: palette.textSecondary, marginTop: 0, marginBottom: 12 }}>
              {t.text_label}
            </p>
            <Input
              value={phone}
              onChange={v => { setPhone(v); resetStatus() }}
              placeholder="9705550100"
              type="tel"
              style={{ marginBottom: 4 }}
            />
            <p style={{ fontSize: 12, color: palette.textMuted, marginTop: 0, marginBottom: 10 }}>
              Digits only — no dashes or spaces.
            </p>
            <select
              value={carrier}
              onChange={e => { setCarrier(e.target.value); resetStatus() }}
              style={{
                width: '100%', padding: '11px 12px', borderRadius: 12,
                border: `1.5px solid ${palette.border}`, fontSize: 14,
                color: carrier ? '#222' : palette.textMuted, background: palette.pageBg,
                marginBottom: 12, cursor: 'pointer', appearance: 'none',
                WebkitAppearance: 'none', outline: 'none',
              }}
            >
              <option value="" disabled>Recipient's carrier…</option>
              {CARRIERS.map(c => (
                <option key={c.gateway} value={c.gateway}>{c.label}</option>
              ))}
            </select>
            <p style={{ fontSize: 12, color: palette.textMuted, marginTop: -6, marginBottom: 12 }}>
              Sent via email-to-SMS gateway — your number stays hidden.
            </p>
            {error && <p style={{ fontSize: 13, color: '#B91C1C', marginBottom: 10 }}>{error}</p>}
            <Btn palette={palette} style={{ width: '100%' }} onClick={sendSms} disabled={sending || !phone || !carrier}>
              {sending ? 'Sending…' : sent ? 'Send Again' : 'Send Anonymously'}
            </Btn>
          </div>
        )}

        {tab === 'link' && (
          <div>
            <p style={{ fontSize: 14, color: palette.textSecondary, marginTop: 0, marginBottom: 12 }}>{t.link_label}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {items.map(b => (
                <div key={b.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {isMulti && <div style={{ fontSize: 11, color: palette.textMuted, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</div>}
                    <input
                      readOnly
                      value={b.link}
                      style={{
                        width: '100%', padding: '9px 12px', borderRadius: 10,
                        border: `1.5px solid ${palette.border}`, fontSize: 12, fontFamily: 'monospace',
                        background: palette.pageBg, color: '#444441', overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <Btn variant={copied ? 'success' : 'ghost'} palette={palette} onClick={copyAll} style={{ width: '100%' }}>
              {copied ? '✓ Copied!' : isMulti ? 'Copy All Links' : t.copy}
            </Btn>
          </div>
        )}
      </div>
    </div>
  )
}
