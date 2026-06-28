import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import NewTrip from './pages/NewTrip'
import PackageDetail from './pages/PackageDetail'
import TripSetup from './pages/TripSetup'
import Scorecard from './pages/Scorecard'
import Bets from './pages/Bets'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/new" element={<NewTrip />} />
        <Route path="/package/:packageId" element={<PackageDetail />} />
        <Route path="/trip/:tripId" element={<Navigate to="setup" replace />} />
        <Route path="/trip/:tripId/setup" element={<TripSetup />} />
        <Route
          path="/trip/:tripId/vote"
          element={<Navigate to="../score" replace />}
        />
        <Route path="/trip/:tripId/score" element={<Scorecard />} />
        <Route path="/trip/:tripId/bets" element={<Bets />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
