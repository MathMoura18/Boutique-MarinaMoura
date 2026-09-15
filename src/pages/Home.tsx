import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Copy, Quote, Sparkles, Star } from 'lucide-react'
import { AnimatePresence, motion, type MotionValue, useMotionValue, useScroll, useSpring, useTransform } from 'motion/react'
import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { Blossom, Dragonfly } from '../components/Brand'
import { CollectionTile } from '../components/CollectionTile'
import { Marquee, PageTransition, Reveal, SplitText } from '../components/motion'
import { ProductCard, ProductCardSkeleton, ProductGrid } from '../components/ProductCard'
import { ProductImage } from '../components/ProductImage'
import { useCollections, useProducts, useSections } from '../hooks/queries'
import { silk } from '../lib/easing'
import { money } from '../lib/format'
import { coverOf } from '../lib/product'
import { useUI } from '../store/ui'
import type { Collection, Product, Section } from '../types'

export default function Home() {
  return (
    <PageTransition>
      <Hero />
      <div className="border-y border-linen bg-ivory py-4 font-display text-xl text-cocoa italic">
        <Marquee items={['Nova coleção', 'Tecidos nobres', 'Performance e conforto', 'Frete grátis acima de R$ 299', '5% off no Pix']} />
      </div>
      <SectionsShowcase />
      <CollectionsShowcase />
      <NewArrivals />
      <BrandStory />
      <BestSellers />
      <Testimonials />
      <Newsletter />
    </PageTransition>
  )
}

const withPhotos = (list: Product[]) => list.filter((p) => p.images.length > 0)

/* ——————————————————— HERO ——————————————————— */

function useParallax(sx: MotionValue<number>, sy: MotionValue<number>, depth: number) {
  return { x: useTransform(sx, (v) => v * depth), y: useTransform(sy, (v) => v * depth) }
}

