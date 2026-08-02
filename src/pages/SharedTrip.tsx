import { useEffect, useState, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../auth'
import {
  getSharedTrip,
  listMembers,
  inviteUrl,
  type SharedTrip as Trip,
  type SharedMember,
} from '../cloud'

export default function SharedTrip() {
  const { id = '' } = useParams()
  const { ready, user } = useAuth()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [members, setMembers] = useState<SharedMember[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const reloadMembers = useCallback(() => {
    listMembers(id).then(setMembers)
  }, [id])

  useEffect(() => {
    let alive = true
    Promise.all([getSharedTrip(id), listMembers(id)]).then(([t, m]) => {
      if (!alive) return
      setTrip(t)
      setMembers(m)
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [id])

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
