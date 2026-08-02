import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { createSharedTrip } from '../cloud'

export default function NewSharedTrip() {
  const navigate = useNavigate()
  const { ready, user } = useAuth()
  const [name, setName] = useState('')
  const [destination, setDestination] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (ready && !user) {
    return (
      <div className="auth-wrap">
        <div className="card empty">
          <p>Sign in to create a shared trip your friends can join.</p>
          <Link
            to={`/signin?next=${encodeURIComponent('/shared/new')}`}
            className="btn full gold"
            style={{ marginTop: 10 }}
          >
            Sign in
          </Link>
        </div>
      </div>
    )
  }

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      const trip = await createSharedTrip(name, destination)
      navigate(`/shared/${trip.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the trip.')
      setBusy(false)
    }
  }

  return (
    <div className="auth-wrap">
      <h1 className="page-title" style={{ textAlign: 'center' }}>
        New shared trip
      </h1>
      <p className="page-sub" style={{ textAlign: 'center' }}>
        Create a trip, then invite your group with a link.
      </p>
      <form className="card" onSubmit={create}>
        <div className="field">
          <label>Trip name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Myrtle Beach Buddies Trip"
            autoFocus
          />
        </div>
        <div className="field">
          <label>Destination (optional)</label>
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="e.g. Myrtle Beach, SC"
          />
        </div>
        {error && (
          <p className="hint" style={{ color: '#b3261e', margin: '0 4px 8px' }}>
            {error}
          </p>
        )}
        <button className="btn full gold" disabled={busy || !name.trim()}>
          {busy ? 'Creating…' : 'Create trip'}
        </button>
      </form>
    </div>
  )
}
