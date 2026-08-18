import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store'
import type { HotelTier } from '../types'
import { Avatar, Toggle, fmtDateRange, money } from '../components/ui'
import { hasBackend } from '../supabase'
import { useAuth } from '../auth'
import { getPackage } from '../packages'
import {
  createSharedTrip,
  createSharedTripFromPackage,
  inviteUrl,
} from '../cloud'

const TIERS: { value: HotelTier; label: string }[] = [
  { value: 'budget', label: 'Budget' },
  { value: 'midrange', label: 'Mid-range' },
  { value: 'luxury', label: 'Luxury' },
]

export default function TripSetup() {
  const { tripId = '' } = useParams()
  const navigate = useNavigate()
  const trip = useStore((s) => s.getTrip(tripId))
  const members = useStore((s) => s.tripMembers(tripId))
  const currentMemberId = useStore((s) => s.currentMemberId)
  const addMember = useStore((s) => s.addMember)
  const removeMember = useStore((s) => s.removeMember)
  const updateTrip = useStore((s) => s.updateTrip)
  const deleteTrip = useStore((s) => s.deleteTrip)

  const { user } = useAuth()
  const [newName, setNewName] = useState('')
  const [editing, setEditing] = useState(false)
  const [shareBusy, setShareBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [shareCode, setShareCode] = useState<string | undefined>(
    trip?.sharedCode,
  )

  async function share() {
    if (shareBusy || !trip) return
    setShareBusy(true)
    try {
      const pkg = trip.sourcePackageId
        ? getPackage(trip.sourcePackageId)
        : undefined
      const st = pkg
        ? await createSharedTripFromPackage(pkg.id, pkg.destination, trip.name)
        : await createSharedTrip(trip.name, trip.destination)
      updateTrip(tripId, { sharedId: st.id, sharedCode: st.inviteCode })
      setShareCode(st.inviteCode)
    } catch {
      /* leave the button so they can retry */
    } finally {
      setShareBusy(false)
    }
  }

  async function copyLink() {
    if (!shareCode) return
    try {
      await navigator.clipboard.writeText(inviteUrl(shareCode))
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard blocked — field is selectable */
    }
  }

  if (!trip) {
    return (
      <div className="empty card">
        <p>That trip doesn't exist.</p>
        <Link to="/" className="btn subtle sm">
          Back to trips
        </Link>
      </div>
    )
  }

  const tierLabel =
    TIERS.find((t) => t.value === trip.hotelTier)?.label ?? 'Mid-range'

  return (
    <>
      <button className="back-btn" onClick={() => navigate('/explore')}>
        ← All trips
      </button>

      {/* Trip header / organizer setup */}
      <div className="card" style={{ marginTop: 12 }}>
        <div className="row between">
          <h1 className="page-title" style={{ margin: 0 }}>
            {trip.name}
          </h1>
          <button
            className="btn sm subtle"
            onClick={() => setEditing((v) => !v)}
          >
            {editing ? '✓ Done' : '✏️ Edit'}
          </button>
        </div>

        {!editing ? (
          <div className="stack" style={{ marginTop: 10 }}>
            <div className="muted">
              📍 {trip.destination || 'Destination TBD'}
            </div>
            <div className="muted">
              🗓️ {fmtDateRange(trip.startDate, trip.endDate)}
            </div>
            <div className="tag-cluster">
              <span className="pill gold">
                {money(trip.budgetMin)}–{money(trip.budgetMax)}/pp
              </span>
              <span className="pill">🏨 {tierLabel}</span>
              <span className={`pill ${trip.needsFlights ? 'gold' : 'gray'}`}>
                ✈️ {trip.needsFlights ? 'Flights needed' : 'Driving'}
              </span>
            </div>
            {trip.notes && (
              <p className="muted" style={{ margin: '4px 0 0', fontSize: 14 }}>
                “{trip.notes}”
              </p>
            )}
          </div>
        ) : (
          <div style={{ marginTop: 12 }}>
            <div className="field">
              <label>Trip name</label>
              <input
                value={trip.name}
                onChange={(e) => updateTrip(tripId, { name: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Destination</label>
              <input
                value={trip.destination}
                onChange={(e) =>
                  updateTrip(tripId, { destination: e.target.value })
                }
              />
            </div>
            <div className="two-col">
              <div className="field">
                <label>Start</label>
                <input
                  type="date"
                  value={trip.startDate}
                  onChange={(e) =>
                    updateTrip(tripId, { startDate: e.target.value })
                  }
                />
              </div>
              <div className="field">
                <label>End</label>
                <input
                  type="date"
                  value={trip.endDate}
                  onChange={(e) =>
                    updateTrip(tripId, { endDate: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="two-col">
              <div className="field">
                <label>Budget min</label>
                <input
                  type="number"
                  value={trip.budgetMin}
                  onChange={(e) =>
                    updateTrip(tripId, { budgetMin: Number(e.target.value) })
                  }
                />
              </div>
              <div className="field">
                <label>Budget max</label>
                <input
                  type="number"
                  value={trip.budgetMax}
                  onChange={(e) =>
                    updateTrip(tripId, { budgetMax: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="field">
              <label>Hotel preference</label>
              <div className="seg" style={{ marginBottom: 0 }}>
                {TIERS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    className={trip.hotelTier === t.value ? 'on' : ''}
                    onClick={() => updateTrip(tripId, { hotelTier: t.value })}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="toggle-row">
              <div>
                <div style={{ fontWeight: 700 }}>Need flights?</div>
                <div className="hint">Driving in? Leave this off.</div>
              </div>
              <Toggle
                on={trip.needsFlights}
                onChange={(v) => updateTrip(tripId, { needsFlights: v })}
                label="Need flights"
              />
            </div>
            <div className="field">
              <label>Notes for the group</label>
              <textarea
                rows={2}
                value={trip.notes}
                onChange={(e) => updateTrip(tripId, { notes: e.target.value })}
                placeholder="Travel plan, must-play course, anything to flag…"
              />
            </div>
          </div>
        )}
      </div>

      {/* Members */}
      <div className="section-title">The Group · {members.length}</div>
      <div className="card">
        {members.map((m) => (
          <div className="list-row" key={m.id}>
            <Avatar member={m} />
            <span style={{ flex: 1, fontWeight: 700 }}>
              {m.name}
              {m.id === trip.organizerId && (
                <span className="pill gold" style={{ marginLeft: 8 }}>
                  organizer
                </span>
              )}
              {m.id === currentMemberId && m.id !== trip.organizerId && (
                <span className="pill gray" style={{ marginLeft: 8 }}>
                  you
                </span>
              )}
            </span>
            {members.length > 1 && m.id !== trip.organizerId && (
              <button
                className="icon-btn"
                aria-label={`Remove ${m.name}`}
                onClick={() => removeMember(tripId, m.id)}
              >
                ✕
              </button>
            )}
          </div>
        ))}

        <div className="row" style={{ marginTop: 12 }}>
          <input
            style={{
              border: '1.5px solid var(--line)',
              borderRadius: 10,
              padding: '11px 12px',
              flex: 1,
            }}
            placeholder="Invite a buddy by name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                addMember(tripId, newName)
                setNewName('')
              }
            }}
          />
          <button
            className="btn sm"
            onClick={() => {
              addMember(tripId, newName)
              setNewName('')
            }}
          >
            Add
          </button>
        </div>
        <p className="hint" style={{ marginTop: 8 }}>
          Add names to keep score on this phone — or share the trip link below so
          friends join and score from their own.
        </p>

        {hasBackend && (
          <div
            style={{
              marginTop: 14,
              borderTop: '1px solid var(--line)',
              paddingTop: 14,
            }}
          >
            <strong style={{ display: 'block', marginBottom: 6 }}>
              🔗 Share the trip link
            </strong>
            {!user ? (
              <p className="hint" style={{ margin: 0 }}>
                <Link
                  to={`/signin?next=${encodeURIComponent(
                    `/trip/${tripId}/setup`,
                  )}`}
                >
                  Sign in
                </Link>{' '}
                to get a link friends can open to join the live scorecard.
              </p>
            ) : shareCode ? (
              <>
                <input
                  className="invite-field"
                  value={inviteUrl(shareCode)}
                  readOnly
                  onFocus={(e) => e.currentTarget.select()}
                />
                <button
                  className="btn full gold"
                  style={{ marginTop: 10 }}
                  onClick={copyLink}
                >
                  {copied ? 'Copied ✓' : 'Copy invite link'}
                </button>
              </>
            ) : (
              <button
                className="btn full gold"
                onClick={share}
                disabled={shareBusy}
              >
                {shareBusy ? 'Creating link…' : 'Create a shareable link'}
              </button>
            )}
          </div>
        )}
      </div>

      <Link
        to={`/trip/${tripId}/score`}
        className="btn full gold"
        style={{ marginTop: 4 }}
      >
        Go to the scorecard →
      </Link>

      <button
        className="btn full ghost"
        style={{ marginTop: 10 }}
        onClick={() => navigate('/explore')}
      >
        ← Back to all trips
      </button>

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <button
          className="btn sm danger"
          onClick={() => {
            if (confirm(`Delete "${trip.name}"? This can't be undone.`)) {
              deleteTrip(tripId)
              navigate('/explore')
            }
          }}
        >
          Delete trip
        </button>
      </div>
    </>
  )
}
