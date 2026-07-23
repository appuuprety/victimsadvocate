/* eslint-disable react-refresh/only-export-components */
// Shared design tokens
export const COLORS = {
  primary: '#003DA5',
  primaryDark: '#002882',
  primaryLight: '#E4EBF8',
  accent: '#C49A00',
  accentBg: '#FFF8DC',
  danger: '#BF0A30',
  success: '#0F6E56',
  cardBg: '#FFFFFF',
  pageBg: '#FAFAF7',
  border: '#E8E6DE',
  textPrimary: '#2C2C2A',
  textSecondary: '#6B6866',
  textMuted: '#767370',
}

// Public-site-only palette (warm/inviting) — kept separate from COLORS so the
// admin panel, which shares components like BrochureCard/ShareModal, is unaffected.
export const PUBLIC_COLORS = {
  primary: '#B5563A',
  primaryDark: '#8F4128',
  primaryLight: '#F3DDD3',
  accent: '#C9962C',
  accentBg: '#FBF0DA',
  hope: '#6B8F71',
  danger: '#BF0A30',
  success: '#5F8A5A',
  cardBg: '#FFFFFF',
  pageBg: '#FBF6EE',
  border: '#EFE3D3',
  textPrimary: '#3A2E27',
  textSecondary: '#7A6A5D',
  textMuted: '#948578',
}

export const inp = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 12,
  border: `1.5px solid ${COLORS.border}`,
  fontSize: 15,
  fontFamily: 'Georgia, serif',
  outline: 'none',
  boxSizing: 'border-box',
  background: '#FFFFFF',
  color: COLORS.textPrimary,
  WebkitAppearance: 'none',
}

// Wraps an icon (emoji glyph or SVG) in a soft round tile — shared container
// so emoji fallbacks and the custom line icons in icons.jsx look consistent.
export function IconTile({ size = 16, bg, children }) {
  return (
    <span style={{
      width: size * 1.9,
      height: size * 1.9,
      borderRadius: '50%',
      background: bg || COLORS.pageBg,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      {children}
    </span>
  )
}

// Mutes emoji glyphs (category icons, file/star markers) so they read as flat,
// desaturated icon marks instead of bright cartoon emoji. Used as a fallback
// for any category an admin adds that isn't in the hand-drawn icon set.
export function IconGlyph({ icon, size = 16, tile = false, bg, style = {} }) {
  const glyph = (
    <span
      aria-hidden="true"
      style={{
        fontSize: size,
        lineHeight: 1,
        filter: 'grayscale(0.45) contrast(1)',
        opacity: 0.88,
        display: 'inline-block',
        ...style,
      }}
    >
      {icon}
    </span>
  )
  if (!tile) return glyph
  return <IconTile size={size} bg={bg}>{glyph}</IconTile>
}

export function Badge({ label, icon, iconNode, color = COLORS.primary, bg = COLORS.primaryLight }) {
  return (
    <span style={{
      fontSize: 11,
      fontWeight: 700,
      padding: '3px 10px',
      borderRadius: 20,
      background: bg,
      color,
      letterSpacing: '0.03em',
      whiteSpace: 'nowrap',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
    }}>
      {iconNode || (icon && <IconGlyph icon={icon} size={11} />)}
      {label}
    </span>
  )
}

export function Btn({ children, onClick, variant = 'primary', small, disabled, style = {}, palette = COLORS, ...rest }) {
  const v = {
    primary: { background: palette.primary, color: '#fff', border: 'none' },
    secondary: { background: 'transparent', color: palette.primary, border: `1.5px solid ${palette.primary}` },
    danger: { background: palette.danger, color: '#fff', border: 'none' },
    ghost: { background: 'transparent', color: palette.textSecondary, border: `1.5px solid ${palette.border}` },
    success: { background: palette.success, color: '#fff', border: 'none' },
    warm: { background: palette.accent, color: '#fff', border: 'none' },
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      {...rest}
      style={{
        ...v[variant],
        padding: small ? '8px 16px' : '11px 24px',
        borderRadius: 12,
        fontSize: small ? 13 : 15,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontFamily: 'Georgia, serif',
        minHeight: small ? 36 : 44,
        transition: 'opacity 0.15s, transform 0.1s',
        WebkitTapHighlightColor: 'transparent',
        ...style,
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = '0.82' }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.opacity = '1' }}
      onTouchStart={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.97)' }}
      onTouchEnd={e => { if (!disabled) e.currentTarget.style.transform = 'scale(1)' }}
    >
      {children}
    </button>
  )
}

export function Field({ label, children }) {
  return (
    <div>
      <label style={{
        fontSize: 11,
        fontWeight: 700,
        color: COLORS.textSecondary,
        display: 'block',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}>
        {label}
      </label>
      {children}
    </div>
  )
}

export function Input({ value, onChange, placeholder, type = 'text', style = {}, ...rest }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      {...rest}
      style={{ ...inp, ...style }}
    />
  )
}

export function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }}
    />
  )
}

export function SelectEl({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={inp}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

export function Spinner() {
  return (
    <div style={{
      display: 'inline-block',
      width: 18,
      height: 18,
      border: '2px solid #D3D1C7',
      borderTopColor: COLORS.primary,
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} />
  )
}
