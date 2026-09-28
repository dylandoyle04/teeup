import { useLocalSearchParams } from 'expo-router'
import { useMemo, useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { useStore } from '@shared/store'
import type { ID, Member } from '@shared/types'
import BetMemberPicker from '@/components/BetMemberPicker'
import { Field, Input } from '@/components/Field'
import Screen from '@/components/Screen'
import { Avatar, Button, Card, PageTitle, SectionTitle, T, money } from '@/components/ui'
import { colors, fonts } from '@/theme'

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
    if (from && to && pay > 0.01) result.push({ from, to, amount: pay })
    debtors[i].bal -= pay
    creditors[j].bal -= pay
    if (debtors[i].bal < 0.01) i++
    if (creditors[j].bal < 0.01) j++
  }
  return result
}

export default function Bets() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>()
  const trip = useStore((s) => s.trips.find((t) => t.id === tripId))
  const allMembers = useStore((s) => s.members)
  const currentMemberId = useStore((s) => s.currentMemberId)
  const addBet = useStore((s) => s.addBet)
  const toggleBetSettled = useStore((s) => s.toggleBetSettled)
  const deleteBet = useStore((s) => s.deleteBet)

  const members = useMemo(() => {
    if (!trip) return []
    const map = new Map(allMembers.map((m) => [m.id, m]))
    return trip.memberIds.map((id) => map.get(id)).filter((m): m is Member => Boolean(m))
  }, [trip, allMembers])

  const [desc, setDesc] = useState('')
  const [fromSel, setFromId] = useState(currentMemberId)
  const [toId, setToId] = useState('')
  const [amount, setAmount] = useState('')

  if (!trip) return null

  const byId = new Map(members.map((m) => [m.id, m]))
  const fromId = byId.has(fromSel) ? fromSel : (members[0]?.id ?? '')
  const otherId = (toId && toId !== fromId ? toId : '') || members.find((m) => m.id !== fromId)?.id || ''

  // net balances from unsettled bets only
  const net = new Map<ID, number>()
  for (const m of members) net.set(m.id, 0)
  for (const b of trip.bets) {
    if (b.settled) continue
    net.set(b.fromId, (net.get(b.fromId) ?? 0) - b.amount)
    net.set(b.toId, (net.get(b.toId) ?? 0) + b.amount)
  }
  const settlements = settleUp(members, net)

  const amt = Number(amount.replace(',', '.'))
  const canAdd = amt > 0 && !!fromId && !!otherId && fromId !== otherId

  function submit() {
    if (!canAdd) return
    addBet(tripId, { description: desc, fromId, toId: otherId, amount: amt })
    setDesc('')
    setAmount('')
  }

  function confirmDelete(betId: string, label: string) {
    Alert.alert('Delete wager?', label, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteBet(tripId, betId) },
    ])
  }

  return (
    <Screen>
      <PageTitle sub="Everyone pays their own way. Log wagers and side games — we'll tally who owes whom.">
        Betting Tracker
      </PageTitle>

      {/* Settle up summary */}
      <SectionTitle style={{ marginTop: 0 }}>Settle Up</SectionTitle>
      <Card style={{ paddingVertical: settlements.length ? 4 : 16 }}>
        {settlements.length === 0 ? (
          <T style={{ color: colors.muted }}>All square 🎉 No open debts.</T>
        ) : (
          settlements.map((s, i) => (
            <View key={i} style={[st.settleRow, i === settlements.length - 1 && st.last]}>
              <View style={st.settleWho}>
                <Avatar member={s.from} size={28} />
                <T style={st.bold} numberOfLines={1}>
                  {s.from.name}
                </T>
                <T style={{ color: colors.muted }}>pays</T>
                <Avatar member={s.to} size={28} />
                <T style={st.bold} numberOfLines={1}>
                  {s.to.name}
                </T>
              </View>
              <Text style={st.owes}>{money(s.amount)}</Text>
            </View>
          ))
        )}
      </Card>

      {/* Per-player net */}
      <Card style={{ marginTop: 12, paddingVertical: 4 }}>
        {members.map((m, i) => {
          const bal = net.get(m.id) ?? 0
          return (
            <View key={m.id} style={[st.row, i === members.length - 1 && st.last]}>
              <Avatar member={m} size={30} />
              <T style={[st.bold, { flex: 1 }]} numberOfLines={1}>
                {m.name}
              </T>
              {Math.abs(bal) < 0.01 ? (
                <T style={{ color: colors.muted }}>even</T>
              ) : bal > 0 ? (
                <Text style={st.owed}>+{money(bal)}</Text>
              ) : (
                <Text style={st.owes}>−{money(-bal)}</Text>
              )}
            </View>
          )
        })}
      </Card>

      {/* Add a wager */}
      <SectionTitle>Add a Wager</SectionTitle>
      <Card>
        <Field label="What was the bet?">
          <Input value={desc} onChangeText={setDesc} placeholder="Front nine skins, closest to pin #7…" returnKeyType="next" />
        </Field>
        <Field label="Who owes">
          <BetMemberPicker members={members} value={fromId} onChange={setFromId} />
        </Field>
        <Field label="Pays">
          <BetMemberPicker members={members.filter((m) => m.id !== fromId)} value={otherId} onChange={setToId} />
        </Field>
        <Field label="Amount">
          <Input
            value={amount}
            onChangeText={setAmount}
            placeholder="20"
            keyboardType="decimal-pad"
            returnKeyType="done"
            onSubmitEditing={submit}
          />
        </Field>
        <Button title="Add to tally" onPress={submit} disabled={!canAdd} />
      </Card>

      {/* History */}
      <SectionTitle>All Wagers · {trip.bets.length}</SectionTitle>
      {trip.bets.length === 0 ? (
        <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
          <Text style={{ fontSize: 40, marginBottom: 8 }}>💰</Text>
          <T style={{ textAlign: 'center', color: colors.muted }}>No bets yet. Add your first wager above.</T>
        </Card>
      ) : (
        <Card style={{ paddingVertical: 4 }}>
          {trip.bets.map((b, i) => {
            const from = byId.get(b.fromId)
            const to = byId.get(b.toId)
            return (
              <View key={b.id} style={[st.row, i === trip.bets.length - 1 && st.last]}>
                <View style={{ flex: 1 }}>
                  <T
                    style={[
                      st.bold,
                      b.settled && { textDecorationLine: 'line-through', color: colors.muted },
                    ]}
                  >
                    {b.description}
                  </T>
                  <T style={{ color: colors.muted, fontSize: 13, lineHeight: 18 }}>
                    {from?.name ?? '?'} → {to?.name ?? '?'} · {money(b.amount)}
                  </T>
                </View>
                <Button
                  small
                  title={b.settled ? 'Settled' : 'Settle'}
                  variant={b.settled ? 'subtle' : 'ghost'}
                  onPress={() => toggleBetSettled(tripId, b.id)}
                />
                <Pressable
                  onPress={() => confirmDelete(b.id, b.description)}
                  accessibilityRole="button"
                  accessibilityLabel="Delete wager"
                  hitSlop={10}
                  style={st.iconBtn}
                >
                  <Text style={{ color: colors.muted, fontSize: 16 }}>✕</Text>
                </Pressable>
              </View>
            )
          })}
        </Card>
      )}
    </Screen>
  )
}

const st = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  last: { borderBottomWidth: 0 },
  settleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  settleWho: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, flexWrap: 'wrap' },
  bold: { fontFamily: fonts.sansBold, flexShrink: 1 },
  owes: { color: colors.danger, fontFamily: fonts.sansBold, fontSize: 15 },
  owed: { color: colors.green600, fontFamily: fonts.sansBold, fontSize: 15 },
  iconBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
})
