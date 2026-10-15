// Ryder Cup cheer. Browsers only allow audio after a user gesture, so callers
// play it from the click that opens the page; the page also tries on mount
// (works once the visitor has interacted with the site).

const MUTE_KEY = 'ff-sound-muted'
let audio: HTMLAudioElement | null = null
let lastPlayed = 0

export function isMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

export function setMuted(muted: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0')
  } catch {
    /* private mode — just don't remember */
  }
  if (muted) audio?.pause()
}

/** Plays the cheer unless muted; repeat calls within 1.5s are ignored. */
export function playRyderCheer({ force = false } = {}) {
  if (isMuted()) return
  const now = Date.now()
  if (!force && now - lastPlayed < 1500) return
  lastPlayed = now
  audio ??= new Audio(`${import.meta.env.BASE_URL}sounds/ryder-cheer.m4a`)
  audio.volume = 0.7
  audio.currentTime = 0
  audio.play().catch(() => {
    lastPlayed = 0 // blocked (no gesture yet) — let the next attempt try
  })
}
