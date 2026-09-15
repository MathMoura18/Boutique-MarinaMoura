import { ArrowRight, Check, Heart, Search, ShoppingBag, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useProducts } from '../hooks/queries'
import { normalizeText } from '../lib/commerce'
import { colorsOf, coverOf } from '../lib/product'
import { money } from '../lib/format'
import { cartTotals, useCart } from '../store/cart'
import { useUI, type Flyer } from '../store/ui'
import { Dragonfly } from './Brand'
import { CartLine, FreeShippingBar } from './CartBits'
import { silk } from '../lib/easing'
import { ProductImage } from './ProductImage'

function useLockScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [locked])
}

function useEscape(active: boolean, fn: () => void) {
  useEffect(() => {
    if (!active) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && fn()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [active, fn])
}

export function CartDrawer() {
  const { cartOpen, setCartOpen } = useUI()
  const { items, coupon } = useCart()
  const { subtotal, count, discount } = cartTotals(items, coupon)
  const navigate = useNavigate()
  const close = () => setCartOpen(false)
  useLockScroll(cartOpen)
  useEscape(cartOpen, close)

  return (
    <AnimatePresence>
      {cartOpen && (
        <div className="fixed inset-0 z-[80]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-espresso/35 backdrop-blur-[3px]"
            onClick={close}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 32 }}
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-cream shadow-lift"
            role="dialog"
            aria-label="Sacola de compras"
          >
            <div className="flex items-center justify-between border-b border-linen px-6 py-5">
              <div>
                <h2 className="text-3xl">Sua sacola</h2>
                <p className="text-xs tracking-[0.2em] text-taupe uppercase">
                  {count} {count === 1 ? 'item' : 'itens'}
                </p>
              </div>
              <motion.button whileHover={{ rotate: 90 }} onClick={close} className="rounded-full p-2 hover:bg-sand" aria-label="Fechar sacola">
                <X className="h-5 w-5" />
              </motion.button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
                  <Dragonfly className="h-28 w-28" />
                </motion.div>
                <h3 className="mt-4 text-3xl">Sua sacola está vazia</h3>
                <p className="mt-2 text-sm text-taupe">Que tal descobrir peças que combinam com a sua essência?</p>
                <div className="mt-6 flex gap-3">
                  <Link to="/loja/casual" onClick={close} className="btn btn-outline">
                    Casual
                  </Link>
                  <Link to="/loja/fitness" onClick={close} className="btn btn-primary">
                    Fitness
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="px-6 pt-4">
                  <FreeShippingBar subtotal={subtotal - discount} />
                </div>
                <ul className="flex-1 divide-y divide-linen overflow-y-auto px-6">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <CartLine key={item.key} item={item} onNavigate={close} />
                    ))}
                  </AnimatePresence>
                </ul>
                <div className="space-y-3 border-t border-linen bg-ivory/60 px-6 py-5">
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-olive-600">
                      <span>Cupom {coupon?.code}</span>
                      <span>- {money(discount)}</span>
                    </div>
                  )}
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-taupe">Subtotal</span>
                    <span className="font-display text-3xl">{money(subtotal - discount)}</span>
                  </div>
                  <p className="text-xs text-taupe">ou {money((subtotal - discount) * 0.95)} no Pix · frete calculado no checkout</p>
                  <button
                    onClick={() => {
                      close()
                      navigate('/checkout')
                    }}
                    className="btn btn-gold group w-full py-4"
                  >
                    Finalizar compra
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                  <Link to="/carrinho" onClick={close} className="block text-center text-sm text-cocoa underline-offset-4 hover:underline">
                    Ver sacola completa
                  </Link>
                </div>
              </>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  )
}

