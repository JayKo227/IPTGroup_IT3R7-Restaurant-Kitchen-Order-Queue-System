import React from 'react'
import type { OrderStatus } from '../api'

const config: Record<OrderStatus, { label: string; cls: string; dot: string }> = {
  pending:   { label: 'Pending',   cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',  dot: 'bg-yellow-400' },
  preparing: { label: 'Preparing', cls: 'bg-orange-500/10 text-orange-400 border-orange-500/30 status-preparing', dot: 'bg-orange-400' },
  ready:     { label: 'Ready',     cls: 'bg-green-500/10 text-green-400 border-green-500/30',     dot: 'bg-green-400' },
  completed: { label: 'Completed', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/30',        dot: 'bg-blue-400' },
  cancelled: { label: 'Cancelled', cls: 'bg-red-500/10 text-red-400 border-red-500/30',           dot: 'bg-red-400' },
}

export default function StatusBadge({ status }: { status: OrderStatus }) {
  const { label, cls, dot } = config[status] ?? config.pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium border ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  )
}
