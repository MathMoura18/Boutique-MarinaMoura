import { ChevronRight, KeyRound, LayoutDashboard, LogOut, Package, UserRound } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Dragonfly } from '../components/Brand'
import { Spinner } from '../components/CartBits'
import { Alert, FormField } from '../components/FormField'
import { PageTransition } from '../components/motion'
import { ProductImage } from '../components/ProductImage'
import { useMyOrders } from '../hooks/queries'
import { ORDER_STATUS } from '../lib/commerce'
import { silk } from '../lib/easing'
import { masks, money, validators } from '../lib/format'
import { errorMessage, supabase } from '../lib/supabase'
import { useAuth } from '../store/auth'
import { useUI } from '../store/ui'
import type { Profile } from '../types'

const TABS = [
  { to: '/conta', label: 'Meus dados', icon: UserRound },
  { to: '/conta/pedidos', label: 'Meus pedidos', icon: Package },
  { to: '/conta/seguranca', label: 'Segurança', icon: KeyRound },
]

export default function Account() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { profile, session, signOut } = useAuth()
  const firstName = profile?.full_name?.split(' ')[0] || 'cliente'

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 lg:px-8">
        <p className="eyebrow">Minha conta</p>
        <h1 className="mt-2 text-5xl sm:text-6xl">Olá, {firstName}</h1>
        <p className="mt-1 text-taupe">{session?.user.email}</p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[240px_1fr]">
          <aside>
            <nav className="no-scrollbar flex gap-2 overflow-x-auto lg:flex-col">
              {TABS.map((t) => (
                <NavLink
                  key={t.to}
                  to={t.to}
                  end
                  className={({ isActive }) =>
                    `relative flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${isActive ? 'text-ivory' : 'text-cocoa hover:bg-sand'}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <motion.span layoutId="account-tab" className="absolute inset-0 rounded-2xl bg-espresso" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
                      <t.icon className="relative h-4 w-4" />
                      <span className="relative">{t.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
              {profile?.role === 'admin' && (
                <Link to="/admin" className="flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-gold-700 transition hover:bg-gold-50">
                  <LayoutDashboard className="h-4 w-4" /> Painel admin
                </Link>
              )}
              <button
                onClick={async () => {
                  await signOut()
                  navigate('/')
                }}
                className="flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-cocoa transition hover:bg-sand lg:mt-4 lg:border-t lg:border-linen"
              >
                <LogOut className="h-4 w-4" /> Sair
              </button>
            </nav>
          </aside>

          <AnimatePresence mode="wait">
            <motion.section key={pathname} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35, ease: silk }}>
              {pathname === '/conta/pedidos' ? <OrdersTab /> : pathname === '/conta/seguranca' ? <SecurityTab /> : <ProfileTab />}
            </motion.section>
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  )
}

function ProfileTab() {
  const profile = useAuth((s) => s.profile)
  if (!profile) return <Spinner className="h-6 w-6 border-2 text-gold-600" />
  return <ProfileForm key={profile.id} profile={profile} />
}

function ProfileForm({ profile }: { profile: Profile }) {
  const loadProfile = useAuth((s) => s.loadProfile)
  const toast = useUI((s) => s.toast)
  const [form, setForm] = useState({ full_name: profile.full_name, phone: profile.phone ?? '', cpf: profile.cpf ?? '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="card p-6 sm:p-8">
      <h2 className="text-3xl">Meus dados</h2>
      <p className="mt-1 text-sm text-taupe">Usados para agilizar suas próximas compras.</p>
      <form
        className="mt-6 grid gap-5 sm:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault()
          const errs: Record<string, string> = {}
          if (!validators.name(form.full_name)) errs.full_name = 'Informe nome e sobrenome'
          if (form.phone && !validators.phone(form.phone)) errs.phone = 'Telefone inválido'
          if (form.cpf && !validators.cpf(form.cpf)) errs.cpf = 'CPF inválido'
          setErrors(errs)
          if (Object.keys(errs).length) return
          setSaving(true)
          setError(null)
          const { error } = await supabase
            .from('profiles')
            .update({ full_name: form.full_name.trim(), phone: form.phone || null, cpf: form.cpf || null })
            .eq('id', profile.id)
          setSaving(false)
          if (error) return setError(errorMessage(error))
          await loadProfile()
          toast({ title: 'Dados atualizados', tone: 'success' })
        }}
      >
        {error && (
          <div className="sm:col-span-2">
            <Alert>{error}</Alert>
          </div>
        )}
        <FormField label="Nome completo" className="sm:col-span-2" value={form.full_name} error={errors.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
        <FormField label="E-mail" className="sm:col-span-2" value={profile.email} disabled hint="Para alterar o e-mail, fale com o atendimento." />
        <FormField label="Celular" inputMode="tel" value={form.phone} error={errors.phone} onChange={(e) => setForm((f) => ({ ...f, phone: masks.phone(e.target.value) }))} />
        <FormField label="CPF" inputMode="numeric" value={form.cpf} error={errors.cpf} onChange={(e) => setForm((f) => ({ ...f, cpf: masks.cpf(e.target.value) }))} />
        <div className="sm:col-span-2">
          <button className="btn btn-primary" disabled={saving}>
            {saving ? <Spinner /> : 'Salvar alterações'}
          </button>
        </div>
      </form>
    </div>
  )
}

function OrdersTab() {
  const { data: orders, isLoading, error } = useMyOrders()

  if (isLoading) return <Spinner className="h-6 w-6 border-2 text-gold-600" />
  if (error) return <Alert>{errorMessage(error)}</Alert>

  if (!orders?.length) {
    return (
      <div className="card flex flex-col items-center px-6 py-16 text-center">
        <Dragonfly className="h-24 w-24" />
        <h2 className="mt-4 text-3xl">Nenhum pedido ainda</h2>
        <p className="mt-2 text-taupe">Quando você comprar, seus pedidos aparecem aqui.</p>
        <Link to="/loja" className="btn btn-primary mt-6">
          Explorar a loja
        </Link>
      </div>
    )
  }

  return (
    <ul className="space-y-4">
      {orders.map((o, i) => {
        const status = ORDER_STATUS[o.status]
        const count = o.items?.reduce((n, it) => n + it.quantity, 0) ?? 0
        return (
          <motion.li key={o.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link to={`/pedido/${o.number}`} className="card group flex flex-col gap-4 p-5 transition hover:shadow-soft sm:flex-row sm:items-center">
              <div className="flex -space-x-3">
                {o.items?.slice(0, 3).map((it) => (
                  <ProductImage key={it.id} src={it.image_url} alt={it.product_name} placeholderLabel={false} className="h-16 w-12 rounded-xl border-2 border-ivory" />
                ))}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-2xl">Pedido {o.number}</p>
                  <span className={`rounded-full px-2.5 py-0.5 text-[0.65rem] font-medium tracking-wider uppercase ${status.tone}`}>{status.label}</span>
                </div>
                <p className="text-sm text-taupe">
                  {new Date(o.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} · {count} {count === 1 ? 'item' : 'itens'}
                </p>
              </div>
              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <span className="font-medium">{money(o.total)}</span>
                <ChevronRight className="h-5 w-5 text-taupe transition group-hover:translate-x-1" />
              </div>
            </Link>
          </motion.li>
        )
      })}
    </ul>
  )
}

function SecurityTab() {
  const session = useAuth((s) => s.session)
  const toast = useUI((s) => s.toast)
  const [current, setCurrent] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  return (
    <div className="card p-6 sm:p-8">
      <h2 className="text-3xl">Alterar senha</h2>
      <p className="mt-1 text-sm text-taupe">Por segurança, confirme sua senha atual.</p>
      <form
        className="mt-6 max-w-md space-y-5"
        onSubmit={async (e) => {
          e.preventDefault()
          if (password.length < 8) return setError('A nova senha deve ter pelo menos 8 caracteres.')
          if (password !== confirm) return setError('As senhas não conferem.')
          setSaving(true)
          setError(null)
          // Reautentica com a senha atual antes de trocar
          const { error: authError } = await supabase.auth.signInWithPassword({ email: session!.user.email!, password: current })
          if (authError) {
            setSaving(false)
            return setError('Senha atual incorreta.')
          }
          const { error } = await supabase.auth.updateUser({ password })
          setSaving(false)
          if (error) return setError(errorMessage(error))
          setCurrent('')
          setPassword('')
          setConfirm('')
          toast({ title: 'Senha alterada com sucesso', tone: 'success' })
        }}
      >
        {error && <Alert>{error}</Alert>}
        <FormField label="Senha atual" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
        <FormField label="Nova senha" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} hint="Mínimo de 8 caracteres" required />
        <FormField label="Confirmar nova senha" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        <button className="btn btn-primary" disabled={saving}>
          {saving ? <Spinner /> : 'Atualizar senha'}
        </button>
      </form>
    </div>
  )
}
