import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store'
import type { HotelTier } from '../types'
import { Avatar, Toggle, fmtDateRange, money } from '../components/ui'

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

  const [newName, setNewName] = useState('')
  const [editing, setEditing] = useState(false)

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
      <button className="back-btn" onClick={() => navigate('/')}>
        ← Back to menu
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
          You set the trip up; everyone you invite gets to vote on courses, tee
          times, hotels, and flights.
        </p>
      </div>

      <Link
        to={`/trip/${tripId}/vote`}
        className="btn full gold"
        style={{ marginTop: 4 }}
      >
        Invite the group to vote →
      </Link>

      <button
        className="btn full ghost"
        style={{ marginTop: 10 }}
        onClick={() => navigate('/')}
      >
        ← Back to menu
      </button>

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <button
          className="btn sm danger"
          onClick={() => {
            if (confirm(`Delete "${trip.name}"? This can't be undone.`)) {
              deleteTrip(tripId)
              navigate('/')
            }
          }}
        >
          Delete trip
        </button>
      </div>
    </>
  )
}
