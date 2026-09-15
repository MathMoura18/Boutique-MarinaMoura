import type { AppliedCoupon, Collection, Order, Product, Section } from '../types'
import { supabase } from './supabase'

export const PRODUCT_SELECT =
  '*, section:sections(id, slug, name), collection:collections(id, slug, name), images:product_images(*), variants:product_variants(*)'

const unwrap = <T>({ data, error }: { data: T | null; error: unknown }): T => {
  if (error) throw error
  return data as T
}

const normalizeProduct = (p: Product): Product => ({
  ...p,
  price: Number(p.price),
  compare_at_price: p.compare_at_price == null ? null : Number(p.compare_at_price),
  images: [...(p.images ?? [])].sort((a, b) => a.sort_order - b.sort_order),
  variants: [...(p.variants ?? [])].sort((a, b) => a.sort_order - b.sort_order),
})

export async function fetchProducts({ includeInactive = false } = {}) {
  let query = supabase.from('products').select(PRODUCT_SELECT).order('created_at', { ascending: false })
  if (!includeInactive) query = query.eq('active', true)
  return unwrap(await query).map((p) => normalizeProduct(p as Product))
}

export async function fetchProductBySlug(slug: string) {
  const data = unwrap(await supabase.from('products').select(PRODUCT_SELECT).eq('slug', slug).maybeSingle())
  return data ? normalizeProduct(data as Product) : null
}

export async function fetchProductById(id: string) {
  const data = unwrap(await supabase.from('products').select(PRODUCT_SELECT).eq('id', id).maybeSingle())
  return data ? normalizeProduct(data as Product) : null
}

export async function fetchSections() {
  return unwrap(await supabase.from('sections').select('*').order('sort_order').order('name')) as Section[]
}

export async function fetchCollections() {
  return unwrap(await supabase.from('collections').select('*').order('sort_order').order('created_at', { ascending: false })) as Collection[]
}

export async function validateCoupon(code: string, subtotal: number): Promise<AppliedCoupon> {
  const rows = unwrap(await supabase.rpc('validate_coupon', { p_code: code, p_subtotal: subtotal })) as AppliedCoupon[]
  const c = rows[0]
  return { ...c, value: Number(c.value), min_subtotal: Number(c.min_subtotal) }
}

const normalizeOrder = (o: Order): Order => ({
  ...o,
  subtotal: Number(o.subtotal),
  coupon_discount: Number(o.coupon_discount),
  payment_discount: Number(o.payment_discount),
  shipping_cost: Number(o.shipping_cost),
  total: Number(o.total),
  items: o.items?.map((i) => ({ ...i, unit_price: Number(i.unit_price) })),
})

export async function fetchOrders({ userId }: { userId?: string } = {}) {
  let query = supabase.from('orders').select('*, items:order_items(*)').order('created_at', { ascending: false })
  if (userId) query = query.eq('user_id', userId)
  return (unwrap(await query) as Order[]).map(normalizeOrder)
}

export async function fetchOrderByNumber(number: string) {
  const data = unwrap(await supabase.from('orders').select('*, items:order_items(*)').eq('number', number).maybeSingle())
  return data ? normalizeOrder(data as Order) : null
}
