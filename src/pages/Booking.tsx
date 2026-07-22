import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store'
import { getPackage } from '../packages'
import { getRestaurants, reserveLink, mapsLink } from '../restaurants'
import { hotelsLink, rentalsLink, flightsLink, carsLink } from '../affiliates'

export default function Booking() {
  const { tripId = '' } = useParams()
  const navigate = useNavigate()
  const trip = useStore((s) => s.getTrip(tripId))
  const [hotel, setHotel] = useState('')

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

  const pkg = trip.sourcePackageId ? getPackage(trip.sourcePackageId) : undefined
  const restaurants = getRestaurants(trip.destination)

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
          href={hotelsLink(trip.destination)}
          target="_blank"
          rel="noreferrer noopener"
        >
          🏨 Find hotels on Expedia ↗
        </a>
        <a
          className="book-link"
          href={rentalsLink(trip.destination)}
          target="_blank"
          rel="noreferrer noopener"
        >
          🏠 Find rentals on Vrbo ↗
        </a>
      </div>
      <p className="hint" style={{ margin: '2px 4px 6px' }}>
        Searches {trip.destination || 'the destination'} — or find hotels right
        next to a specific course:
      </p>
      {teeLinks.length > 0 && (
        <div className="near-row">
          {teeLinks.map((c) => (
            <a
              key={c.name}
              className="course-link"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `hotels near ${c.name}, ${trip.destination || ''}`,
              )}`}
              target="_blank"
              rel="noreferrer noopener"
            >
              🏨 {c.name} ↗
            </a>
          ))}
        </div>
      )}

      <div className="section-title">Travel</div>
      <div className="book-row">
        <a
          className="book-link"
          href={flightsLink(trip.destination)}
          target="_blank"
          rel="noreferrer noopener"
        >
          ✈️ Find flights on Expedia ↗
        </a>
        <a
          className="book-link"
          href={carsLink(trip.destination)}
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

      {restaurants.length > 0 && (
        <>
          <div className="section-title">Where to eat</div>
          <p className="hint" style={{ margin: '-4px 4px 8px' }}>
            Highly-rated spots near the courses — a nice night out or a casual
            post-round bite.
          </p>
          <div className="dining-grid">
            {restaurants.map((r) => (
              <div className="dining-card" key={r.name}>
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
                    href={reserveLink(r, trip.destination)}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Reserve on OpenTable ↗
                  </a>
                  <a
                    className="course-link"
                    href={mapsLink(r, trip.destination)}
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

      <div className="section-title">Drive times</div>
      <div className="card">
        <div className="field" style={{ marginBottom: 10 }}>
          <label>Your hotel or rental</label>
          <input
            value={hotel}
            onChange={(e) => setHotel(e.target.value)}
            placeholder="Type your hotel or resort name"
          />
        </div>
        {teeLinks.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            Add courses to the trip to check drive times.
          </p>
        ) : (
          teeLinks.map((c) => {
            const destPlace = encodeURIComponent(
              `${c.name}, ${trip.destination || ''}`,
            )
            const href = hotel.trim()
              ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
                  hotel,
                )}&destination=${destPlace}`
              : `https://www.google.com/maps/search/?api=1&query=${destPlace}`
            return (
              <div className="book-course" key={c.name}>
                <span className="book-course-name">⛳ {c.name}</span>
                <a
                  className="course-link"
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {hotel.trim() ? 'Directions ↗' : 'Map ↗'}
                </a>
              </div>
            )
          })
        )}
        <p className="hint" style={{ margin: '8px 4px 0' }}>
          Opens Google Maps with live traffic time from your place to each
          course.
        </p>
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
