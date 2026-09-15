import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { couponDiscount } from '../lib/commerce'
import type { AppliedCoupon, CartItem } from '../types'

interface CartState {
  items: CartItem[]
  coupon: AppliedCoupon | null
  add: (item: Omit<CartItem, 'qty' | 'key'>, qty?: number) => void
  setQty: (key: string, qty: number) => void
  remove: (key: string) => void
  clear: () => void
  setCoupon: (coupon: AppliedCoupon | null) => void
}

const clampQty = (qty: number, stock: number) => Math.max(1, Math.min(qty, Math.max(stock, 1), 10))

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      add: (item, qty = 1) => {
        const key = item.variantId
        const existing = get().items.find((i) => i.key === key)
        set({
          items: existing
            ? get().items.map((i) => (i.key === key ? { ...i, ...item, qty: clampQty(i.qty + qty, item.stock) } : i))
            : [...get().items, { ...item, key, qty: clampQty(qty, item.stock) }],
        })
      },
      setQty: (key, qty) => set({ items: get().items.map((i) => (i.key === key ? { ...i, qty: clampQty(qty, i.stock) } : i)) }),
      remove: (key) => set({ items: get().items.filter((i) => i.key !== key) }),
      clear: () => set({ items: [], coupon: null }),
      setCoupon: (coupon) => set({ coupon }),
    }),
    { name: 'mm-cart-v2' },
  ),
)

export const cartTotals = (items: CartItem[], coupon: AppliedCoupon | null) => {
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const count = items.reduce((s, i) => s + i.qty, 0)
  const discount = couponDiscount(coupon, subtotal)
  const freeShipping = coupon?.discount_type === 'free_shipping' && subtotal >= coupon.min_subtotal
  return { subtotal, count, discount, freeShipping }
}
