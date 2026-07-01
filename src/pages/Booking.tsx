import { Link, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store'
import { getPackage } from '../packages'

export default function Booking() {
  const { tripId = '' } = useParams()
  const navigate = useNavigate()
  const trip = useStore((s) => s.getTrip(tripId))

  if (!trip) {
    return (
      <div className="empty card">
        <p>That trip doesn't exist.</p>
        <Link to="/explore" className="btn subtle sm">
          Back to trips
        </Link>
      </div>
    )
  }

  const dest = encodeURIComponent(trip.destination || '')
  const pkg = trip.sourcePackageId ? getPackage(trip.sourcePackageId) : undefined

  // tee-time links: prefer the package's per-course GolfNow/website links,
  // otherwise fall back to a GolfNow search for each course on the trip.
  const teeLinks = pkg
    ? pkg.courses.map((c) => ({
        name: c.name,
        href:
          c.golfNow ??
          c.website ??
          `https://www.golfnow.com/tee-times/search?q=${encodeURIComponent(
            c.name,
          )}`,
        golfNow: Boolean(c.golfNow),
      }))
    : trip.courses.map((c) => ({
        name: c.name,
        href: `https://www.golfnow.com/tee-times/search?q=${encodeURIComponent(
          c.name,
        )}`,
        golfNow: true,
      }))

  return (
    <>
      <button className="back-btn" onClick={() => navigate('/explore')}>
        ← All trips
      </button>

      <div className="page-head" style={{ marginTop: 12 }}>
        <h1 className="page-title">Book your trip</h1>
        <p className="page-sub">
          {trip.name}
          {trip.destination ? ` · ${trip.destination}` : ''} — book your stay,
          travel, and tee times, then head to the scorecard.
        </p>
      </div>

      <div className="section-title">Stay</div>
      <div className="book-row">
        <a
          className="book-link"
          href={`https://www.expedia.com/Hotel-Search?destination=${dest}`}
          target="_blank"
          rel="noreferrer noopener"
        >
          🏨 Find hotels on Expedia ↗
        </a>
      </div>

      <div className="section-title">Travel</div>
      <div className="book-row">
        <a
          className="book-link"
          href={`https://www.expedia.com/Flights-Search?leg1=to:${dest}`}
          target="_blank"
          rel="noreferrer noopener"
        >
          ✈️ Find flights on Expedia ↗
        </a>
        <a
          className="book-link"
          href={`https://www.expedia.com/Carrentals`}
          target="_blank"
          rel="noreferrer noopener"
        >
          🚗 Rental cars on Expedia ↗
        </a>
      </div>

      <div className="section-title">Tee times</div>
      <div className="card">
        {teeLinks.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            No courses on this trip yet.
          </p>
        ) : (
          teeLinks.map((c) => (
            <div className="book-course" key={c.name}>
              <span className="book-course-name">⛳ {c.name}</span>
              <a
                className={`course-link ${c.golfNow ? 'gn' : ''}`}
                href={c.href}
                target="_blank"
                rel="noreferrer noopener"
              >
                {c.golfNow ? 'GolfNow ↗' : 'Website ↗'}
              </a>
            </div>
          ))
        )}
      </div>

      <Link
        to={`/trip/${tripId}/setup`}
        className="btn full gold"
        style={{ marginTop: 6 }}
      >
        Continue to trip setup →
      </Link>
    </>
  )
}
