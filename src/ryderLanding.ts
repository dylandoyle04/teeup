// Copy for the Ryder Cup landing page — shared by the website
// (pages/RyderLanding.tsx) and the app (mobile/src/app/(tabs)/ryder.tsx).

export const RC_FINAL_A = 14.5
export const RC_FINAL_B = 13.5

export const RC_STEPS = [
  ['Pick sides', 'Split the crew into two teams — name them whatever you want. We balance them for you to start.'],
  ['Play a format each day', 'Every round is a session: Fourball, then Foursomes, then Singles — just like the real thing.'],
  ['Chase the cup', 'Win a session, earn a point. Halve it, split it. Most points when the trip ends takes the cup.'],
] as const

export const RC_SAMPLE_SESSIONS = [
  { day: 'Day 1', format: 'Fourball', course: 'TPC Scottsdale — Stadium', winner: 'A', result: 'USA wins 3 & 2' },
  { day: 'Day 2', format: 'Foursomes', course: 'Troon North — Monument', winner: 'B', result: 'Europe wins 1 up' },
  { day: 'Day 3', format: 'Singles', course: 'We-Ko-Pa — Saguaro', winner: 'tie', result: 'Halved — ½ pt each' },
] as const

export const RC_FEATURES = [
  ['📊', 'Live points', 'Standings update as every score goes in — on everyone’s phone.'],
  ['🔁', 'Pairings & tee order', 'Alternate-shot partners and who tees off on each hole, worked out for you.'],
  ['🏆', 'Clinch alerts', 'Know the moment a side can’t be caught.'],
  ['⛳', 'Your rounds, your rules', 'Count or skip any round toward the cup.'],
] as const

/** 14.5 -> "14½" */
export function fmtPts(n: number): string {
  const whole = Math.floor(n)
  return n % 1 ? `${whole === 0 ? '' : whole}½` : String(whole)
}
