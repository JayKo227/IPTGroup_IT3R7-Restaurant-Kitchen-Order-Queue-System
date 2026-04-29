import React, { useEffect, useState } from 'react'
import { getDashboardStats, getOrders, advanceOrderStatus, cancelOrder } from '../api'
import type { DashboardStats, Order } from '../api'
import StatusBadge from '../components/StatusBadge'
import ConfirmDialog from '../components/ConfirmDialog'
import toast from 'react-hot-toast'
import { Clock, TrendingUp, CheckCircle, XCircle, ChefHat, Bell } from 'lucide-react'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activeOrders, setActiveOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [confirm, setConfirm] = useState<{ type: 'advance' | 'cancel'; order: Order } | null>(null)

  const fetchAll = async () => {
    try {
      const [sRes, oRes] = await Promise.all([
        getDashboardStats(),
        getOrders(),
      ])
      setStats(sRes.data)
      setActiveOrders(oRes.data.filter(o => !['completed', 'cancelled'].includes(o.status)))
    } catch {
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 15000)
    return () => clearInterval(interval)
  }, [])

  const handleAdvance = async (order: Order) => {
    try {
      await advanceOrderStatus(order.id)
      toast.success(`Order #${order.id} → ${nextStatus(order.status)}`)
      fetchAll()
    } catch {
      toast.error('Failed to update order')
    }
    setConfirm(null)
  }

  const handleCancel = async (order: Order) => {
    try {
      await cancelOrder(order.id)
      toast.success(`Order #${order.id} cancelled`)
      fetchAll()
    } catch {
      toast.error('Failed to cancel order')
    }
    setConfirm(null)
  }

  const nextStatus = (s: string) => {
    const map: Record<string, string> = { pending: 'Preparing', preparing: 'Ready', ready: 'Completed' }
    return map[s] ?? s
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
  }

  const elapsed = (iso: string) => {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
    return diff < 1 ? 'Just now' : `${diff}m ago`
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-kitchen-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        {[
          { label: 'Total Orders', val: stats?.total_orders, icon: TrendingUp, color: 'text-kitchen-accent' },
          { label: 'Pending',      val: stats?.pending,      icon: Clock,       color: 'text-yellow-400' },
          { label: 'Preparing',    val: stats?.preparing,    icon: ChefHat,     color: 'text-kitchen-accent' },
          { label: 'Ready',        val: stats?.ready,        icon: Bell,        color: 'text-green-400' },
          { label: 'Completed',    val: stats?.completed,    icon: CheckCircle, color: 'text-blue-400' },
        ].map(({ label, val, icon: Icon, color }) => (
          <div key={label} className="bg-[#1a1815] border border-[#2e2b25] rounded-[1.5rem] p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-kitchen-muted text-sm font-medium uppercase tracking-wider">{label}</span>
              <Icon size={20} className={color} />
            </div>
            <span className="font-display text-5xl tracking-wide text-kitchen-text">{val ?? 0}</span>
          </div>
        ))}
      </div>

      {/* Active Kitchen Queue */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-3xl md:text-4xl tracking-wider text-kitchen-text">ACTIVE QUEUE</h2>
            <span className="px-3 py-1 bg-kitchen-accent/10 text-kitchen-accent border border-kitchen-accent/30 rounded-full text-sm font-mono">
              {activeOrders.length} orders
            </span>
          </div>
        </div>

        {activeOrders.length === 0 ? (
          <div className="bg-[#1a1815] border border-[#2e2b25] rounded-[1.5rem] p-16 text-center">
            <ChefHat size={48} className="text-kitchen-muted mx-auto mb-4" />
            <p className="text-kitchen-muted text-lg">No active orders. Kitchen is clear!</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {activeOrders.map(order => (
              <div key={order.id} className="bg-[#1a1815] border border-[#2e2b25] rounded-[1.5rem] p-6 hover:border-[#3e3b35] transition-all">
                {/* Header */}
                <div className="flex items-start justify-between mb-4 gap-4">
                  <div>
                    <span className="font-display text-2xl tracking-wider text-kitchen-text">ORDER #{order.id}</span>
                    <p className="text-kitchen-muted text-sm mt-1">Table {order.table_number}{order.customer_name ? ` · ${order.customer_name}` : ''}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                {/* Items */}
                <div className="flex gap-2 mb-4">
                  {order.order_items.slice(0, 3).map(item => (
                    <div key={item.id} className="w-16 h-16 rounded-3xl overflow-hidden bg-[#0f0e0c] border border-[#2e2b25]">
                      {item.menu_item_image ? (
                        <img src={item.menu_item_image} alt={item.menu_item_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-kitchen-muted uppercase tracking-wider">No image</div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="space-y-2 mb-4 min-h-[60px]">
                  {order.order_items.slice(0, 3).map(item => (
                    <div key={item.id} className="flex justify-between text-base">
                      <span className="text-kitchen-text-dim">{item.quantity}× {item.menu_item_name}</span>
                      <span className="text-kitchen-muted font-mono text-sm">₱{item.subtotal}</span>
                    </div>
                  ))}
                  {order.order_items.length > 3 && (
                    <span className="text-kitchen-muted text-sm">+{order.order_items.length - 3} more items</span>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-[#2e2b25] mb-4">
                  <span className="text-sm text-kitchen-muted font-mono">{elapsed(order.created_at)}</span>
                  <span className="text-kitchen-accent font-mono font-semibold text-base">₱{order.total_price}</span>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {order.status !== 'completed' && order.status !== 'cancelled' && (
                    <button
                      onClick={() => setConfirm({ type: 'advance', order })}
                      className="flex-1 py-3 bg-kitchen-accent hover:bg-kitchen-accent-dim text-white text-base font-medium rounded-[1rem] transition-all"
                    >
                      → {nextStatus(order.status)}
                    </button>
                  )}
                  <button
                    onClick={() => setConfirm({ type: 'cancel', order })}
                    className="w-full sm:w-auto px-4 py-3 border border-red-500/30 text-red-400 hover:bg-red-500/10 text-base rounded-[1rem] transition-all"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm dialog */}
      {confirm && (
        <ConfirmDialog
          danger={confirm.type === 'cancel'}
          message={
            confirm.type === 'advance'
              ? `Advance Order #${confirm.order.id} to "${nextStatus(confirm.order.status)}"?`
              : `Cancel Order #${confirm.order.id}? This cannot be undone.`
          }
          confirmLabel={confirm.type === 'advance' ? 'Advance' : 'Cancel Order'}
          onConfirm={() => confirm.type === 'advance' ? handleAdvance(confirm.order) : handleCancel(confirm.order)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  )
}
