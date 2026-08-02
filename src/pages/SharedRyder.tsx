import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../auth'
import {
  getRyderCup,
  saveRyderCup,
  listMembers,
  getRoundsWithScores,
  type SharedMember,
  type SharedRyder as RyderConfig,
} from '../cloud'
import type { Trip } from '../types'
import { computeRyder, chunkPairs, nextHole, formatForIndex, type Side } from '../ryder'

// Build a minimal Trip-shaped object so we can reuse the tested Ryder engine.
function pseudoTrip(
  rws: { round: { id: string; courseName: string; holePars: number[] }; scores: Record<string, (number | null)[]> }[],
  config: RyderConfig,
): Trip {
  return {
    rounds: rws.map((x) => ({
      id: x.round.id,
      courseName: x.round.courseName,
      holePars: x.round.holePars,
      scores: x.scores,
      ryder: true,
    })),
    ryderCup: config,
  } as unknown as Trip
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : `${Math.floor(n)}½`)

export default function SharedRyder() {
  const { id = '' } = useParams()
  const { ready, user } = useAuth()
  const [members, setMembers] = useState<SharedMember[]>([])
  const [config, setConfig] = useState<RyderConfig | null>(null)
  const [rws, setRws] = useState<
    { round: { id: string; courseName: string; holePars: number[] }; scores: Record<string, (number | null)[]> }[]
  >([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(() => {
    Promise.all([listMembers(id), getRyderCup(id), getRoundsWithScores(id)]).then(
      ([m, c, r]) => {
        setMembers(m)
        setConfig(c)
        setRws(r as never)
        setLoading(false)
      },
    )
  }, [id])

  useEffect(() => reload(), [reload])

  useEffect(() => {
    if (!supabase) return
    const ch = supabase
      .channel(`ryder-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ryder_cup', filter: `trip_id=eq.${id}` }, () => reload())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'round_scores' }, () => reload())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_members', filter: `trip_id=eq.${id}` }, () => reload())
      .subscribe()
    return () => {
      supabase?.removeChannel(ch)
    }
  }, [id, reload])

  if (ready && !user)
    return (
      <div className="auth-wrap">
        <div className="card empty">
          <p>Sign in to view the Ryder Cup.</p>
          <Link to="/signin" className="btn full gold" style={{ marginTop: 10 }}>Sign in</Link>
        </div>
      </div>
    )
  if (loading) return <div className="card empty"><p>Loading…</p></div>

  async function startCup() {
    const teamOf: Record<string, Side> = {}
    members.forEach((m, i) => (teamOf[m.id] = i % 2 === 0 ? 'A' : 'B'))
    const c: RyderConfig = { teamAName: 'Team USA', teamBName: 'Team Europe', teamOf }
    setConfig(c)
    await saveRyderCup(id, c)
  }
  async function assign(memberId: string, side: Side) {
    if (!config) return
    const c = { ...config, teamOf: { ...config.teamOf, [memberId]: side } }
    setConfig(c)
    await saveRyderCup(id, c)
  }
  async function rename(which: 'teamAName' | 'teamBName', name: string) {
    if (!config) return
    const c = { ...config, [which]: name }
    setConfig(c)
    await saveRyderCup(id, c)
  }

  if (!config) {
    return (
      <>
        <div className="page-head">
          <h1 className="page-title">Ryder Cup</h1>
          <p className="page-sub">Two teams across the whole trip, points tallied live.</p>
        </div>
        <div className="card empty">
          <div className="big">🏆</div>
          <p>Split the group into two teams and compete across every round.</p>
          <button className="btn full gold" style={{ marginTop: 10 }} onClick={startCup}>
            Start the Ryder Cup
          </button>
        </div>
        <Link to={`/shared/${id}`} className="btn ghost" style={{ marginTop: 16 }}>← Back to trip</Link>
      </>
    )
  }

  const s = computeRyder(pseudoTrip(rws, config))!
  const sideA = members.filter((m) => config.teamOf[m.id] === 'A')
  const sideB = members.filter((m) => config.teamOf[m.id] === 'B')
  const counting = s.sessions.filter((x) => x.counts)

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Ryder Cup</h1>
      </div>

      <div className="ryder-board">
        <div className={`ryder-side a ${s.aPoints > s.bPoints ? 'lead' : ''}`}>
          <div className="ryder-side-name">{config.teamAName}</div>
          <div className="ryder-side-pts">{fmt(s.aPoints)}</div>
        </div>
        <div className="ryder-mid">
          {s.decided === 'A' ? <span className="ryder-status win">{config.teamAName} wins!</span>
            : s.decided === 'B' ? <span className="ryder-status win">{config.teamBName} wins!</span>
            : s.decided === 'tie' ? <span className="ryder-status">Tied</span>
            : <span className="ryder-status">{fmt(s.clinch)} to clinch</span>}
          <span className="ryder-thru">{s.played}/{s.totalSessions} sessions</span>
        </div>
        <div className={`ryder-side b ${s.bPoints > s.aPoints ? 'lead' : ''}`}>
          <div className="ryder-side-name">{config.teamBName}</div>
          <div className="ryder-side-pts">{fmt(s.bPoints)}</div>
        </div>
      </div>

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

      {counting.length > 0 && (
        <>
          <div className="section-title">Playing order</div>
          {counting.map((ses) => {
            const round = rws.find((x) => x.round.id === ses.round.id)?.round
            const nh = round ? nextHole({ holePars: round.holePars, scores: rws.find((x) => x.round.id === ses.round.id)!.scores } as never) : 18
            const f = ses.format ?? formatForIndex(ses.index)
            const complete = nh >= 18
            return (
              <div className="card ryder-play" key={ses.round.id}>
                <div className="ryder-play-head">
                  <span className="ryder-format-badge">Day {ses.index + 1}</span>
                  <div>
                    <div className="ryder-format-name">{f.name} <span className="ryder-format-tag">· {f.tag}</span></div>
                    <div className="ryder-format-how">{f.how}</div>
                  </div>
                </div>
                {f.name === 'Singles' ? (
                  <div className="ryder-matchups">
                    {sideA.map((a, i) => (
                      <div className="ryder-matchup" key={a.id}>
                        <span className="mu-a">{a.name}</span><span className="mu-vs">vs</span>
                        <span className="mu-b">{sideB[i] ? sideB[i].name : '—'}</span>
                      </div>
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
                            {f.name === 'Foursomes' && pair.length === 2 && (
                              <span className="ryder-pair-tee">
                                {complete ? 'round complete' : <>next tee: <strong>{((nh + 1) % 2 === 1 ? pair[0] : pair[1]).name}</strong> · hole {nh + 1}</>}
                              </span>
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
