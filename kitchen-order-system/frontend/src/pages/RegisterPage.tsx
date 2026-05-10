import React, { useState, ChangeEvent, FormEvent } from 'react'
import { Eye, EyeOff, ChefHat, Mail, Lock, User, Phone } from 'lucide-react'
import { register } from '../api'

interface RegisterFormData {
  email: string
  first_name: string
  last_name: string
  phone: string
  password: string
  password2: string
  role: string
}

export default function RegisterPage({
  onRegistered,
  onGoLogin,
}: {
  onRegistered: () => void
  onGoLogin: () => void
}) {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    password: '',
    password2: '',
    role: 'admin',
  })
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [success, setSuccess] = useState(false)

  const formatApiError = (data: any, defaultMessage: string) => {
    if (!data) return defaultMessage
    if (typeof data === 'string') return data
    if (Array.isArray(data)) return data.join(' ')
    if (typeof data.detail === 'string') return data.detail
    if (typeof data.message === 'string') return data.message
    if (typeof data.email === 'string') return data.email
    if (Array.isArray(data.email)) return data.email.join(' ')
    return JSON.stringify(data)
  }

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: [] }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const fieldErrors: Record<string, string[]> = {}

    if (!formData.email) fieldErrors.email = ['Email is required.']
    if (!formData.first_name) fieldErrors.first_name = ['First name is required.']
    if (!formData.last_name) fieldErrors.last_name = ['Last name is required.']
    if (!formData.password) fieldErrors.password = ['Password is required.']
    if (!formData.password2) fieldErrors.password2 = ['Please confirm your password.']
    if (formData.password && formData.password2 && formData.password !== formData.password2) {
      fieldErrors.password2 = ['Passwords do not match.']
    }

    if (Object.keys(fieldErrors).length) {
      setErrors(fieldErrors)
      return
    }

    setLoading(true)
    setErrors({})

    try {
      await register({
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        password: formData.password,
        password2: formData.password2,
        role: formData.role,
      })
      setSuccess(true)
    } catch (err: any) {
      const data = err?.response?.data
      if (data && typeof data === 'object') {
        setErrors(data)
      } else {
        setErrors({ non_field_errors: [formatApiError(data, 'Unable to create account.')] })
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[color:var(--body)] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface)] p-10 shadow-2xl">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[color:var(--accent)] text-white shadow-lg">
              <ChefHat size={36} />
            </div>
            <div>
              <h2 className="text-3xl font-semibold text-[color:var(--text)]">Welcome aboard!</h2>
              <p className="mt-2 text-sm text-gray-500">Please check your email for the activation link.</p>
            </div>
            <div className="rounded-3xl bg-green-50 px-6 py-4 text-left text-sm text-green-700 ring-1 ring-green-200">
              We sent the activation link to <strong>{formData.email}</strong>.
            </div>
            <button
              type="button"
              onClick={onRegistered}
              className="mt-4 w-full rounded-[1.2rem] bg-[color:var(--accent)] py-4 text-base font-semibold text-white transition hover:bg-[color:var(--accent)]/90"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[color:var(--body)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface)] p-8 shadow-2xl md:p-12">
          <div className="mb-10 flex flex-col items-center gap-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[color:var(--accent)] text-white shadow-lg">
              <ChefHat size={36} />
            </div>
            <div>
              <h1 className="text-4xl font-semibold tracking-[0.08em] text-[color:var(--text)]">Create account</h1>
              <p className="mt-2 text-sm text-gray-500">Start using KitchenOQ with your team.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-gray-500">First name</span>
                <div className="mt-2 flex items-center gap-3 rounded-[1.2rem] border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-4 text-[color:var(--text)] focus-within:border-[color:var(--accent)]">
                  <User size={18} className="text-gray-400" />
                  <input
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="Juan"
                    className="w-full border-0 bg-transparent outline-none"
                  />
                </div>
                {errors.first_name && <p className="mt-2 text-xs text-red-500">{errors.first_name[0]}</p>}
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-500">Last name</span>
                <div className="mt-2 flex items-center gap-3 rounded-[1.2rem] border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-4 text-[color:var(--text)] focus-within:border-[color:var(--accent)]">
                  <User size={18} className="text-gray-400" />
                  <input
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="dela Cruz"
                    className="w-full border-0 bg-transparent outline-none"
                  />
                </div>
                {errors.last_name && <p className="mt-2 text-xs text-red-500">{errors.last_name[0]}</p>}
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-gray-500">Email address</span>
                <div className="mt-2 flex items-center gap-3 rounded-[1.2rem] border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-4 text-[color:var(--text)] focus-within:border-[color:var(--accent)]">
                  <Mail size={18} className="text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full border-0 bg-transparent outline-none"
                  />
                </div>
                {errors.email && <p className="mt-2 text-xs text-red-500">{errors.email[0]}</p>}
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-500">Phone number</span>
                <div className="mt-2 flex items-center gap-3 rounded-[1.2rem] border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-4 text-[color:var(--text)] focus-within:border-[color:var(--accent)]">
                  <Phone size={18} className="text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0956 563 5923"
                    className="w-full border-0 bg-transparent outline-none"
                  />
                </div>
                {errors.phone && <p className="mt-2 text-xs text-red-500">{errors.phone[0]}</p>}
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-gray-500">Role</span>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="mt-2 w-full rounded-[1.2rem] border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-4 text-[color:var(--text)] outline-none focus:border-[color:var(--accent)]"
              >
                <option value="admin">Admin</option>
                <option value="staff">Staff</option>
                <option value="chef">Chef</option>
              </select>
              {errors.role && <p className="mt-2 text-xs text-red-500">{errors.role[0]}</p>}
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-gray-500">Password</span>
                <div className="mt-2 relative flex items-center gap-3 rounded-[1.2rem] border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-4 text-[color:var(--text)] focus-within:border-[color:var(--accent)]">
                  <Lock size={18} className="text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full border-0 bg-transparent outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="text-gray-400 transition hover:text-gray-500"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="mt-2 text-xs text-red-500">{errors.password[0]}</p>}
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-500">Confirm password</span>
                <div className="mt-2 flex items-center gap-3 rounded-[1.2rem] border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-4 text-[color:var(--text)] focus-within:border-[color:var(--accent)]">
                  <Lock size={18} className="text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password2"
                    value={formData.password2}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full border-0 bg-transparent outline-none"
                  />
                </div>
                {errors.password2 && <p className="mt-2 text-xs text-red-500">{errors.password2[0]}</p>}
              </label>
            </div>

            {errors.non_field_errors && (
              <div className="rounded-3xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
                {errors.non_field_errors[0]}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-[1.2rem] bg-[color:var(--accent)] py-4 text-base font-semibold text-white transition hover:bg-[color:var(--accent)]/90 disabled:opacity-60"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <div className="mt-6 border-t border-[color:var(--border)] pt-6 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <button type="button" onClick={onGoLogin} className="font-medium text-[color:var(--accent)] hover:text-[color:var(--accent)]/90">
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
