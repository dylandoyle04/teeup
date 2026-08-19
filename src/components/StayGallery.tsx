import { useEffect, useRef, useState } from 'react'

/**
 * Swipeable photo gallery for the featured-stay card. Shows two photos at a
 * time on wider screens (so each renders smaller and sharper), one at a time
 * on narrow phones. Scroll-snaps on touch; arrows + dots for desktop.
 */
export default function StayGallery({ photos }: { photos: string[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(0)
  const [pages, setPages] = useState(1)

  function measure() {
    const el = ref.current
    const first = el?.firstElementChild as HTMLElement | null
    if (!el || !first) return
    const per = Math.max(1, Math.round(el.clientWidth / first.offsetWidth))
    setPages(Math.max(1, Math.ceil(photos.length / per)))
    setPage(Math.round(el.scrollLeft / el.clientWidth))
  }

  useEffect(() => {
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos])

  function go(p: number) {
    const el = ref.current
    if (!el) return
    const clamped = Math.max(0, Math.min(pages - 1, p))
    el.scrollTo({ left: clamped * el.clientWidth, behavior: 'smooth' })
  }

  return (
    <div className="stay-gallery-wrap">
      <div className="stay-gallery" ref={ref} onScroll={measure}>
        {photos.map((src, idx) => (
          <img
            key={src}
            className="stay-slide"
            src={src}
            alt=""
            loading={idx < 2 ? 'eager' : 'lazy'}
            draggable={false}
          />
        ))}
      </div>

      <span className="stay-badge">Our pick</span>

      {pages > 1 && (
        <>
          <button
            className="stay-nav prev"
            onClick={() => go(page - 1)}
            disabled={page === 0}
            aria-label="Previous photos"
          >
            ‹
          </button>
          <button
            className="stay-nav next"
            onClick={() => go(page + 1)}
            disabled={page === pages - 1}
            aria-label="Next photos"
          >
            ›
          </button>
          <div className="stay-dots" aria-hidden="true">
            {Array.from({ length: pages }).map((_, idx) => (
              <span
                key={idx}
                className={idx === page ? 'on' : ''}
                onClick={() => go(idx)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
