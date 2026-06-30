import { Link, NavLink, useLocation, useParams } from 'react-router-dom'

function TripTabs({ tripId }: { tripId: string }) {
  const tabs = [
    { to: `/trip/${tripId}/setup`, label: 'Trip' },
    { to: `/trip/${tripId}/score`, label: 'Scorecard' },
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
  const { tripId } = useParams()
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  return (
    <div className="app">
      {!isHome && (
        <header className="navbar">
          <div className="nav-inner">
            <Link to="/" className="brand">
              Tee<span className="mark">Up</span>
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
          </div>
        </header>
      )}
      <main className={`content ${isHome ? 'content-home' : ''}`}>
        {!isHome ? <div className="container">{children}</div> : children}
      </main>
    </div>
  )
}
