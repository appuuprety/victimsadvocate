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
    const { to, brochureTitle, link } = await req.json()

    if (!to || !link) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS },
      })
    }

    const subject = brochureTitle
      ? `Resource shared with you: ${brochureTitle}`
      : 'A resource has been shared with you'

    await transporter.sendMail({
      from: `Victim Services Erie <${GMAIL_USER}>`,
      to,
      subject,
      text: `A resource has been shared with you:\n\n${brochureTitle ?? ''}\n${link}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
          <h2 style="color:#0F2D5E">A resource has been shared with you</h2>
          ${brochureTitle ? `<p><strong>${brochureTitle}</strong></p>` : ''}
          <a href="${link}" style="display:inline-block;background:#0F2D5E;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:8px">
            View Resource
          </a>
          <p style="margin-top:24px;font-size:12px;color:#888">
            If the button doesn't work, copy this link: ${link}
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
