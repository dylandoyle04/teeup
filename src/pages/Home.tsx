import { useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap, reduceMotion } from '../anim'

function IntroScene() {
  return (
    <svg
      className="intro-scene"
      viewBox="0 0 1000 600"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="introGreen" cx="50%" cy="42%" r="75%">
          <stop offset="0%" stopColor="#1f7a4f" />
          <stop offset="60%" stopColor="#14563c" />
          <stop offset="100%" stopColor="#0b3d2c" />
        </radialGradient>
        <radialGradient id="cup" cx="50%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#05231a" />
          <stop offset="100%" stopColor="#020f0a" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="1000" height="600" fill="url(#introGreen)" />
      {/* subtle mown stripes */}
      <g opacity="0.06" fill="#ffffff">
        <rect x="0" y="330" width="1000" height="26" />
        <rect x="0" y="382" width="1000" height="26" />
        <rect x="0" y="434" width="1000" height="26" />
        <rect x="0" y="486" width="1000" height="26" />
      </g>

      {/* the cup */}
      <ellipse cx="650" cy="360" rx="34" ry="15" fill="url(#cup)" />
      <ellipse
        cx="650"
        cy="360"
        rx="34"
        ry="15"
        fill="none"
        stroke="#0a3325"
        strokeWidth="3"
      />
      {/* ring pulse (on sink) */}
      <ellipse
        className="hole-ring"
        cx="650"
        cy="360"
        rx="34"
        ry="15"
        fill="none"
        stroke="#8bc34a"
        strokeWidth="4"
        opacity="0"
      />

      {/* flagstick + flag */}
      <g className="intro-flag">
        <rect x="648" y="150" width="4" height="212" rx="2" fill="#f3f3ec" />
        <path d="M652,156 L712,172 L652,190 Z" fill="#8bc34a" />
      </g>

      {/* ball shadow */}
      <ellipse
        className="intro-ball-shadow"
        cx="150"
        cy="378"
        rx="18"
        ry="6"
        fill="#03150e"
        opacity="0.45"
      />

      {/* ball */}
      <g className="intro-ball-wrap">
        <g className="intro-ball">
          <circle cx="150" cy="360" r="17" fill="#ffffff" />
          <g fill="#d7ddcf">
            <circle cx="145" cy="356" r="1.5" />
            <circle cx="152" cy="354" r="1.5" />
            <circle cx="157" cy="359" r="1.5" />
            <circle cx="148" cy="363" r="1.5" />
            <circle cx="154" cy="365" r="1.5" />
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

      // roll the ball toward the cup
      t.to('.intro-ball-wrap', { x: 470, duration: 1.5, ease: 'power1.out' }, 0)
        .to(
          '.intro-ball',
          { rotation: 940, duration: 1.5, ease: 'power1.out', transformOrigin: '50% 50%' },
          0,
        )
        .to('.intro-ball-shadow', { x: 470, duration: 1.5, ease: 'power1.out' }, 0)
        // settle at the lip then drop in
        .to('.intro-ball-wrap', { x: 500, y: 6, duration: 0.18, ease: 'power1.in' })
        .to('.intro-ball-wrap', { y: 34, duration: 0.32, ease: 'power2.in' })
        .to('.intro-ball', { scale: 0.2, autoAlpha: 0, duration: 0.3, ease: 'power2.in' }, '<')
        .to('.intro-ball-shadow', { scale: 0.3, autoAlpha: 0, duration: 0.25 }, '<')
        .fromTo(
          '.hole-ring',
          { scale: 0.35, opacity: 0.8, transformOrigin: '50% 50%' },
          { scale: 2, opacity: 0, duration: 0.7, ease: 'power2.out' },
          '-=0.1',
        )
        .to('.intro-flag', { y: -6, duration: 0.2, yoyo: true, repeat: 1 }, '<')
        .addLabel('reveal', '+=0.05')
        // wipe the green away to reveal the hero
        .to('.intro', { autoAlpha: 0, duration: 0.9, ease: 'power2.inOut' }, 'reveal')
      addHeroIn(t, 'reveal+=0.25')
    }, root)
    return () => ctx.revert()
  }, [showIntro])

  return (
    <section className="hero" ref={root}>
      <img
        className="hero-photo"
        src={`${import.meta.env.BASE_URL}hero.jpg`}
        alt=""
        aria-hidden="true"
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
