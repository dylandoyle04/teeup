import { Link, NavLink, useLocation } from 'react-router-dom'
import { useStore } from '../store'

function TripTabs({ tripId }: { tripId: string }) {
  const tabs = [
    { to: `/trip/${tripId}/setup`, label: 'Trip' },
    { to: `/trip/${tripId}/book`, label: 'Book' },
    { to: `/trip/${tripId}/score`, label: 'Scorecard' },
    { to: `/trip/${tripId}/ryder`, label: 'Ryder Cup' },
    { to: `/trip/${tripId}/bets`, label: 'Bets' },
  ]
  return (
    <nav className="top-tabs" aria-label="Trip sections">
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          className={({ isActive }) => (isActive ? 'active' : '')}
        >
          {t.label}
        </NavLink>
      ))}
    </nav>
  )
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  // Layout sits above <Routes>, so derive the trip id from the path directly.
  const tripId = pathname.match(/^\/trip\/([^/]+)/)?.[1]
  const trip = useStore((s) => (tripId ? s.getTrip(tripId) : undefined))

  return (
    <div className="app">
      {!isHome && (
        <header className="navbar">
          <div className="nav-inner">
            <Link to="/" className="brand">
              Flagstick<span className="mark"> Finder</span>
            </Link>
            {tripId ? (
              <TripTabs tripId={tripId} />
            ) : (
              <nav className="top-tabs">
                <NavLink
                  to="/explore"
                  className={({ isActive }) => (isActive ? 'active' : '')}
                >
                  Explore
                </NavLink>
              </nav>
            )}
            {trip && <span className="nav-trip">{trip.name}</span>}
          </div>
        </header>
      )}

      <main className={`content ${isHome ? 'content-home' : ''}`}>
        {!isHome ? <div className="container">{children}</div> : children}
      </main>

      {!isHome && (
        <footer className="footer">
          <div className="footer-inner">
            <Link to="/" className="footer-brand">
              Flagstick<span className="mark"> Finder</span>
            </Link>
            <p className="footer-tag">
              Golf trips made easy — book it, invite friends, keep score.
            </p>
            <div className="footer-links">
              <Link to="/explore">Explore trips</Link>
              <Link to="/new">Create a trip</Link>
              <Link to="/legal">Privacy &amp; Terms</Link>
              <a href="mailto:Flagstickfinder@outlook.com">Contact support</a>
            </div>
            <p className="footer-disclosure">
              Some links on this site are affiliate links — if you book through
              them we may earn a commission, at no extra cost to you.{' '}
              <Link to="/legal">Learn more</Link>.
            </p>
            <p className="footer-copy">© 2026 Flagstick Finder</p>
          </div>
        </footer>
      )}
    </div>
  )
}
