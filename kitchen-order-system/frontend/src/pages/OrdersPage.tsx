import React, { useEffect, useState } from 'react'
import {
  getOrders, createOrder, deleteOrder, advanceOrderStatus, cancelOrder,
  getMenuItems, addOrderItem, deleteOrderItem
} from '../api'
import type { Order, MenuItem } from '../api'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import toast from 'react-hot-toast'
import { Plus, Trash2, ChevronRight, XCircle, Clock, Eye, Filter } from 'lucide-react'

type FilterStatus = 'all' | 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'

interface NewOrderForm {
  table_number: string
  customer_name: string
  notes: string
  items: { menu_item: number; quantity: number; special_instructions: string }[]
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [viewOrder, setViewOrder] = useState<Order | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null)
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState<NewOrderForm>({
    table_number: '', customer_name: '', notes: '', items: []
  })

  // For adding items to existing order in detail view
  const [addItemMenuId, setAddItemMenuId] = useState<string>('')
  const [addItemQty, setAddItemQty] = useState('1')
  const [addItemNote, setAddItemNote] = useState('')
  const [addingItem, setAddingItem] = useState(false)

  const fetchOrders = async () => {
    try {
      const res = await getOrders(filter === 'all' ? undefined : filter)
      setOrders(res.data)
    } catch {
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getMenuItems().then(r => setMenuItems(r.data)).catch(() => {})
  }, [])

  useEffect(() => { fetchOrders() }, [filter])

  // ── Create Order ──────────────────────────────────────────────────────────

  const addFormItem = () => {
    setForm(p => ({
      ...p,
      items: [...p.items, { menu_item: menuItems[0]?.id ?? 0, quantity: 1, special_instructions: '' }]
    }))
  }

  const removeFormItem = (idx: number) =>
    setForm(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }))

  const updateFormItem = (idx: number, key: string, val: string | number) =>
    setForm(p => ({ ...p, items: p.items.map((it, i) => i === idx ? { ...it, [key]: val } : it) }))

  const validateCreate = () => {
    const e: Record<string, string> = {}
    if (!form.table_number || Number(form.table_number) <= 0) e.table_number = 'Enter a valid table number'
    if (form.items.some(it => it.quantity <= 0)) e.items = 'All quantities must be ≥ 1'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateCreate()) return
    setSubmitting(true)
    try {
      await createOrder({
        table_number: Number(form.table_number),
        customer_name: form.customer_name,
        notes: form.notes,
        items: form.items,
      })
      toast.success('Order created!')
      setShowCreate(false)
      setForm({ table_number: '', customer_name: '', notes: '', items: [] })
      fetchOrders()
    } catch (err: any) {
      const data = err?.response?.data
      if (data && typeof data === 'object') {
        const apiErrors: Record<string, string> = {}
        for (const [k, v] of Object.entries(data)) apiErrors[k] = Array.isArray(v) ? v[0] : String(v)
        setErrors(apiErrors)
      } else {
        toast.error('Failed to create order')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // ── Advance / Cancel ──────────────────────────────────────────────────────

  const handleAdvance = async (order: Order) => {
    try {
      const res = await advanceOrderStatus(order.id)
      toast.success(`Order #${order.id} advanced to ${res.data.status_display}`)
      fetchOrders()
      if (viewOrder?.id === order.id) setViewOrder(res.data)
    } catch {
      toast.error('Failed to advance order')
    }
  }

  const handleCancel = async () => {
    if (!cancelTarget) return
    try {
      await cancelOrder(cancelTarget.id)
      toast.success(`Order #${cancelTarget.id} cancelled`)
      fetchOrders()
      if (viewOrder?.id === cancelTarget.id) setViewOrder(null)
    } catch {
      toast.error('Failed to cancel order')
    }
    setCancelTarget(null)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteOrder(deleteTarget.id)
      toast.success(`Order #${deleteTarget.id} deleted`)
      fetchOrders()
      if (viewOrder?.id === deleteTarget.id) setViewOrder(null)
    } catch {
      toast.error('Failed to delete order')
    }
    setDeleteTarget(null)
  }

  // ── Add item to existing order ────────────────────────────────────────────

  const handleAddItem = async () => {
    if (!viewOrder || !addItemMenuId) return
    setAddingItem(true)
    try {
      await addOrderItem(viewOrder.id, {
        menu_item: Number(addItemMenuId),
        quantity: Number(addItemQty),
        special_instructions: addItemNote,
      })
      toast.success('Item added to order')
      const res = await getOrders()
      const updated = res.data.find(o => o.id === viewOrder.id)
      if (updated) setViewOrder(updated)
      setAddItemMenuId('')
      setAddItemQty('1')
      setAddItemNote('')
      fetchOrders()
    } catch (err: any) {
      const msg = err?.response?.data?.menu_item?.[0] ?? err?.response?.data?.error ?? 'Failed to add item'
      toast.error(msg)
    } finally {
      setAddingItem(false)
    }
  }

  const handleRemoveItem = async (itemId: number) => {
    if (!viewOrder) return
    try {
      await deleteOrderItem(viewOrder.id, itemId)
      toast.success('Item removed')
      const res = await getOrders()
      const updated = res.data.find(o => o.id === viewOrder.id)
      if (updated) setViewOrder(updated)
      fetchOrders()
    } catch {
      toast.error('Failed to remove item')
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  const nextStatusLabel = (s: string) => {
    const map: Record<string, string> = { pending: 'Preparing', preparing: 'Ready', ready: 'Completed' }
    return map[s]
  }

  const elapsed = (iso: string) => {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
    return diff < 1 ? 'Just now' : `${diff}m ago`
  }

  const filters: { val: FilterStatus; label: string }[] = [
    { val: 'all', label: 'All' },
    { val: 'pending', label: 'Pending' },
    { val: 'preparing', label: 'Preparing' },
    { val: 'ready', label: 'Ready' },
    { val: 'completed', label: 'Completed' },
    { val: 'cancelled', label: 'Cancelled' },
  ]

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-kitchen-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="font-display text-3xl tracking-wider text-kitchen-text">ORDERS</h2>
        <button onClick={() => { setShowCreate(true); setErrors({}) }} className="flex items-center gap-2 px-4 py-2 bg-kitchen-accent hover:bg-kitchen-accent-dim text-white rounded-lg transition-all font-medium text-sm">
          <Plus size={16} /> New Order
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 flex-wrap">
        <Filter size={14} className="text-kitchen-muted mr-1" />
        {filters.map(f => (
          <button key={f.val} onClick={() => setFilter(f.val)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f.val ? 'bg-kitchen-accent/10 text-kitchen-accent border border-kitchen-accent/30' : 'text-kitchen-muted hover:text-kitchen-text hover:bg-[#2e2b25] border border-transparent'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Orders table */}
      {orders.length === 0 ? (
        <div className="bg-[#1a1815] border border-[#2e2b25] rounded-xl p-12 text-center">
          <p className="text-kitchen-muted">No orders found for this filter.</p>
        </div>
      ) : (
        <div className="bg-[#1a1815] border border-[#2e2b25] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2e2b25]">
                {['Order', 'Table', 'Customer', 'Items', 'Total', 'Status', 'Time', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-kitchen-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2e2b25]">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-[#211f1b] transition-colors">
                  <td className="px-4 py-3 font-mono text-kitchen-accent font-medium">#{order.id}</td>
                  <td className="px-4 py-3 text-kitchen-text">{order.table_number}</td>
                  <td className="px-4 py-3 text-kitchen-text-dim">{order.customer_name || '—'}</td>
                  <td className="px-4 py-3 text-kitchen-text-dim">{order.order_items.length} items</td>
                  <td className="px-4 py-3 font-mono text-kitchen-accent text-xs">₱{order.total_price}</td>
                  <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                  <td className="px-4 py-3 text-kitchen-muted text-xs font-mono">{elapsed(order.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setViewOrder(order)} className="p-1.5 rounded-lg hover:bg-[#2e2b25] text-kitchen-muted hover:text-kitchen-text transition-all" title="View">
                        <Eye size={14} />
                      </button>
                      {nextStatusLabel(order.status) && (
                        <button onClick={() => handleAdvance(order)} className="p-1.5 rounded-lg hover:bg-kitchen-accent/10 text-kitchen-muted hover:text-kitchen-accent transition-all" title={`Advance to ${nextStatusLabel(order.status)}`}>
                          <ChevronRight size={14} />
                        </button>
                      )}
                      {!['completed', 'cancelled'].includes(order.status) && (
                        <button onClick={() => setCancelTarget(order)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-kitchen-muted hover:text-red-400 transition-all" title="Cancel">
                          <XCircle size={14} />
                        </button>
                      )}
                      <button onClick={() => setDeleteTarget(order)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-kitchen-muted hover:text-red-400 transition-all" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── CREATE ORDER MODAL ── */}
      {showCreate && (
        <Modal title="New Order" onClose={() => setShowCreate(false)} wide>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-kitchen-muted mb-1">Table Number *</label>
                <input type="text" inputMode="numeric" value={form.table_number} onChange={e => setForm(p => ({ ...p, table_number: e.target.value.replace(/[^0-9]/g, '') }))}
                  className="w-full bg-[#0f0e0c] border border-[#2e2b25] rounded-lg px-3 py-2 text-kitchen-text text-sm focus:outline-none focus:border-kitchen-accent transition-colors"
                  placeholder="1" />
                {errors.table_number && <p className="text-red-400 text-xs mt-1">{errors.table_number}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-kitchen-muted mb-1">Customer Name</label>
                <input value={form.customer_name} onChange={e => setForm(p => ({ ...p, customer_name: e.target.value }))}
                  className="w-full bg-[#0f0e0c] border border-[#2e2b25] rounded-lg px-3 py-2 text-kitchen-text text-sm focus:outline-none focus:border-kitchen-accent transition-colors"
                  placeholder="Optional" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-kitchen-muted mb-1">Notes</label>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                rows={2} className="w-full bg-[#0f0e0c] border border-[#2e2b25] rounded-lg px-3 py-2 text-kitchen-text text-sm focus:outline-none focus:border-kitchen-accent transition-colors resize-none"
                placeholder="Allergies, special requests…" />
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-kitchen-muted">Order Items</label>
                <button type="button" onClick={addFormItem} disabled={menuItems.length === 0}
                  className="flex items-center gap-1 text-xs text-kitchen-accent hover:text-kitchen-accent-dim transition-colors disabled:opacity-40">
                  <Plus size={12} /> Add Item
                </button>
              </div>
              {menuItems.length === 0 && <p className="text-yellow-400 text-xs">Add menu items first before creating an order.</p>}
              {errors.items && <p className="text-red-400 text-xs mb-2">{errors.items}</p>}
              <div className="space-y-2">
                {form.items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <select value={item.menu_item} onChange={e => updateFormItem(idx, 'menu_item', Number(e.target.value))}
                      className="flex-1 bg-[#0f0e0c] border border-[#2e2b25] rounded-lg px-3 py-2 text-kitchen-text text-sm focus:outline-none focus:border-kitchen-accent">
                      {menuItems.filter(m => m.is_available).map(m => (
                        <option key={m.id} value={m.id}>{m.name} — ₱{m.price}</option>
                      ))}
                    </select>
                    <input type="number" min="1" value={item.quantity} onChange={e => updateFormItem(idx, 'quantity', Number(e.target.value))}
                      className="w-16 bg-[#0f0e0c] border border-[#2e2b25] rounded-lg px-2 py-2 text-kitchen-text text-sm text-center focus:outline-none focus:border-kitchen-accent" />
                    <input value={item.special_instructions} onChange={e => updateFormItem(idx, 'special_instructions', e.target.value)}
                      className="flex-1 bg-[#0f0e0c] border border-[#2e2b25] rounded-lg px-3 py-2 text-kitchen-text text-sm focus:outline-none focus:border-kitchen-accent"
                      placeholder="Note (optional)" />
                    <button type="button" onClick={() => removeFormItem(idx)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2.5 border border-[#2e2b25] text-kitchen-muted rounded-lg hover:border-[#3e3b35] hover:text-kitchen-text transition-all text-sm">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-kitchen-accent hover:bg-kitchen-accent-dim disabled:opacity-50 text-white rounded-lg transition-all font-medium text-sm">
                {submitting ? 'Creating…' : 'Create Order'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── ORDER DETAIL MODAL ── */}
      {viewOrder && (
        <Modal title={`Order #${viewOrder.id}`} onClose={() => setViewOrder(null)} wide>
          <div className="space-y-4">
            {/* Info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-[#0f0e0c] rounded-lg p-3">
                <span className="text-kitchen-muted text-xs">Table</span>
                <p className="text-kitchen-text font-medium mt-0.5">{viewOrder.table_number}</p>
              </div>
              <div className="bg-[#0f0e0c] rounded-lg p-3">
                <span className="text-kitchen-muted text-xs">Customer</span>
                <p className="text-kitchen-text font-medium mt-0.5">{viewOrder.customer_name || '—'}</p>
              </div>
              <div className="bg-[#0f0e0c] rounded-lg p-3">
                <span className="text-kitchen-muted text-xs">Status</span>
                <div className="mt-1"><StatusBadge status={viewOrder.status} /></div>
              </div>
              <div className="bg-[#0f0e0c] rounded-lg p-3">
                <span className="text-kitchen-muted text-xs">Total</span>
                <p className="text-kitchen-accent font-mono font-medium mt-0.5">₱{viewOrder.total_price}</p>
              </div>
            </div>

            {viewOrder.notes && (
              <div className="bg-[#0f0e0c] rounded-lg p-3 text-sm">
                <span className="text-kitchen-muted text-xs">Notes</span>
                <p className="text-kitchen-text mt-0.5">{viewOrder.notes}</p>
              </div>
            )}

            {viewOrder.preparation_time != null && (
              <div className="flex items-center gap-2 text-xs text-kitchen-muted">
                <Clock size={12} />
                <span>Prep time: {Math.floor(viewOrder.preparation_time / 60)}m {viewOrder.preparation_time % 60}s</span>
              </div>
            )}

            {/* Items list */}
            <div>
              <h4 className="text-xs font-medium text-kitchen-muted uppercase tracking-wider mb-2">Items</h4>
              <div className="space-y-1">
                {viewOrder.order_items.map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-[#0f0e0c] rounded-lg px-3 py-2 text-sm">
                    <span className="text-kitchen-text">{item.quantity}× {item.menu_item_name}</span>
                    {item.special_instructions && <span className="text-kitchen-muted text-xs italic mx-2">{item.special_instructions}</span>}
                    <div className="flex items-center gap-2 ml-auto">
                      <span className="text-kitchen-accent font-mono text-xs">₱{item.subtotal}</span>
                      {!['completed', 'cancelled'].includes(viewOrder.status) && (
                        <button onClick={() => handleRemoveItem(item.id)} className="text-kitchen-muted hover:text-red-400 transition-colors">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add item to order */}
            {!['completed', 'cancelled'].includes(viewOrder.status) && menuItems.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-kitchen-muted uppercase tracking-wider mb-2">Add Item</h4>
                <div className="flex gap-2">
                  <select value={addItemMenuId} onChange={e => setAddItemMenuId(e.target.value)}
                    className="flex-1 bg-[#0f0e0c] border border-[#2e2b25] rounded-lg px-3 py-2 text-kitchen-text text-sm focus:outline-none focus:border-kitchen-accent">
                    <option value="">Select item…</option>
                    {menuItems.filter(m => m.is_available).map(m => (
                      <option key={m.id} value={m.id}>{m.name} — ₱{m.price}</option>
                    ))}
                  </select>
                  <input type="number" min="1" value={addItemQty} onChange={e => setAddItemQty(e.target.value)}
                    className="w-16 bg-[#0f0e0c] border border-[#2e2b25] rounded-lg px-2 py-2 text-kitchen-text text-sm text-center focus:outline-none focus:border-kitchen-accent" />
                  <button onClick={handleAddItem} disabled={!addItemMenuId || addingItem}
                    className="px-4 py-2 bg-kitchen-accent hover:bg-kitchen-accent-dim disabled:opacity-40 text-white rounded-lg text-sm transition-all">
                    {addingItem ? '…' : 'Add'}
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-[#2e2b25]">
              {nextStatusLabel(viewOrder.status) && (
                <button onClick={() => handleAdvance(viewOrder)} className="flex-1 py-2.5 bg-kitchen-accent hover:bg-kitchen-accent-dim text-white rounded-lg transition-all font-medium text-sm">
                  → {nextStatusLabel(viewOrder.status)}
                </button>
              )}
              {!['completed', 'cancelled'].includes(viewOrder.status) && (
                <button onClick={() => { setCancelTarget(viewOrder); setViewOrder(null) }} className="px-4 py-2.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg transition-all text-sm">
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Confirms */}
      {cancelTarget && (
        <ConfirmDialog danger message={`Cancel Order #${cancelTarget.id}? This cannot be undone.`} confirmLabel="Cancel Order" onConfirm={handleCancel} onCancel={() => setCancelTarget(null)} />
      )}
      {deleteTarget && (
        <ConfirmDialog danger message={`Delete Order #${deleteTarget.id} permanently?`} confirmLabel="Delete" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      )}
    </div>
  )
}
