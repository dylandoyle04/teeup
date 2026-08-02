import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth'
import { joinByCode } from '../cloud'

export default function JoinTrip() {
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const { ready, user } = useAuth()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // must be signed in to join — send them to sign in, then back here
  if (ready && !user) {
    return (
      <div className="auth-wrap">
        <div className="card empty">
          <div className="big">⛳</div>
          <p>You've been invited to a golf trip! Sign in to join.</p>
          <Link
            to={`/signin?next=${encodeURIComponent('/join/' + code)}`}
            className="btn full gold"
            style={{ marginTop: 10 }}
          >
            Sign in to join
          </Link>
        </div>
      </div>
    )
  }

  async function join(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const tripId = await joinByCode(code, name || user?.email?.split('@')[0] || 'Player')
      navigate(`/shared/${tripId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join this trip.')
      setBusy(false)
    }
  }

  return (
    <div className="auth-wrap">
      <h1 className="page-title" style={{ textAlign: 'center' }}>
        Join the trip
      </h1>
      <p className="page-sub" style={{ textAlign: 'center' }}>
        You've been invited to a golf trip on Flagstick Finder.
      </p>
      <form className="card" onSubmit={join}>
        <div className="field">
          <label>Your name (how it shows on the scorecard)</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={user?.email?.split('@')[0] ?? 'Your name'}
            autoFocus
          />
        </div>
        {error && (
          <p className="hint" style={{ color: '#b3261e', margin: '0 4px 8px' }}>
            {error}
          </p>
        )}
        <button className="btn full gold" disabled={busy}>
          {busy ? 'Joining…' : 'Join trip'}
        </button>
      </form>
    </div>
  )
}
