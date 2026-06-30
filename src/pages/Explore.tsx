import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { PACKAGES } from '../packages'
import { AvatarStack, fmtDateRange, money } from '../components/ui'

export default function Explore() {
  const trips = useStore((s) => s.trips)
  const tripMembers = useStore((s) => s.tripMembers)
  const resetAll = useStore((s) => s.resetAll)
  const navigate = useNavigate()

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Plan your golf trip</h1>
        <p className="page-sub">
          Start from a curated package or build your own — then invite friends to
          keep score.
        </p>
      </div>

      <h2 className="section-title">Our Preplanned Trips</h2>
      <div className="pkg-grid">
        {PACKAGES.map((p) => (
          <Link className="slide-card" key={p.id} to={`/package/${p.id}`}>
            <img className="slide-bg" src={p.image} alt={p.destination} />
            <span className={`slide-tier ${p.tier}`}>{p.tierLabel}</span>
            <div className="slide-body">
              <div className="slide-loc">{p.region}</div>
              <h3 className="slide-title">{p.destination.split(',')[0]}</h3>
              <p className="slide-tag">
                {p.courses.length} courses · {money(p.budgetMin)}–
                {money(p.budgetMax)}/pp
              </p>
            </div>
          </Link>
        ))}
      </div>

      <h2 className="section-title">Or start from scratch</h2>
      <button className="create-own" onClick={() => navigate('/new')}>
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
          <h2 className="section-title">Your Trips</h2>
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
    </>
  )
}