function Hero() {
  const ref = useRef<HTMLElement>(null)
  const { data: products = [] } = useProducts()
  const [idx, setIdx] = useState(0)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 60, damping: 20 })
  const sy = useSpring(my, { stiffness: 60, damping: 20 })
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const yArt = useTransform(scrollYProgress, [0, 1], [0, 120])
  const yText = useTransform(scrollYProgress, [0, 1], [0, 60])
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const l1 = useParallax(sx, sy, 14)
  const l2 = useParallax(sx, sy, -22)
  const l3 = useParallax(sx, sy, 34)

  const photos = withPhotos(products)
  const featured = photos.filter((p) => p.tags.includes('destaque'))
  const pieces = (featured.length >= 2 ? featured : photos).slice(0, 6)
  const piece = pieces.length ? pieces[idx % pieces.length] : null
  const next = pieces.length > 1 ? pieces[(idx + 1) % pieces.length] : null

  useEffect(() => {
    if (pieces.length < 2) return
    const t = setInterval(() => setIdx((i) => i + 1), 4200)
    return () => clearInterval(t)
  }, [pieces.length])

  const onMove = (e: MouseEvent) => {
    const r = ref.current!.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }

  return (
    <section ref={ref} onMouseMove={onMove} className="paper-grain relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-gold-100/50 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-[420px] w-[420px] rounded-full bg-olive-100/60 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 pt-10 pb-20 lg:min-h-[calc(100vh-114px)] lg:grid-cols-[1fr_1fr] lg:px-8 lg:pb-10">
        <motion.div style={{ y: yText, opacity: fade }} className="relative z-10 text-center lg:text-left">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="eyebrow inline-flex items-center gap-2 rounded-full border border-gold-200 bg-ivory/70 px-4 py-2"
          >
            <Sparkles className="h-3.5 w-3.5" /> Nova coleção
          </motion.p>
          <h1 className="mt-6 text-[3.2rem] leading-[0.95] sm:text-7xl xl:text-[5.6rem]">
            <SplitText text="Sua essência," delay={0.25} />
            <br />
            <span className="text-gold-gradient italic">
              <SplitText text="seu estilo." delay={0.5} />
            </span>
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8, ease: silk }}
            className="mx-auto mt-6 max-w-md text-lg text-cocoa lg:mx-0"
          >
            Peças escolhidas com delicadeza para vestir quem você é — da leveza do casual à força do fitness.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8, ease: silk }}
            className="mt-9 flex flex-wrap justify-center gap-3 lg:justify-start"
          >
            <Link to="/loja" className="btn btn-primary group">
              Comprar agora
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/colecoes" className="btn btn-outline group">
              Ver coleções
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:rotate-45" />
            </Link>
          </motion.div>
          <motion.dl
            initial="h"
            animate="s"
            variants={{ s: { transition: { staggerChildren: 0.1, delayChildren: 1.2 } } }}
            className="mt-12 flex justify-center gap-6 sm:gap-10 lg:justify-start"
          >
            {[
              ['6x', 'sem juros'],
              ['5%', 'off no Pix'],
              ['30 dias', 'para trocar'],
            ].map(([n, l]) => (
              <motion.div key={l} variants={{ h: { opacity: 0, y: 10 }, s: { opacity: 1, y: 0 } }}>
                <dt className="font-display text-2xl whitespace-nowrap sm:text-3xl">{n}</dt>
                <dd className="text-xs tracking-wider text-taupe uppercase">{l}</dd>
              </motion.div>
            ))}
          </motion.dl>
        </motion.div>

        {/* Composição editorial com fotos */}
        <motion.div style={{ y: yArt }} className="relative mx-auto aspect-[4/5] w-full max-w-[500px]">
          <motion.svg style={l2} viewBox="0 0 400 500" className="absolute inset-0 h-full w-full" aria-hidden>
            <motion.circle
              cx="200"
              cy="250"
              r="196"
              fill="none"
              stroke="#C49A4E"
              strokeWidth="1"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2.2, ease: silk }}
            />
            <motion.circle cx="4" cy="250" r="4" fill="#C49A4E" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.8 }} />
            <motion.circle cx="396" cy="250" r="4" fill="#C49A4E" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 2 }} />
          </motion.svg>

          <motion.div
            style={l1}
            initial={{ clipPath: 'inset(100% 0% 0% 0% round 999px 999px 28px 28px)' }}
            animate={{ clipPath: 'inset(0% 0% 0% 0% round 999px 999px 28px 28px)' }}
            transition={{ duration: 1.4, delay: 0.3, ease: silk }}
            className="absolute inset-y-[6%] right-[6%] left-[14%] overflow-hidden rounded-t-full rounded-b-[1.75rem] bg-sand shadow-lift"
          >
            <AnimatePresence initial={false}>
              {piece ? (
                <motion.div
                  key={`${piece.id}-${idx}`}
                  initial={{ opacity: 0, scale: 1.12 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.4, ease: silk }}
                  className="absolute inset-0"
                >
                  <ProductImage src={coverOf(piece)} alt={piece.name} loading="eager" className="h-full w-full" />
                </motion.div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gold-50 via-sand to-linen">
                  <Blossom className="w-3/4" />
                </div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* segunda foto sobreposta */}
          {next && (
            <motion.div
              style={l3}
              initial={{ opacity: 0, y: 40, rotate: -8 }}
              animate={{ opacity: 1, y: 0, rotate: -6 }}
              transition={{ delay: 1.1, duration: 1, ease: silk }}
              className="absolute bottom-[10%] -left-2 hidden w-[34%] overflow-hidden rounded-2xl border-4 border-ivory shadow-lift sm:block"
            >
              <AnimatePresence initial={false} mode="popLayout">
                <motion.div key={next.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }}>
                  <ProductImage src={coverOf(next)} alt={next.name} className="aspect-[3/4] w-full" />
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}

          <motion.div style={l3} className="absolute top-[1%] right-[2%] w-24 sm:w-28">
            <motion.div
              initial={{ opacity: 0, x: 80, y: -40 }}
              animate={{ opacity: 1, x: [0, -14, 6, 0], y: [0, 10, -8, 0], rotate: [18, 10, 22, 18] }}
              transition={{ opacity: { delay: 1.2, duration: 0.8 }, default: { duration: 7, repeat: Infinity, ease: 'easeInOut' } }}
            >
              <Dragonfly className="h-full w-full drop-shadow-[0_8px_12px_rgba(184,137,59,0.35)]" />
            </motion.div>
          </motion.div>

          {piece && (
            <motion.div
              style={l2}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.5, duration: 0.8, ease: silk }}
              className="absolute right-0 bottom-[4%] sm:-right-4"
            >
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
                <Link to={`/produto/${piece.slug}`} className="flex items-center gap-3 rounded-2xl bg-ivory/95 py-2.5 pr-5 pl-2.5 shadow-lift transition hover:-translate-y-0.5">
                  <ProductImage src={coverOf(piece)} alt="" placeholderLabel={false} className="h-14 w-11 shrink-0 rounded-lg" />
                  <AnimatePresence mode="wait">
                    <motion.span key={piece.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="block">
                      <span className="block text-[0.6rem] tracking-[0.2em] text-taupe uppercase">{piece.section?.name}</span>
                      <span className="block max-w-[10rem] truncate font-display text-lg leading-tight">{piece.name}</span>
                      <span className="block text-sm text-gold-700">{money(piece.price)}</span>
                    </motion.span>
                  </AnimatePresence>
                </Link>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  )
}

