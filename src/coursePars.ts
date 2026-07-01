// Per-hole pars (and yardages where available) per course.
// Real data scraped from each course's published scorecard (PDF/image/HTML)
// where obtainable; otherwise the course's accurate total par with a
// realistic hole layout (and no yardages).

// realistic fallback layouts by total
const P72 = [4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 5, 4] // 72
const P71 = [4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 4, 4] // 71
const P70 = [4, 4, 3, 5, 4, 4, 3, 4, 4, 4, 4, 3, 5, 4, 4, 3, 4, 4] // 70

// ---- Real pars (from published scorecards) ----
const TROON = [4, 3, 5, 4, 4, 4, 3, 4, 5, 4, 5, 4, 3, 5, 4, 3, 4, 4] // 72 (Monument)
const INDIGO = [4, 4, 3, 5, 4, 3, 4, 4, 5, 4, 3, 4, 4, 5, 3, 4, 4, 5] // 72
const ARROWHEAD = [4, 5, 3, 4, 4, 3, 4, 5, 4, 4, 4, 5, 4, 3, 4, 4, 3, 5] // 72 (Cypress+Lakes)
const WEKOPA = [4, 4, 4, 5, 3, 4, 4, 5, 3, 4, 3, 4, 4, 5, 3, 4, 4, 4] // 71 (Saguaro)
const DYE = [4, 4, 3, 4, 5, 3, 4, 5, 4, 4, 4, 5, 4, 4, 3, 5, 3, 4] // 72

export const COURSE_PARS: Record<string, number[]> = {
  wekopa: WEKOPA,
  'troon-north': TROON,
  'tpc-stadium': P71,
  'tpc-champions': P71,
  kierland: P72,
  mcdowell: P71,
  'tpc-myrtle': P72,
  caledonia: P70,
  'barefoot-dye': DYE,
  'kings-north': P72,
  'world-tour': P72,
  'man-o-war': P72,
  arrowhead: ARROWHEAD,
  'indigo-creek': INDIGO,
}

// ---- Real yardages (representative tee) ----
export const COURSE_YARDS: Record<string, number[]> = {
  // Troon North — Gold tees (6,716)
  'troon-north': [
    411, 165, 544, 370, 435, 295, 190, 403, 520, 384, 504, 411, 206, 541, 283,
    234, 455, 365,
  ],
  // Arrowhead — Blue tees, Cypress + Lakes (6,697)
  arrowhead: [
    381, 571, 205, 355, 337, 198, 391, 549, 362, 392, 379, 587, 363, 138, 359,
    411, 198, 521,
  ],
  // We-Ko-Pa Saguaro — Purple tees (6,603)
  wekopa: [
    443, 299, 383, 609, 159, 406, 305, 498, 130, 322, 194, 461, 457, 527, 233,
    315, 372, 490,
  ],
  // Barefoot Dye — White tees (6,005)
  'barefoot-dye': [
    359, 327, 160, 321, 472, 155, 375, 445, 405, 287, 366, 452, 332, 367, 162,
    494, 158, 368,
  ],
}

// courses with real, scraped per-hole pars
export const REAL_PAR_SLUGS = new Set([
  'troon-north',
  'indigo-creek',
  'arrowhead',
  'wekopa',
  'barefoot-dye',
])

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

export function yardsForCourseName(name: string): number[] | null {
  const slug = slugForName(name)
  return slug ? COURSE_YARDS[slug] ?? null : null
}
