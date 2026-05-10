import React, { useState } from 'react'
import { login } from '../api'
import toast from 'react-hot-toast'
import { ChefHat, Mail, Lock, Eye, EyeOff } from 'lucide-react'

interface Props {
  onLogin: (token: string) => void
  onGoRegister: () => void
  onGoForgot: () => void
}

export default function LoginPage({ onLogin, onGoRegister, onGoForgot }: Props) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [errors, setErrors]     = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!email) errs.email = 'Email is required'
    if (!password) errs.password = 'Password is required'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      const res = await login(email, password)
      localStorage.setItem('token', res.data.token)
      toast.success(`Welcome back, ${res.data.user.first_name}!`)
      onLogin(res.data.token)
    } catch (err: any) {
      const data = err?.response?.data
      if (data?.non_field_errors) {
        toast.error(data.non_field_errors[0])
      } else {
        toast.error('Invalid email or password')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[color:var(--body)] flex items-center justify-center py-10 px-6">
      <div className="w-full max-w-xl mx-auto">
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-[color:var(--accent)] rounded-3xl flex items-center justify-center mb-5 shadow-2xl shadow-[rgba(16,163,74,0.18)]">
            <ChefHat size={36} className="text-white" />
          </div>
          <h1 className="font-display text-5xl md:text-6xl tracking-[0.35em] text-[color:var(--accent)]">
            KITCHEN<span className="text-[color:var(--text)]">OQ</span>
          </h1>
          <p className="text-gray-400 text-base md:text-lg mt-3 max-w-md mx-auto">
            Restaurant Kitchen Order Queue System
          </p>
        </div>

        <div className="bg-[color:var(--surface)] border border-[color:var(--border)] rounded-[2rem] shadow-2xl p-10 md:p-12 flex flex-col items-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-[color:var(--text)] mb-8 text-center">
            Sign in to your account
          </h2>
          <form onSubmit={handleSubmit} className="space-y-7 w-full">
            <div>
              <label className="block text-base font-medium text-gray-400 mb-4">Email Address</label>
              <div className="relative">
                <Mail size={24} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" value={email}
                  onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })) }}
                  className="w-full bg-[color:var(--panel)] border border-[color:var(--border)] rounded-[1.2rem] pl-20 pr-6 py-6 text-[1.2rem] text-[color:var(--text)] focus:outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/10 transition-all placeholder-gray-400 min-h-[62px]"
                  placeholder="you@example.com" />
              </div>
              {errors.email && <p className="text-red-500 text-sm mt-2">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-base font-medium text-gray-400 mb-4">Password</label>
              <div className="relative">
                <Lock size={24} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })) }}
                  className="w-full bg-[color:var(--panel)] border border-[color:var(--border)] rounded-[1.2rem] pl-20 pr-20 py-6 text-[1.2rem] text-[color:var(--text)] focus:outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/10 transition-all placeholder-gray-400 min-h-[62px]"
                  placeholder="••••••••" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors">
                  {showPw ? <EyeOff size={24} /> : <Eye size={24} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-2">{errors.password}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-6 bg-[color:var(--accent)] hover:bg-[color:var(--accent)]/90 disabled:opacity-50 text-white rounded-[1.2rem] font-semibold text-lg transition-all min-h-[62px]">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-base text-gray-400">
            <button type="button" onClick={onGoForgot} className="w-full text-left font-medium text-[color:var(--accent)] hover:text-[color:var(--accent)]/90 sm:w-auto">
              Forgot password?
            </button>
            <button type="button" onClick={onGoRegister} className="w-full text-left font-medium text-[color:var(--accent)] hover:text-[color:var(--accent)]/90 sm:w-auto">
              Create account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
