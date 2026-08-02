import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../auth'
import {
  getRyderCup,
  saveRyderCup,
  listMembers,
  getRoundsWithScores,
  addRound,
  saveRoundGame,
  type SharedMember,
  type SharedRound,
  type SharedRyder as RyderConfig,
  type ScoreMap,
} from '../cloud'
import { chunkPairs } from '../ryder'

type Side = 'A' | 'B'

// Ryder Cup match formats a group can choose per match.
const FORMATS: {
  key: string
  label: string
  tag: string
  how: string
  oneBall: boolean
}[] = [
  { key: 'Best Ball', label: 'Best Ball', tag: 'Fourball · 2v2', how: 'Everyone plays their own ball; each hole your team takes its best (lowest) score.', oneBall: false },
  { key: 'Alternate Shot', label: 'Alternate Shot', tag: 'Foursomes · 2v2', how: 'Partners share one ball and alternate every shot.', oneBall: true },
  { key: 'Scramble', label: 'Scramble', tag: 'Team · best shot', how: 'Everyone hits, the team plays the best shot, and repeats — one team score per hole.', oneBall: true },
  { key: 'Singles', label: 'Singles', tag: '1 v 1', how: 'Everyone plays their own ball head-to-head; low score wins the hole for their side.', oneBall: false },
]
const formatOf = (game: string) =>
  FORMATS.find((f) => f.key === game) ?? { key: game, label: game, tag: 'match', how: '', oneBall: false }

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : `${Math.floor(n)}½`)

interface Session {
  round: SharedRound
  scores: ScoreMap
  aHoles: number
  bHoles: number
  thru: number
  winner: Side | 'tie' | null
  aPts: number
  bPts: number
}

function standings(config: RyderConfig, rws: { round: SharedRound; scores: ScoreMap }[]) {
  const sideIds = (side: Side) => Object.keys(config.teamOf).filter((id) => config.teamOf[id] === side)
  const a = sideIds('A'), b = sideIds('B')
  const teamHole = (ids: string[], sc: ScoreMap, hole: number) => {
    const vals = ids.map((id) => sc[id]?.[hole]).filter((v): v is number => v != null)
    return vals.length ? Math.min(...vals) : null
  }
  const sessions: Session[] = rws.map(({ round, scores }) => {
    let aHoles = 0, bHoles = 0, thru = 0
    round.holePars.forEach((_, i) => {
      const av = teamHole(a, scores, i), bv = teamHole(b, scores, i)
      if (av == null || bv == null) return
      thru++
      if (av < bv) aHoles++
      else if (bv < av) bHoles++
    })
    let winner: Side | 'tie' | null = null
    let aPts = 0, bPts = 0
    if (thru > 0) {
      winner = aHoles > bHoles ? 'A' : bHoles > aHoles ? 'B' : 'tie'
      if (winner === 'A') aPts = 1
      else if (winner === 'B') bPts = 1
      else { aPts = 0.5; bPts = 0.5 }
    }
    return { round, scores, aHoles, bHoles, thru, winner, aPts, bPts }
  })
  const aPoints = sessions.reduce((s, x) => s + x.aPts, 0)
  const bPoints = sessions.reduce((s, x) => s + x.bPts, 0)
  const total = sessions.length
  const clinch = total ? total / 2 + 0.5 : 0
  const played = sessions.filter((s) => s.winner != null).length
  let decided: Side | 'tie' | null = null
  if (total > 0) {
    if (aPoints >= clinch) decided = 'A'
    else if (bPoints >= clinch) decided = 'B'
    else if (played === total && aPoints === bPoints) decided = 'tie'
  }
  return { sessions, aPoints, bPoints, clinch, total, played, decided }
}