/* ——————————————————— SEÇÕES ——————————————————— */

function SectionsShowcase() {
  const { data: sections = [], isLoading } = useSections()
  const { data: products = [] } = useProducts()
  const [active, setActive] = useState<string | null>(null)
  const list = sections.slice(0, 3)

  if (!isLoading && list.length === 0) return null

  return (
    <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">{list.length > 1 ? `${list.length} essências` : 'Nossa essência'}</p>
        <h2 className="mt-3 text-5xl sm:text-6xl">
          <SplitText text="Escolha o seu momento" />
        </h2>
      </Reveal>
      <div className="mt-14 flex flex-col gap-5 lg:h-[640px] lg:flex-row" onMouseLeave={() => setActive(null)}>
        {isLoading
          ? [0, 1].map((i) => <div key={i} className="min-h-[520px] flex-1 animate-pulse rounded-[2.25rem] bg-sand" />)
          : list.map((s, i) => (
              <SectionCard
                key={s.id}
                section={s}
                index={i}
                products={withPhotos(products.filter((p) => p.section_id === s.id))}
                count={products.filter((p) => p.section_id === s.id).length}
                grow={active === null ? 1 : active === s.id ? 1.45 : 0.8}
                expanded={active === s.id}
                onHover={() => setActive(s.id)}
              />
            ))}
      </div>
    </section>
  )
}

