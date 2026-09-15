import { ArrowLeft, Check, Clock, Copy, Package, ShoppingBag, Sparkles, Truck } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Blossom, Dragonfly } from '../components/Brand'
import { PixIcon } from '../components/Icons'
import { PageTransition, Reveal } from '../components/motion'
import { silk } from '../lib/easing'
import { Spinner } from '../components/CartBits'
import { ProductImage } from '../components/ProductImage'
import { useOrder } from '../hooks/queries'
import { ORDER_STATUS } from '../lib/commerce'
import { money } from '../lib/format'
import { useUI } from '../store/ui'
import type { Order, OrderStatus } from '../types'

const seeded = (seed: string) => {
  let h = 2166136261
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return () => {
    h ^= h << 13
    h ^= h >>> 17
    h ^= h << 5
    return ((h >>> 0) % 1000) / 1000
  }
}

export default function OrderSuccess() {
  const { number = '' } = useParams()
  const { data: order, isLoading } = useOrder(number)

  if (isLoading) {
    return (
      <PageTransition>
        <div className="flex min-h-[60vh] items-center justify-center text-gold-600">
          <Spinner className="h-8 w-8 border-2" />
        </div>
      </PageTransition>
    )
  }

  if (!order) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-lg px-6 py-24 text-center">
          <Dragonfly className="mx-auto h-24 w-24" />
          <h1 className="mt-4 text-5xl">Pedido não encontrado</h1>
          <p className="mt-2 text-taupe">Verifique se você entrou com a conta que fez a compra.</p>
          <Link to="/conta/pedidos" className="btn btn-primary mt-8">
            Ver meus pedidos
          </Link>
        </div>
      </PageTransition>
    )
  }
  return <OrderView order={order} />
}

