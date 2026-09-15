import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchCollections, fetchOrders, fetchProducts, fetchSections } from '../lib/api'
import { supabase } from '../lib/supabase'
import type { Coupon, Profile } from '../types'

export interface DashboardStats {
  revenue: number
  revenue_30d: number
  orders: number
  orders_pending: number
  customers: number
  products_active: number
  low_stock: number
  sales_by_day: { day: string; total: number }[]
}

export const useAdminProducts = () => useQuery({ queryKey: ['products', 'admin'], queryFn: () => fetchProducts({ includeInactive: true }) })
export const useAdminSections = () => useQuery({ queryKey: ['sections'], queryFn: fetchSections })
export const useAdminCollections = () => useQuery({ queryKey: ['collections'], queryFn: fetchCollections })
export const useAdminOrders = () => useQuery({ queryKey: ['orders', 'admin'], queryFn: () => fetchOrders() })

export const useCoupons = () =>
  useQuery({
    queryKey: ['coupons'],
    queryFn: async () => {
      const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return (data as Coupon[]).map((c) => ({ ...c, value: Number(c.value), min_subtotal: Number(c.min_subtotal) }))
    },
  })

export const useProfiles = () =>
  useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data as Profile[]
    },
  })

export const useDashboard = () =>
  useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_dashboard')
      if (error) throw error
      const d = data as DashboardStats
      return { ...d, revenue: Number(d.revenue), revenue_30d: Number(d.revenue_30d), sales_by_day: d.sales_by_day.map((s) => ({ ...s, total: Number(s.total) })) }
    },
  })

/** Invalida os dados que dependem do catálogo/estoque (loja + painel) */
export function useInvalidate() {
  const qc = useQueryClient()
  return (...keys: string[]) => Promise.all(keys.map((k) => qc.invalidateQueries({ queryKey: [k] })))
}
