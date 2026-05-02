import { supabase } from '../supabaseClient'
import { Badge, Btn, COLORS } from './ui'
import { getCategoryBg } from '../lib/helpers'
import { CAT_LABELS } from '../lib/translations'

export default function BrochureCard({ brochure, categories, onShare, lang }) {
  const t_share = lang === 'es' ? 'Compartir' : 'Share'
  const t_download = lang === 'es' ? 'Descargar' : 'Download'
  const t_visit = lang === 'es' ? 'Visitar Enlace' : 'Visit Link'

  const cat = categories.find(c => c.id === brochure.category_id)
  const catLabel = CAT_LABELS[lang]?.[brochure.category_id] || cat?.label || brochure.category_id

  async function download() {
    const { data } = supabase.storage.from('brochures').getPublicUrl(brochure.file_path)
    window.open(data.publicUrl, '_blank')
  }

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 18,
        border: '1px solid #E8E6DE',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        transition: 'box-shadow 0.2s, transform 0.15s',
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
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {cat && (
              <Badge
                label={`${cat.icon} ${catLabel}`}
                color={cat.color}
                bg={getCategoryBg(brochure.category_id)}
              />
            )}
            {brochure.featured && (
              <Badge label="⭐ Featured" color="#8B5E0A" bg="#FDF3E3" />
            )}
          </div>
          <h3 style={{
            margin: 0,
            fontSize: 16,
            fontFamily: 'Georgia, serif',
            fontWeight: 700,
            color: COLORS.textPrimary,
            lineHeight: 1.4,
          }}>
            {brochure.title}
          </h3>
        </div>
        <div style={{ fontSize: 26, flexShrink: 0, marginTop: 2 }}>📄</div>
      </div>

      {/* Description */}
      {brochure.description && (
        <p style={{
          margin: 0,
          fontSize: 14,
          color: COLORS.textSecondary,
          lineHeight: 1.65,
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
        }}>
          {brochure.description}
        </p>
      )}

      {/* Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {(brochure.tags || []).map(tag => (
          <span key={tag} style={{
            fontSize: 11,
            padding: '3px 10px',
            borderRadius: 20,
            background: '#F5F3EE',
            color: COLORS.textSecondary,
            fontWeight: 500,
          }}>
            {tag}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        borderTop: '1px solid #F0EEE8',
        paddingTop: 12,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
      }}>
        
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn small variant="ghost" onClick={() => onShare(brochure)}>{t_share}</Btn>
          {brochure.link_url && (
            <Btn small variant="secondary" onClick={() => window.open(brochure.link_url, '_blank')}>{t_visit}</Btn>
          )}
          {brochure.file_path && brochure.file_path.length > 2 && (
            <Btn small variant="secondary" onClick={download}>{t_download}</Btn>
          )}
        </div>
      </div>
    </div>
  )
}
