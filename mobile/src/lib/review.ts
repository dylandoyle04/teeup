// App Store rating prompt — asked at most once per 120 days and never more
// than 3 times total. iOS also rate-limits requestReview itself. Never throws.
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as StoreReview from 'expo-store-review'

const KEY = 'flagstick.reviewPrompt.v1'
const MIN_GAP_MS = 120 * 24 * 60 * 60 * 1000
const MAX_ASKS = 3

type ReviewState = { count: number; lastAt: number }

async function readState(): Promise<ReviewState> {
  try {
    const raw = await AsyncStorage.getItem(KEY)
    if (!raw) return { count: 0, lastAt: 0 }
    const parsed = JSON.parse(raw) as Partial<ReviewState>
    return {
      count: typeof parsed.count === 'number' ? parsed.count : 0,
      lastAt: typeof parsed.lastAt === 'number' ? parsed.lastAt : 0,
    }
  } catch {
    return { count: 0, lastAt: 0 }
  }
}

export async function maybeAskForReview(): Promise<void> {
  try {
    const state = await readState()
    const now = Date.now()
    if (state.count >= MAX_ASKS) return
    if (state.lastAt && now - state.lastAt < MIN_GAP_MS) return
    if (!(await StoreReview.isAvailableAsync())) return
    if (!(await StoreReview.hasAction())) return
    // record first so a crash/re-render can't cause a double prompt
    await AsyncStorage.setItem(KEY, JSON.stringify({ count: state.count + 1, lastAt: now }))
    await StoreReview.requestReview()
  } catch {
    // never let a rating prompt break the app
  }
}
