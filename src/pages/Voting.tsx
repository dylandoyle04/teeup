import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../store'
import type { HotelTier, ID, VoteCategory } from '../types'
import { AvatarStack, money } from '../components/ui'

type Tab = VoteCategory

const TABS: { key: Tab; label: string }[] = [
  { key: 'course', label: '⛳ Courses' },
  { key: 'teeTime', label: '🕐 Tee Times' },
  { key: 'hotel', label: '🏨 Hotels' },
  { key: 'flight', label: '✈️ Flights' },
]

export default function Voting() {
  const { tripId = '' } = useParams()
  const trip = useStore((s) => s.getTrip(tripId))
  const members = useStore((s) => s.tripMembers(tripId))
  const currentMemberId = useStore((s) => s.currentMemberId)
  const toggleVote = useStore((s) => s.toggleVote)
  const [tab, setTab] = useState<Tab>('course')

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

  const memberById = new Map(members.map((m) => [m.id, m]))

  // Build the option list for the active tab
  type Opt = {
    id: ID
    name: string
    meta: string
    right?: string
  }
  let options: Opt[] = []
  if (tab === 'course') {
    options = trip.courses.map((c) => ({
      id: c.id,
      name: c.name,
      meta: `${c.location} · Par ${c.par} · ★${c.rating}`,
      right: money(c.greenFee),
    }))
  } else if (tab === 'teeTime') {
    options = trip.courses.flatMap((c) =>
      c.teeTimes.map((time) => ({
        id: `${c.id}__${time}`,
        name: time,
        meta: c.name,
      })),
    )
  } else if (tab === 'hotel') {
    options = trip.hotels.map((h) => {
      const drives = trip.courses
        .map((c) => h.driveTimes[c.id])
        .filter((n) => typeof n === 'number')
      const avg =
        drives.length > 0
          ? Math.round(drives.reduce((a, b) => a + b, 0) / drives.length)
          : null
      return {
        id: h.id,
        name: h.name,
        meta:
          `${cap(h.tier)} · ★${h.rating}` +
          (avg !== null ? ` · ~${avg} min to courses` : ''),
        right: money(h.pricePerNight) + '/nt',
      }
    })
  } else {
    options = trip.flights.map((f) => ({
      id: f.id,
      name: f.airline,
      meta: `${f.depart} → ${f.arrive} · ${
        f.stops === 0 ? 'Nonstop' : `${f.stops} stop${f.stops > 1 ? 's' : ''}`
      }`,
      right: money(f.price),
    }))
  }

  const tally = trip.votes[tab]
  const maxVotes = Math.max(
    0,
    ...options.map((o) => (tally[o.id]?.length ?? 0)),
  )

  return (
    <>
      <h1 className="page-title">Group Voting</h1>
      <p className="page-sub">
        Everyone gets a say. Tap to cast your vote as{' '}
        <strong>{memberById.get(currentMemberId)?.name ?? 'you'}</strong>.
      </p>

      <div className="seg">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={tab === t.key ? 'on' : ''}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <PartnerNote tab={tab} destination={trip.destination} />

      {options.length === 0 ? (
        <div className="card empty">
          <div className="big">🤔</div>
          <p>No options yet. Add a few candidates for the group to vote on.</p>
        </div>
      ) : (
        options.map((o) => {
          const voters = tally[o.id] ?? []
          const count = voters.length
          const mine = voters.includes(currentMemberId)
          const leading = count > 0 && count === maxVotes
          const pct = members.length ? (count / members.length) * 100 : 0
          const voterMembers = voters
            .map((id) => memberById.get(id))
            .filter((m): m is NonNullable<typeof m> => Boolean(m))
          return (
            <div
              key={o.id}
              className={`option ${mine ? 'voted' : ''} ${
                leading ? 'leading' : ''
              }`}
            >
              <div className="opt-head">
                <div>
                  <div className="opt-name">
                    {o.name}{' '}
                    {leading && <span className="pill gold">Leading</span>}
                  </div>
                  <div className="opt-meta">{o.meta}</div>
                </div>
                {o.right && <div className="pill gray">{o.right}</div>}
              </div>
              <div className="vote-bar">
                <span style={{ width: `${pct}%` }} />
              </div>
              <div className="vote-foot">
                <div className="row" style={{ gap: 8 }}>
                  {count > 0 ? (
                    <AvatarStack members={voterMembers} />
                  ) : (
                    <span className="muted" style={{ fontSize: 13 }}>
                      No votes yet
                    </span>
                  )}
                  {count > 0 && (
                    <span className="muted" style={{ fontSize: 13 }}>
                      {count}/{members.length}
                    </span>
                  )}
                </div>
                <button
                  className={`vote-btn ${mine ? 'on' : ''}`}
                  onClick={() =>
                    toggleVote(tripId, tab, o.id, currentMemberId)
                  }
                >
                  {mine ? '✓ Voted' : 'Vote'}
                </button>
              </div>
            </div>
          )
        })
      )}

      {tab !== 'teeTime' && <AddOption tripId={tripId} tab={tab} />}

      <Link to={`/trip/${tripId}/score`} className="btn full gold" style={{ marginTop: 8 }}>
        On to the scorecard →
      </Link>
    </>
  )
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function PartnerNote({ tab, destination }: { tab: Tab; destination: string }) {
  const dest = encodeURIComponent(destination || 'golf')
  const links: Record<Tab, { label: string; href: string }> = {
    course: {
      label: 'Browse tee times on GolfNow',
      href: `https://www.golfnow.com/tee-times/search?q=${dest}`,
    },
    teeTime: {
      label: 'Browse tee times on GolfNow',
      href: `https://www.golfnow.com/tee-times/search?q=${dest}`,
    },
    hotel: {
      label: 'Find hotels on Expedia',
      href: `https://www.expedia.com/Hotel-Search?destination=${dest}`,
    },
    flight: {
      label: 'Find flights on Expedia',
      href: `https://www.expedia.com/Flights`,
    },
  }
  const l = links[tab]
  return (
    <div className="banner-note">
      Phase 1 booking · {' '}
      <a href={l.href} target="_blank" rel="noreferrer noopener">
        {l.label} ↗
      </a>{' '}
      then add the options here for the group to vote on.
    </div>
  )
}

function AddOption({ tripId, tab }: { tripId: string; tab: Tab }) {
  const [open, setOpen] = useState(false)
  const addCourse = useStore((s) => s.addCourse)
  const addHotel = useStore((s) => s.addHotel)
  const addFlight = useStore((s) => s.addFlight)

  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [num1, setNum1] = useState('')
  const [num2, setNum2] = useState('')
  const [tier, setTier] = useState<HotelTier>('midrange')
  const [stops, setStops] = useState('0')

  function reset() {
    setName('')
    setLocation('')
    setNum1('')
    setNum2('')
    setTier('midrange')
    setStops('0')
  }

  function submit() {
    if (tab === 'course') {
      addCourse(tripId, {
        name,
        location,
        greenFee: Number(num1) || 0,
        par: Number(num2) || 72,
      })
    } else if (tab === 'hotel') {
      addHotel(tripId, { name, tier, pricePerNight: Number(num1) || 0 })
    } else if (tab === 'flight') {
      addFlight(tripId, {
        airline: name,
        price: Number(num1) || 0,
        stops: Number(stops) || 0,
      })
    }
    reset()
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        className="btn ghost full"
        style={{ marginBottom: 14 }}
        onClick={() => setOpen(true)}
      >
        + Add a {tab === 'course' ? 'course' : tab} option
      </button>
    )
  }

  return (
    <div className="card">
      <div className="field">
        <label>{tab === 'flight' ? 'Airline' : 'Name'}</label>
        <input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </div>
      {tab === 'course' && (
        <div className="field">
          <label>Location</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
      )}
      <div className="two-col">
        <div className="field">
          <label>
            {tab === 'course'
              ? 'Green fee'
              : tab === 'hotel'
                ? 'Price / night'
                : 'Price'}
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={num1}
            onChange={(e) => setNum1(e.target.value)}
          />
        </div>
        {tab === 'course' && (
          <div className="field">
            <label>Par</label>
            <input
              type="number"
              inputMode="numeric"
              value={num2}
              onChange={(e) => setNum2(e.target.value)}
              placeholder="72"
            />
          </div>
        )}
        {tab === 'flight' && (
          <div className="field">
            <label>Stops</label>
            <input
              type="number"
              inputMode="numeric"
              value={stops}
              onChange={(e) => setStops(e.target.value)}
            />
          </div>
        )}
      </div>
      {tab === 'hotel' && (
        <div className="field">
          <label>Tier</label>
          <div className="seg" style={{ marginBottom: 0 }}>
            {(['budget', 'midrange', 'luxury'] as HotelTier[]).map((t) => (
              <button
                key={t}
                type="button"
                className={tier === t ? 'on' : ''}
                onClick={() => setTier(t)}
              >
                {cap(t)}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="fab-bar">
        <button className="btn ghost" onClick={() => setOpen(false)}>
          Cancel
        </button>
        <button className="btn full" onClick={submit}>
          Add option
        </button>
      </div>
    </div>
  )
}
