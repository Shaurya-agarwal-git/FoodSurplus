import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import Navbar from '../components/Navbar'
import { listingsAPI } from '../services/api'
import { useSocket } from '../context/SocketContext'
import { useAuth } from '../context/AuthContext'

// Fix Leaflet default icon issue with Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Custom colored SVG pin icons
const createPinIcon = (color, size = 32) => L.divIcon({
  className: '',
  html: `<svg width="${size}" height="${size + 8}" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="2.5"/>
    <circle cx="16" cy="16" r="6" fill="white"/>
    <path d="M16 30 L16 38" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`,
  iconSize: [size, size + 8],
  iconAnchor: [size / 2, size + 8],
  popupAnchor: [0, -(size + 8)]
})

const userIcon = L.divIcon({
  className: '',
  html: `<div style="width:20px;height:20px;background:#10b981;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(16,185,129,0.25)"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
})

const vegIcon = createPinIcon('#10b981')
const nonVegIcon = createPinIcon('#f59e0b')
const expiringIcon = createPinIcon('#ef4444')
const defaultIcon = createPinIcon('#6b7280')

// Component to fly map to user location
function FlyToLocation({ location }) {
  const map = useMap()
  useEffect(() => {
    if (location) {
      map.flyTo([location.lat, location.lng], 14, { duration: 1.5 })
    }
  }, [location, map])
  return null
}

const tagStyle = {
  veg: 'bg-primary/20 text-primary',
  vegan: 'bg-primary/20 text-primary',
  'non-veg': 'bg-amber-500/20 text-amber-400'
}

export default function LiveMap() {
  const { user } = useAuth()
  const { socket, joinLocation } = useSocket()
  const navigate = useNavigate()

  const [listings, setListings] = useState([])
  const [filtered, setFiltered] = useState([])
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('nearest')
  const [radius, setRadius] = useState(5)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState(null)
  const [locating, setLocating] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [claimSuccess, setClaimSuccess] = useState(null)
  const [toast, setToast] = useState(null)
  const [mapStyle, setMapStyle] = useState('streets')

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Detect user location on mount
  useEffect(() => {
    setLocating(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setUserLocation(loc)
          joinLocation(loc.lat, loc.lng)
          fetchListings(loc.lat, loc.lng, radius)
          setLocating(false)
        },
        () => {
          // Default to New Delhi if permission denied
          const defaultLoc = { lat: 28.6139, lng: 77.2090 }
          setUserLocation(defaultLoc)
          fetchListings(defaultLoc.lat, defaultLoc.lng, radius)
          setLocating(false)
          showToast('Using default location (New Delhi). Enable location for better results.', 'error')
        },
        { timeout: 8000, enableHighAccuracy: true }
      )
    } else {
      const defaultLoc = { lat: 28.6139, lng: 77.2090 }
      setUserLocation(defaultLoc)
      fetchListings(defaultLoc.lat, defaultLoc.lng, radius)
      setLocating(false)
    }
  }, [])

  const fetchListings = async (lat, lng, r) => {
    setLoading(true)
    try {
      const params = { radius: r }
      if (lat && lng) { params.latitude = lat; params.longitude = lng }
      const res = await listingsAPI.getAll(params)
      setListings(res?.data || [])
    } catch {
      setListings([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userLocation) fetchListings(userLocation.lat, userLocation.lng, radius)
  }, [radius])

  // Filter + search + sort
  useEffect(() => {
    let result = [...listings]
    if (filter === 'veg') result = result.filter(l => l.dietaryTags?.some(t => t === 'veg' || t === 'vegan'))
    if (filter === 'non-veg') result = result.filter(l => l.dietaryTags?.includes('non-veg'))
    if (filter === 'urgent') result = result.filter(l => {
      const mins = (new Date(l.expiryTime) - Date.now()) / 60000
      return mins < 60 && mins > 0
    })
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(l =>
        l.title?.toLowerCase().includes(q) ||
        l.pickupLocation?.address?.toLowerCase().includes(q) ||
        l.donor?.name?.toLowerCase().includes(q)
      )
    }
    if (sort === 'nearest' && userLocation) {
      result.sort((a, b) => calcDist(userLocation, a.pickupLocation?.coordinates) - calcDist(userLocation, b.pickupLocation?.coordinates))
    } else if (sort === 'newest') {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }
    setFiltered(result)
  }, [listings, filter, search, sort, userLocation])

  // Socket real-time
  useEffect(() => {
    if (!socket) return
    socket.on('new-listing', (listing) => {
      setListings(prev => [listing, ...prev])
      showToast(`New listing: ${listing.title}`)
    })
    socket.on('listing-claimed', ({ listingId }) => {
      setListings(prev => prev.map(l => l._id === listingId ? { ...l, status: 'claimed' } : l))
    })
    socket.on('listing-expired', ({ listingId }) => {
      setListings(prev => prev.filter(l => l._id !== listingId))
    })
    return () => {
      socket.off('new-listing')
      socket.off('listing-claimed')
      socket.off('listing-expired')
    }
  }, [socket])

  const calcDist = (userLoc, coords) => {
    if (!userLoc || !coords) return 999
    const [lng, lat] = coords
    const R = 6371
    const dLat = (lat - userLoc.lat) * Math.PI / 180
    const dLng = (lng - userLoc.lng) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(userLoc.lat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  const getDistLabel = (listing) => {
    if (!userLocation || !listing.pickupLocation?.coordinates) return ''
    const d = calcDist(userLocation, listing.pickupLocation.coordinates)
    return d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)} km`
  }

  const getTimeAgo = (date) => {
    const mins = Math.floor((Date.now() - new Date(date)) / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins} min ago`
    return `${Math.floor(mins / 60)}h ago`
  }

  const isExpiringSoon = (expiryTime) => {
    const mins = (new Date(expiryTime) - Date.now()) / 60000
    return mins < 60 && mins > 0
  }

  const getExpiryLabel = (expiryTime) => {
    const mins = Math.floor((new Date(expiryTime) - Date.now()) / 60000)
    if (mins < 0) return null
    if (mins < 60) return `Expires ${mins}m`
    return `Expires ${Math.floor(mins / 60)}h`
  }

  const primaryTag = (tags = []) => {
    if (tags.includes('vegan')) return 'vegan'
    if (tags.includes('veg')) return 'veg'
    if (tags.includes('non-veg')) return 'non-veg'
    return null
  }

  const getMarkerIcon = (listing) => {
    if (isExpiringSoon(listing.expiryTime)) return expiringIcon
    const tag = primaryTag(listing.dietaryTags)
    if (tag === 'veg' || tag === 'vegan') return vegIcon
    if (tag === 'non-veg') return nonVegIcon
    return defaultIcon
  }

  const getListingCoords = (listing) => {
    if (!listing.pickupLocation?.coordinates) return null
    const [lng, lat] = listing.pickupLocation.coordinates
    if (!lat || !lng) return null
    return [lat, lng]
  }

  const handleClaim = async (listing) => {
    if (!user) { navigate('/login'); return }
    setClaiming(true)
    try {
      const res = await listingsAPI.claim(listing._id)
      setClaimSuccess({ listing, chatId: res?.data?.chatId })
      setListings(prev => prev.map(l => l._id === listing._id ? { ...l, status: 'claimed' } : l))
      showToast('Food claimed successfully!')
    } catch (err) {
      showToast(err?.error?.message || 'Failed to claim listing', 'error')
    } finally {
      setClaiming(false)
    }
  }

  const tileUrl = mapStyle === 'satellite'
    ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

  const tileAttribution = mapStyle === 'satellite'
    ? '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      <Navbar user={user} />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-4 z-[9999] px-4 py-3 rounded-lg text-sm font-medium shadow-lg ${toast.type === 'error' ? 'bg-red-500/90 text-white' : 'bg-primary/90 text-white'}`}>
          {toast.msg}
        </div>
      )}

      {/* Claim Success Banner */}
      {claimSuccess && (
        <div className="bg-primary/10 border-b border-primary/30 px-4 py-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span className="text-primary font-medium text-sm">Claimed: {claimSuccess.listing.title}</span>
          </div>
          <button onClick={() => navigate('/claim-pickup', { state: { claim: claimSuccess.listing } })} className="btn-primary text-xs px-4 py-1.5">
            View pickup →
          </button>
        </div>
      )}

      <div className="flex flex-1" style={{ height: 'calc(100vh - 4rem)' }}>
        {/* Sidebar */}
        <div className="w-96 bg-dark-bg border-r border-dark-border flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-dark-border space-y-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search food, location..."
                className="input pl-10 text-sm py-2.5"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: `All (${listings.length})` },
                { key: 'veg', label: 'Veg only' },
                { key: 'non-veg', label: 'Non-veg' },
                { key: 'urgent', label: 'Urgent' }
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    filter === f.key
                      ? f.key === 'all' ? 'bg-white text-dark-bg' : 'bg-primary text-white'
                      : 'bg-dark-card text-gray-300 hover:bg-dark-hover'
                  }`}
                >
                  {f.label}
                </button>
              ))}
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-dark-card text-gray-300 border-0 outline-none cursor-pointer"
              >
                <option value="nearest">Nearest first</option>
                <option value="newest">Newest first</option>
              </select>
            </div>
          </div>

          {/* Listing cards */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="p-4 rounded-xl bg-dark-card border border-dark-border animate-pulse">
                  <div className="h-4 bg-dark-hover rounded mb-2 w-3/4"></div>
                  <div className="h-3 bg-dark-hover rounded w-1/2"></div>
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-3xl mb-2">🔍</div>
                <p className="text-sm">No listings match your search.</p>
                <button onClick={() => { setFilter('all'); setSearch('') }} className="text-primary text-xs mt-2 hover:underline">
                  Clear filters
                </button>
              </div>
            ) : (
              filtered.map(listing => (
                <div
                  key={listing._id}
                  onClick={() => setSelected(listing)}
                  className={`p-4 rounded-xl cursor-pointer transition-all border ${
                    selected?._id === listing._id
                      ? 'bg-primary/10 border-primary/40'
                      : 'bg-dark-card border-dark-border hover:bg-dark-hover'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`font-semibold text-sm leading-snug ${selected?._id === listing._id ? 'text-primary' : 'text-white'}`}>
                      {listing.title} — {listing.quantity}
                    </h3>
                    <span className="text-xs text-gray-500 ml-2 flex-shrink-0">{getDistLabel(listing)}</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">
                    {listing.donor?.name || 'Donor'} · {listing.pickupLocation?.address?.split(',')[0]} · {getTimeAgo(listing.createdAt)}
                  </p>
                  <div className="flex gap-1.5 flex-wrap">
                    {primaryTag(listing.dietaryTags) && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tagStyle[primaryTag(listing.dietaryTags)]}`}>
                        {primaryTag(listing.dietaryTags) === 'veg' ? 'Veg' : primaryTag(listing.dietaryTags) === 'non-veg' ? 'Non-veg' : 'Vegan'}
                      </span>
                    )}
                    {isExpiringSoon(listing.expiryTime) && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                        {getExpiryLabel(listing.expiryTime)}
                      </span>
                    )}
                    {getTimeAgo(listing.createdAt) === 'Just now' && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">Just posted</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          {/* Map controls overlay */}
          <div className="absolute top-4 left-4 z-[1000] bg-dark-card/95 backdrop-blur border border-dark-border rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-lg">
            <span className="text-xs text-gray-400">Radius:</span>
            <input
              type="range" min="1" max="20" value={radius}
              onChange={e => setRadius(Number(e.target.value))}
              className="w-28 accent-primary"
            />
            <span className="text-sm font-semibold w-12">{radius} km</span>
          </div>

          <div className="absolute top-4 right-4 z-[1000] flex gap-2 shadow-lg">
            <button
              onClick={() => setMapStyle(s => s === 'streets' ? 'satellite' : 'streets')}
              className="px-3 py-2 bg-dark-card/95 backdrop-blur border border-dark-border rounded-lg text-xs font-medium hover:bg-dark-hover transition-colors"
            >
              {mapStyle === 'streets' ? 'Satellite' : 'Streets'}
            </button>
          </div>

          {/* Active count */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-dark-card/95 backdrop-blur border border-dark-border rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span className="text-xs font-medium">{filtered.length} active listings</span>
          </div>

          {/* Locating indicator */}
          {locating && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] bg-dark-card/95 border border-dark-border rounded-full px-4 py-2 flex items-center gap-2">
              <svg className="animate-spin w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <span className="text-xs text-gray-400">Detecting your location...</span>
            </div>
          )}

          {/* Leaflet Map */}
          {userLocation && (
            <MapContainer
              center={[userLocation.lat, userLocation.lng]}
              zoom={14}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
            >
              <TileLayer url={tileUrl} attribution={tileAttribution} />
              <FlyToLocation location={userLocation} />

              {/* Radius circle */}
              <Circle
                center={[userLocation.lat, userLocation.lng]}
                radius={radius * 1000}
                pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.05, weight: 1.5, dashArray: '6 4' }}
              />

              {/* User location marker */}
              <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                <Popup>
                  <div className="text-center p-1">
                    <div className="font-semibold text-sm">📍 Your location</div>
                  </div>
                </Popup>
              </Marker>

              {/* Listing markers */}
              {filtered.map(listing => {
                const coords = getListingCoords(listing)
                if (!coords) return null
                return (
                  <Marker
                    key={listing._id}
                    position={coords}
                    icon={getMarkerIcon(listing)}
                    eventHandlers={{ click: () => setSelected(listing) }}
                  >
                    <Popup maxWidth={280} minWidth={240}>
                      <div style={{ fontFamily: 'inherit' }}>
                        {listing.imageUrl && (
                          <img src={listing.imageUrl} alt={listing.title} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }} />
                        )}
                        <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px', color: '#f3f4f6' }}>
                          {listing.title} — {listing.quantity}
                        </div>
                        <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>
                          {listing.pickupLocation?.address}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '10px' }}>
                          Until {new Date(listing.expiryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isExpiringSoon(listing.expiryTime) && <span style={{ color: '#ef4444', marginLeft: '4px' }}>· Expiring soon</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                          {primaryTag(listing.dietaryTags) && (
                            <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, background: primaryTag(listing.dietaryTags) === 'non-veg' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)', color: primaryTag(listing.dietaryTags) === 'non-veg' ? '#f59e0b' : '#10b981' }}>
                              {primaryTag(listing.dietaryTags) === 'veg' ? 'Veg' : primaryTag(listing.dietaryTags) === 'non-veg' ? 'Non-veg' : 'Vegan'}
                            </span>
                          )}
                          <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '11px', background: 'rgba(255,255,255,0.1)', color: '#9ca3af' }}>
                            {getDistLabel(listing)} away
                          </span>
                        </div>
                        {listing.status === 'active' ? (
                          <button
                            onClick={() => handleClaim(listing)}
                            disabled={claiming}
                            style={{ width: '100%', padding: '10px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: claiming ? 'not-allowed' : 'pointer', opacity: claiming ? 0.7 : 1 }}
                          >
                            {claiming ? 'Claiming...' : 'Claim this food'}
                          </button>
                        ) : (
                          <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '13px', padding: '8px' }}>Already claimed</div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                )
              })}
            </MapContainer>
          )}

          {/* Loading overlay */}
          {!userLocation && (
            <div className="absolute inset-0 bg-dark-bg flex items-center justify-center">
              <div className="text-center">
                <svg className="animate-spin w-8 h-8 text-primary mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <p className="text-gray-400 text-sm">Loading map...</p>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-6 left-4 z-[1000] bg-dark-card/95 backdrop-blur border border-dark-border rounded-xl p-3 shadow-lg">
            <div className="space-y-1.5">
              {[
                { color: '#10b981', label: 'Vegetarian' },
                { color: '#f59e0b', label: 'Non-vegetarian' },
                { color: '#ef4444', label: 'Expiring soon' }
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: item.color }}></div>
                  <span className="text-xs text-gray-300">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
