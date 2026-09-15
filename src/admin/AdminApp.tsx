import { Boxes, ExternalLink, FolderTree, Layers, LayoutDashboard, LogOut, Menu, Package, ShoppingBag, TicketPercent, Users, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { LogoMark } from '../components/Brand'
import { silk } from '../lib/easing'
import { useAuth } from '../store/auth'
import CollectionsAdmin from './pages/CollectionsAdmin'
import CouponsAdmin from './pages/CouponsAdmin'
import Dashboard from './pages/Dashboard'
import OrdersAdmin from './pages/OrdersAdmin'
import ProductEditor from './pages/ProductEditor'
import ProductsAdmin from './pages/ProductsAdmin'
import SectionsAdmin from './pages/SectionsAdmin'
import StockAdmin from './pages/StockAdmin'
import UsersAdmin from './pages/UsersAdmin'
import { ConfirmHost } from './ui'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/pedidos', label: 'Pedidos', icon: ShoppingBag },
  { to: '/admin/produtos', label: 'Produtos', icon: Package },
  { to: '/admin/estoque', label: 'Estoque', icon: Boxes },
  { to: '/admin/secoes', label: 'Seções', icon: FolderTree },
  { to: '/admin/colecoes', label: 'Coleções', icon: Layers },
  { to: '/admin/cupons', label: 'Cupons', icon: TicketPercent },
  { to: '/admin/usuarios', label: 'Usuários', icon: Users },
]

export default function AdminApp() {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
    window.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-cream lg:pl-64">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">
        <Sidebar />
      </aside>

      {/* Topo mobile */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-linen bg-ivory/95 px-4 py-3 lg:hidden">
        <button onClick={() => setMenuOpen(true)} className="rounded-full p-2 hover:bg-sand" aria-label="Abrir menu">
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-display text-xl">Painel · Marina Moura</span>
        <LogoMark className="h-9 w-9" />
      </div>
      <AnimatePresence>
        {menuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-espresso/40" onClick={() => setMenuOpen(false)} />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ duration: 0.4, ease: silk }} className="absolute inset-y-0 left-0 w-72">
              <Sidebar onClose={() => setMenuOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: silk }}>
            <Routes location={location}>
              <Route index element={<Dashboard />} />
              <Route path="pedidos" element={<OrdersAdmin />} />
              <Route path="produtos" element={<ProductsAdmin />} />
              <Route path="produtos/novo" element={<ProductEditor />} />
              <Route path="produtos/:id" element={<ProductEditor />} />
              <Route path="estoque" element={<StockAdmin />} />
              <Route path="secoes" element={<SectionsAdmin />} />
              <Route path="colecoes" element={<CollectionsAdmin />} />
              <Route path="cupons" element={<CouponsAdmin />} />
              <Route path="usuarios" element={<UsersAdmin />} />
              <Route path="*" element={<p className="text-taupe">Página não encontrada.</p>} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
      <ConfirmHost />
    </div>
  )
}

function Sidebar({ onClose }: { onClose?: () => void }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  return (
    <div className="flex h-full flex-col bg-espresso px-4 py-6 text-ivory">
      <div className="flex items-center justify-between px-2">
        <Link to="/admin" className="flex items-center gap-3">
          <LogoMark className="h-11 w-11" />
          <span className="leading-none">
            <span className="block text-[0.55rem] tracking-[0.4em] text-gold-300">PAINEL</span>
            <span className="font-display text-xl tracking-wide">Marina Moura</span>
          </span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="rounded-full p-2 hover:bg-ivory/10" aria-label="Fechar menu">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="mt-10 flex-1 space-y-1">
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className="relative block">
            {({ isActive }) => (
              <span className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${isActive ? 'text-espresso' : 'text-ivory/70 hover:bg-ivory/5 hover:text-ivory'}`}>
                {isActive && <motion.span layoutId="admin-nav" className="absolute inset-0 rounded-xl bg-gold-gradient" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
                <item.icon className="relative h-4 w-4" />
                <span className="relative font-medium">{item.label}</span>
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-1 border-t border-ivory/10 pt-4">
        <Link to="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ivory/70 hover:bg-ivory/5 hover:text-ivory">
          <ExternalLink className="h-4 w-4" /> Ver loja
        </Link>
        <button
          onClick={async () => {
            await signOut()
            navigate('/')
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-ivory/70 hover:bg-ivory/5 hover:text-ivory"
        >
          <LogOut className="h-4 w-4" /> Sair
        </button>
        <p className="truncate px-3 pt-2 text-xs text-ivory/40">{profile?.email}</p>
      </div>
    </div>
  )
}