function OrderView({ order }: { order: Order }) {
  const firstName = order.customer.name.split(' ')[0]
  // Recém-criado: mostra a celebração; senão, funciona como página de detalhes do pedido
  const [celebrate] = useState(() => Date.now() - new Date(order.created_at).getTime() < 10 * 60 * 1000)
  const status = ORDER_STATUS[order.status]
  const pickup = order.shipping_method === 'retirada'
  const address = order.shipping_address
  const discount = order.coupon_discount + order.payment_discount

  return (
    <PageTransition>
      <section className="relative overflow-hidden bg-gradient-to-b from-gold-50 to-cream pt-14 pb-10">
        {celebrate && <Confetti />}
        <Blossom className="pointer-events-none absolute -bottom-10 -left-10 w-56 opacity-60" />
        <div className="relative mx-auto max-w-2xl px-6 text-center">
          {celebrate ? (
            <SuccessMark />
          ) : (
            <Link to="/conta/pedidos" className="inline-flex items-center gap-2 text-sm text-cocoa hover:text-gold-600">
              <ArrowLeft className="h-4 w-4" /> Meus pedidos
            </Link>
          )}
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: celebrate ? 0.9 : 0.1 }} className="eyebrow mt-6">
            Pedido {order.number} · {new Date(order.created_at).toLocaleDateString('pt-BR')}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: celebrate ? 1 : 0.15, duration: 0.8, ease: silk }}
            className="mt-2 text-5xl sm:text-6xl"
          >
            {celebrate ? (
              <>
                Obrigada, <span className="text-gold-gradient italic">{firstName}</span>!
              </>
            ) : (
              'Detalhes do pedido'
            )}
          </motion.h1>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: celebrate ? 1.2 : 0.2 }} className="mt-4">
            <span className={`inline-block rounded-full px-4 py-1.5 text-xs font-medium tracking-wider uppercase ${status.tone}`}>{status.label}</span>
            {celebrate && (
              <p className="mx-auto mt-3 max-w-md text-cocoa">
                {order.status === 'paid'
                  ? 'Seu pagamento foi aprovado e já estamos separando suas peças com todo carinho.'
                  : 'Seu pedido foi registrado. Assim que o pagamento for confirmado, começamos a preparar tudo.'}
              </p>
            )}
          </motion.div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-6 lg:grid-cols-[1fr_380px] lg:px-8">
        <div className="space-y-8">
          {order.status === 'pending' && order.payment_method === 'pix' && <PixPanel order={order} />}
          {order.status === 'pending' && order.payment_method === 'boleto' && <BoletoPanel order={order} />}
          <Timeline status={order.status} pickup={pickup} />

          <Reveal className="card p-6">
            <h2 className="text-3xl">Itens do pedido</h2>
            <ul className="mt-4 divide-y divide-linen">
              {order.items?.map((l, i) => (
                <motion.li
                  key={l.id}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-4 py-4"
                >
                  <ProductImage src={l.image_url} alt={l.product_name} placeholderLabel={false} className="h-20 w-16 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    {l.product_slug ? (
                      <Link to={`/produto/${l.product_slug}`} className="font-display text-xl leading-tight hover:text-gold-600">
                        {l.product_name}
                      </Link>
                    ) : (
                      <p className="font-display text-xl leading-tight">{l.product_name}</p>
                    )}
                    <p className="text-xs text-taupe">
                      {l.color_name} · Tam. {l.size} · Qtd. {l.quantity}
                    </p>
                  </div>
                  <span className="text-sm">{money(l.unit_price * l.quantity)}</span>
                </motion.li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal className="lg:sticky lg:top-24 lg:self-start">
          <div className="card space-y-5 p-6">
            <div>
              <p className="text-xs font-medium tracking-[0.2em] uppercase">Entrega</p>
              <p className="mt-2 text-sm text-cocoa">
                {pickup || !address ? (
                  'Retirada na boutique'
                ) : (
                  <>
                    {address.street}, {address.number}
                    {address.complement && ` · ${address.complement}`}
                    <br />
                    {address.district} · {address.city}/{address.state} · {address.cep}
                  </>
                )}
              </p>
              <p className="mt-1 text-sm text-gold-700">
                {order.shipping_label} · {order.shipping_eta}
              </p>
            </div>
            <div className="border-t border-linen pt-5">
              <p className="text-xs font-medium tracking-[0.2em] uppercase">Pagamento</p>
              <p className="mt-2 text-sm text-cocoa">
                {order.payment_method === 'pix' && 'Pix'}
                {order.payment_method === 'boleto' && 'Boleto bancário'}
                {order.payment_method === 'card' && `Cartão de crédito · ${order.installments}x de ${money(order.total / order.installments)}`}
              </p>
            </div>
            <dl className="space-y-2 border-t border-linen pt-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-taupe">Subtotal</dt>
                <dd>{money(order.subtotal)}</dd>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-olive-600">
                  <dt>Descontos{order.coupon_code && ` (${order.coupon_code})`}</dt>
                  <dd>- {money(discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-taupe">Frete</dt>
                <dd>{order.shipping_cost === 0 ? 'Grátis' : money(order.shipping_cost)}</dd>
              </div>
            </dl>
            <div className="flex items-baseline justify-between border-t border-linen pt-5">
              <span>Total</span>
              <span className="font-display text-4xl">{money(order.total)}</span>
            </div>
            <Link to="/loja" className="btn btn-primary w-full">
              <ShoppingBag className="h-4 w-4" /> Continuar comprando
            </Link>
          </div>
        </Reveal>
      </div>
    </PageTransition>
  )
}

function SuccessMark() {
  return (
    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.1 }} className="relative mx-auto h-28 w-28">
      <motion.span
        className="absolute inset-0 rounded-full bg-gold-300/40"
        animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, delay: 0.8 }}
      />
      <svg viewBox="0 0 100 100" className="relative h-full w-full">
        <defs>
          <linearGradient id="okg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#D9B876" />
            <stop offset="1" stopColor="#9C7331" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="46" fill="url(#okg)" />
        <motion.path
          d="M30 52 L44 65 L71 37"
          fill="none"
          stroke="#FFFBF6"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.5, duration: 0.6, ease: 'easeOut' }}
        />
      </svg>
    </motion.div>
  )
}

