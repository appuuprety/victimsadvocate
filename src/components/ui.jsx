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

export function Badge({ label, color = COLORS.primary, bg = COLORS.primaryLight }) {
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
      display: 'inline-block',
    }}>
      {label}
    </span>
  )
}

export function Btn({ children, onClick, variant = 'primary', small, disabled, style = {}, ...rest }) {
  const v = {
    primary: { background: COLORS.primary, color: '#fff', border: 'none' },
    secondary: { background: 'transparent', color: COLORS.primary, border: `1.5px solid ${COLORS.primary}` },
    danger: { background: COLORS.danger, color: '#fff', border: 'none' },
    ghost: { background: 'transparent', color: COLORS.textSecondary, border: `1.5px solid ${COLORS.border}` },
    success: { background: COLORS.success, color: '#fff', border: 'none' },
    warm: { background: COLORS.accent, color: '#fff', border: 'none' },
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
