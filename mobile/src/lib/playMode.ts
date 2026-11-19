// Opens the full-screen, distraction-free scorer for one round
// (src/app/play/[tripId]/[roundId].tsx) from anywhere in the app.
import { router } from 'expo-router'

export function openPlayMode(tripId: string, roundId: string) {
  router.push({ pathname: '/play/[tripId]/[roundId]', params: { tripId, roundId } })
}