function Confetti() {
  const pieces = useMemo(() => {
    const rnd = seeded('mm-confetti')
    const colors = ['#B8893B', '#D4AF6A', '#E4C98D', '#6B7A3E', '#FFFBF6', '#D9A99A']
    return Array.from({ length: 46 }, (_, i) => ({
      id: i,
      x: (rnd() - 0.5) * 900,
      y: -rnd() * 380 - 60,
      r: rnd() * 720 - 360,
      s: 0.5 + rnd(),
      d: rnd() * 0.3,
      c: colors[i % colors.length],
      shape: i % 3,
    }))
  }, [])
  return (
    <div className="pointer-events-none absolute top-36 left-1/2">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
          animate={{ x: p.x, y: [0, p.y, p.y + 420], opacity: [0, 1, 1, 0], scale: p.s, rotate: p.r }}
          transition={{ duration: 2.6, delay: 0.45 + p.d, ease: [0.15, 0.8, 0.4, 1], times: [0, 0.35, 1] }}
          className={`absolute block ${p.shape === 0 ? 'h-3 w-1.5 rounded-sm' : p.shape === 1 ? 'h-2 w-2 rounded-full' : 'h-2.5 w-2.5 rotate-45'}`}
          style={{ background: p.c }}
        />
      ))}
    </div>
  )
}

function useCopy() {
  const toast = useUI((s) => s.toast)
  return (text: string, label: string) => {
    navigator.clipboard?.writeText(text)
    toast({ title: `${label} copiado!`, tone: 'success' })
  }
}

