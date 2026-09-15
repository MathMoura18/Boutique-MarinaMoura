import { ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Spinner } from '../../components/CartBits'
import { normalizeText } from '../../lib/commerce'
import { errorMessage, supabase } from '../../lib/supabase'
import { useAuth } from '../../store/auth'
import { useUI } from '../../store/ui'
import type { Profile, Role } from '../../types'
import { useAdminOrders, useInvalidate, useProfiles } from '../data'
import { Alert, confirmAction, EmptyState, PageHeader, Panel, Pill, SearchInput, tdClass, thClass } from '../ui'

export default function UsersAdmin() {
  const { data: profiles = [], isLoading, error } = useProfiles()
  const { data: orders = [] } = useAdminOrders()
  const me = useAuth((s) => s.profile)
  const invalidate = useInvalidate()
  const toast = useUI((s) => s.toast)
  const [q, setQ] = useState('')
  const [role, setRole] = useState<Role | 'all'>('all')

  const list = profiles.filter((p) => (role === 'all' || p.role === role) && (!q || normalizeText(`${p.full_name} ${p.email} ${p.phone ?? ''}`).includes(normalizeText(q))))

  const changeRole = async (p: Profile, next: Role) => {
    if (p.id === me?.id) return toast({ title: 'Você não pode alterar o próprio acesso' })
    const ok = await confirmAction({
      title: next === 'admin' ? 'Tornar administrador' : 'Remover acesso de administrador',
      description:
        next === 'admin'
          ? `${p.full_name || p.email} terá acesso completo ao painel: produtos, estoque, pedidos, cupons e usuários.`
          : `${p.full_name || p.email} passará a ser um cliente comum.`,
      confirmLabel: next === 'admin' ? 'Conceder acesso' : 'Remover acesso',
      danger: next === 'admin',
    })
    if (!ok) return
    const { error } = await supabase.from('profiles').update({ role: next }).eq('id', p.id)
    if (error) return toast({ title: 'Erro', description: errorMessage(error) })
    toast({ title: 'Acesso atualizado', description: p.email, tone: 'success' })
    invalidate('profiles', 'dashboard')
  }

  return (
    <div>
      <PageHeader title="Usuários" description="Clientes cadastrados e administradores da loja." actions={<SearchInput value={q} onChange={setQ} placeholder="Nome, e-mail ou telefone" />} />
      <div className="mb-4 flex gap-2">
        {(
          [
            ['all', `Todos (${profiles.length})`],
            ['customer', `Clientes (${profiles.filter((p) => p.role === 'customer').length})`],
            ['admin', `Administradores (${profiles.filter((p) => p.role === 'admin').length})`],
          ] as [Role | 'all', string][]
        ).map(([r, label]) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={`rounded-full border px-4 py-2 text-xs transition ${role === r ? 'border-espresso bg-espresso text-ivory' : 'border-linen bg-ivory hover:border-gold-300'}`}
          >
            {label}
          </button>
        ))}
      </div>
      {error && <Alert>{errorMessage(error)}</Alert>}
      <Panel>
        {isLoading ? (
          <div className="flex justify-center py-16 text-gold-600">
            <Spinner className="h-7 w-7 border-2" />
          </div>
        ) : list.length === 0 ? (
          <EmptyState title="Nenhum usuário encontrado" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className={thClass}>Usuário</th>
                  <th className={thClass}>Contato</th>
                  <th className={thClass}>Cadastro</th>
                  <th className={thClass}>Pedidos</th>
                  <th className={thClass}>Acesso</th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => {
                  const count = orders.filter((o) => o.user_id === p.id).length
                  const initials = (p.full_name || p.email)
                    .split(' ')
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()
                  return (
                    <tr key={p.id} className="border-t border-linen/70">
                      <td className={tdClass}>
                        <div className="flex items-center gap-3">
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${p.role === 'admin' ? 'bg-gold-gradient text-ivory' : 'bg-sand text-cocoa'}`}>{initials}</span>
                          <div className="min-w-0">
                            <p className="max-w-[220px] truncate font-medium">
                              {p.full_name || '—'} {p.id === me?.id && <span className="text-xs text-taupe">(você)</span>}
                            </p>
                            <p className="max-w-[220px] truncate text-xs text-taupe">{p.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className={`${tdClass} text-xs whitespace-nowrap text-cocoa`}>{p.phone || '—'}</td>
                      <td className={`${tdClass} whitespace-nowrap`}>{new Date(p.created_at).toLocaleDateString('pt-BR')}</td>
                      <td className={tdClass}>{count}</td>
                      <td className={tdClass}>
                        {p.id === me?.id ? (
                          <Pill tone="gold">
                            <ShieldCheck className="mr-1 h-3 w-3" /> Administrador
                          </Pill>
                        ) : (
                          <select
                            value={p.role}
                            onChange={(e) => changeRole(p, e.target.value as Role)}
                            className={`cursor-pointer rounded-full border-0 px-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-gold-300 focus:outline-none ${p.role === 'admin' ? 'bg-gold-100 text-gold-700' : 'bg-sand text-cocoa'}`}
                            aria-label={`Acesso de ${p.email}`}
                          >
                            <option value="customer">Cliente</option>
                            <option value="admin">Administrador</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}
