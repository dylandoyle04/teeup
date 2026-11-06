import { useEffect, useRef, useState } from 'react'
import { nearestPlaceLabel, searchPlaces, type Place } from '../nearby'

/**
 * "Where are you coming from?" — type a town/state or use the device
 * location; the chosen point sorts trips by distance.
 */
export default function NearbySearch({
  value,
  onChange,
}: {
  value: Place | null
  onChange: (p: Place | null) => void
}) {
  const [text, setText] = useState('')
  const [results, setResults] = useState<Place[]>([])
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const seq = useRef(0)

  useEffect(() => {
    const q = text.trim()
    if (q.length < 2) {
      setResults([])
      return
    }
    const mine = ++seq.current
    const t = setTimeout(() => {
      searchPlaces(q).then((r) => {
        if (mine === seq.current) setResults(r)
      })
    }, 120)
    return () => clearTimeout(t)
  }, [text])

  function pick(p: Place) {
    onChange(p)
    setText('')
    setResults([])
    setOpen(false)
    setError('')
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const r = results.length ? results : await searchPlaces(text)
    if (r[0]) pick(r[0])
    else if (text.trim()) setError(`Couldn't find “${text.trim()}”. Try a city and state, like “Kent, OH”.`)
  }

  function useMyLocation() {
    if (!('geolocation' in navigator)) {
      setError('Location isn’t available in this browser — type your city instead.')
      return
    }
    setBusy(true)
    setError('')
    const found = async (pos: GeolocationPosition) => {
      const p = { lat: pos.coords.latitude, lon: pos.coords.longitude }
      // the town name is just a label — never let it block sorting
      const label = await nearestPlaceLabel(p).catch(() => 'your location')
      setBusy(false)
      pick({ ...p, label })
    }
    const failed = (err: GeolocationPositionError) => {
      setBusy(false)
      setError(
        err.code === err.PERMISSION_DENIED
          ? 'Location is blocked for this site — allow it in your browser settings, or type your city.'
          : err.code === err.POSITION_UNAVAILABLE
            ? 'Your device couldn’t find your location (check that Location Services are on) — type your city instead.'
            : 'Finding your location took too long — type your city instead.',
      )
    }
    // a coarse, recent fix is plenty for sorting by distance; retry once on timeout
    navigator.geolocation.getCurrentPosition(
      found,
      (err) =>
        err.code === err.TIMEOUT
          ? navigator.geolocation.getCurrentPosition(found, failed, { maximumAge: 60 * 60 * 1000, timeout: 20000 })
          : failed(err),
      { enableHighAccuracy: false, maximumAge: 30 * 60 * 1000, timeout: 12000 },
    )
  }

  if (value) {
    return (
      <div className="near-card near-set" data-reveal>
        <span className="near-pin" aria-hidden="true">
          📍
        </span>
        <div className="near-text">
          <span className="near-kicker">Closest trips to</span>
          <strong>{value.label}</strong>
        </div>
        <button className="btn sm subtle" onClick={() => onChange(null)}>
          Change
        </button>
      </div>
    )
  }

  return (
    <form className="near-card" onSubmit={submit} data-reveal>
      <label htmlFor="near-q" className="near-label">
        Find trips near you
      </label>
      <p className="hint near-hint">Enter your city or where you want to play — we&apos;ll sort trips by distance.</p>
      <div className="near-row">
        <div className="near-input-wrap">
          <input
            id="near-q"
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              setOpen(true)
              setError('')
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="e.g. Kent, OH"
            autoComplete="off"
            enterKeyHint="search"
          />
          {open && results.length > 0 && (
            <ul className="near-results" role="listbox">
              {results.map((r) => (
                <li key={r.label}>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(r)}>
                    {r.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="submit" className="btn">
          Search
        </button>
      </div>
      <button type="button" className="near-locate" onClick={useMyLocation} disabled={busy}>
        {busy ? 'Finding you…' : '📍 Use my location'}
      </button>
      {error && <p className="near-error">{error}</p>}
    </form>
  )
}