function PixPanel({ order }: { order: Order }) {
  const copy = useCopy()
  const [left, setLeft] = useState(30 * 60)
  useEffect(() => {
    const t = setInterval(() => setLeft((v) => Math.max(0, v - 1)), 1000)
    return () => clearInterval(t)
  }, [])
  const code = `00020126580014BR.GOV.BCB.PIX0136marinamoura-demo-${order.number.toLowerCase()}5204000053039865406${order.total.toFixed(2)}5802BR5920BOUTIQUE MARINA MOURA6009SAO PAULO62070503***6304ABCD`
  const cells = useMemo(() => {
    const rnd = seeded(order.number)
    return Array.from({ length: 25 * 25 }, (_, i) => {
      const x = i % 25
      const y = Math.floor(i / 25)
      const finder = (fx: number, fy: number) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7
      if (finder(0, 0) || finder(18, 0) || finder(0, 18)) {
        const lx = x >= 18 ? x - 18 : x
        const ly = y >= 18 ? y - 18 : y
        return lx === 0 || lx === 6 || ly === 0 || ly === 6 || (lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4)
      }
      return rnd() > 0.52
    })
  }, [order.number])

  return (
    <Reveal className="card overflow-hidden">
      <div className="grid gap-6 p-6 sm:grid-cols-[auto_1fr] sm:items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: -4 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 1.3, type: 'spring', stiffness: 160, damping: 16 }}
          className="relative mx-auto rounded-2xl border border-linen bg-white p-3"
        >
          <svg viewBox="0 0 25 25" className="h-44 w-44" shapeRendering="crispEdges" aria-label="QR Code Pix (demonstração)">
            {cells.map((on, i) => on && <rect key={i} x={i % 25} y={Math.floor(i / 25)} width="1" height="1" fill="#3B2A1E" />)}
          </svg>
          <span className="absolute top-1/2 left-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg bg-white">
            <PixIcon className="h-7 w-7 text-olive-500" />
          </span>
          <motion.span
            className="absolute inset-x-3 h-0.5 bg-gold-400/80 shadow-[0_0_12px_#D4AF6A]"
            animate={{ top: ['12px', 'calc(100% - 12px)', '12px'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
        <div>
          <p className="flex items-center gap-2 text-xs font-medium tracking-[0.2em] text-olive-600 uppercase">
            <PixIcon className="h-4 w-4" /> Pague com Pix
          </p>
          <p className="mt-2 font-display text-4xl">{money(order.total)}</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-cocoa">
            <Clock className="h-4 w-4 text-gold-600" /> Expira em{' '}
            <span className="font-medium tabular-nums">
              {String(Math.floor(left / 60)).padStart(2, '0')}:{String(left % 60).padStart(2, '0')}
            </span>
          </p>
          <div className="mt-4 flex gap-2">
            <code className="flex-1 truncate rounded-xl bg-sand/60 px-3 py-2.5 text-xs text-cocoa">{code}</code>
            <button onClick={() => copy(code, 'Código Pix')} className="btn btn-primary px-4! py-2.5!">
              <Copy className="h-4 w-4" /> Copiar
            </button>
          </div>
          <p className="mt-3 text-xs text-taupe">Demonstração — este QR Code não realiza cobranças.</p>
        </div>
      </div>
    </Reveal>
  )
}

function BoletoPanel({ order }: { order: Order }) {
  const copy = useCopy()
  const line = `34191.79001 01043.510047 91020.150008 8 ${String(Math.round(order.total * 100)).padStart(10, '0')}`
  const bars = useMemo(() => {
    const rnd = seeded(order.number + 'b')
    return Array.from({ length: 70 }, () => 1 + Math.floor(rnd() * 3))
  }, [order.number])
  let x = 0
  return (
    <Reveal className="card p-6">
      <p className="text-xs font-medium tracking-[0.2em] text-gold-700 uppercase">Boleto bancário</p>
      <p className="mt-2 font-display text-4xl">{money(order.total)}</p>
      <p className="text-sm text-taupe">Vencimento em 3 dias úteis</p>
      <svg viewBox="0 0 200 40" className="mt-4 h-16 w-full" preserveAspectRatio="none" aria-hidden>
        {bars.map((w, i) => {
          const rect = i % 2 === 0 ? <rect key={i} x={x} y="0" width={w} height="40" fill="#3B2A1E" /> : null
          x += w * 0.95
          return rect
        })}
      </svg>
      <div className="mt-4 flex flex-wrap gap-2">
        <code className="flex-1 rounded-xl bg-sand/60 px-3 py-2.5 text-xs text-cocoa">{line}</code>
        <button onClick={() => copy(line.replace(/\D/g, ''), 'Linha digitável')} className="btn btn-primary px-4! py-2.5!">
          <Copy className="h-4 w-4" /> Copiar
        </button>
      </div>
    </Reveal>
  )
}

function Timeline({ status, pickup }: { status: OrderStatus; pickup: boolean }) {
  const rank: Record<OrderStatus, number> = { pending: 1, paid: 2, preparing: 3, shipped: 4, delivered: 4, cancelled: 0 }
  const reached = rank[status]
  const steps = [
    { icon: Check, title: 'Pedido recebido', text: 'Recebemos seu pedido', done: reached >= 1 },
    { icon: Sparkles, title: 'Pagamento', text: reached >= 2 ? 'Aprovado' : 'Aguardando confirmação', done: reached >= 2 },
    { icon: Package, title: 'Separação', text: 'Embalagem especial Marina Moura', done: reached >= 3 },
    {
      icon: Truck,
      title: pickup ? 'Pronto para retirada' : status === 'delivered' ? 'Entregue' : 'Enviado',
      text: pickup ? 'Avisaremos pelo WhatsApp' : 'Código de rastreio por e-mail',
      done: reached >= 4,
    },
  ]
  if (status === 'cancelled') {
    return (
      <Reveal className="card p-6">
        <h2 className="text-3xl">Pedido cancelado</h2>
        <p className="mt-2 text-sm text-cocoa">Este pedido foi cancelado. Se tiver dúvidas, fale com nosso atendimento.</p>
      </Reveal>
    )
  }
  const doneCount = steps.filter((s) => s.done).length
  return (
    <Reveal className="card p-6">
      <h2 className="text-3xl">Acompanhe</h2>
      <ol className="relative mt-6 grid gap-6 sm:grid-cols-4 sm:gap-2">
        <div className="absolute top-5 right-[12.5%] left-[12.5%] hidden h-px bg-linen sm:block" />
        <motion.div
          className="absolute top-5 left-[12.5%] hidden h-px bg-gold-500 sm:block"
          initial={{ width: 0 }}
          whileInView={{ width: `${((doneCount - 1) / 3) * 75}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.3, ease: silk }}
        />
        {steps.map((s, i) => (
          <motion.li
            key={s.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 + i * 0.12 }}
            className="relative flex items-center gap-4 sm:flex-col sm:text-center"
          >
            <span className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${s.done ? 'border-gold-500 bg-gold-500 text-ivory' : 'border-linen bg-ivory text-taupe'}`}>
              <s.icon className="h-4 w-4" />
              {!s.done && i === doneCount && (
                <motion.span className="absolute inset-0 rounded-full border border-gold-400" animate={{ scale: [1, 1.5], opacity: [1, 0] }} transition={{ duration: 1.6, repeat: Infinity }} />
              )}
            </span>
            <div>
              <p className="text-sm font-medium">{s.title}</p>
              <p className="text-xs text-taupe">{s.text}</p>
            </div>
          </motion.li>
        ))}
      </ol>
    </Reveal>
  )
}
