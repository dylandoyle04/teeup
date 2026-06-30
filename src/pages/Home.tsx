import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()

  return (
    <section className="hero">
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
    </section>
  )
}
