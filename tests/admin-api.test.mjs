import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'
import { createClient } from '@supabase/supabase-js'

loadDotEnv()

const SUPABASE_URL = mustGetEnv('VITE_SUPABASE_URL')
const SUPABASE_ANON_KEY = mustGetEnv('VITE_SUPABASE_ANON_KEY')
const SUPABASE_SERVICE_ROLE_KEY = mustGetEnv('SUPABASE_SERVICE_ROLE_KEY')
const EMAIL_RECIPIENT = process.env.E2E_EMAIL_RECIPIENT || 'avishekuprety@gmail.com'

const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function mustGetEnv(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

function loadDotEnv() {
  if (!existsSync('.env')) return

  const lines = readFileSync('.env', 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/)
    if (!match) continue
    const [, key, rawValue] = match
    if (process.env[key]) continue
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, '')
  }
}

function makeUserClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function ensureCategory() {
  const id = 'e2e_tests'
  const { data, error } = await service
    .from('categories')
    .upsert({
      id,
      label: 'E2E Tests',
      icon: '🧪',
      color: '#003DA5',
      sort_order: 9999,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

async function createApprovedAdminUser(role = 'admin') {
  const suffix = randomUUID()
  const email = `e2e-${suffix}@example.com`
  const password = `Test-${suffix}!a1`

  const { data: created, error: createError } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (createError) throw createError

  const userId = created.user.id
  const { error: profileError } = await service.from('admin_profiles').insert({
    user_id: userId,
    email,
    role,
    status: 'approved',
  })
  if (profileError) throw profileError

  return { email, password, userId }
}

async function cleanup({ userId, brochureId, filePath }) {
  if (brochureId) await service.from('brochures').delete().eq('id', brochureId)
  if (filePath) await service.storage.from('brochures').remove([filePath])
  if (userId) {
    await service.from('admin_profiles').delete().eq('user_id', userId)
    await service.auth.admin.deleteUser(userId)
  }
}

async function cleanupInvite({ inviteId }) {
  if (!inviteId) return
  await service.from('admin_invite_attempts').delete().eq('invite_id', inviteId)
  await service.from('admin_invites').delete().eq('id', inviteId)
}

test('admin can upload a document and edit the brochure record', async () => {
  const category = await ensureCategory()
  const adminUser = await createApprovedAdminUser()
  const client = makeUserClient()
  let brochureId = null
  let filePath = null

  try {
    const { error: signInError } = await client.auth.signInWithPassword({
      email: adminUser.email,
      password: adminUser.password,
    })
    assert.ifError(signInError)

    const fileName = `e2e-${randomUUID()}.pdf`
    filePath = fileName
    const fileBody = new Blob(['%PDF-1.4\n% VictimsAdvocate admin upload integration test\n'], {
      type: 'application/pdf',
    })

    const { error: uploadError } = await client.storage
      .from('brochures')
      .upload(filePath, fileBody, { contentType: 'application/pdf' })
    assert.ifError(uploadError)

    const title = `E2E Upload ${randomUUID()}`
    const { data: inserted, error: insertError } = await client
      .from('brochures')
      .insert({
        title,
        description: 'Created by admin API integration test.',
        category_id: category.id,
        tags: ['e2e', 'admin'],
        featured: false,
        link_url: null,
        phone_number: null,
        business_hours: null,
        file_name: fileName,
        file_path: filePath,
        file_size: '0.0 MB',
        file_type: 'pdf',
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()
    assert.ifError(insertError)
    brochureId = inserted.id

    const editedTitle = `${title} Edited`
    const { data: updated, error: updateError } = await client
      .from('brochures')
      .update({
        title: editedTitle,
        description: 'Edited by admin API integration test.',
        featured: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', brochureId)
      .select()
      .single()

    assert.ifError(updateError)
    assert.equal(updated.title, editedTitle)
    assert.equal(updated.featured, true)
  } finally {
    await cleanup({ userId: adminUser.userId, brochureId, filePath })
  }
})

test('public share email function sends an email', async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: EMAIL_RECIPIENT,
      brochureTitle: `E2E Email ${new Date().toISOString()}`,
      link: 'https://example.com/victimsadvocate-e2e',
    }),
  })

  const body = await response.json().catch(() => ({}))
  assert.equal(response.status, 200, JSON.stringify(body))
  assert.equal(body.success, true)
})

test('super admin can send an admin invite email', async () => {
  const adminUser = await createApprovedAdminUser('super_admin')
  const client = makeUserClient()

  try {
    const { data: signIn, error: signInError } = await client.auth.signInWithPassword({
      email: adminUser.email,
      password: adminUser.password,
    })
    assert.ifError(signInError)

    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-invite`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        authorization: `Bearer ${signIn.session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: EMAIL_RECIPIENT,
        inviteLink: `https://example.com/admin?invite=e2e-${randomUUID()}`,
        role: 'admin',
      }),
    })

    const body = await response.json().catch(() => ({}))
    assert.equal(response.status, 200, JSON.stringify(body))
    assert.equal(body.success, true)
  } finally {
    await cleanup({ userId: adminUser.userId })
  }
})

