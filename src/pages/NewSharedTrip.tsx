import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { createSharedTrip, createSharedTripFromPackage } from '../cloud'
import { PACKAGES, type TripPackage } from '../packages'
import { money } from '../components/ui'

export default function NewSharedTrip() {
  const navigate = useNavigate()
  const { ready, user } = useAuth()
  const [name, setName] = useState('')
  const [destination, setDestination] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [custom, setCustom] = useState(false)
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

  async function pick(pkg: TripPackage) {
    if (busy) return
    setBusy(pkg.id)
    setError(null)
    try {
      const trip = await createSharedTripFromPackage(
        pkg.id,
        pkg.destination,
        pkg.title,
      )
      navigate(`/shared/${trip.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the trip.')
      setBusy(null)
    }
  }

  async function createCustom(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || busy) return
    setBusy('custom')
    setError(null)
    try {
      const trip = await createSharedTrip(name, destination)
      navigate(`/shared/${trip.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the trip.')
      setBusy(null)
    }
  }

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Start a shared trip</h1>
        <p className="page-sub">
          Pick the trip you're planning — everyone who joins sees its courses and
          can jump straight into a live scorecard.
        </p>
      </div>

      {error && (
        <p className="hint" style={{ color: '#b3261e', margin: '0 4px 10px' }}>
          {error}
        </p>
      )}

      <div className="pick-grid">
        {PACKAGES.map((p) => (
          <button
            className="pick-card"
            key={p.id}
            onClick={() => pick(p)}
            disabled={!!busy}
          >
            <span
              className="pick-thumb"
              style={{ backgroundImage: `url(${p.image})` }}
              aria-hidden="true"
            />
            <span className="pick-body">
              <span className={`pick-tier ${p.tier}`}>{p.tierLabel}</span>
              <span className="pick-dest">{p.destination.split(',')[0]}</span>
              <span className="pick-meta">
                {p.courses.length} courses · {money(p.budgetMin)}–
                {money(p.budgetMax)}/pp
              </span>
            </span>
            <span className="pick-go" aria-hidden="true">
              {busy === p.id ? '…' : '›'}
            </span>
          </button>
        ))}
      </div>

      <div className="pick-custom">
        {!custom ? (
          <button className="btn ghost" onClick={() => setCustom(true)}>
            Or build a custom trip →
          </button>
        ) : (
          <form className="card" onSubmit={createCustom}>
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
            <button
              className="btn full gold"
              disabled={busy === 'custom' || !name.trim()}
            >
              {busy === 'custom' ? 'Creating…' : 'Create custom trip'}
            </button>
          </form>
        )}
      </div>
    </>
  )
}