export default function SharedRyder() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { ready, user } = useAuth()
  const [members, setMembers] = useState<SharedMember[]>([])
  const [config, setConfig] = useState<RyderConfig | null>(null)
  const [rws, setRws] = useState<{ round: SharedRound; scores: ScoreMap }[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [course, setCourse] = useState('')

  const reload = useCallback(() => {
    Promise.all([listMembers(id), getRyderCup(id), getRoundsWithScores(id)]).then(([m, c, r]) => {
      setMembers(m); setConfig(c); setRws(r); setLoading(false)
    })
  }, [id])
  useEffect(() => reload(), [reload])

  useEffect(() => {
    if (!supabase) return
    const ch = supabase.channel(`sr-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ryder_cup', filter: `trip_id=eq.${id}` }, () => reload())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'round_scores' }, () => reload())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rounds', filter: `trip_id=eq.${id}` }, () => reload())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_members', filter: `trip_id=eq.${id}` }, () => reload())
      .subscribe()
    return () => { supabase?.removeChannel(ch) }
  }, [id, reload])

  if (ready && !user)
    return <div className="auth-wrap"><div className="card empty"><p>Sign in to view the Ryder Cup.</p><Link to="/signin" className="btn full gold" style={{ marginTop: 10 }}>Sign in</Link></div></div>
  if (loading) return <div className="card empty"><p>Loading…</p></div>

  const sideA = members.filter((m) => config?.teamOf[m.id] === 'A')
  const sideB = members.filter((m) => config?.teamOf[m.id] === 'B')
  const teamsReady = config && sideA.length > 0 && sideB.length > 0

  async function startCup() {
    const teamOf: Record<string, Side> = {}
    members.forEach((m, i) => (teamOf[m.id] = i % 2 === 0 ? 'A' : 'B'))
    const c: RyderConfig = { teamAName: 'Team USA', teamBName: 'Team Europe', teamOf }
    setConfig(c); await saveRyderCup(id, c)
  }
  async function assign(memberId: string, side: Side) {
    if (!config) return
    const c = { ...config, teamOf: { ...config.teamOf, [memberId]: side } }
    setConfig(c); await saveRyderCup(id, c)
  }
  async function rename(which: 'teamAName' | 'teamBName', name: string) {
    if (!config) return
    const c = { ...config, [which]: name }
    setConfig(c); await saveRyderCup(id, c)
  }
  async function addMatch(formatKey: string) {
    if (adding) return
    setAdding(true)
    try {
      const r = await addRound(id, course || 'Match')
      await saveRoundGame(r.id, formatKey)
      setCourse('')
      navigate(`/shared/${id}/round/${r.id}`)
    } catch {
      setAdding(false)
    }
  }

  // Step 1 — start the cup
  if (!config) {
    return (
      <>
        <div className="page-head"><h1 className="page-title">Ryder Cup</h1>
          <p className="page-sub">Two teams across the whole trip, points tallied live.</p></div>
        <div className="card empty"><div className="big">🏆</div>
          <p>Split the group into two teams, then add matches and pick a format for each.</p>
          <button className="btn full gold" style={{ marginTop: 10 }} onClick={startCup}>Start the Ryder Cup</button>
        </div>
        <Link to={`/shared/${id}`} className="btn ghost" style={{ marginTop: 16 }}>← Back to trip</Link>
      </>
    )
  }

  const s = standings(config, rws)

  return (
    <>
      <div className="page-head"><h1 className="page-title">Ryder Cup</h1></div>

      <div className="ryder-board">
        <div className={`ryder-side a ${s.aPoints > s.bPoints ? 'lead' : ''}`}><div className="ryder-side-name">{config.teamAName}</div><div className="ryder-side-pts">{fmt(s.aPoints)}</div></div>
        <div className="ryder-mid">
          {s.decided === 'A' ? <span className="ryder-status win">{config.teamAName} wins!</span>
            : s.decided === 'B' ? <span className="ryder-status win">{config.teamBName} wins!</span>
            : s.decided === 'tie' ? <span className="ryder-status">Tied</span>
            : <span className="ryder-status">{s.total ? `${fmt(s.clinch)} to clinch` : 'Add a match'}</span>}
          <span className="ryder-thru">{s.played}/{s.total} matches</span>
        </div>
        <div className={`ryder-side b ${s.bPoints > s.aPoints ? 'lead' : ''}`}><div className="ryder-side-name">{config.teamBName}</div><div className="ryder-side-pts">{fmt(s.bPoints)}</div></div>
      </div>

      {/* Step 1: teams */}
      <div className="section-title">Teams</div>
      <div className="ryder-names">
        <input className="ryder-name-input a" value={config.teamAName} onChange={(e) => rename('teamAName', e.target.value)} />
        <span className="ryder-vs-sm">vs</span>
        <input className="ryder-name-input b" value={config.teamBName} onChange={(e) => rename('teamBName', e.target.value)} />
      </div>
      <div className="card">
        {members.map((m) => {
          const side = config.teamOf[m.id]
          return (
            <div className="list-row" key={m.id}>
              <span className="dot-avatar">{m.name.charAt(0).toUpperCase()}</span>
              <span style={{ flex: 1, fontWeight: 700 }}>{m.name}</span>
              <div className="team-toggle ryder-toggle">
                <button className={side === 'A' ? 'on a' : ''} onClick={() => assign(m.id, 'A')}>{config.teamAName}</button>
                <button className={side === 'B' ? 'on b' : ''} onClick={() => assign(m.id, 'B')}>{config.teamBName}</button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Step 2 + 3: add a match (course + format) */}
      <div className="section-title">Matches</div>
      {s.sessions.map((ses) => {
        const f = formatOf(ses.round.game)
        return (
          <Link className="card shared-row" to={`/shared/${id}/round/${ses.round.id}`} key={ses.round.id}>
            <div>
              <div className="shared-row-name">{ses.round.courseName}</div>
              <div className="shared-row-dest">{f.label} · {f.tag}</div>
            </div>
            <span className="ryder-session-result">
              {ses.winner == null ? <span className="muted">not started</span>
                : ses.winner === 'tie' ? `Halved ${ses.aHoles}–${ses.bHoles}`
                : ses.winner === 'A' ? `${config.teamAName} ${ses.aHoles}–${ses.bHoles}`
                : `${config.teamBName} ${ses.bHoles}–${ses.aHoles}`}
            </span>
          </Link>
        )
      })}

      {teamsReady ? (
        <div className="card">
          <div className="field" style={{ marginBottom: 10 }}>
            <label>What course are you playing?</label>
            <input value={course} onChange={(e) => setCourse(e.target.value)} placeholder="e.g. TPC Myrtle Beach" />
          </div>
          <label className="sheet-label" style={{ marginBottom: 6 }}>Pick the format</label>
          <div className="ryder-format-grid">
            {FORMATS.map((f) => (
              <button key={f.key} className="ryder-format-pick" disabled={adding} onClick={() => addMatch(f.key)}>
                <span className="ryder-format-name">{f.label}</span>
                <span className="ryder-format-tag">{f.tag}</span>
                <span className="ryder-format-how">{f.how}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="card"><p className="muted" style={{ margin: 0 }}>Put at least one player on each team to add matches.</p></div>
      )}

      {/* Pairings for counting matches */}
      {s.sessions.length > 0 && teamsReady && (
        <>
          <div className="section-title">Playing order</div>
          {s.sessions.map((ses) => {
            const f = formatOf(ses.round.game)
            const nh = firstUnplayed(ses.round.holePars, ses.scores)
            const complete = nh >= ses.round.holePars.length
            return (
              <div className="card ryder-play" key={ses.round.id}>
                <div className="ryder-play-head">
                  <span className="ryder-format-badge">{ses.round.courseName}</span>
                  <div><div className="ryder-format-name">{f.label} <span className="ryder-format-tag">· {f.tag}</span></div><div className="ryder-format-how">{f.how}</div></div>
                </div>
                {f.key === 'Singles' ? (
                  <div className="ryder-matchups">
                    {sideA.map((a, i) => (
                      <div className="ryder-matchup" key={a.id}><span className="mu-a">{a.name}</span><span className="mu-vs">vs</span><span className="mu-b">{sideB[i] ? sideB[i].name : '—'}</span></div>
                    ))}
                  </div>
                ) : (
                  <div className="ryder-pairs">
                    {[{ name: config.teamAName, side: 'a', pairs: chunkPairs(sideA) }, { name: config.teamBName, side: 'b', pairs: chunkPairs(sideB) }].map((team) => (
                      <div className="ryder-team-pairs" key={team.side}>
                        <div className={`ryder-team-label ${team.side}`}>{team.name}</div>
                        {team.pairs.map((pair, pi) => (
                          <div className="ryder-pair" key={pi}>
                            <span className="ryder-pair-names">{pair.map((m) => m.name).join(' & ')}</span>
                            {f.key === 'Alternate Shot' && pair.length === 2 && (
                              <span className="ryder-pair-tee">{complete ? 'round complete' : <>next tee: <strong>{((nh + 1) % 2 === 1 ? pair[0] : pair[1]).name}</strong> · hole {nh + 1}</>}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </>
      )}

      <Link to={`/shared/${id}`} className="btn ghost" style={{ marginTop: 16 }}>← Back to trip</Link>
    </>
  )
}

function firstUnplayed(pars: number[], scores: ScoreMap): number {
  for (let i = 0; i < pars.length; i++) {
    const any = Object.values(scores).some((s) => s?.[i] != null)
    if (!any) return i
  }
  return pars.length
}
