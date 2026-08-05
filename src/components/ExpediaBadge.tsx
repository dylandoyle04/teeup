import { useState } from 'react'

// Static "[Expedia logo] Affiliate" mark (not a link). The logo comes from
// public/expedia-logo.png (a small light/white PNG works best on the dark nav
// & hero). Falls back to the word "Expedia" until the file is added.
export default function ExpediaBadge({ className = '' }: { className?: string }) {
  const [logo, setLogo] = useState(true)
  return (
    <span className={`expedia-badge ${className}`} aria-label="Expedia affiliate">
      {logo ? (
        <img
          className="expedia-logo"
          src={`${import.meta.env.BASE_URL}expedia-logo.png`}
          alt="Expedia"
          onError={() => setLogo(false)}
        />
      ) : (
        <span className="expedia-chip-word">Expedia</span>
      )}
      <span className="expedia-chip-affix">Affiliate</span>
    </span>
  )
}
