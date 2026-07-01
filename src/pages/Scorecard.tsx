import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../store'
import type { Member, Round, WolfMode } from '../types'
import { Avatar } from '../components/ui'
import HoleEntry from '../components/HoleEntry'
import {
  GAMES,
  computeHighLow,
  computeSkins,
  computeStableford,
  computeWolf,
  isTeamGame,
  parPlayed,
  relLabel,
  strokeBoard,
  sum,
  wolfForHole,
} from '../games'

type Row = { id: string; name: string; color: string }
const TEAM_COLORS = ['#1b6b46', '#b8941f']

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
  const deleteRound = useStore((s) => s.deleteRound)

  const [activeRoundId, setActiveRoundId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [courseName, setCourseName] = useState('')
  const [date, setDate] = useState('')
  const [game, setGame] = useState<string>(GAMES[0])

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
          tripId={tripId}
          round={active}
          members={members}
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
  tripId,
  round,
  members,
  onDelete,
}: {
  tripId: string
  round: Round
  members: Member[]
  onDelete: () => void
}) {
  const setRoundGame = useStore((s) => s.setRoundGame)
  const setRoundTeams = useStore((s) => s.setRoundTeams)
  const [entry, setEntry] = useState<{ rowId: string; hole: number } | null>(
    null,
  )

  const team = isTeamGame(round.game)

  // auto-create two balanced teams when a team game has none
  useEffect(() => {
    if (team && round.teams.length < 2 && members.length >= 2) {
      const a: string[] = []
      const b: string[] = []
      members.forEach((m, i) => (i % 2 === 0 ? a : b).push(m.id))
      setRoundTeams(tripId, round.id, [
        { id: 'teamA', name: 'Team 1', memberIds: a },
        { id: 'teamB', name: 'Team 2', memberIds: b },
      ])
    }
  }, [team, round.teams.length, members.length, tripId, round.id, setRoundTeams])

  const scramble = round.game === 'Scramble'
  const teamRows: Row[] =
    round.teams.length >= 2
      ? round.teams.map((t, i) => ({
          id: t.id,
          name: t.name,
          color: TEAM_COLORS[i % TEAM_COLORS.length],
        }))
      : []
  const rows: Row[] = scramble && teamRows.length ? teamRows : members

  const front = [0, 1, 2, 3, 4, 5, 6, 7, 8]
  const back = [9, 10, 11, 12, 13, 14, 15, 16, 17]

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
          <button className="icon-btn" onClick={onDelete} aria-label="Delete round">
            🗑️
          </button>
        </div>
        <div className="field" style={{ marginTop: 12, marginBottom: 0 }}>
          <label>Game</label>
          <select
            value={round.game}
            onChange={(e) => setRoundGame(tripId, round.id, e.target.value)}
          >
            {GAMES.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </div>
      </div>

      {team && round.teams.length >= 2 && (
        <TeamSetup tripId={tripId} round={round} members={members} />
      )}

      <div className="section-title">
        {round.game === 'Stroke Play'
          ? 'Leaderboard'
          : `${round.game} standings`}
      </div>
      <Results round={round} members={members} rows={rows} />

      {round.game === 'Wolf' && (
        <WolfPanel tripId={tripId} round={round} members={members} />
      )}

      <div className="section-title">
        Enter scores{scramble ? ' (one per team)' : ''}
      </div>
      <p className="hint" style={{ margin: '-4px 4px 10px' }}>
        Tap any box to log the score, putts, fairway &amp; GIR for that hole.
      </p>
      <div className="card flush">
        <div className="scorecard-wrap">
          <HoleTable
            holes={front}
            label="OUT"
            round={round}
            rows={rows}
            onCellTap={(id, h) => setEntry({ rowId: id, hole: h })}
          />
        </div>
      </div>
      <div className="card flush">
        <div className="scorecard-wrap">
          <HoleTable
            holes={back}
            label="IN"
            round={round}
            rows={rows}
            onCellTap={(id, h) => setEntry({ rowId: id, hole: h })}
            showTotal
          />
        </div>
      </div>

      <StatsSummary round={round} rows={rows} />

      {entry &&
        (() => {
          const row = rows.find((r) => r.id === entry.rowId)
          if (!row) return null
          return (
            <HoleEntry
              key={`${entry.rowId}-${entry.hole}`}
              tripId={tripId}
              round={round}
              row={row}
              hole={entry.hole}
              onClose={() => setEntry(null)}
              onNext={
                entry.hole < 17
                  ? () =>
                      setEntry({ rowId: entry.rowId, hole: entry.hole + 1 })
                  : null
              }
            />
          )
        })()}
    </>
  )
}

