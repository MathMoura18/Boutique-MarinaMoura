import { ChevronDown, ChevronLeft, ChevronRight, Expand, Minus, Plus, RefreshCw, Ruler, ShieldCheck, ShoppingBag, Truck, X, Zap } from 'lucide-react'
import { AnimatePresence, motion, useAnimationControls } from 'motion/react'
import { useEffect, useState, type MouseEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Spinner } from '../components/CartBits'
import { PixIcon } from '../components/Icons'
import { PageTransition, Reveal } from '../components/motion'
import { ProductGrid, WishButton } from '../components/ProductCard'
import { ImagePlaceholder, ProductImage } from '../components/ProductImage'
import { useProduct, useProducts } from '../hooks/queries'
import { useAddToCart } from '../hooks/useAddToCart'
import { LOW_STOCK, PIX_DISCOUNT, shippingOptions } from '../lib/commerce'
import { silk } from '../lib/easing'
import { masks, money, onlyDigits } from '../lib/format'
import { colorsOf, discountPercent, imagesFor, sizesOf, stockOf, variantOf } from '../lib/product'
import type { Product, ProductImage as Img } from '../types'
import NotFound from './NotFound'

export default function ProductPage() {
  const { slug = '' } = useParams()
  const { data: product, isLoading } = useProduct(slug)
  if (isLoading) return <ProductSkeleton />
  if (!product || !product.active) return <NotFound />
  return <ProductView key={product.id} product={product} />
}

function ProductSkeleton() {
  return (
    <PageTransition>
      <div className="mx-auto grid max-w-7xl gap-10 px-6 pt-14 lg:grid-cols-[1.15fr_1fr] lg:px-8">
        <div className="aspect-[3/4] animate-pulse rounded-[1.75rem] bg-sand" />
        <div className="space-y-4 pt-4">
          <div className="h-3 w-24 rounded-full bg-sand" />
          <div className="h-12 w-3/4 rounded-full bg-sand" />
          <div className="h-8 w-32 rounded-full bg-sand" />
          <div className="h-24 w-full rounded-3xl bg-sand" />
        </div>
      </div>
    </PageTransition>
  )
}

