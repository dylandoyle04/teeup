import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import type { HotelTier } from '../types'
import { Toggle } from '../components/ui'

const TIERS: { value: HotelTier; label: string }[] = [
  { value: 'budget', label: 'Budget' },
  { value: 'midrange', label: 'Mid-range' },
  { value: 'luxury', label: 'Luxury' },
]

export default function NewTrip() {
  const createTrip = useStore((s) => s.createTrip)
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [budgetMin, setBudgetMin] = useState('500')
  const [budgetMax, setBudgetMax] = useState('1000')
  const [hotelTier, setHotelTier] = useState<HotelTier>('midrange')
  const [needsFlights, setNeedsFlights] = useState(false)

  const canSubmit = name.trim().length > 0

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    const id = createTrip({
      name: name.trim(),
      destination: destination.trim(),
      startDate,
      endDate,
      budgetMin: Number(budgetMin) || 0,
      budgetMax: Number(budgetMax) || 0,
      hotelTier,
      needsFlights,
    })
    navigate(`/trip/${id}/setup`)
  }

  return (
    <>
      <button className="back-btn" onClick={() => navigate('/')}>
        ← Back to menu
      </button>
      <h1 className="page-title" style={{ marginTop: 12 }}>
        Set up the trip
      </h1>
      <p className="page-sub">
        You're the organizer — lock in the basics, then invite the group to vote
        on courses, tee times, and more.
      </p>

      <form className="card" onSubmit={submit}>
        <div className="field">
          <label htmlFor="t-name">Trip name</label>
          <input
            id="t-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Myrtle Beach Buddies Trip"
            autoFocus
          />
        </div>
        <div className="field">
          <label htmlFor="t-dest">Destination</label>
          <input
            id="t-dest"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="e.g. Myrtle Beach, SC"
          />
        </div>
        <div className="two-col">
          <div className="field">
            <label htmlFor="t-start">Start date</label>
            <input
              id="t-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="t-end">End date</label>
            <input
              id="t-end"
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <div className="two-col">
          <div className="field">
            <label htmlFor="t-bmin">Budget min /pp</label>
            <input
              id="t-bmin"
              type="number"
              inputMode="numeric"
              value={budgetMin}
              onChange={(e) => setBudgetMin(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="t-bmax">Budget max /pp</label>
            <input
              id="t-bmax"
              type="number"
              inputMode="numeric"
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label>Hotel preference</label>
          <span className="hint">Sets the vibe for hotel options.</span>
          <div className="seg" style={{ marginBottom: 0 }}>
            {TIERS.map((t) => (
              <button
                key={t.value}
                type="button"
                className={hotelTier === t.value ? 'on' : ''}
                onClick={() => setHotelTier(t.value)}
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
          <Toggle on={needsFlights} onChange={setNeedsFlights} label="Need flights" />
        </div>

        <button className="btn full" type="submit" disabled={!canSubmit}>
          Create Trip
        </button>
      </form>
    </>
  )
}