export function SearchOverlay() {
  const { searchOpen, setSearchOpen } = useUI()
  const [q, setQ] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const close = () => {
    setSearchOpen(false)
    setQ('')
  }
  useLockScroll(searchOpen)
  useEscape(searchOpen, close)

  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 150)
  }, [searchOpen])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [setSearchOpen])

  const { data: products = [] } = useProducts()
  const results = useMemo(() => {
    const n = normalizeText(q.trim())
    if (!n) return []
    return products.filter((p) =>
      normalizeText(`${p.name} ${p.category ?? ''} ${p.section?.name ?? ''} ${p.collection?.name ?? ''} ${colorsOf(p).map((c) => c.name).join(' ')}`).includes(n),
    )
  }, [q, products])

  const suggestions = [...new Set(products.map((p) => p.category).filter((c): c is string => !!c))].slice(0, 8)

  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div className="fixed inset-0 z-[85]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-espresso/30 backdrop-blur-md" onClick={close} />
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ duration: 0.45, ease: silk }}
            className="relative mx-auto mt-4 max-w-3xl rounded-[2rem] bg-cream p-4 shadow-lift sm:mt-16 sm:p-6"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (results[0]) {
                  navigate(`/produto/${results[0].slug}`)
                  close()
                }
              }}
              className="flex items-center gap-3 border-b border-linen pb-4"
            >
              <Search className="h-6 w-6 text-gold-600" strokeWidth={1.5} />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="O que você procura hoje?"
                className="flex-1 bg-transparent font-display text-2xl placeholder:text-taupe/50 focus:outline-none sm:text-3xl"
              />
              <kbd className="hidden rounded-md border border-linen px-2 py-1 text-[0.65rem] text-taupe sm:block">ESC</kbd>
              <button type="button" onClick={close} className="rounded-full p-2 hover:bg-sand" aria-label="Fechar busca">
                <X className="h-5 w-5" />
              </button>
            </form>

            {!q && suggestions.length > 0 && (
              <div className="pt-5">
                <p className="eyebrow">Buscas populares</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {suggestions.map((s, i) => (
                    <motion.button
                      key={s}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.04 }}
                      onClick={() => setQ(s)}
                      className="rounded-full border border-linen bg-ivory px-4 py-2 text-sm transition hover:border-gold-400 hover:text-gold-700"
                    >
                      {s}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {q && (
              <div className="max-h-[60vh] overflow-y-auto pt-4">
                {results.length === 0 ? (
                  <p className="py-10 text-center text-taupe">Nenhuma peça encontrada para “{q}”.</p>
                ) : (
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {results.map((p, i) => (
                      <motion.li key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                        <Link to={`/produto/${p.slug}`} onClick={close} className="flex items-center gap-4 rounded-2xl p-2 transition hover:bg-ivory">
                          <ProductImage src={coverOf(p)} alt={p.name} placeholderLabel={false} className="h-20 w-16 shrink-0 rounded-xl" />
                          <div className="min-w-0">
                            <p className="text-[0.65rem] tracking-[0.2em] text-taupe uppercase">
                              {p.section?.name} {p.category && `· ${p.category}`}
                            </p>
                            <p className="truncate font-display text-xl">{p.name}</p>
                            <p className="text-sm">{money(p.price)}</p>
                          </div>
                        </Link>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Toaster() {
  const { toasts, dismissToast } = useUI()
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[90] flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={() => dismissToast(t.id)}
            className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl bg-espresso px-4 py-3 text-ivory shadow-lift"
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                t.tone === 'love' ? 'bg-rose' : 'bg-gold-500'
              }`}
            >
              {t.tone === 'love' ? (
                <Heart className="h-4 w-4 fill-ivory" />
              ) : t.tone === 'success' ? (
                <Check className="h-4 w-4" />
              ) : (
                <ShoppingBag className="h-4 w-4" />
              )}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium">{t.title}</p>
              {t.description && <p className="truncate text-xs text-ivory/70">{t.description}</p>}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

/** Bolinha que "voa" do botão até a sacola */
export function Flyers() {
  const { flyers, landFlyer } = useUI()
  return (
    <div className="pointer-events-none fixed inset-0 z-[95]">
      {flyers.map((f) => (
        <FlyerDot key={f.id} flyer={f} onDone={() => landFlyer(f.id)} />
      ))}
    </div>
  )
}

function FlyerDot({ flyer, onDone }: { flyer: Flyer; onDone: () => void }) {
  const target = document.getElementById('cart-target')?.getBoundingClientRect()
  const tx = target ? target.left + target.width / 2 : window.innerWidth - 40
  const ty = target ? target.top + target.height / 2 : 40
  const dx = tx - flyer.from.x
  const dy = ty - flyer.from.y
  return (
    <motion.span
      initial={{ x: flyer.from.x - 12, y: flyer.from.y - 12, scale: 1, opacity: 1 }}
      animate={{
        x: [flyer.from.x - 12, flyer.from.x + dx * 0.4 - 12, tx - 12],
        y: [flyer.from.y - 12, flyer.from.y + dy * 0.4 - 120, ty - 12],
        scale: [1, 1.3, 0.3],
        opacity: [1, 1, 0.6],
      }}
      transition={{ duration: 0.85, ease: [0.5, 0, 0.3, 1] }}
      onAnimationComplete={onDone}
      className="absolute top-0 left-0 h-6 w-6 overflow-hidden rounded-full border-2 border-ivory bg-cover bg-center shadow-gold"
      style={{ backgroundColor: flyer.color, backgroundImage: flyer.image ? `url("${flyer.image}")` : undefined }}
    />
  )
}
