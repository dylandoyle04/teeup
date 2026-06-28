import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { PACKAGES } from '../packages'
import { AvatarStack, fmtDateRange, money } from '../components/ui'

function HeroScene() {
  // Stylized golden-hour desert course: sky → mountains → green with flag.
  return (
    <svg
      className="hero-scene"
      viewBox="0 0 600 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1466a8" />
          <stop offset="42%" stopColor="#4d93c8" />
          <stop offset="68%" stopColor="#9cc4dd" />
          <stop offset="82%" stopColor="#f2c980" />
          <stop offset="100%" stopColor="#f7dca0" />
        </linearGradient>
        <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7cb33f" />
          <stop offset="100%" stopColor="#356d22" />
        </linearGradient>
        <linearGradient id="green" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#62a83c" />
          <stop offset="100%" stopColor="#3f7d27" />
        </linearGradient>
        <radialGradient id="sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff6d8" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#fff6d8" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Sky */}
      <rect x="0" y="0" width="600" height="560" fill="url(#sky)" />

      {/* Sun glow + core */}
      <circle cx="300" cy="500" r="170" fill="url(#sun)" />
      <circle cx="300" cy="500" r="38" fill="#fff4cf" />

      {/* Clouds */}
      <g fill="#ffffff" opacity="0.45">
        <ellipse cx="120" cy="120" rx="70" ry="18" />
        <ellipse cx="170" cy="135" rx="55" ry="15" />
        <ellipse cx="470" cy="90" rx="80" ry="20" />
        <ellipse cx="430" cy="105" rx="50" ry="14" />
      </g>

      {/* Far mountains */}
      <path
        d="M0,520 L80,430 L160,490 L250,400 L340,475 L430,410 L520,480 L600,440 L600,560 L0,560 Z"
        fill="#8aa6bf"
        opacity="0.7"
      />
      {/* Near mountains */}
      <path
        d="M0,545 L120,470 L230,520 L330,455 L450,520 L560,475 L600,510 L600,560 L0,560 Z"
        fill="#5d7d6a"
        opacity="0.85"
      />

      {/* Ground */}
      <rect x="0" y="535" width="600" height="365" fill="url(#ground)" />
      {/* Rolling fairway shading */}
      <path d="M0,560 Q300,520 600,565 L600,620 L0,620 Z" fill="#6aa83a" opacity="0.5" />

      {/* Pond */}
      <ellipse cx="150" cy="650" rx="105" ry="34" fill="#3f8fc0" />
      <ellipse cx="150" cy="642" rx="90" ry="20" fill="#5aa6d2" opacity="0.7" />

      {/* Bunker */}
      <ellipse cx="455" cy="690" rx="80" ry="26" fill="#ecdca6" />

      {/* Putting green */}
      <ellipse cx="360" cy="700" rx="180" ry="70" fill="url(#green)" />
      <ellipse cx="345" cy="688" rx="120" ry="40" fill="#69b23f" opacity="0.6" />

      {/* Cactus (desert) */}
      <g fill="#2f5a2c">
        <rect x="62" y="486" width="13" height="64" rx="6" />
        <rect x="44" y="506" width="11" height="26" rx="5" />
        <rect x="44" y="506" width="24" height="11" rx="5" />
        <rect x="82" y="498" width="11" height="30" rx="5" />
        <rect x="70" y="498" width="24" height="11" rx="5" />
      </g>

      {/* Flagstick + flag */}
      <rect x="432" y="560" width="4" height="148" rx="2" fill="#f3f3ec" />
      <path d="M436,562 L482,576 L436,592 Z" fill="#8bc34a" />
      <circle cx="434" cy="708" r="6" fill="#1f3d18" opacity="0.25" />

      {/* Golf ball */}
      <ellipse cx="300" cy="792" rx="16" ry="6" fill="#1f3d18" opacity="0.2" />
      <circle cx="300" cy="778" r="13" fill="#ffffff" />
      <g fill="#d7ddcf">
        <circle cx="296" cy="775" r="1.3" />
        <circle cx="303" cy="774" r="1.3" />
        <circle cx="300" cy="780" r="1.3" />
        <circle cx="305" cy="781" r="1.3" />
      </g>
    </svg>
  )
}

