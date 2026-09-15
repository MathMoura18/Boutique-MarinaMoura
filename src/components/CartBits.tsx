import { Minus, Plus, Tag, Trash2, Truck, X } from 'lucide-react'
import { AnimatePresence, motion, useAnimationControls } from 'motion/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { validateCoupon } from '../lib/api'
import { couponLabel, FREE_SHIPPING_THRESHOLD } from '../lib/commerce'
import { silk } from '../lib/easing'
import { money } from '../lib/format'
import { errorMessage } from '../lib/supabase'
import { cartTotals, useCart } from '../store/cart'
import type { CartItem } from '../types'
import { ProductImage } from './ProductImage'

export function QtyStepper({ value, onChange, max = 10 }: { value: number; onChange: (n: number) => void; max?: number }) {
  return (
    <div className="inline-flex h-9 items-center rounded-full border border-linen bg-ivory">
      <button
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-sand disabled:opacity-30"
        aria-label="Diminuir quantidade"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="relative w-7 overflow-hidden text-center text-sm font-medium tabular-nums">
        <motion.span key={value} initial={{ y: -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="block">
          {value}
        </motion.span>
      </span>
      <button
        onClick={() => onChange(value + 1)}
        disabled={value >= Math.min(max, 10)}
        className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-sand disabled:opacity-30"
        aria-label="Aumentar quantidade"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export function CartLine({ item, onNavigate, large = false }: { item: CartItem; onNavigate?: () => void; large?: boolean }) {
  const { setQty, remove } = useCart()
  const href = `/produto/${item.slug}`
  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60, height: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.45, ease: silk }}
      className="flex gap-4 overflow-hidden py-4"
    >
      <Link to={href} onClick={onNavigate} className={`${large ? 'w-28 sm:w-32' : 'w-24'} shrink-0 overflow-hidden rounded-2xl`}>
        <ProductImage src={item.image} alt={item.name} className="aspect-[3/4] w-full" placeholderLabel={false} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link to={href} onClick={onNavigate} className={`block font-display leading-tight hover:text-gold-600 ${large ? 'text-2xl' : 'text-lg'}`}>
              {item.name}
            </Link>
            <p className="mt-1 flex items-center gap-2 text-xs text-taupe">
              <span className="h-3 w-3 rounded-full border border-linen" style={{ background: item.colorHex }} />
              {item.color} · Tam. {item.size}
            </p>
            {item.stock <= 3 && <p className="mt-1 text-[0.7rem] text-rose">Restam só {item.stock} unidades</p>}
          </div>
          <motion.button
            whileTap={{ scale: 0.85, rotate: -10 }}
            onClick={() => remove(item.key)}
            className="rounded-full p-2 text-taupe transition hover:bg-sand hover:text-rose"
            aria-label="Remover item"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.6} />
          </motion.button>
        </div>
        <div className="mt-auto flex items-end justify-between pt-3">
          <QtyStepper value={item.qty} max={item.stock} onChange={(n) => setQty(item.key, n)} />
          <div className="text-right">
            {item.qty > 1 && <p className="text-[0.7rem] text-taupe">{money(item.price)} cada</p>}
            <p className="font-medium">{money(item.price * item.qty)}</p>
          </div>
        </div>
      </div>
    </motion.li>
  )
}

export function FreeShippingBar({ subtotal }: { subtotal: number }) {
  const pct = Math.min(1, subtotal / FREE_SHIPPING_THRESHOLD)
  const missing = FREE_SHIPPING_THRESHOLD - subtotal
  return (
    <div className="rounded-2xl bg-sand/60 p-4">
      <p className="flex items-center gap-2 text-sm">
        <Truck className="h-4 w-4 text-gold-600" strokeWidth={1.6} />
        {missing > 0 ? (
          <span>
            Faltam <strong className="font-medium text-gold-700">{money(missing)}</strong> para o frete grátis
          </span>
        ) : (
          <span className="font-medium text-olive-600">Parabéns! Você ganhou frete grátis ✨</span>
        )}
      </p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-linen">
        <motion.div
          className="relative h-full overflow-hidden rounded-full bg-gradient-to-r from-gold-600 via-gold-300 to-gold-500"
          initial={false}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.8, ease: silk }}
        >
          <span className="absolute inset-0 animate-shimmer bg-[linear-gradient(90deg,transparent,rgba(255,255,255,.6),transparent)] bg-[length:200%_100%]" />
        </motion.div>
      </div>
    </div>
  )
}

export function CouponField() {
  const { items, coupon, setCoupon } = useCart()
  const { subtotal } = cartTotals(items, null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const controls = useAnimationControls()
  const belowMinimum = coupon && subtotal < coupon.min_subtotal

  if (coupon) {
    return (
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <div
          className={`flex items-center justify-between rounded-2xl border border-dashed px-4 py-3 ${
            belowMinimum ? 'border-rose/50 bg-rose/5' : 'border-olive-300 bg-olive-50'
          }`}
        >
          <span className="flex min-w-0 items-center gap-2 text-sm">
            <Tag className={`h-4 w-4 shrink-0 ${belowMinimum ? 'text-rose' : 'text-olive-600'}`} />
            <strong className="font-medium tracking-wider">{coupon.code}</strong>
            <span className={`truncate ${belowMinimum ? 'text-rose' : 'text-olive-600'}`}>· {couponLabel(coupon)}</span>
          </span>
          <button onClick={() => setCoupon(null)} className="rounded-full p-1 hover:bg-olive-100" aria-label="Remover cupom">
            <X className="h-4 w-4" />
          </button>
        </div>
        {belowMinimum && <p className="mt-1.5 text-xs text-rose">Válido para compras a partir de {money(coupon.min_subtotal)}.</p>}
      </motion.div>
    )
  }

  return (
    <div>
      <motion.form
        animate={controls}
        onSubmit={async (e) => {
          e.preventDefault()
          if (!code.trim()) return
          setLoading(true)
          setError(null)
          try {
            setCoupon(await validateCoupon(code, subtotal))
            setCode('')
          } catch (err) {
            setError(errorMessage(err))
            controls.start({ x: [0, -8, 8, -4, 4, 0], transition: { duration: 0.4 } })
          } finally {
            setLoading(false)
          }
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <Tag className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-taupe" />
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase())
              setError(null)
            }}
            placeholder="Cupom de desconto"
            className={`input py-3! pl-10! uppercase ${error ? 'border-rose!' : ''}`}
            aria-label="Cupom de desconto"
          />
        </div>
        <button className="btn btn-outline px-5! py-3!" disabled={!code || loading}>
          {loading ? <Spinner /> : 'Aplicar'}
        </button>
      </motion.form>
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-2 text-xs text-rose">
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Spinner({ className = 'h-4 w-4 border-2' }: { className?: string }) {
  return (
    <motion.span
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
      className={`block rounded-full border-current border-t-transparent ${className}`}
      aria-label="Carregando"
    />
  )
}
