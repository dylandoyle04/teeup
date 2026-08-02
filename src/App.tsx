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
import SignIn from './pages/SignIn'
import SharedTrip from './pages/SharedTrip'
import NewSharedTrip from './pages/NewSharedTrip'
import JoinTrip from './pages/JoinTrip'
import ShareScorecard from './pages/ShareScorecard'
import SharedRyder from './pages/SharedRyder'

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
        <Route path="/signin" element={<SignIn />} />
        <Route path="/shared/new" element={<NewSharedTrip />} />
        <Route path="/shared/:id" element={<SharedTrip />} />
        <Route path="/shared/:id/round/:roundId" element={<ShareScorecard />} />
        <Route path="/shared/:id/ryder" element={<SharedRyder />} />
        <Route path="/join/:code" element={<JoinTrip />} />
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
