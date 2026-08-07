import { useEffect, useState, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../auth'
import { getPackage } from '../packages'
import {
  getSharedTrip,
  listMembers,
  listRounds,
  addRound,
  getOrCreateRound,
  deleteSharedTrip,
  leaveTrip,
  inviteUrl,
  type SharedTrip as Trip,
  type SharedMember,
  type SharedRound,
} from '../cloud'

export default function SharedTrip() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { ready, user } = useAuth()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [members, setMembers] = useState<SharedMember[]>([])
  const [rounds, setRounds] = useState<SharedRound[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [addingRound, setAddingRound] = useState(false)
  const [opening, setOpening] = useState<string | null>(null)

  const reloadMembers = useCallback(() => {
    listMembers(id).then(setMembers)
  }, [id])

  useEffect(() => {
    let alive = true
    Promise.all([getSharedTrip(id), listMembers(id), listRounds(id)]).then(
      ([t, m, r]) => {
        if (!alive) return
        setTrip(t)
        setMembers(m)
        setRounds(r)
        setLoading(false)
      },
    )
    return () => {
      alive = false
    }
  }, [id])

  const isOrganizer = !!(trip && user && trip.organizerId === user.id)
  const pkg = trip?.sourcePackageId ? getPackage(trip.sourcePackageId) : undefined
  const roundByCourse = new Map(rounds.map((r) => [r.courseName, r]))

  async function removeTrip() {
    if (isOrganizer) {
      if (!window.confirm(`Delete "${trip!.name}" for everyone? This can't be undone.`)) return
      await deleteSharedTrip(id)
    } else {
      if (!window.confirm(`Leave "${trip!.name}"? You'll need a new invite to rejoin.`)) return
      await leaveTrip(id)
    }
    navigate('/explore')
  }

  // Tap a course → open (or start) its live scorecard, where you pick the game.
  async function openCourse(courseName: string) {
    if (opening) return
    setOpening(courseName)
    try {
      const r = await getOrCreateRound(id, courseName)
      navigate(`/shared/${id}/round/${r.id}`)
    } catch {
      setOpening(null)
    }
  }

  async function newRound() {
    if (addingRound) return
    const name = window.prompt('Course name for this round?')
    if (name == null) return
    setAddingRound(true)
    try {
      const r = await addRound(id, name)
      navigate(`/shared/${id}/round/${r.id}`)
    } catch {
      setAddingRound(false)
    }
  }

  // live roster: refresh when anyone joins/leaves
  useEffect(() => {
    if (!supabase) return
    const ch = supabase
      .channel(`members-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trip_members', filter: `trip_id=eq.${id}` },
        () => reloadMembers(),
      )
      .subscribe()
    return () => {
      supabase?.removeChannel(ch)
    }
  }, [id, reloadMembers])

  if (ready && !user) {
    return (
      <div className="auth-wrap">
        <div className="card empty">
          <p>Sign in to view this shared trip.</p>
          <Link to="/signin" className="btn full gold" style={{ marginTop: 10 }}>
            Sign in
          </Link>
        </div>
      </div>
    )
  }

  if (loading) return <div className="card empty"><p>Loading…</p></div>

  if (!trip) {
    return (
      <div className="card empty">
        <p>This trip doesn't exist or you're not a member.</p>
        <Link to="/explore" className="btn subtle sm">
          Back to trips
        </Link>
      </div>
    )
  }

  const link = inviteUrl(trip.inviteCode)
  async function copy() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard blocked — the field is selectable as a fallback */
    }
  }

  // Extra rounds that aren't one of the package courses (custom / manually added)
  const extraRounds = pkg
    ? rounds.filter((r) => !pkg.courses.some((c) => c.name === r.courseName))
    : rounds

  return (
    <>
      <div className="trip-hero" style={pkg ? { backgroundImage: `url(${pkg.image})` } : undefined}>
        <div className="trip-hero-body">
          {trip.destination && <span className="trip-hero-loc">{trip.destination}</span>}
          <h1 className="trip-hero-title">{trip.name}</h1>
          <span className="trip-hero-meta">
            {members.length} {members.length === 1 ? 'player' : 'players'}
            {pkg ? ` · ${pkg.courses.length} courses` : ''}
          </span>
        </div>
      </div>

      <div className="section-title">Invite your group</div>
      <div className="card">
        <p className="hint" style={{ marginTop: 0 }}>
          Share this link — anyone who opens it can sign in and join the trip.
        </p>
        <input className="invite-field" value={link} readOnly onFocus={(e) => e.currentTarget.select()} />
        <button className="btn full gold" style={{ marginTop: 10 }} onClick={copy}>
          {copied ? 'Copied ✓' : 'Copy invite link'}
        </button>
      </div>

      {pkg ? (
        <>
          <div className="section-title">Courses</div>
          <p className="hint" style={{ margin: '-4px 4px 10px' }}>
            Tap a course to open its live scorecard and pick how you're playing.
          </p>
          <div className="trip-course-grid">
            {pkg.courses.map((c) => {
              const started = roundByCourse.get(c.name)
              const par = started?.holePars.reduce((a, b) => a + b, 0)
              return (
                <button
                  className="trip-course"
                  key={c.slug}
                  onClick={() => openCourse(c.name)}
                  disabled={!!opening}
                >
                  <span
                    className="trip-course-thumb"
                    style={{ backgroundImage: `url(${c.images[0]})` }}
                    aria-hidden="true"
                  />
                  <span className="trip-course-body">
                    <span className="trip-course-name">{c.name}</span>
                    <span className="trip-course-meta">
                      {started ? `In progress · par ${par}` : 'Tap to start scoring'}
                    </span>
                  </span>
                  <span className={`trip-course-go ${started ? 'live' : ''}`}>
                    {opening === c.name ? '…' : started ? 'Score' : 'Start'}
                  </span>
                </button>
              )
            })}
          </div>
          {extraRounds.length > 0 && (
            <div className="card" style={{ marginTop: 12 }}>
              {extraRounds.map((r) => (
                <Link className="shared-row" to={`/shared/${id}/round/${r.id}`} key={r.id}>
                  <div>
                    <div className="shared-row-name">{r.courseName}</div>
                    <div className="shared-row-dest">Live scorecard · par {r.holePars.reduce((a, b) => a + b, 0)}</div>
                  </div>
                  <span className="shared-row-go">›</span>
                </Link>
              ))}
            </div>
          )}
          <button
            className="btn ghost full"
            style={{ marginTop: 10 }}
            onClick={newRound}
            disabled={addingRound}
          >
            {addingRound ? 'Adding…' : '+ Add another course'}
          </button>
        </>
      ) : (
        <>
          <div className="section-title">Rounds</div>
          <div className="card">
            {rounds.map((r) => (
              <Link className="shared-row" to={`/shared/${id}/round/${r.id}`} key={r.id}>
                <div>
                  <div className="shared-row-name">{r.courseName}</div>
                  <div className="shared-row-dest">Live scorecard · par {r.holePars.reduce((a, b) => a + b, 0)}</div>
                </div>
                <span className="shared-row-go">›</span>
              </Link>
            ))}
            {rounds.length === 0 && (
              <p className="muted" style={{ margin: '0 0 10px' }}>No rounds yet.</p>
            )}
            <button className="btn full gold" onClick={newRound} disabled={addingRound}>
              {addingRound ? 'Adding…' : '+ Add a round'}
            </button>
          </div>
        </>
      )}

      <div className="section-title">Ryder Cup</div>
      <Link className="card shared-row" to={`/shared/${id}/ryder`}>
        <div>
          <div className="shared-row-name">🏆 Ryder Cup</div>
          <div className="shared-row-dest">Two teams, live points across the trip</div>
        </div>
        <span className="shared-row-go">›</span>
      </Link>

      <div className="section-title">
        Players <span className="muted">({members.length})</span>
      </div>
      <div className="card">
        {members.map((m) => (
          <div className="list-row" key={m.id}>
            <span className="dot-avatar" aria-hidden="true">
              {m.name.charAt(0).toUpperCase()}
            </span>
            <span style={{ flex: 1, fontWeight: 700 }}>{m.name}</span>
            {m.isOrganizer && <span className="pill">Organizer</span>}
          </div>
        ))}
        {members.length === 0 && (
          <p className="muted" style={{ margin: 0 }}>No one's joined yet.</p>
        )}
      </div>

      <div className="row between" style={{ marginTop: 16, gap: 10 }}>
        <Link to="/explore" className="btn ghost">
          ← Back to trips
        </Link>
        <button className="btn danger" onClick={removeTrip}>
          {isOrganizer ? 'Delete trip' : 'Leave trip'}
        </button>
      </div>
    </>
  )
}