function ProductView({ product }: { product: Product }) {
  const navigate = useNavigate()
  const addToCart = useAddToCart()
  const { data: allProducts = [] } = useProducts()
  const colors = colorsOf(product)
  const sizes = sizesOf(product)
  const [colorName, setColorName] = useState(colors.find((c) => stockOf(product, c.name) > 0)?.name ?? colors[0]?.name)
  const [size, setSize] = useState<string | null>(null)
  const [qty, setQty] = useState(1)
  const [guideOpen, setGuideOpen] = useState(false)
  const [sizeError, setSizeError] = useState(false)
  const shake = useAnimationControls()

  const images = imagesFor(product, colorName)
  const variant = colorName && size ? variantOf(product, colorName, size) : undefined
  const maxQty = Math.min(10, variant?.stock ?? 10)
  const off = discountPercent(product)
  const available = stockOf(product) > 0
  const related = allProducts.filter((p) => p.section_id === product.section_id && p.id !== product.id).slice(0, 4)

  const selectColor = (name: string) => {
    setColorName(name)
    if (size && (variantOf(product, name, size)?.stock ?? 0) === 0) setSize(null)
  }

  const requireSize = () => {
    if (variant && variant.stock > 0) return true
    setSizeError(true)
    shake.start({ x: [0, -10, 10, -6, 6, 0], transition: { duration: 0.45 } })
    return false
  }

  const onAdd = (e: MouseEvent) => {
    if (!requireSize() || !colorName || !size) return
    addToCart(e, product, colorName, size, qty)
  }

  const onBuyNow = () => {
    if (!requireSize() || !colorName || !size) return
    if (addToCart(null, product, colorName, size, qty)) navigate('/checkout')
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <nav className="flex flex-wrap items-center gap-2 text-xs tracking-wider text-taupe uppercase" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-gold-600">
            Início
          </Link>
          {product.section && (
            <>
              <span>/</span>
              <Link to={`/loja/${product.section.slug}`} className="hover:text-gold-600">
                {product.section.name}
              </Link>
            </>
          )}
          {product.category && product.section && (
            <>
              <span>/</span>
              <Link to={`/loja/${product.section.slug}?categoria=${encodeURIComponent(product.category)}`} className="hover:text-gold-600">
                {product.category}
              </Link>
            </>
          )}
        </nav>

        <div className="mt-5 grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
          <Gallery key={colorName} images={images} name={product.name}>
            <div className="pointer-events-none absolute top-4 left-4 z-10 flex gap-2">
              {!available && <span className="rounded-full bg-espresso/85 px-3 py-1 text-[0.65rem] tracking-[0.2em] text-ivory uppercase">Esgotado</span>}
              {product.tags.includes('novo') && <span className="rounded-full bg-ivory/95 px-3 py-1 text-[0.65rem] tracking-[0.2em] uppercase">Novo</span>}
              {off > 0 && <span className="rounded-full bg-gold-500 px-3 py-1 text-[0.65rem] text-ivory">-{off}%</span>}
            </div>
            <WishButton product={product} className="absolute top-4 right-4 z-10 h-11! w-11!" />
          </Gallery>

          {/* Informações */}
          <motion.div initial="h" animate="s" variants={{ s: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } } }} className="lg:sticky lg:top-24 lg:self-start lg:pt-2">
            <Item>
              <p className="eyebrow">
                {[product.section?.name, product.collection?.name].filter(Boolean).join(' · ')}
              </p>
            </Item>
            <Item>
              <h1 className="mt-3 text-5xl leading-[1.02] sm:text-6xl">{product.name}</h1>
            </Item>

            <Item className="mt-5 flex flex-wrap items-baseline gap-3">
              <span className="font-display text-4xl">{money(product.price)}</span>
              {off > 0 && <span className="text-lg text-taupe line-through">{money(product.compare_at_price!)}</span>}
            </Item>
            <Item className="mt-1 space-y-0.5 text-sm text-cocoa">
              <p className="flex items-center gap-1.5">
                <PixIcon className="h-3.5 w-3.5 text-olive-500" />
                <strong className="font-medium text-olive-600">{money(product.price * (1 - PIX_DISCOUNT))}</strong> no Pix (5% off)
              </p>
              <p>ou 6x de {money(product.price / 6)} sem juros</p>
            </Item>

            {product.description && (
              <Item className="mt-6 text-cocoa">
                <p className="leading-relaxed whitespace-pre-line">{product.description}</p>
              </Item>
            )}

            {colors.length > 0 && (
              <Item className="mt-8">
                <p className="text-sm">
                  <span className="text-taupe">Cor:</span> <span className="font-medium">{colorName}</span>
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {colors.map((c) => {
                    const soldOut = stockOf(product, c.name) === 0
                    return (
                      <motion.button
                        key={c.name}
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => selectColor(c.name)}
                        aria-label={`Cor ${c.name}${soldOut ? ' (esgotada)' : ''}`}
                        aria-pressed={c.name === colorName}
                        title={c.name}
                        className="relative flex h-12 w-12 items-center justify-center"
                      >
                        {c.name === colorName && (
                          <motion.span layoutId="color-ring" className="absolute inset-0 rounded-full border-2 border-gold-500" transition={{ type: 'spring', stiffness: 450, damping: 30 }} />
                        )}
                        <span className="relative h-9 w-9 overflow-hidden rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,.08)]" style={{ background: c.hex }}>
                          {soldOut && <span className="absolute top-1/2 left-1/2 h-px w-12 -translate-x-1/2 -rotate-45 bg-ivory" />}
                        </span>
                      </motion.button>
                    )
                  })}
                </div>
              </Item>
            )}

            {sizes.length > 0 && (
              <Item className="mt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm">
                    <span className="text-taupe">Tamanho:</span> <span className="font-medium">{size ?? 'Selecione'}</span>
                  </p>
                  <button onClick={() => setGuideOpen(true)} className="flex items-center gap-1.5 text-sm text-cocoa underline-offset-4 hover:text-gold-600 hover:underline">
                    <Ruler className="h-4 w-4" /> Guia de medidas
                  </button>
                </div>
                <motion.div animate={shake} className="mt-3 flex flex-wrap gap-2">
                  {sizes.map((s) => {
                    const stock = colorName ? (variantOf(product, colorName, s)?.stock ?? 0) : 0
                    return (
                      <motion.button
                        key={s}
                        whileTap={stock ? { scale: 0.92 } : undefined}
                        disabled={!stock}
                        onClick={() => {
                          setSize(s)
                          setSizeError(false)
                          setQty((q) => Math.min(q, stock))
                        }}
                        title={stock ? undefined : 'Esgotado nesta cor'}
                        className={`relative h-12 min-w-14 rounded-2xl border px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:border-dashed disabled:text-taupe/50 disabled:line-through ${
                          size === s ? 'border-espresso text-ivory' : sizeError ? 'border-rose/60 bg-ivory' : 'border-linen bg-ivory enabled:hover:border-gold-400'
                        }`}
                      >
                        {size === s && <motion.span layoutId="size-pill" className="absolute inset-0 rounded-2xl bg-espresso" transition={{ type: 'spring', stiffness: 450, damping: 32 }} />}
                        <span className="relative">{s}</span>
                      </motion.button>
                    )
                  })}
                </motion.div>
                <AnimatePresence mode="wait">
                  {sizeError ? (
                    <motion.p key="err" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-2 text-sm text-rose">
                      Escolha um tamanho disponível para continuar.
                    </motion.p>
                  ) : (
                    variant &&
                    variant.stock <= LOW_STOCK && (
                      <motion.p key="low" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-2 text-sm text-gold-700">
                        Últimas {variant.stock} {variant.stock === 1 ? 'unidade' : 'unidades'} neste tamanho!
                      </motion.p>
                    )
                  )}
                </AnimatePresence>
              </Item>
            )}

            <Item className="mt-8">
              {available ? (
                <div className="flex flex-wrap gap-3">
                  <div className="inline-flex h-14 items-center rounded-full border border-linen bg-ivory">
                    <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-14 w-12 items-center justify-center rounded-full hover:bg-sand" aria-label="Diminuir">
                      <Minus className="h-4 w-4" />
                    </button>
                    <motion.span key={qty} initial={{ scale: 0.6 }} animate={{ scale: 1 }} className="w-6 text-center font-medium tabular-nums">
                      {qty}
                    </motion.span>
                    <button
                      onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                      disabled={qty >= maxQty}
                      className="flex h-14 w-12 items-center justify-center rounded-full hover:bg-sand disabled:opacity-30"
                      aria-label="Aumentar"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={onAdd} className="btn btn-primary group h-14 flex-1">
                    <ShoppingBag className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                    Adicionar à sacola
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={onBuyNow} className="btn btn-gold h-14 w-full">
                    <Zap className="h-4 w-4" /> Comprar agora
                  </motion.button>
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-linen bg-ivory/60 p-5 text-center">
                  <p className="font-display text-2xl">Peça esgotada</p>
                  <p className="mt-1 text-sm text-taupe">Estamos repondo o estoque. Salve nos favoritos para acompanhar.</p>
                </div>
              )}
            </Item>

            <Item className="mt-8 grid grid-cols-3 gap-2 text-center text-xs text-cocoa">
              {[
                { icon: Truck, t: 'Envio em 24h' },
                { icon: RefreshCw, t: 'Troca grátis' },
                { icon: ShieldCheck, t: 'Compra segura' },
              ].map(({ icon: Icon, t }) => (
                <div key={t} className="rounded-2xl bg-ivory/70 px-2 py-3">
                  <Icon className="mx-auto mb-1 h-5 w-5 text-gold-600" strokeWidth={1.4} />
                  {t}
                </div>
              ))}
            </Item>

            <Item className="mt-6">
              <ShippingCalc subtotal={product.price * qty} />
            </Item>

            <Item className="mt-6 border-t border-linen">
              {product.details.length > 0 && (
                <Accordion title="Detalhes e composição" defaultOpen>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {product.details.map((d) => (
                      <li key={d} className="flex items-center gap-2 text-sm text-cocoa">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </Accordion>
              )}
              <Accordion title="Cuidados com a peça">
                <p className="text-sm text-cocoa">Lave do avesso em água fria, não use alvejante e seque à sombra. Para peças fitness, evite amaciante para preservar a tecnologia do tecido.</p>
              </Accordion>
              <Accordion title="Trocas e devoluções">
                <p className="text-sm text-cocoa">A primeira troca é grátis em até 30 dias após o recebimento. A peça deve estar sem uso e com etiqueta. Devolução integral em até 7 dias.</p>
              </Accordion>
            </Item>
          </motion.div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mx-auto mt-28 max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center">
            <p className="eyebrow">Combine com</p>
            <h2 className="mt-2 text-5xl">Complete o look</h2>
          </Reveal>
          <div className="mt-10">
            <ProductGrid products={related} />
          </div>
        </section>
      )}

      {/* Barra fixa mobile */}
      {available && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-linen bg-ivory/95 p-3 lg:hidden">
          <div className="flex items-center gap-3">
            <ProductImage src={images[0]?.url} alt="" placeholderLabel={false} className="h-12 w-10 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-lg leading-tight">{product.name}</p>
              <p className="text-sm text-cocoa">
                {money(product.price)} {size && <span className="text-taupe">· {size}</span>}
              </p>
            </div>
            <motion.button whileTap={{ scale: 0.95 }} onClick={onAdd} className="btn btn-primary px-5!">
              <ShoppingBag className="h-4 w-4" /> Adicionar
            </motion.button>
          </div>
        </div>
      )}

      <SizeGuide open={guideOpen} onClose={() => setGuideOpen(false)} numeric={/^\d+$/.test(sizes[0] ?? '')} />
    </PageTransition>
  )
}

