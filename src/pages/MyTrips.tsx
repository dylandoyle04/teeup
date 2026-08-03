import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { hasBackend } from '../supabase'
import { useAuth } from '../auth'
import { listMyTrips, type SharedTrip } from '../cloud'

export default function MyTrips() {
  const { ready, user } = useAuth()
  const [trips, setTrips] = useState<SharedTrip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      listMyTrips().then((t) => {
        setTrips(t)
        setLoading(false)
      })
    } else {
      setTrips([])
      setLoading(false)
    }
  }, [user])

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">My Trips</h1>
        <p className="page-sub">
          Trips you've created or joined — invite friends and keep score together.
        </p>
      </div>

      {!hasBackend ? (
        <div className="card empty">
          <p>Shared trips aren't available in this build.</p>
        </div>
      ) : ready && !user ? (
        <div className="card empty">
          <div className="big">⛳</div>
          <p>Sign in to create a trip your friends can join and score together.</p>
          <Link to="/signin" className="btn full gold" style={{ marginTop: 10 }}>
            Sign in
          </Link>
        </div>
      ) : (
        <>
          {loading ? (
            <div className="card empty"><p>Loading…</p></div>
          ) : (
            <>
              {trips.map((t) => (
                <Link className="card shared-row" to={`/shared/${t.id}`} key={t.id}>
                  <div>
                    <div className="shared-row-name">{t.name}</div>
                    {t.destination && (
                      <div className="shared-row-dest">{t.destination}</div>
                    )}
                  </div>
                  <span className="shared-row-go">›</span>
                </Link>
              ))}
              {trips.length === 0 && (
                <div className="card empty">
                  <p>No trips yet — create one to get started.</p>
                </div>
              )}
              <Link to="/shared/new" className="btn full gold" style={{ marginTop: trips.length ? 6 : 4 }}>
                + New shared trip
              </Link>
            </>
          )}
        </>
      )}
    </>
  )
}
