import { useQuery } from '@tanstack/react-query'
import { fetchCollections, fetchOrderByNumber, fetchOrders, fetchProductBySlug, fetchProducts, fetchSections } from '../lib/api'
import { useAuth } from '../store/auth'

export const qk = {
  products: ['products'] as const,
  adminProducts: ['products', 'admin'] as const,
  product: (slug: string) => ['products', 'slug', slug] as const,
  sections: ['sections'] as const,
  collections: ['collections'] as const,
  myOrders: (userId?: string) => ['orders', 'mine', userId] as const,
  order: (number: string) => ['orders', 'number', number] as const,
}

export const useProducts = () => useQuery({ queryKey: qk.products, queryFn: () => fetchProducts() })

export const useProduct = (slug: string) => useQuery({ queryKey: qk.product(slug), queryFn: () => fetchProductBySlug(slug) })

/** Seções ativas para a loja */
export const useSections = () =>
  useQuery({ queryKey: qk.sections, queryFn: fetchSections, select: (rows) => rows.filter((s) => s.active) })

/** Coleções ativas para a loja */
export const useCollections = () =>
  useQuery({ queryKey: qk.collections, queryFn: fetchCollections, select: (rows) => rows.filter((c) => c.active) })

export const useMyOrders = () => {
  const userId = useAuth((s) => s.session?.user.id)
  return useQuery({ queryKey: qk.myOrders(userId), queryFn: () => fetchOrders({ userId }), enabled: !!userId })
}

export const useOrder = (number: string) => useQuery({ queryKey: qk.order(number), queryFn: () => fetchOrderByNumber(number) })
