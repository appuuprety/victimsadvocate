import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import nodemailer from 'npm:nodemailer@6.9.9'

const GMAIL_USER = Deno.env.get('GMAIL_USER')!
const GMAIL_PASS = Deno.env.get('GMAIL_PASS')!

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_PASS,
  },
})

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function nl2br(value: string) {
  return escapeHtml(value).replace(/\n/g, '<br>')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { to, brochures, brochureTitle, link, message } = await req.json()

    // Normalize to array — supports both single (legacy) and multi-resource payloads
    const raw = Array.isArray(brochures) && brochures.length > 0
      ? brochures
      : [{ title: brochureTitle ?? '', link: link ?? '' }]

    const items: { title: string; link: string }[] = raw.map((r: any) => ({
      title: r.title ?? '',
      link: r.link ?? '',
    }))

    if (!to) {
      return new Response(JSON.stringify({ error: 'Missing recipient' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS },
      })
    }

    const isMulti = items.length > 1
    const subject = isMulti
      ? `${items.length} resources shared with you`
      : items[0].title
        ? `Resource shared with you: ${items[0].title}`
        : 'A resource has been shared with you'

    const resourcesHtml = items.map(r => `
      <div style="margin-bottom:16px;padding:16px;background:#f5f5f5;border-radius:8px">
        ${r.title ? `<p style="margin:0 0 10px;font-weight:600;color:#0F2D5E">${r.title}</p>` : ''}
        <a href="${r.link}" style="display:inline-block;background:#003DA5;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px">
          View Resource →
        </a>
        <p style="margin:8px 0 0;font-size:11px;color:#888">${r.link}</p>
      </div>
    `).join('')

    const resourcesText = items.map(r => `${r.title ?? ''}\n${r.link}`).join('\n\n')
    const shareMessage = typeof message === 'string' ? message.trim() : ''
    const textParts = [
      shareMessage,
      `Resources shared with you:\n\n${resourcesText}`,
    ].filter(Boolean)

    await transporter.sendMail({
      from: `Colorado Victim Services <${GMAIL_USER}>`,
      to,
      subject,
      text: textParts.join('\n\n'),
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
          <h2 style="color:#003DA5">${isMulti ? `${items.length} resources have been shared with you` : 'A resource has been shared with you'}</h2>
          ${shareMessage ? `<div style="margin:0 0 18px;padding:14px 16px;background:#fff8dc;border-left:4px solid #c49a00;color:#333;line-height:1.5">${nl2br(shareMessage)}</div>` : ''}
          ${resourcesHtml}
          <p style="margin-top:24px;font-size:12px;color:#888">
            Sent anonymously via Colorado Victim Services.
          </p>
        </div>
      `,
    })

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', ...CORS },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error('send-email failed', e)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS },
    })
  }
})