function SectionCard({
  section,
  index,
  products,
  count,
  grow,
  expanded,
  onHover,
}: {
  section: Section
  index: number
  products: Product[]
  count: number
  grow: number
  expanded: boolean
  onHover: () => void
}) {
  const trio = products.slice(0, 3)
  const hasCover = !!section.cover_url
  const dark = hasCover || trio.length > 0

  return (
    <motion.div
      onMouseEnter={onHover}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      animate={{ flexGrow: grow }}
      transition={{ duration: 0.8, delay: index * 0.12, ease: silk, flexGrow: { duration: 0.7, ease: silk } }}
      style={{ flexBasis: 0 }}
      className="group relative min-h-[520px] overflow-hidden rounded-[2.25rem] bg-gradient-to-br from-gold-50 via-sand to-linen"
    >
      <Link to={`/loja/${section.slug}`} className="absolute inset-0 z-20" aria-label={`Ver ${section.name}`} />

      {hasCover ? (
        <motion.div animate={{ scale: expanded ? 1.06 : 1 }} transition={{ duration: 1.2, ease: silk }} className="absolute inset-0">
          <ProductImage src={section.cover_url} alt={section.name} className="h-full w-full" />
        </motion.div>
      ) : (
        trio.length > 0 && (
          <div className="absolute inset-0 grid grid-cols-3 gap-1">
            {trio.map((p, i) => (
              <motion.div
                key={p.id}
                animate={{ scale: expanded ? 1.05 : 1 }}
                transition={{ duration: 1.1, delay: i * 0.05, ease: silk }}
                className={`overflow-hidden ${trio.length === 1 ? 'col-span-3' : trio.length === 2 && i === 1 ? 'col-span-2' : ''}`}
              >
                <ProductImage src={coverOf(p)} alt={p.name} className="h-full w-full" />
              </motion.div>
            ))}
          </div>
        )
      )}

      {dark && <div className="absolute inset-0 bg-gradient-to-t from-espresso/80 via-espresso/20 to-espresso/10" />}

      <div className={`relative z-10 flex h-full flex-col justify-between p-8 sm:p-10 ${dark ? 'text-ivory' : ''}`}>
        <div className="flex items-start justify-end">
          <motion.span
            animate={{ rotate: expanded ? 45 : 0 }}
            className={`flex h-14 w-14 items-center justify-center rounded-full ${dark ? 'bg-ivory text-espresso' : 'bg-espresso text-ivory'}`}
          >
            <ArrowUpRight className="h-6 w-6" />
          </motion.span>
        </div>
        <div>
          {section.tagline && <p className={`eyebrow ${dark ? 'text-gold-200!' : ''}`}>{section.tagline}</p>}
          <h3 className="mt-2 text-6xl sm:text-7xl">{section.name}</h3>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            {section.description && <p className={`max-w-sm ${dark ? 'text-ivory/80' : 'text-cocoa'}`}>{section.description}</p>}
            <span className={`rounded-full px-4 py-2 text-xs tracking-[0.2em] uppercase ${dark ? 'bg-ivory/15 backdrop-blur' : 'bg-ivory/80'}`}>
              {count} {count === 1 ? 'peça' : 'peças'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ——————————————————— COLEÇÕES ——————————————————— */

function CollectionsShowcase() {
  const { data: collections = [] } = useCollections()
  const { data: products = [] } = useProducts()
  if (collections.length === 0) return null
  const [first, ...rest] = collections.slice(0, 3)

  const coverFor = (c: Collection) => c.cover_url ?? coverOf(withPhotos(products).find((p) => p.collection_id === c.id) ?? { images: [] })

  return (
    <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
      <Reveal className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Editorial</p>
          <h2 className="mt-2 text-5xl">Coleções</h2>
        </div>
        <Link to="/colecoes" className="group inline-flex items-center gap-2 text-sm font-medium text-cocoa hover:text-gold-700">
          Ver todas <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </Reveal>
      <div className={`mt-10 grid gap-5 ${rest.length ? 'lg:grid-cols-[1.4fr_1fr]' : ''}`}>
        <CollectionTile collection={first} cover={coverFor(first)} large />
        {rest.length > 0 && (
          <div className="grid gap-5">
            {rest.map((c) => (
              <CollectionTile key={c.id} collection={c} cover={coverFor(c)} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

/* ——————————————————— NOVIDADES ——————————————————— */

function NewArrivals() {
  const { data: products = [], isLoading } = useProducts()
  const { data: sections = [] } = useSections()
  const [tab, setTab] = useState('all')
  const tabs = [{ id: 'all', label: 'Todas' }, ...sections.map((s) => ({ id: s.id, label: s.name }))]
  const list = products.filter((p) => tab === 'all' || p.section_id === tab).slice(0, 8)

  return (
    <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
      <Reveal className="flex flex-col items-center justify-between gap-6 sm:flex-row sm:items-end">
        <div className="text-center sm:text-left">
          <p className="eyebrow">Acabou de chegar</p>
          <h2 className="mt-2 text-5xl">Novidades</h2>
        </div>
        {tabs.length > 2 && (
          <div className="no-scrollbar flex max-w-full overflow-x-auto rounded-full border border-linen bg-ivory p-1">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className="relative shrink-0 rounded-full px-5 py-2 text-sm">
                {tab === t.id && (
                  <motion.span layoutId="arrivals-tab" className="absolute inset-0 rounded-full bg-espresso" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />
                )}
                <span className={`relative transition-colors ${tab === t.id ? 'text-ivory' : 'text-cocoa'}`}>{t.label}</span>
              </button>
            ))}
          </div>
        )}
      </Reveal>
      <div className="mt-10">
        <ProductGrid products={list} loading={isLoading} />
        {!isLoading && list.length === 0 && <p className="py-10 text-center text-taupe">Novas peças chegando em breve.</p>}
      </div>
      <div className="mt-12 text-center">
        <Link to="/loja" className="btn btn-outline group">
          Ver toda a loja <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  )
}

/* ——————————————————— HISTÓRIA ——————————————————— */

function BrandStory() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const x = useTransform(scrollYProgress, [0, 1], ['-20%', '30%'])
  const y = useTransform(scrollYProgress, [0, 1], [80, -80])
  const rotate = useTransform(scrollYProgress, [0, 1], [30, -10])

  return (
    <section ref={ref} className="relative my-24 overflow-hidden bg-espresso py-28 text-ivory">
      <div className="pointer-events-none absolute inset-0 opacity-[0.07]">
        <div className="absolute top-1/2 left-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold-300" />
        <div className="absolute top-1/2 left-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold-300" />
      </div>
      <motion.div style={{ x, y, rotate }} className="pointer-events-none absolute top-10 left-0 w-40 opacity-90 sm:w-56">
        <Dragonfly className="h-full w-full" />
      </motion.div>
      <Blossom className="pointer-events-none absolute -right-10 -bottom-10 w-72 opacity-80 sm:w-96" />
      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <Reveal>
          <p className="eyebrow text-gold-300!">Nossa essência</p>
        </Reveal>
        <h2 className="mt-6 text-4xl leading-tight sm:text-6xl">
          <SplitText text="A libélula nos lembra que" />
          <span className="text-gold-gradient italic">
            <SplitText text="transformar-se é leveza." delay={0.3} />
          </span>
        </h2>
        <Reveal delay={0.3}>
          <p className="mx-auto mt-8 max-w-xl text-lg text-ivory/70">
            Como o jasmim que floresce com delicadeza, cada peça da Boutique Marina Moura é escolhida para acompanhar a sua rotina — no trabalho, no
            encontro, no treino — sem abrir mão de conforto e personalidade.
          </p>
        </Reveal>
        <Reveal delay={0.45} className="mt-10">
          <Link to="/loja" className="btn btn-gold group">
            Conheça a boutique <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </div>
    </section>
  )
}

/* ——————————————————— MAIS VENDIDOS ——————————————————— */

function BestSellers() {
  const scroller = useRef<HTMLDivElement>(null)
  const { data: products = [], isLoading } = useProducts()
  const list = products.filter((p) => p.tags.includes('mais-vendido'))
  const scrollBy = (dir: 1 | -1) => scroller.current?.scrollBy({ left: dir * scroller.current.clientWidth * 0.8, behavior: 'smooth' })

  if (!isLoading && list.length === 0) return null

  return (
    <section className="py-12">
      <div className="mx-auto flex max-w-7xl items-end justify-between px-6 lg:px-8">
        <Reveal>
          <p className="eyebrow">Queridinhos</p>
          <h2 className="mt-2 text-5xl">Mais vendidos</h2>
        </Reveal>
        <div className="flex gap-2">
          {([-1, 1] as const).map((d) => (
            <motion.button
              key={d}
              whileTap={{ scale: 0.9 }}
              onClick={() => scrollBy(d)}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-linen bg-ivory transition hover:border-espresso hover:bg-espresso hover:text-ivory"
              aria-label={d === 1 ? 'Próximos' : 'Anteriores'}
            >
              {d === 1 ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </motion.button>
          ))}
        </div>
      </div>
      <div
        ref={scroller}
        className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-6 pb-4 lg:px-[max(2rem,calc((100vw-80rem)/2+2rem))]"
      >
        {isLoading
          ? Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="w-[68%] shrink-0 sm:w-[40%] lg:w-[23%]">
                <ProductCardSkeleton />
              </div>
            ))
          : list.map((p, i) => (
              <div key={p.id} className="w-[68%] shrink-0 snap-start sm:w-[40%] lg:w-[23%]">
                <ProductCard product={p} index={i} />
              </div>
            ))}
      </div>
    </section>
  )
}

/* ——————————————————— DEPOIMENTOS ——————————————————— */

const testimonials = [
  { name: 'Juliana R.', city: 'Belo Horizonte', text: 'As peças são ainda mais lindas pessoalmente. Caimento perfeito e a embalagem é um mimo à parte!' },
  { name: 'Camila S.', city: 'São Paulo', text: 'Finalmente uma legging que não fica transparente e não desce durante o treino. Já comprei em três cores.' },
  { name: 'Patrícia M.', city: 'Curitiba', text: 'Atendimento impecável e entrega super rápida. Virei cliente fiel da boutique.' },
]

function Testimonials() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % testimonials.length), 6000)
    return () => clearInterval(t)
  }, [])
  const t = testimonials[i]
  return (
    <section className="mx-auto max-w-4xl px-6 py-24 text-center">
      <Reveal>
        <Quote className="mx-auto h-10 w-10 text-gold-300" strokeWidth={1} />
        <div className="relative mt-6 min-h-[220px] sm:min-h-[180px]">
          <AnimatePresence mode="wait">
            <motion.figure
              key={i}
              initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, filter: 'blur(6px)' }}
              transition={{ duration: 0.6, ease: silk }}
            >
              <div className="flex justify-center gap-1">
                {Array.from({ length: 5 }, (_, k) => (
                  <Star key={k} className="h-4 w-4 fill-gold-400 text-gold-400" />
                ))}
              </div>
              <blockquote className="mt-5 font-display text-3xl leading-snug sm:text-4xl">“{t.text}”</blockquote>
              <figcaption className="mt-6 text-sm text-taupe">
                <strong className="font-medium text-espresso">{t.name}</strong> · {t.city}
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>
        <div className="mt-8 flex justify-center gap-2">
          {testimonials.map((_, k) => (
            <button key={k} onClick={() => setI(k)} aria-label={`Depoimento ${k + 1}`} className="relative h-1.5 w-10 overflow-hidden rounded-full bg-linen">
              {k === i && (
                <motion.span className="absolute inset-y-0 left-0 bg-gold-500" initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 6, ease: 'linear' }} />
              )}
            </button>
          ))}
        </div>
      </Reveal>
    </section>
  )
}

