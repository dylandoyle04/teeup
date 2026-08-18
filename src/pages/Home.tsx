import { useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { gsap, reduceMotion } from '../anim'
import ExpediaBadge from '../components/ExpediaBadge'
import PackageCard from '../components/PackageCard'
import { hasBackend } from '../supabase'
import { PACKAGES } from '../packages'

// one package per destination, top 4 by popularity order
const FEATURED = (() => {
  const seen = new Set<string>()
  const out: typeof PACKAGES = []
  for (const p of PACKAGES) {
    if (!seen.has(p.destination)) {
      seen.add(p.destination)
      out.push(p)
    }
    if (out.length === 4) break
  }
  return out
})()

function scrollToMore() {
  document.getElementById('home-more')?.scrollIntoView({ behavior: 'smooth' })
}

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
    const ctx = gsap.context(() => {}, root)
    let cancelled = false

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

    ctx.add(() => {
      gsap.fromTo('.hero-photo', { scale: 1.02 }, { scale: 1.12, duration: 18, ease: 'none' })
    })

    const intro = showIntro && !reduceMotion() && root.current && oRef.current

    if (!intro) {
      ctx.add(() => {
        gsap.set(['.logo-let', '.logo-tittle'], { autoAlpha: 1 })
        revealRest(gsap.timeline(), 0)
      })
      return () => {
        cancelled = true
        ctx.revert()
      }
    }

    // hide the letters immediately (no flash) while we wait for fonts to settle
    ctx.add(() => {
      gsap.set('.logo-let', { autoAlpha: 0 })
      gsap.set('.logo-tittle', { autoAlpha: 1 })
      gsap.set('.hero-content', { autoAlpha: 1 })
      gsap.set('.putt-ball', { autoAlpha: 0 })
    })

    // measure the cup ONLY after fonts have loaded — otherwise the logo
    // reflows afterward and the ball lands where the cup used to be.
    const start = () => {
      if (cancelled || !root.current || !oRef.current) return
      ctx.add(() => {
        const hero = root.current!.getBoundingClientRect()
        const cup = oRef.current!.getBoundingClientRect()
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
        // roll to the cup's exact centre, then sink in
        t.to(ball, { x: cx - ballSize / 2, duration: 1.4, ease: 'power2.out' }, 0)
          .to(ball, { rotation: 900, duration: 1.4, ease: 'power2.out' }, 0)
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
      })
    }

    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts
    if (fonts && fonts.status !== 'loaded') {
      fonts.ready.then(() => requestAnimationFrame(start))
    } else {
      requestAnimationFrame(start)
    }

    return () => {
      cancelled = true
      ctx.revert()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
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

        <p className="hero-tag hero-tag-lead">
          Book the trip. Invite the crew. Keep score.
        </p>
        <p className="hero-tag hero-tag-sub">
          Courses, hotels &amp; travel — with a live shared scorecard, side
          games, and a trip-long Ryder Cup.
        </p>

        <button className="hero-cta" onClick={() => navigate('/explore')}>
          Plan your trip
        </button>
      </div>

      {!showIntro && (
        <button className="scroll-cue" onClick={scrollToMore} aria-label="See how it works">
          <span>How it works</span>
          <span className="chev" aria-hidden="true">⌄</span>
        </button>
      )}

      {!showIntro && (
        <>
          <header className="hero-topbar">
            <ExpediaBadge />
            <nav className="hero-topbar-nav">
              <Link to="/explore">Explore</Link>
              {hasBackend && <Link to="/trips">My Trips</Link>}
              {hasBackend && <Link to="/signin">Sign in</Link>}
            </nav>
          </header>
        </>
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

    <div id="home-more" className="home-more">
      <section className="home-section">
        <h2 className="section-title explore-h2">How it works</h2>
        <div className="steps">
          <div className="step">
            <span className="step-n">1</span>
            <h3>Plan</h3>
            <p>Pick a curated destination package or build your own — courses, hotels, flights, drive times, and dining.</p>
          </div>
          <div className="step">
            <span className="step-n">2</span>
            <h3>Invite</h3>
            <p>Share one link. Friends sign in and join the trip — everyone on the same page.</p>
          </div>
          <div className="step">
            <span className="step-n">3</span>
            <h3>Score</h3>
            <p>Keep score live together — a shared scorecard, side games, and a trip-long Ryder Cup.</p>
          </div>
          <div className="step">
            <span className="step-n">4</span>
            <h3>Eat &amp; more</h3>
            <p>Restaurant picks near every course, drive times, and everything else the trip needs.</p>
          </div>
        </div>
      </section>

      <section className="home-section">
        <h2 className="section-title explore-h2">Featured trips</h2>
        <div className="pkg-grid">
          {FEATURED.map((p) => (
            <PackageCard key={p.id} pkg={p} />
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <Link to="/explore" className="btn ghost">
            See all trips →
          </Link>
        </div>
      </section>

      <section className="home-section">
        <div className="referral-note">
          <span className="referral-badge">Same price, always</span>
          <h2 className="referral-title">Booking here keeps it free</h2>
          <p>
            Book your hotels, flights, rental cars, and tee times right from
            Flagstick Finder — it costs you <strong>exactly the same</strong> as
            going direct. When you do, we earn a small referral that keeps the
            app free and growing. You find your trip; you help us keep building
            it. Deal?
          </p>
        </div>
      </section>

      <section className="home-cta-band">
        <p className="home-stat">11 destinations · 70+ courses · one live scorecard</p>
        <h2 className="home-cta-title">Ready to plan the trip?</h2>
        <Link to="/explore" className="btn gold home-cta-btn">
          Plan your trip →
        </Link>
        <div className="home-foot">
          <Link to="/legal">Privacy &amp; Terms</Link>
          <a href="mailto:Flagstickfinder@outlook.com">Contact</a>
        </div>
      </section>
    </div>
    </>
  )
}
