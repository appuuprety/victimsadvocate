import { useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Badge, Btn, COLORS, IconGlyph } from './ui'
import { CategoryMark, DocumentIcon } from './icons'
import { getCategoryBg } from '../lib/helpers'
import { T, CAT_LABELS } from '../lib/translations'

// `useLineIcons` opts into the hand-drawn line icon set (public site only) —
// the admin brochure list keeps the plain muted-emoji treatment.
export default function BrochureCard({ brochure, categories, onShare, lang, selected, onSelect, onNeedTranslation, palette = COLORS, useLineIcons = false }) {
  const isSelected = selected?.has(brochure.id)
  const selectionFull = (selected?.size ?? 0) >= 5 && !isSelected
  const t_share = T[lang]?.share || T.en.share
  const t_download = T[lang]?.download || T.en.download
  const t_visit = T[lang]?.visit_link || T.en.visit_link

  const cat = categories.find(c => c.id === brochure.category_id)
  const catLabel = CAT_LABELS[lang]?.[brochure.category_id] || cat?.label || brochure.category_id

  const translation = lang !== 'en' ? brochure.translations?.[lang] : null
  const displayTitle = translation?.title || brochure.title
  const displayDescription = translation?.description ?? brochure.description

  useEffect(() => {
    if (lang !== 'en' && !brochure.translations?.[lang]) {
      onNeedTranslation?.(brochure.id, lang)
    }
  }, [lang, brochure.id, brochure.translations, onNeedTranslation])

  async function download() {
    const { data } = supabase.storage.from('brochures').getPublicUrl(brochure.file_path)
    window.open(data.publicUrl, '_blank')
  }

  return (
    <div
      style={{
        background: palette.cardBg,
        borderRadius: 18,
        border: isSelected ? `2px solid ${palette.primary}` : `1px solid ${palette.border}`,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        boxShadow: isSelected ? `0 0 0 3px ${palette.primaryLight}` : '0 1px 4px rgba(0,0,0,0.04)',
        transition: 'box-shadow 0.2s, transform 0.15s, border-color 0.15s',
        position: 'relative',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.09)'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'
        e.currentTarget.style.transform = 'none'
      }}
    >
      {/* Select checkbox */}
      {onSelect && (
        <button
          role="checkbox"
          aria-checked={isSelected}
          aria-label={isSelected ? `Deselect ${brochure.title}` : `Select ${brochure.title} for sharing`}
          onClick={() => onSelect(brochure.id)}
          disabled={selectionFull}
          title={selectionFull ? 'Max 5 resources' : isSelected ? 'Deselect' : 'Select to share'}
          style={{
            position: 'absolute', top: 10, right: 10,
            width: 16, height: 16, borderRadius: 4,
            border: `1.5px solid ${isSelected ? palette.primary : palette.border}`,
            background: isSelected ? palette.primary : 'rgba(255,255,255,0.9)',
            cursor: selectionFull ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 10, fontWeight: 700,
            opacity: selectionFull ? 0.3 : 1,
            zIndex: 1, padding: 0, lineHeight: 1,
          }}
        >
          {isSelected ? '✓' : ''}
        </button>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {cat && (
              <Badge
                icon={useLineIcons ? undefined : cat.icon}
                iconNode={useLineIcons ? <CategoryMark id={brochure.category_id} emoji={cat.icon} size={11} color={cat.color} /> : undefined}
                label={catLabel}
                color={cat.color}
                bg={getCategoryBg(brochure.category_id)}
              />
            )}
            {brochure.featured && (
              <Badge icon={useLineIcons ? undefined : '⭐'} label={useLineIcons ? '★ Featured' : 'Featured'} color="#8B5E0A" bg="#FDF3E3" />
            )}
          </div>
          <h3 style={{
            margin: 0,
            fontSize: 16,
            fontFamily: 'Georgia, serif',
            fontWeight: 700,
            color: palette.textPrimary,
            lineHeight: 1.4,
          }}>
            {displayTitle}
          </h3>
          {translation && (
            <span
              title="Machine-translated — not yet reviewed by a native speaker"
              style={{ fontSize: 11, color: palette.textMuted, display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4 }}
            >
              🤖 {T[lang]?.machine_translated || 'Machine-translated'}
            </span>
          )}
        </div>
        <div style={{ flexShrink: 0, marginTop: 2 }}>
          {useLineIcons ? <DocumentIcon size={22} color={palette.textSecondary} /> : <IconGlyph icon="📄" size={24} />}
        </div>
      </div>

      {/* Description */}
      {displayDescription && (
        <p style={{
          margin: 0,
          fontSize: 14,
          color: palette.textSecondary,
          lineHeight: 1.65,
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
        }}>
          {displayDescription}
        </p>
      )}

      {/* Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {(brochure.tags || []).map(tag => (
          <span key={tag} style={{
            fontSize: 11,
            padding: '3px 10px',
            borderRadius: 20,
            background: palette.pageBg,
            color: palette.textSecondary,
            fontWeight: 500,
          }}>
            {tag}
          </span>
        ))}
      </div>

      {/* Contact info — only shown when filled */}
      {(brochure.phone_number || brochure.business_hours) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {brochure.phone_number && (
            <div style={{ fontSize: 13, color: palette.textSecondary, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span aria-hidden="true">📞</span>
              <a href={`tel:${brochure.phone_number}`} style={{ color: palette.primary, textDecoration: 'none', fontWeight: 600 }}
                aria-label={`Call ${brochure.phone_number}`}>
                {brochure.phone_number}
              </a>
            </div>
          )}
          {brochure.business_hours && (
            <div style={{ fontSize: 13, color: palette.textSecondary, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={palette.textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <polyline points="12 7 12 12 15 14" />
              </svg>
              <span>{brochure.business_hours}</span>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{
        borderTop: `1px solid ${palette.border}`,
        paddingTop: 12,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
      }}>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn small variant="ghost" palette={palette} onClick={() => onShare(brochure)} aria-label={`Share ${brochure.title}`}>{t_share}</Btn>
          {brochure.link_url && (
            <Btn small variant="secondary" palette={palette} onClick={() => window.open(brochure.link_url, '_blank')}>{t_visit}</Btn>
          )}
          {brochure.file_path && brochure.file_path.length > 2 && (
            <Btn small variant="secondary" palette={palette} onClick={download}>{t_download}</Btn>
          )}
        </div>
      </div>
    </div>
  )
}
