import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { gsap, reduceMotion, revealOnScroll } from '../anim'
import { RYDER_FORMATS } from '../ryder'
import {
  RC_FEATURES as FEATURES,
  RC_FINAL_A,
  RC_FINAL_B,
  RC_SAMPLE_SESSIONS as SAMPLE_SESSIONS,
  RC_STEPS,
  fmtPts,
} from '../ryderLanding'
import { isMuted, playRyderCheer, setMuted } from '../sound'

const FINAL_A = RC_FINAL_A
const FINAL_B = RC_FINAL_B
const pts = fmtPts

const CONFETTI = Array.from({ length: 28 }, (_, i) => i)

export default function RyderLanding() {
  const root = useRef<HTMLDivElement>(null)
  const tl = useRef<gsap.core.Timeline | null>(null)
  const [a, setA] = useState(reduceMotion() ? FINAL_A : 0)
  const [b, setB] = useState(reduceMotion() ? FINAL_B : 0)
  const [muted, setMutedState] = useState(isMuted)

  useLayoutEffect(() => {
    // the click that brought us here usually already started it (deduped)
    playRyderCheer()
    if (reduceMotion()) return
    const ctx = gsap.context(() => {
      const score = { a: 0, b: 0 }
      const t = gsap.timeline({ defaults: { ease: 'power3.out' } })
      t.from('.rc-side.a', { xPercent: -110, duration: 0.7, ease: 'power4.out' })
        .from('.rc-side.b', { xPercent: 110, duration: 0.7, ease: 'power4.out' }, '<')
        .fromTo('.rc-flash', { opacity: 0, scaleY: 0.2 }, { opacity: 1, scaleY: 1, duration: 0.12, ease: 'none' }, '-=0.05')
        .to('.rc-flash', { opacity: 0, duration: 0.5 })
        .from('.rc-hero', { x: -6, duration: 0.05, repeat: 5, yoyo: true, ease: 'none', clearProps: 'x' }, '<')
        .from('.rc-trophy', { y: 140, autoAlpha: 0, scale: 0.6, duration: 0.9, ease: 'back.out(1.6)' }, '-=0.45')
        .fromTo('.rc-shine', { xPercent: -160 }, { xPercent: 160, duration: 0.9, ease: 'power2.inOut' }, '-=0.2')
        .from('.rc-kicker, .rc-title, .rc-sub', { y: 24, autoAlpha: 0, stagger: 0.1, duration: 0.6 }, '-=0.7')
        .from('.rc-board', { y: 20, autoAlpha: 0, duration: 0.5 }, '-=0.3')
        .to(score, {
          a: FINAL_A,
          b: FINAL_B,
          duration: 1.6,
          ease: 'power1.inOut',
          onUpdate: () => {
            setA(Math.round(score.a * 2) / 2)
            setB(Math.round(score.b * 2) / 2)
          },
        })
        .fromTo('.rc-pts.a', { scale: 1 }, { scale: 1.18, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.out' })
        .fromTo(
          '.rc-confetti i',
          { x: 0, y: 0, rotation: 0, opacity: 1 },
          {
            x: () => gsap.utils.random(-220, 220),
            y: () => gsap.utils.random(-260, 40),
            rotation: () => gsap.utils.random(-540, 540),
            opacity: 0,
            duration: 1.5,
            ease: 'power2.out',
            stagger: 0.008,
          },
          '<',
        )
        .from('.rc-actions', { autoAlpha: 0, y: 12, duration: 0.4 }, '-=1.1')
      tl.current = t
      revealOnScroll(root.current)
    }, root)
    return () => ctx.revert()
  }, [])

  function replay() {
    playRyderCheer({ force: true })
    if (tl.current) tl.current.restart()
  }

  function toggleMute() {
    setMuted(!muted)
    setMutedState(!muted)
  }

  return (
    <div className="rc" ref={root}>
      <section className="rc-hero">
        <div className="rc-side a" aria-hidden="true" />
        <div className="rc-side b" aria-hidden="true" />
        <div className="rc-flash" aria-hidden="true" />

        <button className="rc-mute" onClick={toggleMute} aria-label={muted ? 'Turn sound on' : 'Turn sound off'}>
          {muted ? '🔇' : '🔊'}
        </button>

        <div className="rc-hero-inner">
          <p className="rc-kicker">Only on Flagstick Finder</p>
          <h1 className="rc-title">The Ryder Cup</h1>
          <p className="rc-sub">Turn your golf trip into a team showdown.</p>

          <div className="rc-trophy-wrap">
            <div className="rc-confetti" aria-hidden="true">
              {CONFETTI.map((i) => (
                <i key={i} className={i % 2 ? 'a' : 'b'} />
              ))}
            </div>
            <svg className="rc-trophy" viewBox="0 0 120 150" role="img" aria-label="Trophy">
              <defs>
                <linearGradient id="rc-gold" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#f6e08a" />
                  <stop offset="0.45" stopColor="#d4af37" />
                  <stop offset="1" stopColor="#9c7414" />
                </linearGradient>
                <clipPath id="rc-cup-clip">
                  <path d="M30 18h60v20c0 22-12 38-30 42-18-4-30-20-30-42z" />
                </clipPath>
              </defs>
              <circle cx="60" cy="10" r="7" fill="#fff" stroke="#d4af37" strokeWidth="2" />
              <path d="M30 22c-14 0-20 8-18 18 2 10 12 16 22 16" fill="none" stroke="url(#rc-gold)" strokeWidth="6" strokeLinecap="round" />
              <path d="M90 22c14 0 20 8 18 18-2 10-12 16-22 16" fill="none" stroke="url(#rc-gold)" strokeWidth="6" strokeLinecap="round" />
              <path d="M30 18h60v20c0 22-12 38-30 42-18-4-30-20-30-42z" fill="url(#rc-gold)" />
              <g clipPath="url(#rc-cup-clip)">
                <rect className="rc-shine" x="45" y="10" width="14" height="80" fill="rgba(255,255,255,0.55)" transform="skewX(-20)" />
              </g>
              <rect x="54" y="80" width="12" height="26" fill="url(#rc-gold)" />
              <path d="M38 106h44l6 18H32z" fill="url(#rc-gold)" />
              <rect x="26" y="124" width="68" height="14" rx="3" fill="#0b3d2c" stroke="#d4af37" strokeWidth="2" />
            </svg>
          </div>

          <div className="rc-board" aria-label={`Sample score: Team USA ${pts(FINAL_A)}, Team Europe ${pts(FINAL_B)}`}>
            <div className="rc-team a">
              <span className="rc-team-name">Team USA</span>
              <span className="rc-pts a">{pts(a)}</span>
            </div>
            <span className="rc-vs">vs</span>
            <div className="rc-team b">
              <span className="rc-team-name">Team Europe</span>
              <span className="rc-pts b">{pts(b)}</span>
            </div>
          </div>

          <div className="rc-actions">
            <Link to="/explore" className="btn gold">
              Start a Ryder Cup trip →
            </Link>
            <button className="rc-replay" onClick={replay}>
              ↻ Replay
            </button>
          </div>
        </div>
      </section>

      <div className="rc-body">
        <h2 className="section-title explore-h2" data-reveal>
          How it works
        </h2>
        <div className="rc-steps">
          {RC_STEPS.map(([title, body], i) => (
            <div className="rc-step" key={title} data-reveal>
              <span className="rc-step-n">{i + 1}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          ))}
        </div>

        <h2 className="section-title explore-h2" data-reveal>
          The formats
        </h2>
        <div className="rc-formats">
          {RYDER_FORMATS.map((f, i) => (
            <div className="rc-format" key={f.name} data-reveal>
              <span className="rc-format-day">Day {i + 1}</span>
              <h3>{f.name}</h3>
              <span className="rc-format-tag">{f.tag}</span>
              <p>{f.how}</p>
            </div>
          ))}
        </div>

        <h2 className="section-title explore-h2" data-reveal>
          What the trip looks like
        </h2>
        <div className="card rc-sample" data-reveal>
          {SAMPLE_SESSIONS.map((s) => (
            <div className="rc-session" key={s.day}>
              <span className="rc-session-day">{s.day}</span>
              <div className="rc-session-mid">
                <strong>{s.format}</strong>
                <span>{s.course}</span>
              </div>
              <span className={`rc-session-res ${s.winner}`}>{s.result}</span>
            </div>
          ))}
        </div>

        <div className="rc-features">
          {FEATURES.map(([icon, title, body]) => (
            <div className="rc-feature" key={title} data-reveal>
              <span className="rc-feature-icon" aria-hidden="true">
                {icon}
              </span>
              <div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            </div>
          ))}
        </div>

        <section className="rc-cta" data-reveal>
          <h2>Who&apos;s taking the cup home?</h2>
          <p>Pick a trip, invite the crew, and settle it on the course.</p>
          <div className="rc-cta-btns">
            <Link to="/explore" className="btn gold">
              Browse trips →
            </Link>
            <Link to="/new" className="btn ghost rc-ghost">
              Create your own
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
