import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ScrollToTop from './components/ScrollToTop'
import Home from './pages/Home'
import Explore from './pages/Explore'
import NewTrip from './pages/NewTrip'
import PackageDetail from './pages/PackageDetail'
import TripSetup from './pages/TripSetup'
import Booking from './pages/Booking'
import Scorecard from './pages/Scorecard'
import RyderCup from './pages/RyderCup'
import Bets from './pages/Bets'
import Legal from './pages/Legal'

export default function App() {
  return (
    <Layout>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/new" element={<NewTrip />} />
        <Route path="/package/:packageId" element={<PackageDetail />} />
        <Route path="/legal" element={<Legal />} />
        <Route path="/trip/:tripId" element={<Navigate to="setup" replace />} />
        <Route path="/trip/:tripId/setup" element={<TripSetup />} />
        <Route path="/trip/:tripId/book" element={<Booking />} />
        <Route
          path="/trip/:tripId/vote"
          element={<Navigate to="../score" replace />}
        />
        <Route path="/trip/:tripId/score" element={<Scorecard />} />
        <Route path="/trip/:tripId/ryder" element={<RyderCup />} />
        <Route path="/trip/:tripId/bets" element={<Bets />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
