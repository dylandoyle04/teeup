import { Link, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store'
import { getPackage } from '../packages'
import { money } from '../components/ui'
import Carousel from '../components/Carousel'

export default function PackageDetail() {
  const { packageId = '' } = useParams()
  const navigate = useNavigate()
  const pkg = getPackage(packageId)
  const createTripFromPackage = useStore((s) => s.createTripFromPackage)

  if (!pkg) {
    return (
      <div className="empty card">
        <p>That package doesn't exist.</p>
        <Link to="/" className="btn subtle sm">
          Back to menu
        </Link>
      </div>
    )
  }

  function startTrip() {
    const id = createTripFromPackage(pkg!)
    navigate(`/trip/${id}/setup`)
  }

  return (
    <div className="pkg">
      <div className="pkg-hero">
        <img className="pkg-hero-img" src={pkg.image} alt={pkg.destination} />
        <div className="pkg-hero-scrim" />
        <button className="pkg-back" onClick={() => navigate('/')}>
          ← Menu
        </button>
        <div className="pkg-hero-text">
          <span className={`tier-badge ${pkg.tier}`}>{pkg.tierLabel}</span>
          <div className="pkg-loc">{pkg.region}</div>
          <h1 className="pkg-title">{pkg.title}</h1>
          <div className="pkg-meta">
            <span>📍 {pkg.destination}</span>
            <span>⛳ {pkg.courses.length} courses</span>
            <span>
              {money(pkg.budgetMin)}–{money(pkg.budgetMax)}/pp
            </span>
          </div>
        </div>
      </div>

      <div className="pkg-body">
        <p className="pkg-blurb">{pkg.blurb}</p>

        <button className="btn full gold" onClick={startTrip}>
          Start a trip from this package →
        </button>
        <p className="hint" style={{ textAlign: 'center', marginTop: 8 }}>
          Pre-loads these courses so your group can vote on tee times, hotels,
          and flights.
        </p>

        <div className="section-title">The Courses</div>
        {pkg.courses.map((c) => (
          <div className="course-card" key={c.name}>
            <Carousel images={c.images} alt={c.name} />
            <div className="course-info">
              <h3 className="course-name">{c.name}</h3>
              <p className="course-blurb">{c.blurb}</p>
            </div>
          </div>
        ))}

        <button className="btn full ghost" onClick={() => navigate('/')}>
          ← Back to menu
        </button>
      </div>
    </div>
  )
}
