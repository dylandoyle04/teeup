import { useEffect, useState, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../auth'
import {
  getSharedTrip,
  listMembers,
  listRounds,
  addRound,
  inviteUrl,
  type SharedTrip as Trip,
  type SharedMember,
  type SharedRound,
} from '../cloud'
import { useNavigate } from 'react-router-dom'

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

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">{trip.name}</h1>
        {trip.destination && <p className="page-sub">{trip.destination}</p>}
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

      <Link to="/explore" className="btn ghost" style={{ marginTop: 16 }}>
        ← Back to trips
      </Link>
    </>
  )
}
