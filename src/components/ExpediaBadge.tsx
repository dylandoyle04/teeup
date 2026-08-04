import { useState } from 'react'

// Shows the official Expedia affiliate badge once the image exists at
// public/expedia-badge.png. Until then it renders nothing (no broken image),
// so the layout is unaffected while you grab the approved badge from your
// Expedia creator dashboard.
const STOREFRONT = 'https://expedia.com/shop/flagstickfinder'

export default function ExpediaBadge({ className = '' }: { className?: string }) {
  const [ok, setOk] = useState(true)
  if (!ok) return null
  return (
    <a
      className={`expedia-badge ${className}`}
      href={STOREFRONT}
      target="_blank"
      rel="noreferrer noopener"
      aria-label="Book travel on Expedia"
    >
      <img
        src={`${import.meta.env.BASE_URL}expedia-badge.png`}
        alt="Book travel on Expedia"
        onError={() => setOk(false)}
      />
    </a>
  )
}
