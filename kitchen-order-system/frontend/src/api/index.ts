import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

export default api

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'

export interface MenuItem {
  id: number
  name: string
  description: string
  price: string
  estimated_prep_time: number
  is_available: boolean
  created_at: string
}

export interface OrderItem {
  id: number
  order: number
  menu_item: number
  menu_item_name: string
  menu_item_price: string
  quantity: number
  special_instructions: string
  subtotal: string
}

export interface Order {
  id: number
  table_number: number
  customer_name: string
  status: OrderStatus
  status_display: string
  notes: string
  created_at: string
  updated_at: string
  started_at: string | null
  completed_at: string | null
  preparation_time: number | null
  total_price: string
  order_items: OrderItem[]
}

export interface DashboardStats {
  total_orders: number
  pending: number
  preparing: number
  ready: number
  completed: number
  cancelled: number
}

// ─── API CALLS ────────────────────────────────────────────────────────────────

// Menu Items
export const getMenuItems = () => api.get<MenuItem[]>('/menu-items/')
export const createMenuItem = (data: Partial<MenuItem>) => api.post<MenuItem>('/menu-items/', data)
export const updateMenuItem = (id: number, data: Partial<MenuItem>) => api.patch<MenuItem>(`/menu-items/${id}/`, data)
export const deleteMenuItem = (id: number) => api.delete(`/menu-items/${id}/`)

// Orders
export const getOrders = (status?: string) =>
  api.get<Order[]>('/orders/', { params: status ? { status } : {} })
export const getOrder = (id: number) => api.get<Order>(`/orders/${id}/`)
export const createOrder = (data: {
  table_number: number
  customer_name?: string
  notes?: string
  items?: { menu_item: number; quantity: number; special_instructions?: string }[]
}) => api.post<Order>('/orders/', data)
export const updateOrder = (id: number, data: Partial<Order>) =>
  api.patch<Order>(`/orders/${id}/`, data)
export const deleteOrder = (id: number) => api.delete(`/orders/${id}/`)

// Order status actions
export const advanceOrderStatus = (id: number) =>
  api.post<Order>(`/orders/${id}/status/`, { action: 'advance' })
export const cancelOrder = (id: number) =>
  api.post<Order>(`/orders/${id}/status/`, { action: 'cancel' })

// Order Items
export const getOrderItems = (orderId: number) =>
  api.get<OrderItem[]>(`/orders/${orderId}/items/`)
export const addOrderItem = (
  orderId: number,
  data: { menu_item: number; quantity: number; special_instructions?: string }
) => api.post<OrderItem>(`/orders/${orderId}/items/`, data)
export const updateOrderItem = (orderId: number, itemId: number, data: Partial<OrderItem>) =>
  api.patch<OrderItem>(`/orders/${orderId}/items/${itemId}/`, data)
export const deleteOrderItem = (orderId: number, itemId: number) =>
  api.delete(`/orders/${orderId}/items/${itemId}/`)

// Dashboard
export const getDashboardStats = () => api.get<DashboardStats>('/dashboard/')
