import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { listingsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function PostListing() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef()

  const [step, setStep] = useState(1)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [aiResult, setAiResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [radius, setRadius] = useState(5)
  const [dragOver, setDragOver] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', foodType: '', quantity: '',
    dietaryTags: [], pickupAddress: '', expiryTime: '', imageUrl: ''
  })

  const dietaryOptions = ['veg', 'non-veg', 'vegan', 'gluten-free', 'dairy-free']

  const toggleTag = (tag) => {
    setForm(prev => ({
      ...prev,
      dietaryTags: prev.dietaryTags.includes(tag)
        ? prev.dietaryTags.filter(t => t !== tag)
        : [...prev.dietaryTags, tag]
    }))
  }

  const handleFileSelect = (file) => {
    if (!file || !file.type.startsWith('image/')) { setError('Please select a valid image file'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB'); return }
    setError('')
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    handleFileSelect(e.dataTransfer.files[0])
  }

  const handleAnalyze = async () => {
    if (!imageFile) return
    setAnalyzing(true); setError('')
    try {
      const fd = new FormData()
      fd.append('image', imageFile)
      const res = await listingsAPI.analyzeImage(fd)
      const { imageUrl, analysis } = res.data
      setAiResult(analysis)
      setForm(prev => ({
        ...prev, imageUrl,
        title: analysis.foodType || prev.title,
        foodType: analysis.foodType || prev.foodType,
        quantity: analysis.quantity || prev.quantity,
        dietaryTags: analysis.dietaryTags || prev.dietaryTags,
        expiryTime: analysis.suggestedExpiry
          ? new Date(analysis.suggestedExpiry).toISOString().slice(0, 16)
          : prev.expiryTime
      }))
      setStep(2)
    } catch {
      setError('AI analysis unavailable — fill in details manually.')
      setStep(2)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.quantity || !form.pickupAddress || !form.expiryTime) {
      setError('Please fill in all required fields'); return
    }
    setSubmitting(true); setError('')
    try {
      await listingsAPI.create({
        ...form,
        pickupRadius: radius,
        pickupLocation: {
          address: form.pickupAddress,
          type: 'Point',
          coordinates: [77.2090, 28.6139]
        }
      })
      navigate('/donor/dashboard')
    } catch (err) {
      setError(err?.error?.message || 'Failed to post listing.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar user={user} />
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header + Steps */}
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-2xl font-bold">Post surplus food</h1>
          <div className="flex items-center gap-2 ml-auto">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-1.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= s ? 'bg-primary text-white' : 'bg-dark-card text-gray-500 border border-dark-border'}`}>{s}</div>
                <span className={`text-xs ${step >= s ? 'text-white' : 'text-gray-500'}`}>{s === 1 ? 'Upload photo' : 'Fill details'}</span>
                {s < 2 && <div className={`w-8 h-px ${step > s ? 'bg-primary' : 'bg-dark-border'}`}></div>}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/15 border border-red-500/40 rounded-lg text-red-400 text-sm">{error}</div>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <div className="card space-y-6">
            <div>
              <label className="block text-sm font-medium mb-3">Food photo</label>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${dragOver ? 'border-primary bg-primary/10' : 'border-dark-border hover:border-primary/60'}`}
              >
                {imagePreview
                  ? <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg object-contain" />
                  : <>
                      <div className="text-5xl mb-3">📸</div>
                      <p className="text-gray-300 font-medium mb-1">Click to upload or drag and drop</p>
                      <p className="text-sm text-gray-500">JPG, PNG, WebP up to 5MB</p>
                      <p className="text-xs text-primary mt-2">AI will auto-detect food type, quantity & dietary tags</p>
                    </>
                }
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileSelect(e.target.files[0])} />
              </div>
              {imagePreview && (
                <button onClick={() => { setImageFile(null); setImagePreview(null) }} className="text-xs text-gray-500 hover:text-red-400 mt-2 transition-colors">
                  Remove image
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={handleAnalyze} disabled={!imageFile || analyzing} className="btn-primary flex-1 py-3 disabled:opacity-50 disabled:cursor-not-allowed">
                {analyzing
                  ? <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Analyzing with AI...
                    </span>
                  : '✨ Analyze with AI'
                }
              </button>
              <button onClick={() => setStep(2)} className="btn-secondary px-6 py-3">Skip →</button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {aiResult && (
              <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-primary text-sm font-semibold">✨ AI Analysis</span>
                  <span className="text-xs text-gray-400">{Math.round((aiResult.confidence || 0.85) * 100)}% confidence</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-400">Food:</span> <span className="text-white ml-1">{aiResult.foodType}</span></div>
                  <div><span className="text-gray-400">Quantity:</span> <span className="text-white ml-1">{aiResult.quantity}</span></div>
                  <div><span className="text-gray-400">Dietary:</span> <span className="text-primary ml-1">{aiResult.dietaryTags?.join(', ')}</span></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Form auto-filled. Review and edit before posting.</p>
              </div>
            )}

            {imagePreview && (
              <div className="flex items-center gap-3 p-3 bg-dark-card rounded-xl border border-dark-border">
                <img src={imagePreview} alt="Food" className="w-16 h-16 object-cover rounded-lg" />
                <div>
                  <p className="text-sm font-medium">Photo ready</p>
                  <button type="button" onClick={() => setStep(1)} className="text-xs text-primary hover:underline">Change photo</button>
                </div>
              </div>
            )}

            <div className="card space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Food title <span className="text-red-400">*</span></label>
                <input type="text" className="input" placeholder="e.g., Paneer biryani" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Description</label>
                <textarea className="input resize-none" rows="2" placeholder="Any additional details..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Quantity <span className="text-red-400">*</span></label>
                  <input type="text" className="input" placeholder="e.g., 30 portions" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Expiry time <span className="text-red-400">*</span></label>
                  <input type="datetime-local" className="input" value={form.expiryTime} onChange={e => setForm({ ...form, expiryTime: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Dietary tags</label>
                <div className="flex flex-wrap gap-2">
                  {dietaryOptions.map(tag => (
                    <button key={tag} type="button" onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${form.dietaryTags.includes(tag) ? 'bg-primary text-white' : 'bg-dark-hover text-gray-300 hover:bg-dark-border'}`}>
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="card space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Pickup address <span className="text-red-400">*</span></label>
                <input type="text" className="input" placeholder="Enter full address..." value={form.pickupAddress} onChange={e => setForm({ ...form, pickupAddress: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Pickup radius: <span className="text-primary font-semibold">{radius} km</span>
                </label>
                <input type="range" min="1" max="20" value={radius} onChange={e => setRadius(Number(e.target.value))} className="w-full accent-primary" />
                <div className="flex justify-between text-xs text-gray-500 mt-1"><span>1 km</span><span>20 km</span></div>
              </div>
              <div className="rounded-xl overflow-hidden border border-dark-border" style={{ height: '140px', background: '#1a2a1a' }}>
                <svg viewBox="0 0 400 140" className="w-full h-full">
                  <rect width="400" height="140" fill="#1a2a1a" />
                  {[80,160,240,320].map(x => <line key={x} x1={x} y1="0" x2={x} y2="140" stroke="#243324" strokeWidth="1" />)}
                  {[35,70,105].map(y => <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#243324" strokeWidth="1" />)}
                  <circle cx="200" cy="70" r={radius * 3.5} fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="5,3" strokeOpacity="0.5" />
                  <circle cx="200" cy="70" r="8" fill="#10b981" />
                  <circle cx="200" cy="70" r="4" fill="white" />
                  <text x="200" y="128" textAnchor="middle" fill="#6b7280" fontSize="10">Pickup location preview · {radius} km radius</text>
                </svg>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary px-6 py-3">← Back</button>
              <button type="submit" disabled={submitting} className="btn-primary flex-1 py-3 font-semibold disabled:opacity-50">
                {submitting ? 'Posting...' : 'Post listing'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
