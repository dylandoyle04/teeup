import { useLayoutEffect, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store'
import { getPackage } from '../packages'
import { getRestaurants, reserveLink, mapsLink } from '../restaurants'
import { money } from '../components/ui'
import Carousel from '../components/Carousel'
import { gsap, reduceMotion, revealOnScroll } from '../anim'

export default function PackageDetail() {
  const { packageId = '' } = useParams()
  const navigate = useNavigate()
  const pkg = getPackage(packageId)
  const createTripFromPackage = useStore((s) => s.createTripFromPackage)
  const root = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!pkg || reduceMotion()) return
    const ctx = gsap.context(() => {
      gsap.from('.pkg-hero-text > *', {
        y: 24,
        autoAlpha: 0,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.12,
        delay: 0.15,
      })
      gsap.from('.pkg-hero-img', {
        scale: 1.12,
        duration: 1.6,
        ease: 'power2.out',
      })
      revealOnScroll(root.current)
    }, root)
    return () => ctx.revert()
  }, [pkg?.id])

  if (!pkg) {
    return (
      <div className="empty card">
        <p>That package doesn't exist.</p>
        <Link to="/" className="btn subtle sm">
          Back to menu
        </Link>
      </div>
    )
  }

  function startTrip() {
    const id = createTripFromPackage(pkg!)
    navigate(`/trip/${id}/book`)
  }

  const restaurants = getRestaurants(pkg.destination)

  return (
    <div className="pkg" ref={root}>
      <div className="pkg-hero">
        <img className="pkg-hero-img" src={pkg.image} alt={pkg.destination} />
        <div className="pkg-hero-scrim" />
        <button className="pkg-back" onClick={() => navigate('/explore')}>
          ← All trips
        </button>
        <div className="pkg-hero-text">
          <span className={`tier-badge ${pkg.tier}`}>{pkg.tierLabel}</span>
          <div className="pkg-loc">{pkg.region}</div>
          <h1 className="pkg-title">{pkg.title}</h1>
          <div className="pkg-meta">
            <span>📍 {pkg.destination}</span>
            <span>⛳ {pkg.courses.length} courses</span>
            <span>
              {money(pkg.budgetMin)}–{money(pkg.budgetMax)}/pp
            </span>
          </div>
        </div>
      </div>

      <div className="pkg-body">
        <p className="pkg-blurb" data-reveal>
          {pkg.blurb}
        </p>

        <button className="btn full gold" onClick={startTrip} data-reveal>
          Start a trip from this package →
        </button>
        <p className="hint" style={{ textAlign: 'center', marginTop: 8 }}>
          Opens a booking page with hotel, flight, and tee-time links for these
          courses.
        </p>

        <div className="section-title">The Courses</div>
        <div className="courses-grid">
          {pkg.courses.map((c) => (
            <div className="course-card" key={c.name} data-reveal>
              <Carousel images={c.images} alt={c.name} />
              <div className="course-info">
                <h3 className="course-name">{c.name}</h3>
                <p className="course-blurb">{c.blurb}</p>
                {c.golfNow ? (
                  <div className="course-links">
                    <a
                      className="course-link gn"
                      href={c.golfNow}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      Tee times on GolfNow ↗
                    </a>
                  </div>
                ) : c.website ? (
                  <div className="course-links">
                    <a
                      className="course-link"
                      href={c.website}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      Visit course website ↗
                    </a>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {restaurants.length > 0 && (
          <>
            <div className="section-title">Where to Eat</div>
            <p className="hint" style={{ marginTop: -6, marginBottom: 4 }}>
              Highly-rated spots near the courses — from a nice night out to a
              casual post-round bite.
            </p>
            <div className="dining-grid">
              {restaurants.map((r) => (
                <div className="dining-card" key={r.name} data-reveal>
                  <div className="dining-top">
                    <h3 className="dining-name">{r.name}</h3>
                    <span className="dining-rating">★ {r.rating}</span>
                  </div>
                  <div className="dining-sub">
                    <span className="dining-price">{r.price}</span>
                    <span className="dining-dot">·</span>
                    <span>{r.cuisine}</span>
                    <span className="dining-dot">·</span>
                    <span>{r.area}</span>
                  </div>
                  <p className="dining-note">{r.note}</p>
                  <div className="dining-links">
                    <a
                      className="course-link gn"
                      href={reserveLink(r, pkg.destination)}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      Reserve on OpenTable ↗
                    </a>
                    <a
                      className="course-link"
                      href={mapsLink(r, pkg.destination)}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      Map ↗
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <button
          className="btn ghost"
          style={{ marginTop: 18 }}
          onClick={() => navigate('/explore')}
        >
          ← Back to all trips
        </button>
      </div>
    </div>
  )
}
