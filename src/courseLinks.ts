// Which booking links a course shows — shared by the website and the app.
// The course's own site comes first, GolfNow alongside it when we have one,
// and a GolfNow search only as a last resort.

export interface CourseLinkInfo {
  kind: 'website' | 'golfnow'
  label: string
  url: string
}

export function courseLinks(
  c: { name: string; website?: string; golfNow?: string },
  area?: string,
): CourseLinkInfo[] {
  const out: CourseLinkInfo[] = []
  if (c.website) out.push({ kind: 'website', label: 'Course site', url: c.website })
  if (c.golfNow) out.push({ kind: 'golfnow', label: 'GolfNow', url: c.golfNow })
  if (out.length === 0) {
    const q = area ? `${c.name}, ${area}` : c.name
    out.push({
      kind: 'golfnow',
      label: 'Find on GolfNow',
      url: `https://www.golfnow.com/tee-times/search?q=${encodeURIComponent(q)}`,
    })
  }
  return out
}
