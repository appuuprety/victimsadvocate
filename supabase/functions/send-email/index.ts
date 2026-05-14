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

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    let payload: any
    try {
      payload = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS },
      })
    }

    const { to, brochures, brochureTitle, link } = payload

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

    await transporter.sendMail({
      from: `Colorado Victim Services <${GMAIL_USER}>`,
      to,
      subject,
      text: `Resources shared with you:\n\n${resourcesText}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
          <h2 style="color:#003DA5">${isMulti ? `${items.length} resources have been shared with you` : 'A resource has been shared with you'}</h2>
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
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS },
    })
  }
})
