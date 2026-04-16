import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import { RequireAuth, RequireRole, PublicOnly } from './components/ProtectedRoute'

import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import LiveMap from './pages/LiveMap'
import PostListing from './pages/PostListing'
import ClaimPickup from './pages/ClaimPickup'
import ImpactDashboard from './pages/ImpactDashboard'
import DonorDashboard from './pages/DonorDashboard'
import ReceiverDashboard from './pages/ReceiverDashboard'
import AdminDashboard from './pages/AdminDashboard'

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Routes>
            {/* Public landing — always accessible */}
            <Route path="/" element={<LandingPage />} />

            {/* Auth pages — redirect to dashboard if already logged in */}
            <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
            <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />

            {/* Shared protected routes */}
            <Route path="/map" element={<RequireAuth><LiveMap /></RequireAuth>} />
            <Route path="/claim-pickup" element={<RequireAuth><ClaimPickup /></RequireAuth>} />
            <Route path="/impact" element={<RequireAuth><ImpactDashboard /></RequireAuth>} />

            {/* Donor-only routes */}
            <Route path="/donor/dashboard" element={
              <RequireRole roles={['donor']}><DonorDashboard /></RequireRole>
            } />
            <Route path="/post-listing" element={
              <RequireRole roles={['donor']}><PostListing /></RequireRole>
            } />

            {/* Receiver / NGO routes */}
            <Route path="/receiver/dashboard" element={
              <RequireRole roles={['receiver', 'ngo']}><ReceiverDashboard /></RequireRole>
            } />

            {/* Admin-only routes */}
            <Route path="/admin/dashboard" element={
              <RequireRole roles={['admin']}><AdminDashboard /></RequireRole>
            } />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  )
}

export default App
