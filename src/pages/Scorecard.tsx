import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../store'
import type { Member, Round } from '../types'
import { Avatar } from '../components/ui'

const GAMES = ['Stroke Play', 'Skins', 'Match Play', 'Stableford', 'Best Ball']

function sum(arr: (number | null)[]): number {
  return arr.reduce<number>((a, b) => a + (b ?? 0), 0)
}

/** par over only the holes that have a score entered */
function parPlayed(round: Round, scores: (number | null)[]): number {
  return round.holePars.reduce(
    (acc, p, i) => acc + (scores[i] != null ? p : 0),
    0,
  )
}

function relLabel(rel: number): string {
  if (rel === 0) return 'E'
  return rel > 0 ? `+${rel}` : `${rel}`
}

function cellClass(strokes: number | null, par: number): string {
  if (strokes == null) return ''
  const rel = strokes - par
  if (rel <= -2) return 'cell-eagle'
  if (rel === -1) return 'cell-birdie'
  if (rel === 0) return 'cell-par'
  if (rel === 1) return 'cell-bogey'
  return 'cell-double'
}

export default function Scorecard() {
  const { tripId = '' } = useParams()
  const trip = useStore((s) => s.getTrip(tripId))
  const members = useStore((s) => s.tripMembers(tripId))
  const addRound = useStore((s) => s.addRound)
  const setScore = useStore((s) => s.setScore)
  const deleteRound = useStore((s) => s.deleteRound)

  const [activeRoundId, setActiveRoundId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [courseName, setCourseName] = useState('')
  const [date, setDate] = useState('')
  const [game, setGame] = useState(GAMES[0])

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

  const rounds = trip.rounds
  const active =
    rounds.find((r) => r.id === activeRoundId) ?? rounds[rounds.length - 1]

  const courseSuggestions = trip.courses.map((c) => c.name)

  function createRound() {
    addRound(tripId, courseName, date, game)
    setCourseName('')
    setDate('')
    setGame(GAMES[0])
    setAdding(false)
  }

  return (
    <>
      <h1 className="page-title">Scorecard</h1>
      <p className="page-sub">
        Live scoring, games &amp; leaderboards for the whole trip.
      </p>

      <TripStandings rounds={rounds} members={members} />

      {rounds.length > 1 && (
        <div className="seg">
          {rounds.map((r) => (
            <button
              key={r.id}
              className={active?.id === r.id ? 'on' : ''}
              onClick={() => setActiveRoundId(r.id)}
            >
              {r.courseName.split(' ').slice(0, 2).join(' ')}
            </button>
          ))}
        </div>
      )}

      {active ? (
        <RoundCard
          key={active.id}
          round={active}
          members={members}
          onScore={(memberId, hole, strokes) =>
            setScore(tripId, active.id, memberId, hole, strokes)
          }
          onDelete={() => {
            if (confirm(`Delete the round at ${active.courseName}?`)) {
              deleteRound(tripId, active.id)
              setActiveRoundId(null)
            }
          }}
        />
      ) : (
        <div className="card empty">
          <div className="big">⛳</div>
          <p>No rounds yet. Start one when you get to the first tee.</p>
        </div>
      )}

      {adding ? (
        <div className="card">
          <div className="field">
            <label>Course</label>
            <input
              list="course-list"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="Which course today?"
              autoFocus
            />
            <datalist id="course-list">
              {courseSuggestions.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </div>
          <div className="two-col">
            <div className="field">
              <label>Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Game</label>
              <select value={game} onChange={(e) => setGame(e.target.value)}>
                {GAMES.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="fab-bar">
            <button className="btn ghost" onClick={() => setAdding(false)}>
              Cancel
            </button>
            <button className="btn full" onClick={createRound}>
              Start round
            </button>
          </div>
        </div>
      ) : (
        <button
          className="btn full gold"
          onClick={() => setAdding(true)}
          style={{ marginTop: 4 }}
        >
          + New round
        </button>
      )}
    </>
  )
}

function RoundCard({
  round,
  members,
  onScore,
  onDelete,
}: {
  round: Round
  members: Member[]
  onScore: (memberId: string, hole: number, strokes: number | null) => void
  onDelete: () => void
}) {
  const front = [0, 1, 2, 3, 4, 5, 6, 7, 8]
  const back = [9, 10, 11, 12, 13, 14, 15, 16, 17]

  // leaderboard rows
  const board = members
    .map((m) => {
      const scores = round.scores[m.id] ?? Array(18).fill(null)
      const total = sum(scores)
      const holesIn = scores.filter((s) => s != null).length
      const rel = total - parPlayed(round, scores)
      return { member: m, total, holesIn, rel }
    })
    .sort((a, b) => {
      if (a.holesIn === 0 && b.holesIn === 0) return 0
      if (a.holesIn === 0) return 1
      if (b.holesIn === 0) return -1
      return a.rel - b.rel
    })

  return (
    <>
      <div className="card">
        <div className="row between">
          <div>
            <div style={{ fontWeight: 800, fontSize: 17 }}>
              {round.courseName}
            </div>
            <div className="muted" style={{ fontSize: 13 }}>
              {round.date || 'Today'} · Par {sum(round.holePars)}
            </div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            {round.game && <span className="pill gold">{round.game}</span>}
            <button className="icon-btn" onClick={onDelete} aria-label="Delete round">
              🗑️
            </button>
          </div>
        </div>
      </div>

      <div className="section-title">Leaderboard</div>
      <div className="card">
        {board.every((b) => b.holesIn === 0) ? (
          <p className="muted" style={{ margin: 0 }}>
            Enter scores below to see the leaderboard.
          </p>
        ) : (
          board.map((b, i) => (
            <div className={`lb-row ${i === 0 ? 'first' : ''}`} key={b.member.id}>
              <span className="lb-rank">
                {b.holesIn === 0 ? '–' : i === 0 ? '🏆' : i + 1}
              </span>
              <Avatar member={b.member} size="sm" />
              <span className="lb-name">{b.member.name}</span>
              {b.holesIn === 0 ? (
                <span className="lb-rel">not started</span>
              ) : (
                <>
                  <span className="lb-rel">thru {b.holesIn}</span>
                  <span className="lb-score" style={{ marginLeft: 10 }}>
                    {b.total}
                  </span>
                  <span
                    className="lb-rel"
                    style={{ marginLeft: 8, minWidth: 30, textAlign: 'right' }}
                  >
                    {relLabel(b.rel)}
                  </span>
                </>
              )}
            </div>
          ))
        )}
      </div>

      <div className="section-title">Enter scores</div>
      <div className="card flush">
        <div className="scorecard-wrap">
          <HoleTable
            holes={front}
            label="OUT"
            round={round}
            members={members}
            onScore={onScore}
          />
        </div>
      </div>
      <div className="card flush">
        <div className="scorecard-wrap">
          <HoleTable
            holes={back}
            label="IN"
            round={round}
            members={members}
            onScore={onScore}
            showTotal
          />
        </div>
      </div>
    </>
  )
}

function HoleTable({
  holes,
  label,
  round,
  members,
  onScore,
  showTotal,
}: {
  holes: number[]
  label: string
  round: Round
  members: Member[]
  onScore: (memberId: string, hole: number, strokes: number | null) => void
  showTotal?: boolean
}) {
  return (
    <table className="scorecard">
      <thead>
        <tr>
          <th className="name-cell">Hole</th>
          {holes.map((h) => (
            <th key={h}>{h + 1}</th>
          ))}
          <th>{label}</th>
          {showTotal && <th>TOT</th>}
        </tr>
      </thead>
      <tbody>
        <tr className="par-row">
          <td className="name-cell">Par</td>
          {holes.map((h) => (
            <td key={h}>{round.holePars[h]}</td>
          ))}
          <td>{sum(holes.map((h) => round.holePars[h]))}</td>
          {showTotal && <td>{sum(round.holePars)}</td>}
        </tr>
        {members.map((m) => {
          const scores = round.scores[m.id] ?? Array(18).fill(null)
          const nineTotal = sum(holes.map((h) => scores[h]))
          const grandTotal = sum(scores)
          return (
            <tr key={m.id}>
              <td className="name-cell">
                <span style={{ color: m.color }}>●</span> {m.name}
              </td>
              {holes.map((h) => (
                <td key={h} className={cellClass(scores[h], round.holePars[h])}>
                  <input
                    className="score-input"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={15}
                    value={scores[h] ?? ''}
                    onChange={(e) => {
                      const v = e.target.value
                      onScore(m.id, h, v === '' ? null : Number(v))
                    }}
                  />
                </td>
              ))}
              <td className="total-cell">{nineTotal || ''}</td>
              {showTotal && <td className="total-cell">{grandTotal || ''}</td>}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function TripStandings({
  rounds,
  members,
}: {
  rounds: Round[]
  members: Member[]
}) {
  if (rounds.length < 1) return null

  const rows = members
    .map((m) => {
      let total = 0
      let relTotal = 0
      let holesIn = 0
      for (const r of rounds) {
        const scores = r.scores[m.id] ?? Array(18).fill(null)
        total += sum(scores)
        relTotal += sum(scores) - parPlayed(r, scores)
        holesIn += scores.filter((s) => s != null).length
      }
      return { member: m, total, relTotal, holesIn }
    })
    .filter((r) => r.holesIn > 0)
    .sort((a, b) => a.relTotal - b.relTotal)

  if (rows.length === 0) return null

  return (
    <>
      <div className="section-title">Trip Standings</div>
      <div className="card">
        {rows.map((r, i) => (
          <div className={`lb-row ${i === 0 ? 'first' : ''}`} key={r.member.id}>
            <span className="lb-rank">{i === 0 ? '🏆' : i + 1}</span>
            <Avatar member={r.member} size="sm" />
            <span className="lb-name">{r.member.name}</span>
            <span className="lb-rel">{r.total} strokes</span>
            <span
              className="lb-score"
              style={{ marginLeft: 10, minWidth: 34, textAlign: 'right' }}
            >
              {relLabel(r.relTotal)}
            </span>
          </div>
        ))}
      </div>
    </>
  )
}
