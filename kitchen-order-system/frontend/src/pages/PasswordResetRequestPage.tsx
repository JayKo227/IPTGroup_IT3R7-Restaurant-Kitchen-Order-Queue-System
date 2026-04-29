import React, { useState } from 'react'
import { requestPasswordReset } from '../api'
import { ChefHat } from 'lucide-react'

export default function PasswordResetRequestPage({ onGoLogin }: { onGoLogin: () => void }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const formatApiError = (data: any, defaultMessage: string) => {
    if (!data) return defaultMessage
    if (typeof data === 'string') return data
    if (Array.isArray(data)) return data.join(' ')
    if (typeof data.email === 'string') return data.email
    if (Array.isArray(data.email)) return data.email.join(' ')
    if (typeof data.detail === 'string') return data.detail
    if (typeof data.message === 'string') return data.message
    return JSON.stringify(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await requestPasswordReset(email)
      setSuccess(true)
    } catch (err: any) {
      const data = err?.response?.data || err?.message
      setError(formatApiError(data, 'Unable to send reset email.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[color:var(--body)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ChefHat size={32} className="text-white" />
          </div>
          <h1 className="font-display text-4xl tracking-widest text-green-900">
            KITCHEN<span className="text-blue-700">OQ</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Restaurant Kitchen Order Queue System</p>
        </div>

        <div className="bg-[color:var(--surface)] border border-[color:var(--border)] rounded-2xl shadow-lg p-8">
          {success ? (
            <>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Check your inbox</h2>
              <p className="text-gray-600 mb-6">If your email is registered, we sent a password reset link to <strong>{email}</strong>.</p>
              <button onClick={onGoLogin} className="w-full py-3 bg-green-700 hover:bg-green-800 text-white rounded-lg font-medium transition-all">
                Back to Sign In
              </button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Forgot your password?</h2>
              <p className="text-gray-500 text-sm mb-6">Enter your email and we’ll send a reset link.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Email Address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 text-sm focus:outline-none focus:border-green-500 transition-colors"
                    placeholder="you@example.com" required />
                </div>
                {error && <p className="text-red-500 text-xs">{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full py-3 bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white rounded-lg font-medium transition-all">
                  {loading ? 'Sending reset link…' : 'Send Reset Link'}
                </button>
              </form>
              <button onClick={onGoLogin} className="mt-4 text-sm text-blue-700 hover:text-blue-900">
                Back to Sign In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
