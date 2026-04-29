import { useState, useEffect, ChangeEvent, FormEvent } from "react"
import { Eye, EyeOff } from 'lucide-react'
import { register } from "../api"

interface RegisterFormData {
  email: string; first_name: string; middle_name: string; last_name: string
  phone: string
  password: string; password2: string
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
    email: "", first_name: "", middle_name: "", last_name: "", phone: "", password: "", password2: "", role: "admin",
  })
  const [errors, setErrors]                 = useState<Record<string, string[]>>({})
  const [loading, setLoading]               = useState(false)
  const [showPassword, setShowPassword]     = useState(false)
  const [success, setSuccess]               = useState(false)
  const [successEmail, setSuccessEmail]     = useState("")
  const [profilePicture, setProfilePicture] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl]         = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    const newValue = name === 'middle_name'
      ? value.replace(/[^A-Za-zÀ-ž\s'\.\-]/g, '')
      : value
    setFormData(prev => ({ ...prev, [name]: newValue }))
    setErrors(prev => ({ ...prev, [name]: [] }))
  }

  function handlePictureChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (!file) return
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setProfilePicture(file)
    setPreviewUrl(URL.createObjectURL(file))
    setErrors(prev => ({ ...prev, profile_picture: [] }))
  }

  function clearPicture() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setProfilePicture(null)
    setPreviewUrl(null)
    setErrors(prev => ({ ...prev, profile_picture: [] }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    const data = new FormData()
    Object.entries(formData).forEach(([k, v]) => {
      const value = String(v ?? '')
      if (k === 'phone') {
        data.append(k, value.trim().replace(/[^0-9]/g, ''))
      } else {
        data.append(k, value)
      }
    })
    if (profilePicture) data.append('profile_picture', profilePicture)
    try {
      const res = await register(data)
      setSuccess(true)
      setSuccessEmail(res.data.email)
    } catch (err: any) {
      const data = err?.response?.data
      if (data && typeof data === 'object') {
        setErrors(data)
      } else {
        setErrors({ non_field_errors: ["Network error. Please try again."] })
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logoWrap}>
          <div style={s.logoIcon}><ChefIcon /></div>
          <span style={s.logoText}>KITCHENOQ</span>
        </div>
        <div style={{ fontSize: 48, textAlign: "center", marginBottom: 16 }}>✉</div>
        <h2 style={s.title}>Check your email!</h2>
        <p style={s.sub}>We sent an activation link to <strong>{successEmail}</strong>. Click it to activate your account.</p>
        <p style={{ ...s.sub, fontSize: 13, color: "#888", marginTop: 8 }}>The link expires in 24 hours.</p>
        <button style={{ ...s.btn, marginTop: 24 }} onClick={onRegistered}>
          Go to Sign In
        </button>
      </div>
    </div>
  )

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logoWrap}>
          <div style={s.logoIcon}><ChefIcon /></div>
          <span style={s.logoText}>KITCHENOQ</span>
        </div>
        <h1 style={s.title}>Create your account</h1>
        <p style={s.sub}>Join your kitchen team</p>

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div style={s.avatarSection}>
            <div style={s.avatarCircle}>
              {previewUrl ? (
                <img src={previewUrl} alt="Profile preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ color: '#6B7280', fontSize: 14, textAlign: 'center' }}>Upload<br />photo</span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <label style={s.label}>Profile photo</label>
              <input
                id="profile-picture-upload"
                type="file"
                accept="image/*"
                onChange={handlePictureChange}
                style={{ display: 'none' }}
              />
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <label htmlFor="profile-picture-upload" style={{ ...s.btn, padding: '10px 16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 'auto' }}>
                  {previewUrl ? 'Change photo' : 'Upload photo'}
                </label>
                {previewUrl && (
                  <button type="button" onClick={clearPicture} style={s.removeBtn}>
                    Remove
                  </button>
                )}
              </div>
              {errors.profile_picture && <p style={s.err}>{errors.profile_picture[0]}</p>}
              <p style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>Optional. Add a profile picture for your account.</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={s.label}>First Name</label>
              <input name="first_name" placeholder="Juan" value={formData.first_name} onChange={handleChange} style={s.input} required />
              {errors.first_name && <p style={s.err}>{errors.first_name[0]}</p>}
            </div>
            <div>
              <label style={s.label}>Middle Name</label>
              <input name="middle_name" placeholder="Michael" value={formData.middle_name} onChange={handleChange} style={s.input} />
              {errors.middle_name && <p style={s.err}>{errors.middle_name[0]}</p>}
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={s.label}>Last Name</label>
              <input name="last_name" placeholder="dela Cruz" value={formData.last_name} onChange={handleChange} style={s.input} required />
              {errors.last_name && <p style={s.err}>{errors.last_name[0]}</p>}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={s.label}>Account Role</label>
            <select name="role" value={formData.role} onChange={handleChange} style={s.input}>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
              <option value="chef">Chef</option>
            </select>
            {errors.role && <p style={s.err}>{errors.role[0]}</p>}
          </div>

          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={s.label}>Email Address</label>
            <input name="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} style={s.input} required />
            {errors.email && <p style={s.err}>{errors.email[0]}</p>}
          </div>

          {/* Phone */}
          <div style={{ marginBottom: 16 }}>
            <label style={s.label}>Phone Number</label>
            <input
              name="phone"
              type="tel"
              placeholder="09565635923"
              value={formData.phone}
              onChange={handleChange}
              style={s.input}
            />
            {errors.phone && <p style={s.err}>{errors.phone[0]}</p>}
          </div>

          {/* Password */}
          <div style={{ marginBottom: 16 }}>
            <label style={s.label}>Password</label>
            <div style={{ position: "relative" }}>
              <input name="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={formData.password} onChange={handleChange} style={{ ...s.input, paddingRight: 40 }} required />
              <button type="button" onClick={() => setShowPassword(v => !v)} style={s.eyeBtn} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p style={s.err}>{errors.password[0]}</p>}
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: 24 }}>
            <label style={s.label}>Confirm Password</label>
            <input name="password2" type={showPassword ? "text" : "password"} placeholder="••••••••" value={formData.password2} onChange={handleChange} style={s.input} required />
            {errors.password2 && <p style={s.err}>{errors.password2[0]}</p>}
          </div>

          {errors.non_field_errors && <div style={s.errBanner}>{errors.non_field_errors[0]}</div>}

          <button type="submit" style={s.btn} disabled={loading}>
            {loading ? "Creating account…" : "Create Account"}
          </button>

          <p style={{ textAlign: "center", fontSize: 13, color: "#666", marginTop: 12 }}>
            Already have an account?{" "}
            <button type="button" onClick={onGoLogin} style={{ background: "none", border: "none", color: "#1B6B3A", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
              Sign In
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}

function ChefIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 3C9.5 3 7.5 4.6 7 6.8C5.8 7.2 5 8.3 5 9.5C5 11 6 12.3 7.5 12.8V17H16.5V12.8C18 12.3 19 11 19 9.5C19 8.3 18.2 7.2 17 6.8C16.5 4.6 14.5 3 12 3Z" fill="white"/>
      <rect x="7.5" y="17" width="9" height="2" rx="1" fill="white"/>
    </svg>
  )
}

const s: Record<string, React.CSSProperties> = {
  page:          { minHeight: "100vh", background: "var(--body)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" },
  card:          { background: "var(--surface)", borderRadius: 16, padding: "36px 32px", width: "100%", maxWidth: 500, boxShadow: "0 2px 16px rgba(0,0,0,0.08)" },
  logoWrap:      { display: "flex", alignItems: "center", gap: 10, marginBottom: 24, justifyContent: "center" },
  logoIcon:      { width: 40, height: 40, background: "#1B6B3A", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" },
  logoText:      { fontSize: 18, fontWeight: 700, color: "#1B6B3A", letterSpacing: 1 },
  title:         { fontSize: 22, fontWeight: 600, color: "var(--text)", textAlign: "center", marginBottom: 4 },
  sub:           { fontSize: 14, color: "var(--muted)", textAlign: "center", marginBottom: 24 },
  avatarSection: { display: "flex", alignItems: "center", gap: 16, marginBottom: 20, padding: 16, background: "var(--surface)", borderRadius: 10, border: "1px dashed var(--border)" },
  avatarCircle:  { width: 72, height: 72, borderRadius: "50%", background: "var(--card)", cursor: "pointer", position: "relative", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" },
  avatarOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(27,107,58,0.75)", height: 24, display: "flex", alignItems: "center", justifyContent: "center" },
  removeBtn:     { background: "none", border: "none", color: "#E03434", fontSize: 12, cursor: "pointer", padding: 0, fontWeight: 500 },
  label:         { fontSize: 13, fontWeight: 500, color: "var(--muted-strong)", marginBottom: 6, display: "block" },
  input:         { width: "100%", padding: "10px 14px", border: "1.5px solid var(--input-border)", borderRadius: 8, fontSize: 14, color: "var(--text)", outline: "none", background: "var(--input)", boxSizing: "border-box" as const },
  eyeBtn:        { position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: 0 },
  btn:           { width: "100%", padding: 12, background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" },
  err:           { fontSize: 12, color: "#E03434", marginTop: 4 },
  errBanner:     { background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#B91C1C", marginBottom: 16 },
}