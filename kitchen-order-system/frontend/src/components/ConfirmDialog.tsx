import React from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  danger?: boolean
}

export default function ConfirmDialog({ message, onConfirm, onCancel, confirmLabel = 'Confirm', danger = false }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-[#1a1815] border border-[#2e2b25] rounded-xl shadow-2xl p-6 w-full max-w-sm animate-slide-in">
        <div className="flex gap-3 mb-4">
          <AlertTriangle size={22} className={danger ? 'text-red-400 flex-shrink-0 mt-0.5' : 'text-yellow-400 flex-shrink-0 mt-0.5'} />
          <p className="text-kitchen-text">{message}</p>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-[#2e2b25] text-kitchen-muted hover:text-kitchen-text hover:border-[#3e3b35] transition-all text-sm">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${danger ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-kitchen-accent hover:bg-kitchen-accent-dim text-white'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
