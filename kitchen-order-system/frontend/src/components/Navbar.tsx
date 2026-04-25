import React from 'react'
import { ChefHat, LayoutDashboard, UtensilsCrossed, ClipboardList, User, LogOut } from 'lucide-react'
import type { UserProfile } from '../api'

type Page = 'dashboard' | 'orders' | 'menu' | 'profile'

interface Props {
  current: Page
  onChange: (p: Page) => void
  user: UserProfile | null
  onLogout: () => void
}

const nav = [
  { id: 'dashboard' as Page, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'orders'    as Page, label: 'Orders',    icon: ClipboardList },
  { id: 'menu'      as Page, label: 'Menu Items', icon: UtensilsCrossed },
]

export default function Navbar({ current, onChange, user, onLogout }: Props) {
  return (
    <header className="bg-[#1a1815] border-b border-[#2e2b25] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 flex items-center h-16 gap-8">
        {/* Brand */}
        <div className="flex items-center gap-2.5 mr-4">
          <div className="w-9 h-9 bg-kitchen-accent rounded-lg flex items-center justify-center">
            <ChefHat size={20} className="text-white" />
          </div>
          <span className="font-display text-2xl tracking-widest text-kitchen-text">KITCHEN<span className="text-kitchen-accent">OQ</span></span>
        </div>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {nav.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                current === id
                  ? 'bg-kitchen-accent/10 text-kitchen-accent border border-kitchen-accent/30'
                  : 'text-kitchen-muted hover:text-kitchen-text hover:bg-[#2e2b25]'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>

        {/* User menu */}
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => onChange('profile')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              current === 'profile'
                ? 'bg-kitchen-accent/10 text-kitchen-accent border border-kitchen-accent/30'
                : 'text-kitchen-muted hover:text-kitchen-text hover:bg-[#2e2b25]'
            }`}
          >
            <User size={15} />
            {user?.first_name || 'Profile'}
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-kitchen-muted hover:text-kitchen-text hover:bg-[#2e2b25] transition-all"
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
