import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [searchParams] = useSearchParams()
  const initialRole = searchParams.get('role') || 'donor'

  const [role, setRole] = useState(initialRole)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' })
  const [ngoDoc, setNgoDoc] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const roles = [
    { key: 'donor', icon: '🍱', label: 'Donor', desc: 'I have surplus food to share' },
    { key: 'receiver', icon: '🤝', label: 'Receiver', desc: 'I need food for myself or others' },
    { key: 'ngo', icon: '🏛️', label: 'NGO', desc: 'We are a registered organization' }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setError('')
    setLoading(true)
    try {
      const user = await register({ ...formData, role })
      if (user.role === 'donor') navigate('/donor/dashboard', { replace: true })
      else if (user.role === 'admin') navigate('/admin/dashboard', { replace: true })
      else navigate('/receiver/dashboard', { replace: true })
    } catch (err) {
      setError(err?.error?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      <div className="h-16 border-b border-dark-border flex items-center px-6">
        <Link to="/" className="text-xl font-bold">
          <span className="text-primary">Food</span><span className="text-accent-orange">Surplus</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Create your account</h1>
            <p className="text-gray-400">Join the food redistribution network</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/15 border border-red-500/40 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="card space-y-6">
            {/* Role selector */}
            <div>
              <label className="block text-sm font-medium mb-3">I am joining as</label>
              <div className="grid grid-cols-3 gap-3">
                {roles.map(r => (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => setRole(r.key)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      role === r.key
                        ? 'border-primary bg-primary/10 text-white'
                        : 'border-dark-border bg-dark-hover text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    <div className="text-2xl mb-1">{r.icon}</div>
                    <div className="font-semibold text-sm">{r.label}</div>
                    <div className="text-xs mt-0.5 opacity-70">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Full name</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Phone</label>
                  <input
                    type="tel"
                    className="input"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <input
                  type="email"
                  className="input"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Min. 6 characters"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>

              {role === 'ngo' && (
                <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                  <label className="block text-sm font-medium mb-1.5 text-purple-300">
                    NGO Registration Document
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="input text-sm"
                    onChange={e => setNgoDoc(e.target.files[0])}
                  />
                  <p className="text-xs text-purple-400/70 mt-1.5">
                    Upload your registration certificate. Account will be reviewed within 24 hours.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 font-semibold disabled:opacity-50"
              >
                {loading
                  ? <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Creating account...
                    </span>
                  : `Create ${role.toUpperCase()} account`
                }
              </button>
            </form>
          </div>

          <p className="text-center text-gray-400 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
