import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Where to redirect after login (from ProtectedRoute)
  const from = location.state?.from?.pathname

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(formData)
      // Go to the page they tried to visit, or their dashboard
      if (from && from !== '/login' && from !== '/register') {
        navigate(from, { replace: true })
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true })
      } else if (user.role === 'donor') {
        navigate('/donor/dashboard', { replace: true })
      } else {
        navigate('/receiver/dashboard', { replace: true })
      }
    } catch (err) {
      setError(err?.error?.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      {/* Simple top bar */}
      <div className="h-16 border-b border-dark-border flex items-center px-6">
        <Link to="/" className="text-xl font-bold">
          <span className="text-primary">Food</span><span className="text-accent-orange">Surplus</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
            <p className="text-gray-400">Log in to your Food Surplus account</p>
          </div>

          <div className="card">
            {from && (
              <div className="mb-4 p-3 bg-primary/10 border border-primary/30 rounded-lg text-primary text-sm">
                Please log in to access that page.
              </div>
            )}
            {error && (
              <div className="mb-4 p-3 bg-red-500/15 border border-red-500/40 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <input
                  type="email"
                  className="input"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="btn-primary w-full py-3 font-semibold" disabled={loading}>
                {loading
                  ? <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Logging in...
                    </span>
                  : 'Log in'
                }
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-dark-border text-center text-sm text-gray-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:underline font-medium">Join free</Link>
            </div>
          </div>

          {/* Role hint cards */}
          <div className="mt-6 grid grid-cols-3 gap-3 text-center text-xs text-gray-500">
            {[
              { icon: '🍱', label: 'Donor', hint: 'Post food' },
              { icon: '🤝', label: 'Receiver', hint: 'Find food' },
              { icon: '🏛️', label: 'Admin/NGO', hint: 'Manage' }
            ].map(r => (
              <div key={r.label} className="bg-dark-card border border-dark-border rounded-xl p-3">
                <div className="text-xl mb-1">{r.icon}</div>
                <div className="font-medium text-gray-300">{r.label}</div>
                <div>{r.hint}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
