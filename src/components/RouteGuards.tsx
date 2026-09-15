import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { Dragonfly } from './Brand'

export function FullPageLoader() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3">
      <Dragonfly className="h-20 w-20" />
      <p className="text-xs tracking-[0.3em] text-taupe uppercase">Carregando</p>
    </div>
  )
}

/** Exige usuário logado; redireciona para /entrar guardando a página de origem */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  const location = useLocation()
  if (loading) return <FullPageLoader />
  if (!session) return <Navigate to="/entrar" replace state={{ from: location.pathname + location.search }} />
  return <>{children}</>
}

/** Exige usuário com papel admin */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth()
  const location = useLocation()
  if (loading) return <FullPageLoader />
  if (!session) return <Navigate to="/entrar" replace state={{ from: location.pathname }} />
  if (profile?.role !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}

/** Páginas de login/cadastro: quem já está logado volta para a conta */
export function GuestOnly({ children }: { children: ReactNode }) {
  const { session, profile, loading, recovering } = useAuth()
  const location = useLocation()
  if (loading) return <FullPageLoader />
  if (session && !recovering) {
    // aguarda o perfil para saber se leva ao painel ou à conta
    if (!profile) return <FullPageLoader />
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate to={from ?? (profile.role === 'admin' ? '/admin' : '/conta')} replace />
  }
  return <>{children}</>
}
