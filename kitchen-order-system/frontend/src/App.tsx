import React, { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import Navbar from './components/Navbar'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import DashboardPage from './pages/DashboardPage'
import OrdersPage from './pages/OrdersPage'
import MenuPage from './pages/MenuPage'
import { getProfile, logout } from './api'
import type { UserProfile } from './api'

type Page = 'dashboard' | 'orders' | 'menu' | 'profile'

export default function App() {
  const [token, setToken]     = useState<string | null>(localStorage.getItem('token'))
  const [user, setUser]       = useState<UserProfile | null>(null)
  const [page, setPage]       = useState<Page>('dashboard')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      getProfile()
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('token')
          setToken(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token])

  const handleLogin = (newToken: string) => {
    setToken(newToken)
    getProfile().then(res => setUser(res.data))
    setPage('profile')
  }

  const handleLogout = async () => {
    try { await logout() } catch {}
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    toast.success('Signed out successfully')
  }

  if (loading) return (
    <div className="min-h-screen bg-[#f0f7f4] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!token) return (
    <>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#fff', color: '#1a2e2a', border: '1px solid #c8e6c9', fontSize: '14px' },
        success: { iconTheme: { primary: '#2e7d32', secondary: '#fff' } },
        error:   { iconTheme: { primary: '#c62828', secondary: '#fff' } },
      }} />
      <LoginPage onLogin={handleLogin} />
    </>
  )

  return (
    <div className="min-h-screen bg-[#f0f7f4]">
      <Toaster position="top-right" toastOptions={{
        style: { background: '#fff', color: '#1a2e2a', border: '1px solid #c8e6c9', fontSize: '14px' },
        success: { iconTheme: { primary: '#2e7d32', secondary: '#fff' } },
        error:   { iconTheme: { primary: '#c62828', secondary: '#fff' } },
      }} />
      <Navbar current={page} onChange={setPage} user={user} onLogout={handleLogout} />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {page === 'dashboard' && <DashboardPage />}
        {page === 'orders'    && <OrdersPage />}
        {page === 'menu'      && <MenuPage />}
        {page === 'profile'   && <ProfilePage />}
      </main>
    </div>
  )
}