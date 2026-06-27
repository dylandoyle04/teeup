import type { Member } from '../types'

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function Avatar({
  member,
  size = 'md',
}: {
  member: Member
  size?: 'sm' | 'md'
}) {
  return (
    <span
      className={`avatar ${size === 'sm' ? 'sm' : ''}`}
      style={{ background: member.color }}
      title={member.name}
    >
      {initials(member.name)}
    </span>
  )
}

export function AvatarStack({ members }: { members: Member[] }) {
  return (
    <div className="avatar-stack">
      {members.slice(0, 5).map((m) => (
        <Avatar key={m.id} member={m} size="sm" />
      ))}
    </div>
  )
}

export function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean
  onChange: (v: boolean) => void
  label?: string
}) {
  return (
    <button
      type="button"
      className={`switch ${on ? 'on' : ''}`}
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
    >
      <span className="knob" />
    </button>
  )
}

export function fmtDateRange(start: string, end: string): string {
  if (!start) return 'Dates TBD'
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  const s = new Date(start + 'T00:00:00').toLocaleDateString(undefined, opts)
  if (!end || end === start) return s
  const e = new Date(end + 'T00:00:00').toLocaleDateString(undefined, opts)
  return `${s} – ${e}`
}

export function money(n: number): string {
  return '$' + Math.round(n).toLocaleString()
}
