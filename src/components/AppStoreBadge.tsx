import { APP_STORE_URL } from '../appStore'

/**
 * Apple's official "Download on the App Store" badge (public/app-store-badge.svg,
 * unmodified, per Apple's marketing guidelines). Renders nothing until the
 * app is live — see src/appStore.ts.
 */
export default function AppStoreBadge({ height = 48, className = '' }: { height?: number; className?: string }) {
  if (!APP_STORE_URL) return null
  return (
    <a
      className={`app-store-badge ${className}`}
      href={APP_STORE_URL}
      target="_blank"
      rel="noreferrer noopener"
      aria-label="Download Flagstick Finder on the App Store"
    >
      <img
        src={`${import.meta.env.BASE_URL}app-store-badge.svg`}
        alt="Download on the App Store"
        height={height}
        width={Math.round((height * 119.66407) / 40)}
      />
    </a>
  )
}
