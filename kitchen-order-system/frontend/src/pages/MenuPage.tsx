import React, { useEffect, useState } from 'react'
import { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } from '../api'
import type { MenuItem } from '../api'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Clock, UtensilsCrossed, ToggleLeft, ToggleRight } from 'lucide-react'

interface FormState {
  name: string
  description: string
  price: string
  estimated_prep_time: string
  is_available: boolean
}

const empty: FormState = { name: '', description: '', price: '', estimated_prep_time: '10', is_available: true }

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<MenuItem | null>(null)
  const [form, setForm] = useState<FormState>(empty)
  const [menuImage, setMenuImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const fetchItems = async () => {
    try {
      const res = await getMenuItems()
      setItems(res.data)
    } catch {
      toast.error('Failed to load menu items')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchItems() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(empty)
    setMenuImage(null)
    setImagePreview(null)
    setErrors({})
    setShowModal(true)
  }

  const openEdit = (item: MenuItem) => {
    setEditing(item)
    setForm({ name: item.name, description: item.description, price: String(item.price), estimated_prep_time: String(item.estimated_prep_time), is_available: item.is_available })
    setMenuImage(null)
    setImagePreview(item.image_url || null)
    setErrors({})
    setShowModal(true)
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) e.price = 'Enter a valid price'
    if (!form.estimated_prep_time || Number(form.estimated_prep_time) <= 0) e.estimated_prep_time = 'Must be at least 1 minute'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    const payload = new FormData()
    payload.append('name', form.name.trim())
    payload.append('description', form.description.trim())
    payload.append('price', parseFloat(form.price).toString())
    payload.append('estimated_prep_time', parseInt(form.estimated_prep_time).toString())
    payload.append('is_available', String(form.is_available))
    if (menuImage) payload.append('image', menuImage)
    try {
      if (editing) {
        await updateMenuItem(editing.id, payload)
        toast.success('Menu item updated')
      } else {
        await createMenuItem(payload)
        toast.success('Menu item created')
      }
      setShowModal(false)
      fetchItems()
    } catch (err: any) {
      const data = err?.response?.data
      if (data && typeof data === 'object') {
        const apiErrors: Record<string, string> = {}
        for (const [k, v] of Object.entries(data)) apiErrors[k] = Array.isArray(v) ? v[0] : String(v)
        setErrors(apiErrors)
      } else {
        toast.error('Failed to save menu item')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteMenuItem(deleteTarget.id)
      toast.success(`"${deleteTarget.name}" deleted`)
      fetchItems()
    } catch (err: any) {
      const data = err?.response?.data
      if (data && typeof data === 'object') {
        const message = data.error || Object.values(data)[0]
        toast.error(typeof message === 'string' ? message : 'Failed to delete menu item')
      } else {
        toast.error('Failed to delete menu item')
      }
    }
    setDeleteTarget(null)
  }

  const toggleAvailability = async (item: MenuItem) => {
    try {
      await updateMenuItem(item.id, { is_available: !item.is_available })
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: !i.is_available } : i))
      toast.success(`"${item.name}" ${!item.is_available ? 'enabled' : 'disabled'}`)
    } catch {
      toast.error('Failed to update availability')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-kitchen-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-3xl tracking-wider text-kitchen-text">MENU ITEMS</h2>
          <span className="px-2 py-0.5 bg-kitchen-accent/10 text-kitchen-accent border border-kitchen-accent/30 rounded-md text-xs font-mono">{items.length} items</span>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-kitchen-accent hover:bg-kitchen-accent-dim text-white rounded-lg transition-all font-medium text-sm">
          <Plus size={16} /> New Item
        </button>
      </div>

      {/* Grid */}
      {items.length === 0 ? (
        <div className="bg-[#1a1815] border border-[#2e2b25] rounded-xl p-12 text-center">
          <UtensilsCrossed size={40} className="text-kitchen-muted mx-auto mb-3" />
          <p className="text-kitchen-muted">No menu items yet. Add your first dish!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(item => (
            <div key={item.id} className={`bg-[#1a1815] border rounded-xl p-5 transition-all ${item.is_available ? 'border-[#2e2b25] hover:border-[#3e3b35]' : 'border-[#2e2b25] opacity-60'}`}>
              <div className="overflow-hidden rounded-3xl mb-4 bg-[#0f0e0c]">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-full h-40 object-cover" />
              ) : (
                <div className="h-40 flex items-center justify-center text-kitchen-muted text-sm">No photo available</div>
              )}
            </div>
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-medium text-kitchen-text">{item.name}</h3>
                <p className="text-kitchen-muted text-xs mt-0.5 line-clamp-2">{item.description || 'No description'}</p>
              </div>
              <span className="font-mono font-semibold text-kitchen-accent ml-2 text-sm">₱{item.price}</span>
            </div>
              <div className="flex items-center gap-2 text-xs text-kitchen-muted mb-4">
                <Clock size={12} />
                <span>{item.estimated_prep_time} min prep</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleAvailability(item)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${item.is_available ? 'bg-kitchen-accent/10 text-kitchen-accent border border-kitchen-accent/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
                  {item.is_available ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                  {item.is_available ? 'Available' : 'Unavailable'}
                </button>
                <div className="ml-auto flex gap-1">
                  <button onClick={() => openEdit(item)} className="p-2 rounded-lg hover:bg-[#2e2b25] text-kitchen-muted hover:text-kitchen-text transition-all">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setDeleteTarget(item)} className="p-2 rounded-lg hover:bg-red-500/10 text-kitchen-muted hover:text-red-400 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <Modal title={editing ? 'Edit Menu Item' : 'New Menu Item'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-kitchen-muted mb-1">Item Name *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full bg-[#0f0e0c] border border-[#2e2b25] rounded-lg px-3 py-2 text-kitchen-text text-sm focus:outline-none focus:border-kitchen-accent transition-colors"
                placeholder="e.g. Grilled Salmon" />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-kitchen-muted mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                rows={2} className="w-full bg-[#0f0e0c] border border-[#2e2b25] rounded-lg px-3 py-2 text-kitchen-text text-sm focus:outline-none focus:border-kitchen-accent transition-colors resize-none"
                placeholder="Short description..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-kitchen-muted mb-1">Photo</label>
              <input type="file" accept="image/*" onChange={e => {
                const file = e.target.files?.[0] ?? null
                setMenuImage(file)
                setImagePreview(file ? URL.createObjectURL(file) : editing?.image_url || null)
              }}
                className="block w-full text-sm text-kitchen-text file:bg-[#1f1d19] file:border-0 file:text-kitchen-text file:rounded-lg file:px-3 file:py-2"
              />
              {imagePreview && (
                <div className="mt-3 rounded-2xl overflow-hidden bg-[#0f0e0c]">
                  <img src={imagePreview} alt="Preview" className="w-full h-36 object-cover" />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-kitchen-muted mb-1">Price (₱) *</label>
                <input type="number" min="0.01" step="0.01" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                  className="w-full bg-[#0f0e0c] border border-[#2e2b25] rounded-lg px-3 py-2 text-kitchen-text text-sm focus:outline-none focus:border-kitchen-accent transition-colors"
                  placeholder="0.00" />
                {errors.price && <p className="text-red-400 text-xs mt-1">{errors.price}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-kitchen-muted mb-1">Prep Time (min) *</label>
                <input type="number" min="1" value={form.estimated_prep_time} onChange={e => setForm(p => ({ ...p, estimated_prep_time: e.target.value }))}
                  className="w-full bg-[#0f0e0c] border border-[#2e2b25] rounded-lg px-3 py-2 text-kitchen-text text-sm focus:outline-none focus:border-kitchen-accent transition-colors" />
                {errors.estimated_prep_time && <p className="text-red-400 text-xs mt-1">{errors.estimated_prep_time}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="avail" checked={form.is_available} onChange={e => setForm(p => ({ ...p, is_available: e.target.checked }))}
                className="w-4 h-4 accent-kitchen-accent" />
              <label htmlFor="avail" className="text-sm text-kitchen-text-dim">Available for ordering</label>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-[#2e2b25] text-kitchen-muted rounded-lg hover:border-[#3e3b35] hover:text-kitchen-text transition-all text-sm">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-kitchen-accent hover:bg-kitchen-accent-dim disabled:opacity-50 text-white rounded-lg transition-all font-medium text-sm">
                {submitting ? 'Saving…' : editing ? 'Update Item' : 'Create Item'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <ConfirmDialog
          danger
          message={`Delete "${deleteTarget.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
