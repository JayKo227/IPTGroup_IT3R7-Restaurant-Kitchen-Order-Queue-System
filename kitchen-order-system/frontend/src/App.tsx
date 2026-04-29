import React, { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import { Sun, Moon } from 'lucide-react'
import Navbar from './components/Navbar'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ActivatePage from './pages/ActivatePage'
import PasswordResetRequestPage from './pages/PasswordResetRequestPage'
import PasswordResetConfirmPage from './pages/PasswordResetConfirmPage'
import ProfilePage from './pages/ProfilePage'
import DashboardPage from './pages/DashboardPage'
import OrdersPage from './pages/OrdersPage'
import MenuPage from './pages/MenuPage'
import { getProfile, logout } from './api'
import type { UserProfile } from './api'

type Page = 'dashboard' | 'orders' | 'menu' | 'profile'
type AuthScreen = 'login' | 'register' | 'activate' | 'forgot' | 'reset'

const getAuthScreenFromPath = (pathname: string): AuthScreen => {
  const parts = pathname.split('/').filter(Boolean)
  if (parts[0] === 'activate' && parts[1] && parts[2]) return 'activate'
  if (parts[0] === 'register') return 'register'
  if (parts[0] === 'forgot-password') return 'forgot'
  if (parts[0] === 'reset' && parts[1] && parts[2]) return 'reset'
  return 'login'
}

const getAuthParamsFromPath = (pathname: string) => {
  const parts = pathname.split('/').filter(Boolean)
  return { uid: parts[1] ?? '', token: parts[2] ?? '' }
}

const getPageFromPath = (pathname: string): Page => {
  const parts = pathname.split('/').filter(Boolean)
  if (parts[0] === 'orders') return 'orders'
  if (parts[0] === 'menu') return 'menu'
  if (parts[0] === 'profile') return 'profile'
  return 'dashboard'
}

export default function App() {
  const [token, setToken]     = useState<string | null>(localStorage.getItem('token'))
  const [user, setUser]       = useState<UserProfile | null>(null)
  const [page, setPage]       = useState<Page>(() => getPageFromPath(window.location.pathname))
  const [loading, setLoading] = useState(true)
  const [theme, setTheme]     = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'dark'
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme
    return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  })
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname)

  const authScreen = getAuthScreenFromPath(currentPath)
  const { uid: activateUid, token: activateToken } = getAuthParamsFromPath(currentPath)
  const { uid: resetUid, token: resetToken } = getAuthParamsFromPath(currentPath)

  useEffect(() => {
    const onPopState = () => setCurrentPath(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    setPage(getPageFromPath(currentPath))
  }, [currentPath])

  useEffect(() => {
    document.documentElement.classList.toggle('theme-light', theme === 'light')
    document.documentElement.classList.toggle('theme-dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

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

  const navigateAuth = (path: string) => {
    window.history.pushState({}, '', path)
    setCurrentPath(path)
  }

  const navigatePage = (path: Page | string) => {
    window.history.pushState({}, '', path)
    setCurrentPath(path)
    setPage(getPageFromPath(path))
  }

  const handleLogin = async (newToken: string) => {
    setToken(newToken)
    localStorage.setItem('token', newToken)
    try {
      const res = await getProfile()
      setUser(res.data)
    } catch {
      setUser(null)
    }
    navigatePage('/profile')
  }

  const handleLogout = async () => {
    try { await logout() } catch {}
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    navigateAuth('/')
    toast.success('Signed out successfully')
  }

  const toggleTheme = () => setTheme(current => current === 'light' ? 'dark' : 'light')

  const themeToggleButton = (
    <button
      type="button"
      onClick={toggleTheme}
      className="fixed bottom-4 right-4 z-50 inline-flex h-12 items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-[color:var(--text)] shadow-lg transition hover:bg-[color:var(--border)] hover:text-[color:var(--text)]"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? <Sun size={16} /> : <Moon size={16} />}
      {theme === 'light' ? 'Light mode' : 'Dark mode'}
    </button>
  )

  if (loading) return (
    <div className="min-h-screen bg-[color:var(--body)] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!token) {
    const toaster = (
      <Toaster position="top-right" toastOptions={{
        style: { background: '#fff', color: '#1a2e2a', border: '1px solid #c8e6c9', fontSize: '14px' },
        success: { iconTheme: { primary: '#2e7d32', secondary: '#fff' } },
        error:   { iconTheme: { primary: '#c62828', secondary: '#fff' } },
      }} />
    )

    if (authScreen === 'activate') return (
      <>
        {toaster}
        <ActivatePage
          uid={activateUid}
          token={activateToken}
          onDone={() => navigateAuth('/')}
        />
        {themeToggleButton}
      </>
    )

    if (authScreen === 'forgot') return (
      <>
        {toaster}
        <PasswordResetRequestPage
          onGoLogin={() => navigateAuth('/')}
        />
        {themeToggleButton}
      </>
    )

    if (authScreen === 'reset') return (
      <>
        {toaster}
        <PasswordResetConfirmPage
          uid={resetUid}
          token={resetToken}
          onDone={() => navigateAuth('/')}
        />
        {themeToggleButton}
      </>
    )

    if (authScreen === 'register') return (
      <>
        {toaster}
        <RegisterPage
          onRegistered={() => navigateAuth('/')}
          onGoLogin={() => navigateAuth('/')}
        />
        {themeToggleButton}
      </>
    )

    return (
      <>
        {toaster}
        <LoginPage
          onLogin={handleLogin}
          onGoRegister={() => navigateAuth('/register')}
          onGoForgot={() => navigateAuth('/forgot-password')}
        />
        {themeToggleButton}
      </>
    )
  }

  return (
    <div className="min-h-screen bg-[color:var(--body)] text-[color:var(--text)]">
      <Toaster position="top-right" toastOptions={{
        style: { background: '#fff', color: '#1a2e2a', border: '1px solid #c8e6c9', fontSize: '14px' },
        success: { iconTheme: { primary: '#2e7d32', secondary: '#fff' } },
        error:   { iconTheme: { primary: '#c62828', secondary: '#fff' } },
      }} />
      <Navbar current={page} onChange={navigatePage} user={user} onLogout={handleLogout} theme={theme} onToggleTheme={toggleTheme} />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {page === 'dashboard' && <DashboardPage />}
        {page === 'orders'    && <OrdersPage />}
        {page === 'menu'      && <MenuPage />}
        {page === 'profile'   && <ProfilePage user={user} onProfileUpdated={setUser} />}
      </main>
    </div>
  )
}