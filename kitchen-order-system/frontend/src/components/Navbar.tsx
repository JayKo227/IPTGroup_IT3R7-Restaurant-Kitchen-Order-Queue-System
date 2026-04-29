import React from 'react'
import { ChefHat, LayoutDashboard, UtensilsCrossed, ClipboardList, User, LogOut, Sun, Moon } from 'lucide-react'
import type { UserProfile } from '../api'

type Page = 'dashboard' | 'orders' | 'menu' | 'profile'

interface Props {
  current: Page
  onChange: (p: Page) => void
  user: UserProfile | null
  onLogout: () => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

const nav = [
  { id: 'dashboard' as Page, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'orders'    as Page, label: 'Orders',    icon: ClipboardList },
  { id: 'menu'      as Page, label: 'Menu Items', icon: UtensilsCrossed },
]

export default function Navbar({ current, onChange, user, onLogout, theme, onToggleTheme }: Props) {
  const userLabel = user
    ? `${user.first_name || 'Profile'} (${user.role.charAt(0).toUpperCase() + user.role.slice(1)})`
    : 'Profile'

  const userAvatar = user?.profile_picture_url
    ? <img src={user.profile_picture_url} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
    : <div className="w-8 h-8 rounded-full bg-[#2e2b25] text-white flex items-center justify-center text-xs font-semibold">
        {user?.first_name?.[0] ?? 'P'}{user?.last_name?.[0] ?? ''}
      </div>

  return (
    <header className="bg-[color:var(--surface)] border-b border-[color:var(--border)] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 flex items-center h-16 gap-8">
        {/* Brand */}
        <div className="flex items-center gap-2.5 mr-4">
          <div className="w-9 h-9 bg-[color:var(--accent)] rounded-lg flex items-center justify-center">
            <ChefHat size={20} className="text-white" />
          </div>
          <span className="font-display text-2xl tracking-widest text-[color:var(--text)]">KITCHEN<span className="text-[color:var(--accent)]">OQ</span></span>
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
            type="button"
            onClick={onToggleTheme}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[color:var(--text)] border border-[color:var(--border)] bg-[color:var(--surface)] hover:bg-[color:var(--border)] transition-all"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Sun size={15} /> : <Moon size={15} />}
            {theme === 'light' ? 'Light mode' : 'Dark mode'}
          </button>
          <button
            onClick={() => onChange('profile')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              current === 'profile'
                ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent)] border border-[color:var(--accent)]'
                : 'text-[color:var(--muted)] hover:text-[color:var(--text)] hover:bg-[color:var(--border)]'
            }`}
          >
            {userAvatar}
            <span>{userLabel}</span>
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[color:var(--muted)] hover:text-[color:var(--text)] hover:bg-[color:var(--border)] transition-all"
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
