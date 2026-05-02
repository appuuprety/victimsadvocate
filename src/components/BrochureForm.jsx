import { useState, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { Btn, Field, Input, Textarea, SelectEl, Spinner, COLORS } from './ui'

export default function BrochureForm({ categories, initial = {}, onDone, onCancel }) {
  const editing = !!initial.id
  const [title, setTitle] = useState(initial.title || '')
  const [description, setDescription] = useState(initial.description || '')
  const [categoryId, setCategoryId] = useState(initial.category_id || categories[0]?.id || '')
  const [tags, setTags] = useState((initial.tags || []).join(', '))
  const [featured, setFeatured] = useState(initial.featured || false)
  const [linkUrl, setLinkUrl] = useState(initial.link_url || '')
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  async function submit() {
    if (!title.trim()) return setError('Title is required.')
    if (!categoryId) return setError('Category is required.')
    if (!editing && !file && !linkUrl) return setError('Please upload a file or provide a link.')
    setError('')
    setUploading(true)
    try {
      let filePath = initial.file_path || '', fileName = initial.file_name || '—', fileSize = initial.file_size || '—', fileType = initial.file_type || '—'
      if (file) {
        const ext = file.name.split('.').pop()
        filePath = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: se } = await supabase.storage.from('brochures').upload(filePath, file, { contentType: file.type })
        if (se) throw se
        fileName = file.name
        fileSize = `${(file.size / 1024 / 1024).toFixed(1)} MB`
        fileType = ext
      }
      const payload = {
        title: title.trim(), description: description.trim(), category_id: categoryId,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean), featured,
        link_url: linkUrl.trim() || null, file_name: fileName, file_path: filePath,
        file_size: fileSize, file_type: fileType, updated_at: new Date().toISOString(),
      }
      let data, err
      if (editing) {
        ({ data, error: err } = await supabase.from('brochures').update(payload).eq('id', initial.id).select().single())
      } else {
        ({ data, error: err } = await supabase.from('brochures').insert(payload).select().single())
      }
      if (err) throw err
      onDone(data, editing)
    } catch (e) {
      setError(e.message || 'Operation failed.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ background: '#FFFFFF', borderRadius: 18, border: '1px solid #E8E6DE', padding: 28 }}>
      <h3 style={{ margin: '0 0 24px', fontFamily: 'Georgia, serif', fontSize: 20, color: COLORS.primary }}>
        {editing ? '✏️ Edit Brochure' : '📤 Add New Brochure'}
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={{ gridColumn: '1/-1' }}>
          <Field label="Title *"><Input value={title} onChange={setTitle} placeholder="Brochure title…" /></Field>
        </div>
        <Field label="Category *">
          <SelectEl value={categoryId} onChange={setCategoryId} options={categories.map(c => ({ value: c.id, label: `${c.icon} ${c.label}` }))} />
        </Field>
        <Field label="Tags (comma-separated)">
          <Input value={tags} onChange={setTags} placeholder="housing, shelter, emergency" />
        </Field>
        <div style={{ gridColumn: '1/-1' }}>
          <Field label="Description">
            <Textarea value={description} onChange={setDescription} placeholder="Brief description of what this resource covers…" />
          </Field>
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <Field label="External Link URL">
            <Input value={linkUrl} onChange={setLinkUrl} type="url" placeholder="https://example.gov/resource.pdf" />
          </Field>
          <p style={{ margin: '6px 0 0', fontSize: 12, color: COLORS.textMuted }}>
            If this resource lives at an external URL, paste it here.
          </p>
        </div>
      </div>

      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); setFile(e.dataTransfer.files[0]) }}
        onClick={() => fileRef.current.click()}
        style={{
          border: `2px dashed ${dragOver ? COLORS.primary : '#C8C6BE'}`,
          borderRadius: 14,
          padding: 28,
          textAlign: 'center',
          cursor: 'pointer',
          background: dragOver ? COLORS.primaryLight : '#FAFAF7',
          transition: 'all .2s',
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 8 }}>📎</div>
        <div style={{ fontWeight: 600, color: COLORS.textPrimary, marginBottom: 4 }}>
          {file ? `✅ ${file.name}` : editing ? 'Drop new file to replace, or leave empty to keep existing' : 'Drop file here or click to browse'}
        </div>
        <div style={{ fontSize: 12, color: COLORS.textMuted }}>PDF, DOCX, PNG, JPG — max 50 MB</div>
        <input ref={fileRef} type="file" accept=".pdf,.docx,.png,.jpg,.jpeg" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <input type="checkbox" id="featured" checked={featured} onChange={e => setFeatured(e.target.checked)} style={{ width: 18, height: 18, cursor: 'pointer' }} />
        <label htmlFor="featured" style={{ fontSize: 14, cursor: 'pointer', color: COLORS.textPrimary }}>Mark as featured resource</label>
      </div>

      {error && <p style={{ color: COLORS.danger, fontSize: 13, marginBottom: 12 }}>{error}</p>}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <Btn variant="ghost" onClick={onCancel} disabled={uploading}>Cancel</Btn>
        <Btn onClick={submit} disabled={uploading}>
          {uploading
            ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Spinner />{editing ? 'Saving…' : 'Uploading…'}</span>
            : editing ? 'Save Changes' : 'Upload Brochure'}
        </Btn>
      </div>
    </div>
  )
}
