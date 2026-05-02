export default function ColoradoLogo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="rgba(255,255,255,0.15)" />
      <polygon points="6,29 15,13 24,29" fill="rgba(255,255,255,0.85)" />
      <polygon points="15,29 24,9 33,29" fill="#fff" />
      <polygon points="15,13 17.5,18 12.5,18" fill="rgba(180,220,255,0.8)" />
      <polygon points="24,9 27,15 21,15" fill="rgba(180,220,255,0.9)" />
      <path
        d="M20 35C20 35 12 29 12 23.5C12 20.5 14.5 18.5 17 19.5C18.2 20 20 21.5 20 21.5C20 21.5 21.8 20 23 19.5C25.5 18.5 28 20.5 28 23.5C28 29 20 35 20 35Z"
        fill="rgba(255,200,80,0.9)"
      />
    </svg>
  )
}
