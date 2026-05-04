import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Badge, Btn, Field, Input, Spinner, COLORS } from './ui'
import ColoradoLogo from './ColoradoLogo'
import BrochureCard from './BrochureCard'
import BrochureForm from './BrochureForm'

export default function AdminPanel({ brochures, setBrochures, categories, setCategories, onLogout, onShare }) {
  const [view, setView] = useState('dashboard')
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [shareLogs, setShareLogs] = useState([])
  const [newCatName, setNewCatName] = useState('')
  const [newCatIcon, setNewCatIcon] = useState('📌')
  const [newCatColor, setNewCatColor] = useState(COLORS.primary)
  const [catError, setCatError] = useState('')
  const [editingCat, setEditingCat] = useState(null) // category being edited

  useEffect(() => {
    if (view === 'activity') {
      supabase.from('share_logs').select('*, brochures(title)').order('shared_at', { ascending: false }).limit(30)
        .then(({ data }) => setShareLogs(data || []))
    }
  }, [view])

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
  ]

  return (
    <div style={{ fontFamily: 'Georgia, serif', background: '#FAFAF7', minHeight: '100vh', colorScheme: 'light' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      <header style={{ background: 'linear-gradient(135deg, #0F2D5E, #1B4D8E)', padding: '0 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 60 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ColoradoLogo size={32} />
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>CVR Admin Portal</div>
            <span style={{ background: 'rgba(255,255,255,.15)', color: '#B5D4F4', fontSize: 11, padding: '2px 10px', borderRadius: 10, fontWeight: 600 }}>Staff</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {navItems.map(([id, label]) => (
              <button key={id} onClick={() => setView(id)} style={{
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

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>

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
