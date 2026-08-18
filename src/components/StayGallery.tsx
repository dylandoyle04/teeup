import { useRef, useState } from 'react'

/**
 * Swipeable / scrollable photo gallery for the featured-stay card.
 * Scroll-snaps on touch; arrows + dots for desktop. Falls back to a single
 * static image when only one photo is provided.
 */
export default function StayGallery({ photos }: { photos: string[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const [i, setI] = useState(0)

  function onScroll() {
    const el = ref.current
    if (!el) return
    setI(Math.round(el.scrollLeft / el.clientWidth))
  }

  function go(n: number) {
    const el = ref.current
    if (!el) return
    const clamped = Math.max(0, Math.min(photos.length - 1, n))
    el.scrollTo({ left: clamped * el.clientWidth, behavior: 'smooth' })
  }

  return (
    <div className="stay-gallery-wrap">
      <div className="stay-gallery" ref={ref} onScroll={onScroll}>
        {photos.map((src, idx) => (
          <img
            key={src}
            className="stay-slide"
            src={src}
            alt=""
            loading={idx === 0 ? 'eager' : 'lazy'}
            draggable={false}
          />
        ))}
      </div>

      <span className="stay-badge">Our pick</span>

      {photos.length > 1 && (
        <>
          <button
            className="stay-nav prev"
            onClick={() => go(i - 1)}
            disabled={i === 0}
            aria-label="Previous photo"
          >
            ‹
          </button>
          <button
            className="stay-nav next"
            onClick={() => go(i + 1)}
            disabled={i === photos.length - 1}
            aria-label="Next photo"
          >
            ›
          </button>
          <div className="stay-dots" aria-hidden="true">
            {photos.map((_, idx) => (
              <span
                key={idx}
                className={idx === i ? 'on' : ''}
                onClick={() => go(idx)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
