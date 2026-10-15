import { Link } from 'react-router-dom'
import { playRyderCheer } from '../sound'

/** Banner that sends people to the Ryder Cup page (sound starts on the tap). */
export default function RyderPromo() {
  return (
    <Link to="/ryder-cup" className="rc-promo" onClick={() => playRyderCheer()} data-reveal>
      <span className="rc-promo-cup" aria-hidden="true">
        🏆
      </span>
      <span className="rc-promo-text">
        <span className="rc-promo-kicker">Team golf, trip-long</span>
        <span className="rc-promo-title">Play your own Ryder Cup</span>
        <span className="rc-promo-sub">Two teams, three formats, one cup. Points update live.</span>
      </span>
      <span className="rc-promo-arrow" aria-hidden="true">
        →
      </span>
    </Link>
  )
}
