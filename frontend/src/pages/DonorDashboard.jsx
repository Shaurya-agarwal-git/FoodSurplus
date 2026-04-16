import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { listingsAPI, analyticsAPI } from '../services/api'

const STATUS_STYLE = {
  active: 'bg-primary/20 text-primary',
  claimed: 'bg-blue-500/20 text-blue-400',
  completed: 'bg-gray-600/20 text-gray-400',
  expired: 'bg-red-500/20 text-red-400'
}

export default function DonorDashboard() {
  const { user, logout } = useAuth()
  const { socket } = useSocket()
  const navigate = useNavigate()

  const [listings, setListings] = useState([])
  const [stats, setStats] = useState({ mealsDonated: 0, activeListings: 0, co2Avoided: 0, completedListings: 0 })
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('active')
  const [toast, setToast] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (!socket) return
    socket.on('listing-claimed', ({ listingId }) => {
      setListings(prev => prev.map(l => l._id === listingId ? { ...l, status: 'claimed' } : l))
      showToast('🎉 Someone claimed your listing!')
    })
    return () => socket.off('listing-claimed')
  }, [socket])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [listRes, statsRes] = await Promise.allSettled([
        listingsAPI.getAll({}),
        analyticsAPI.getDonorStats(user._id || user.id)
      ])
      if (listRes.status === 'fulfilled') {
        const uid = user._id || user.id
        const mine = (listRes.value?.data || []).filter(l =>
          l.donor?._id === uid || l.donor === uid
        )
        setListings(mine)
        const active = mine.filter(l => l.status === 'active').length
        const completed = mine.filter(l => l.status === 'completed').length
        setStats(prev => ({ ...prev, activeListings: active, completedListings: completed }))
      }
      if (statsRes.status === 'fulfilled') {
        const s = statsRes.value?.data
        setStats(prev => ({
          ...prev,
          mealsDonated: s?.mealsDonated ?? user?.stats?.mealsDonated ?? 0,
          co2Avoided: s?.co2Avoided ?? user?.stats?.co2Avoided ?? 0
        }))
      } else {
        setStats(prev => ({
          ...prev,
          mealsDonated: user?.stats?.mealsDonated ?? 0,
          co2Avoided: user?.stats?.co2Avoided ?? 0
        }))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this listing?')) return
    setDeleting(id)
    try {
      await listingsAPI.delete(id)
      setListings(prev => prev.filter(l => l._id !== id))
      showToast('Listing deleted')
    } catch {
      showToast('Failed to delete', 'error')
    } finally {
      setDeleting(null)
    }
  }

  const handleComplete = async (id) => {
    try {
      await listingsAPI.complete(id)
      setListings(prev => prev.map(l => l._id === id ? { ...l, status: 'completed' } : l))
      showToast('Marked as completed!')
    } catch {
      showToast('Failed to update', 'error')
    }
  }

  const getTimeLeft = (exp) => {
    const m = Math.floor((new Date(exp) - Date.now()) / 60000)
    if (m < 0) return 'Expired'
    if (m < 60) return `${m}m left`
    return `${Math.floor(m / 60)}h left`
  }

  const tabListings = listings.filter(l => {
    if (tab === 'active') return l.status === 'active'
    if (tab === 'claimed') return l.status === 'claimed'
    if (tab === 'completed') return l.status === 'completed'
    if (tab === 'expired') return l.status === 'expired'
    return true
  })

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
              🍱 {user?.role}
            </span>
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
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
            <h1 className="text-2xl font-bold">Donor Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">Welcome back, {user?.name} 👋</p>
          </div>
          <Link to="/post-listing" className="btn-primary px-5 py-2.5 text-sm font-semibold">
            + Post food listing
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { value: stats.mealsDonated, label: 'Meals donated', icon: '🍽️', color: 'text-primary' },
            { value: stats.activeListings, label: 'Active listings', icon: '📋', color: 'text-accent-orange' },
            { value: stats.completedListings, label: 'Completed', icon: '✅', color: 'text-blue-400' },
            { value: `${Number(stats.co2Avoided).toFixed(1)} kg`, label: 'CO₂ avoided', icon: '🌱', color: 'text-purple-400' }
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
            { icon: '📸', label: 'Post new listing', to: '/post-listing', primary: true },
            { icon: '🗺️', label: 'View live map', to: '/map' },
            { icon: '📊', label: 'Impact stats', to: '/impact' },
            { icon: '💬', label: 'Active pickups', to: '/claim-pickup' }
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

        {/* Listings */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-lg">My listings</h2>
            <span className="text-sm text-gray-400">{listings.length} total</span>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-5 bg-dark-hover rounded-xl p-1">
            {[
              { key: 'active', label: 'Active', count: listings.filter(l => l.status === 'active').length },
              { key: 'claimed', label: 'Claimed', count: listings.filter(l => l.status === 'claimed').length },
              { key: 'completed', label: 'Completed', count: listings.filter(l => l.status === 'completed').length },
              { key: 'expired', label: 'Expired', count: listings.filter(l => l.status === 'expired').length }
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                  tab === t.key ? 'bg-dark-card text-white shadow' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {t.label} {t.count > 0 && <span className="ml-1 opacity-60">({t.count})</span>}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex gap-4 p-4 bg-dark-hover rounded-xl">
                  <div className="w-16 h-16 bg-dark-border rounded-lg flex-shrink-0"></div>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-dark-border rounded w-1/2"></div>
                    <div className="h-3 bg-dark-border rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : tabListings.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">
                {tab === 'active' ? '📋' : tab === 'claimed' ? '🤝' : tab === 'completed' ? '✅' : '⏰'}
              </div>
              <p className="text-gray-400 mb-4">No {tab} listings</p>
              {tab === 'active' && (
                <Link to="/post-listing" className="btn-primary px-6 py-2.5 text-sm">Post your first listing</Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {tabListings.map(listing => (
                <div key={listing._id} className="flex gap-4 p-4 bg-dark-hover rounded-xl border border-dark-border hover:border-primary/20 transition-colors">
                  {listing.imageUrl
                    ? <img src={listing.imageUrl} alt={listing.title} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                    : <div className="w-16 h-16 bg-dark-border rounded-lg flex items-center justify-center text-2xl flex-shrink-0">🍱</div>
                  }
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold truncate">{listing.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${STATUS_STYLE[listing.status]}`}>
                        {listing.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{listing.quantity} · {listing.pickupLocation?.address?.split(',')[0]}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className={`text-xs ${listing.status === 'active' ? 'text-primary' : 'text-gray-500'}`}>
                        {getTimeLeft(listing.expiryTime)}
                      </span>
                      {listing.status === 'claimed' && listing.claimedBy?.name && (
                        <span className="text-xs text-blue-400">Claimed by {listing.claimedBy.name}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0 justify-center">
                    {listing.status === 'claimed' && (
                      <button
                        onClick={() => handleComplete(listing._id)}
                        className="text-xs px-3 py-1.5 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors whitespace-nowrap"
                      >
                        Mark done ✓
                      </button>
                    )}
                    {listing.status === 'active' && (
                      <button
                        onClick={() => handleDelete(listing._id)}
                        disabled={deleting === listing._id}
                        className="text-xs px-3 py-1.5 bg-red-500/15 text-red-400 rounded-lg hover:bg-red-500/25 transition-colors disabled:opacity-50"
                      >
                        {deleting === listing._id ? '...' : 'Delete'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
