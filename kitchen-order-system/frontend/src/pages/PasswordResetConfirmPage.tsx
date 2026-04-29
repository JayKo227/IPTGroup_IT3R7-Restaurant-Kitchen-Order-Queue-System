import React, { useEffect, useState } from 'react'
import { confirmPasswordReset } from '../api'
import { ChefHat } from 'lucide-react'

export default function PasswordResetConfirmPage({
  uid,
  token,
  onDone,
}: {
  uid: string
  token: string
  onDone: () => void
}) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'ready' | 'success' | 'error'>('ready')

  useEffect(() => {
    if (!uid || !token) {
      setStatus('error')
      setMessage('Invalid or missing password reset link.')
    }
  }, [uid, token])

  const formatApiError = (data: any, defaultMessage: string) => {
    if (!data) return defaultMessage
    if (typeof data === 'string') return data
    if (Array.isArray(data)) return data.join(' ')
    if (typeof data.new_password === 'string') return data.new_password
    if (Array.isArray(data.new_password)) return data.new_password.join(' ')
    if (typeof data.new_password2 === 'string') return data.new_password2
    if (Array.isArray(data.new_password2)) return data.new_password2.join(' ')
    if (typeof data.detail === 'string') return data.detail
    if (typeof data.token === 'string') return data.token
    if (Array.isArray(data.token)) return data.token.join(' ')
    if (typeof data.uid === 'string') return data.uid
    if (Array.isArray(data.uid)) return data.uid.join(' ')
    if (typeof data.message === 'string') return data.message
    return JSON.stringify(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    if (!newPassword || !confirmPassword) {
      setMessage('Please enter and confirm your new password.')
      return
    }
    setLoading(true)
    try {
      await confirmPasswordReset({ uid, token, new_password: newPassword, new_password2: confirmPassword })
      setStatus('success')
      setMessage('Your password has been reset successfully.')
    } catch (err: any) {
      const data = err?.response?.data || err?.message
      setStatus('error')
      setMessage(formatApiError(data, 'Unable to reset password.'))
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
          {status === 'success' ? (
            <>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Password Reset Complete</h2>
              <p className="text-gray-600 mb-6">You can now sign in using your new password.</p>
              <button onClick={onDone} className="w-full py-3 bg-green-700 hover:bg-green-800 text-white rounded-lg font-medium transition-all">
                Back to Sign In
              </button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Reset Your Password</h2>
              <p className="text-gray-500 text-sm mb-6">Enter a new password to finish resetting your account.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">New Password</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 text-sm focus:outline-none focus:border-green-500 transition-colors"
                    placeholder="••••••••" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Confirm Password</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 text-sm focus:outline-none focus:border-green-500 transition-colors"
                    placeholder="••••••••" required />
                </div>
                {message && <p className={`text-xs mt-1 ${status === 'error' ? 'text-red-500' : 'text-green-700'}`}>{message}</p>}
                <button type="submit" disabled={loading} className="w-full py-3 bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white rounded-lg font-medium transition-all mt-2">
                  {loading ? 'Resetting password…' : 'Reset Password'}
                </button>
              </form>
              <button onClick={onDone} className="mt-4 text-sm text-blue-700 hover:text-blue-900">
                Back to Sign In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
