import { Link, useParams } from 'react-router-dom'
import { useStore } from '../store'
import { Avatar } from '../components/ui'
import type { Member } from '../types'
import {
  computeRyder,
  chunkPairs,
  nextHole,
  type SessionResult,
  type Side,
} from '../ryder'

export default function RyderCup() {
  const { tripId = '' } = useParams()
  const trip = useStore((s) => s.getTrip(tripId))
  const members = useStore((s) => s.tripMembers(tripId))
  const setRyderCup = useStore((s) => s.setRyderCup)

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

  const rc = trip.ryderCup
  const standings = computeRyder(trip)

  function assign(memberId: string, side: Side) {
    const base = rc ?? {
      teamAName: 'Team USA',
      teamBName: 'Team Europe',
      teamOf: {},
    }
    setRyderCup(tripId, {
      ...base,
      teamOf: { ...base.teamOf, [memberId]: side },
    })
  }

  function rename(which: 'teamAName' | 'teamBName', name: string) {
    if (!rc) return
    setRyderCup(tripId, { ...rc, [which]: name })
  }

  function startCup() {
    // seed balanced sides by order
    const teamOf: Record<string, Side> = {}
    members.forEach((m, i) => (teamOf[m.id] = i % 2 === 0 ? 'A' : 'B'))
    setRyderCup(tripId, {
      teamAName: 'Team USA',
      teamBName: 'Team Europe',
      teamOf,
    })
  }

  function endCup() {
    if (confirm('Turn off the Ryder Cup for this trip? Team assignments are cleared.'))
      setRyderCup(tripId, undefined)
  }

  const aCount = rc ? Object.values(rc.teamOf).filter((s) => s === 'A').length : 0
  const bCount = rc ? Object.values(rc.teamOf).filter((s) => s === 'B').length : 0

  return (
    <>
      <h1 className="page-title">Ryder Cup</h1>
      <p className="page-sub">
        Two teams, one trip. Play a different format each day and rack up points
        toward the cup.
      </p>

      {!rc ? (
        <div className="card empty">
          <div className="big">🏆</div>
          <p>
            Start a Ryder Cup to split the group into two teams and compete
            across every round of the trip.
          </p>
          <button className="btn full gold" onClick={startCup} style={{ marginTop: 10 }}>
            Start the Ryder Cup
          </button>
        </div>
      ) : (
        <>
          {standings && (
            <RyderScoreboard trip={trip} />
          )}

          <div className="section-title">Teams</div>
          <div className="ryder-names">
            <input
              className="ryder-name-input a"
              value={rc.teamAName}
              onChange={(e) => rename('teamAName', e.target.value)}
              aria-label="Team A name"
            />
            <span className="ryder-vs-sm">vs</span>
            <input
              className="ryder-name-input b"
              value={rc.teamBName}
              onChange={(e) => rename('teamBName', e.target.value)}
              aria-label="Team B name"
            />
          </div>
          <div className="card">
            {members.map((m) => {
              const side = rc.teamOf[m.id]
              return (
                <div className="list-row" key={m.id}>
                  <Avatar member={m} size="sm" />
                  <span style={{ flex: 1, fontWeight: 700 }}>{m.name}</span>
                  <div className="team-toggle ryder-toggle">
                    <button
                      className={side === 'A' ? 'on a' : ''}
                      onClick={() => assign(m.id, 'A')}
                    >
                      {rc.teamAName}
                    </button>
                    <button
                      className={side === 'B' ? 'on b' : ''}
                      onClick={() => assign(m.id, 'B')}
                    >
                      {rc.teamBName}
                    </button>
                  </div>
                </div>
              )
            })}
            {(aCount === 0 || bCount === 0) && (
              <p className="hint" style={{ margin: '8px 4px 0' }}>
                Put at least one player on each side to start scoring.
              </p>
            )}
          </div>

          {aCount > 0 && bCount > 0 && (
            <PlayingOrder trip={trip} members={members} />
          )}

          <button className="btn ghost" style={{ marginTop: 16 }} onClick={endCup}>
            End Ryder Cup
          </button>
        </>
      )}
    </>
  )
}