/* ——————————————————— Galeria ——————————————————— */

function Gallery({ images, name, children }: { images: Img[]; name: string; children: ReactNode }) {
  const [index, setIndex] = useState(0)
  const [dir, setDir] = useState(1)
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null)
  const [lightbox, setLightbox] = useState(false)
  const total = images.length
  const current = images[index]

  const go = (i: number) => {
    if (!total) return
    setDir(i > index ? 1 : -1)
    setIndex((i + total) % total)
  }

  return (
    <div className="flex flex-col-reverse gap-3 lg:flex-row lg:self-start">
      {total > 1 && (
        <div className="no-scrollbar flex gap-2.5 overflow-x-auto lg:max-h-[78vh] lg:flex-col lg:overflow-y-auto">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => go(i)}
              className={`relative w-[4.5rem] shrink-0 overflow-hidden rounded-xl transition lg:w-20 ${index === i ? '' : 'opacity-55 hover:opacity-100'}`}
              aria-label={`Foto ${i + 1}`}
            >
              <ProductImage src={img.url} alt="" placeholderLabel={false} className="aspect-[3/4] w-full" />
              {index === i && <motion.span layoutId="thumb-ring" className="absolute inset-0 rounded-xl border-2 border-gold-500" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
            </button>
          ))}
        </div>
      )}

      <div
        className={`group relative aspect-[3/4] flex-1 overflow-hidden rounded-[1.75rem] bg-sand ${total ? 'cursor-zoom-in' : ''}`}
        onMouseMove={(e) => {
          if (!total || window.matchMedia('(pointer: coarse)').matches) return
          const r = e.currentTarget.getBoundingClientRect()
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 })
        }}
        onMouseLeave={() => setZoom(null)}
        onClick={() => total && setLightbox(true)}
      >
        {total === 0 ? (
          <ImagePlaceholder className="absolute inset-0" />
        ) : (
          <AnimatePresence initial={false} custom={dir}>
            <motion.div
              key={current.id}
              custom={dir}
              variants={{
                enter: (d: number) => ({ opacity: 0, x: d * 40 }),
                center: { opacity: 1, x: 0 },
                exit: (d: number) => ({ opacity: 0, x: d * -40 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.55, ease: silk }}
              drag={total > 1 ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.25}
              onDragEnd={(_, info) => {
                if (info.offset.x < -60) go(index + 1)
                if (info.offset.x > 60) go(index - 1)
              }}
              className="absolute inset-0"
            >
              <div
                className="h-full w-full transition-transform duration-300 ease-out"
                style={{ transform: zoom ? 'scale(1.8)' : 'scale(1)', transformOrigin: zoom ? `${zoom.x}% ${zoom.y}%` : 'center' }}
              >
                <ProductImage src={current.url} alt={current.alt ?? name} loading="eager" className="h-full w-full" />
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {children}

        {total > 1 && (
          <>
            {([-1, 1] as const).map((d) => (
              <button
                key={d}
                onClick={(e) => {
                  e.stopPropagation()
                  go(index + d)
                }}
                className={`absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-ivory/90 opacity-0 shadow-soft transition group-hover:opacity-100 sm:flex ${d === -1 ? 'left-4' : 'right-4'}`}
                aria-label={d === -1 ? 'Foto anterior' : 'Próxima foto'}
              >
                {d === -1 ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </button>
            ))}
            <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center gap-1.5">
              {images.map((img, i) => (
                <span key={img.id} className={`h-1.5 rounded-full transition-all ${index === i ? 'w-6 bg-ivory' : 'w-1.5 bg-ivory/60'}`} />
              ))}
            </div>
          </>
        )}
        {total > 0 && (
          <span className="pointer-events-none absolute right-4 bottom-4 z-10 hidden items-center gap-1.5 rounded-full bg-ivory/90 px-3 py-1.5 text-xs opacity-0 transition group-hover:opacity-100 sm:flex">
            <Expand className="h-3.5 w-3.5" /> Ampliar
          </span>
        )}
      </div>

      <Lightbox open={lightbox} images={images} index={index} onIndex={go} onClose={() => setLightbox(false)} name={name} />
    </div>
  )
}

function Lightbox({ open, images, index, onIndex, onClose, name }: { open: boolean; images: Img[]; index: number; onIndex: (i: number) => void; onClose: () => void; name: string }) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onIndex(index + 1)
      if (e.key === 'ArrowLeft') onIndex(index - 1)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', h)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', h)
    }
  }, [open, index, onIndex, onClose])

  return (
    <AnimatePresence>
      {open && images[index] && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-espresso/95 p-4" onClick={onClose}>
          <button className="absolute top-4 right-4 rounded-full bg-ivory/10 p-3 text-ivory hover:bg-ivory/20" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
          <AnimatePresence mode="wait">
            <motion.img
              key={images[index].id}
              src={images[index].url}
              alt={images[index].alt ?? name}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.35, ease: silk }}
              className="max-h-[88vh] max-w-full rounded-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </AnimatePresence>
          {images.length > 1 && (
            <>
              {([-1, 1] as const).map((d) => (
                <button
                  key={d}
                  onClick={(e) => {
                    e.stopPropagation()
                    onIndex(index + d)
                  }}
                  className={`absolute top-1/2 -translate-y-1/2 rounded-full bg-ivory/10 p-3 text-ivory hover:bg-ivory/20 ${d === -1 ? 'left-4' : 'right-4'}`}
                  aria-label={d === -1 ? 'Foto anterior' : 'Próxima foto'}
                >
                  {d === -1 ? <ChevronLeft className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
                </button>
              ))}
              <p className="absolute bottom-5 text-sm text-ivory/70">
                {index + 1} / {images.length}
              </p>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ——————————————————— Auxiliares ——————————————————— */

function Item({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={{ h: { opacity: 0, y: 18 }, s: { opacity: 1, y: 0, transition: { duration: 0.6, ease: silk } } }} className={className}>
      {children}
    </motion.div>
  )
}

function Accordion({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-linen">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between py-4 text-left" aria-expanded={open}>
        <span className="font-display text-xl">{title}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown className="h-5 w-5 text-taupe" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: silk }} className="overflow-hidden">
            <div className="pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ShippingCalc({ subtotal }: { subtotal: number }) {
  const [cep, setCep] = useState('')
  const [result, setResult] = useState<ReturnType<typeof shippingOptions> | null>(null)
  const [loading, setLoading] = useState(false)
  return (
    <div className="rounded-3xl border border-linen bg-ivory/60 p-5">
      <p className="flex items-center gap-2 text-sm font-medium">
        <Truck className="h-4 w-4 text-gold-600" strokeWidth={1.6} /> Calcule o frete e prazo
      </p>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (onlyDigits(cep).length !== 8) return
          setLoading(true)
          setResult(null)
          setTimeout(() => {
            setResult(shippingOptions(subtotal, onlyDigits(cep)))
            setLoading(false)
          }, 500)
        }}
      >
        <input value={cep} onChange={(e) => setCep(masks.cep(e.target.value))} placeholder="00000-000" inputMode="numeric" className="input py-2.5!" aria-label="CEP" />
        <button className="btn btn-outline px-5! py-2.5!" disabled={onlyDigits(cep).length !== 8}>
          {loading ? <Spinner /> : 'Calcular'}
        </button>
      </form>
      <AnimatePresence>
        {result && (
          <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            {result.map((o, i) => (
              <motion.li key={o.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="flex justify-between border-b border-linen/70 py-2.5 text-sm last:border-0">
                <span>
                  {o.label} <span className="text-taupe">· {o.eta}</span>
                </span>
                <span className={o.price === 0 ? 'font-medium text-olive-600' : ''}>{o.price === 0 ? 'Grátis' : money(o.price)}</span>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

function SizeGuide({ open, onClose, numeric }: { open: boolean; onClose: () => void; numeric: boolean }) {
  const rows = numeric
    ? [
        ['36', '64–67', '90–93'],
        ['38', '68–71', '94–97'],
        ['40', '72–75', '98–101'],
        ['42', '76–79', '102–105'],
        ['44', '80–84', '106–110'],
      ]
    : [
        ['PP', '80–84', '60–64', '86–90'],
        ['P', '85–89', '65–69', '91–95'],
        ['M', '90–94', '70–74', '96–100'],
        ['G', '95–100', '75–80', '101–106'],
        ['GG', '101–106', '81–86', '107–112'],
      ]
  const head = numeric ? ['Tamanho', 'Cintura (cm)', 'Quadril (cm)'] : ['Tamanho', 'Busto (cm)', 'Cintura (cm)', 'Quadril (cm)']
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[85] flex items-end justify-center sm:items-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-espresso/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative w-full max-w-lg rounded-t-[2rem] bg-cream p-6 sm:rounded-[2rem] sm:p-8"
            role="dialog"
            aria-label="Guia de medidas"
          >
            <button onClick={onClose} className="absolute top-4 right-4 rounded-full p-2 hover:bg-sand" aria-label="Fechar">
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-4xl">Guia de medidas</h3>
            <p className="mt-2 text-sm text-taupe">Meça o corpo com fita métrica, sem apertar. Em caso de dúvida, escolha o maior tamanho.</p>
            <div className="mt-6 overflow-x-auto rounded-2xl border border-linen">
              <table className="w-full text-sm">
                <thead className="bg-sand/70">
                  <tr>
                    {head.map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r[0]} className="border-t border-linen bg-ivory">
                      {r.map((c, j) => (
                        <td key={j} className={`px-4 py-3 ${j === 0 ? 'font-medium' : 'text-cocoa'}`}>
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
