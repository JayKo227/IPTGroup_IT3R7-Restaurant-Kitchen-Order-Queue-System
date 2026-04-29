import React, { useEffect, useState, useRef, ChangeEvent } from 'react'
import { getProfile, updateProfile } from '../api'
import type { UserProfile } from '../api'
import toast from 'react-hot-toast'
import { User, Mail, Phone, MapPin, Calendar, Clock, Pencil, Save, X, ShieldCheck } from 'lucide-react'

interface Props {
  user: UserProfile | null
  onProfileUpdated: (profile: UserProfile) => void
}

export default function ProfilePage({ user, onProfileUpdated }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [form, setForm]       = useState<Partial<UserProfile>>({})
  const [errors, setErrors]   = useState<Record<string, string>>({})
  const [profilePicture, setProfilePicture] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [profilePictureRemoved, setProfilePictureRemoved] = useState(false)

  const normalizePhoneForForm = (phone?: string | null) => {
    if (!phone) return { number: '' }
    const number = (phone || '').trim().replace(/[^0-9]/g, '')
    return { number }
  }

  const formatPhoneNumberRaw = (phone?: string | null) => {
    if (!phone) return '—'
    const number = (phone || '').trim().replace(/[^0-9]/g, '')
    return number || '—'
  }

  const restoreFormFromProfile = (profileData: UserProfile) => {
    const phoneData = normalizePhoneForForm(profileData.phone)
    setForm({ ...profileData, phone: phoneData.number })
  }

  useEffect(() => {
    if (user) {
      setProfile(user)
      restoreFormFromProfile(user)
    }

    getProfile()
      .then(res => {
        setProfile(res.data)
        restoreFormFromProfile(res.data)
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false))
  }, [user])

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB.')
      return
    }
    setProfilePicture(file)
    setPreviewUrl(URL.createObjectURL(file))
    setProfilePictureRemoved(false)
  }

  const removePhoto = () => {
    setProfilePicture(null)
    setPreviewUrl(null)
    setProfilePictureRemoved(true)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSave = async () => {
    setSaving(true)
    setErrors({})

    if (!form.first_name?.trim() || !form.last_name?.trim()) {
      setErrors({
        first_name: !form.first_name?.trim() ? 'First name is required' : '',
        last_name:  !form.last_name?.trim() ? 'Last name is required' : '',
      })
      setSaving(false)
      return
    }

    try {
      const payload = new FormData()
      payload.append('first_name', form.first_name ?? '')
      payload.append('last_name', form.last_name ?? '')
      if (form.middle_name !== undefined) payload.append('middle_name', form.middle_name ?? '')
      if (form.address !== undefined) payload.append('address', form.address ?? '')
      if (form.age !== undefined && form.age !== null) payload.append('age', String(form.age))
      if (form.birthday !== undefined && form.birthday !== null && form.birthday !== '') payload.append('birthday', form.birthday)
      if (form.phone !== undefined) {
        const rawPhone = String(form.phone ?? '').trim().replace(/[^0-9]/g, '')
        payload.append('phone', rawPhone)
      }
      if (profilePicture) payload.append('profile_picture', profilePicture)
      if (profilePictureRemoved) payload.append('profile_picture_remove', 'true')

      const res = await updateProfile(payload)
      const phoneData = normalizePhoneForForm(res.data.phone)
      setProfile(res.data)
      setForm({ ...res.data, phone: phoneData.number })
      onProfileUpdated(res.data)
      setEditing(false)
      setProfilePicture(null)
      setPreviewUrl(null)
      setProfilePictureRemoved(false)
      toast.success('Profile updated!')
    } catch (err: any) {
      const data = err?.response?.data
      if (data && typeof data === 'object') {
        const firstError = Object.values(data).flat()[0]
        toast.error(typeof firstError === 'string' ? firstError : 'Failed to update profile')
      } else {
        toast.error('Failed to update profile')
      }
    } finally {
      setSaving(false)
    }
  }

  const roleColors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-800 border-purple-300',
    staff: 'bg-blue-100 text-blue-800 border-blue-300',
    chef:  'bg-green-100 text-green-800 border-green-300',
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!profile) return null

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in px-4 sm:px-6 lg:px-8">
      <div className="bg-white border border-green-200 rounded-[2rem] p-8 md:p-10 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] items-start mb-6">
          <div className="flex items-start gap-6">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <div className="w-28 h-28 bg-green-100 border-4 border-green-300 rounded-full overflow-hidden flex items-center justify-center cursor-pointer"
              onClick={() => editing && fileInputRef.current?.click()}>
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : profilePictureRemoved ? (
                <span className="text-3xl font-bold text-green-700">
                  {(profile.first_name?.[0] ?? '').toUpperCase()}{(profile.last_name?.[0] ?? '').toUpperCase()}
                </span>
              ) : profile.profile_picture_url ? (
                <img src={profile.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-green-700">
                  {(profile.first_name?.[0] ?? '').toUpperCase()}{(profile.last_name?.[0] ?? '').toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-3xl md:text-4xl font-semibold text-gray-800 truncate">{profile.full_name || [profile.first_name, profile.middle_name, profile.last_name].filter(Boolean).join(' ')}</h2>
              <p className="text-gray-500 text-base mt-2 truncate">{profile.email}</p>
              <span className={`inline-flex items-center gap-2 mt-4 px-3 py-1 rounded-full text-sm font-semibold border ${roleColors[profile.role] ?? 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                <ShieldCheck size={14} />
                {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
              </span>
              {editing && (
                <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="text-green-700 font-medium underline">
                    {previewUrl || profile.profile_picture_url ? 'Change photo' : 'Upload photo'}
                  </button>
                  {(previewUrl || profile.profile_picture_url) && (
                    <button type="button" onClick={removePhoto} className="text-red-600 font-medium underline">
                      Remove
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-start justify-end gap-3">
            {!editing ? (
              <button onClick={() => {
                  if (profile) {
                    restoreFormFromProfile(profile)
                  }
                  setEditing(true)
                  setErrors({})
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-full text-sm font-medium transition-all">
                <Pencil size={14} /> Edit Profile
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2 justify-end">
                <button onClick={() => {
                  if (profile) {
                    const phoneData = normalizePhoneForForm(profile.phone)
                    setForm({ ...profile, phone: phoneData.number })
                  }
                  setEditing(false)
                  setErrors({})
                  setProfilePicture(null)
                  setPreviewUrl(null)
                  setProfilePictureRemoved(false)
                }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-500 rounded-full text-sm">
                  <X size={14} /> Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white rounded-full text-sm font-medium">
                  <Save size={14} /> {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <Clock size={14} /> Member since {formatDate(profile.date_joined)}
        </div>
      </div>

      <div className="bg-white border border-green-200 rounded-[2rem] p-8 md:p-10 shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-6 flex items-center gap-3 text-lg md:text-xl">
          <User size={18} className="text-green-600" /> Account Details
        </h3>
        <div className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">First Name</label>
              {editing ? (
                <>
                  <input
                    type="text"
                    inputMode="text"
                    pattern="[A-Za-zÀ-ž\s'-]*"
                    value={form.first_name ?? ''}
                    onChange={e => setForm(p => ({ ...p, first_name: e.target.value.replace(/[^A-Za-zÀ-ž\s'-]/g, '') }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-gray-800 text-base focus:outline-none focus:border-green-500" />
                  {errors.first_name && <p className="text-red-500 text-sm mt-2">{errors.first_name}</p>}
                </>
              ) : (
                <p className="text-gray-800 text-base font-medium">{profile.first_name || '—'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Middle Name</label>
              {editing ? (
                <input
                  type="text"
                  inputMode="text"
                  pattern="[A-Za-zÀ-ž\s'\.\-]*"
                  value={form.middle_name ?? ''}
                  onChange={e => setForm(p => ({ ...p, middle_name: e.target.value.replace(/[^A-Za-zÀ-ž\s'\.\-]/g, '') }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-gray-800 text-base focus:outline-none focus:border-green-500" />
              ) : (
                <p className="text-gray-800 text-base font-medium">{profile.middle_name || '—'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Last Name</label>
              {editing ? (
                <>
                  <input
                    type="text"
                    inputMode="text"
                    pattern="[A-Za-zÀ-ž\s'-]*"
                    value={form.last_name ?? ''}
                    onChange={e => setForm(p => ({ ...p, last_name: e.target.value.replace(/[^A-Za-zÀ-ž\s'-]/g, '') }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-gray-800 text-base focus:outline-none focus:border-green-500" />
                  {errors.last_name && <p className="text-red-500 text-sm mt-2">{errors.last_name}</p>}
                </>
              ) : (
                <p className="text-gray-800 text-base font-medium">{profile.last_name || '—'}</p>
              )}
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="min-w-0">
              <label className="block text-sm font-medium text-gray-500 mb-2 flex items-center gap-2"><Mail size={14} /> Email</label>
              <p className="break-words text-gray-800 text-base font-medium">{profile.email}</p>
            </div>
            <div className="min-w-0">
              <label className="block text-sm font-medium text-gray-500 mb-2 flex items-center gap-2"><Phone size={14} /> Phone</label>
              {editing ? (
                <input
                  type="tel"
                  inputMode="tel"
                  value={form.phone ?? ''}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value.replace(/[^0-9]/g, '') }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-gray-800 text-base focus:outline-none focus:border-green-500"
                  placeholder="Phone number"
                  pattern="[0-9]*"
                />
              ) : (
                <p className="text-gray-800 text-base font-medium">{formatPhoneNumberRaw(profile.phone)}</p>
              )}
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Age</label>
              {editing ? (
                <input type="number" min="1" max="120" value={form.age ?? ''} onChange={e => setForm(p => ({ ...p, age: Number(e.target.value) || undefined }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-gray-800 text-base focus:outline-none focus:border-green-500" />
              ) : (
                <p className="text-gray-800 text-base font-medium">{profile.age ?? '—'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2 flex items-center gap-2"><Calendar size={14} /> Birthday</label>
              {editing ? (
                <input type="date" value={form.birthday ?? ''} onChange={e => setForm(p => ({ ...p, birthday: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-gray-800 text-base focus:outline-none focus:border-green-500" />
              ) : (
                <p className="text-gray-800 text-base font-medium">{formatDate(profile.birthday)}</p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2 flex items-center gap-2"><MapPin size={14} /> Address</label>
            {editing ? (
              <textarea value={form.address ?? ''} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                rows={3} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-gray-800 text-base focus:outline-none focus:border-green-500 resize-none"
                placeholder="Street, City, Province" />
            ) : (
              <p className="text-gray-800 text-base font-medium">{profile.address || '—'}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}