function RyderScoreboard({ trip }: { trip: NonNullable<ReturnType<typeof useStore.getState>['trips'][number]> }) {
  const setRoundRyder = useStore((st) => st.setRoundRyder)
  const s = computeRyder(trip)!
  const rc = trip.ryderCup!
  const aLead = s.aPoints > s.bPoints
  const bLead = s.bPoints > s.aPoints
  const fmt = (n: number) => (Number.isInteger(n) ? String(n) : `${Math.floor(n)}½`)

  return (
    <>
      <div className="ryder-board">
        <div className={`ryder-side a ${aLead ? 'lead' : ''}`}>
          <div className="ryder-side-name">{rc.teamAName}</div>
          <div className="ryder-side-pts">{fmt(s.aPoints)}</div>
        </div>
        <div className="ryder-mid">
          {s.decided === 'A' ? (
            <span className="ryder-status win">{rc.teamAName} wins!</span>
          ) : s.decided === 'B' ? (
            <span className="ryder-status win">{rc.teamBName} wins!</span>
          ) : s.decided === 'tie' ? (
            <span className="ryder-status">Tied — cup shared</span>
          ) : (
            <span className="ryder-status">
              {fmt(s.clinch)} to clinch
            </span>
          )}
          <span className="ryder-thru">
            {s.played}/{s.totalSessions} sessions
          </span>
        </div>
        <div className={`ryder-side b ${bLead ? 'lead' : ''}`}>
          <div className="ryder-side-name">{rc.teamBName}</div>
          <div className="ryder-side-pts">{fmt(s.bPoints)}</div>
        </div>
      </div>

      {s.sessions.length > 0 && (
        <div className="card" style={{ marginTop: 12 }}>
          {s.sessions.map((ses) => (
            <div
              className={`ryder-session ${ses.counts ? '' : 'off'}`}
              key={ses.round.id}
            >
              <span className="ryder-session-day">
                {ses.counts ? `Day ${ses.index + 1}` : '—'}
              </span>
              <div className="ryder-session-mid">
                <div className="ryder-session-course">{ses.round.courseName}</div>
                <div className="ryder-session-fmt">
                  {ses.counts && ses.format
                    ? `${ses.format.name} · ${ses.format.tag}`
                    : 'Not counting'}
                </div>
              </div>
              {ses.counts ? (
                <span className="ryder-session-result">
                  {ses.winner == null ? (
                    <span className="muted">not started</span>
                  ) : ses.winner === 'tie' ? (
                    `Halved ${ses.aHoles}–${ses.bHoles}`
                  ) : ses.winner === 'A' ? (
                    `${rc.teamAName} ${ses.aHoles}–${ses.bHoles}`
                  ) : (
                    `${rc.teamBName} ${ses.bHoles}–${ses.aHoles}`
                  )}
                </span>
              ) : (
                <span className="ryder-session-result muted">off</span>
              )}
              <button
                className={`ryder-count-toggle ${ses.counts ? 'on' : ''}`}
                onClick={() => setRoundRyder(trip.id, ses.round.id, !ses.counts)}
                aria-pressed={ses.counts}
                title={ses.counts ? 'Counts toward the cup' : 'Not counting'}
              >
                <span className="knob" />
              </button>
            </div>
          ))}
          <p className="hint" style={{ margin: '8px 4px 0' }}>
            Toggle a round off to keep it casual — only counting rounds award
            Ryder Cup points.
          </p>
        </div>
      )}
    </>
  )
}

function PlayingOrder({
  trip,
  members,
}: {
  trip: NonNullable<ReturnType<typeof useStore.getState>['trips'][number]>
  members: Member[]
}) {
  const s = computeRyder(trip)
  const rc = trip.ryderCup
  if (!s || !rc) return null
  const counting = s.sessions.filter((x) => x.counts)
  if (counting.length === 0) return null

  const sideA = members.filter((m) => rc.teamOf[m.id] === 'A')
  const sideB = members.filter((m) => rc.teamOf[m.id] === 'B')

  return (
    <>
      <div className="section-title">Playing order</div>
      {counting.map((ses) => (
        <SessionPlay
          key={ses.round.id}
          session={ses}
          rc={rc}
          sideA={sideA}
          sideB={sideB}
        />
      ))}
      <p className="hint" style={{ margin: '2px 4px 0' }}>
        Pairs are made from your team order — reshuffle a side above to change
        them. Enter scores on the Scorecard; points here update automatically.
      </p>
    </>
  )
}

function SessionPlay({
  session,
  rc,
  sideA,
  sideB,
}: {
  session: SessionResult
  rc: NonNullable<ReturnType<typeof useStore.getState>['trips'][number]>['ryderCup']
  sideA: Member[]
  sideB: Member[]
}) {
  if (!rc || !session.format) return null
  const f = session.format
  const nh = nextHole(session.round)
  const complete = nh >= session.round.holePars.length
  const holeNum = nh + 1

  return (
    <div className="card ryder-play">
      <div className="ryder-play-head">
        <span className="ryder-format-badge">Day {session.index + 1}</span>
        <div>
          <div className="ryder-format-name">
            {f.name} <span className="ryder-format-tag">· {f.tag}</span>
          </div>
          <div className="ryder-format-how">{f.how}</div>
        </div>
      </div>

      {f.name === 'Singles' ? (
        <div className="ryder-matchups">
          {sideA.map((a, i) => {
            const b = sideB[i]
            return (
              <div className="ryder-matchup" key={a.id}>
                <span className="mu-a">{a.name}</span>
                <span className="mu-vs">vs</span>
                <span className="mu-b">{b ? b.name : '—'}</span>
              </div>
            )
          })}
          {sideB.length > sideA.length &&
            sideB.slice(sideA.length).map((b) => (
              <div className="ryder-matchup" key={b.id}>
                <span className="mu-a">—</span>
                <span className="mu-vs">vs</span>
                <span className="mu-b">{b.name}</span>
              </div>
            ))}
        </div>
      ) : (
        // Fourball & Foursomes: show each team's pairs
        <div className="ryder-pairs">
          {[
            { name: rc.teamAName, side: 'a', pairs: chunkPairs(sideA) },
            { name: rc.teamBName, side: 'b', pairs: chunkPairs(sideB) },
          ].map((team) => (
            <div className="ryder-team-pairs" key={team.side}>
              <div className={`ryder-team-label ${team.side}`}>{team.name}</div>
              {team.pairs.map((pair, pi) => (
                <div className="ryder-pair" key={pi}>
                  <span className="ryder-pair-names">
                    {pair.map((m) => m.name).join(' & ')}
                  </span>
                  {f.name === 'Foursomes' && pair.length === 2 && (
                    <span className="ryder-pair-tee">
                      {complete ? (
                        'round complete'
                      ) : (
                        <>
                          next tee:{' '}
                          <strong>
                            {(holeNum % 2 === 1 ? pair[0] : pair[1]).name}
                          </strong>{' '}
                          · hole {holeNum}
                        </>
                      )}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {f.name === 'Foursomes' && (
        <p className="hint" style={{ margin: '6px 4px 0' }}>
          Partners share one ball and alternate every shot; the listed player
          tees this hole, then you switch off.
        </p>
      )}
    </div>
  )
}
