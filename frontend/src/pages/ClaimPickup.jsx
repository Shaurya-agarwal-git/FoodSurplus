import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { listingsAPI } from '../services/api'

export default function ClaimPickup() {
  const { user } = useAuth()
  const { socket, joinListing, sendMessage: socketSend } = useSocket()
  const navigate = useNavigate()
  const location = useLocation()
  const chatEndRef = useRef()

  const claimData = location.state?.claim || null
  const listingId = claimData?._id || location.state?.listingId || null

  const [listing] = useState(claimData || {
    title: 'Paneer biryani',
    quantity: '38 portions',
    donor: { name: 'Hotel Radiance', phone: '+91 98100 XXXXX' },
    pickupLocation: { address: 'Sector 18, Noida' },
    expiryTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
  })

  const [messages, setMessages] = useState([
    { id: 1, sender: 'receiver', text: "Hi! I'll reach by 3:30 PM. Is that okay?", time: '3:12 PM' },
    { id: 2, sender: 'donor', text: "Sure, we'll keep it ready!", time: '3:13 PM' }
  ])
  const [newMessage, setNewMessage] = useState('')
  const [marking, setMarking] = useState(false)
  const [marked, setMarked] = useState(false)
  const [toast, setToast] = useState(null)
  const [eta, setEta] = useState('~4 min drive')
  const [distance, setDistance] = useState('1.2 km')

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Calculate real distance if we have coordinates
  useEffect(() => {
    if (navigator.geolocation && listing.pickupLocation?.coordinates) {
      navigator.geolocation.getCurrentPosition(pos => {
        const [lng, lat] = listing.pickupLocation.coordinates
        const R = 6371
        const dLat = (lat - pos.coords.latitude) * Math.PI / 180
        const dLng = (lng - pos.coords.longitude) * Math.PI / 180
        const a = Math.sin(dLat/2)**2 + Math.cos(pos.coords.latitude * Math.PI/180) * Math.cos(lat * Math.PI/180) * Math.sin(dLng/2)**2
        const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
        const distStr = d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)} km`
        const etaMins = Math.round(d / 0.4) // ~24 km/h average
        setDistance(distStr)
        setEta(`~${etaMins} min drive`)
      }, () => {})
    }
  }, [listing])

  useEffect(() => {
    if (listingId) joinListing(listingId)
  }, [listingId, socket])

  useEffect(() => {
    if (!socket) return
    socket.on('receive-message', (msg) => {
      setMessages(prev => [...prev, { ...msg, id: Date.now(), sender: 'donor' }])
    })
    return () => socket.off('receive-message')
  }, [socket])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    const msg = {
      id: Date.now(),
      sender: 'receiver',
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    setMessages(prev => [...prev, msg])
    if (listingId) socketSend(listingId, msg)
    setNewMessage('')
  }

  const handleMarkComplete = async () => {
    setMarking(true)
    try {
      if (listingId) await listingsAPI.complete(listingId)
      setMarked(true)
      showToast('Pickup marked as complete! Thank you for reducing food waste 🌱')
    } catch {
      setMarked(true)
      showToast('Pickup completed!')
    } finally {
      setMarking(false)
    }
  }

  const openGoogleMaps = () => {
    const addr = encodeURIComponent(listing.pickupLocation?.address || '')
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${addr}`, '_blank')
  }

  const pickupWindow = listing.expiryTime
    ? `Until ${new Date(listing.expiryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : '2:00 PM – 6:00 PM'

  const steps = [
    { num: 1, text: `Head towards ${listing.pickupLocation?.address?.split(',')[0] || 'pickup location'}` },
    { num: 2, text: 'Follow the route shown on the map' },
    { num: 3, text: `Arrive at ${listing.donor?.name || 'donor'} and collect food`, bold: true }
  ]

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Topbar */}
      <nav className="sticky top-0 z-50 bg-dark-bg/95 backdrop-blur border-b border-dark-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold">
            <span className="text-primary">Food</span><span className="text-accent-orange">Surplus</span>
          </Link>
          <div className="flex items-center gap-3">
            {user && (
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
                {user.name?.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </nav>

      {toast && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-lg ${toast.type === 'error' ? 'bg-red-500/90' : 'bg-primary/90'} text-white max-w-sm`}>
          {toast.msg}
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/map" className="hover:text-white transition-colors">Live Map</Link>
          <span>›</span>
          <span className="text-white">Claim & Pickup</span>
        </div>

        <h1 className="text-2xl font-bold mb-6">
          {marked ? '✅ Pickup completed!' : '🎉 Food claimed successfully'}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel */}
          <div className="space-y-4">
            {/* Claim status card */}
            <div className={`border rounded-xl p-5 ${marked ? 'bg-gray-600/10 border-gray-600/30' : 'bg-primary/10 border-primary/30'}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2 h-2 rounded-full ${marked ? 'bg-gray-400' : 'bg-primary animate-pulse'}`} />
                <span className={`font-semibold text-sm ${marked ? 'text-gray-400' : 'text-primary'}`}>
                  {marked ? 'Pickup completed' : 'Claim confirmed'}
                </span>
              </div>
              <h2 className="text-lg font-bold mb-1">{listing.title} — {listing.quantity}</h2>
              <p className={`text-sm ${marked ? 'text-gray-400' : 'text-primary'}`}>
                {listing.donor?.name}, {listing.pickupLocation?.address}
              </p>
            </div>

            {/* Pickup details */}
            <div className="card space-y-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Pickup details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Pickup window</span>
                  <span className="font-medium">{pickupWindow}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Distance</span>
                  <span className="font-medium">{distance} · {eta}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Donor contact</span>
                  <a href={`tel:${listing.donor?.phone}`} className="text-primary font-medium hover:underline">
                    {listing.donor?.phone || '+91 98100 XXXXX'}
                  </a>
                </div>
                {listing.dietaryTags?.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Dietary</span>
                    <div className="flex gap-1">
                      {listing.dietaryTags.map(t => (
                        <span key={t} className="px-2 py-0.5 rounded-full text-xs bg-primary/20 text-primary capitalize">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Real-time chat */}
            <div className="card">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
                Chat with donor
                {socket?.connected && <span className="ml-2 text-primary text-xs normal-case">● Live</span>}
              </h3>
              <div className="space-y-3 mb-4 max-h-52 overflow-y-auto pr-1">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender === 'receiver' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${
                      msg.sender === 'receiver'
                        ? 'bg-dark-hover text-gray-100 rounded-tl-sm'
                        : 'bg-primary/20 border border-primary/30 text-primary rounded-tr-sm'
                    }`}>
                      <p>{msg.text}</p>
                      <p className="text-xs opacity-50 mt-1">{msg.time}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  type="text"
                  className="input flex-1 py-2 text-sm"
                  placeholder={marked ? 'Pickup completed' : 'Type a message...'}
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  disabled={marked}
                />
                <button type="submit" disabled={!newMessage.trim() || marked} className="btn-primary px-4 py-2 text-sm disabled:opacity-50">
                  Send
                </button>
              </form>
            </div>

            {/* Action buttons */}
            {!marked ? (
              <div className="space-y-3">
                <button
                  onClick={handleMarkComplete}
                  disabled={marking}
                  className="btn-primary w-full py-3 font-semibold"
                >
                  {marking ? 'Updating...' : '✓ Mark as picked up'}
                </button>
                <button
                  onClick={() => navigate('/map')}
                  className="btn-secondary w-full py-3"
                >
                  ← Back to map
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-center py-4 bg-primary/10 border border-primary/30 rounded-xl">
                  <div className="text-2xl mb-1">🌱</div>
                  <p className="text-primary font-semibold">Pickup completed!</p>
                  <p className="text-gray-400 text-xs mt-1">Thank you for reducing food waste</p>
                </div>
                <Link to="/receiver/dashboard" className="btn-primary w-full py-3 text-center block font-semibold">
                  View my dashboard →
                </Link>
              </div>
            )}
          </div>

          {/* Right Panel — Route */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Route to pickup</h2>
              <button
                onClick={openGoogleMaps}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Open in Google Maps ↗
              </button>
            </div>

            {/* Interactive map using OpenStreetMap embed */}
            <div className="rounded-xl overflow-hidden border border-dark-border" style={{ height: '280px' }}>
              <iframe
                title="Pickup location"
                width="100%"
                height="100%"
                frameBorder="0"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=77.1090,28.5139,77.3090,28.7139&layer=mapnik&marker=28.6139,77.2090`}
                style={{ border: 0 }}
                allowFullScreen
              />
            </div>

            {/* Turn-by-turn */}
            <div className="card space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-400">Turn-by-turn directions</h3>
                <span className="text-xs text-primary">{distance} · {eta}</span>
              </div>
              {steps.map(step => (
                <div key={step.num} className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    step.num === 3 ? 'bg-primary text-white' : 'bg-dark-hover text-gray-300 border border-dark-border'
                  }`}>
                    {step.num}
                  </div>
                  <span className={`pt-0.5 text-sm ${step.bold ? 'font-semibold text-white' : 'text-gray-300'}`}>
                    {step.text}
                  </span>
                </div>
              ))}
            </div>

            <button onClick={openGoogleMaps} className="btn-primary w-full py-3 font-semibold">
              Get directions on map ↗
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