export default function Home() {
  const trips = useStore((s) => s.trips)
  const tripMembers = useStore((s) => s.tripMembers)
  const resetAll = useStore((s) => s.resetAll)
  const navigate = useNavigate()

  return (
    <>
      <section className="hero">
        <HeroScene />
        <img
          className="hero-photo"
          src={`${import.meta.env.BASE_URL}hero.jpg`}
          alt=""
          aria-hidden="true"
          onError={(e) => {
            // No photo dropped in yet — fall back to the SVG scene.
            e.currentTarget.style.display = 'none'
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
            Invite friends, keep score, and use the in-game scorecard to track
            the whole trip.
          </p>

          <button
            className="hero-cta"
            onClick={() =>
              document
                .getElementById('menu')
                ?.scrollIntoView({ behavior: 'smooth' })
            }
          >
            <span className="tee" aria-hidden="true">
              🏌️
            </span>
            PLAN YOUR TRIP
          </button>
          <a
            className="hero-scroll"
            href="#menu"
            onClick={(e) => {
              e.preventDefault()
              document
                .getElementById('menu')
                ?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            Explore trips ↓
          </a>
        </div>
      </section>

      <section className="home-body" id="menu">
        <div className="menu-head">
          <h2 className="page-title">Our Preplanned Trips</h2>
        </div>
        <p className="page-sub">
          Curated stay-and-play packages — tap to explore the courses.
        </p>

        <div className="trip-slider">
          {PACKAGES.map((p) => (
            <Link className="slide-card" key={p.id} to={`/package/${p.id}`}>
              <img className="slide-bg" src={p.image} alt={p.destination} />
              <span className={`slide-tier ${p.tier}`}>{p.tierLabel}</span>
              <div className="slide-body">
                <div className="slide-loc">{p.region}</div>
                <h3 className="slide-title">{p.destination.split(',')[0]}</h3>
                <p className="slide-tag">
                  {p.courses.length} courses · {money(p.budgetMin)}–
                  {money(p.budgetMax)}/pp
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="section-title">Or start from scratch</div>
        <button className="create-own" onClick={() => navigate('/new')}>
          <span className="co-icon" aria-hidden="true">
            ⛳
          </span>
          <span className="co-text">
            <span className="co-title">Create your own</span>
            <span className="co-sub">
              Build a custom trip and invite friends to keep score.
            </span>
          </span>
          <span className="co-arrow" aria-hidden="true">
            →
          </span>
        </button>

        {trips.length > 0 && (
          <div id="your-trips">
            <div className="section-title">Your Trips</div>
            {[...trips]
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((trip) => {
                const members = tripMembers(trip.id)
                return (
                  <Link
                    key={trip.id}
                    to={`/trip/${trip.id}/setup`}
                    className="trip-card"
                  >
                    <div className="banner">
                      <h3>{trip.name}</h3>
                      <div className="where">
                        📍 {trip.destination || 'Destination TBD'} ·{' '}
                        {fmtDateRange(trip.startDate, trip.endDate)}
                      </div>
                    </div>
                    <div className="meta">
                      <div className="row">
                        <AvatarStack members={members} />
                        <span className="muted" style={{ fontSize: 13 }}>
                          {members.length}{' '}
                          {members.length === 1 ? 'player' : 'players'}
                        </span>
                      </div>
                      <span className="pill gold">
                        {money(trip.budgetMin)}–{money(trip.budgetMax)}/pp
                      </span>
                    </div>
                  </Link>
                )
              })}
          </div>
        )}

        <div style={{ marginTop: 28, textAlign: 'center' }}>
          <button
            className="btn sm subtle"
            onClick={() => {
              if (confirm('Reset all local data back to the sample trip?'))
                resetAll()
            }}
          >
            Reset demo data
          </button>
        </div>
      </section>
    </>
  )
}
