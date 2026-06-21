import { useState } from 'react'
import { Lock, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function AdminAuthPage() {
  const [accessCode, setAccessCode] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: accessCode.trim() })
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        localStorage.setItem('auth_token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        navigate('/admin')
      } else {
        setError(data.error || 'Invalid access code')
      }
    } catch (err) {
      setError('An error occurred during verification. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-[#eef5ee] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-[#1B4332]/10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#1B4332]/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-[#1B4332]" />
          </div>
          <h2 className="text-3xl font-bold font-garamond text-[#1B4332] mb-2">Admin Portal</h2>
          <p className="text-slate-500 text-sm">Sign in to access the dashboard</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">Secret Access Code</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-[#1B4332]/45" />
              </div>
              <input
                type="password"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-[#1B4332]/15 rounded-xl bg-[#f8fcf8] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] transition-colors text-sm"
                placeholder="Enter access code"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 rounded-xl shadow-sm text-sm font-semibold text-white bg-[#FF6B35] hover:bg-[#E0531D] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6B35] transition-colors shadow-[#FF6B35]/15"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}
