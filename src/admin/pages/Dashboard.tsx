import { AlertTriangle, ArrowUpRight, Package, ShoppingBag, TrendingUp, Users, Wallet } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Spinner } from '../../components/CartBits'
import { ProductImage } from '../../components/ProductImage'
import { LOW_STOCK, ORDER_STATUS } from '../../lib/commerce'
import { silk } from '../../lib/easing'
import { money } from '../../lib/format'
import { coverOf } from '../../lib/product'
import { errorMessage } from '../../lib/supabase'
import { useAuth } from '../../store/auth'
import { useAdminOrders, useAdminProducts, useDashboard } from '../data'
import { Alert, PageHeader, Panel, Pill, tdClass, thClass } from '../ui'

export default function Dashboard() {
  const profile = useAuth((s) => s.profile)
  const { data: stats, isLoading, error } = useDashboard()
  const { data: orders = [] } = useAdminOrders()
  const { data: products = [] } = useAdminProducts()

  const lowStock = products
    .flatMap((p) => p.variants.map((v) => ({ product: p, variant: v })))
    .filter(({ variant }) => variant.stock <= LOW_STOCK)
    .sort((a, b) => a.variant.stock - b.variant.stock)
    .slice(0, 6)
  const withoutPhotos = products.filter((p) => p.active && p.images.length === 0).length

  const kpis = stats
    ? [
        { label: 'Faturamento total', value: money(stats.revenue), icon: Wallet },
        { label: 'Últimos 30 dias', value: money(stats.revenue_30d), icon: TrendingUp },
        { label: 'Pedidos', value: String(stats.orders), sub: `${stats.orders_pending} aguardando pagamento`, icon: ShoppingBag, to: '/admin/pedidos' },
        { label: 'Clientes', value: String(stats.customers), icon: Users, to: '/admin/usuarios' },
        { label: 'Produtos ativos', value: String(stats.products_active), sub: withoutPhotos ? `${withoutPhotos} sem fotos` : undefined, icon: Package, to: '/admin/produtos' },
        { label: 'Estoque baixo', value: String(stats.low_stock), sub: `variações com ≤ ${LOW_STOCK} un.`, icon: AlertTriangle, to: '/admin/estoque', warn: stats.low_stock > 0 },
      ]
    : []

  return (
    <div>
      <PageHeader title={`Olá, ${profile?.full_name?.split(' ')[0] ?? 'admin'}`} description="Visão geral da boutique." />

      {error && <Alert>{errorMessage(error)}</Alert>}
      {isLoading && (
        <div className="flex justify-center py-20 text-gold-600">
          <Spinner className="h-8 w-8 border-2" />
        </div>
      )}

      {stats && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
            {kpis.map((k, i) => {
              const content = (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.5, ease: silk }}
                  className={`group h-full rounded-3xl border bg-ivory p-5 transition ${k.warn ? 'border-gold-300' : 'border-linen/80'} ${k.to ? 'hover:shadow-soft' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-full ${k.warn ? 'bg-gold-100 text-gold-700' : 'bg-sand text-cocoa'}`}>
                      <k.icon className="h-4 w-4" />
                    </span>
                    {k.to && <ArrowUpRight className="h-4 w-4 text-taupe transition group-hover:rotate-45" />}
                  </div>
                  <p className="mt-4 text-xs tracking-[0.12em] text-taupe uppercase">{k.label}</p>
                  <p className="mt-1 font-display text-3xl sm:text-4xl">{k.value}</p>
                  {k.sub && <p className="mt-0.5 text-xs text-taupe">{k.sub}</p>}
                </motion.div>
              )
              return k.to ? (
                <Link key={k.label} to={k.to}>
                  {content}
                </Link>
              ) : (
                <div key={k.label}>{content}</div>
              )
            })}
          </div>

          <Panel title="Vendas nos últimos 14 dias" className="mt-6">
            <SalesChart data={stats.sales_by_day} />
          </Panel>
        </>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel
          title="Pedidos recentes"
          actions={
            <Link to="/admin/pedidos" className="text-sm text-gold-700 hover:underline">
              Ver todos
            </Link>
          }
        >
          {orders.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-taupe">Nenhum pedido ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className={thClass}>Pedido</th>
                    <th className={thClass}>Cliente</th>
                    <th className={thClass}>Status</th>
                    <th className={`${thClass} text-right`}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 6).map((o) => (
                    <tr key={o.id} className="border-t border-linen/70">
                      <td className={tdClass}>
                        <p className="font-medium">{o.number}</p>
                        <p className="text-xs text-taupe">{new Date(o.created_at).toLocaleDateString('pt-BR')}</p>
                      </td>
                      <td className={`${tdClass} max-w-[160px] truncate`}>{o.customer.name}</td>
                      <td className={tdClass}>
                        <span className={`rounded-full px-2.5 py-0.5 text-[0.68rem] font-medium whitespace-nowrap ${ORDER_STATUS[o.status].tone}`}>{ORDER_STATUS[o.status].label}</span>
                      </td>
                      <td className={`${tdClass} text-right font-medium`}>{money(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel
          title="Estoque baixo"
          actions={
            <Link to="/admin/estoque?baixo=1" className="text-sm text-gold-700 hover:underline">
              Gerenciar
            </Link>
          }
        >
          {lowStock.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-taupe">Tudo em ordem por aqui ✨</p>
          ) : (
            <ul className="divide-y divide-linen/70">
              {lowStock.map(({ product, variant }) => (
                <li key={variant.id} className="flex items-center gap-3 px-5 py-3">
                  <ProductImage src={coverOf(product, variant.color_name)} alt="" placeholderLabel={false} className="h-12 w-9 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <Link to={`/admin/produtos/${product.id}`} className="block truncate text-sm font-medium hover:text-gold-700">
                      {product.name}
                    </Link>
                    <p className="text-xs text-taupe">
                      {variant.color_name} · {variant.size}
                    </p>
                  </div>
                  <Pill tone={variant.stock === 0 ? 'bad' : 'warn'}>{variant.stock === 0 ? 'Esgotado' : `${variant.stock} un.`}</Pill>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}

/** Barras de uma única série (faturamento diário) com tooltip no hover */
function SalesChart({ data }: { data: { day: string; total: number }[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1, ...data.map((d) => d.total))
  const total = data.reduce((s, d) => s + d.total, 0)
  const fmtDay = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

  return (
    <div className="px-5 pt-4 pb-5">
      <p className="text-sm text-taupe">
        Total no período: <strong className="font-medium text-espresso">{money(total)}</strong>
      </p>
      <div className="relative mt-6 h-52">
        {/* grade recessiva */}
        {[0, 0.5, 1].map((t) => (
          <div key={t} className="absolute inset-x-0 border-t border-linen/70" style={{ bottom: `${t * 100}%` }}>
            <span className="absolute -top-2.5 left-0 bg-ivory pr-2 text-[0.65rem] text-taupe">{money(max * t).replace(',00', '')}</span>
          </div>
        ))}
        <div className="absolute inset-0 left-16 flex items-end gap-[2px]">
          {data.map((d, i) => (
            <div
              key={d.day}
              className="relative flex h-full flex-1 items-end"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              tabIndex={0}
              aria-label={`${fmtDay(d.day)}: ${money(d.total)}`}
            >
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${Math.max((d.total / max) * 100, d.total > 0 ? 2 : 0)}%` }}
                transition={{ duration: 0.8, delay: i * 0.03, ease: silk }}
                className={`w-full rounded-t-[4px] transition-colors ${hover === null || hover === i ? 'bg-gold-500' : 'bg-gold-300'}`}
              />
              {hover === i && (
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-xl bg-espresso px-3 py-2 text-xs whitespace-nowrap text-ivory shadow-lift">
                  <p className="text-ivory/70">{fmtDay(d.day)}</p>
                  <p className="font-medium">{money(d.total)}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 ml-16 flex gap-[2px] text-[0.62rem] text-taupe">
        {data.map((d, i) => (
          <span key={d.day} className="flex-1 text-center">
            {i % 2 === 0 ? fmtDay(d.day) : ''}
          </span>
        ))}
      </div>
    </div>
  )
}
