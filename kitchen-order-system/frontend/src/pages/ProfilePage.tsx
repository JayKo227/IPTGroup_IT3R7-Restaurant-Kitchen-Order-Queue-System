import React, { useEffect, useState } from 'react'
import { getProfile, updateProfile } from '../api'
import type { UserProfile } from '../api'
import toast from 'react-hot-toast'
import { User, Mail, Phone, MapPin, Calendar, Clock, Pencil, Save, X, ShieldCheck } from 'lucide-react'

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [form, setForm]       = useState<Partial<UserProfile>>({})
  const [errors, setErrors]   = useState<Record<string, string>>({})

  useEffect(() => {
    getProfile()
      .then(res => { setProfile(res.data); setForm(res.data) })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await updateProfile({
        first_name: form.first_name,
        last_name:  form.last_name,
        address:    form.address,
        age:        form.age,
        birthday:   form.birthday,
        phone:      form.phone,
      })
      setProfile(res.data)
      setEditing(false)
      toast.success('Profile updated!')
    } catch {
      toast.error('Failed to update profile')
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
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="bg-white border border-green-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-green-100 border-2 border-green-300 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-green-700">
                {profile.first_name[0]}{profile.last_name[0]}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">{profile.full_name}</h2>
              <p className="text-gray-400 text-sm">{profile.email}</p>
              <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-xs font-medium border ${roleColors[profile.role]}`}>
                <ShieldCheck size={11} />
                {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
              </span>
            </div>
          </div>
          {!editing ? (
            <button onClick={() => { setEditing(true); setErrors({}) }}
              className="flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg text-sm font-medium transition-all">
              <Pencil size={14} /> Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => { setEditing(false); setForm(profile); setErrors({}) }}
                className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-500 rounded-lg text-sm">
                <X size={14} /> Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
                <Save size={14} /> {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}
        </div>
        <div className="text-xs text-gray-400 flex items-center gap-1">
          <Clock size={11} /> Member since {formatDate(profile.date_joined)}
        </div>
      </div>

      <div className="bg-white border border-green-200 rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <User size={16} className="text-green-600" /> Account Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">First Name</label>
            {editing ? (
              <input value={form.first_name ?? ''} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-green-500" />
            ) : (
              <p className="text-gray-800 text-sm font-medium">{profile.first_name || '—'}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Last Name</label>
            {editing ? (
              <input value={form.last_name ?? ''} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-green-500" />
            ) : (
              <p className="text-gray-800 text-sm font-medium">{profile.last_name || '—'}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-1"><Mail size={11} /> Email</label>
            <p className="text-gray-800 text-sm font-medium">{profile.email}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-1"><Phone size={11} /> Phone</label>
            {editing ? (
              <input value={form.phone ?? ''} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-green-500"
                placeholder="+63 9XX XXX XXXX" />
            ) : (
              <p className="text-gray-800 text-sm font-medium">{profile.phone || '—'}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Age</label>
            {editing ? (
              <input type="number" min="1" max="120" value={form.age ?? ''} onChange={e => setForm(p => ({ ...p, age: Number(e.target.value) || undefined }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-green-500" />
            ) : (
              <p className="text-gray-800 text-sm font-medium">{profile.age ?? '—'}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-1"><Calendar size={11} /> Birthday</label>
            {editing ? (
              <input type="date" value={form.birthday ?? ''} onChange={e => setForm(p => ({ ...p, birthday: e.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-green-500" />
            ) : (
              <p className="text-gray-800 text-sm font-medium">{formatDate(profile.birthday)}</p>
            )}
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-1"><MapPin size={11} /> Address</label>
            {editing ? (
              <textarea value={form.address ?? ''} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                rows={2} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-green-500 resize-none"
                placeholder="Street, City, Province" />
            ) : (
              <p className="text-gray-800 text-sm font-medium">{profile.address || '—'}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}