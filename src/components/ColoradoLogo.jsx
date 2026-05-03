export default function ColoradoLogo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="coFlagClip">
          <circle cx="20" cy="20" r="18.5"/>
        </clipPath>
      </defs>

      {/* Colorado flag: blue (top) / white (middle) / red (bottom) */}
      <rect x="1" y="1.5" width="38" height="12.3" fill="#003DA5" clipPath="url(#coFlagClip)"/>
      <rect x="1" y="13.8" width="38" height="12.4" fill="#FFFFFF" clipPath="url(#coFlagClip)"/>
      <rect x="1" y="26.2" width="38" height="12.3" fill="#BF0A30" clipPath="url(#coFlagClip)"/>

      {/* Colorado C — thick red arc, opening facing right */}
      <path
        d="M 27.4,29.5 A 12,12 0 1 0 27.4,10.5 L 24.9,13.7 A 8,8 0 1 1 24.9,26.3 Z"
        fill="#BF0A30"
        clipPath="url(#coFlagClip)"
      />

      {/* Gold disc in the C opening */}
      <circle cx="28" cy="20" r="4.8" fill="#FFC726" clipPath="url(#coFlagClip)"/>

      {/* Outer badge ring */}
      <circle cx="20" cy="20" r="18.5" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" fill="none"/>
    </svg>
  )
}
