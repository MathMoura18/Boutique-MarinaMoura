import type { AppliedCoupon, OrderStatus, ShippingOption } from '../types'

/*
 * Regras comerciais exibidas na loja.
 * O valor final do pedido é recalculado no banco (função place_order) — mantenha os dois em sincronia.
 */
export const FREE_SHIPPING_THRESHOLD = 299
export const PIX_DISCOUNT = 0.05
export const MAX_INSTALLMENTS = 6
export const LOW_STOCK = 3

export const couponDiscount = (coupon: AppliedCoupon | null, subtotal: number) => {
  if (!coupon || subtotal < coupon.min_subtotal) return 0
  if (coupon.discount_type === 'percent') return Math.round(subtotal * coupon.value) / 100
  if (coupon.discount_type === 'fixed') return Math.min(coupon.value, subtotal)
  return 0
}

export const couponLabel = (c: Pick<AppliedCoupon, 'discount_type' | 'value'>) =>
  c.discount_type === 'percent'
    ? `${c.value}% de desconto`
    : c.discount_type === 'fixed'
      ? `R$ ${c.value.toFixed(2).replace('.', ',')} de desconto`
      : 'Frete grátis'

export const shippingOptions = (subtotal: number, cep?: string, freeShippingCoupon = false): ShippingOption[] => {
  const first = Number(cep?.[0] ?? 0)
  const near = first <= 3 || first >= 8
  const free = freeShippingCoupon || subtotal >= FREE_SHIPPING_THRESHOLD
  return [
    { id: 'pac', label: 'Econômica', eta: near ? '5 a 8 dias úteis' : '8 a 12 dias úteis', price: free ? 0 : near ? 19.9 : 27.9 },
    { id: 'sedex', label: 'Expressa', eta: near ? '2 a 3 dias úteis' : '3 a 5 dias úteis', price: near ? 34.9 : 46.9 },
    { id: 'retirada', label: 'Retirar na boutique', eta: 'Pronto em 24h', price: 0 },
  ]
}

export const installmentsFor = (total: number) =>
  Array.from({ length: MAX_INSTALLMENTS }, (_, i) => i + 1).filter((n) => n === 1 || total / n >= 50)

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: string }> = {
  pending: { label: 'Aguardando pagamento', tone: 'bg-gold-100 text-gold-700' },
  paid: { label: 'Pago', tone: 'bg-olive-100 text-olive-700' },
  preparing: { label: 'Em separação', tone: 'bg-sand text-cocoa' },
  shipped: { label: 'Enviado', tone: 'bg-[#E3E8F0] text-[#46556B]' },
  delivered: { label: 'Entregue', tone: 'bg-olive-500 text-ivory' },
  cancelled: { label: 'Cancelado', tone: 'bg-rose/15 text-rose' },
}

const DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g')

export const normalizeText = (s: string) => s.normalize('NFD').replace(DIACRITICS, '').toLowerCase()

export const slugify = (s: string) =>
  normalizeText(s)
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
