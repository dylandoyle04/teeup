import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../store'
import type { ID, Member } from '../types'
import { Avatar, money } from '../components/ui'

interface Settlement {
  from: Member
  to: Member
  amount: number
}

/** Greedy minimal settle-up from net balances. */
function settleUp(members: Member[], net: Map<ID, number>): Settlement[] {
  const byId = new Map(members.map((m) => [m.id, m]))
  const debtors = members
    .map((m) => ({ id: m.id, bal: net.get(m.id) ?? 0 }))
    .filter((x) => x.bal < -0.01)
    .map((x) => ({ ...x, bal: -x.bal }))
    .sort((a, b) => b.bal - a.bal)
  const creditors = members
    .map((m) => ({ id: m.id, bal: net.get(m.id) ?? 0 }))
    .filter((x) => x.bal > 0.01)
    .sort((a, b) => b.bal - a.bal)

  const result: Settlement[] = []
  let i = 0
  let j = 0
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].bal, creditors[j].bal)
    const from = byId.get(debtors[i].id)
    const to = byId.get(creditors[j].id)
    if (from && to && pay > 0.01) {
      result.push({ from, to, amount: pay })
    }
    debtors[i].bal -= pay
    creditors[j].bal -= pay
    if (debtors[i].bal < 0.01) i++
    if (creditors[j].bal < 0.01) j++
  }
  return result
}

export default function Bets() {
  const { tripId = '' } = useParams()
  const trip = useStore((s) => s.getTrip(tripId))
  const members = useStore((s) => s.tripMembers(tripId))
  const currentMemberId = useStore((s) => s.currentMemberId)
  const addBet = useStore((s) => s.addBet)
  const toggleBetSettled = useStore((s) => s.toggleBetSettled)
  const deleteBet = useStore((s) => s.deleteBet)

  const [desc, setDesc] = useState('')
  const [fromId, setFromId] = useState(currentMemberId)
  const [toId, setToId] = useState('')
  const [amount, setAmount] = useState('')

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

  const byId = new Map(members.map((m) => [m.id, m]))
  const otherId = toId || members.find((m) => m.id !== fromId)?.id || ''

  // net balances from unsettled bets only
  const net = new Map<ID, number>()
  for (const m of members) net.set(m.id, 0)
  for (const b of trip.bets) {
    if (b.settled) continue
    net.set(b.fromId, (net.get(b.fromId) ?? 0) - b.amount)
    net.set(b.toId, (net.get(b.toId) ?? 0) + b.amount)
  }
  const settlements = settleUp(members, net)

  const canAdd =
    Number(amount) > 0 && fromId && otherId && fromId !== otherId

  function submit() {
    if (!canAdd) return
    addBet(tripId, {
      description: desc,
      fromId,
      toId: otherId,
      amount: Number(amount),
    })
    setDesc('')
    setAmount('')
  }

  return (
    <>
      <h1 className="page-title">Betting Tracker</h1>
      <p className="page-sub">
        Everyone pays their own way. Log wagers and side games — we'll tally who
        owes whom.
      </p>

      {/* Settle up summary */}
      <div className="section-title">Settle Up</div>
      <div className="card">
        {settlements.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            All square 🎉 No open debts.
          </p>
        ) : (
          settlements.map((s, i) => (
            <div className="settle-row" key={i}>
              <div className="row" style={{ gap: 8 }}>
                <Avatar member={s.from} size="sm" />
                <span style={{ fontWeight: 700 }}>{s.from.name}</span>
                <span className="muted">pays</span>
                <Avatar member={s.to} size="sm" />
                <span style={{ fontWeight: 700 }}>{s.to.name}</span>
              </div>
              <span className="owes">{money(s.amount)}</span>
            </div>
          ))
        )}
      </div>

      {/* Per-player net */}
      <div className="card">
        {members.map((m) => {
          const bal = net.get(m.id) ?? 0
          return (
            <div className="list-row" key={m.id}>
              <Avatar member={m} size="sm" />
              <span style={{ flex: 1, fontWeight: 700 }}>{m.name}</span>
              {Math.abs(bal) < 0.01 ? (
                <span className="muted">even</span>
              ) : bal > 0 ? (
                <span className="owed">+{money(bal)}</span>
              ) : (
                <span className="owes">−{money(-bal)}</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Add a wager */}
      <div className="section-title">Add a Wager</div>
      <div className="card">
        <div className="field">
          <label>What was the bet?</label>
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Front nine skins, closest to pin #7…"
          />
        </div>
        <div className="two-col">
          <div className="field">
            <label>Who owes</label>
            <select value={fromId} onChange={(e) => setFromId(e.target.value)}>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Pays</label>
            <select
              value={otherId}
              onChange={(e) => setToId(e.target.value)}
            >
              {members
                .filter((m) => m.id !== fromId)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
        <div className="field">
          <label>Amount</label>
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="20"
          />
        </div>
        <button className="btn full" onClick={submit} disabled={!canAdd}>
          Add to tally
        </button>
      </div>

      {/* History */}
      <div className="section-title">All Wagers · {trip.bets.length}</div>
      {trip.bets.length === 0 ? (
        <div className="card empty">
          <div className="big">💰</div>
          <p>No bets yet. Add your first wager above.</p>
        </div>
      ) : (
        <div className="card">
          {trip.bets.map((b) => {
            const from = byId.get(b.fromId)
            const to = byId.get(b.toId)
            return (
              <div className="list-row" key={b.id}>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      textDecoration: b.settled ? 'line-through' : 'none',
                      color: b.settled ? 'var(--muted)' : 'inherit',
                    }}
                  >
                    {b.description}
                  </div>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {from?.name ?? '?'} → {to?.name ?? '?'} · {money(b.amount)}
                  </div>
                </div>
                <button
                  className={`btn sm ${b.settled ? 'subtle' : 'ghost'}`}
                  onClick={() => toggleBetSettled(tripId, b.id)}
                >
                  {b.settled ? 'Settled' : 'Settle'}
                </button>
                <button
                  className="icon-btn"
                  aria-label="Delete wager"
                  onClick={() => deleteBet(tripId, b.id)}
                >
                  ✕
                </button>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
