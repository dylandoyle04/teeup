import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { TripPackage } from '../packages'
import { money } from './ui'

/**
 * A trip package card. On hover it cycles through the package's photos
 * (hero + one per course), one every 0.75s, crossfading. Resets to the hero
 * on mouse-out. Falls back to a single static image if there's only one.
 */
export default function PackageCard({
  pkg,
  reveal = false,
}: {
  pkg: TripPackage
  reveal?: boolean
}) {
  const images = useMemo(() => {
    const all = [pkg.image, ...pkg.courses.map((c) => c.images[0])].filter(
      Boolean,
    )
    return Array.from(new Set(all))
  }, [pkg])

  const [idx, setIdx] = useState(0)
  const timer = useRef<number | undefined>(undefined)

  function stop() {
    if (timer.current) {
      clearInterval(timer.current)
      timer.current = undefined
    }
    setIdx(0)
  }

  function start() {
    if (images.length < 2) return
    images.forEach((src) => {
      const img = new Image()
      img.src = src
    })
    if (timer.current) clearInterval(timer.current)
    timer.current = window.setInterval(() => {
      setIdx((i) => (i + 1) % images.length)
    }, 750)
  }

  useEffect(() => () => stop(), [])

  return (
    <Link
      className="slide-card"
      to={`/package/${pkg.id}`}
      onMouseEnter={start}
      onMouseLeave={stop}
      {...(reveal ? { 'data-reveal': true } : {})}
    >
      {images.map((src, i) => (
        <img
          key={src}
          className="slide-bg"
          src={src}
          alt=""
          aria-hidden="true"
          style={{ opacity: i === idx ? 1 : 0 }}
        />
      ))}
      <span className="slide-flag" aria-hidden="true" />
      <span className={`slide-tier ${pkg.tier}`}>{pkg.tierLabel}</span>
      <div className="slide-body">
        <div className="slide-loc">{pkg.region}</div>
        <h3 className="slide-title">{pkg.destination.split(',')[0]}</h3>
        <p className="slide-tag">
          {pkg.courses.length} courses · {money(pkg.budgetMin)}–
          {money(pkg.budgetMax)}/pp
        </p>
      </div>
    </Link>
  )
}
