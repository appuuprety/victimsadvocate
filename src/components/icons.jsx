// Small hand-drawn line icons (public site only) — replace the loose emoji
// with simple, consistent outline marks. Kept intentionally minimal: plain
// geometric primitives, single stroke color, no fills, so they read as quiet
// marks next to a label instead of illustrations competing for attention.
import { IconGlyph, IconTile } from './ui'

const base = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

function Svg({ size, color, children }) {
  return (
    <svg {...base} width={size} height={size} stroke={color} aria-hidden="true">
      {children}
    </svg>
  )
}

const CATEGORY_ICON_PATHS = {
  housing: ({ size, color }) => (
    <Svg size={size} color={color}>
      <polyline points="4,12 12,5 20,12" />
      <path d="M6,10 V20 H18 V10" />
      <rect x="10" y="14" width="4" height="6" />
    </Svg>
  ),
  legal: ({ size, color }) => (
    <Svg size={size} color={color}>
      <line x1="12" y1="3" x2="12" y2="20" />
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="7" x2="4" y2="12" />
      <line x1="20" y1="7" x2="20" y2="12" />
      <polyline points="1,12 4,16 7,12" />
      <polyline points="17,12 20,16 23,12" />
      <line x1="8" y1="20" x2="16" y2="20" />
    </Svg>
  ),
  counseling: ({ size, color }) => (
    <Svg size={size} color={color}>
      <rect x="4" y="5" width="16" height="11" rx="2" />
      <polyline points="8,16 8,20 12,16" />
      <line x1="9" y1="10.5" x2="9.01" y2="10.5" />
      <line x1="12" y1="10.5" x2="12.01" y2="10.5" />
      <line x1="15" y1="10.5" x2="15.01" y2="10.5" />
    </Svg>
  ),
  financial: ({ size, color }) => (
    <Svg size={size} color={color}>
      <ellipse cx="12" cy="7" rx="7" ry="2.5" />
      <path d="M5,7 v6 a7,2.5 0 0 0 14,0 V7" />
      <path d="M5,13 v4 a7,2.5 0 0 0 14,0 v-4" />
    </Svg>
  ),
  safety: ({ size, color }) => (
    <Svg size={size} color={color}>
      <path d="M12,3 L19,6 V11 C19,16 16,19.5 12,21 C8,19.5 5,16 5,11 V6 Z" />
    </Svg>
  ),
  children: ({ size, color }) => (
    <Svg size={size} color={color}>
      <circle cx="8" cy="7" r="2.2" />
      <path d="M4,20 v-3 a4,4 0 0 1 8,0 v3" />
      <circle cx="16" cy="7" r="2.2" />
      <path d="M12,20 v-3 a4,4 0 0 1 8,0 v3" />
    </Svg>
  ),
  medical: ({ size, color }) => (
    <Svg size={size} color={color}>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </Svg>
  ),
  emergency: ({ size, color }) => (
    <Svg size={size} color={color}>
      <path d="M12,3 L22,20 H2 Z" />
      <line x1="12" y1="9" x2="12" y2="14" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </Svg>
  ),
}

export function CategoryIcon({ id, size = 20, color = 'currentColor' }) {
  const render = CATEGORY_ICON_PATHS[id]
  if (!render) return null
  return render({ size, color })
}

// Picks the hand-drawn line icon for known categories, falling back to the
// admin-chosen emoji (muted) for anything custom. `tile` wraps it in the
// soft round background used on the home page category grid.
export function CategoryMark({ id, emoji, size = 20, tile = false, bg, color }) {
  const inner = CATEGORY_ICON_PATHS[id]
    ? <CategoryIcon id={id} size={size} color={color || 'currentColor'} />
    : <IconGlyph icon={emoji} size={size} />
  if (!tile) return inner
  return <IconTile size={size} bg={bg}>{inner}</IconTile>
}

export function DocumentIcon({ size = 20, color = 'currentColor' }) {
  return (
    <Svg size={size} color={color}>
      <path d="M6,2 H14 L18,6 V22 H6 Z" />
      <polyline points="14,2 14,6 18,6" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="15" y2="16" />
    </Svg>
  )
}

export function PhoneIcon({ size = 20, color = 'currentColor' }) {
  return (
    <Svg size={size} color={color}>
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <line x1="11" y1="18" x2="13" y2="18" />
    </Svg>
  )
}

export function BuildingIcon({ size = 20, color = 'currentColor' }) {
  return (
    <Svg size={size} color={color}>
      <rect x="5" y="3" width="14" height="18" />
      <rect x="8" y="6" width="2.5" height="2.5" />
      <rect x="13.5" y="6" width="2.5" height="2.5" />
      <rect x="8" y="11" width="2.5" height="2.5" />
      <rect x="13.5" y="11" width="2.5" height="2.5" />
      <rect x="10" y="16" width="4" height="5" />
    </Svg>
  )
}

export function MailIcon({ size = 20, color = 'currentColor' }) {
  return (
    <Svg size={size} color={color}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <polyline points="3,7 12,13 21,7" />
    </Svg>
  )
}

const CONTACT_ICONS = {
  phone: PhoneIcon,
  building: BuildingIcon,
  mail: MailIcon,
  legal: (props) => <CategoryIcon id="legal" {...props} />,
}

export function ContactIcon({ kind, size = 20, tile = false, bg, color }) {
  const Icon = CONTACT_ICONS[kind]
  const inner = Icon ? <Icon size={size} color={color} /> : null
  if (!tile) return inner
  return <IconTile size={size} bg={bg}>{inner}</IconTile>
}
