import { Link, NavLink, useLocation } from 'react-router-dom'
import { useStore } from '../store'
import { hasBackend } from '../supabase'
import { useAuth } from '../auth'
import ExpediaBadge from './ExpediaBadge'

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

function AccountLink() {
  const { user } = useAuth()
  return <Link to="/signin">{user ? 'Account' : 'Sign in'}</Link>
}

function NavAccountLabel() {
  const { user } = useAuth()
  return <>{user ? 'Account' : 'Sign in'}</>
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  // Layout sits above <Routes>, so derive the trip id from the path directly.
  const tripId = pathname.match(/^\/trip\/([^/]+)/)?.[1]
  const trip = useStore((s) => (tripId ? s.getTrip(tripId) : undefined))

  return (
    <div className="app">
      {/* waving-flag clip used to shape the trip cards */}
      <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
        <defs>
          <clipPath id="flag-wave" clipPathUnits="objectBoundingBox">
            <path
              d="M0,0.05
                 C0.25,-0.01 0.25,0.11 0.5,0.05
                 C0.75,-0.01 0.75,0.11 1,0.05
                 L1,0.95
                 C0.75,1.01 0.75,0.89 0.5,0.95
                 C0.25,1.01 0.25,0.89 0,0.95
                 Z"
            />
          </clipPath>
        </defs>
      </svg>
      {!isHome && (
        <header className="navbar">
          <div className="nav-inner">
            {!tripId && <ExpediaBadge className="nav-expedia" />}
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
                {hasBackend && (
                  <NavLink
                    to="/trips"
                    className={({ isActive }) => (isActive ? 'active' : '')}
                  >
                    My Trips
                  </NavLink>
                )}
                {hasBackend && (
                  <NavLink
                    to="/signin"
                    className={({ isActive }) => (isActive ? 'active' : '')}
                  >
                    <NavAccountLabel />
                  </NavLink>
                )}
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
              {hasBackend && <AccountLink />}
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
