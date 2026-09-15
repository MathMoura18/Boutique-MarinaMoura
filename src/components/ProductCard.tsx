import { Heart, Plus } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAddToCart } from '../hooks/useAddToCart'
import { silk } from '../lib/easing'
import { money } from '../lib/format'
import { colorsOf, discountPercent, imagesFor, isSoldOut, sizesOf, variantOf } from '../lib/product'
import { useUI } from '../store/ui'
import { useWishlist } from '../store/wishlist'
import type { Product } from '../types'
import { ProductImage } from './ProductImage'

export function WishButton({ product, className = 'relative' }: { product: Product; className?: string }) {
  const active = useWishlist((s) => s.ids.includes(product.id))
  const toggle = useWishlist((s) => s.toggle)
  const toast = useUI((s) => s.toast)
  return (
    <motion.button
      whileTap={{ scale: 0.8 }}
      onClick={(e: MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        const added = toggle(product.id)
        if (added) toast({ title: 'Salvo nos favoritos', description: product.name, tone: 'love' })
      }}
      aria-label={active ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      aria-pressed={active}
      className={`flex h-10 w-10 items-center justify-center rounded-full bg-ivory/90 shadow-sm transition hover:bg-ivory ${className}`}
    >
      <motion.span
        key={String(active)}
        initial={{ scale: active ? 0.2 : 1 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 12 }}
      >
        <Heart className={`h-[18px] w-[18px] ${active ? 'fill-rose text-rose' : 'text-espresso'}`} strokeWidth={1.6} />
      </motion.span>
      <AnimatePresence>
        {active && (
          <motion.span
            initial={{ scale: 0.6, opacity: 0.6 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 rounded-full border border-rose"
          />
        )}
      </AnimatePresence>
    </motion.button>
  )
}

export function ProductCard({ product, index = 0, priority = false }: { product: Product; index?: number; priority?: boolean }) {
  const [hover, setHover] = useState(false)
  const colors = colorsOf(product)
  const [colorName, setColorName] = useState(colors[0]?.name)
  const addToCart = useAddToCart()
  const images = imagesFor(product, colorName)
  const off = discountPercent(product)
  const soldOut = isSoldOut(product)
  const isNew = product.tags.includes('novo')
  const href = `/produto/${product.slug}`

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.6, delay: Math.min(index, 8) * 0.05, ease: silk }}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      className="group relative"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-[1.25rem] bg-sand transition-shadow duration-500 group-hover:shadow-lift">
        {/* foto principal e segunda foto no hover */}
        <motion.div animate={{ scale: hover ? 1.04 : 1 }} transition={{ duration: 1.1, ease: silk }} className="absolute inset-0">
          <ProductImage src={images[0]?.url} alt={images[0]?.alt ?? product.name} loading={priority ? 'eager' : 'lazy'} className="h-full w-full" />
          {images[1] && (
            <motion.div initial={false} animate={{ opacity: hover ? 1 : 0 }} transition={{ duration: 0.6, ease: silk }} className="absolute inset-0">
              <ProductImage src={images[1].url} alt={images[1].alt ?? product.name} className="h-full w-full" />
            </motion.div>
          )}
        </motion.div>

        <Link to={href} className="absolute inset-0 z-[1]" aria-label={product.name} />

        {/* gradiente sutil para legibilidade dos selos sobre a foto */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-20 bg-gradient-to-b from-espresso/15 to-transparent" />

        <div className="pointer-events-none absolute top-3 left-3 z-[2] flex flex-col items-start gap-1.5">
          {soldOut && <span className="rounded-full bg-espresso/85 px-3 py-1 text-[0.6rem] tracking-[0.2em] text-ivory uppercase">Esgotado</span>}
          {!soldOut && isNew && (
            <span className="rounded-full bg-ivory/95 px-3 py-1 text-[0.6rem] font-medium tracking-[0.2em] text-espresso uppercase">Novo</span>
          )}
          {!soldOut && off > 0 && <span className="rounded-full bg-gold-500 px-3 py-1 text-[0.62rem] font-medium text-ivory">-{off}%</span>}
        </div>

        <WishButton product={product} className="absolute top-3 right-3 z-10" />

        {/* compra rápida (desktop) */}
        <AnimatePresence>
          {hover && !soldOut && (
            <motion.div
              initial={{ y: '110%' }}
              animate={{ y: 0 }}
              exit={{ y: '110%' }}
              transition={{ duration: 0.45, ease: silk }}
              className="absolute inset-x-2.5 bottom-2.5 z-10 hidden rounded-2xl bg-ivory/95 p-3 shadow-soft md:block"
            >
              <p className="mb-2 flex items-center gap-1.5 text-[0.62rem] tracking-[0.2em] text-taupe uppercase">
                <Plus className="h-3 w-3" /> Compra rápida {colorName && <span className="normal-case tracking-normal">· {colorName}</span>}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {sizesOf(product).map((s) => {
                  const stock = colorName ? (variantOf(product, colorName, s)?.stock ?? 0) : 0
                  return (
                    <motion.button
                      key={s}
                      whileTap={stock ? { scale: 0.9 } : undefined}
                      disabled={!stock}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (colorName) addToCart(e, product, colorName, s)
                      }}
                      title={stock ? undefined : 'Esgotado'}
                      className="min-w-9 rounded-full border border-linen bg-ivory px-2.5 py-1.5 text-xs font-medium transition enabled:hover:border-espresso enabled:hover:bg-espresso enabled:hover:text-ivory disabled:text-taupe/50 disabled:line-through"
                    >
                      {s}
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-3.5 px-0.5">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[0.62rem] tracking-[0.22em] text-taupe uppercase">
            {product.category ?? product.section?.name}
          </p>
          {colors.length > 1 && (
            <div className="flex shrink-0 gap-1">
              {colors.slice(0, 5).map((c) => (
                <button
                  key={c.name}
                  onClick={() => setColorName(c.name)}
                  onMouseEnter={() => setColorName(c.name)}
                  aria-label={`Cor ${c.name}`}
                  title={c.name}
                  className={`h-3.5 w-3.5 rounded-full border transition ${
                    c.name === colorName ? 'scale-125 border-gold-500' : 'border-ivory shadow-[0_0_0_1px_rgba(0,0,0,0.1)]'
                  }`}
                  style={{ background: c.hex }}
                />
              ))}
            </div>
          )}
        </div>
        <Link to={href}>
          <h3 className="mt-1 truncate font-display text-[1.3rem] leading-tight transition-colors group-hover:text-gold-600">{product.name}</h3>
        </Link>
        <div className="mt-0.5 flex items-baseline gap-2">
          <span className={`font-medium ${off ? 'text-gold-700' : ''}`}>{money(product.price)}</span>
          {off > 0 && <span className="text-sm text-taupe line-through">{money(product.compare_at_price!)}</span>}
        </div>
        <p className="text-xs text-taupe">6x de {money(product.price / 6)} sem juros</p>
      </div>
    </motion.article>
  )
}

export function ProductCardSkeleton() {
  return (
    <div>
      <div className="relative aspect-[3/4] overflow-hidden rounded-[1.25rem] bg-sand">
        <span className="absolute inset-0 animate-shimmer bg-[linear-gradient(100deg,transparent_30%,rgba(255,251,246,.6)_50%,transparent_70%)] bg-[length:200%_100%]" />
      </div>
      <div className="mt-4 h-2.5 w-16 rounded-full bg-sand" />
      <div className="mt-2 h-4 w-3/4 rounded-full bg-sand" />
      <div className="mt-2 h-3 w-1/3 rounded-full bg-sand" />
    </div>
  )
}

export function ProductGrid({
  products,
  loading,
  skeletons = 8,
  className = 'grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-6 lg:grid-cols-4',
}: {
  products: Product[] | undefined
  loading?: boolean
  skeletons?: number
  className?: string
}) {
  if (loading)
    return (
      <div className={className}>
        {Array.from({ length: skeletons }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    )
  return (
    <motion.div layout className={className}>
      <AnimatePresence mode="popLayout">
        {products?.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} priority={i < 4} />
        ))}
      </AnimatePresence>
    </motion.div>
  )
}
