import { useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap, reduceMotion } from '../anim'

// plays on each full page load, but not on client-side nav back to Home
let introPlayed = false

export default function Home() {
  const navigate = useNavigate()
  const root = useRef<HTMLElement>(null)
  const oRef = useRef<HTMLSpanElement>(null)
  const tl = useRef<gsap.core.Timeline | null>(null)
  const [showIntro, setShowIntro] = useState(
    () =>
      typeof window !== 'undefined' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
      !introPlayed,
  )

  const bg =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('bg')
      : null
  const heroSrc = bg
    ? `${import.meta.env.BASE_URL}heroes/${bg}.jpg`
    : `${import.meta.env.BASE_URL}hero.jpg`

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const revealRest = (t: gsap.core.Timeline, pos: string | number) => {
        t.to('.logo-let', { autoAlpha: 1, duration: 0.5, stagger: 0.05 }, pos)
          .from(
            '.ball-divider',
            { scaleX: 0, autoAlpha: 0, duration: 0.55, transformOrigin: 'center', ease: 'power3.out' },
            '>-0.1',
          )
          .from('.hero-tag', { y: 20, autoAlpha: 0, duration: 0.7, stagger: 0.14, ease: 'power3.out' }, '-=0.25')
          .from('.hero-cta', { y: 18, autoAlpha: 0, duration: 0.6, ease: 'power3.out' }, '-=0.25')
      }

      gsap.fromTo('.hero-photo', { scale: 1.02 }, { scale: 1.12, duration: 18, ease: 'none' })

      if (!showIntro || reduceMotion() || !root.current || !oRef.current) {
        gsap.set('.logo-let', { autoAlpha: 1 })
        const t = gsap.timeline()
        revealRest(t, 0)
        return
      }

      // hide letters + supporting content; keep the "o" (hole) visible as the target
      gsap.set('.logo-let', { autoAlpha: 0 })
      gsap.set('.hero-content', { autoAlpha: 1 })

      const hero = root.current.getBoundingClientRect()
      const o = oRef.current.getBoundingClientRect()
      const oCx = o.left - hero.left + o.width / 2
      const oCy = o.top - hero.top + o.height / 2
      const size = Math.max(15, o.width * 0.52)

      const ball = '.putt-ball'
      gsap.set(ball, {
        width: size,
        height: size,
        x: 36,
        y: oCy - size / 2,
        autoAlpha: 1,
      })

      const t = gsap.timeline({
        onComplete: () => {
          introPlayed = true
          setShowIntro(false)
        },
      })
      tl.current = t
      // roll toward the hole
      t.to(ball, { x: oCx - size / 2 - o.width * 0.5, duration: 1.35, ease: 'power1.out' }, 0)
        .to(ball, { rotation: 900, duration: 1.35, ease: 'power1.out' }, 0)
        // settle into the cup + sink
        .to(ball, { x: oCx - size / 2, duration: 0.22, ease: 'power1.in' })
        .to(ball, { scale: 0.16, autoAlpha: 0, duration: 0.28, ease: 'power2.in' })
        .fromTo(
          '.o-ring',
          { scale: 0.5, opacity: 0.85 },
          { scale: 2, opacity: 0, duration: 0.6, ease: 'power2.out' },
          '<',
        )
        .addLabel('reveal', '-=0.05')
        .to('.intro', { autoAlpha: 0, duration: 0.4 }, 'reveal')
      revealRest(t, 'reveal')
    }, root)
    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section className="hero" ref={root}>
      <img
        className="hero-photo"
        src={heroSrc}
        alt=""
        aria-hidden="true"
        onError={(e) => {
          e.currentTarget.src = `${import.meta.env.BASE_URL}hero.jpg`
        }}
      />
      <div className="hero-overlay" />

      <div className="hero-content">
        <h1 className="hero-logo">
          <span className="logo-let">F</span>
          <span className="logo-o" ref={oRef} aria-hidden="true">
            <span className="o-ring" />
          </span>
          <span className="logo-let">reRight</span>
          <span className="logo-let accent">&nbsp;Trips</span>
        </h1>

        <div className="ball-divider" aria-hidden="true">
          <span className="line" />
          <span className="ball" />
          <span className="line" />
        </div>

        <p className="hero-tag">Find your courses, hotels, and travel needs.</p>
        <p className="hero-tag">
          Book the trip, invite friends, and keep score with the in-game
          scorecard all the way through.
        </p>

        <button className="hero-cta" onClick={() => navigate('/explore')}>
          <span className="tee" aria-hidden="true">
            🏌️
          </span>
          PLAN YOUR TRIP
        </button>
      </div>

      {showIntro && (
        <div
          className="intro"
          onClick={() => tl.current?.seek('reveal')}
          role="button"
          aria-label="Skip intro"
        >
          <span className="putt-ball" aria-hidden="true" />
          <span className="intro-skip">tap to skip</span>
        </div>
      )}
    </section>
  )
}
