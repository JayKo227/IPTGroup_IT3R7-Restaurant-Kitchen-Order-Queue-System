import React from 'react'
import { X } from 'lucide-react'

interface Props {
  title: string
  onClose: () => void
  children: React.ReactNode
  wide?: boolean
}

export default function Modal({ title, onClose, children, wide = false }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-[#1a1815] border border-[#2e2b25] rounded-xl shadow-2xl animate-slide-in ${wide ? 'w-full max-w-2xl' : 'w-full max-w-md'} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2e2b25]">
          <h2 className="font-display text-2xl tracking-wider text-kitchen-text">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#2e2b25] text-kitchen-muted hover:text-kitchen-text transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