function StatsSummary({ round, rows }: { round: Round; rows: Row[] }) {
  const data = rows.map((r) => {
    const stats = round.stats?.[r.id] ?? []
    let putts = 0
    let firHit = 0
    let firPoss = 0
    let girHit = 0
    let girPoss = 0
    stats.forEach((s, i) => {
      if (s.putts != null) putts += s.putts
      if (round.holePars[i] > 3) {
        if (s.fir != null) {
          firPoss++
          if (s.fir) firHit++
        }
      }
      if (s.gir != null) {
        girPoss++
        if (s.gir) girHit++
      }
    })
    return { r, putts, firHit, firPoss, girHit, girPoss }
  })

  const anyStats = data.some(
    (d) => d.putts > 0 || d.firPoss > 0 || d.girPoss > 0,
  )
  if (!anyStats) return null

  return (
    <>
      <div className="section-title">Round stats</div>
      <div className="card flush">
        <table className="stat-table">
          <thead>
            <tr>
              <th className="name-cell">Player</th>
              <th>Putts</th>
              <th>FIR</th>
              <th>GIR</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.r.id}>
                <td className="name-cell">
                  <span style={{ color: d.r.color }}>●</span> {d.r.name}
                </td>
                <td>{d.putts || '–'}</td>
                <td>{d.firPoss ? `${d.firHit}/${d.firPoss}` : '–'}</td>
                <td>{d.girPoss ? `${d.girHit}/${d.girPoss}` : '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function Results({
  round,
  members,
  rows,
}: {
  round: Round
  members: Member[]
  rows: Row[]
}) {
  const memberIds = members.map((m) => m.id)
  const byId = new Map(members.map((m) => [m.id, m]))

  // High-Low
  if (round.game === 'High-Low') {
    const hl = computeHighLow(round)
    if (!hl)
      return (
        <div className="card">
          <p className="muted" style={{ margin: 0 }}>
            Set up two teams to start High-Low scoring.
          </p>
        </div>
      )
    const leader = hl.aPts === hl.bPts ? null : hl.aPts > hl.bPts ? 'A' : 'B'
    return (
      <div className="card">
        <div className="hl-score">
          <div className={`hl-team ${leader === 'A' ? 'win' : ''}`}>
            <div className="hl-name">{hl.A.name}</div>
            <div className="hl-pts">{hl.aPts}</div>
          </div>
          <span className="hl-vs">vs</span>
          <div className={`hl-team ${leader === 'B' ? 'win' : ''}`}>
            <div className="hl-name">{hl.B.name}</div>
            <div className="hl-pts">{hl.bPts}</div>
          </div>
        </div>
        <p className="hint" style={{ marginTop: 10, textAlign: 'center' }}>
          1 pt for the better low ball + 1 pt for the better high ball, each hole.
        </p>
      </div>
    )
  }

  // Stableford
  if (round.game === 'Stableford') {
    const board = computeStableford(round, memberIds)
    if (board.every((b) => b.thru === 0)) return <EnterPrompt />
    return (
      <div className="card">
        {board.map((b, i) => {
          const m = byId.get(b.id)!
          return (
            <div className={`lb-row ${i === 0 ? 'first' : ''}`} key={b.id}>
              <span className="lb-rank">
                {b.thru === 0 ? '–' : i === 0 ? '🏆' : i + 1}
              </span>
              <Avatar member={m} size="sm" />
              <span className="lb-name">{m.name}</span>
              <span className="lb-rel">thru {b.thru}</span>
              <span className="lb-score" style={{ marginLeft: 10 }}>
                {b.points} pts
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  // Skins
  if (round.game === 'Skins') {
    const { rows: sk } = computeSkins(round, memberIds)
    if (sk.every((s) => s.skins === 0)) return <EnterPrompt label="No skins won yet — enter scores below." />
    return (
      <div className="card">
        {sk.map((s, i) => {
          const m = byId.get(s.id)!
          return (
            <div className={`lb-row ${i === 0 ? 'first' : ''}`} key={s.id}>
              <span className="lb-rank">{i === 0 ? '🏆' : i + 1}</span>
              <Avatar member={m} size="sm" />
              <span className="lb-name">{m.name}</span>
              <span className="lb-score">
                {s.skins} {s.skins === 1 ? 'skin' : 'skins'}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  // Wolf
  if (round.game === 'Wolf') {
    const { rows: wr } = computeWolf(round, memberIds)
    return (
      <div className="card">
        {wr.map((w, i) => {
          const m = byId.get(w.id)!
          return (
            <div className={`lb-row ${i === 0 ? 'first' : ''}`} key={w.id}>
              <span className="lb-rank">{i === 0 ? '🏆' : i + 1}</span>
              <Avatar member={m} size="sm" />
              <span className="lb-name">{m.name}</span>
              <span className="lb-score">{w.points} pts</span>
            </div>
          )
        })}
        <p className="hint" style={{ marginTop: 8 }}>
          Set the wolf's call per hole below; winners are scored from strokes.
        </p>
      </div>
    )
  }

  // Stroke Play & Scramble (stroke board over rows)
  const board = strokeBoard(
    round,
    rows.map((r) => ({ id: r.id, member: r as Member })),
  )
  if (board.every((b) => b.thru === 0)) return <EnterPrompt />
  return (
    <div className="card">
      {board.map((b, i) => (
        <div className={`lb-row ${i === 0 ? 'first' : ''}`} key={b.id}>
          <span className="lb-rank">
            {b.thru === 0 ? '–' : i === 0 ? '🏆' : i + 1}
          </span>
          <Avatar member={b.member} size="sm" />
          <span className="lb-name">{b.member.name}</span>
          {b.thru === 0 ? (
            <span className="lb-rel">not started</span>
          ) : (
            <>
              <span className="lb-rel">thru {b.thru}</span>
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
      ))}
    </div>
  )
}

function EnterPrompt({ label }: { label?: string }) {
  return (
    <div className="card">
      <p className="muted" style={{ margin: 0 }}>
        {label ?? 'Enter scores below to see the standings.'}
      </p>
    </div>
  )
}

function TeamSetup({
  tripId,
  round,
  members,
}: {
  tripId: string
  round: Round
  members: Member[]
}) {
  const setRoundTeams = useStore((s) => s.setRoundTeams)
  const teamOf = (id: string) =>
    round.teams.findIndex((t) => t.memberIds.includes(id))

  function assign(memberId: string, teamIdx: number) {
    const teams = round.teams.map((t, i) => ({
      ...t,
      memberIds:
        i === teamIdx
          ? Array.from(new Set([...t.memberIds, memberId]))
          : t.memberIds.filter((id) => id !== memberId),
    }))
    setRoundTeams(tripId, round.id, teams)
  }

  return (
    <>
      <div className="section-title">Teams</div>
      <div className="card">
        {members.map((m) => {
          const ti = teamOf(m.id)
          return (
            <div className="list-row" key={m.id}>
              <Avatar member={m} size="sm" />
              <span style={{ flex: 1, fontWeight: 700 }}>{m.name}</span>
              <div className="team-toggle">
                {round.teams.map((t, i) => (
                  <button
                    key={t.id}
                    className={ti === i ? 'on' : ''}
                    onClick={() => assign(m.id, i)}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

function WolfPanel({
  tripId,
  round,
  members,
}: {
  tripId: string
  round: Round
  members: Member[]
}) {
  const setWolfPick = useStore((s) => s.setWolfPick)
  const memberIds = members.map((m) => m.id)
  const byId = new Map(members.map((m) => [m.id, m]))

  return (
    <>
      <div className="section-title">Wolf — the call each hole</div>
      <div className="card">
        {round.holePars.map((_, h) => {
          const wolfId = wolfForHole(memberIds, h)
          const wolf = wolfId ? byId.get(wolfId) : undefined
          const pick = round.wolf[h]
          const value = !pick
            ? ''
            : pick.mode === 'partner'
              ? `partner:${pick.partnerId}`
              : pick.mode
          return (
            <div className="wolf-row" key={h}>
              <span className="wolf-hole">#{h + 1}</span>
              <span className="wolf-who">
                🐺 {wolf?.name ?? '—'}
              </span>
              <select
                className="wolf-select"
                value={value}
                onChange={(e) => {
                  const v = e.target.value
                  if (!v) return setWolfPick(tripId, round.id, h, null)
                  if (v === 'lone' || v === 'blind')
                    return setWolfPick(tripId, round.id, h, {
                      mode: v as WolfMode,
                      partnerId: null,
                    })
                  const partnerId = v.split(':')[1]
                  setWolfPick(tripId, round.id, h, {
                    mode: 'partner',
                    partnerId,
                  })
                }}
              >
                <option value="">— call —</option>
                {memberIds
                  .filter((id) => id !== wolfId)
                  .map((id) => (
                    <option key={id} value={`partner:${id}`}>
                      Partner: {byId.get(id)?.name}
                    </option>
                  ))}
                <option value="lone">Lone Wolf (+2)</option>
                <option value="blind">Blind Wolf (+3)</option>
              </select>
            </div>
          )
        })}
      </div>
    </>
  )
}

function HoleTable({
  holes,
  label,
  round,
  rows,
  onCellTap,
  showTotal,
}: {
  holes: number[]
  label: string
  round: Round
  rows: Row[]
  onCellTap: (rowId: string, hole: number) => void
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
        {rows.map((m) => {
          const scores = round.scores[m.id] ?? Array(18).fill(null)
          const stats = round.stats?.[m.id] ?? []
          const nineTotal = sum(holes.map((h) => scores[h]))
          const grandTotal = sum(scores)
          return (
            <tr key={m.id}>
              <td className="name-cell">
                <span style={{ color: m.color }}>●</span> {m.name}
              </td>
              {holes.map((h) => (
                <td key={h} className={cellClass(scores[h], round.holePars[h])}>
                  <button
                    className="score-cell"
                    onClick={() => onCellTap(m.id, h)}
                  >
                    {scores[h] ?? ''}
                    {stats[h]?.putts != null && (
                      <span className="putt-dot" aria-hidden="true" />
                    )}
                  </button>
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
