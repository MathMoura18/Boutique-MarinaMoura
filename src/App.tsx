import { AnimatePresence, MotionConfig } from 'motion/react'
import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { ScrollProgress } from './components/motion'
import { CartDrawer, Flyers, SearchOverlay, Toaster } from './components/Overlays'
import { FullPageLoader, GuestOnly, RequireAdmin, RequireAuth } from './components/RouteGuards'
import { isSupabaseConfigured } from './lib/supabase'
import Catalog from './pages/Catalog'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import SetupRequired from './pages/SetupRequired'
import { useAuth } from './store/auth'

const ProductPage = lazy(() => import('./pages/Product'))
const Collections = lazy(() => import('./pages/Collections'))
const Cart = lazy(() => import('./pages/Cart'))
const Checkout = lazy(() => import('./pages/Checkout'))
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'))
const Wishlist = lazy(() => import('./pages/Wishlist'))
const Account = lazy(() => import('./pages/Account'))
const Login = lazy(() => import('./pages/auth/Login'))
const Register = lazy(() => import('./pages/auth/Register'))
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'))
const AdminApp = lazy(() => import('./admin/AdminApp'))

const Lazy = ({ children }: { children: ReactNode }) => <Suspense fallback={<div className="min-h-[70vh]" />}>{children}</Suspense>

export default function App() {
  useEffect(() => useAuth.getState().init(), [])

  if (!isSupabaseConfigured) return <SetupRequired />

  return (
    <MotionConfig reducedMotion="user">
      <Routes>
        <Route
          path="/admin/*"
          element={
            <RequireAdmin>
              <Suspense fallback={<FullPageLoader />}>
                <AdminApp />
              </Suspense>
            </RequireAdmin>
          }
        />
        <Route path="*" element={<Storefront />} />
      </Routes>
      <Toaster />
    </MotionConfig>
  )
}

function Storefront() {
  const location = useLocation()
  const isCheckout = location.pathname.startsWith('/checkout')
  // Abas da conta trocam sem transição de página inteira
  const pageKey = location.pathname.startsWith('/conta') ? '/conta' : location.pathname

  return (
    <>
      <ScrollProgress />
      <Header />
      <div className="pt-[114px]">
        <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo({ top: 0, behavior: 'instant' })}>
          <Routes location={location} key={pageKey}>
            <Route path="/" element={<Home />} />
            <Route path="/loja" element={<Catalog />} />
            <Route path="/loja/:section" element={<Catalog />} />
            <Route path="/colecoes" element={<Lazy><Collections /></Lazy>} />
            <Route path="/colecoes/:slug" element={<Catalog mode="collection" />} />
            <Route path="/produto/:slug" element={<Lazy><ProductPage /></Lazy>} />
            <Route path="/carrinho" element={<Lazy><Cart /></Lazy>} />
            <Route path="/favoritos" element={<Lazy><Wishlist /></Lazy>} />
            <Route path="/checkout" element={<RequireAuth><Lazy><Checkout /></Lazy></RequireAuth>} />
            <Route path="/pedido/:number" element={<RequireAuth><Lazy><OrderSuccess /></Lazy></RequireAuth>} />
            <Route path="/conta/*" element={<RequireAuth><Lazy><Account /></Lazy></RequireAuth>} />
            <Route path="/entrar" element={<GuestOnly><Lazy><Login /></Lazy></GuestOnly>} />
            <Route path="/cadastro" element={<GuestOnly><Lazy><Register /></Lazy></GuestOnly>} />
            <Route path="/recuperar-senha" element={<GuestOnly><Lazy><ForgotPassword /></Lazy></GuestOnly>} />
            <Route path="/redefinir-senha" element={<Lazy><ResetPassword /></Lazy>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </div>
      {!isCheckout && <Footer />}
      <CartDrawer />
      <SearchOverlay />
      <Flyers />
    </>
  )
}
