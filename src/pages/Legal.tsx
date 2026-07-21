import { Link } from 'react-router-dom'

const UPDATED = 'July 21, 2026'
const CONTACT = 'hello@flagstickfinder.com'

export default function Legal() {
  return (
    <div className="legal">
      <div className="page-head">
        <h1 className="page-title">Privacy, Terms &amp; Disclosures</h1>
        <p className="page-sub">Last updated: {UPDATED}</p>
      </div>

      {/* ---------------- Affiliate disclosure ---------------- */}
      <h2 className="section-title explore-h2">Affiliate Disclosure</h2>
      <div className="card legal-card">
        <p>
          Flagstick Finder participates in affiliate programs. Some links on
          this site — including links to tee times, hotels, flights, rental
          cars, and restaurant reservations — are affiliate links. If you click
          one and make a booking or purchase, we may earn a commission.
        </p>
        <p>
          <strong>This costs you nothing extra.</strong> You pay the same price
          you would by going to the partner directly.
        </p>
        <p>
          Our course recommendations, trip packages, and restaurant picks are
          chosen on merit — commissions never determine what we recommend or how
          we rank it. Ratings and details come from public sources and the
          partners' own listings.
        </p>
        <p className="hint" style={{ marginBottom: 0 }}>
          Partners currently include GolfNow, Expedia, OpenTable, and Airbnb.
          This list may change over time.
        </p>
      </div>

      {/* ---------------- Privacy ---------------- */}
      <h2 className="section-title explore-h2">Privacy Policy</h2>
      <div className="card legal-card">
        <h3 className="legal-h3">The short version</h3>
        <p>
          Flagstick Finder has no accounts and no server of its own. Everything
          you enter — trips, players, scores, and bets — is saved{' '}
          <strong>only in your own browser</strong>, on your own device. We
          never receive it and cannot see it.
        </p>

        <h3 className="legal-h3">What we store, and where</h3>
        <p>
          Your trip data is kept in your browser's local storage. It stays on
          your device until you clear it. If you clear your browser data, use a
          different browser or device, or press "Reset demo data" in the app,
          that information is gone — we hold no copy and cannot restore it.
        </p>

        <h3 className="legal-h3">What we don't do</h3>
        <p>
          We don't run analytics, advertising, or tracking cookies. We don't
          collect names, emails, or payment details, and we don't sell or share
          personal information — we don't have any to sell.
        </p>

        <h3 className="legal-h3">Third parties</h3>
        <p>
          A few services are unavoidably involved in delivering the site:
        </p>
        <ul className="legal-list">
          <li>
            <strong>Hosting (GitHub Pages).</strong> Like any website host,
            GitHub records standard technical request logs, which can include
            your IP address and browser type.
          </li>
          <li>
            <strong>Fonts (Google Fonts).</strong> Our typefaces load from
            Google's servers, so Google receives your IP address as part of that
            request.
          </li>
          <li>
            <strong>Partner links.</strong> When you follow a link to GolfNow,
            Expedia, OpenTable, Airbnb, or Google Maps, you leave this site.
            Those companies set their own cookies and follow their own privacy
            policies, which govern anything you do there.
          </li>
        </ul>

        <h3 className="legal-h3">Children</h3>
        <p>
          This site isn't directed at children under 13, and we don't knowingly
          collect information from them.
        </p>

        <h3 className="legal-h3">Changes</h3>
        <p>
          We may update this policy as the app grows — for example, if we add
          accounts so friends can share a live scorecard. Material changes will
          be reflected in the "last updated" date above.
        </p>
      </div>

      {/* ---------------- Terms ---------------- */}
      <h2 className="section-title explore-h2">Terms of Use</h2>
      <div className="card legal-card">
        <h3 className="legal-h3">What this service is</h3>
        <p>
          Flagstick Finder is a planning tool. We don't sell, provide, or
          guarantee golf, travel, or dining services. Every booking happens on a
          third party's website under that company's own terms, and your
          agreement for those services is with them, not with us.
        </p>

        <h3 className="legal-h3">Accuracy</h3>
        <p>
          Course details, par and yardage figures, price ranges, restaurant
          ratings, and drive times are estimates gathered from public sources.
          They change and may be out of date or incorrect. Always confirm
          details, availability, and pricing with the course, hotel, or
          restaurant before you book or travel.
        </p>

        <h3 className="legal-h3">Scoring and side games</h3>
        <p>
          The scorecard, games, and betting tracker are for keeping track of
          informal games among friends. The app never handles, transfers, or
          holds money — it only tallies what you enter. You are responsible for
          following the laws that apply where you play.
        </p>

        <h3 className="legal-h3">Your data is your responsibility</h3>
        <p>
          Because trip data lives only in your browser, we can't back it up or
          recover it. Keep your own record of anything you'd hate to lose.
        </p>

        <h3 className="legal-h3">No warranty</h3>
        <p>
          The site is provided "as is," without warranties of any kind. To the
          fullest extent permitted by law, we aren't liable for any loss arising
          from your use of the site, from third-party bookings, or from
          inaccurate information.
        </p>

        <h3 className="legal-h3">Contact</h3>
        <p style={{ marginBottom: 0 }}>
          Questions about any of the above? Email{' '}
          <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
        </p>
      </div>

      <Link to="/explore" className="btn ghost" style={{ marginTop: 8 }}>
        ← Back to trips
      </Link>
    </div>
  )
}
