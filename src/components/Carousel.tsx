import { useRef, useState } from 'react'

export default function Carousel({
  images,
  alt,
  heightClass = 'course-img',
}: {
  images: string[]
  alt: string
  heightClass?: string
}) {
  const [i, setI] = useState(0)
  const touchX = useRef<number | null>(null)

  if (images.length === 0)
    return (
      <div className={`${heightClass} carousel-empty`} aria-label={alt}>
        <span aria-hidden="true">⛳</span>
      </div>
    )

  const go = (dir: number) =>
    setI((prev) => (prev + dir + images.length) % images.length)

  return (
    <div
      className="carousel"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current == null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        if (dx > 40) go(-1)
        else if (dx < -40) go(1)
        touchX.current = null
      }}
    >
      <img className={heightClass} src={images[i]} alt={alt} loading="lazy" />

      {images.length > 1 && (
        <>
          <button
            className="carousel-arrow left"
            aria-label="Previous photo"
            onClick={() => go(-1)}
          >
            ‹
          </button>
          <button
            className="carousel-arrow right"
            aria-label="Next photo"
            onClick={() => go(1)}
          >
            ›
          </button>
          <span className="carousel-count">
            {i + 1}/{images.length}
          </span>
          <div className="carousel-dots">
            {images.map((_, d) => (
              <button
                key={d}
                className={`dot ${d === i ? 'on' : ''}`}
                aria-label={`Photo ${d + 1}`}
                onClick={() => setI(d)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
