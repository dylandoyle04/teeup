import { useState } from 'react'
import { useStore } from '../store'
import type { Round } from '../types'

type Row = { id: string; name: string; color: string }

export default function HoleEntry({
  tripId,
  round,
  row,
  hole,
  onClose,
  onNext,
}: {
  tripId: string
  round: Round
  row: Row
  hole: number
  onClose: () => void
  onNext: (() => void) | null
}) {
  const setHoleEntry = useStore((s) => s.setHoleEntry)
  const par = round.holePars[hole]
  const curScore = round.scores[row.id]?.[hole] ?? null
  const curStat = round.stats?.[row.id]?.[hole] ?? {
    putts: null,
    fir: null,
    gir: null,
  }

  const [score, setScore] = useState<number>(curScore ?? par)
  const [putts, setPutts] = useState<number | null>(curStat.putts)
  const [fir, setFir] = useState<boolean | null>(curStat.fir)
  const [gir, setGir] = useState<boolean | null>(curStat.gir)

  function save(next: boolean) {
    setHoleEntry(tripId, round.id, row.id, hole, {
      score,
      putts,
      fir: par <= 3 ? null : fir,
      gir,
    })
    if (next && onNext) onNext()
    else onClose()
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <div>
            <span style={{ color: row.color }}>●</span>{' '}
            <strong>{row.name}</strong>
          </div>
          <div className="sheet-hole">
            Hole {hole + 1} · Par {par}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <label className="sheet-label">Score</label>
        <div className="stepper">
          <button
            aria-label="Decrease score"
            onClick={() => setScore((s) => Math.max(1, s - 1))}
          >
            −
          </button>
          <span className="stepper-val">
            {score}
            <span className="stepper-rel">
              {score - par === 0
                ? 'E'
                : score - par > 0
                  ? `+${score - par}`
                  : score - par}
            </span>
          </span>
          <button
            aria-label="Increase score"
            onClick={() => setScore((s) => Math.min(15, s + 1))}
          >
            +
          </button>
        </div>

        <label className="sheet-label">Putts</label>
        <div className="chip-row">
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              className={`chip ${putts === n ? 'on' : ''}`}
              onClick={() => setPutts(n)}
            >
              {n}
            </button>
          ))}
          <input
            className="chip-input"
            type="number"
            inputMode="numeric"
            min={0}
            max={10}
            placeholder="#"
            value={putts != null && putts > 3 ? putts : ''}
            onChange={(e) =>
              setPutts(e.target.value === '' ? null : Number(e.target.value))
            }
          />
        </div>

        {par > 3 && (
          <>
            <label className="sheet-label">Fairway hit</label>
            <div className="chip-row two">
              <button
                className={`chip ${fir === true ? 'on good' : ''}`}
                onClick={() => setFir(fir === true ? null : true)}
              >
                ✓ Hit
              </button>
              <button
                className={`chip ${fir === false ? 'on bad' : ''}`}
                onClick={() => setFir(fir === false ? null : false)}
              >
                ✕ Missed
              </button>
            </div>
          </>
        )}

        <label className="sheet-label">Green in regulation</label>
        <div className="chip-row two">
          <button
            className={`chip ${gir === true ? 'on good' : ''}`}
            onClick={() => setGir(gir === true ? null : true)}
          >
            ✓ Yes
          </button>
          <button
            className={`chip ${gir === false ? 'on bad' : ''}`}
            onClick={() => setGir(gir === false ? null : false)}
          >
            ✕ No
          </button>
        </div>

        <div className="sheet-actions">
          <button className="btn ghost" onClick={() => save(false)}>
            Save
          </button>
          {onNext && (
            <button className="btn full gold" onClick={() => save(true)}>
              Save &amp; next →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
