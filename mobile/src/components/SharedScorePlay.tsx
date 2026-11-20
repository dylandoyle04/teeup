// Full-screen scoring for a shared (live) round: a distraction-free modal
// that reuses the app's HoleStepper (same − / + entry as the local scorer)
// and <Results> leaderboard. Writes go through the same optimistic,
// debounced save queue as the live scorecard (useSharedRound.setScore).
import { useKeepAwake } from 'expo-keep-awake'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { Member, Round } from '@shared/types'
import HoleStepper from '@/components/HoleStepper'
import { Results, tick, type ScoreRow } from '@/components/ScoreParts'
import { SharedSaveBadge } from '@/components/SharedScoreParts'
import type { SaveStatus } from '@/components/SharedScoreSync'
import { colors, fonts } from '@/theme'

type Props = {
  /** round whose scores are per member (what gets entered) */
  round: Round
  rows: ScoreRow[]
  /** round + rows for the standings (team rows for Scramble) */
  resultsRound: Round
  resultsRows: ScoreRow[]
  members: Member[]
  yards: number[] | null
  saveStatus: SaveStatus
  commitScore: (rowId: string, hole: number, value: number | null) => void
  onClose: () => void
}

export default function SharedScorePlay({ visible, ...props }: Props & { visible: boolean }) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={props.onClose}>
      {visible && <PlayBody {...props} />}
    </Modal>
  )
}

function PlayBody({ round, rows, resultsRound, resultsRows, members, yards, saveStatus, commitScore, onClose }: Props) {
  useKeepAwake()
  const insets = useSafeAreaInsets()
  return (
    <View style={ps.root}>
      <View style={[ps.top, { paddingTop: insets.top + 6 }]}>
        <Pressable
          onPress={() => {
            tick()
            onClose()
          }}
          style={ps.done}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Done, close full-screen scoring"
        >
          <Text style={ps.doneText}>✕ Done</Text>
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center', minWidth: 0 }}>
          <Text style={ps.course} numberOfLines={1} maxFontSizeMultiplier={1.3}>
            {round.courseName}
          </Text>
          <Text style={ps.game} numberOfLines={1} maxFontSizeMultiplier={1.3}>
            {round.game} · live
          </Text>
        </View>
        <View style={{ width: 76 }} />
      </View>
      <View style={ps.badgeRow}>
        <SharedSaveBadge status={saveStatus} dark />
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 14, paddingBottom: insets.bottom + 28 }}
        keyboardShouldPersistTaps="handled"
      >
        {rows.length > 0 ? (
          <HoleStepper round={round} rows={rows} yards={yards} commitScore={commitScore} />
        ) : (
          <Text style={ps.empty}>No players on this trip yet.</Text>
        )}
        <Text style={ps.section}>
          {resultsRound.game === 'Stroke Play' ? 'Leaderboard' : `${resultsRound.game} standings`}
        </Text>
        <Results round={resultsRound} members={members} rows={resultsRows} />
      </ScrollView>
    </View>
  )
}

const ps = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.green900 },
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 8, gap: 8 },
  done: {
    width: 76,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
  },
  doneText: { color: '#fff', fontFamily: fonts.sansBold, fontSize: 13 },
  course: { color: '#fff', fontFamily: fonts.serifBold, fontSize: 22 },
  game: { color: 'rgba(255,255,255,0.68)', fontFamily: fonts.sansSemi, fontSize: 12 },
  badgeRow: { paddingHorizontal: 14, paddingBottom: 6 },
  section: { color: '#fff', fontFamily: fonts.serif, fontSize: 24, marginTop: 22, marginBottom: 10 },
  empty: { color: '#fff', fontFamily: fonts.sansSemi, textAlign: 'center', marginTop: 30 },
})
