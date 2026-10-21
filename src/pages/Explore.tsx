import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { PACKAGES } from '../packages'
import { AvatarStack, fmtDateRange, money } from '../components/ui'
import PackageCard from '../components/PackageCard'
import RyderPromo from '../components/RyderPromo'
import NearbySearch from '../components/NearbySearch'
import { fmtMiles, rankDestinations, travelHint, type Place } from '../nearby'

const NEAR_KEY = 'ff-near'

function loadNear(): Place | null {
  try {
    const v = JSON.parse(localStorage.getItem(NEAR_KEY) ?? 'null')
    return v && typeof v.lat === 'number' && typeof v.lon === 'number' ? v : null
  } catch {
    return null
  }
}
import { gsap, reduceMotion, revealOnScroll } from '../anim'

export default function Explore() {
  const trips = useStore((s) => s.trips)
  const tripMembers = useStore((s) => s.tripMembers)
  const resetAll = useStore((s) => s.resetAll)
  const navigate = useNavigate()
  const root = useRef<HTMLDivElement>(null)
  const [near, setNearState] = useState<Place | null>(loadNear)

  function setNear(p: Place | null) {
    setNearState(p)
    try {
      if (p) localStorage.setItem(NEAR_KEY, JSON.stringify(p))
      else localStorage.removeItem(NEAR_KEY)
    } catch {
      /* private mode — just don't remember */
    }
  }

  // nearest destinations first (stable within a destination), with a label
  const { packages, distanceOf } = useMemo(() => {
    if (!near) return { packages: PACKAGES, distanceOf: () => undefined }
    const ranked = rankDestinations(near)
    const rank = new Map(ranked.map((r, i) => [r.destination, i]))
    const miles = new Map(ranked.map((r) => [r.destination, r.miles]))
    return {
      packages: [...PACKAGES].sort(
        (a, b) => (rank.get(a.destination) ?? 99) - (rank.get(b.destination) ?? 99),
      ),
      distanceOf: (dest: string) => {
        const m = miles.get(dest)
        return m == null ? undefined : `${fmtMiles(m)} · ${travelHint(m)}`
      },
    }
  }, [near])

  useLayoutEffect(() => {
    if (reduceMotion()) return
    const ctx = gsap.context(() => revealOnScroll(root.current), root)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={root}>
      <div className="page-head" data-reveal>
        <h1 className="page-title">Plan your golf trip</h1>
        <p className="page-sub">
          Start from a curated package or build your own — then invite friends to
          keep score.
        </p>
      </div>

      <RyderPromo />

      <NearbySearch value={near} onChange={setNear} />

      <h2 className="section-title explore-h2" data-reveal>
        {near ? 'Trips closest to you' : 'Our Preplanned Trips'}
      </h2>
      <div className="pkg-grid">
        {packages.map((p) => (
          <PackageCard key={p.id} pkg={p} distance={distanceOf(p.destination)} reveal />
        ))}
      </div>

      <h2 className="section-title explore-h2" data-reveal>
        Or start from scratch
      </h2>
      <button
        className="create-own"
        onClick={() => navigate('/new')}
        data-reveal
      >
        <span className="co-icon" aria-hidden="true">
          ⛳
        </span>
        <span className="co-text">
          <span className="co-title">Create your own</span>
          <span className="co-sub">
            Build a custom trip and invite friends to keep score.
          </span>
        </span>
        <span className="co-arrow" aria-hidden="true">
          →
        </span>
      </button>

      {trips.length > 0 && (
        <>
          <h2 className="section-title explore-h2" data-reveal>
            Your Trips
          </h2>
          <div className="pkg-grid">
            {[...trips]
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((trip) => {
                const members = tripMembers(trip.id)
                return (
                  <Link
                    key={trip.id}
                    to={`/trip/${trip.id}/setup`}
                    className="trip-card"
                    data-reveal
                  >
                    <div className="banner">
                      <h3>{trip.name}</h3>
                      <div className="where">
                        📍 {trip.destination || 'Destination TBD'} ·{' '}
                        {fmtDateRange(trip.startDate, trip.endDate)}
                      </div>
                    </div>
                    <div className="meta">
                      <div className="row">
                        <AvatarStack members={members} />
                        <span className="muted" style={{ fontSize: 13 }}>
                          {members.length}{' '}
                          {members.length === 1 ? 'player' : 'players'}
                        </span>
                      </div>
                      <span className="pill gold">
                        {money(trip.budgetMin)}–{money(trip.budgetMax)}/pp
                      </span>
                    </div>
                  </Link>
                )
              })}
          </div>
        </>
      )}

      <div style={{ marginTop: 32, textAlign: 'center' }}>
        <button
          className="btn sm subtle"
          onClick={() => {
            if (confirm('Reset all local data back to the sample trip?'))
              resetAll()
          }}
        >
          Reset demo data
        </button>
      </div>
    </div>
  )
}
