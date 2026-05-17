import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.104.1'
import nodemailer from 'npm:nodemailer@6.9.9'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const GMAIL_USER = Deno.env.get('GMAIL_USER')!
const GMAIL_PASS = Deno.env.get('GMAIL_PASS')!

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_PASS,
  },
})

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  })
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

async function requireSuperAdmin(req: Request) {
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) return { error: json({ error: 'Missing authorization header' }, 401) }

  const { data: userData, error: userError } = await service.auth.getUser(token)
  if (userError || !userData.user) return { error: json({ error: 'Invalid authorization token' }, 401) }

  const { data: profile, error: profileError } = await service
    .from('admin_profiles')
    .select('role,status')
    .eq('user_id', userData.user.id)
    .single()

  if (profileError || !profile) return { error: json({ error: 'Admin profile not found' }, 403) }
  if (profile.status !== 'approved' || profile.role !== 'super_admin') {
    return { error: json({ error: 'Super admin access required' }, 403) }
  }

  return { user: userData.user }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const auth = await requireSuperAdmin(req)
    if (auth.error) return auth.error

    let payload: any
    try {
      payload = await req.json()
    } catch {
      return json({ error: 'Invalid JSON body' }, 400)
    }

    const to = String(payload.to || '').trim().toLowerCase()
    const inviteLink = String(payload.inviteLink || '').trim()
    const role = payload.role === 'super_admin' ? 'super admin' : 'admin'

    if (!to) return json({ error: 'Missing recipient' }, 400)
    if (!inviteLink) return json({ error: 'Missing invite link' }, 400)

    const safeLink = escapeHtml(inviteLink)
    const roleLabel = escapeHtml(role)

    await transporter.sendMail({
      from: `Colorado Victim Services <${GMAIL_USER}>`,
      to,
      subject: 'Admin portal invitation',
      text: [
        'You have been invited to create an admin account for the Colorado Victim Services portal.',
        '',
        `Role: ${role}`,
        '',
        `Accept invite: ${inviteLink}`,
        '',
        'If you were not expecting this invitation, you can ignore this email.',
      ].join('\n'),
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
          <h2 style="color:#003DA5">Admin portal invitation</h2>
          <p>You have been invited to create an admin account for the Colorado Victim Services portal.</p>
          <p style="margin:0 0 18px;color:#555">Role: <strong>${roleLabel}</strong></p>
          <a href="${safeLink}" style="display:inline-block;background:#003DA5;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px">
            Accept Invite
          </a>
          <p style="margin:16px 0 0;font-size:12px;color:#777">${safeLink}</p>
          <p style="margin-top:24px;font-size:12px;color:#888">
            If you were not expecting this invitation, you can ignore this email.
          </p>
        </div>
      `,
    })

    return json({ success: true })
  } catch (e) {
    return json({ error: e.message }, 500)
  }
})
