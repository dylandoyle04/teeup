import { useState } from 'react'

// Shows the OFFICIAL Expedia badge from public/expedia-badge.png if present.
// Until an approved asset is added, it falls back to a compliant text chip
// ("Expedia Affiliate") — accurate to the real relationship, no logo/permission
// needed and no "partner" claim.
const STOREFRONT = 'https://expedia.com/shop/flagstickfinder'

export default function ExpediaBadge({ className = '' }: { className?: string }) {
  const [mode, setMode] = useState<'img' | 'text'>('img')
  return (
    <a
      className={`expedia-badge ${className}`}
      href={STOREFRONT}
      target="_blank"
      rel="noreferrer noopener"
      aria-label="Book travel on Expedia (Expedia affiliate)"
    >
      {mode === 'img' ? (
        <img
          src={`${import.meta.env.BASE_URL}expedia-badge.png`}
          alt="Book travel on Expedia"
          onError={() => setMode('text')}
        />
      ) : (
        <span className="expedia-chip">
          <span className="expedia-chip-word">Expedia</span> Affiliate
        </span>
      )}
    </a>
  )
}
