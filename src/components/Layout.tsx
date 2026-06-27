import { Link, NavLink, useLocation, useParams } from 'react-router-dom'

function TripNav({ tripId }: { tripId: string }) {
  const tabs = [
    { to: `/trip/${tripId}/setup`, icon: '🗓️', label: 'Trip' },
    { to: `/trip/${tripId}/vote`, icon: '🗳️', label: 'Vote' },
    { to: `/trip/${tripId}/score`, icon: '⛳', label: 'Score' },
    { to: `/trip/${tripId}/bets`, icon: '💰', label: 'Bets' },
  ]
  return (
    <nav className="bottom-nav" aria-label="Trip sections">
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          className={({ isActive }) => (isActive ? 'active' : '')}
        >
          <span className="icon" aria-hidden>
            {t.icon}
          </span>
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
        <header className="topbar">
          <Link to="/" className="brand">
            Tee<span className="mark">Up</span>
          </Link>
        </header>
      )}
      <main className={`content ${isHome ? 'content-home' : ''}`}>{children}</main>
      {tripId && <TripNav tripId={tripId} />}
    </div>
  )
}
