import { ArrowLeft, ArrowRight, Lock } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Link, useNavigate } from 'react-router-dom'
import { Dragonfly } from '../components/Brand'
import { CartLine, CouponField, FreeShippingBar } from '../components/CartBits'
import { PixIcon } from '../components/Icons'
import { PageTransition, Reveal } from '../components/motion'
import { ProductGrid } from '../components/ProductCard'
import { useProducts } from '../hooks/queries'
import { PIX_DISCOUNT } from '../lib/commerce'
import { money } from '../lib/format'
import { cartTotals, useCart } from '../store/cart'

export default function Cart() {
  const { items, coupon } = useCart()
  const navigate = useNavigate()
  const { subtotal, count, discount } = cartTotals(items, coupon)
  const total = subtotal - discount
  const inCart = new Set(items.map((i) => i.productId))
  const { data: products = [] } = useProducts()
  const suggestions = products.filter((p) => !inCart.has(p.id) && p.images.length > 0).slice(0, 4)

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-6 pt-10 lg:px-8">
        <Link to="/loja" className="inline-flex items-center gap-2 text-sm text-cocoa hover:text-gold-600">
          <ArrowLeft className="h-4 w-4" /> Continuar comprando
        </Link>
        <div className="mt-4 flex items-end gap-4">
          <h1 className="text-6xl">Sacola</h1>
          <span className="mb-2 text-sm tracking-[0.2em] text-taupe uppercase">
            {count} {count === 1 ? 'item' : 'itens'}
          </span>
        </div>

        {items.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card mt-10 flex flex-col items-center px-6 py-20 text-center">
            <motion.div animate={{ y: [0, -12, 0], rotate: [0, 6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
              <Dragonfly className="h-32 w-32" />
            </motion.div>
            <h2 className="mt-4 text-4xl">Sua sacola está vazia</h2>
            <p className="mt-2 max-w-sm text-taupe">Explore nossas coleções e encontre peças que traduzem a sua essência.</p>
            <div className="mt-8 flex gap-3">
              <Link to="/loja/casual" className="btn btn-outline">
                Ver Casual
              </Link>
              <Link to="/loja/fitness" className="btn btn-primary">
                Ver Fitness
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_400px]">
            <div>
              <FreeShippingBar subtotal={total} />
              <ul className="mt-4 divide-y divide-linen">
                <AnimatePresence initial={false}>
                  {items.map((item) => (
                    <CartLine key={item.key} item={item} large />
                  ))}
                </AnimatePresence>
              </ul>
            </div>

            <motion.aside initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:sticky lg:top-24 lg:self-start">
              <div className="card space-y-5 p-6">
                <h2 className="text-3xl">Resumo</h2>
                <CouponField />
                <dl className="space-y-3 border-t border-linen pt-5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-taupe">Subtotal</dt>
                    <dd>{money(subtotal)}</dd>
                  </div>
                  <AnimatePresence>
                    {discount > 0 && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex justify-between text-olive-600">
                        <dt>Desconto</dt>
                        <dd>- {money(discount)}</dd>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="flex justify-between">
                    <dt className="text-taupe">Frete</dt>
                    <dd className="text-taupe">Calculado no checkout</dd>
                  </div>
                </dl>
                <div className="flex items-baseline justify-between border-t border-linen pt-5">
                  <span>Total</span>
                  <motion.span key={total} initial={{ opacity: 0.3, y: -4 }} animate={{ opacity: 1, y: 0 }} className="font-display text-4xl">
                    {money(total)}
                  </motion.span>
                </div>
                <div className="space-y-1 rounded-2xl bg-sand/50 p-3 text-xs text-cocoa">
                  <p className="flex items-center gap-1.5">
                    <PixIcon className="h-3.5 w-3.5 text-olive-500" /> {money(total * (1 - PIX_DISCOUNT))} no Pix
                  </p>
                  <p>ou até 6x de {money(total / 6)} sem juros</p>
                </div>
                <motion.button whileTap={{ scale: 0.98 }} onClick={() => navigate('/checkout')} className="btn btn-gold group w-full py-4">
                  Finalizar compra <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </motion.button>
                <p className="flex items-center justify-center gap-1.5 text-xs text-taupe">
                  <Lock className="h-3.5 w-3.5" /> Pagamento 100% seguro
                </p>
              </div>
            </motion.aside>
          </div>
        )}

        {suggestions.length > 0 && (
          <section className="mt-24">
            <Reveal>
              <p className="eyebrow">Você também vai amar</p>
              <h2 className="mt-2 text-4xl">Queridinhos da boutique</h2>
            </Reveal>
            <div className="mt-8">
              <ProductGrid products={suggestions} />
            </div>
          </section>
        )}
      </div>
    </PageTransition>
  )
}
