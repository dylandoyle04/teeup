import { Link } from 'react-router-dom'

const UPDATED = 'November 5, 2026'
const CONTACT = 'Flagstickfinder@outlook.com'

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
          our website and in our app — including links to tee times, hotels, flights, rental
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
          Partners currently include GolfNow, Expedia, Vrbo, and OpenTable.
          This list may change over time.
        </p>
      </div>

      {/* ---------------- Privacy ---------------- */}
      <h2 className="section-title explore-h2">Privacy Policy</h2>
      <div className="card legal-card">
        <p>
          This policy covers the Flagstick Finder website
          (flagstickfinder.com) and the Flagstick Finder iPhone app.
        </p>

        <h3 className="legal-h3">The short version</h3>
        <p>
          You can use Flagstick Finder without an account. Trips, players,
          scores and bets you enter that way are saved{' '}
          <strong>only on your own device</strong> &mdash; in your browser on
          the website, or inside the app on your iPhone. We never receive that
          data. We don&apos;t run ads, analytics or tracking, and we never sell
          personal information.
        </p>

        <h3 className="legal-h3">Data saved on your device</h3>
        <p>
          Guest trips stay on your device until you delete them, clear your
          browser data, use &ldquo;Reset app data&rdquo; in the app&apos;s
          Settings, or delete the app. We hold no copy and can&apos;t restore
          them. Small preferences (such as sound on/off or your last
          &ldquo;trips near you&rdquo; search) are stored the same way.
        </p>

        <h3 className="legal-h3">Optional account (website)</h3>
        <p>
          On the website you can sign in with your email to share a trip and
          keep score live with friends. If you do, we store your email
          address, the display name you choose, and the shared trips you create
          or join &mdash; trip details, member names, rounds and scores. Only
          members of a trip can see it. This data is held by our database
          provider, Supabase, on our behalf. To delete your account and its
          data, email us at <a href={`mailto:${CONTACT}`}>{CONTACT}</a> and
          we&apos;ll remove it within 30 days. The iPhone app doesn&apos;t
          offer accounts yet.
        </p>

        <h3 className="legal-h3">Permissions in the app</h3>
        <ul className="legal-list">
          <li>
            <strong>Location (optional, while using the app).</strong> Only
            used when you tap &ldquo;Use my location&rdquo;, to sort trips by
            distance. The calculation happens on your phone; your location
            isn&apos;t sent to us. The website works the same way.
          </li>
          <li>
            <strong>Calendar (add-only).</strong> Only used when you tap
            &ldquo;Add to Calendar&rdquo;, to add your trip. The app can&apos;t
            read your calendar.
          </li>
          <li>
            <strong>Photos (add-only).</strong> Only used if you choose
            &ldquo;Save Image&rdquo; when sharing a scorecard. The app
            can&apos;t see your photo library.
          </li>
        </ul>
        <p>
          When you share a scorecard image or trip plan, it goes only where you
          send it through your phone&apos;s share sheet.
        </p>

        <h3 className="legal-h3">Third parties</h3>
        <ul className="legal-list">
          <li>
            <strong>Hosting (GitHub Pages).</strong> The website and the
            app&apos;s course photos are served by GitHub, which records
            standard technical request logs that can include your IP address.
          </li>
          <li>
            <strong>Fonts (Google Fonts).</strong> The website&apos;s typefaces
            load from Google&apos;s servers, so Google receives your IP address
            as part of that request.
          </li>
          <li>
            <strong>Accounts (Supabase).</strong> Stores account and shared-trip
            data for website sign-in, as described above.
          </li>
          <li>
            <strong>Partner links.</strong> When you follow a link to a golf
            course, GolfNow, Expedia, Vrbo, OpenTable, or Google Maps, you leave
            Flagstick Finder. Those companies set their own cookies and follow
            their own privacy policies, which govern anything you do there.
          </li>
        </ul>

        <h3 className="legal-h3">Children</h3>
        <p>
          Flagstick Finder isn&apos;t directed at children under 13, and we
          don&apos;t knowingly collect information from them.
        </p>

        <h3 className="legal-h3">Changes</h3>
        <p>
          We&apos;ll update this policy as Flagstick Finder grows &mdash; for
          example, when accounts come to the app. Material changes will be
          reflected in the &ldquo;last updated&rdquo; date above.
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
          Guest trips live only on your device (your browser or the app), so we
          can't back them up or recover them. Keep your own record of anything you'd hate to lose.
        </p>

        <h3 className="legal-h3">No warranty</h3>
        <p>
          Flagstick Finder (the website and the app) is provided "as is," without warranties of any kind. To the
          fullest extent permitted by law, we aren't liable for any loss arising
          from your use of Flagstick Finder, from third-party bookings, or from
          inaccurate information.
        </p>

        <h3 className="legal-h3">Contact &amp; customer support</h3>
        <p style={{ marginBottom: 0 }}>
          Need help with a trip, hit a bug, or have a question about anything
          above? Reach out any time at{' '}
          <a href={`mailto:${CONTACT}`}>{CONTACT}</a> and we'll get back to you.
          For issues with a booking you made on a partner site — a tee time,
          hotel, flight, or reservation — contact that company directly, since
          they hold the booking.
        </p>
      </div>

      <p className="hint" style={{ margin: '0 4px 12px' }}>
        City and town locations from{' '}
        <a href="https://www.geonames.org/" target="_blank" rel="noreferrer noopener">
          GeoNames
        </a>
        , licensed under{' '}
        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer noopener">
          CC BY 4.0
        </a>
        .
      </p>

      <Link to="/explore" className="btn ghost" style={{ marginTop: 8 }}>
        ← Back to trips
      </Link>
    </div>
  )
}
