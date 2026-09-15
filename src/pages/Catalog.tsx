import { Check, ChevronDown, SlidersHorizontal, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Dragonfly } from '../components/Brand'
import { PageTransition, SplitText } from '../components/motion'
import { ProductGrid } from '../components/ProductCard'
import { ProductImage } from '../components/ProductImage'
import { useCollections, useProducts, useSections } from '../hooks/queries'
import { silk } from '../lib/easing'
import { money } from '../lib/format'
import { colorsOf, discountPercent, sizesOf, sortSizes, stockOf } from '../lib/product'
import { useUI } from '../store/ui'
import NotFound from './NotFound'

const SORTS = [
  { id: 'novidades', label: 'Novidades' },
  { id: 'menor-preco', label: 'Menor preço' },
  { id: 'maior-preco', label: 'Maior preço' },
  { id: 'nome', label: 'A–Z' },
]

const TAGS: [string, string][] = [
  ['novo', 'Novidades'],
  ['promo', 'Em promoção'],
  ['mais-vendido', 'Mais vendidos'],
  ['disponivel', 'Pronta entrega'],
]

export default function Catalog({ mode = 'section' }: { mode?: 'section' | 'collection' }) {
  const params = useParams()
  const [search, setSearch] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const headerHidden = useUI((s) => s.headerHidden)

  const { data: allProducts, isLoading } = useProducts()
  const { data: sections = [], isLoading: loadingSections } = useSections()
  const { data: collections = [], isLoading: loadingCollections } = useCollections()

  const section = mode === 'section' && params.section ? sections.find((s) => s.slug === params.section) : undefined
  const collection = mode === 'collection' ? collections.find((c) => c.slug === params.slug) : undefined

  const category = search.get('categoria')
  const tag = search.get('tag')
  const sizes = search.getAll('tam')
  const colors = search.getAll('cor')
  const sort = search.get('ordem') ?? 'novidades'

  const update = (fn: (p: URLSearchParams) => void) => {
    const next = new URLSearchParams(search)
    fn(next)
    setSearch(next, { replace: true, preventScrollReset: true })
  }
  const toggleMulti = (key: string, value: string) =>
    update((p) => {
      const all = p.getAll(key)
      p.delete(key)
      ;(all.includes(value) ? all.filter((v) => v !== value) : [...all, value]).forEach((v) => p.append(key, v))
    })

  const base = useMemo(
    () =>
      (allProducts ?? []).filter((p) => {
        if (mode === 'collection') return collection && p.collection_id === collection.id
        if (params.section) return section && p.section_id === section.id
        return true
      }),
    [allProducts, mode, collection, section, params.section],
  )

  const priceMax = Math.max(100, Math.ceil(Math.max(0, ...base.map((p) => p.price)) / 50) * 50)
  const maxPrice = Number(search.get('ate') ?? priceMax)
  const allSizes = useMemo(() => sortSizes([...new Set(base.flatMap((p) => sizesOf(p)))]), [base])
  const allColors = useMemo(() => {
    const m = new Map<string, string>()
    base.forEach((p) => colorsOf(p).forEach((c) => m.set(c.name, c.hex)))
    return [...m.entries()]
  }, [base])
  const categories = useMemo(() => {
    const fromProducts = [...new Set(base.map((p) => p.category).filter((c): c is string => !!c))]
    if (!section) return fromProducts
    return [...section.categories.filter((c) => fromProducts.includes(c)), ...fromProducts.filter((c) => !section.categories.includes(c))]
  }, [base, section])

  const list = useMemo(() => {
    const out = base.filter(
      (p) =>
        (!category || p.category === category) &&
        (!tag ||
          (tag === 'promo' ? discountPercent(p) > 0 : tag === 'disponivel' ? stockOf(p) > 0 : p.tags.includes(tag as never))) &&
        (sizes.length === 0 || p.variants.some((v) => sizes.includes(v.size) && v.stock > 0)) &&
        (colors.length === 0 || p.variants.some((v) => colors.includes(v.color_name))) &&
        p.price <= maxPrice,
    )
    const sorted = [...out]
    if (sort === 'menor-preco') sorted.sort((a, b) => a.price - b.price)
    if (sort === 'maior-preco') sorted.sort((a, b) => b.price - a.price)
    if (sort === 'nome') sorted.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    if (sort === 'novidades') sorted.sort((a, b) => b.created_at.localeCompare(a.created_at))
    // peças esgotadas vão para o fim
    return sorted.sort((a, b) => Number(stockOf(a) === 0) - Number(stockOf(b) === 0))
  }, [base, category, tag, sizes, colors, maxPrice, sort])

  if (mode === 'collection' && !loadingCollections && !collection) return <NotFound />
  if (mode === 'section' && params.section && !loadingSections && !section) return <NotFound />

  const activeChips: { label: string; clear: () => void }[] = [
    ...(category ? [{ label: category, clear: () => update((p) => p.delete('categoria')) }] : []),
    ...(tag ? [{ label: TAGS.find(([id]) => id === tag)?.[1] ?? tag, clear: () => update((p) => p.delete('tag')) }] : []),
    ...sizes.map((s) => ({ label: `Tam. ${s}`, clear: () => toggleMulti('tam', s) })),
    ...colors.map((c) => ({ label: c, clear: () => toggleMulti('cor', c) })),
    ...(maxPrice < priceMax ? [{ label: `Até ${money(maxPrice)}`, clear: () => update((p) => p.delete('ate')) }] : []),
  ]

  const title = collection?.name ?? section?.name ?? (tag === 'novo' ? 'Novidades' : tag === 'promo' ? 'Sale' : 'Toda a boutique')
  const eyebrow = collection ? 'Coleção' : (section?.tagline ?? 'Boutique Marina Moura')
  const subtitle = collection?.description ?? section?.description ?? 'Casual e fitness em um só lugar — escolha, combine e brilhe.'
  const cover = collection?.cover_url ?? section?.cover_url ?? null

  const filters = (
    <FilterPanel
      allSizes={allSizes}
      allColors={allColors}
      sizes={sizes}
      colors={colors}
      maxPrice={maxPrice}
      priceMax={priceMax}
      tag={tag}
      onSize={(s) => toggleMulti('tam', s)}
      onColor={(c) => toggleMulti('cor', c)}
      onPrice={(v) => update((p) => (v >= priceMax ? p.delete('ate') : p.set('ate', String(v))))}
      onTag={(t) => update((p) => (t === tag ? p.delete('tag') : p.set('tag', t)))}
    />
  )

  const pills = [
    { to: '/loja', label: 'Todas', active: mode === 'section' && !params.section },
    ...sections.map((s) => ({ to: `/loja/${s.slug}`, label: s.name, active: s.slug === params.section })),
  ]

  return (
    <PageTransition>
      {/* Banner */}
      <section className={`relative overflow-hidden ${cover ? 'min-h-[380px] text-ivory sm:min-h-[440px]' : 'bg-gradient-to-br from-gold-50 via-cream to-sand'}`}>
        {cover ? (
          <>
            <motion.div initial={{ scale: 1.12 }} animate={{ scale: 1 }} transition={{ duration: 1.6, ease: silk }} className="absolute inset-0">
              <ProductImage src={cover} alt={title} loading="eager" className="h-full w-full" />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-r from-espresso/80 via-espresso/40 to-espresso/10" />
          </>
        ) : (
          <motion.div
            className="pointer-events-none absolute top-6 right-[8%] hidden w-28 md:block"
            animate={{ y: [0, -14, 0], rotate: [-12, -4, -12] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Dragonfly />
          </motion.div>
        )}
        <div className="relative mx-auto flex max-w-7xl flex-col px-6 pt-10 pb-12 lg:px-8">
          <nav className={`flex items-center gap-2 text-xs tracking-wider uppercase ${cover ? 'text-ivory/70' : 'text-taupe'}`} aria-label="Breadcrumb">
            <Link to="/" className="hover:text-gold-400">
              Início
            </Link>
            <span>/</span>
            <Link to={collection ? '/colecoes' : '/loja'} className="hover:text-gold-400">
              {collection ? 'Coleções' : 'Loja'}
            </Link>
            {(section || collection) && (
              <>
                <span>/</span>
                <span className={cover ? 'text-ivory' : 'text-espresso'}>{title}</span>
              </>
            )}
          </nav>
          <p className={`eyebrow mt-8 ${cover ? 'text-gold-200!' : ''}`}>{eyebrow}</p>
          <h1 key={title} className="mt-2 text-6xl sm:text-7xl">
            <SplitText text={title} />
          </h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className={`mt-3 max-w-lg ${cover ? 'text-ivory/85' : 'text-cocoa'}`}>
            {subtitle}
          </motion.p>

          {mode === 'section' && sections.length > 0 && (
            <div className="no-scrollbar mt-8 inline-flex max-w-full self-start overflow-x-auto rounded-full border border-linen bg-ivory/85 p-1 text-espresso backdrop-blur">
              {pills.map((s) => (
                <Link key={s.label} to={s.to} className="relative shrink-0 rounded-full px-5 py-2 text-sm">
                  {s.active && <motion.span layoutId="section-pill" className="absolute inset-0 rounded-full bg-espresso" />}
                  <span className={`relative ${s.active ? 'text-ivory' : 'text-cocoa'}`}>{s.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Categorias */}
      {categories.length > 0 && (
        <motion.div
          animate={{ top: headerHidden ? 0 : 64 }}
          transition={{ duration: 0.45, ease: silk }}
          className="sticky z-30 border-b border-linen/70 bg-cream/90 backdrop-blur-lg"
        >
          <div className="no-scrollbar mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-6 py-3 lg:px-8">
            <CategoryChip label="Tudo" active={!category} onClick={() => update((p) => p.delete('categoria'))} />
            {categories.map((c) => (
              <CategoryChip key={c} label={c} active={category === c} onClick={() => update((p) => p.set('categoria', c))} />
            ))}
          </div>
        </motion.div>
      )}

      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[230px_1fr] lg:px-8">
        <aside className="hidden lg:block">
          <div className="sticky top-36">{filters}</div>
        </aside>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-taupe">
              {isLoading ? (
                'Carregando peças…'
              ) : (
                <>
                  <motion.span key={list.length} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="inline-block font-medium text-espresso">
                    {list.length}
                  </motion.span>{' '}
                  {list.length === 1 ? 'peça encontrada' : 'peças encontradas'}
                </>
              )}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setFiltersOpen(true)} className="btn btn-outline px-4! py-2.5! lg:hidden">
                <SlidersHorizontal className="h-4 w-4" /> Filtros
                {activeChips.length > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold-500 text-[0.65rem] text-ivory">{activeChips.length}</span>
                )}
              </button>
              <SortMenu value={sort} onChange={(v) => update((p) => p.set('ordem', v))} />
            </div>
          </div>

          <AnimatePresence>
            {activeChips.length > 0 && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="flex flex-wrap items-center gap-2 pt-4">
                  <AnimatePresence>
                    {activeChips.map((c) => (
                      <motion.button
                        key={c.label}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={c.clear}
                        className="flex items-center gap-1.5 rounded-full bg-espresso py-1.5 pr-2.5 pl-3.5 text-xs text-ivory"
                      >
                        {c.label} <X className="h-3 w-3" />
                      </motion.button>
                    ))}
                  </AnimatePresence>
                  <button onClick={() => setSearch({}, { replace: true })} className="ml-1 text-xs text-taupe underline underline-offset-4 hover:text-espresso">
                    Limpar tudo
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8">
            <ProductGrid products={list} loading={isLoading} skeletons={6} className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-6 xl:grid-cols-3" />
          </div>

          {!isLoading && list.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="py-16 text-center">
              <Dragonfly className="mx-auto h-24 w-24 opacity-70" />
              <h3 className="mt-4 text-3xl">{base.length === 0 ? 'Peças chegando em breve' : 'Nenhuma peça por aqui'}</h3>
              <p className="mt-2 text-taupe">
                {base.length === 0 ? 'Estamos preparando novidades com muito carinho.' : 'Tente ajustar os filtros para descobrir outras opções.'}
              </p>
              {activeChips.length > 0 && (
                <button onClick={() => setSearch({}, { replace: true })} className="btn btn-primary mt-6">
                  Limpar filtros
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {filtersOpen && (
          <div className="fixed inset-0 z-[80] lg:hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-espresso/40" onClick={() => setFiltersOpen(false)} />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 280, damping: 32 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => info.offset.y > 120 && setFiltersOpen(false)}
              className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-[2rem] bg-cream p-6"
            >
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-linen" />
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-3xl">Filtros</h3>
                <button onClick={() => setFiltersOpen(false)} className="rounded-full p-2 hover:bg-sand" aria-label="Fechar filtros">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {filters}
              <button onClick={() => setFiltersOpen(false)} className="btn btn-primary mt-6 w-full">
                Ver {list.length} {list.length === 1 ? 'peça' : 'peças'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageTransition>
  )
}

function CategoryChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="relative shrink-0 rounded-full px-4 py-2 text-sm whitespace-nowrap">
      {active ? (
        <motion.span layoutId="cat-chip" className="absolute inset-0 rounded-full bg-gold-500" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
      ) : (
        <span className="absolute inset-0 rounded-full border border-linen bg-ivory/60" />
      )}
      <span className={`relative ${active ? 'text-ivory' : 'text-cocoa'}`}>{label}</span>
    </button>
  )
}

function SortMenu({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  const current = SORTS.find((s) => s.id === value) ?? SORTS[0]
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className="btn btn-outline px-4! py-2.5!" aria-haspopup="listbox" aria-expanded={open}>
        <span className="text-taupe">Ordenar:</span> {current.label}
        <motion.span animate={{ rotate: open ? 180 : 0 }}>
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 z-40 mt-2 w-52 origin-top-right rounded-2xl border border-linen bg-ivory p-1.5 shadow-lift"
          >
            {SORTS.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => {
                    onChange(s.id)
                    setOpen(false)
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-sand"
                >
                  {s.label}
                  {s.id === value && <Check className="h-4 w-4 text-gold-600" />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

interface FilterPanelProps {
  allSizes: string[]
  allColors: [string, string][]
  sizes: string[]
  colors: string[]
  maxPrice: number
  priceMax: number
  tag: string | null
  onSize: (s: string) => void
  onColor: (c: string) => void
  onPrice: (v: number) => void
  onTag: (t: string) => void
}

function FilterPanel({ allSizes, allColors, sizes, colors, maxPrice, priceMax, tag, onSize, onColor, onPrice, onTag }: FilterPanelProps) {
  return (
    <div className="space-y-2">
      <FilterGroup title="Destaques">
        <div className="flex flex-wrap gap-2">
          {TAGS.map(([id, label]) => (
            <button
              key={id}
              onClick={() => onTag(id)}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${tag === id ? 'border-espresso bg-espresso text-ivory' : 'border-linen bg-ivory hover:border-gold-400'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </FilterGroup>

      {allSizes.length > 0 && (
        <FilterGroup title="Tamanho">
          <div className="grid grid-cols-5 gap-1.5">
            {allSizes.map((s) => (
              <motion.button
                key={s}
                whileTap={{ scale: 0.9 }}
                onClick={() => onSize(s)}
                className={`rounded-xl border py-2 text-xs font-medium transition ${sizes.includes(s) ? 'border-espresso bg-espresso text-ivory' : 'border-linen bg-ivory hover:border-gold-400'}`}
              >
                {s}
              </motion.button>
            ))}
          </div>
        </FilterGroup>
      )}

      {allColors.length > 0 && (
        <FilterGroup title="Cor">
          <div className="flex flex-wrap gap-2.5">
            {allColors.map(([name, hex]) => {
              const on = colors.includes(name)
              return (
                <motion.button
                  key={name}
                  whileHover={{ scale: 1.12 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onColor(name)}
                  title={name}
                  aria-label={`Cor ${name}`}
                  aria-pressed={on}
                  className={`relative flex h-8 w-8 items-center justify-center rounded-full border-2 ${on ? 'border-gold-500' : 'border-ivory shadow-[0_0_0_1px_rgba(0,0,0,.08)]'}`}
                  style={{ background: hex }}
                >
                  <AnimatePresence>
                    {on && (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <Check className="h-3.5 w-3.5 text-ivory mix-blend-difference" strokeWidth={3} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              )
            })}
          </div>
        </FilterGroup>
      )}

      <FilterGroup title="Preço">
        <input
          type="range"
          min={50}
          max={priceMax}
          step={10}
          value={Math.min(maxPrice, priceMax)}
          onChange={(e) => onPrice(Number(e.target.value))}
          className="w-full accent-gold-500"
          aria-label="Preço máximo"
        />
        <div className="mt-1 flex justify-between text-xs text-taupe">
          <span>R$ 50</span>
          <span className="font-medium text-espresso">até {money(Math.min(maxPrice, priceMax))}</span>
        </div>
      </FilterGroup>
    </div>
  )
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border-b border-linen pb-4">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between py-3 text-left">
        <span className="text-xs font-medium tracking-[0.2em] uppercase">{title}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }}>
          <ChevronDown className="h-4 w-4 text-taupe" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: silk }} className="overflow-hidden">
            <div className="pt-1 pb-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
