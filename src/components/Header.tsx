import { Heart, LayoutDashboard, LogOut, Menu, Package, Search, ShoppingBag, User, UserRound, X } from 'lucide-react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useCollections, useProducts, useSections } from '../hooks/queries'
import { FREE_SHIPPING_THRESHOLD } from '../lib/commerce'
import { silk } from '../lib/easing'
import { money } from '../lib/format'
import { coverOf } from '../lib/product'
import { useAuth } from '../store/auth'
import { useCart } from '../store/cart'
import { useUI } from '../store/ui'
import { useWishlist } from '../store/wishlist'
import type { Section } from '../types'
import { LogoMark, Wordmark } from './Brand'
import { ProductImage } from './ProductImage'

const announcements = [
  `Frete grátis em compras acima de ${money(FREE_SHIPPING_THRESHOLD)}`,
  '5% de desconto pagando com Pix',
  'Parcele em até 6x sem juros',
  'Primeira compra? Use o cupom BEMVINDA10',
]

type NavItem = { to: string; label: string; section?: Section; collections?: boolean }

export function Header() {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [annIndex, setAnnIndex] = useState(0)
  const [mega, setMega] = useState<NavItem | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const location = useLocation()
  const { data: sections = [] } = useSections()

  const count = useCart((s) => s.items.reduce((n, i) => n + i.qty, 0))
  const wishCount = useWishlist((s) => s.ids.length)
  const { setCartOpen, setSearchOpen, menuOpen, setMenuOpen, cartPulse, flyers, headerHidden: hidden, setHeaderHidden: setHidden } = useUI()

  const nav: NavItem[] = [
    ...sections.slice(0, 3).map((s) => ({ to: `/loja/${s.slug}`, label: s.name, section: s })),
    { to: '/colecoes', label: 'Coleções', collections: true },
    { to: '/loja?tag=novo', label: 'Novidades' },
    { to: '/loja?tag=promo', label: 'Sale' },
  ]

  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0
    setScrolled(y > 40)
    setHidden(y > 400 && y > prev && !mega)
  })

  useEffect(() => {
    const t = setInterval(() => setAnnIndex((i) => (i + 1) % announcements.length), 4000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (flyers.length) setHidden(false)
  }, [flyers.length, setHidden])

  useEffect(() => {
    setMega(null)
    setMenuOpen(false)
  }, [location.pathname, location.search, setMenuOpen])

  return (
    <>
      <motion.header
        animate={{ y: hidden ? '-100%' : 0 }}
        transition={{ duration: 0.45, ease: silk }}
        className="fixed inset-x-0 top-0 z-50"
        onMouseLeave={() => setMega(null)}
      >
        <motion.div animate={{ height: scrolled ? 0 : 34, opacity: scrolled ? 0 : 1 }} className="overflow-hidden bg-espresso text-ivory">
          <div className="relative flex h-[34px] items-center justify-center text-[0.68rem] tracking-[0.18em] uppercase sm:text-[0.72rem]">
            <AnimatePresence mode="wait">
              <motion.span
                key={annIndex}
                initial={{ y: 14, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -14, opacity: 0 }}
                transition={{ duration: 0.4, ease: silk }}
              >
                {announcements[annIndex]}
              </motion.span>
            </AnimatePresence>
          </div>
        </motion.div>

        <div className={`transition-all duration-500 ${scrolled || mega ? 'bg-ivory/90 shadow-soft backdrop-blur-xl' : 'bg-cream/70 backdrop-blur-md'}`}>
          <div
            className={`mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-4 transition-all duration-500 sm:px-6 lg:px-8 ${
              scrolled ? 'h-16' : 'h-20'
            }`}
          >
            <div className="flex items-center gap-1">
              <button onClick={() => setMenuOpen(true)} className="-ml-2 rounded-full p-2 hover:bg-sand lg:hidden" aria-label="Abrir menu">
                <Menu className="h-5 w-5" strokeWidth={1.5} />
              </button>
              <nav className="hidden items-center xl:gap-1 lg:flex" onMouseLeave={() => setHovered(null)}>
                {nav.map((item) => (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    onMouseEnter={() => {
                      setHovered(item.label)
                      setMega(item.section || item.collections ? item : null)
                    }}
                    className="relative px-3 py-2 text-[0.76rem] tracking-[0.16em] whitespace-nowrap text-espresso uppercase xl:px-4"
                  >
                    {hovered === item.label && (
                      <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-sand/80" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
                    )}
                    <span className="relative">{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>

            <Link to="/" className="group flex items-center gap-3" aria-label="Página inicial">
              <motion.div
                whileHover={{ rotate: -8, scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className={`${scrolled ? 'h-10 w-10' : 'h-12 w-12'} shrink-0 transition-all duration-500`}
              >
                <LogoMark className="h-full w-full drop-shadow-sm" />
              </motion.div>
              <Wordmark className="hidden sm:flex" compact={scrolled} />
            </Link>

            <div className="flex items-center justify-end gap-0.5 sm:gap-1">
              <IconButton label="Buscar" onClick={() => setSearchOpen(true)}>
                <Search className="h-5 w-5" strokeWidth={1.5} />
              </IconButton>
              <AccountMenu />
              <Link to="/favoritos" className="relative hidden rounded-full p-2.5 transition hover:bg-sand sm:block" aria-label="Favoritos">
                <Heart className="h-5 w-5" strokeWidth={1.5} />
                <Badge value={wishCount} tone="rose" />
              </Link>
              <motion.button
                id="cart-target"
                key={cartPulse}
                animate={cartPulse ? { scale: [1, 1.25, 0.95, 1] } : undefined}
                transition={{ duration: 0.5 }}
                onClick={() => setCartOpen(true)}
                className="relative rounded-full p-2.5 transition hover:bg-sand"
                aria-label={`Abrir sacola, ${count} itens`}
              >
                <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
                <Badge value={count} />
              </motion.button>
            </div>
          </div>

          <AnimatePresence>{mega && <MegaMenu item={mega} />}</AnimatePresence>
        </div>
      </motion.header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} nav={nav} />
    </>
  )
}

function IconButton({ children, label, onClick }: { children: ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label={label} className="rounded-full p-2.5 transition hover:bg-sand">
      {children}
    </button>
  )
}

function Badge({ value, tone = 'gold' }: { value: number; tone?: 'gold' | 'rose' }) {
  return (
    <AnimatePresence>
      {value > 0 && (
        <motion.span
          key={value}
          initial={{ scale: 0, y: 4 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 18 }}
          className={`absolute top-0.5 right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[0.62rem] font-semibold text-ivory ${
            tone === 'gold' ? 'bg-gold-500' : 'bg-rose'
          }`}
        >
          {value}
        </motion.span>
      )}
    </AnimatePresence>
  )
}

function AccountMenu() {
  const { session, profile, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const h = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  useEffect(() => setOpen(false), [location.pathname])

  if (!session) {
    return (
      <Link
        to="/entrar"
        state={{ from: location.pathname + location.search }}
        className="flex items-center gap-2 rounded-full p-2.5 transition hover:bg-sand"
        aria-label="Entrar"
      >
        <UserRound className="h-5 w-5" strokeWidth={1.5} />
        <span className="hidden text-xs tracking-wider uppercase xl:inline">Entrar</span>
      </Link>
    )
  }

  const firstName = profile?.full_name?.split(' ')[0] || session.user.email?.split('@')[0]
  const initials = (profile?.full_name || session.user.email || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full p-1.5 transition hover:bg-sand"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Minha conta"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-gradient text-[0.7rem] font-semibold text-ivory">{initials}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 z-50 mt-2 w-60 origin-top-right rounded-2xl border border-linen bg-ivory p-2 shadow-lift"
          >
            <div className="border-b border-linen px-3 pt-2 pb-3">
              <p className="font-display text-xl leading-tight">Olá, {firstName}</p>
              <p className="truncate text-xs text-taupe">{session.user.email}</p>
            </div>
            <MenuLink to="/conta" icon={User}>
              Minha conta
            </MenuLink>
            <MenuLink to="/conta/pedidos" icon={Package}>
              Meus pedidos
            </MenuLink>
            {profile?.role === 'admin' && (
              <MenuLink to="/admin" icon={LayoutDashboard} accent>
                Painel administrativo
              </MenuLink>
            )}
            <button
              onClick={async () => {
                await signOut()
                navigate('/')
              }}
              className="mt-1 flex w-full items-center gap-3 rounded-xl border-t border-linen px-3 py-2.5 text-left text-sm text-cocoa transition hover:bg-sand"
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MenuLink({ to, icon: Icon, children, accent }: { to: string; icon: typeof User; children: ReactNode; accent?: boolean }) {
  return (
    <Link
      to={to}
      role="menuitem"
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition hover:bg-sand ${accent ? 'font-medium text-gold-700' : 'text-espresso'}`}
    >
      <Icon className="h-4 w-4" /> {children}
    </Link>
  )
}

function MegaMenu({ item }: { item: NavItem }) {
  const { data: products = [] } = useProducts()
  const { data: collections = [] } = useCollections()
  const section = item.section

  const featured = section
    ? products.filter((p) => p.section_id === section.id).sort((a, b) => Number(b.images.length > 0) - Number(a.images.length > 0)).slice(0, 3)
    : []

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.45, ease: silk }}
      className="hidden overflow-hidden border-t border-linen/70 lg:block"
    >
      {section ? (
        <div className="mx-auto grid max-w-7xl grid-cols-[1fr_2fr] gap-10 px-8 py-8">
          <div>
            {section.tagline && <p className="eyebrow">{section.tagline}</p>}
            <h3 className="mt-2 text-4xl">{section.name}</h3>
            {section.description && <p className="mt-2 max-w-xs text-sm text-taupe">{section.description}</p>}
            <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2">
              {section.categories.map((c, i) => (
                <motion.li key={c} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}>
                  <Link to={`/loja/${section.slug}?categoria=${encodeURIComponent(c)}`} className="group inline-flex items-center gap-2 text-sm text-cocoa hover:text-gold-600">
                    <span className="h-px w-0 bg-gold-500 transition-all duration-300 group-hover:w-4" />
                    {c}
                  </Link>
                </motion.li>
              ))}
            </ul>
            <Link to={`/loja/${section.slug}`} className="mt-6 inline-block text-sm font-medium text-gold-700 underline-offset-4 hover:underline">
              Ver tudo de {section.name}
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {featured.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.07 }}>
                <Link to={`/produto/${p.slug}`} className="group block">
                  <div className="aspect-[3/4] overflow-hidden rounded-2xl">
                    <ProductImage src={coverOf(p)} alt={p.name} className="h-full w-full transition-transform duration-700 group-hover:scale-105" />
                  </div>
                  <p className="mt-2 truncate font-display text-lg leading-tight">{p.name}</p>
                  <p className="text-sm text-taupe">{money(p.price)}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mx-auto grid max-w-7xl grid-cols-4 gap-5 px-8 py-8">
          {collections.slice(0, 4).map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.07 }}>
              <Link to={`/colecoes/${c.slug}`} className="group relative block aspect-[4/5] overflow-hidden rounded-2xl">
                <ProductImage src={c.cover_url} alt={c.name} placeholderLabel={false} className="h-full w-full transition-transform duration-700 group-hover:scale-105" />
                <span className="absolute inset-0 bg-gradient-to-t from-espresso/70 via-transparent to-transparent" />
                <span className="absolute inset-x-4 bottom-4 font-display text-2xl text-ivory">{c.name}</span>
              </Link>
            </motion.div>
          ))}
          {collections.length === 0 && <p className="col-span-4 text-sm text-taupe">Novas coleções em breve.</p>}
        </div>
      )}
    </motion.div>
  )
}

function MobileMenu({ open, onClose, nav }: { open: boolean; onClose: () => void; nav: NavItem[] }) {
  const session = useAuth((s) => s.session)
  const isAdmin = useAuth((s) => s.profile?.role === 'admin')
  const links = [
    { to: '/', label: 'Início' },
    ...nav.map((n) => ({ to: n.to, label: n.label })),
    { to: '/favoritos', label: 'Favoritos' },
    session ? { to: '/conta', label: 'Minha conta' } : { to: '/entrar', label: 'Entrar' },
    ...(isAdmin ? [{ to: '/admin', label: 'Painel admin' }] : []),
  ]
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[60] lg:hidden" initial="closed" animate="open" exit="closed">
          <motion.div variants={{ open: { opacity: 1 }, closed: { opacity: 0 } }} className="absolute inset-0 bg-espresso/40 backdrop-blur-sm" onClick={onClose} />
          <motion.aside
            variants={{ open: { x: 0 }, closed: { x: '-100%' } }}
            transition={{ duration: 0.5, ease: silk }}
            className="paper-grain absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col overflow-y-auto bg-cream p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <LogoMark className="h-11 w-11" />
                <Wordmark />
              </div>
              <button onClick={onClose} className="rounded-full p-2 hover:bg-sand" aria-label="Fechar menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <motion.ul className="mt-8 space-y-1" variants={{ open: { transition: { staggerChildren: 0.05, delayChildren: 0.15 } }, closed: {} }}>
              {links.map((l) => (
                <motion.li key={l.label} variants={{ open: { opacity: 1, x: 0 }, closed: { opacity: 0, x: -24 } }}>
                  <Link to={l.to} className="block border-b border-linen/70 py-3 font-display text-3xl text-espresso">
                    {l.label}
                  </Link>
                </motion.li>
              ))}
            </motion.ul>
            <p className="mt-auto pt-8 text-center font-display text-lg text-gold-600 italic">Sua essência, seu estilo.</p>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
