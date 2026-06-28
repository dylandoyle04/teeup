// Per-hole pars per course.
// Real (scraped from the course scorecard) where available; otherwise the
// course's accurate total par with a realistic hole layout.

// realistic layouts by total
const P72 = [4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 5, 4] // 72
const P71 = [4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 4, 4] // 71
const P70 = [4, 4, 3, 5, 4, 4, 3, 4, 4, 4, 4, 3, 5, 4, 4, 3, 4, 4] // 70

// real, from each course's published scorecard
const TROON = [4, 3, 5, 4, 4, 4, 3, 4, 5, 4, 5, 4, 3, 5, 4, 3, 4, 4] // 72 (Monument)
const INDIGO = [4, 4, 3, 5, 4, 3, 4, 4, 5, 4, 3, 4, 4, 5, 3, 4, 4, 5] // 72

export const COURSE_PARS: Record<string, number[]> = {
  wekopa: P71, // Saguaro
  'troon-north': TROON,
  'tpc-stadium': P71,
  'tpc-champions': P71,
  kierland: P72,
  mcdowell: P71,
  'tpc-myrtle': P72,
  caledonia: P70,
  'barefoot-dye': P72,
  'kings-north': P72,
  'world-tour': P72,
  'man-o-war': P72,
  arrowhead: P72,
  'indigo-creek': INDIGO,
}

// courses with real scraped per-hole data (for an honest "verified" badge)
export const REAL_PAR_SLUGS = new Set(['troon-north', 'indigo-creek'])

function slugForName(name: string): string | null {
  const n = name.toLowerCase()
  if (n.includes('we-ko-pa') || n.includes('wekopa') || n.includes('we ko pa'))
    return 'wekopa'
  if (n.includes('troon')) return 'troon-north'
  if (n.includes('stadium')) return 'tpc-stadium'
  if (n.includes('champions')) return 'tpc-champions'
  if (n.includes('kierland')) return 'kierland'
  if (n.includes('mcdowell')) return 'mcdowell'
  if (n.includes('tpc') && n.includes('myrtle')) return 'tpc-myrtle'
  if (n.includes('caledonia')) return 'caledonia'
  if (n.includes('barefoot')) return 'barefoot-dye'
  if (n.includes('king')) return 'kings-north'
  if (n.includes('world tour')) return 'world-tour'
  if (n.includes('man o')) return 'man-o-war'
  if (n.includes('arrowhead')) return 'arrowhead'
  if (n.includes('indigo')) return 'indigo-creek'
  return null
}

export function parsForCourseName(name: string): number[] | null {
  const slug = slugForName(name)
  return slug ? COURSE_PARS[slug] ?? null : null
}
