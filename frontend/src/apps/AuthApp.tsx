import { useState, useMemo } from 'react'
import { ThemeProvider } from '../contexts/ThemeContext'
import { User, Mail, Lock, AlertCircle, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react'

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254
}

function AuthApp() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // ── CLIENT-SIDE VALIDATION ──────────────────────────────────────
  const emailError = useMemo(() => {
    if (!email) return ''
    if (!isValidEmail(email)) return 'Please enter a valid email address'
    return ''
  }, [email])

  const canSubmit = useMemo(() => {
    if (!email || !password) return false
    if (emailError) return false
    if (!isLogin) {
      if (!name || name.trim().length < 2) return false
      if (password !== confirmPassword) return false
    }
    return true
  }, [email, password, name, confirmPassword, emailError, isLogin])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!canSubmit) return

    setLoading(true)
    
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register'
      const payload = isLogin 
        ? { email: email.trim().toLowerCase(), password } 
        : { email: email.trim().toLowerCase(), password, name: name.trim() }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        if (data.token) {
          localStorage.setItem('auth_token', data.token)
        }
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user))
        }
        window.location.href = '/'
      } else {
        setError(data.error || 'Authentication failed')
      }
    } catch (err) {
      setError('An error occurred during authentication. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-[#eef5ee] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#FDFBF7] rounded-2xl shadow-xl shadow-amber-900/5 p-6 border border-amber-200/60">
          {/* Tabs */}
          <div className="flex bg-[#eef5ee] p-1 rounded-xl mb-5 border border-emerald-200/50">
            <button
              type="button"
              onClick={() => {
                if (!isLogin) {
                  setIsLogin(true)
                  setError('')
                  setPassword('')
                  setConfirmPassword('')
                }
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                isLogin
                  ? 'bg-emerald-400 text-white shadow-md shadow-emerald-400/30 ring-1 ring-emerald-500/50'
                  : 'text-emerald-700/70 hover:text-emerald-900 hover:bg-emerald-100/50'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                if (isLogin) {
                  setIsLogin(false)
                  setError('')
                  setPassword('')
                  setConfirmPassword('')
                }
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                !isLogin
                  ? 'bg-emerald-400 text-white shadow-md shadow-emerald-400/30 ring-1 ring-emerald-500/50'
                  : 'text-emerald-700/70 hover:text-emerald-900 hover:bg-emerald-100/50'
              }`}
            >
              Register
            </button>
          </div>

          <div className="text-center mb-5">
            <div className="w-12 h-12 bg-amber-100/80 rounded-full flex items-center justify-center mx-auto mb-3">
              <User className="w-6 h-6 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-[#1B4332] mb-1">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-sm text-amber-700/80">
              {isLogin ? 'Login to your account' : 'Join our community today'}
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 bg-red-50/80 border border-red-200 rounded-lg flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {!isLogin && (
              <div>
                <label htmlFor="auth-name" className="block text-sm font-medium text-[#1B4332] mb-1">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-amber-600/60" />
                  </div>
                  <input
                    id="auth-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 border border-amber-200 rounded-lg bg-white/80 text-slate-900 placeholder-amber-700/40 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors focus:bg-white"
                    placeholder="John Doe"
                    required={!isLogin}
                    autoComplete="name"
                    maxLength={100}
                  />
                </div>
                {!isLogin && name && name.trim().length < 2 && (
                  <p className="mt-1 text-xs text-red-500">Name must be at least 2 characters</p>
                )}
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="block text-sm font-medium text-[#1B4332] mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-amber-600/60" />
                </div>
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`block w-full pl-9 pr-3 py-2 border rounded-lg bg-white/80 text-slate-900 placeholder-amber-700/40 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors focus:bg-white ${
                    emailError ? 'border-red-300 ring-1 ring-red-200' : 'border-amber-200'
                  }`}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  maxLength={254}
                />
              </div>
              {emailError && (
                <p className="mt-1 text-xs text-red-600">{emailError}</p>
              )}
            </div>

            <div>
              <label htmlFor="auth-password" className="block text-sm font-medium text-[#1B4332] mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-amber-600/60" />
                </div>
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-9 py-2 border border-amber-200 rounded-lg bg-white/80 text-slate-900 placeholder-amber-700/40 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors focus:bg-white"
                  placeholder="••••••••"
                  required
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  maxLength={128}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-amber-600/60 hover:text-amber-700 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Confirm Password (only on registration) */}
              {!isLogin && (
                <div className="mt-4">
                  <label htmlFor="auth-confirm-password" className="block text-sm font-medium text-[#1B4332] mb-1">Confirm Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-amber-600/60" />
                    </div>
                    <input
                      id="auth-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`block w-full pl-9 pr-9 py-2 border rounded-lg bg-white/80 text-slate-900 placeholder-amber-700/40 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors focus:bg-white ${
                        confirmPassword && password !== confirmPassword ? 'border-red-300 ring-1 ring-red-200' : 'border-amber-200'
                      }`}
                      placeholder="••••••••"
                      required={!isLogin}
                      autoComplete="new-password"
                      maxLength={128}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-amber-600/60 hover:text-amber-700 transition-colors"
                      tabIndex={-1}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-amber-950 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all focus:ring-offset-[#FDFBF7] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Register')}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-amber-200/50 text-center">
            <a href="/" className="text-sm text-amber-700/80 hover:text-[#1B4332] transition-colors">
              &larr; Back to Home
            </a>
          </div>
        </div>
      </div>
    </ThemeProvider>
  )
}

export default AuthApp
