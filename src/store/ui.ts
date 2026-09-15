import { create } from 'zustand'

export interface Toast {
  id: number
  title: string
  description?: string
  tone?: 'default' | 'success' | 'love'
}

export interface Flyer {
  id: number
  from: { x: number; y: number }
  color: string
  image?: string | null
}

interface UIState {
  cartOpen: boolean
  searchOpen: boolean
  menuOpen: boolean
  toasts: Toast[]
  flyers: Flyer[]
  cartPulse: number
  headerHidden: boolean
  setHeaderHidden: (v: boolean) => void
  setCartOpen: (v: boolean) => void
  setSearchOpen: (v: boolean) => void
  setMenuOpen: (v: boolean) => void
  toast: (t: Omit<Toast, 'id'>) => void
  dismissToast: (id: number) => void
  fly: (from: { x: number; y: number }, color: string, image?: string | null) => void
  landFlyer: (id: number) => void
}

let seq = 0

export const useUI = create<UIState>()((set, get) => ({
  cartOpen: false,
  searchOpen: false,
  menuOpen: false,
  toasts: [],
  flyers: [],
  cartPulse: 0,
  headerHidden: false,
  setHeaderHidden: (headerHidden) => get().headerHidden !== headerHidden && set({ headerHidden }),
  setCartOpen: (cartOpen) => set({ cartOpen }),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  setMenuOpen: (menuOpen) => set({ menuOpen }),
  toast: (t) => {
    const id = ++seq
    set({ toasts: [...get().toasts.slice(-2), { ...t, id }] })
    setTimeout(() => get().dismissToast(id), 3200)
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
  fly: (from, color, image) => set({ flyers: [...get().flyers, { id: ++seq, from, color, image }] }),
  landFlyer: (id) => set({ flyers: get().flyers.filter((f) => f.id !== id), cartPulse: get().cartPulse + 1 }),
}))