/* ——————————————————— NEWSLETTER ——————————————————— */

function Newsletter() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const toast = useUI((s) => s.toast)

  return (
    <section className="mx-auto max-w-7xl px-6 lg:px-8">
      <Reveal className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-gold-50 via-sand to-gold-100 px-6 py-16 text-center sm:px-16">
        <Blossom className="pointer-events-none absolute -top-10 -left-10 w-48 opacity-70 sm:w-64" />
        <motion.div
          className="pointer-events-none absolute top-8 right-10 w-20"
          animate={{ y: [0, -12, 0], rotate: [-20, -12, -20] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Dragonfly />
        </motion.div>
        <p className="eyebrow">Clube Marina Moura</p>
        <h2 className="mx-auto mt-3 max-w-xl text-4xl sm:text-5xl">Ganhe 10% na primeira compra</h2>
        <p className="mx-auto mt-3 max-w-md text-cocoa">Receba lançamentos, looks exclusivos e ofertas especiais antes de todo mundo.</p>
        <AnimatePresence mode="wait">
          {!done ? (
            <motion.form
              key="form"
              exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={(e) => {
                e.preventDefault()
                if (/\S+@\S+\.\S+/.test(email)) setDone(true)
              }}
              className="relative mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
            >
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Seu melhor e-mail" className="input flex-1 rounded-full! px-6" />
              <button className="btn btn-primary">Quero meu cupom</button>
            </motion.form>
          ) : (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.8, rotateX: 60 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 16 }}
              className="relative mx-auto mt-8 inline-flex items-center gap-4 rounded-2xl border-2 border-dashed border-gold-400 bg-ivory px-6 py-4"
            >
              <div className="text-left">
                <p className="text-xs tracking-[0.2em] text-taupe uppercase">Seu cupom</p>
                <p className="font-display text-3xl tracking-widest text-gold-700">BEMVINDA10</p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText('BEMVINDA10')
                  toast({ title: 'Cupom copiado!', description: 'Use na sacola ou no checkout', tone: 'success' })
                }}
                className="rounded-full bg-espresso p-3 text-ivory transition hover:bg-cocoa"
                aria-label="Copiar cupom"
              >
                <Copy className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </Reveal>
    </section>
  )
}
