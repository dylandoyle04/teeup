import { useEffect, useRef, useState, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../auth'
import {
  getRound,
  listMembers,
  getRoundScores,
  saveMemberScores,
  type SharedRound,
  type SharedMember,
  type ScoreMap,
} from '../cloud'

const HOLES = Array.from({ length: 18 }, (_, i) => i)
const sum = (a: (number | null)[]) => a.reduce<number>((s, v) => s + (v ?? 0), 0)

export default function ShareScorecard() {
  const { id = '', roundId = '' } = useParams()
  const { ready, user } = useAuth()
  const [round, setRound] = useState<SharedRound | null>(null)
  const [members, setMembers] = useState<SharedMember[]>([])
  const [scores, setScores] = useState<ScoreMap>({})
  const [loading, setLoading] = useState(true)
  const editingRef = useRef<string | null>(null)

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

  // live: merge incoming score changes (skip the row this device is editing)
  useEffect(() => {
    if (!supabase) return
    const ch = supabase
      .channel(`scores-${roundId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'round_scores', filter: `round_id=eq.${roundId}` },
        (payload) => {
          const row = payload.new as { member_id?: string; strokes?: (number | null)[] }
          if (!row?.member_id) return
          if (row.member_id === editingRef.current) return
          setScores((prev) => ({ ...prev, [row.member_id!]: row.strokes ?? Array(18).fill(null) }))
        },
      )
      .subscribe()
    return () => {
      supabase?.removeChannel(ch)
    }
  }, [roundId])

  const setCell = useCallback(
    (memberId: string, hole: number, value: string) => {
      const n = value === '' ? null : Math.min(15, Math.max(1, Number(value.replace(/\D/g, '')) || 0)) || null
      setScores((prev) => {
        const cur = prev[memberId] ? [...prev[memberId]] : Array(18).fill(null)
        cur[hole] = n
        // persist this member's row
        saveMemberScores(roundId, memberId, cur)
        return { ...prev, [memberId]: cur }
      })
    },
    [roundId],
  )

  if (ready && !user)
    return (
      <div className="auth-wrap">
        <div className="card empty">
          <p>Sign in to view this scorecard.</p>
          <Link to="/signin" className="btn full gold" style={{ marginTop: 10 }}>Sign in</Link>
        </div>
      </div>
    )
  if (loading) return <div className="card empty"><p>Loading…</p></div>
  if (!round) return <div className="card empty"><p>Round not found.</p><Link to={`/shared/${id}`} className="btn subtle sm">Back</Link></div>

  const pars = round.holePars
  const totalPar = sum(pars)

  // leaderboard
  const board = members
    .map((m) => {
      const s = scores[m.id] ?? []
      const thru = s.filter((v) => v != null).length
      const total = sum(s)
      const parThru = pars.reduce((acc, p, i) => acc + (s[i] != null ? p : 0), 0)
      return { m, thru, total, rel: total - parThru }
    })
    .filter((r) => r.thru > 0)
    .sort((a, b) => a.rel - b.rel)

  const relLabel = (r: number) => (r === 0 ? 'E' : r > 0 ? `+${r}` : `${r}`)

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">{round.courseName}</h1>
        <p className="page-sub">Par {totalPar} · live scorecard</p>
      </div>

      {board.length > 0 && (
        <>
          <div className="section-title">Leaderboard</div>
          <div className="card">
            {board.map((b, i) => (
              <div className={`lb-row ${i === 0 ? 'first' : ''}`} key={b.m.id}>
                <span className="lb-rank">{i === 0 ? '🏆' : i + 1}</span>
                <span className="dot-avatar">{b.m.name.charAt(0).toUpperCase()}</span>
                <span className="lb-name">{b.m.name}</span>
                <span className="lb-rel">thru {b.thru}</span>
                <span className="lb-score" style={{ marginLeft: 10 }}>{b.total}</span>
                <span className="lb-rel" style={{ marginLeft: 8, minWidth: 30, textAlign: 'right' }}>
                  {relLabel(b.rel)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="section-title">Enter scores</div>
      <p className="hint" style={{ margin: '-4px 4px 10px' }}>
        Everyone's scores sync live. Type a number in your row.
      </p>
      <div className="card flush">
        <div className="scorecard-wrap">
          <table className="scorecard">
            <thead>
              <tr>
                <th className="name-cell">Hole</th>
                {HOLES.map((h) => (
                  <th key={h}>{h + 1}</th>
                ))}
                <th>TOT</th>
              </tr>
            </thead>
            <tbody>
              <tr className="par-row">
                <td className="name-cell">Par</td>
                {HOLES.map((h) => (
                  <td key={h}>{pars[h]}</td>
                ))}
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
                          onFocus={(e) => {
                            editingRef.current = m.id
                            e.currentTarget.select()
                          }}
                          onBlur={() => {
                            editingRef.current = null
                          }}
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

      <Link to={`/shared/${id}`} className="btn ghost" style={{ marginTop: 16 }}>
        ← Back to trip
      </Link>
    </>
  )
}
