export default function ColoradoLogo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="badgeClip">
          <circle cx="100" cy="100" r="93"/>
        </clipPath>
        {/* Arc path for curved bottom text */}
        <path id="textArc" d="M 22.9,135.9 A 85,85 0 0 1 177.1,135.9"/>
      </defs>

      {/* Cream base circle */}
      <circle cx="100" cy="100" r="93" fill="#FAE2CC"/>

      {/* Red Colorado C — opens to the right (±65° gap) */}
      <path
        d="M 139.3,15.7 A 93,93 0 1 0 139.3,184.3 L 122.8,148.9 A 54,54 0 1 1 122.8,51.1 Z"
        fill="#E33030"
        clipPath="url(#badgeClip)"
      />

      {/* Gold sun disc */}
      <circle cx="108" cy="88" r="47" fill="#F5C430" clipPath="url(#badgeClip)"/>

      {/* Cream mountain zone (lower section) */}
      <rect x="7" y="112" width="186" height="81" fill="#FAE2CC" clipPath="url(#badgeClip)"/>

      {/* Mountain silhouette — dark navy */}
      <path
        d="M 7,172
           L 22,156 L 35,140 L 48,152
           L 56,130 L 65,140
           L 74,118 L 85,130
           L 100,82
           L 115,120 L 126,102 L 138,118
           L 148,108 L 160,125
           L 174,140 L 188,155 L 193,168
           L 193,175 L 7,175 Z"
        fill="#1E306E"
        clipPath="url(#badgeClip)"
      />

      {/* Light rock face highlight on center peak */}
      <path
        d="M 100,82 L 88,116 L 94,118 L 100,102 L 106,116 L 112,114 Z"
        fill="#C8B8AA"
        opacity="0.75"
        clipPath="url(#badgeClip)"
      />

      {/* Curved text along the bottom */}
      <text fill="#1E306E" fontSize="10.5" fontFamily="Georgia, serif" fontWeight="bold" letterSpacing="0.8">
        <textPath href="#textArc" startOffset="50%" textAnchor="middle">
          VOLUNTEER VICTIM ADVOCATE
        </textPath>
      </text>

      {/* Outer border ring */}
      <circle cx="100" cy="100" r="93" stroke="#1E306E" strokeWidth="7" fill="none"/>
    </svg>
  )
}
