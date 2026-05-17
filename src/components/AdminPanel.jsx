import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Badge, Btn, Field, Input, Spinner, COLORS } from './ui'
import ColoradoLogo from './ColoradoLogo'
import BrochureCard from './BrochureCard'
import BrochureForm from './BrochureForm'

export default function AdminPanel({ brochures, setBrochures, categories, setCategories, adminProfile, onLogout, onShare }) {
  const [view, setView] = useState('dashboard')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [shareLogs, setShareLogs] = useState([])
  const [newCatName, setNewCatName] = useState('')
  const [newCatIcon, setNewCatIcon] = useState('📌')
  const [newCatColor, setNewCatColor] = useState(COLORS.primary)
  const [catError, setCatError] = useState('')
  const [editingCat, setEditingCat] = useState(null) // category being edited
  const [tutorialSteps, setTutorialSteps] = useState([])
  const [invites, setInvites] = useState([])
  const [inviteAttempts, setInviteAttempts] = useState([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('admin')
  const [inviteLink, setInviteLink] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [inviteNotice, setInviteNotice] = useState('')
  const [inviteSending, setInviteSending] = useState(false)
  const [editingStep, setEditingStep] = useState(null) // tutorial step being edited
  const [tutorialEditMode, setTutorialEditMode] = useState(false)
  const [completedSteps, setCompletedSteps] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tutorial_steps') || '[]') } catch { return [] }
  })

  function toggleStep(id) {
    setCompletedSteps(prev => {
      const next = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      localStorage.setItem('tutorial_steps', JSON.stringify(next))
      return next
    })
  }

  useEffect(() => {
    if (view === 'activity') {
      supabase.from('share_logs').select('*, brochures(title)').order('shared_at', { ascending: false }).limit(30)
        .then(({ data }) => setShareLogs(data || []))
    }
  }, [view])

  useEffect(() => {
    supabase.from('tutorial_steps').select('*').order('sort_order')
      .then(({ data }) => setTutorialSteps(data || []))
  }, [])

  useEffect(() => {
    if (view === 'users' && adminProfile?.role === 'super_admin') {
      supabase.from('admin_invites').select('*').order('created_at', { ascending: false })
        .then(({ data }) => setInvites(data || []))
      supabase.from('admin_invite_attempts').select('*').order('created_at', { ascending: false }).limit(50)
        .then(({ data }) => setInviteAttempts(data || []))
    }
  }, [view, adminProfile])

  function makeInviteToken() {
    const bytes = new Uint8Array(18)
    crypto.getRandomValues(bytes)
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
  }

  async function createInvite() {
    if (!inviteEmail.trim()) return setInviteError('Email is required.')
    const email = inviteEmail.trim().toLowerCase()
    const role = inviteRole
    setInviteError('')
    setInviteNotice('')
    setInviteLink('')
    setInviteSending(true)
    const token = makeInviteToken()
    const { data, error } = await supabase.from('admin_invites').insert({
      email,
      role,
      token,
      invited_by: adminProfile.user_id,
    }).select().single()
    if (error) {
      setInviteSending(false)
      return setInviteError(error.message)
    }
    try {
      const link = `${window.location.origin}/admin?invite=${encodeURIComponent(token)}`
      setInviteLink(link)
      setInviteEmail('')
      setInviteRole('admin')
      setInvites(prev => [data, ...prev])
      try { await navigator.clipboard.writeText(link) } catch {}

      const { error: sendError } = await supabase.functions.invoke('send-invite', {
        body: { to: email, inviteLink: link, role },
      })
      if (sendError) {
        setInviteNotice('Invite link created and copied, but the email could not be sent.')
        setInviteError(`Email failed: ${sendError.message}`)
        return
      }
      setInviteNotice('Invite email sent and link copied.')
      await onLogout?.()
    } finally {
      setInviteSending(false)
    }
  }

  async function saveTutorialStep(step) {
    if (!step.title?.trim()) return
    if (step.id) {
      const { data } = await supabase.from('tutorial_steps').update({
        icon: step.icon, title: step.title, body: step.body,
        is_warning: !!step.is_warning, highlight: !!step.highlight,
        action_label: step.action_label || null, action_view: step.action_view || null,
        sort_order: step.sort_order,
      }).eq('id', step.id).select().single()
      if (data) setTutorialSteps(prev => prev.map(s => s.id === data.id ? data : s))
    } else {
      const nextOrder = (tutorialSteps[tutorialSteps.length - 1]?.sort_order || 0) + 10
      const { data } = await supabase.from('tutorial_steps').insert({
        icon: step.icon || '📌', title: step.title, body: step.body || '',
        is_warning: !!step.is_warning, highlight: !!step.highlight,
        action_label: step.action_label || null, action_view: step.action_view || null,
        sort_order: nextOrder,
      }).select().single()
      if (data) setTutorialSteps(prev => [...prev, data])
    }
    setEditingStep(null)
  }

  async function deleteTutorialStep(step) {
    if (!window.confirm(`Delete step "${step.title}"?`)) return
    await supabase.from('tutorial_steps').delete().eq('id', step.id)
    setTutorialSteps(prev => prev.filter(s => s.id !== step.id))
  }

  function handleFormDone(data, wasEditing) {
    if (wasEditing) setBrochures(prev => prev.map(b => b.id === data.id ? data : b))
    else setBrochures(prev => [data, ...prev])
    setShowForm(false)
    setEditTarget(null)
  }

  async function handleDelete(brochure) {
    if (!window.confirm(`Move "${brochure.title}" to Trash?`)) return
    const { data } = await supabase.from('brochures')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', brochure.id).select().single()
    if (data) setBrochures(prev => prev.map(b => b.id === data.id ? data : b))
  }

  async function handleRestore(brochure) {
    const { data } = await supabase.from('brochures')
      .update({ deleted_at: null })
      .eq('id', brochure.id).select().single()
    if (data) setBrochures(prev => prev.map(b => b.id === data.id ? data : b))
  }

  async function handlePurge(brochure) {
    if (!window.confirm(`Permanently delete "${brochure.title}"? This cannot be undone.`)) return
    if (brochure.file_path && brochure.file_path.length > 2) await supabase.storage.from('brochures').remove([brochure.file_path])
    await supabase.from('brochures').delete().eq('id', brochure.id)
    setBrochures(prev => prev.filter(b => b.id !== brochure.id))
  }

  async function handleToggleFeatured(brochure) {
    const { data } = await supabase.from('brochures').update({ featured: !brochure.featured }).eq('id', brochure.id).select().single()
    if (data) setBrochures(prev => prev.map(b => b.id === data.id ? data : b))
  }

  async function addCategory() {
    if (!newCatName.trim()) return setCatError('Name is required.')
    const id = newCatName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    const { data, error } = await supabase.from('categories').insert({ id, label: newCatName, icon: newCatIcon, color: newCatColor }).select().single()
    if (error) return setCatError(error.message)
    setCategories(prev => [...prev, data])
    setNewCatName('')
    setNewCatIcon('📌')
    setCatError('')
  }

  async function saveCategoryEdit() {
    if (!editingCat?.label?.trim()) return setCatError('Name is required.')
    const { id, label, icon, color } = editingCat
    const { data, error } = await supabase.from('categories')
      .update({ label, icon, color }).eq('id', id).select().single()
    if (error) return setCatError(error.message)
    setCategories(prev => prev.map(c => c.id === id ? data : c))
    setEditingCat(null)
    setCatError('')
  }

  async function deleteCategory(cat) {
    const inUse = brochures.filter(b => b.category_id === cat.id).length
    if (inUse > 0) {
      return setCatError(`Can't delete "${cat.label}" — ${inUse} brochure${inUse !== 1 ? 's use' : ' uses'} it.`)
    }
    if (!window.confirm(`Delete category "${cat.label}"? This cannot be undone.`)) return
    const { error } = await supabase.from('categories').delete().eq('id', cat.id)
    if (error) return setCatError(error.message)
    setCategories(prev => prev.filter(c => c.id !== cat.id))
    setEditingCat(null)
    setCatError('')
  }

  const activeBrochures = brochures.filter(b => !b.deleted_at)
  const trashedBrochures = brochures.filter(b => b.deleted_at)

  const stats = {
    total: activeBrochures.length,
    featured: activeBrochures.filter(b => b.featured).length,
    categories: categories.length,
    shares: shareLogs.length,
  }

  const navItems = [
    ['dashboard', 'Dashboard'],
    ['brochures', 'Brochures'],
    ['categories', 'Categories'],
    ['activity', 'Activity'],
    ['trash', `Trash${trashedBrochures.length ? ` (${trashedBrochures.length})` : ''}`],
    ['tutorial', '🎓 Tutorial'],
  ]
  navItems.push(['users', 'Invites'])

  return (
    <div style={{ fontFamily: 'Georgia, serif', background: '#FAFAF7', minHeight: '100vh', colorScheme: 'light' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .admin-menu-toggle { display: none; }
        @media (max-width: 820px) {
          .admin-header { padding: 0 16px !important; }
          .admin-header-inner {
            height: auto !important;
            min-height: 60px;
            align-items: stretch !important;
            flex-direction: column;
            padding: 10px 0;
            gap: 10px;
          }
          .admin-header-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
          }
          .admin-brand { min-width: 0; }
          .admin-role-badge { display: none; }
          .admin-menu-toggle {
            display: inline-flex !important;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 36px;
            border-radius: 8px;
            border: 1px solid rgba(255,255,255,.35);
            background: rgba(255,255,255,.12);
            color: #fff;
            font-size: 20px;
            cursor: pointer;
          }
          .admin-nav {
            display: none !important;
            flex-direction: column;
            width: 100%;
            gap: 6px !important;
            padding-bottom: 6px;
          }
          .admin-nav.is-open { display: flex !important; }
          .admin-nav button {
            width: 100%;
            text-align: left;
            justify-content: flex-start;
            margin-left: 0 !important;
            padding: 10px 12px !important;
          }
          .admin-content { padding: 20px 16px !important; }
          .invite-form-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <header className="admin-header" style={{ background: 'linear-gradient(135deg, #0F2D5E, #1B4D8E)', padding: '0 32px' }}>
        <div className="admin-header-inner" style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 60 }}>
          <div className="admin-header-top">
            <div className="admin-brand" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ColoradoLogo size={32} />
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, whiteSpace: 'nowrap' }}>CVR Admin Portal</div>
              <span className="admin-role-badge" style={{ background: 'rgba(255,255,255,.15)', color: '#B5D4F4', fontSize: 11, padding: '2px 10px', borderRadius: 10, fontWeight: 600 }}>
                {adminProfile?.role === 'super_admin' ? 'Super Admin' : 'Staff'}
              </span>
            </div>
            <button
              type="button"
              className="admin-menu-toggle"
              aria-label={mobileNavOpen ? 'Close admin menu' : 'Open admin menu'}
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen(open => !open)}
            >
              {mobileNavOpen ? '×' : '☰'}
            </button>
          </div>
          <div className={`admin-nav${mobileNavOpen ? ' is-open' : ''}`} style={{ display: 'flex', gap: 4 }}>
            {navItems.map(([id, label]) => (
              <button key={id} onClick={() => { setView(id); setMobileNavOpen(false) }} style={{
                background: view === id ? 'rgba(255,255,255,.15)' : 'transparent',
                border: 'none', color: '#fff', padding: '6px 14px', borderRadius: 8,
                fontSize: 13, fontWeight: view === id ? 600 : 400, cursor: 'pointer', fontFamily: 'Georgia, serif',
              }}>
                {label}
              </button>
            ))}
            <button onClick={onLogout} style={{
              background: 'rgba(163,45,45,.5)', border: 'none', color: '#fff',
              padding: '6px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
              fontFamily: 'Georgia, serif', marginLeft: 8,
            }}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="admin-content" style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>

        {view === 'dashboard' && <>
          <h2 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 24px', color: COLORS.textPrimary }}>Dashboard</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 16, marginBottom: 32 }}>
            {[
              { label: 'Total Brochures', value: stats.total, icon: '📄', color: COLORS.primary },
              { label: 'Featured', value: stats.featured, icon: '⭐', color: '#BA7517' },
              { label: 'Categories', value: stats.categories, icon: '🗂️', color: COLORS.success },
              { label: 'Share Events', value: stats.shares, icon: '📤', color: '#533AB7' },
            ].map(s => (
              <div key={s.label} style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E8E6DE', padding: '18px 20px' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 18, color: COLORS.textPrimary }}>Recent Uploads</h3>
            <Btn small onClick={() => { setView('brochures'); setShowForm(true); setEditTarget(null) }}>+ Add Brochure</Btn>
          </div>
          <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E8E6DE', overflow: 'hidden' }}>
            {activeBrochures.slice(0, 6).map((b, i) => {
              const cat = categories.find(c => c.id === b.category_id)
              return (
                <div key={b.id} style={{
                  padding: '14px 20px',
                  borderBottom: i < 5 ? '1px solid #F0EEE8' : 'none',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.textPrimary }}>{b.title}</div>
                    <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>{cat?.label || b.category_id} · {b.created_at?.split('T')[0]}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {b.featured && <Badge label="Featured" color="#8B5E0A" bg="#FDF3E3" />}
                    <Btn small variant="ghost" onClick={() => { setEditTarget(b); setShowForm(true); setView('brochures') }}>Edit</Btn>
                    <Btn small variant="ghost" onClick={() => onShare(b)}>Share</Btn>
                  </div>
                </div>
              )
            })}
          </div>
        </>}

        {view === 'brochures' && <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: COLORS.textPrimary }}>Manage Brochures</h2>
            <Btn onClick={() => { setShowForm(!showForm); setEditTarget(null) }}>{showForm ? 'Cancel' : '+ Add Brochure'}</Btn>
          </div>
          {showForm && (
            <div style={{ marginBottom: 28 }}>
              <BrochureForm
                categories={categories}
                initial={editTarget || {}}
                onDone={handleFormDone}
                onCancel={() => { setShowForm(false); setEditTarget(null) }}
              />
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {activeBrochures.map(b => (
              <div key={b.id}>
                <BrochureCard brochure={b} categories={categories} onShare={onShare} lang="en" />
                <div style={{ marginTop: 8, display: 'flex', gap: 12, paddingLeft: 4 }}>
                  <button onClick={() => { setEditTarget(b); setShowForm(true); window.scrollTo(0, 0) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: COLORS.primary, fontFamily: 'Georgia, serif' }}>✏️ Edit</button>
                  <button onClick={() => handleToggleFeatured(b)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: b.featured ? '#BA7517' : COLORS.textMuted, fontFamily: 'Georgia, serif' }}>{b.featured ? '★ Unfeature' : '☆ Feature'}</button>
                  <button onClick={() => handleDelete(b)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: COLORS.danger, fontFamily: 'Georgia, serif' }}>🗑 Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>}

        {view === 'trash' && <>
          <h2 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px', color: COLORS.textPrimary }}>Trash</h2>
          <p style={{ color: COLORS.textMuted, marginTop: 0, marginBottom: 24, fontSize: 14 }}>
            Deleted brochures stay here until you permanently remove them.
          </p>
          {trashedBrochures.length === 0 ? (
            <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E8E6DE', padding: 48, textAlign: 'center', color: COLORS.textMuted }}>
              Trash is empty.
            </div>
          ) : (
            <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E8E6DE', overflow: 'hidden' }}>
              {trashedBrochures.map((b, i) => {
                const cat = categories.find(c => c.id === b.category_id)
                const deletedDate = b.deleted_at?.split('T')[0]
                return (
                  <div key={b.id} style={{
                    padding: '14px 20px',
                    borderBottom: i < trashedBrochures.length - 1 ? '1px solid #F0EEE8' : 'none',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                  }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.textPrimary }}>{b.title}</div>
                      <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                        {cat?.label || b.category_id} · deleted {deletedDate}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Btn small variant="ghost" onClick={() => handleRestore(b)}>Restore</Btn>
                      <Btn small variant="danger" onClick={() => handlePurge(b)}>Delete forever</Btn>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>}

        {view === 'categories' && <>
          <h2 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 24px', color: COLORS.textPrimary }}>Manage Categories</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 16, marginBottom: 32 }}>
            {categories.map(cat => {
              const count = brochures.filter(b => b.category_id === cat.id).length
              return (
                <div key={cat.id} style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E8E6DE', padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: 28 }}>{cat.icon}</div>
                    <Badge label={`${count} resources`} color={COLORS.textSecondary} bg="#F5F3EE" />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginTop: 10, color: COLORS.textPrimary }}>{cat.label}</div>
                  <div style={{ marginTop: 8, width: 24, height: 4, borderRadius: 2, background: cat.color }} />
                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    <button onClick={() => { setEditingCat({ ...cat }); setCatError('') }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: COLORS.primary, fontFamily: 'Georgia, serif', padding: 0 }}>
                      ✏️ Edit
                    </button>
                    <button onClick={() => deleteCategory(cat)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: COLORS.danger, fontFamily: 'Georgia, serif', padding: 0 }}>
                      🗑 Delete
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {editingCat ? (
            <CategoryEditor
              cat={editingCat}
              setCat={setEditingCat}
              onSave={saveCategoryEdit}
              onCancel={() => { setEditingCat(null); setCatError('') }}
              onDelete={() => deleteCategory(editingCat)}
              error={catError}
            />
          ) : (
            <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E8E6DE', padding: 24 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, color: COLORS.textPrimary }}>Add New Category</h3>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ width: 72 }}><Field label="Icon"><Input value={newCatIcon} onChange={setNewCatIcon} placeholder="📌" /></Field></div>
                <div style={{ flex: 1, minWidth: 160 }}><Field label="Name"><Input value={newCatName} onChange={setNewCatName} placeholder="Category name…" /></Field></div>
                <div style={{ width: 52 }}>
                  <Field label="Color">
                    <input type="color" value={newCatColor} onChange={e => setNewCatColor(e.target.value)}
                      style={{ width: 52, height: 44, borderRadius: 10, border: '1.5px solid #E8E6DE', cursor: 'pointer', padding: 2 }} />
                  </Field>
                </div>
                <Btn onClick={addCategory}>Add</Btn>
              </div>
              <EmojiPicker onPick={setNewCatIcon} current={newCatIcon} />
              {catError && <p style={{ color: COLORS.danger, fontSize: 13, marginTop: 10 }}>{catError}</p>}
            </div>
          )}
        </>}

        {view === 'activity' && <>
          <h2 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 24px', color: COLORS.textPrimary }}>Share Activity</h2>
          <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E8E6DE', overflow: 'hidden' }}>
            {shareLogs.length === 0
              ? <div style={{ padding: 40, textAlign: 'center', color: COLORS.textMuted }}>No share activity yet.</div>
              : shareLogs.map((log, i) => (
                <div key={log.id} style={{
                  padding: '12px 20px',
                  borderBottom: i < shareLogs.length - 1 ? '1px solid #F0EEE8' : 'none',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.textPrimary }}>{log.brochures?.title || 'Unknown'}</div>
                    <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>{new Date(log.shared_at).toLocaleString()}</div>
                  </div>
                  <Badge
                    label={log.method === 'email' ? '📧 Email' : log.method === 'sms' ? '💬 SMS' : '🔗 Link'}
                    color={log.method === 'email' ? COLORS.primary : log.method === 'sms' ? '#533AB7' : COLORS.success}
                    bg={log.method === 'email' ? '#E6F1FB' : log.method === 'sms' ? '#EEEDFE' : '#E1F5EE'}
                  />
                </div>
              ))
            }
          </div>
        </>}

        {view === 'tutorial' && (
          <TutorialView
            steps={tutorialSteps}
            completedSteps={completedSteps}
            toggleStep={toggleStep}
            onNavigate={setView}
            editMode={tutorialEditMode}
            setEditMode={setTutorialEditMode}
            editingStep={editingStep}
            setEditingStep={setEditingStep}
            onSave={saveTutorialStep}
            onDelete={deleteTutorialStep}
          />
        )}

        {view === 'users' && <>
          <h2 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px', color: COLORS.textPrimary }}>Send Invites</h2>
          {adminProfile?.role !== 'super_admin' ? (
            <div style={{ background: '#FFF8E8', border: '1px solid #E7C46A', borderRadius: 14, padding: 20, color: '#704E00' }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Super admin access required</div>
              <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                Your current admin role is <strong>{adminProfile?.role || 'unknown'}</strong>. Only approved super admins can send invite links.
              </div>
            </div>
          ) : (
            <>
              <p style={{ color: COLORS.textMuted, marginTop: 0, marginBottom: 24, fontSize: 14 }}>
                Send invite links for staff accounts. Only invited users can register for admin access.
              </p>
              <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E8E6DE', padding: 24, marginBottom: 24 }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 16, color: COLORS.textPrimary }}>Send Invite</h3>
                <div className="invite-form-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) 180px auto', gap: 12, alignItems: 'end' }}>
                  <Field label="Staff Email">
                    <Input value={inviteEmail} onChange={setInviteEmail} type="email" placeholder="staff@example.org" />
                  </Field>
                  <Field label="Role">
                    <select
                      value={inviteRole}
                      onChange={e => setInviteRole(e.target.value)}
                      style={{
                        width: '100%', padding: '11px 14px', borderRadius: 12,
                        border: `1.5px solid ${COLORS.border}`, fontSize: 15,
                        fontFamily: 'Georgia, serif', background: '#FFFFFF', color: COLORS.textPrimary,
                      }}
                    >
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </Field>
                  <Btn onClick={createInvite} disabled={inviteSending}>{inviteSending ? 'Sending...' : 'Send Invite'}</Btn>
                </div>
                {inviteError && <p style={{ color: COLORS.danger, fontSize: 13, marginBottom: 0 }}>{inviteError}</p>}
                {inviteLink && (
                  <div style={{ marginTop: 16, background: '#EAF6EE', border: '1px solid #A8D5B5', borderRadius: 12, padding: 14 }}>
                    <div style={{ fontSize: 13, color: COLORS.success, fontWeight: 700, marginBottom: 6 }}>
                      {inviteNotice || 'Invite link copied'}
                    </div>
                    <input readOnly value={inviteLink} style={{
                      width: '100%', padding: '9px 12px', borderRadius: 8,
                      border: '1.5px solid #C8E4D3', fontSize: 12,
                      fontFamily: 'monospace', color: COLORS.textPrimary,
                    }} />
                  </div>
                )}
              </div>

              <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E8E6DE', overflow: 'hidden' }}>
                {invites.length === 0
                  ? <div style={{ padding: 32, textAlign: 'center', color: COLORS.textMuted }}>No invites yet.</div>
                  : invites.map((invite, i) => (
                    <div key={invite.id} style={{
                      padding: '14px 20px',
                      borderBottom: i < invites.length - 1 ? '1px solid #F0EEE8' : 'none',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.textPrimary }}>{invite.email}</div>
                        <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                          {invite.accepted_at ? `Accepted ${new Date(invite.accepted_at).toLocaleString()}` : `Expires ${new Date(invite.expires_at).toLocaleDateString()}`}
                        </div>
                      </div>
                      <Badge
                        label={invite.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                        color={invite.role === 'super_admin' ? '#8B5E0A' : COLORS.primary}
                        bg={invite.role === 'super_admin' ? '#FDF3E3' : '#E6F1FB'}
                      />
                    </div>
                  ))
                }
              </div>

              <div style={{ marginTop: 24 }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 16, color: COLORS.textPrimary }}>Invite Attempt Log</h3>
                <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E8E6DE', overflow: 'hidden' }}>
                  {inviteAttempts.length === 0
                    ? <div style={{ padding: 24, textAlign: 'center', color: COLORS.textMuted }}>No invite attempts yet.</div>
                    : inviteAttempts.map((attempt, i) => (
                      <div key={attempt.id} style={{
                        padding: '14px 20px',
                        borderBottom: i < inviteAttempts.length - 1 ? '1px solid #F0EEE8' : 'none',
                        display: 'grid',
                        gridTemplateColumns: 'minmax(180px, 1fr) minmax(180px, 1fr) auto',
                        gap: 12,
                        alignItems: 'center',
                      }}>
                        <div>
                          <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Entered Email</div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.textPrimary }}>{attempt.entered_email}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Invite Email</div>
                          <div style={{ fontSize: 14, color: COLORS.textSecondary }}>{attempt.invite_email || 'Unknown invite'}</div>
                          <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>{new Date(attempt.created_at).toLocaleString()}</div>
                        </div>
                        <Badge
                          label={attempt.matched ? 'Matched' : 'Mismatch'}
                          color={attempt.matched ? COLORS.success : COLORS.danger}
                          bg={attempt.matched ? '#EAF6EE' : '#FCEBE8'}
                        />
                      </div>
                    ))
                  }
                </div>
              </div>
            </>
          )}
        </>}
      </div>
    </div>
  )
}

const EMOJI_OPTIONS = [
  '🏠','🛏️','⚖️','💬','💵','🛡️','👨‍👩‍👧','🩺','🚨',
  '🏳️‍🌈','💗','📞','📚','🧠','👶','🍎','🚗','✝️','🕊️','🌈','🤝','📋','📌',
]

function EmojiPicker({ onPick, current }) {
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Quick pick
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {EMOJI_OPTIONS.map(em => (
          <button
            key={em}
            type="button"
            onClick={() => onPick(em)}
            aria-label={`Use ${em}`}
            aria-pressed={em === current}
            style={{
              fontSize: 20, padding: '6px 10px', cursor: 'pointer',
              background: em === current ? COLORS.primaryLight : '#FAFAF7',
              border: `1.5px solid ${em === current ? COLORS.primary : '#E8E6DE'}`,
              borderRadius: 8, lineHeight: 1,
            }}
          >
            {em}
          </button>
        ))}
      </div>
    </div>
  )
}

function CategoryEditor({ cat, setCat, onSave, onCancel, onDelete, error }) {
  return (
    <div style={{ background: '#FFFFFF', borderRadius: 14, border: `2px solid ${COLORS.primary}`, padding: 24 }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 16, color: COLORS.primary }}>
        Edit Category — {cat.label}
      </h3>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ width: 72 }}>
          <Field label="Icon">
            <Input value={cat.icon} onChange={v => setCat({ ...cat, icon: v })} placeholder="📌" />
          </Field>
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <Field label="Name">
            <Input value={cat.label} onChange={v => setCat({ ...cat, label: v })} placeholder="Category name…" />
          </Field>
        </div>
        <div style={{ width: 52 }}>
          <Field label="Color">
            <input type="color" value={cat.color} onChange={e => setCat({ ...cat, color: e.target.value })}
              style={{ width: 52, height: 44, borderRadius: 10, border: '1.5px solid #E8E6DE', cursor: 'pointer', padding: 2 }} />
          </Field>
        </div>
        <Btn onClick={onSave}>Save</Btn>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        <Btn variant="danger" onClick={onDelete}>Delete</Btn>
      </div>
      <EmojiPicker onPick={em => setCat({ ...cat, icon: em })} current={cat.icon} />
      {error && <p style={{ color: COLORS.danger, fontSize: 13, marginTop: 10 }}>{error}</p>}
    </div>
  )
}

function TutorialView({ steps, completedSteps, toggleStep, onNavigate, editMode, setEditMode, editingStep, setEditingStep, onSave, onDelete }) {
  const total = steps.length
  const done = steps.filter(s => completedSteps.includes(s.id)).length
  const pct = total ? Math.round((done / total) * 100) : 0
  const allDone = total > 0 && done === total

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 4px', color: COLORS.textPrimary }}>🎓 Volunteer Tutorial</h2>
          <p style={{ margin: 0, fontSize: 14, color: COLORS.textMuted }}>
            {editMode ? 'Add, edit, or remove steps shown to volunteers.' : 'Complete each step to get familiar with the admin portal.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {!editMode && total > 0 && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: allDone ? COLORS.success : COLORS.primary }}>{pct}%</div>
              <div style={{ fontSize: 12, color: COLORS.textMuted }}>{done} of {total} completed</div>
            </div>
          )}
          <Btn small variant={editMode ? 'primary' : 'ghost'} onClick={() => { setEditMode(!editMode); setEditingStep(null) }}>
            {editMode ? 'Done editing' : '✏️ Edit tutorial'}
          </Btn>
        </div>
      </div>

      {!editMode && total > 0 && (
        <div style={{ background: '#E8E6DE', borderRadius: 8, height: 8, marginBottom: 28, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 8,
            background: allDone ? COLORS.success : COLORS.primary,
            width: `${pct}%`, transition: 'width 0.4s ease',
          }} />
        </div>
      )}

      {!editMode && allDone && (
        <div style={{ background: '#EAF6EE', border: '1px solid #A8D5B5', borderRadius: 14, padding: '18px 22px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 32 }}>🎉</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1A6B3A', marginBottom: 2 }}>Tutorial complete!</div>
            <div style={{ fontSize: 13, color: '#2E7D50', lineHeight: 1.5 }}>You are ready to support victims using this portal.</div>
          </div>
        </div>
      )}

      {editingStep && (
        <TutorialEditor
          step={editingStep}
          setStep={setEditingStep}
          onSave={() => onSave(editingStep)}
          onCancel={() => setEditingStep(null)}
        />
      )}

      {total === 0 && !editingStep && (
        <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E8E6DE', padding: 40, textAlign: 'center', color: COLORS.textMuted, marginBottom: 16 }}>
          No tutorial steps yet. {editMode ? 'Click "Add step" below to create one.' : 'An admin can add steps from the edit view.'}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {steps.map((step, idx) => {
          const isDone = completedSteps.includes(step.id)
          const borderColor = step.is_warning ? '#F5C4B3' : isDone ? '#A8D5B5' : '#E8E6DE'
          const bgColor = step.is_warning ? '#FAECE7' : isDone ? '#F4FBF6' : '#FFFFFF'

          return (
            <div key={step.id} style={{
              background: bgColor, borderRadius: 14, border: `1px solid ${borderColor}`,
              padding: '18px 20px', transition: 'all 0.2s',
            }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                {!editMode && (
                  <button
                    onClick={() => toggleStep(step.id)}
                    title={isDone ? 'Mark incomplete' : 'Mark complete'}
                    aria-label={isDone ? 'Mark step incomplete' : 'Mark step complete'}
                    style={{
                      width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${isDone ? COLORS.success : '#C8C6BE'}`,
                      background: isDone ? COLORS.success : 'transparent',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, color: '#fff', marginTop: 1,
                    }}
                  >
                    {isDone ? '✓' : ''}
                  </button>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 16 }} aria-hidden="true">{step.icon}</span>
                    <span style={{
                      fontWeight: 700, fontSize: 15,
                      color: isDone && !editMode ? COLORS.textMuted : step.is_warning ? '#993C1D' : COLORS.textPrimary,
                      textDecoration: isDone && !editMode ? 'line-through' : 'none',
                    }}>
                      Step {idx + 1} — {step.title}
                    </span>
                    {step.is_warning && (
                      <span style={{ fontSize: 11, background: '#F5C4B3', color: '#712B13', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>Important</span>
                    )}
                    {step.highlight && (
                      <span style={{ fontSize: 11, background: '#B5D4F4', color: '#0C447C', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>Key skill</span>
                    )}
                  </div>
                  <p style={{ margin: '0 0 10px', fontSize: 14, color: COLORS.textSecondary, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{step.body}</p>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    {!editMode && step.action_label && step.action_view && (
                      <button
                        onClick={() => onNavigate(step.action_view)}
                        style={{
                          background: 'none', border: `1px solid ${COLORS.primary}`, borderRadius: 8,
                          color: COLORS.primary, fontSize: 12, padding: '5px 12px', cursor: 'pointer',
                          fontFamily: 'Georgia, serif', fontWeight: 600,
                        }}
                      >
                        {step.action_label} →
                      </button>
                    )}
                    {!editMode && (
                      <button
                        onClick={() => toggleStep(step.id)}
                        style={{
                          background: isDone ? 'transparent' : COLORS.primary,
                          border: `1px solid ${isDone ? '#C8C6BE' : COLORS.primary}`,
                          borderRadius: 8, color: isDone ? COLORS.textMuted : '#fff',
                          fontSize: 12, padding: '5px 12px', cursor: 'pointer',
                          fontFamily: 'Georgia, serif', fontWeight: 600,
                        }}
                      >
                        {isDone ? 'Undo' : 'Mark complete'}
                      </button>
                    )}
                    {editMode && (
                      <>
                        <Btn small variant="ghost" onClick={() => setEditingStep({ ...step })}>Edit</Btn>
                        <Btn small variant="danger" onClick={() => onDelete(step)}>Delete</Btn>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {editMode && !editingStep && (
        <div style={{ marginTop: 16 }}>
          <Btn onClick={() => setEditingStep({ icon: '📌', title: '', body: '', is_warning: false, highlight: false, action_label: '', action_view: '' })}>
            + Add step
          </Btn>
        </div>
      )}

      {!editMode && (
        <div style={{ marginTop: 24, background: '#EEF4FB', borderRadius: 14, padding: '16px 20px', borderLeft: `4px solid ${COLORS.primary}` }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.primaryDark, marginBottom: 4 }}>Need help?</div>
          <div style={{ fontSize: 13, color: COLORS.primary, lineHeight: 1.6 }}>
            Contact your supervisor any time. Progress saves automatically.
          </div>
        </div>
      )}
    </div>
  )
}

const ACTION_VIEWS = [
  { value: '', label: '— None —' },
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'brochures', label: 'Brochures' },
  { value: 'categories', label: 'Categories' },
  { value: 'activity', label: 'Activity' },
  { value: 'trash', label: 'Trash' },
]

function TutorialEditor({ step, setStep, onSave, onCancel }) {
  return (
    <div style={{ background: '#FFFFFF', borderRadius: 14, border: `2px solid ${COLORS.primary}`, padding: 24, marginBottom: 16 }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 16, color: COLORS.primary }}>
        {step.id ? 'Edit step' : 'Add new step'}
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 12, marginBottom: 12 }}>
        <Field label="Icon"><Input value={step.icon} onChange={v => setStep({ ...step, icon: v })} placeholder="📌" /></Field>
        <Field label="Title"><Input value={step.title} onChange={v => setStep({ ...step, title: v })} placeholder="Step title" /></Field>
      </div>
      <div style={{ marginBottom: 12 }}>
        <Field label="Body">
          <textarea
            value={step.body}
            onChange={e => setStep({ ...step, body: e.target.value })}
            placeholder="Detailed instructions for the volunteer…"
            rows={4}
            style={{
              width: '100%', padding: '11px 14px', borderRadius: 12,
              border: `1.5px solid ${COLORS.border}`, fontSize: 15,
              fontFamily: 'Georgia, serif', outline: 'none', boxSizing: 'border-box',
              background: '#FFFFFF', color: COLORS.textPrimary, resize: 'vertical', lineHeight: 1.6,
            }}
          />
        </Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <Field label="Button text (optional)">
          <Input value={step.action_label || ''} onChange={v => setStep({ ...step, action_label: v })} placeholder="e.g. Go to Brochures" />
        </Field>
        <Field label="Button goes to">
          <select
            value={step.action_view || ''}
            onChange={e => setStep({ ...step, action_view: e.target.value })}
            style={{
              width: '100%', padding: '11px 14px', borderRadius: 12,
              border: `1.5px solid ${COLORS.border}`, fontSize: 15,
              fontFamily: 'Georgia, serif', background: '#FFFFFF', color: COLORS.textPrimary,
            }}
          >
            {ACTION_VIEWS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
      </div>
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: COLORS.textPrimary, cursor: 'pointer' }}>
          <input type="checkbox" checked={!!step.is_warning} onChange={e => setStep({ ...step, is_warning: e.target.checked })} />
          Mark as Important (red)
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: COLORS.textPrimary, cursor: 'pointer' }}>
          <input type="checkbox" checked={!!step.highlight} onChange={e => setStep({ ...step, highlight: e.target.checked })} />
          Mark as Key skill (blue)
        </label>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        <Btn onClick={onSave}>{step.id ? 'Save changes' : 'Add step'}</Btn>
      </div>
    </div>
  )
}
