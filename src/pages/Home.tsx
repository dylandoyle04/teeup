import { useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap, reduceMotion } from '../anim'

function IntroScene() {
  // small, centered scene positioned just under the logo (cup + ball only)
  return (
    <svg className="intro-scene" viewBox="0 0 400 140" aria-hidden="true">
      <defs>
        <radialGradient id="cup" cx="50%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#04140d" />
          <stop offset="100%" stopColor="#010a06" />
        </radialGradient>
      </defs>

      {/* the cup */}
      <ellipse cx="278" cy="98" rx="19" ry="7.5" fill="url(#cup)" />
      <ellipse
        cx="278"
        cy="98"
        rx="19"
        ry="7.5"
        fill="none"
        stroke="rgba(0,0,0,0.4)"
        strokeWidth="1.5"
      />
      {/* ring pulse (on sink) */}
      <ellipse
        className="hole-ring"
        cx="278"
        cy="98"
        rx="19"
        ry="7.5"
        fill="none"
        stroke="#ffffff"
        strokeWidth="3"
        opacity="0"
      />

      {/* ball shadow */}
      <ellipse
        className="intro-ball-shadow"
        cx="70"
        cy="107"
        rx="10"
        ry="3.5"
        fill="#000000"
        opacity="0.3"
      />

      {/* ball */}
      <g className="intro-ball-wrap">
        <g className="intro-ball">
          <circle cx="70" cy="98" r="10" fill="#ffffff" />
          <g fill="#cdd4c6">
            <circle cx="67" cy="95" r="0.9" />
            <circle cx="72" cy="94" r="0.9" />
            <circle cx="75" cy="98" r="0.9" />
            <circle cx="69" cy="101" r="0.9" />
            <circle cx="73" cy="102" r="0.9" />
          </g>
        </g>
      </g>
    </svg>
  )
}

// plays on each full page load, but not on client-side nav back to Home
let introPlayed = false

export default function Home() {
  const navigate = useNavigate()
  const root = useRef<HTMLElement>(null)
  const tl = useRef<gsap.core.Timeline | null>(null)
  const [showIntro, setShowIntro] = useState(
    () =>
      typeof window !== 'undefined' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
      !introPlayed,
  )

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const addHeroIn = (t: gsap.core.Timeline, pos: string | number) => {
        t.set('.hero-content', { autoAlpha: 1 }, pos)
          .from(
            '.hero-logo',
            { y: 34, autoAlpha: 0, scale: 0.96, duration: 0.9, ease: 'power3.out' },
            pos,
          )
          .from(
            '.ball-divider',
            {
              scaleX: 0,
              autoAlpha: 0,
              duration: 0.6,
              transformOrigin: 'center',
              ease: 'power3.out',
            },
            '-=0.4',
          )
          .from(
            '.hero-tag',
            { y: 22, autoAlpha: 0, duration: 0.7, stagger: 0.14, ease: 'power3.out' },
            '-=0.3',
          )
          .from(
            '.hero-cta',
            { y: 20, autoAlpha: 0, duration: 0.6, ease: 'power3.out' },
            '-=0.25',
          )
      }

      gsap.fromTo(
        '.hero-photo',
        { scale: 1.02 },
        { scale: 1.12, duration: 18, ease: 'none' },
      )

      if (!showIntro || reduceMotion()) {
        addHeroIn(gsap.timeline(), 0)
        return
      }

      gsap.set('.hero-content', { autoAlpha: 0 })
      const t = gsap.timeline({
        onComplete: () => {
          introPlayed = true
          setShowIntro(false)
        },
      })
      tl.current = t

      // roll the ball toward the cup (viewBox 400x140)
      t.to('.intro-ball-wrap', { x: 188, duration: 1.4, ease: 'power1.out' }, 0)
        .to(
          '.intro-ball',
          { rotation: 720, duration: 1.4, ease: 'power1.out', transformOrigin: '50% 50%' },
          0,
        )
        .to('.intro-ball-shadow', { x: 188, duration: 1.4, ease: 'power1.out' }, 0)
        // settle at the lip then drop in
        .to('.intro-ball-wrap', { x: 208, y: 3, duration: 0.16, ease: 'power1.in' })
        .to('.intro-ball-wrap', { y: 14, duration: 0.28, ease: 'power2.in' })
        .to('.intro-ball', { scale: 0.2, autoAlpha: 0, duration: 0.26, ease: 'power2.in' }, '<')
        .to('.intro-ball-shadow', { scale: 0.3, autoAlpha: 0, duration: 0.22 }, '<')
        .fromTo(
          '.hole-ring',
          { scale: 0.35, opacity: 0.9, transformOrigin: '50% 50%' },
          { scale: 2.2, opacity: 0, duration: 0.7, ease: 'power2.out' },
          '-=0.1',
        )
        .addLabel('reveal', '+=0.05')
        // fade the putt away and reveal the hero content over the photo
        .to('.intro', { autoAlpha: 0, duration: 0.7, ease: 'power2.inOut' }, 'reveal')
      addHeroIn(t, 'reveal+=0.25')
    }, root)
    return () => ctx.revert()
    // run once on mount; the intro's onComplete flips showIntro without re-running
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ?bg=troon|wekopa|caledonia|mcdowell|kierland lets you preview backgrounds
  const bg =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('bg')
      : null
  const heroSrc = bg
    ? `${import.meta.env.BASE_URL}heroes/${bg}.jpg`
    : `${import.meta.env.BASE_URL}hero.jpg`

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
          Tee<span className="accent">Up</span>
          <svg className="hero-flag" viewBox="0 0 40 56" aria-hidden="true">
            <rect x="6" y="4" width="3.5" height="50" rx="1.75" fill="#ffffff" />
            <path d="M9.5,6 L34,13 L9.5,21 Z" fill="#8bc34a" />
          </svg>
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
          <IntroScene />
          <span className="intro-skip">tap to skip</span>
        </div>
      )}
    </section>
  )
}
