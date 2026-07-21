import { useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  // bump when the hero image is swapped so browsers don't serve a stale cache
  const heroSrc = bg
    ? `${import.meta.env.BASE_URL}heroes/${bg}.jpg`
    : `${import.meta.env.BASE_URL}hero.jpg?v=wekopa`

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

      // hide the letters; keep the cup (i-dot) visible as the putt target
      gsap.set('.logo-let', { autoAlpha: 0 })
      gsap.set('.logo-tittle', { autoAlpha: 1 })
      gsap.set('.hero-content', { autoAlpha: 1 })

      const hero = root.current.getBoundingClientRect()
      const cup = oRef.current.getBoundingClientRect()
      const cx = cup.left - hero.left + cup.width / 2
      const cy = cup.top - hero.top + cup.height / 2
      const cupSize = Math.max(8, cup.width)
      const ballSize = Math.max(9, cupSize * 0.78)

      const ball = '.putt-ball'
      gsap.set(ball, {
        width: ballSize,
        height: ballSize,
        x: 36,
        y: cy - ballSize / 2,
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
      // roll across to the lip of the cup...
      t.to(ball, { x: cx - ballSize / 2, duration: 1.4, ease: 'power2.out' }, 0)
        .to(ball, { rotation: 900, duration: 1.4, ease: 'power2.out' }, 0)
        // ...then drop into the hole: sink + fade with a rim pulse
        .addLabel('drop')
        .to(ball, { scale: 0.14, autoAlpha: 0, duration: 0.42, ease: 'power2.in' }, 'drop')
        .fromTo(
          '.o-ring',
          { scale: 0.6, opacity: 0.9 },
          { scale: 2.4, opacity: 0, duration: 0.65, ease: 'power2.out' },
          'drop+=0.1',
        )
        .addLabel('reveal', 'drop+=0.22')
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

      {!showIntro && (
        <Link className="hero-legal" to="/legal">
          Privacy &amp; Terms
        </Link>
      )}

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
