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
        gsap.set(['.logo-let', '.logo-tittle'], { autoAlpha: 1 })
        const t = gsap.timeline()
        revealRest(t, 0)
        return
      }

      // hide letters + the i-dot; the ball rolls in and becomes the dot
      gsap.set(['.logo-let', '.logo-tittle'], { autoAlpha: 0 })
      gsap.set('.hero-content', { autoAlpha: 1 })

      const hero = root.current.getBoundingClientRect()
      const dot = oRef.current.getBoundingClientRect()
      const cx = dot.left - hero.left + dot.width / 2
      const cy = dot.top - hero.top + dot.height / 2
      const tittleSize = Math.max(6, dot.width)
      const rollSize = Math.max(16, tittleSize * 2.2)

      const ball = '.putt-ball'
      gsap.set(ball, {
        width: rollSize,
        height: rollSize,
        x: 36,
        y: cy - rollSize / 2,
        scale: 1,
        rotation: 0,
        autoAlpha: 1,
        transformOrigin: 'center center',
      })

      const t = gsap.timeline({
        onComplete: () => {
          introPlayed = true
          setShowIntro(false)
        },
      })
      tl.current = t
      // roll across and settle centered over the i
      t.to(ball, { x: cx - rollSize / 2, duration: 1.4, ease: 'power2.out' }, 0)
        .to(ball, { rotation: 900, duration: 1.4, ease: 'power2.out' }, 0)
        // shrink down to i-dot size (scales about its center, staying put)
        .addLabel('settle')
        .to(ball, { scale: tittleSize / rollSize, duration: 0.32, ease: 'power2.out' }, 'settle')
        .to('.logo-tittle', { autoAlpha: 1, duration: 0.2 }, 'settle+=0.12')
        .to(ball, { autoAlpha: 0, duration: 0.2 }, 'settle+=0.18')
        .fromTo(
          '.o-ring',
          { scale: 0.5, opacity: 0.85 },
          { scale: 2.4, opacity: 0, duration: 0.6, ease: 'power2.out' },
          'settle+=0.05',
        )
        .addLabel('reveal', 'settle+=0.14')
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
        <h1 className="hero-logo" aria-label="Flagstick Finder">
          <span className="logo-let" aria-hidden="true">
            Flagstick
          </span>
          <span className="logo-let accent" aria-hidden="true">
            &nbsp;F
          </span>
          <span className="logo-i" aria-hidden="true">
            <span className="logo-let accent">&#305;</span>
            <span className="logo-tittle" ref={oRef}>
              <span className="o-ring" />
            </span>
          </span>
          <span className="logo-let accent" aria-hidden="true">
            nder
          </span>
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
          Plan your trip
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
