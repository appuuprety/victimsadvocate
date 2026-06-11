import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Badge, Btn, Field, Input, COLORS } from './ui'
import ColoradoLogo from './ColoradoLogo'
import BrochureCard from './BrochureCard'
import BrochureForm from './BrochureForm'
import { adminGuideSections } from '../lib/productGuide'

export default function AdminPanel({ brochures, setBrochures, categories, setCategories, adminProfile, onLogout, onShare }) {
  const [view, setView] = useState('dashboard')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [shareLogs, setShareLogs] = useState([])
  const [newCatName, setNewCatName] = useState('')
  const [newCatIcon, setNewCatIcon] = useState('GEN')
  const [newCatColor, setNewCatColor] = useState(COLORS.primary)
  const [catError, setCatError] = useState('')
  const [editingCat, setEditingCat] = useState(null) // category being edited
  const [tutorialSteps, setTutorialSteps] = useState([])
  const [fieldGuideEntries, setFieldGuideEntries] = useState([])
  const [fieldGuideQuery, setFieldGuideQuery] = useState('')
  const [editingFieldGuideEntry, setEditingFieldGuideEntry] = useState(null)
  const [invites, setInvites] = useState([])
  const [inviteAttempts, setInviteAttempts] = useState([])
  const [adminProfiles, setAdminProfiles] = useState([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('admin')
  const [inviteLink, setInviteLink] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [inviteNotice, setInviteNotice] = useState('')
  const [inviteSending, setInviteSending] = useState(false)
  const [editingStep, setEditingStep] = useState(null) // tutorial step being edited
  const [tutorialEditMode, setTutorialEditMode] = useState(false)
  const [completedSteps, setCompletedSteps] = useState([])
  const [resettingTutorialUserId, setResettingTutorialUserId] = useState('')
  const [adminMessages, setAdminMessages] = useState([])
  const [newAdminMessage, setNewAdminMessage] = useState('')
  const [messageBoardError, setMessageBoardError] = useState('')
  const [messageSending, setMessageSending] = useState(false)

  async function toggleStep(id) {
    if (!adminProfile?.user_id) return
    const isComplete = completedSteps.includes(id)
    setCompletedSteps(prev => isComplete ? prev.filter(stepId => stepId !== id) : [...prev, id])

    const { error } = isComplete
      ? await supabase.from('tutorial_step_completions').delete().eq('user_id', adminProfile.user_id).eq('step_id', id)
      : await supabase.from('tutorial_step_completions').upsert({ user_id: adminProfile.user_id, step_id: id })

    if (error) {
      setCompletedSteps(prev => isComplete ? [...prev, id] : prev.filter(stepId => stepId !== id))
      alert(error.message)
    }
  }

  async function resetTutorialProgress(profile = adminProfile) {
    if (!profile?.user_id) return
    if (!window.confirm(`Reset tutorial progress for ${profile.email || 'this admin'}? Completed tutorial items will show again for that user.`)) return
    setResettingTutorialUserId(profile.user_id)
    const { error } = await supabase.rpc('reset_tutorial_progress', { target_user_id: profile.user_id })
    setResettingTutorialUserId('')
    if (error) return alert(error.message)
    if (profile.user_id === adminProfile?.user_id) setCompletedSteps([])
    setInviteNotice(`Tutorial progress reset for ${profile.email || 'admin user'}.`)
  }

  useEffect(() => {
    if (view === 'activity') {
      supabase.from('share_logs').select('*, brochures(title)').order('shared_at', { ascending: false }).limit(30)
        .then(({ data }) => setShareLogs(data || []))
    }
    if (view === 'messageBoard') {
      loadAdminMessages()
    }
  }, [view])

  async function loadAdminMessages() {
    const { data, error } = await supabase.from('admin_messages')
      .select('*')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(80)
    if (error) return setMessageBoardError(error.message)
    setMessageBoardError('')
    setAdminMessages(data || [])
  }

  async function sendAdminMessage() {
    const body = newAdminMessage.trim()
    if (!body) return setMessageBoardError('Message is required.')
    setMessageSending(true)
    setMessageBoardError('')
    const { data, error } = await supabase.from('admin_messages').insert({
      author_id: adminProfile.user_id,
      author_email: adminProfile.email || '',
      body,
    }).select().single()
    setMessageSending(false)
    if (error) return setMessageBoardError(error.message)
    setAdminMessages(prev => [data, ...prev])
    setNewAdminMessage('')
  }

  async function togglePinnedMessage(message) {
    const { data, error } = await supabase.from('admin_messages')
      .update({ pinned: !message.pinned, updated_at: new Date().toISOString() })
      .eq('id', message.id)
      .select()
      .single()
    if (error) return setMessageBoardError(error.message)
    setAdminMessages(prev => prev.map(item => item.id === data.id ? data : item)
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.created_at) - new Date(a.created_at)))
  }

  async function deleteAdminMessage(message) {
    if (!window.confirm('Delete this message?')) return
    const { error } = await supabase.from('admin_messages').delete().eq('id', message.id)
    if (error) return setMessageBoardError(error.message)
    setAdminMessages(prev => prev.filter(item => item.id !== message.id))
  }

  useEffect(() => {
    supabase.from('tutorial_steps').select('*').order('sort_order')
      .then(({ data }) => setTutorialSteps(data || []))
    supabase.from('field_guide_entries').select('*').order('sort_order').order('title')
      .then(({ data }) => setFieldGuideEntries(data || []))
  }, [])

  useEffect(() => {
    if (!adminProfile?.user_id) return
    supabase.from('tutorial_step_completions').select('step_id').eq('user_id', adminProfile.user_id)
      .then(({ data, error }) => {
        if (!error) setCompletedSteps((data || []).map(row => row.step_id))
      })
  }, [adminProfile?.user_id])

  useEffect(() => {
    if (view === 'users' && adminProfile?.role === 'super_admin') {
      supabase.from('admin_profiles').select('*').order('created_at', { ascending: false })
        .then(({ data }) => setAdminProfiles(data || []))
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
      try { await navigator.clipboard.writeText(link) } catch {
        // Clipboard access can be unavailable in some browsers.
      }

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
        icon: step.icon || 'GEN', title: step.title, body: step.body || '',
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

  async function saveFieldGuideEntry(entry) {
    if (!entry.title?.trim()) return
    const tags = typeof entry.tags === 'string'
      ? entry.tags.split(',').map(t => t.trim()).filter(Boolean)
      : entry.tags || []
    const payload = {
      section: entry.section?.trim() || 'General',
      title: entry.title.trim(),
      body: entry.body || '',
      tags,
      sort_order: Number(entry.sort_order) || 100,
      published: entry.published !== false,
      updated_at: new Date().toISOString(),
    }
    if (entry.id) {
      const { data, error } = await supabase.from('field_guide_entries').update(payload).eq('id', entry.id).select().single()
      if (error) return alert(error.message)
      setFieldGuideEntries(prev => prev.map(item => item.id === data.id ? data : item))
    } else {
      const { data, error } = await supabase.from('field_guide_entries').insert(payload).select().single()
      if (error) return alert(error.message)
      setFieldGuideEntries(prev => [...prev, data].sort((a, b) => (a.sort_order - b.sort_order) || a.title.localeCompare(b.title)))
    }
    setEditingFieldGuideEntry(null)
  }

  async function deleteFieldGuideEntry(entry) {
    if (!window.confirm(`Delete field guide entry "${entry.title}"?`)) return
    const { error } = await supabase.from('field_guide_entries').delete().eq('id', entry.id)
    if (error) return alert(error.message)
    setFieldGuideEntries(prev => prev.filter(item => item.id !== entry.id))
  }

  async function deleteAdminProfile(profile) {
    if (profile.user_id === adminProfile.user_id) return alert('You cannot delete your own admin access.')
    if (!window.confirm(`Remove admin access for ${profile.email}?`)) return
    const { error } = await supabase.rpc('delete_admin_profile', { target_user_id: profile.user_id })
    if (error) return alert(error.message)
    setAdminProfiles(prev => prev.filter(item => item.user_id !== profile.user_id))
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
    setNewCatIcon('GEN')
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

  const menuGroups = [
    {
      title: 'Main',
      items: [
        ['dashboard', 'Dashboard', 'D'],
        ['help', 'Help', 'H'],
      ],
    },
    {
      title: 'Content',
      items: [
        ['tutorial', 'Tutorial', 'T'],
        ['fieldGuide', 'Volunteer Advocate Resources', 'V'],
        ['brochures', 'Brochures', 'B'],
        ['categories', 'Categories', 'C'],
      ],
    },
    {
      title: 'Admin',
      items: [
        ['messageBoard', 'Message Board', 'M'],
        ['activity', 'Activity', 'A'],
        ['users', 'Invites', 'I'],
        ['trash', `Trash${trashedBrochures.length ? ` (${trashedBrochures.length})` : ''}`, 'T'],
      ],
    },
  ]
  const profileInitial = (adminProfile?.email || 'A').trim().charAt(0).toUpperCase()

  return (
    <div style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', background: '#F6F7F9', minHeight: '100vh', colorScheme: 'light' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .admin-panel button,
        .admin-panel input,
        .admin-panel select,
        .admin-panel textarea {
          font-family: inherit !important;
        }
        .admin-page-title {
          font-size: 27px;
          font-weight: 700;
          margin: 0 0 22px;
          color: #182230;
          letter-spacing: 0;
        }
        .admin-card {
          background: #FFFFFF;
          border: 1px solid #DDE3EA;
          border-radius: 8px;
          box-shadow: 0 1px 2px rgba(16, 24, 40, .04);
        }
        .admin-stat-card {
          padding: 18px 18px 16px;
        }
        .admin-stat-icon,
        .admin-symbol {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: #EEF2F6;
          color: #344054;
          border: 1px solid #DDE3EA;
          font-weight: 800;
          letter-spacing: .04em;
        }
        .admin-stat-icon {
          width: 34px;
          height: 34px;
          font-size: 11px;
          margin-bottom: 14px;
        }
        .admin-symbol {
          width: 42px;
          height: 42px;
          font-size: 12px;
        }
        .admin-link-button {
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
          padding: 0;
        }
        .admin-menu-toggle {
          display: inline-flex;
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
        .admin-profile-icon {
          width: 36px;
          height: 36px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.35);
          background: rgba(255,255,255,.16);
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
        }
        .admin-header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex: 1;
        }
        .admin-menu-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(10, 24, 43, .38);
          z-index: 50;
        }
        .admin-drawer {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: min(390px, 88vw);
          background: #FFFFFF;
          box-shadow: -18px 0 42px rgba(9, 20, 38, .28);
          z-index: 60;
          display: flex;
          flex-direction: column;
          color: #1E293B;
        }
        .admin-drawer-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 18px 18px 14px;
          border-bottom: 1px solid #E8E6DE;
          background: #F7F8FA;
        }
        .admin-drawer-profile {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }
        .admin-drawer-avatar {
          width: 42px;
          height: 42px;
          border-radius: 999px;
          background: #1B4D8E;
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          flex: 0 0 auto;
        }
        .admin-drawer-email {
          color: #475569;
          font-size: 12px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 225px;
        }
        .admin-drawer-close {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: 1px solid #D8D5CB;
          background: #fff;
          color: #1B3A6B;
          cursor: pointer;
          font-size: 20px;
        }
        .admin-drawer-body {
          padding: 14px;
          overflow: auto;
          flex: 1;
        }
        .admin-menu-section {
          padding: 8px 0 14px;
        }
        .admin-menu-section-title {
          color: #64748B;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .06em;
          text-transform: uppercase;
          padding: 0 8px 8px;
        }
        .admin-drawer-row {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid transparent;
          border-radius: 8px;
          background: transparent;
          padding: 10px 10px;
          color: #1E293B;
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          text-align: left;
          cursor: pointer;
        }
        .admin-drawer-row:hover {
          background: #F4F7FB;
          border-color: #E2E8F0;
        }
        .admin-drawer-row:focus-visible,
        .admin-drawer-close:focus-visible,
        .admin-menu-toggle:focus-visible,
        .admin-signout-row:focus-visible {
          outline: 3px solid #FFC726;
          outline-offset: 2px;
        }
        .admin-drawer-row.active {
          background: #E6F1FB;
          border-color: #C7DFF4;
          color: #0F2D5E;
        }
        .admin-drawer-icon {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: #EEF2F7;
          color: #1B4D8E;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          flex: 0 0 auto;
        }
        .admin-drawer-row.active .admin-drawer-icon {
          background: #1B4D8E;
          color: #fff;
        }
        .admin-drawer-footer {
          border-top: 1px solid #E8E6DE;
          padding: 14px;
          background: #F7F8FA;
        }
        .admin-signout-row {
          width: 100%;
          border: 1px solid #F0C9C9;
          border-radius: 8px;
          background: #FFF5F5;
          color: #9F2D2D;
          padding: 10px 12px;
          font-family: inherit;
          font-size: 14px;
          font-weight: 700;
          text-align: left;
          cursor: pointer;
        }
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
          .admin-header-top { width: 100%; }
          .admin-brand { min-width: 0; }
          .admin-role-badge { display: none; }
          .admin-content { padding: 20px 16px !important; }
          .invite-form-grid { grid-template-columns: 1fr !important; }
          .field-guide-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <header className="admin-header admin-panel" style={{ background: '#111827', padding: '0 32px', borderBottom: '1px solid #273244' }}>
        <div className="admin-header-inner" style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 60 }}>
          <div className="admin-header-top">
            <div className="admin-brand" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ColoradoLogo size={32} />
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, whiteSpace: 'nowrap' }}>CVR Admin Portal</div>
              <span className="admin-role-badge" style={{ background: 'rgba(255,255,255,.08)', color: '#D0D5DD', fontSize: 11, padding: '2px 10px', borderRadius: 6, fontWeight: 700 }}>
                {adminProfile?.role === 'super_admin' ? 'Super Admin' : 'Staff'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="admin-profile-icon" title={adminProfile?.email || 'Admin'} aria-label={adminProfile?.email || 'Admin profile'}>
                {profileInitial}
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
          </div>
        </div>
        {mobileNavOpen && <>
          <button
            type="button"
            className="admin-menu-backdrop"
            aria-label="Close admin menu"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="admin-drawer" aria-label="Admin menu">
            <div className="admin-drawer-head">
              <div className="admin-drawer-profile">
                <div className="admin-drawer-avatar" aria-hidden="true">{profileInitial}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: '#0F2D5E' }}>
                    {adminProfile?.role === 'super_admin' ? 'Super Admin' : 'Staff'}
                  </div>
                  <div className="admin-drawer-email">{adminProfile?.email || 'Admin'}</div>
                </div>
              </div>
              <button
                type="button"
                className="admin-drawer-close"
                aria-label="Close admin menu"
                onClick={() => setMobileNavOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="admin-drawer-body">
              {menuGroups.map(group => (
                <div className="admin-menu-section" key={group.title}>
                  <div className="admin-menu-section-title">{group.title}</div>
                  {group.items.map(([id, label, icon]) => (
                    <button
                      key={id}
                      type="button"
                      className={`admin-drawer-row${view === id ? ' active' : ''}`}
                      onClick={() => { setView(id); setMobileNavOpen(false) }}
                    >
                      <span className="admin-drawer-icon" aria-hidden="true">{icon}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
            <div className="admin-drawer-footer">
              <button type="button" className="admin-signout-row" onClick={onLogout}>
                Sign Out
              </button>
            </div>
          </aside>
        </>}
      </header>

      <div className="admin-content admin-panel" style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>

        {view === 'dashboard' && <>
          <h2 className="admin-page-title">Dashboard</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 16, marginBottom: 32 }}>
            {[
              { label: 'Total Brochures', value: stats.total, icon: 'DOC', color: '#175CD3' },
              { label: 'Featured', value: stats.featured, icon: 'FEA', color: '#B54708' },
              { label: 'Categories', value: stats.categories, icon: 'CAT', color: '#067647' },
              { label: 'Share Events', value: stats.shares, icon: 'SHR', color: '#475467' },
            ].map(s => (
              <div key={s.label} className="admin-card admin-stat-card">
                <div className="admin-stat-icon">{s.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#667085', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 18, color: COLORS.textPrimary }}>Recent Uploads</h3>
            <Btn small onClick={() => { setView('brochures'); setShowForm(true); setEditTarget(null) }}>+ Add Brochure</Btn>
          </div>
          <div className="admin-card" style={{ overflow: 'hidden' }}>
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
            <h2 className="admin-page-title" style={{ margin: 0 }}>Manage Brochures</h2>
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
                  <button className="admin-link-button" onClick={() => { setEditTarget(b); setShowForm(true); window.scrollTo(0, 0) }} style={{ color: COLORS.primary }}>Edit</button>
                  <button className="admin-link-button" onClick={() => handleToggleFeatured(b)} style={{ color: b.featured ? '#B54708' : '#667085' }}>{b.featured ? 'Unfeature' : 'Feature'}</button>
                  <button className="admin-link-button" onClick={() => handleDelete(b)} style={{ color: COLORS.danger }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>}

        {view === 'trash' && <>
          <h2 className="admin-page-title" style={{ marginBottom: 8 }}>Trash</h2>
          <p style={{ color: COLORS.textMuted, marginTop: 0, marginBottom: 24, fontSize: 14 }}>
            Deleted brochures stay here until you permanently remove them.
          </p>
          {trashedBrochures.length === 0 ? (
            <div className="admin-card" style={{ padding: 48, textAlign: 'center', color: COLORS.textMuted }}>
              Trash is empty.
            </div>
          ) : (
            <div className="admin-card" style={{ overflow: 'hidden' }}>
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
          <h2 className="admin-page-title">Manage Categories</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 16, marginBottom: 32 }}>
            {categories.map(cat => {
              const count = brochures.filter(b => b.category_id === cat.id).length
              return (
                <div key={cat.id} className="admin-card" style={{ padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="admin-symbol">{formatAdminSymbol(cat.icon, cat.label)}</div>
                    <Badge label={`${count} resources`} color={COLORS.textSecondary} bg="#F5F3EE" />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginTop: 10, color: COLORS.textPrimary }}>{cat.label}</div>
                  <div style={{ marginTop: 8, width: 24, height: 4, borderRadius: 2, background: cat.color }} />
                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    <button onClick={() => { setEditingCat({ ...cat }); setCatError('') }}
                      className="admin-link-button" style={{ color: COLORS.primary }}>
                      Edit
                    </button>
                    <button onClick={() => deleteCategory(cat)}
                      className="admin-link-button" style={{ color: COLORS.danger }}>
                      Delete
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
            <div className="admin-card" style={{ padding: 24 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, color: COLORS.textPrimary }}>Add New Category</h3>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ width: 96 }}><Field label="Symbol"><Input value={newCatIcon} onChange={setNewCatIcon} placeholder="GEN" maxLength={4} /></Field></div>
                <div style={{ flex: 1, minWidth: 160 }}><Field label="Name"><Input value={newCatName} onChange={setNewCatName} placeholder="Category name…" /></Field></div>
                <div style={{ width: 52 }}>
                  <Field label="Color">
                    <input type="color" value={newCatColor} onChange={e => setNewCatColor(e.target.value)}
                      style={{ width: 52, height: 44, borderRadius: 10, border: '1.5px solid #E8E6DE', cursor: 'pointer', padding: 2 }} />
                  </Field>
                </div>
                <Btn onClick={addCategory}>Add</Btn>
              </div>
              <SymbolPicker onPick={setNewCatIcon} current={newCatIcon} />
              {catError && <p style={{ color: COLORS.danger, fontSize: 13, marginTop: 10 }}>{catError}</p>}
            </div>
          )}
        </>}

        {view === 'activity' && <>
          <h2 className="admin-page-title">Share Activity</h2>
          <div className="admin-card" style={{ overflow: 'hidden' }}>
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
                    label={log.method === 'email' ? 'Email' : log.method === 'sms' ? 'SMS' : 'Link'}
                    color={log.method === 'email' ? COLORS.primary : log.method === 'sms' ? '#533AB7' : COLORS.success}
                    bg={log.method === 'email' ? '#E6F1FB' : log.method === 'sms' ? '#EEEDFE' : '#E1F5EE'}
                  />
                </div>
              ))
            }
          </div>
        </>}

        {(view === 'tutorial' || view === 'fieldGuide') && (
          <TutorialView
            section={view}
            steps={tutorialSteps}
            fieldGuideEntries={fieldGuideEntries}
            fieldGuideQuery={fieldGuideQuery}
            setFieldGuideQuery={setFieldGuideQuery}
            editingFieldGuideEntry={editingFieldGuideEntry}
            setEditingFieldGuideEntry={setEditingFieldGuideEntry}
            completedSteps={completedSteps}
            toggleStep={toggleStep}
            onResetTutorialProgress={resetTutorialProgress}
            onNavigate={setView}
            editMode={tutorialEditMode}
            setEditMode={setTutorialEditMode}
            editingStep={editingStep}
            setEditingStep={setEditingStep}
            onSave={saveTutorialStep}
            onDelete={deleteTutorialStep}
            onSaveFieldGuideEntry={saveFieldGuideEntry}
            onDeleteFieldGuideEntry={deleteFieldGuideEntry}
            resettingTutorialUserId={resettingTutorialUserId}
          />
        )}

        {view === 'help' && (
          <ProductGuideView
            title="Admin Help"
            description="A practical guide to the admin tools and the public resource experience."
            sections={adminGuideSections}
          />
        )}

        {view === 'messageBoard' && (
          <MessageBoardView
            messages={adminMessages}
            messageText={newAdminMessage}
            setMessageText={setNewAdminMessage}
            error={messageBoardError}
            sending={messageSending}
            currentUserId={adminProfile?.user_id}
            isSuperAdmin={adminProfile?.role === 'super_admin'}
            onSend={sendAdminMessage}
            onRefresh={loadAdminMessages}
            onTogglePinned={togglePinnedMessage}
            onDelete={deleteAdminMessage}
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
              <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E8E6DE', overflow: 'hidden', marginBottom: 24 }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #F0EEE8', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: 16, color: COLORS.textPrimary }}>Current Admins</h3>
                  <Badge label={`${adminProfiles.length} active`} color={COLORS.primary} bg="#E6F1FB" />
                </div>
                {adminProfiles.length === 0
                  ? <div style={{ padding: 24, color: COLORS.textMuted, textAlign: 'center' }}>No admin profiles found.</div>
                  : adminProfiles.map((profile, i) => (
                    <div key={profile.user_id} style={{
                      padding: '14px 20px',
                      borderBottom: i < adminProfiles.length - 1 ? '1px solid #F0EEE8' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      flexWrap: 'wrap',
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.textPrimary }}>{profile.email}</div>
                        <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>{profile.user_id}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <Badge
                          label={profile.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                          color={profile.role === 'super_admin' ? '#8B5E0A' : COLORS.primary}
                          bg={profile.role === 'super_admin' ? '#FDF3E3' : '#E6F1FB'}
                        />
                        <Btn
                          small
                          variant="ghost"
                          disabled={resettingTutorialUserId === profile.user_id}
                          onClick={() => resetTutorialProgress(profile)}
                        >
                          {resettingTutorialUserId === profile.user_id ? 'Resetting...' : 'Reset Tutorial'}
                        </Btn>
                        <Btn
                          small
                          variant="danger"
                          disabled={profile.user_id === adminProfile.user_id}
                          onClick={() => deleteAdminProfile(profile)}
                        >
                          Delete Admin
                        </Btn>
                      </div>
                    </div>
                  ))
                }
              </div>
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

function ProductGuideView({ title, description, sections }) {
  return (
    <div>
      <h2 className="admin-page-title">{title}</h2>
      <p style={{ margin: '0 0 24px', color: COLORS.textMuted, fontSize: 14, lineHeight: 1.6 }}>
        {description}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        {sections.map(section => (
          <section key={section.title} className="admin-card" style={{ padding: 20 }}>
            <h3 style={{ margin: '0 0 12px', color: COLORS.textPrimary, fontSize: 17 }}>{section.title}</h3>
            <ul style={{ margin: 0, paddingLeft: 20, color: COLORS.textSecondary, fontSize: 14, lineHeight: 1.7 }}>
              {section.items.map(item => <li key={item}>{item}</li>)}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}

function MessageBoardView({
  messages,
  messageText,
  setMessageText,
  error,
  sending,
  currentUserId,
  isSuperAdmin,
  onSend,
  onRefresh,
  onTogglePinned,
  onDelete,
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <h2 className="admin-page-title" style={{ marginBottom: 6 }}>Message Board</h2>
          <p style={{ margin: 0, color: COLORS.textMuted, fontSize: 14, lineHeight: 1.6 }}>
            Secure admin-only announcements and team updates. Do not post victim names, contact details, addresses, or case facts.
          </p>
        </div>
        <Btn small variant="ghost" onClick={onRefresh}>Refresh</Btn>
      </div>

      <div className="admin-card" style={{ padding: 20, marginBottom: 20 }}>
        <Field label="Post a message">
          <textarea
            value={messageText}
            onChange={event => setMessageText(event.target.value)}
            placeholder="Share a shift update, resource note, or admin announcement..."
            maxLength={2000}
            rows={4}
            style={{
              width: '100%',
              border: `1.5px solid ${COLORS.border}`,
              borderRadius: 8,
              padding: '12px 14px',
              resize: 'vertical',
              fontSize: 14,
              color: COLORS.textPrimary,
              background: '#FFFFFF',
            }}
          />
        </Field>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 10 }}>
          <div style={{ color: COLORS.textMuted, fontSize: 12 }}>{messageText.length}/2000 characters</div>
          <Btn onClick={onSend} disabled={sending || !messageText.trim()}>{sending ? 'Posting...' : 'Post Message'}</Btn>
        </div>
        {error && <p style={{ color: COLORS.danger, fontSize: 13, margin: '12px 0 0' }}>{error}</p>}
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {messages.length === 0 ? (
          <div className="admin-card" style={{ padding: 36, textAlign: 'center', color: COLORS.textMuted }}>
            No messages yet.
          </div>
        ) : messages.map(message => {
          const canManage = isSuperAdmin || message.author_id === currentUserId
          return (
            <article key={message.id} className="admin-card" style={{ padding: 18, borderColor: message.pinned ? '#98C7EE' : '#DDE3EA', background: message.pinned ? '#F7FBFF' : '#FFFFFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <strong style={{ color: COLORS.textPrimary, fontSize: 14 }}>{message.author_email || 'Admin'}</strong>
                    {message.pinned && <Badge label="Pinned" color={COLORS.primary} bg="#E6F1FB" />}
                  </div>
                  <div style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 2 }}>
                    {new Date(message.created_at).toLocaleString()}
                  </div>
                </div>
                {canManage && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Btn small variant="ghost" onClick={() => onTogglePinned(message)}>
                      {message.pinned ? 'Unpin' : 'Pin'}
                    </Btn>
                    <Btn small variant="danger" onClick={() => onDelete(message)}>Delete</Btn>
                  </div>
                )}
              </div>
              <p style={{ margin: 0, color: COLORS.textSecondary, fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {message.body}
              </p>
            </article>
          )
        })}
      </div>
    </div>
  )
}

const SYMBOL_OPTIONS = [
  'GEN', 'SAFE', 'LAW', 'CALL', 'CARE', 'HOME', 'MED', 'FAM', 'FIN', 'TRN', 'DOC', 'LGBT',
]

function formatAdminSymbol(value, fallback = '') {
  const plain = String(value || '').replace(/[^\p{L}\p{N}]/gu, '').toUpperCase()
  if (plain) return plain.slice(0, 4)
  return String(fallback || 'GEN').replace(/[^\p{L}\p{N}]/gu, '').toUpperCase().slice(0, 3) || 'GEN'
}

function SymbolPicker({ onPick, current }) {
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Quick symbols
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {SYMBOL_OPTIONS.map(symbol => (
          <button
            key={symbol}
            type="button"
            onClick={() => onPick(symbol)}
            aria-label={`Use ${symbol}`}
            aria-pressed={symbol === current}
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '.04em',
              padding: '8px 10px',
              cursor: 'pointer',
              background: symbol === current ? '#E6F1FB' : '#FFFFFF',
              color: symbol === current ? '#0F2D5E' : '#344054',
              border: `1px solid ${symbol === current ? '#98C7EE' : '#DDE3EA'}`,
              borderRadius: 6,
              lineHeight: 1,
            }}
          >
            {symbol}
          </button>
        ))}
      </div>
    </div>
  )
}

function CategoryEditor({ cat, setCat, onSave, onCancel, onDelete, error }) {
  return (
    <div className="admin-card" style={{ borderColor: '#98A2B3', padding: 24 }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 16, color: COLORS.primary }}>
        Edit Category - {cat.label}
      </h3>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ width: 96 }}>
          <Field label="Symbol">
            <Input value={cat.icon} onChange={v => setCat({ ...cat, icon: v })} placeholder="GEN" maxLength={4} />
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
      <SymbolPicker onPick={symbol => setCat({ ...cat, icon: symbol })} current={cat.icon} />
      {error && <p style={{ color: COLORS.danger, fontSize: 13, marginTop: 10 }}>{error}</p>}
    </div>
  )
}

function TutorialView({
  section,
  steps,
  fieldGuideEntries,
  fieldGuideQuery,
  setFieldGuideQuery,
  editingFieldGuideEntry,
  setEditingFieldGuideEntry,
  completedSteps,
  toggleStep,
  onResetTutorialProgress,
  onNavigate,
  editMode,
  setEditMode,
  editingStep,
  setEditingStep,
  onSave,
  onDelete,
  onSaveFieldGuideEntry,
  onDeleteFieldGuideEntry,
  resettingTutorialUserId,
}) {
  const total = steps.length
  const done = steps.filter(s => completedSteps.includes(s.id)).length
  const pct = total ? Math.round((done / total) * 100) : 0
  const allDone = total > 0 && done === total
  const visibleSteps = editMode ? steps : steps.filter(step => !completedSteps.includes(step.id))
  const [activeFieldSection, setActiveFieldSection] = useState('')
  const [activeFieldEntryId, setActiveFieldEntryId] = useState('')
  const guideSections = [...new Set(fieldGuideEntries.map(entry => entry.section || 'General'))]
  const selectedSection = activeFieldSection || guideSections[0] || ''
  const query = fieldGuideQuery.trim().toLowerCase()
  const matchingGuideEntries = fieldGuideEntries.filter(entry => {
    if (!query) return true
    const tags = Array.isArray(entry.tags) ? entry.tags.join(' ') : ''
    return `${entry.section} ${entry.title} ${entry.body} ${tags}`.toLowerCase().includes(query)
  })
  const entriesBySection = guideSections.map(section => ({
    section,
    entries: matchingGuideEntries.filter(entry => (entry.section || 'General') === section),
  })).filter(group => group.entries.length > 0)
  const filteredGuideEntries = matchingGuideEntries.filter(entry => (entry.section || 'General') === selectedSection)
  const activeFieldEntry = filteredGuideEntries.find(entry => entry.id === activeFieldEntryId) || filteredGuideEntries[0]
  const isTutorial = section === 'tutorial'
  const isFieldGuide = section === 'fieldGuide'
  const title = isTutorial ? 'Tutorial' : 'Volunteer Advocate Resources'
  const description = isTutorial
    ? editMode ? 'Add, edit, or remove tutorial checklist items.' : 'Work through the volunteer advocate tutorial checklist.'
    : editMode ? 'Add, edit, or remove advocate resource guide entries.' : 'Search quick-reference guidance for volunteer advocate work.'

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 4px', color: COLORS.textPrimary }}>{title}</h2>
          <p style={{ margin: 0, fontSize: 14, color: COLORS.textMuted }}>
            {description}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {isTutorial && !editMode && total > 0 && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: allDone ? COLORS.success : COLORS.primary }}>{pct}%</div>
              <div style={{ fontSize: 12, color: COLORS.textMuted }}>{done} of {total} completed</div>
            </div>
          )}
          <Btn small variant={editMode ? 'primary' : 'ghost'} onClick={() => { setEditMode(!editMode); setEditingStep(null); setEditingFieldGuideEntry(null) }}>
            {editMode ? 'Done editing' : isTutorial ? 'Edit tutorial' : 'Edit resources'}
          </Btn>
          {isTutorial && editMode && done > 0 && (
            <Btn small variant="ghost" disabled={!!resettingTutorialUserId} onClick={onResetTutorialProgress}>
              {resettingTutorialUserId ? 'Resetting...' : 'Reset progress'}
            </Btn>
          )}
        </div>
      </div>

      {isFieldGuide && (
      <div style={{ background: '#FFFFFF', borderRadius: 14, border: '1px solid #E8E6DE', padding: 18, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, color: COLORS.textPrimary }}>Field Guide</h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: COLORS.textMuted }}>Use the table of contents or search quick-reference guidance.</p>
          </div>
          {editMode && (
            <Btn small onClick={() => setEditingFieldGuideEntry({ section: 'General', title: '', body: '', tags: '', sort_order: 100, published: true })}>
              Add Field Guide Entry
            </Btn>
          )}
        </div>
        <Input
          value={fieldGuideQuery}
          onChange={setFieldGuideQuery}
          placeholder="Search the field guide..."
          type="search"
        />

        {editingFieldGuideEntry && (
          <FieldGuideEditor
            entry={editingFieldGuideEntry}
            setEntry={setEditingFieldGuideEntry}
            onSave={() => onSaveFieldGuideEntry(editingFieldGuideEntry)}
            onCancel={() => setEditingFieldGuideEntry(null)}
          />
        )}

        <div className="field-guide-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 280px) 1fr', gap: 16, marginTop: 16 }}>
          <aside style={{ border: '1px solid #E8E6DE', borderRadius: 12, overflow: 'hidden', background: '#FAFAF7' }}>
            <div style={{ padding: '12px 14px', fontSize: 12, fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E8E6DE' }}>
              Table of Contents
            </div>
            {entriesBySection.length === 0 ? (
              <div style={{ padding: 14, color: COLORS.textMuted, fontSize: 13 }}>No matching sections.</div>
            ) : entriesBySection.map(({ section, entries }) => (
              <div key={section} style={{ borderBottom: '1px solid #E8E6DE' }}>
                <button
                  type="button"
                  onClick={() => { setActiveFieldSection(section); setActiveFieldEntryId(entries[0]?.id || '') }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 10,
                    padding: '11px 14px',
                    border: 'none',
                    background: selectedSection === section ? '#E6F1FB' : 'transparent',
                    color: selectedSection === section ? COLORS.primary : COLORS.textSecondary,
                    fontFamily: 'Georgia, serif',
                    fontWeight: selectedSection === section ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  <span>{section}</span>
                  <span style={{ color: COLORS.textMuted, fontSize: 12 }}>{entries.length}</span>
                </button>
                {selectedSection === section && entries.length > 1 && (
                  <div style={{ background: '#FFFFFF', borderTop: '1px solid #E8E6DE' }}>
                    {entries.map(entry => (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => setActiveFieldEntryId(entry.id)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '9px 14px 9px 26px',
                          border: 'none',
                          borderBottom: '1px solid #F0EEE8',
                          background: activeFieldEntry?.id === entry.id ? '#F7FBFF' : 'transparent',
                          color: activeFieldEntry?.id === entry.id ? COLORS.primary : COLORS.textSecondary,
                          fontFamily: 'Georgia, serif',
                          fontSize: 13,
                          cursor: 'pointer',
                        }}
                      >
                        {entry.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </aside>

          <div style={{ minWidth: 0 }}>
            {activeFieldEntry && (
              <article style={{ border: '1px solid #E8E6DE', borderRadius: 12, padding: 18, background: '#FFFFFF' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.primary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  {activeFieldEntry.section}
                </div>
                <h4 style={{ margin: '0 0 10px', color: COLORS.textPrimary, fontSize: 20 }}>{activeFieldEntry.title}</h4>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: COLORS.textSecondary, fontSize: 15, lineHeight: 1.7 }}>{activeFieldEntry.body}</p>
                {Array.isArray(activeFieldEntry.tags) && activeFieldEntry.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 14 }}>
                    {activeFieldEntry.tags.map(tag => <Badge key={tag} label={tag} color={COLORS.textSecondary} bg="#F0EEE8" />)}
                  </div>
                )}
                {editMode && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                    <Btn small variant="ghost" onClick={() => setEditingFieldGuideEntry({ ...activeFieldEntry, tags: Array.isArray(activeFieldEntry.tags) ? activeFieldEntry.tags.join(', ') : '' })}>Edit</Btn>
                    <Btn small variant="danger" onClick={() => onDeleteFieldGuideEntry(activeFieldEntry)}>Delete</Btn>
                  </div>
                )}
              </article>
            )}
          </div>
        </div>
      </div>
      )}

      {isTutorial && !editMode && total > 0 && (
        <div style={{ background: '#E8E6DE', borderRadius: 8, height: 8, marginBottom: 28, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 8,
            background: allDone ? COLORS.success : COLORS.primary,
            width: `${pct}%`, transition: 'width 0.4s ease',
          }} />
        </div>
      )}

      {isTutorial && !editMode && allDone && (
        <div className="admin-card" style={{ background: '#F0FDF4', borderColor: '#ABEFC6', padding: '18px 22px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="admin-symbol" style={{ background: '#DCFAE6', color: '#067647', borderColor: '#ABEFC6' }}>OK</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1A6B3A', marginBottom: 2 }}>Resource checklist complete!</div>
            <div style={{ fontSize: 13, color: '#2E7D50', lineHeight: 1.5 }}>You are ready to support victims using this portal.</div>
          </div>
        </div>
      )}

      {isTutorial && editingStep && (
        <TutorialEditor
          step={editingStep}
          setStep={setEditingStep}
          onSave={() => onSave(editingStep)}
          onCancel={() => setEditingStep(null)}
        />
      )}

      {isTutorial && total === 0 && !editingStep && (
        <div className="admin-card" style={{ padding: 40, textAlign: 'center', color: COLORS.textMuted, marginBottom: 16 }}>
          No resource checklist items yet. {editMode ? 'Click "Add step" below to create one.' : 'An admin can add checklist items from the edit view.'}
        </div>
      )}

      {isTutorial && total > 0 && visibleSteps.length === 0 && !editingStep && !editMode && (
        <div className="admin-card" style={{ padding: 40, textAlign: 'center', color: COLORS.textMuted, marginBottom: 16 }}>
          Tutorial complete. Completed items are hidden until an admin resets this user&apos;s tutorial progress.
        </div>
      )}

      {isTutorial && <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {visibleSteps.map((step) => {
          const isDone = completedSteps.includes(step.id)
          const stepNumber = steps.findIndex(item => item.id === step.id) + 1
          const borderColor = step.is_warning ? '#F5C4B3' : isDone ? '#A8D5B5' : '#E8E6DE'
          const bgColor = step.is_warning ? '#FAECE7' : isDone ? '#F4FBF6' : '#FFFFFF'

          return (
            <div key={step.id} className="admin-card" style={{
              background: bgColor, border: `1px solid ${borderColor}`,
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
                    <span className="admin-symbol" style={{ width: 30, height: 30, fontSize: 10 }} aria-hidden="true">{formatAdminSymbol(step.icon, step.title)}</span>
                    <span style={{
                      fontWeight: 700, fontSize: 15,
                      color: isDone && !editMode ? COLORS.textMuted : step.is_warning ? '#993C1D' : COLORS.textPrimary,
                      textDecoration: isDone && !editMode ? 'line-through' : 'none',
                    }}>
                      Step {stepNumber} — {step.title}
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
      </div>}

      {isTutorial && editMode && !editingStep && (
        <div style={{ marginTop: 16 }}>
          <Btn onClick={() => setEditingStep({ icon: 'GEN', title: '', body: '', is_warning: false, highlight: false, action_label: '', action_view: '' })}>
            + Add checklist item
          </Btn>
        </div>
      )}

      {isTutorial && !editMode && (
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
  { value: 'fieldGuide', label: 'Volunteer Advocate Resources' },
  { value: 'activity', label: 'Activity' },
  { value: 'trash', label: 'Trash' },
]

function FieldGuideEditor({ entry, setEntry, onSave, onCancel }) {
  return (
    <div style={{ marginTop: 16, background: '#FFFFFF', borderRadius: 12, border: `2px solid ${COLORS.primary}`, padding: 18 }}>
      <h4 style={{ margin: '0 0 14px', fontSize: 15, color: COLORS.primary }}>{entry.id ? 'Edit field guide entry' : 'Add field guide entry'}</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 12 }}>
        <Field label="Section">
          <Input value={entry.section || ''} onChange={v => setEntry({ ...entry, section: v })} placeholder="Safety Planning" />
        </Field>
        <Field label="Title">
          <Input value={entry.title || ''} onChange={v => setEntry({ ...entry, title: v })} placeholder="Guide title" />
        </Field>
        <Field label="Order">
          <Input value={String(entry.sort_order ?? 100)} onChange={v => setEntry({ ...entry, sort_order: v })} type="number" />
        </Field>
      </div>
      <Field label="Guide Content">
        <textarea
          value={entry.body || ''}
          onChange={e => setEntry({ ...entry, body: e.target.value })}
          placeholder="Write searchable mobile-friendly field guide content..."
          rows={7}
          style={{
            width: '100%', padding: '11px 14px', borderRadius: 12,
            border: `1.5px solid ${COLORS.border}`, fontSize: 15,
            fontFamily: 'Georgia, serif', outline: 'none', boxSizing: 'border-box',
            background: '#FFFFFF', color: COLORS.textPrimary, resize: 'vertical', lineHeight: 1.6,
          }}
        />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, alignItems: 'end', marginTop: 12 }}>
        <Field label="Search Tags">
          <Input value={Array.isArray(entry.tags) ? entry.tags.join(', ') : entry.tags || ''} onChange={v => setEntry({ ...entry, tags: v })} placeholder="trauma, court, safety" />
        </Field>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: COLORS.textPrimary, fontSize: 14, minHeight: 44 }}>
          <input type="checkbox" checked={entry.published !== false} onChange={e => setEntry({ ...entry, published: e.target.checked })} />
          Published
        </label>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        <Btn onClick={onSave}>{entry.id ? 'Save entry' : 'Add entry'}</Btn>
      </div>
    </div>
  )
}

function TutorialEditor({ step, setStep, onSave, onCancel }) {
  return (
    <div className="admin-card" style={{ borderColor: '#98A2B3', padding: 24, marginBottom: 16 }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 16, color: COLORS.primary }}>
        {step.id ? 'Edit checklist item' : 'Add checklist item'}
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 12, marginBottom: 12 }}>
        <Field label="Symbol"><Input value={step.icon} onChange={v => setStep({ ...step, icon: v })} placeholder="GEN" maxLength={4} /></Field>
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