test('admin invite attempts require exact email match and are logged', async () => {
  const adminUser = await createApprovedAdminUser('super_admin')
  const invitedEmail = `invite-${randomUUID()}@example.com`
  const token = `token-${randomUUID()}`
  let inviteId = null

  try {
    const { data: invite, error: inviteError } = await service
      .from('admin_invites')
      .insert({
        email: invitedEmail,
        role: 'admin',
        token,
        invited_by: adminUser.userId,
      })
      .select()
      .single()
    assert.ifError(inviteError)
    inviteId = invite.id

    const anon = makeUserClient()
    const { data: mismatch, error: mismatchError } = await anon.rpc('log_admin_invite_attempt', {
      invite_token: token,
      entered_email: invitedEmail.toUpperCase(),
    })
    assert.ifError(mismatchError)
    assert.equal(mismatch, false)

    const { data: matched, error: matchedError } = await anon.rpc('log_admin_invite_attempt', {
      invite_token: token,
      entered_email: invitedEmail,
    })
    assert.ifError(matchedError)
    assert.equal(matched, true)

    const { data: attempts, error: attemptsError } = await service
      .from('admin_invite_attempts')
      .select('entered_email,invite_email,matched')
      .eq('invite_id', inviteId)
      .order('created_at', { ascending: true })
    assert.ifError(attemptsError)
    assert.equal(attempts.length, 2)
    assert.equal(attempts[0].entered_email, invitedEmail.toUpperCase())
    assert.equal(attempts[0].matched, false)
    assert.equal(attempts[1].entered_email, invitedEmail)
    assert.equal(attempts[1].invite_email, invitedEmail)
    assert.equal(attempts[1].matched, true)
  } finally {
    await cleanupInvite({ inviteId })
    await cleanup({ userId: adminUser.userId })
  }
})

test('super admin can remove another admin profile', async () => {
  const superAdmin = await createApprovedAdminUser('super_admin')
  const adminUser = await createApprovedAdminUser('admin')
  const client = makeUserClient()

  try {
    const { error: signInError } = await client.auth.signInWithPassword({
      email: superAdmin.email,
      password: superAdmin.password,
    })
    assert.ifError(signInError)

    const { error: deleteError } = await client.rpc('delete_admin_profile', {
      target_user_id: adminUser.userId,
    })
    assert.ifError(deleteError)

    const { data: profile } = await service
      .from('admin_profiles')
      .select('user_id')
      .eq('user_id', adminUser.userId)
      .maybeSingle()
    assert.equal(profile, null)
  } finally {
    await cleanup({ userId: adminUser.userId })
    await cleanup({ userId: superAdmin.userId })
  }
})

test('approved admin can create, search, edit, and delete field guide entries', async () => {
  const adminUser = await createApprovedAdminUser('admin')
  const client = makeUserClient()
  let entryId = null

  try {
    const { error: signInError } = await client.auth.signInWithPassword({
      email: adminUser.email,
      password: adminUser.password,
    })
    assert.ifError(signInError)

    const title = `E2E Field Guide ${randomUUID()}`
    const { data: inserted, error: insertError } = await client
      .from('field_guide_entries')
      .insert({
        section: 'E2E',
        title,
        body: 'Searchable mobile field guide content.',
        tags: ['e2e', 'field-guide'],
        sort_order: 9999,
      })
      .select()
      .single()
    assert.ifError(insertError)
    entryId = inserted.id

    const { data: found, error: searchError } = await client
      .from('field_guide_entries')
      .select('id,title,body')
      .ilike('title', `%${title}%`)
      .single()
    assert.ifError(searchError)
    assert.equal(found.id, entryId)

    const { data: updated, error: updateError } = await client
      .from('field_guide_entries')
      .update({ body: 'Edited field guide content.', updated_at: new Date().toISOString() })
      .eq('id', entryId)
      .select()
      .single()
    assert.ifError(updateError)
    assert.equal(updated.body, 'Edited field guide content.')

    const { error: deleteError } = await client
      .from('field_guide_entries')
      .delete()
      .eq('id', entryId)
    assert.ifError(deleteError)
    entryId = null
  } finally {
    if (entryId) await service.from('field_guide_entries').delete().eq('id', entryId)
    await cleanup({ userId: adminUser.userId })
  }
})

test('seeded victim advocate field guide entries are searchable', async () => {
  const adminUser = await createApprovedAdminUser('admin')
  const client = makeUserClient()

  try {
    const { error: signInError } = await client.auth.signInWithPassword({
      email: adminUser.email,
      password: adminUser.password,
    })
    assert.ifError(signInError)

    const { data: creed, error: creedError } = await client
      .from('field_guide_entries')
      .select('title,body')
      .ilike('title', '%Creed%')
      .single()
    assert.ifError(creedError)
    assert.match(creed.body, /listen/)

    const { data: callSummary, error: callSummaryError } = await client
      .from('field_guide_entries')
      .select('title,body')
      .ilike('body', '%Summary Call Sheet%')
      .limit(1)
    assert.ifError(callSummaryError)
    assert.equal(callSummary.length, 1)
  } finally {
    await cleanup({ userId: adminUser.userId })
  }
})
