import { useEffect, useRef, useState, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../auth'
import type { Round, Team, WolfMode } from '../types'
import {
  GAMES,
  isTeamGame,
  computeStableford,
  computeSkins,
  computeHighLow,
  computeBestBall,
  computeWolf,
  strokeBoard,
  wolfForHole,
  relLabel,
  sum,
} from '../games'
import {
  getRound,
  listMembers,
  getRoundScores,
  saveMemberScores,
  saveRoundGame,
  saveRoundTeams,
  saveRoundWolf,
  type SharedRound,
  type SharedMember,
  type ScoreMap,
} from '../cloud'

const HOLES = Array.from({ length: 18 }, (_, i) => i)
const TEAM_COLORS = ['#1d5fb0', '#c6952a']

export default function ShareScorecard() {
  const { id = '', roundId = '' } = useParams()
  const { ready, user } = useAuth()
  const [round, setRound] = useState<SharedRound | null>(null)
  const [members, setMembers] = useState<SharedMember[]>([])
  const [scores, setScores] = useState<ScoreMap>({})
  const [loading, setLoading] = useState(true)
  const editingRef = useRef<string | null>(null)

  const reloadRound = useCallback(() => {
    getRound(roundId).then((r) => r && setRound(r))
  }, [roundId])

  useEffect(() => {
    let alive = true
    Promise.all([getRound(roundId), listMembers(id), getRoundScores(roundId)]).then(
      ([r, m, s]) => {
        if (!alive) return
        setRound(r)
        setMembers(m)
        setScores(s)
        setLoading(false)
      },
    )
    return () => {
      alive = false
    }
  }, [id, roundId])

  useEffect(() => {
    if (!supabase) return
    const ch = supabase
      .channel(`round-${roundId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'round_scores', filter: `round_id=eq.${roundId}` },
        (payload) => {
          const row = payload.new as { member_id?: string; strokes?: (number | null)[] }
          if (!row?.member_id || row.member_id === editingRef.current) return
          setScores((prev) => ({ ...prev, [row.member_id!]: row.strokes ?? Array(18).fill(null) }))
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rounds', filter: `id=eq.${roundId}` },
        () => reloadRound(),
      )
      .subscribe()
    return () => {
      supabase?.removeChannel(ch)
    }
  }, [roundId, reloadRound])

  // auto-create two balanced teams when a team game is picked and none exist
  useEffect(() => {
    if (!round) return
    const g = round.game
    const t = (round.teams as Team[]) ?? []
    if (isTeamGame(g) && t.length < 2 && members.length >= 2) {
      const a: string[] = [], b: string[] = []
      members.forEach((m, i) => (i % 2 === 0 ? a : b).push(m.id))
      const next: Team[] = [
        { id: 'teamA', name: 'Team 1', memberIds: a },
        { id: 'teamB', name: 'Team 2', memberIds: b },
      ]
      setRound((r) => (r ? { ...r, teams: next } : r))
      saveRoundTeams(roundId, next)
    }
  }, [round?.game, round?.teams, members, roundId])

  const setCell = useCallback(
    (memberId: string, hole: number, value: string) => {
      const digits = value.replace(/\D/g, '')
      const n = digits === '' ? null : Math.min(15, Math.max(1, Number(digits))) || null
      setScores((prev) => {
        const cur = prev[memberId] ? [...prev[memberId]] : Array(18).fill(null)
        cur[hole] = n
        saveMemberScores(roundId, memberId, cur)
        return { ...prev, [memberId]: cur }
      })
    },
    [roundId],
  )

  if (ready && !user)
    return (
      <div className="auth-wrap"><div className="card empty"><p>Sign in to view this scorecard.</p>
        <Link to="/signin" className="btn full gold" style={{ marginTop: 10 }}>Sign in</Link></div></div>
    )
  if (loading) return <div className="card empty"><p>Loading…</p></div>
  if (!round)
    return <div className="card empty"><p>Round not found.</p><Link to={`/shared/${id}`} className="btn subtle sm">Back</Link></div>

  const pars = round.holePars
  const totalPar = sum(pars)
  const game = round.game
  const teams = (round.teams as Team[]) ?? []
  const memberIds = members.map((m) => m.id)
  const nameOf = (mid: string) => members.find((m) => m.id === mid)?.name ?? '—'
  const team = isTeamGame(game)
  const scramble = game === 'Scramble'

  // pseudo Round so we can reuse the tested scoring engine
  const asRound = (scoreOverride?: ScoreMap): Round => ({
    id: round.id,
    courseName: round.courseName,
    date: '',
    holePars: pars,
    scores: scoreOverride ?? scores,
    stats: {},
    game,
    teams,
    wolf: (round.wolf as (import('../types').WolfPick | null)[]) ?? [],
  })

  // for scramble: a team's score on a hole = whatever a teammate entered
  const scrambleScores = (): ScoreMap => {
    const map: ScoreMap = {}
    for (const t of teams) {
      map[t.id] = HOLES.map((h) => {
        for (const mid of t.memberIds) {
          const v = scores[mid]?.[h]
          if (v != null) return v
        }
        return null
      })
    }
    return map
  }

  function changeGame(g: string) {
    setRound((r) => (r ? { ...r, game: g } : r))
    saveRoundGame(roundId, g)
  }

  function assignTeam(memberId: string, teamIdx: number) {
    if (teams.length < 2) return // effect creates teams first
    const next = teams.map((t, i) => ({
      ...t,
      memberIds:
        i === teamIdx
          ? Array.from(new Set([...t.memberIds, memberId]))
          : t.memberIds.filter((x) => x !== memberId),
    }))
    setRound((r) => (r ? { ...r, teams: next } : r))
    saveRoundTeams(roundId, next)
  }

  function setWolfPick(hole: number, pick: import('../types').WolfPick | null) {
    const w = [...(((round?.wolf as (import('../types').WolfPick | null)[]) ?? Array(18).fill(null)))]
    while (w.length < 18) w.push(null)
    w[hole] = pick
    setRound((r) => (r ? { ...r, wolf: w } : r))
    saveRoundWolf(roundId, w)
  }

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">{round.courseName}</h1>
        <p className="page-sub">Par {totalPar} · live scorecard</p>
      </div>

      <Link className="card shared-row" to={`/shared/${id}/ryder`}>
        <div>
          <div className="shared-row-name">🏆 Ryder Cup</div>
          <div className="shared-row-dest">Teams &amp; live points across the trip</div>
        </div>
        <span className="shared-row-go">›</span>
      </Link>

      <div className="field" style={{ marginBottom: 12 }}>
        <label>Game</label>
        <select value={game} onChange={(e) => changeGame(e.target.value)}>
          {(GAMES.includes(game as (typeof GAMES)[number]) ? GAMES : [game, ...GAMES]).map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
      </div>

      {team && teams.length >= 2 && (
        <TeamSetup members={members} teams={teams} onAssign={assignTeam} />
      )}

      <div className="section-title">{game === 'Stroke Play' ? 'Leaderboard' : `${game} standings`}</div>
      <Results
        game={game}
        round={asRound()}
        members={members}
        memberIds={memberIds}
        teams={teams}
        nameOf={nameOf}
        scrambleRound={scramble ? asRound(scrambleScores()) : null}
      />

      {game === 'Wolf' && (
        <WolfPanel round={round} members={members} memberIds={memberIds} nameOf={nameOf} onPick={setWolfPick} />
      )}

      <div className="section-title">Enter scores{scramble ? ' (any teammate)' : ''}</div>
      <p className="hint" style={{ margin: '-4px 4px 10px' }}>Everyone's scores sync live.</p>
      <div className="card flush">
        <div className="scorecard-wrap">
          <table className="scorecard">
            <thead>
              <tr>
                <th className="name-cell">Hole</th>
                {HOLES.map((h) => <th key={h}>{h + 1}</th>)}
                <th>TOT</th>
              </tr>
            </thead>
            <tbody>
              <tr className="par-row">
                <td className="name-cell">Par</td>
                {HOLES.map((h) => <td key={h}>{pars[h]}</td>)}
                <td>{totalPar}</td>
              </tr>
              {members.map((m) => {
                const s = scores[m.id] ?? []
                return (
                  <tr key={m.id}>
                    <td className="name-cell">{m.name}</td>
                    {HOLES.map((h) => (
                      <td key={h}>
                        <input
                          className="score-input"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={2}
                          value={s[h] ?? ''}
                          onFocus={(e) => { editingRef.current = m.id; e.currentTarget.select() }}
                          onBlur={() => { editingRef.current = null }}
                          onChange={(e) => setCell(m.id, h, e.target.value)}
                        />
                      </td>
                    ))}
                    <td className="total-cell">{sum(s) || ''}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Link to={`/shared/${id}`} className="btn ghost" style={{ marginTop: 16 }}>← Back to trip</Link>
    </>
  )
}

function Row({ rank, name, right, sub, first }: { rank: React.ReactNode; name: string; right: React.ReactNode; sub?: string; first?: boolean }) {
  return (
    <div className={`lb-row ${first ? 'first' : ''}`}>
      <span className="lb-rank">{rank}</span>
      <span className="dot-avatar">{name.charAt(0).toUpperCase()}</span>
      <span className="lb-name">{name}</span>
      {sub && <span className="lb-rel">{sub}</span>}
      <span className="lb-score" style={{ marginLeft: 10 }}>{right}</span>
    </div>
  )
}

function Results({
  game, round, members, memberIds, teams, nameOf, scrambleRound,
}: {
  game: string
  round: Round
  members: SharedMember[]
  memberIds: string[]
  teams: Team[]
  nameOf: (id: string) => string
  scrambleRound: Round | null
}) {
  if (game === 'Stableford') {
    const board = computeStableford(round, memberIds)
    if (board.every((b) => b.thru === 0)) return <Empty />
    return <div className="card">{board.map((b, i) => (
      <Row key={b.id} first={i === 0} rank={b.thru === 0 ? '–' : i === 0 ? '🏆' : i + 1} name={nameOf(b.id)} sub={`thru ${b.thru}`} right={`${b.points} pts`} />
    ))}</div>
  }
  if (game === 'Skins') {
    const { rows } = computeSkins(round, memberIds)
    if (rows.every((s) => s.skins === 0)) return <Empty label="No skins won yet — enter scores below." />
    return <div className="card">{rows.map((s, i) => (
      <Row key={s.id} first={i === 0} rank={i === 0 ? '🏆' : i + 1} name={nameOf(s.id)} right={`${s.skins} ${s.skins === 1 ? 'skin' : 'skins'}`} />
    ))}</div>
  }
  if (game === 'Wolf') {
    const { rows } = computeWolf(round, memberIds)
    return <div className="card">{rows.map((w, i) => (
      <Row key={w.id} first={i === 0} rank={i === 0 ? '🏆' : i + 1} name={nameOf(w.id)} right={`${w.points} pts`} />
    ))}</div>
  }
  if (game === 'High-Low') {
    const hl = computeHighLow(round)
    if (!hl) return <Empty label="Set up two teams to start High-Low." />
    const lead = hl.aPts === hl.bPts ? null : hl.aPts > hl.bPts ? 'A' : 'B'
    return (
      <div className="card"><div className="hl-score">
        <div className={`hl-team ${lead === 'A' ? 'win' : ''}`}><div className="hl-name">{hl.A.name}</div><div className="hl-pts">{hl.aPts}</div></div>
        <span className="hl-vs">vs</span>
        <div className={`hl-team ${lead === 'B' ? 'win' : ''}`}><div className="hl-name">{hl.B.name}</div><div className="hl-pts">{hl.bPts}</div></div>
      </div></div>
    )
  }
  if (game === 'Best Ball') {
    const bb = computeBestBall(round)
    if (!bb) return <Empty label="Set up two teams to start Best Ball." />
    const lead = bb.aHoles === bb.bHoles ? null : bb.aHoles > bb.bHoles ? 'A' : 'B'
    return (
      <div className="card"><div className="hl-score">
        <div className={`hl-team ${lead === 'A' ? 'win' : ''}`}><div className="hl-name">{bb.A.name}</div><div className="hl-pts">{bb.aHoles}</div></div>
        <span className="hl-vs">holes up</span>
        <div className={`hl-team ${lead === 'B' ? 'win' : ''}`}><div className="hl-name">{bb.B.name}</div><div className="hl-pts">{bb.bHoles}</div></div>
      </div></div>
    )
  }
  if (game === 'Scramble' && scrambleRound) {
    const rows = teams.map((t) => ({ id: t.id, member: { id: t.id, name: t.name, color: '' } }))
    const board = strokeBoard(scrambleRound, rows)
    if (board.every((b) => b.thru === 0)) return <Empty />
    return <div className="card">{board.map((b, i) => (
      <Row key={b.id} first={i === 0} rank={b.thru === 0 ? '–' : i === 0 ? '🏆' : i + 1} name={b.member.name} sub={b.thru === 0 ? 'not started' : `thru ${b.thru}`} right={b.thru === 0 ? '' : `${b.total} (${relLabel(b.rel)})`} />
    ))}</div>
  }
  // Stroke Play
  const rows = members.map((m) => ({ id: m.id, member: { id: m.id, name: m.name, color: '' } }))
  const board = strokeBoard(round, rows)
  if (board.every((b) => b.thru === 0)) return <Empty />
  return <div className="card">{board.map((b, i) => (
    <Row key={b.id} first={i === 0} rank={b.thru === 0 ? '–' : i === 0 ? '🏆' : i + 1} name={b.member.name} sub={b.thru === 0 ? 'not started' : `thru ${b.thru}`} right={b.thru === 0 ? '' : `${b.total} (${relLabel(b.rel)})`} />
  ))}</div>
}

function Empty({ label }: { label?: string }) {
  return <div className="card"><p className="muted" style={{ margin: 0 }}>{label ?? 'Enter scores below to see the standings.'}</p></div>
}

function TeamSetup({ members, teams, onAssign }: { members: SharedMember[]; teams: Team[]; onAssign: (memberId: string, teamIdx: number) => void }) {
  const teamOf = (id: string) => teams.findIndex((t) => t.memberIds.includes(id))
  return (
    <>
      <div className="section-title">Teams</div>
      <div className="card">
        {members.map((m) => {
          const ti = teamOf(m.id)
          return (
            <div className="list-row" key={m.id}>
              <span className="dot-avatar">{m.name.charAt(0).toUpperCase()}</span>
              <span style={{ flex: 1, fontWeight: 700 }}>{m.name}</span>
              <div className="team-toggle">
                {teams.map((t, i) => (
                  <button key={t.id} className={ti === i ? 'on' : ''} style={ti === i ? { background: TEAM_COLORS[i], color: '#fff' } : undefined} onClick={() => onAssign(m.id, i)}>
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
  round, memberIds, nameOf, onPick,
}: {
  round: SharedRound
  members: SharedMember[]
  memberIds: string[]
  nameOf: (id: string) => string
  onPick: (hole: number, pick: import('../types').WolfPick | null) => void
}) {
  const wolf = (round.wolf as (import('../types').WolfPick | null)[]) ?? []
  return (
    <>
      <div className="section-title">Wolf — the call each hole</div>
      <div className="card">
        {HOLES.map((h) => {
          const wolfId = wolfForHole(memberIds, h)
          const pick = wolf[h]
          const value = !pick ? '' : pick.mode === 'partner' ? `partner:${pick.partnerId}` : pick.mode
          return (
            <div className="wolf-row" key={h}>
              <span className="wolf-hole">#{h + 1}</span>
              <span className="wolf-who">🐺 {wolfId ? nameOf(wolfId) : '—'}</span>
              <select
                className="wolf-select"
                value={value}
                onChange={(e) => {
                  const v = e.target.value
                  if (!v) return onPick(h, null)
                  if (v === 'lone' || v === 'blind') return onPick(h, { mode: v as WolfMode, partnerId: null })
                  onPick(h, { mode: 'partner', partnerId: v.split(':')[1] })
                }}
              >
                <option value="">— call —</option>
                {memberIds.filter((mid) => mid !== wolfId).map((mid) => (
                  <option key={mid} value={`partner:${mid}`}>Partner: {nameOf(mid)}</option>
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
