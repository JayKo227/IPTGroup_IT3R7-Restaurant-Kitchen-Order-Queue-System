import React, { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import DashboardPage from './pages/DashboardPage'
import OrdersPage from './pages/OrdersPage'
import MenuPage from './pages/MenuPage'

type Page = 'dashboard' | 'orders' | 'menu'

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')

  return (
    <div className="min-h-screen bg-[#0f0e0c]">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1815',
            color: '#e8e2d9',
            border: '1px solid #2e2b25',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#1a1815' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#1a1815' } },
        }}
      />
      <Navbar current={page} onChange={setPage} />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {page === 'dashboard' && <DashboardPage />}
        {page === 'orders'    && <OrdersPage />}
        {page === 'menu'      && <MenuPage />}
      </main>
    </div>
  )
}
