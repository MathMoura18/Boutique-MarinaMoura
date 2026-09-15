import { ChevronDown } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Fragment, useState } from 'react'
import { Spinner } from '../../components/CartBits'
import { ProductImage } from '../../components/ProductImage'
import { normalizeText, ORDER_STATUS } from '../../lib/commerce'
import { money } from '../../lib/format'
import { errorMessage, supabase } from '../../lib/supabase'
import { useUI } from '../../store/ui'
import type { Order, OrderStatus } from '../../types'
import { useAdminOrders, useInvalidate } from '../data'
import { Alert, EmptyState, PageHeader, Panel, SearchInput, tdClass, thClass } from '../ui'

const PAYMENT = { pix: 'Pix', card: 'Cartão', boleto: 'Boleto' }

export default function OrdersAdmin() {
  const { data: orders = [], isLoading, error } = useAdminOrders()
  const invalidate = useInvalidate()
  const toast = useUI((s) => s.toast)
  const [status, setStatus] = useState<OrderStatus | 'all'>('all')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<string | null>(null)

  const list = orders.filter(
    (o) => (status === 'all' || o.status === status) && (!q || normalizeText(`${o.number} ${o.customer.name} ${o.customer.email}`).includes(normalizeText(q))),
  )

  const updateStatus = async (order: Order, next: OrderStatus) => {
    const { error } = await supabase.from('orders').update({ status: next }).eq('id', order.id)
    if (error) return toast({ title: 'Erro ao atualizar', description: errorMessage(error) })
    toast({ title: `Pedido ${order.number}`, description: ORDER_STATUS[next].label, tone: 'success' })
    invalidate('orders', 'dashboard')
  }

  return (
    <div>
      <PageHeader title="Pedidos" description="Acompanhe e atualize o status dos pedidos." actions={<SearchInput value={q} onChange={setQ} placeholder="Nº, cliente ou e-mail" />} />

      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {(['all', ...Object.keys(ORDER_STATUS)] as (OrderStatus | 'all')[]).map((s) => {
          const count = s === 'all' ? orders.length : orders.filter((o) => o.status === s).length
          return (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs transition ${status === s ? 'border-espresso bg-espresso text-ivory' : 'border-linen bg-ivory hover:border-gold-300'}`}
            >
              {s === 'all' ? 'Todos' : ORDER_STATUS[s].label} <span className="opacity-60">({count})</span>
            </button>
          )
        })}
      </div>

      {error && <Alert>{errorMessage(error)}</Alert>}

      <Panel>
        {isLoading ? (
          <div className="flex justify-center py-16 text-gold-600">
            <Spinner className="h-7 w-7 border-2" />
          </div>
        ) : list.length === 0 ? (
          <EmptyState title="Nenhum pedido encontrado" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className={thClass}>Pedido</th>
                  <th className={thClass}>Cliente</th>
                  <th className={thClass}>Pagamento</th>
                  <th className={thClass}>Total</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass} />
                </tr>
              </thead>
              <tbody>
                {list.map((o) => (
                  <Fragment key={o.id}>
                    <tr className="border-t border-linen/70">
                      <td className={tdClass}>
                        <p className="font-medium">{o.number}</p>
                        <p className="text-xs text-taupe">{new Date(o.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</p>
                      </td>
                      <td className={tdClass}>
                        <p className="max-w-[200px] truncate">{o.customer.name}</p>
                        <p className="max-w-[200px] truncate text-xs text-taupe">{o.customer.email}</p>
                      </td>
                      <td className={`${tdClass} whitespace-nowrap`}>
                        {PAYMENT[o.payment_method]}
                        {o.payment_method === 'card' && o.installments > 1 && <span className="text-taupe"> · {o.installments}x</span>}
                      </td>
                      <td className={`${tdClass} font-medium whitespace-nowrap`}>{money(o.total)}</td>
                      <td className={tdClass}>
                        <select
                          value={o.status}
                          onChange={(e) => updateStatus(o, e.target.value as OrderStatus)}
                          className={`cursor-pointer rounded-full border-0 px-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-gold-300 focus:outline-none ${ORDER_STATUS[o.status].tone}`}
                          aria-label={`Status do pedido ${o.number}`}
                        >
                          {Object.entries(ORDER_STATUS).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className={`${tdClass} text-right`}>
                        <button onClick={() => setOpen(open === o.id ? null : o.id)} className="rounded-full p-2 hover:bg-sand" aria-label="Detalhes" aria-expanded={open === o.id}>
                          <motion.span animate={{ rotate: open === o.id ? 180 : 0 }} className="block">
                            <ChevronDown className="h-4 w-4" />
                          </motion.span>
                        </button>
                      </td>
                    </tr>
                    <AnimatePresence>
                      {open === o.id && (
                        <tr>
                          <td colSpan={6} className="p-0">
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-cream/60">
                              <OrderDetails order={o} />
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}

function OrderDetails({ order }: { order: Order }) {
  const a = order.shipping_address
  return (
    <div className="grid gap-6 px-5 py-5 md:grid-cols-[1.4fr_1fr]">
      <ul className="space-y-3">
        {order.items?.map((it) => (
          <li key={it.id} className="flex items-center gap-3">
            <ProductImage src={it.image_url} alt="" placeholderLabel={false} className="h-14 w-11 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{it.product_name}</p>
              <p className="text-xs text-taupe">
                {it.color_name} · {it.size} · {it.quantity}x {money(it.unit_price)}
              </p>
            </div>
            <span>{money(it.unit_price * it.quantity)}</span>
          </li>
        ))}
      </ul>
      <div className="space-y-3 text-sm">
        <div>
          <p className="text-xs font-medium tracking-[0.12em] text-taupe uppercase">Contato</p>
          <p>
            {order.customer.phone} · CPF {order.customer.cpf}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-[0.12em] text-taupe uppercase">Entrega</p>
          <p>
            {order.shipping_label} · {order.shipping_eta}
          </p>
          {a && (
            <p className="text-cocoa">
              {a.street}, {a.number} {a.complement} — {a.district}, {a.city}/{a.state} · {a.cep}
            </p>
          )}
        </div>
        <div className="space-y-1 border-t border-linen pt-3">
          <p className="flex justify-between">
            <span className="text-taupe">Subtotal</span> {money(order.subtotal)}
          </p>
          {order.coupon_discount > 0 && (
            <p className="flex justify-between text-olive-600">
              <span>Cupom {order.coupon_code}</span> - {money(order.coupon_discount)}
            </p>
          )}
          {order.payment_discount > 0 && (
            <p className="flex justify-between text-olive-600">
              <span>Desconto Pix</span> - {money(order.payment_discount)}
            </p>
          )}
          <p className="flex justify-between">
            <span className="text-taupe">Frete</span> {order.shipping_cost ? money(order.shipping_cost) : 'Grátis'}
          </p>
          <p className="flex justify-between font-medium">
            <span>Total</span> {money(order.total)}
          </p>
        </div>
      </div>
    </div>
  )
}
