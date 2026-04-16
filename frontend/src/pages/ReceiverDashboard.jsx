import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { listingsAPI, analyticsAPI } from '../services/api'

const STATUS_STYLE = {
  claimed: 'bg-blue-500/20 text-blue-400',
  completed: 'bg-gray-600/20 text-gray-400',
  expired: 'bg-red-500/20 text-red-400'
}

export default function ReceiverDashboard() {
  const { user, logout } = useAuth()
  const { socket } = useSocket()
  const navigate = useNavigate()

  const [claims, setClaims] = useState([])
  const [stats, setStats] = useState({ mealsReceived: 0, activeClaims: 0, completedClaims: 0 })
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (!socket) return
    socket.on('new-listing', (listing) => {
      showToast(`🍱 New food available: ${listing.title}`)
    })
    return () => socket.off('new-listing')
  }, [socket])

  const fetchData = async () => {
    setLoading(true)
    try {
      const uid = user._id || user.id
      const [listRes, statsRes] = await Promise.allSettled([
        listingsAPI.getAll({}),
        analyticsAPI.getReceiverStats(uid)
      ])
      if (listRes.status === 'fulfilled') {
        const mine = (listRes.value?.data || []).filter(l =>
          l.claimedBy?._id === uid || l.claimedBy === uid
        )
        setClaims(mine)
        setStats(prev => ({
          ...prev,
          activeClaims: mine.filter(l => l.status === 'claimed').length,
          completedClaims: mine.filter(l => l.status === 'completed').length
        }))
      }
      if (statsRes.status === 'fulfilled') {
        const s = statsRes.value?.data
        setStats(prev => ({ ...prev, mealsReceived: s?.mealsReceived ?? user?.stats?.mealsReceived ?? 0 }))
      } else {
        setStats(prev => ({ ...prev, mealsReceived: user?.stats?.mealsReceived ?? 0 }))
      }
    } finally {
      setLoading(false)
    }
  }

  const getTimeAgo = (date) => {
    const m = Math.floor((Date.now() - new Date(date)) / 60000)
    if (m < 1) return 'Just now'
    if (m < 60) return `${m}m ago`
    return `${Math.floor(m / 60)}h ago`
  }

  const activeClaims = claims.filter(l => l.status === 'claimed')
  const history = claims.filter(l => l.status !== 'claimed')

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Topbar */}
      <nav className="sticky top-0 z-50 bg-dark-bg/95 backdrop-blur border-b border-dark-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold">
            <span className="text-primary">Food</span><span className="text-accent-orange">Surplus</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 border border-dark-border px-3 py-1.5 rounded-lg capitalize">
              🤝 {user?.role}
            </span>
            <div className="w-9 h-9 rounded-full bg-accent-orange flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.slice(0, 2).toUpperCase()}
            </div>
            <button onClick={() => { logout(); navigate('/') }} className="text-xs text-gray-400 hover:text-white transition-colors px-3 py-1.5 border border-dark-border rounded-lg">
              Log out
            </button>
          </div>
        </div>
      </nav>

      {toast && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-lg ${toast.type === 'error' ? 'bg-red-500/90' : 'bg-primary/90'} text-white`}>
          {toast.msg}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Receiver Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">Welcome back, {user?.name} 👋</p>
          </div>
          <Link to="/map" className="btn-primary px-5 py-2.5 text-sm font-semibold">
            🗺️ Find food near me
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { value: stats.mealsReceived, label: 'Meals received', icon: '🍽️', color: 'text-primary' },
            { value: stats.activeClaims, label: 'Active claims', icon: '📦', color: 'text-accent-orange' },
            { value: stats.completedClaims, label: 'Completed pickups', icon: '✅', color: 'text-blue-400' }
          ].map((s, i) => (
            <div key={i} className="card text-center py-5">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className={`text-3xl font-bold mb-1 ${s.color}`}>{s.value}</div>
              <div className="text-gray-400 text-xs">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { icon: '🗺️', label: 'Find food on map', to: '/map', primary: true },
            { icon: '📦', label: 'Active pickups', to: '/claim-pickup' },
            { icon: '📊', label: 'Impact stats', to: '/impact' },
            { icon: '🔔', label: 'Notifications', to: '/map' }
          ].map(a => (
            <Link
              key={a.label}
              to={a.to}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-colors text-sm font-medium ${
                a.primary
                  ? 'bg-primary/15 border-primary/30 text-primary hover:bg-primary/25'
                  : 'bg-dark-card border-dark-border text-gray-300 hover:bg-dark-hover'
              }`}
            >
              <span className="text-xl">{a.icon}</span>
              {a.label}
            </Link>
          ))}
        </div>

        {/* Active claims */}
        {activeClaims.length > 0 && (
          <div className="card border-primary/20 mb-6">
            <h2 className="font-semibold text-primary mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse inline-block"></span>
              Active pickups ({activeClaims.length})
            </h2>
            <div className="space-y-3">
              {activeClaims.map(listing => (
                <div key={listing._id} className="flex items-center gap-4 p-4 bg-primary/5 rounded-xl border border-primary/20">
                  {listing.imageUrl
                    ? <img src={listing.imageUrl} alt={listing.title} className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
                    : <div className="w-14 h-14 bg-dark-border rounded-lg flex items-center justify-center text-2xl flex-shrink-0">🍱</div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{listing.title} — {listing.quantity}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {listing.donor?.name} · {listing.pickupLocation?.address?.split(',')[0]}
                    </p>
                    <p className="text-xs text-primary mt-1">
                      Until {new Date(listing.expiryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <Link
                    to="/claim-pickup"
                    state={{ claim: listing }}
                    className="btn-primary text-xs px-4 py-2 flex-shrink-0"
                  >
                    Pickup details →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Claim history */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-lg">Claim history</h2>
            <span className="text-sm text-gray-400">{claims.length} total</span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex gap-4 p-4 bg-dark-hover rounded-xl">
                  <div className="w-12 h-12 bg-dark-border rounded-lg flex-shrink-0"></div>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-dark-border rounded w-1/2"></div>
                    <div className="h-3 bg-dark-border rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : claims.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🗺️</div>
              <p className="text-gray-400 mb-4">No claims yet — find food near you</p>
              <Link to="/map" className="btn-primary px-6 py-2.5 text-sm">Find food near me</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {claims.map(listing => (
                <div key={listing._id} className="flex gap-4 p-4 bg-dark-hover rounded-xl border border-dark-border">
                  {listing.imageUrl
                    ? <img src={listing.imageUrl} alt={listing.title} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                    : <div className="w-12 h-12 bg-dark-border rounded-lg flex items-center justify-center text-xl flex-shrink-0">🍱</div>
                  }
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-sm truncate">{listing.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${STATUS_STYLE[listing.status] || 'bg-gray-600/20 text-gray-400'}`}>
                        {listing.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{listing.quantity} · from {listing.donor?.name || 'Donor'}</p>
                    <p className="text-xs text-gray-500 mt-1">{getTimeAgo(listing.claimedAt)}</p>
                  </div>
                  {listing.status === 'claimed' && (
                    <Link to="/claim-pickup" state={{ claim: listing }} className="text-xs px-3 py-1.5 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors self-center flex-shrink-0">
                      Pickup →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
