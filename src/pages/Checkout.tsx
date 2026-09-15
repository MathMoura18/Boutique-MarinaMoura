import { AlertCircle, ArrowLeft, ArrowRight, Barcode, Check, ChevronDown, ClipboardCheck, CreditCard, Info, Lock, MapPin, Pencil, Store, Truck, User } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState, type Dispatch, type InputHTMLAttributes, type ReactNode, type Ref, type SetStateAction } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Dragonfly, LogoMark } from '../components/Brand'
import { CouponField } from '../components/CartBits'
import { PixIcon } from '../components/Icons'
import { PageTransition } from '../components/motion'
import { silk } from '../lib/easing'
import { ProductImage } from '../components/ProductImage'
import { installmentsFor, PIX_DISCOUNT, shippingOptions } from '../lib/commerce'
import { cardBrand, masks, money, onlyDigits, validators } from '../lib/format'
import { errorMessage, supabase } from '../lib/supabase'
import { useAuth } from '../store/auth'
import { cartTotals, useCart } from '../store/cart'
import { useUI } from '../store/ui'
import type { Address, Customer, PaymentMethod } from '../types'

const STEPS = [
  { id: 0, label: 'Identificação', icon: User },
  { id: 1, label: 'Entrega', icon: Truck },
  { id: 2, label: 'Pagamento', icon: CreditCard },
  { id: 3, label: 'Revisão', icon: ClipboardCheck },
]

interface CardData {
  number: string
  name: string
  expiry: string
  cvv: string
}

type Errors = Record<string, string>

export default function Checkout() {
  const navigate = useNavigate()
  const { items, coupon, clear } = useCart()
  const { session, profile } = useAuth()
  const queryClient = useQueryClient()
  const toast = useUI((s) => s.toast)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [maxStep, setMaxStep] = useState(0)
  const [errors, setErrors] = useState<Errors>({})
  const [processing, setProcessing] = useState(false)

  const [customer, setCustomer] = useState<Customer>({
    name: profile?.full_name ?? '',
    email: profile?.email ?? session?.user.email ?? '',
    cpf: profile?.cpf ?? '',
    phone: profile?.phone ?? '',
  })
  const [address, setAddress] = useState<Address>({ cep: '', street: '', number: '', complement: '', district: '', city: '', state: '' })
  const [shippingId, setShippingId] = useState('pac')
  const [payment, setPayment] = useState<PaymentMethod>('pix')
  const [card, setCard] = useState<CardData>({ number: '', name: '', expiry: '', cvv: '' })
  const [installments, setInstallments] = useState(1)

  const { subtotal, discount: couponDiscount, freeShipping } = cartTotals(items, coupon)
  // Preenche com os dados do perfil assim que ele carregar
  useEffect(() => {
    if (!profile) return
    setCustomer((c) => ({
      name: c.name || profile.full_name,
      email: c.email || profile.email,
      cpf: c.cpf || (profile.cpf ?? ''),
      phone: c.phone || (profile.phone ?? ''),
    }))
  }, [profile])

  const options = shippingOptions(subtotal - couponDiscount, onlyDigits(address.cep), freeShipping)
  const shipping = options.find((o) => o.id === shippingId) ?? options[0]
  const shippingCost = shipping.price
  const pixDiscount = payment === 'pix' ? (subtotal - couponDiscount) * PIX_DISCOUNT : 0
  const total = subtotal - couponDiscount - pixDiscount + shippingCost

  if (items.length === 0 && !processing) {
    return (
      <PageTransition>
        <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center">
          <Dragonfly className="h-28 w-28" />
          <h1 className="mt-4 text-5xl">Nada para finalizar</h1>
          <p className="mt-2 text-taupe">Sua sacola está vazia. Escolha suas peças favoritas e volte aqui.</p>
          <Link to="/loja" className="btn btn-primary mt-8">
            Ir para a loja
          </Link>
        </div>
      </PageTransition>
    )
  }

  const validate = (s: number): Errors => {
    const e: Errors = {}
    if (s === 0) {
      if (!validators.name(customer.name)) e.name = 'Informe nome e sobrenome'
      if (!validators.email(customer.email)) e.email = 'E-mail inválido'
      if (!validators.cpf(customer.cpf)) e.cpf = 'CPF inválido'
      if (!validators.phone(customer.phone)) e.phone = 'Telefone inválido'
    }
    if (s === 1 && shipping.id !== 'retirada') {
      if (!validators.cep(address.cep)) e.cep = 'CEP inválido'
      if (!address.street.trim()) e.street = 'Informe o endereço'
      if (!address.number.trim()) e.number = 'Nº obrigatório'
      if (!address.district.trim()) e.district = 'Informe o bairro'
      if (!address.city.trim()) e.city = 'Informe a cidade'
      if (address.state.trim().length !== 2) e.state = 'UF'
    }
    if (s === 2 && payment === 'card') {
      if (!validators.card(card.number)) e.cardNumber = 'Número de cartão inválido'
      if (!validators.name(card.name)) e.cardName = 'Nome como impresso no cartão'
      if (!validators.expiry(card.expiry)) e.expiry = 'Validade inválida'
      if (!validators.cvv(card.cvv)) e.cvv = 'CVV inválido'
    }
    return e
  }

  const go = (to: number) => {
    setDir(to > step ? 1 : -1)
    setStep(to)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const next = () => {
    const e = validate(step)
    setErrors(e)
    if (Object.keys(e).length) return
    const to = step + 1
    setMaxStep((m) => Math.max(m, to))
    go(to)
  }

  const finish = async () => {
    setProcessing(true)
    setSubmitError(null)
    const started = Date.now()
    try {
      const { data, error } = await supabase.rpc('place_order', {
        p_items: items.map((i) => ({ variant_id: i.variantId, quantity: i.qty })),
        p_customer: customer,
        p_address: address,
        p_shipping_method: shipping.id,
        p_payment_method: payment,
        p_installments: payment === 'card' ? installments : 1,
        p_coupon_code: coupon?.code ?? null,
      })
      if (error) throw error
      const created = (data as { id: string; number: string }[])[0]

      // Guarda telefone e CPF no perfil para as próximas compras
      if (session && (!profile?.phone || !profile?.cpf || !profile?.full_name)) {
        supabase
          .from('profiles')
          .update({ full_name: profile?.full_name || customer.name, phone: profile?.phone || customer.phone, cpf: profile?.cpf || customer.cpf })
          .eq('id', session.user.id)
          .then(() => useAuth.getState().loadProfile())
      }

      await new Promise((r) => setTimeout(r, Math.max(0, 1800 - (Date.now() - started))))
      clear()
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      navigate(`/pedido/${created.number}`, { replace: true })
    } catch (err) {
      setProcessing(false)
      const message = errorMessage(err)
      setSubmitError(message)
      toast({ title: 'Não foi possível concluir o pedido', description: message })
    }
  }

  const field = <K extends keyof Customer>(k: K) => ({
    value: customer[k],
    error: errors[k],
    onChange: (v: string) => setCustomer((c) => ({ ...c, [k]: v })),
  })
  const addr = <K extends keyof Address>(k: K) => ({
    value: address[k],
    error: errors[k],
    onChange: (v: string) => setAddress((a) => ({ ...a, [k]: v })),
  })

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-4 pt-8 pb-16 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link to="/carrinho" className="inline-flex items-center gap-2 text-sm text-cocoa hover:text-gold-600">
            <ArrowLeft className="h-4 w-4" /> Voltar à sacola
          </Link>
          <p className="flex items-center gap-1.5 text-xs tracking-wider text-olive-600 uppercase">
            <Lock className="h-3.5 w-3.5" /> Checkout seguro
          </p>
        </div>
        <h1 className="mt-4 text-5xl sm:text-6xl">Finalizar compra</h1>

        <Stepper step={step} maxStep={maxStep} onGo={(s) => s <= maxStep && go(s)} />

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_400px]">
          <div className="relative">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={step}
                custom={dir}
                variants={{
                  enter: (d: number) => ({ opacity: 0, x: d * 50 }),
                  center: { opacity: 1, x: 0 },
                  exit: (d: number) => ({ opacity: 0, x: d * -50 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.45, ease: silk }}
                className="card p-6 sm:p-8"
              >
                {step === 0 && (
                  <StepShell title="Seus dados" subtitle="Usaremos para enviar as atualizações do pedido.">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Nome completo" autoComplete="name" className="sm:col-span-2" {...field('name')} />
                      <Field label="E-mail" type="email" autoComplete="email" className="sm:col-span-2" {...field('email')} />
                      <Field label="CPF" inputMode="numeric" {...field('cpf')} onChange={(v) => setCustomer((c) => ({ ...c, cpf: masks.cpf(v) }))} />
                      <Field label="Celular / WhatsApp" inputMode="tel" autoComplete="tel" {...field('phone')} onChange={(v) => setCustomer((c) => ({ ...c, phone: masks.phone(v) }))} />
                    </div>
                  </StepShell>
                )}

                {step === 1 && (
                  <StepShell title="Entrega" subtitle="Escolha como deseja receber suas peças.">
                    <div className="grid gap-3">
                      {options.map((o) => {
                        const price = o.price
                        return (
                          <OptionCard
                            key={o.id}
                            selected={shippingId === o.id}
                            onSelect={() => setShippingId(o.id)}
                            icon={o.id === 'retirada' ? Store : Truck}
                            title={o.label}
                            subtitle={o.eta}
                            aside={<span className={price === 0 ? 'font-medium text-olive-600' : 'font-medium'}>{price === 0 ? 'Grátis' : money(price)}</span>}
                          />
                        )
                      })}
                    </div>

                    <AnimatePresence initial={false}>
                      {shippingId !== 'retirada' ? (
                        <motion.div key="addr" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <AddressForm address={address} setAddress={setAddress} errors={errors} addr={addr} />
                        </motion.div>
                      ) : (
                        <motion.div key="store" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="mt-6 flex gap-3 rounded-2xl bg-sand/60 p-4 text-sm text-cocoa">
                            <MapPin className="h-5 w-5 shrink-0 text-gold-600" />
                            <p>
                              <strong className="font-medium text-espresso">Boutique Marina Moura</strong>
                              <br />
                              Retire seu pedido em até 24h após a confirmação do pagamento. Enviaremos um aviso por WhatsApp.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </StepShell>
                )}

                {step === 2 && (
                  <StepShell title="Pagamento" subtitle="Escolha a forma de pagamento que preferir.">
                    <div className="grid gap-3 sm:grid-cols-3">
                      {(
                        [
                          { id: 'pix', label: 'Pix', sub: '5% de desconto', icon: PixIcon },
                          { id: 'card', label: 'Cartão', sub: 'Até 6x sem juros', icon: CreditCard },
                          { id: 'boleto', label: 'Boleto', sub: 'Vence em 3 dias', icon: Barcode },
                        ] as const
                      ).map((m) => (
                        <motion.button
                          key={m.id}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setPayment(m.id)}
                          className={`relative rounded-2xl border p-4 text-left transition ${payment === m.id ? 'border-transparent' : 'border-linen bg-ivory hover:border-gold-300'}`}
                        >
                          {payment === m.id && (
                            <motion.span layoutId="pay-method" className="absolute inset-0 rounded-2xl border-2 border-gold-500 bg-gold-50" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
                          )}
                          <span className="relative block">
                            <m.icon className={`h-6 w-6 ${payment === m.id ? 'text-gold-600' : 'text-cocoa'}`} />
                            <span className="mt-3 block font-medium">{m.label}</span>
                            <span className="block text-xs text-taupe">{m.sub}</span>
                          </span>
                        </motion.button>
                      ))}
                    </div>

                    <AnimatePresence mode="wait">
                      <motion.div key={payment} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }} className="mt-6">
                        {payment === 'pix' && (
                          <div className="flex gap-4 rounded-2xl bg-olive-50 p-5 text-sm text-cocoa">
                            <PixIcon className="h-8 w-8 shrink-0 text-olive-500" />
                            <div>
                              <p className="font-medium text-espresso">Aprovação imediata</p>
                              <p className="mt-1">
                                O QR Code e o código copia e cola aparecem após confirmar o pedido. Você economiza{' '}
                                <strong className="font-medium text-olive-600">{money(pixDiscount)}</strong>.
                              </p>
                            </div>
                          </div>
                        )}
                        {payment === 'boleto' && (
                          <div className="flex gap-4 rounded-2xl bg-sand/60 p-5 text-sm text-cocoa">
                            <Barcode className="h-8 w-8 shrink-0 text-gold-600" />
                            <p>O boleto será gerado após a confirmação e pode levar até 2 dias úteis para compensar. O prazo de entrega começa a contar após a aprovação.</p>
                          </div>
                        )}
                        {payment === 'card' && (
                          <CardForm card={card} setCard={setCard} errors={errors} installments={installments} setInstallments={setInstallments} total={total} />
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </StepShell>
                )}

                {step === 3 && (
                  <StepShell title="Revise seu pedido" subtitle="Confira se está tudo certo antes de confirmar.">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <ReviewBlock title="Dados" onEdit={() => go(0)}>
                        <p>{customer.name}</p>
                        <p>{customer.email}</p>
                        <p>
                          {customer.cpf} · {customer.phone}
                        </p>
                      </ReviewBlock>
                      <ReviewBlock title="Entrega" onEdit={() => go(1)}>
                        {shipping.id === 'retirada' ? (
                          <p>Retirada na boutique · {shipping.eta}</p>
                        ) : (
                          <>
                            <p>
                              {address.street}, {address.number} {address.complement && `· ${address.complement}`}
                            </p>
                            <p>
                              {address.district} · {address.city}/{address.state} · {address.cep}
                            </p>
                            <p className="text-gold-700">
                              {shipping.label} · {shipping.eta}
                            </p>
                          </>
                        )}
                      </ReviewBlock>
                      <ReviewBlock title="Pagamento" onEdit={() => go(2)} className="sm:col-span-2">
                        {payment === 'pix' && <p>Pix · aprovação imediata (5% off)</p>}
                        {payment === 'boleto' && <p>Boleto bancário</p>}
                        {payment === 'card' && (
                          <p>
                            Cartão {cardBrand(card.number)?.toUpperCase()} final {onlyDigits(card.number).slice(-4)} · {installments}x de {money(total / installments)}
                          </p>
                        )}
                      </ReviewBlock>
                    </div>
                    <AnimatePresence>
                      {submitError && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-6 flex items-start gap-2 rounded-2xl border border-rose/30 bg-rose/10 p-4 text-sm text-rose"
                        >
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>
                            {submitError}{' '}
                            <Link to="/carrinho" className="underline underline-offset-2">
                              Revisar sacola
                            </Link>
                          </span>
                        </motion.p>
                      )}
                    </AnimatePresence>
                    <p className="mt-6 flex items-start gap-2 rounded-2xl bg-gold-50 p-4 text-xs text-cocoa">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" />
                      Ambiente de demonstração: nenhum pagamento real é processado e nenhum dado é enviado.
                    </p>
                  </StepShell>
                )}

                <div className="mt-8 flex flex-col-reverse gap-3 border-t border-linen pt-6 sm:flex-row sm:justify-between">
                  {step > 0 ? (
                    <button onClick={() => go(step - 1)} className="btn btn-outline">
                      <ArrowLeft className="h-4 w-4" /> Voltar
                    </button>
                  ) : (
                    <span />
                  )}
                  {step < 3 ? (
                    <motion.button whileTap={{ scale: 0.97 }} onClick={next} className="btn btn-primary group">
                      Continuar <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </motion.button>
                  ) : (
                    <motion.button whileTap={{ scale: 0.97 }} onClick={finish} className="btn btn-gold group px-10!">
                      <Lock className="h-4 w-4" /> Confirmar pedido · {money(total)}
                    </motion.button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <OrderSummary
            subtotal={subtotal}
            couponDiscount={couponDiscount}
            pixDiscount={pixDiscount}
            shippingCost={step >= 1 || maxStep >= 1 ? shippingCost : null}
            total={total}
          />
        </div>
      </div>

      <AnimatePresence>{processing && <ProcessingOverlay payment={payment} />}</AnimatePresence>
    </PageTransition>
  )
}

/* ——————————————————— Componentes ——————————————————— */

function Stepper({ step, maxStep, onGo }: { step: number; maxStep: number; onGo: (s: number) => void }) {
  return (
    <div className="relative mt-8">
      <div className="absolute top-5 right-[12.5%] left-[12.5%] h-px bg-linen" />
      <motion.div
        className="absolute top-5 left-[12.5%] h-px bg-gold-500"
        initial={false}
        animate={{ width: `${(step / (STEPS.length - 1)) * 75}%` }}
        transition={{ duration: 0.6, ease: silk }}
      />
      <ol className="relative grid grid-cols-4">
        {STEPS.map((s) => {
          const done = s.id < step
          const current = s.id === step
          const reachable = s.id <= maxStep
          return (
            <li key={s.id} className="flex flex-col items-center">
              <button onClick={() => onGo(s.id)} disabled={!reachable} className="group flex flex-col items-center gap-2 disabled:cursor-default" aria-current={current ? 'step' : undefined}>
                <motion.span
                  animate={{ scale: current ? 1.1 : 1, backgroundColor: done || current ? '#3B2A1E' : '#FFFBF6', color: done || current ? '#FFFBF6' : '#8A7768' }}
                  className="relative flex h-10 w-10 items-center justify-center rounded-full border border-linen"
                >
                  {current && (
                    <motion.span
                      layoutId="step-halo"
                      className="absolute -inset-1.5 rounded-full border border-gold-400"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <AnimatePresence mode="wait" initial={false}>
                    {done ? (
                      <motion.span key="c" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}>
                        <Check className="h-4 w-4" />
                      </motion.span>
                    ) : (
                      <motion.span key="i" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <s.icon className="h-4 w-4" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.span>
                <span className={`text-[0.65rem] tracking-[0.15em] uppercase sm:text-xs ${current ? 'font-medium text-espresso' : 'text-taupe'}`}>{s.label}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function StepShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="text-3xl sm:text-4xl">{title}</h2>
      <p className="mt-1 mb-6 text-sm text-taupe">{subtitle}</p>
      {children}
    </div>
  )
}

type FieldProps = {
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  className?: string
  right?: ReactNode
  ref?: Ref<HTMLInputElement>
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'>

function Field({ label, value, onChange, error, className = '', right, ref, ...rest }: FieldProps) {
  const [focused, setFocused] = useState(false)
  const floated = focused || value.length > 0
  return (
    <div className={className}>
      <label className="relative block">
        <motion.span
          initial={false}
          animate={{ y: floated ? -11 : 0, scale: floated ? 0.78 : 1, color: error ? '#B5655A' : focused ? '#9C7331' : '#8A7768' }}
          transition={{ duration: 0.2 }}
          className="pointer-events-none absolute top-[1.05rem] left-4 origin-left text-[0.95rem]"
        >
          {label}
        </motion.span>
        <input
          aria-label={label}
          {...rest}
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-invalid={!!error}
          className={`input pt-6! pb-2! ${error ? 'border-rose/70! focus:ring-rose/10!' : ''} ${right ? 'pr-11!' : ''}`}
        />
        {right && <span className="absolute top-1/2 right-4 -translate-y-1/2">{right}</span>}
      </label>
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-1 ml-1 text-xs text-rose">
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

function OptionCard({
  selected,
  onSelect,
  icon: Icon,
  title,
  subtitle,
  aside,
}: {
  selected: boolean
  onSelect: () => void
  icon: typeof Truck
  title: string
  subtitle: string
  aside: ReactNode
}) {
  return (
    <motion.button whileTap={{ scale: 0.99 }} onClick={onSelect} className={`relative flex items-center gap-4 rounded-2xl border p-4 text-left transition ${selected ? 'border-transparent' : 'border-linen bg-ivory hover:border-gold-300'}`}>
      {selected && <motion.span layoutId="ship-opt" className="absolute inset-0 rounded-2xl border-2 border-gold-500 bg-gold-50" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
      <span className={`relative flex h-5 w-5 items-center justify-center rounded-full border-2 ${selected ? 'border-gold-500' : 'border-linen'}`}>
        <AnimatePresence>{selected && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="h-2.5 w-2.5 rounded-full bg-gold-500" />}</AnimatePresence>
      </span>
      <Icon className="relative h-5 w-5 text-cocoa" strokeWidth={1.5} />
      <span className="relative flex-1">
        <span className="block font-medium">{title}</span>
        <span className="block text-xs text-taupe">{subtitle}</span>
      </span>
      <span className="relative text-sm">{aside}</span>
    </motion.button>
  )
}

function AddressForm({
  address,
  setAddress,
  errors,
  addr,
}: {
  address: Address
  setAddress: Dispatch<SetStateAction<Address>>
  errors: Errors
  addr: <K extends keyof Address>(k: K) => { value: string; error?: string; onChange: (v: string) => void }
}) {
  const [loading, setLoading] = useState(false)
  const [found, setFound] = useState(false)
  const numberRef = useRef<HTMLInputElement>(null)
  const cepDigits = onlyDigits(address.cep)

  useEffect(() => {
    if (cepDigits.length !== 8) {
      setFound(false)
      return
    }
    const ctrl = new AbortController()
    setLoading(true)
    fetch(`https://viacep.com.br/ws/${cepDigits}/json/`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => {
        if (d.erro) return
        setAddress((a) => ({ ...a, street: d.logradouro || a.street, district: d.bairro || a.district, city: d.localidade || a.city, state: d.uf || a.state }))
        setFound(true)
        setTimeout(() => numberRef.current?.focus(), 50)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
    return () => ctrl.abort()
  }, [cepDigits, setAddress])

  return (
    <div className="mt-6 grid grid-cols-6 gap-4">
      <Field
        label="CEP"
        inputMode="numeric"
        autoComplete="postal-code"
        className="col-span-6 sm:col-span-3"
        {...addr('cep')}
        onChange={(v) => setAddress((a) => ({ ...a, cep: masks.cep(v) }))}
        right={
          loading ? (
            <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }} className="block h-4 w-4 rounded-full border-2 border-gold-500 border-t-transparent" />
          ) : found ? (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <Check className="h-4 w-4 text-olive-600" />
            </motion.span>
          ) : null
        }
      />
      <a href="https://buscacepinter.correios.com.br/" target="_blank" rel="noreferrer" className="col-span-6 self-center text-xs text-taupe underline underline-offset-4 hover:text-gold-600 sm:col-span-3">
        Não sei meu CEP
      </a>
      <Field label="Endereço" autoComplete="address-line1" className="col-span-6 sm:col-span-4" {...addr('street')} />
      <Field label="Número" ref={numberRef} inputMode="numeric" className="col-span-2" {...addr('number')} />
      <Field label="Complemento (opcional)" className="col-span-4 sm:col-span-3" {...addr('complement')} />
      <Field label="Bairro" className="col-span-6 sm:col-span-3" {...addr('district')} />
      <Field label="Cidade" autoComplete="address-level2" className="col-span-4" {...addr('city')} />
      <Field label="UF" maxLength={2} className="col-span-2" {...addr('state')} onChange={(v) => setAddress((a) => ({ ...a, state: v.toUpperCase().replace(/[^A-Z]/g, '') }))} />
      {errors.address && <p className="col-span-6 text-xs text-rose">{errors.address}</p>}
    </div>
  )
}

function CardForm({
  card,
  setCard,
  errors,
  installments,
  setInstallments,
  total,
}: {
  card: CardData
  setCard: Dispatch<SetStateAction<CardData>>
  errors: Errors
  installments: number
  setInstallments: (n: number) => void
  total: number
}) {
  const [flipped, setFlipped] = useState(false)
  const brand = cardBrand(card.number)
  const digits = onlyDigits(card.number).padEnd(16, '•')
  const groups = [0, 4, 8, 12].map((i) => digits.slice(i, i + 4))

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_1.1fr] md:items-start">
      {/* Cartão 3D */}
      <div className="mx-auto w-full max-w-[340px] [perspective:1200px]">
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.8, ease: silk }}
          style={{ transformStyle: 'preserve-3d' }}
          className="relative aspect-[1.586] w-full"
        >
          <div className="absolute inset-0 overflow-hidden rounded-2xl bg-gradient-to-br from-espresso via-cocoa to-gold-700 p-5 text-ivory shadow-lift [backface-visibility:hidden]">
            <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full border border-gold-300/30" />
            <div className="absolute -top-10 -right-10 h-36 w-36 rounded-full border border-gold-300/20" />
            <div className="flex items-start justify-between">
              <span className="h-8 w-11 rounded-md bg-gradient-to-br from-gold-200 to-gold-500" />
              <AnimatePresence mode="wait">
                <motion.span key={brand ?? 'none'} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="font-sans text-sm font-semibold tracking-widest italic">
                  {brand?.toUpperCase() ?? ''}
                </motion.span>
              </AnimatePresence>
            </div>
            <p className="mt-6 flex justify-between font-mono text-lg tracking-wider sm:text-xl">
              {groups.map((g, i) => (
                <span key={i}>{g}</span>
              ))}
            </p>
            <div className="mt-4 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[0.55rem] tracking-[0.2em] text-ivory/60 uppercase">Titular</p>
                <p className="truncate text-sm tracking-wider uppercase">{card.name || 'Seu nome aqui'}</p>
              </div>
              <div>
                <p className="text-[0.55rem] tracking-[0.2em] text-ivory/60 uppercase">Validade</p>
                <p className="text-sm">{card.expiry || 'MM/AA'}</p>
              </div>
              <LogoMark className="h-9 w-9 opacity-90" />
            </div>
          </div>
          <div className="absolute inset-0 overflow-hidden rounded-2xl bg-gradient-to-br from-cocoa to-espresso text-ivory shadow-lift [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div className="mt-6 h-10 bg-black/60" />
            <div className="mx-5 mt-5 flex items-center justify-end rounded bg-ivory/90 px-3 py-2 font-mono text-espresso">{card.cvv || '•••'}</div>
            <p className="mx-5 mt-4 text-[0.6rem] text-ivory/50">Boutique Marina Moura · Sua essência, seu estilo.</p>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Número do cartão" inputMode="numeric" autoComplete="cc-number" className="col-span-2" value={card.number} error={errors.cardNumber} onChange={(v) => setCard((c) => ({ ...c, number: masks.card(v) }))} />
        <Field label="Nome impresso no cartão" autoComplete="cc-name" className="col-span-2" value={card.name} error={errors.cardName} onChange={(v) => setCard((c) => ({ ...c, name: v }))} />
        <Field label="Validade" inputMode="numeric" autoComplete="cc-exp" value={card.expiry} error={errors.expiry} onChange={(v) => setCard((c) => ({ ...c, expiry: masks.expiry(v) }))} />
        <Field
          label="CVV"
          inputMode="numeric"
          autoComplete="cc-csc"
          value={card.cvv}
          error={errors.cvv}
          onFocusCapture={() => setFlipped(true)}
          onBlurCapture={() => setFlipped(false)}
          onChange={(v) => setCard((c) => ({ ...c, cvv: masks.cvv(v) }))}
        />
        <label className="relative col-span-2 block">
          <span className="pointer-events-none absolute top-2 left-4 text-[0.72rem] text-taupe">Parcelas</span>
          <select value={installments} onChange={(e) => setInstallments(Number(e.target.value))} className="input appearance-none pt-6! pb-2!">
            {installmentsFor(total).map((n) => (
              <option key={n} value={n}>
                {n}x de {money(total / n)} {n === 1 ? 'à vista' : 'sem juros'}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-taupe" />
        </label>
      </div>
    </div>
  )
}

function ReviewBlock({ title, onEdit, children, className = '' }: { title: string; onEdit: () => void; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-linen bg-cream/60 p-4 text-sm text-cocoa ${className}`}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium tracking-[0.2em] text-espresso uppercase">{title}</p>
        <button onClick={onEdit} className="flex items-center gap-1 text-xs text-gold-700 hover:underline">
          <Pencil className="h-3 w-3" /> Editar
        </button>
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

function OrderSummary({
  subtotal,
  couponDiscount,
  pixDiscount,
  shippingCost,
  total,
}: {
  subtotal: number
  couponDiscount: number
  pixDiscount: number
  shippingCost: number | null
  total: number
}) {
  const { items } = useCart()
  const [open, setOpen] = useState(false)
  const count = items.reduce((n, i) => n + i.qty, 0)

  const lines = (
    <ul className="space-y-3">
      {items.map((i) => (
        <li key={i.key} className="flex items-center gap-3">
          <div className="relative shrink-0">
            <ProductImage src={i.image} alt={i.name} placeholderLabel={false} className="h-16 w-12 rounded-xl" />
            <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-espresso text-[0.6rem] text-ivory">{i.qty}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lg leading-tight">{i.name}</p>
            <p className="text-xs text-taupe">
              {i.color} · {i.size}
            </p>
          </div>
          <span className="text-sm">{money(i.price * i.qty)}</span>
        </li>
      ))}
    </ul>
  )

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="card overflow-hidden">
        <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between p-5 lg:pointer-events-none">
          <span className="text-left">
            <span className="block font-display text-2xl">Resumo do pedido</span>
            <span className="text-xs text-taupe">
              {count} {count === 1 ? 'item' : 'itens'}
            </span>
          </span>
          <span className="flex items-center gap-2 lg:hidden">
            <span className="font-medium">{money(total)}</span>
            <motion.span animate={{ rotate: open ? 180 : 0 }}>
              <ChevronDown className="h-4 w-4" />
            </motion.span>
          </span>
        </button>
        <div className="hidden px-5 pb-5 lg:block">{lines}</div>
        <AnimatePresence>
          {open && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden lg:hidden">
              <div className="px-5 pb-5">{lines}</div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="space-y-4 border-t border-linen bg-cream/40 p-5">
          <CouponField />
          <dl className="space-y-2 text-sm">
            <Row label="Subtotal" value={money(subtotal)} />
            {couponDiscount > 0 && <Row label="Cupom" value={`- ${money(couponDiscount)}`} accent />}
            <AnimatePresence>{pixDiscount > 0 && <Row label="Desconto Pix (5%)" value={`- ${money(pixDiscount)}`} accent animated />}</AnimatePresence>
            <Row label="Frete" value={shippingCost === null ? 'A calcular' : shippingCost === 0 ? 'Grátis' : money(shippingCost)} accent={shippingCost === 0} />
          </dl>
          <div className="flex items-baseline justify-between border-t border-linen pt-4">
            <span>Total</span>
            <motion.span key={total.toFixed(2)} initial={{ opacity: 0.3, y: -6 }} animate={{ opacity: 1, y: 0 }} className="font-display text-4xl">
              {money(total)}
            </motion.span>
          </div>
        </div>
      </div>
    </aside>
  )
}

function Row({ label, value, accent, animated }: { label: string; value: string; accent?: boolean; animated?: boolean }) {
  return (
    <motion.div
      initial={animated ? { opacity: 0, height: 0 } : false}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={`flex justify-between ${accent ? 'text-olive-600' : ''}`}
    >
      <dt className={accent ? '' : 'text-taupe'}>{label}</dt>
      <dd>{value}</dd>
    </motion.div>
  )
}

function ProcessingOverlay({ payment }: { payment: PaymentMethod }) {
  const msgs = ['Validando seus dados…', payment === 'card' ? 'Aprovando pagamento…' : 'Gerando pagamento…', 'Separando suas peças com carinho…']
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((v) => Math.min(v + 1, msgs.length - 1)), 700)
    return () => clearInterval(t)
  }, [msgs.length])
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-cream/95 backdrop-blur-md">
      <div className="relative h-40 w-40">
        <svg viewBox="0 0 100 100" className="absolute inset-0">
          <circle cx="50" cy="50" r="46" fill="none" stroke="#E6D6C4" strokeWidth="1" />
          <motion.circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="#B8893B"
            strokeWidth="1.6"
            strokeLinecap="round"
            initial={{ pathLength: 0, rotate: -90 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2.1, ease: 'easeInOut' }}
            style={{ originX: 0.5, originY: 0.5 }}
          />
        </svg>
        <motion.div className="absolute inset-8" animate={{ y: [0, -6, 0] }} transition={{ duration: 1.2, repeat: Infinity }}>
          <Dragonfly />
        </motion.div>
      </div>
      <AnimatePresence mode="wait">
        <motion.p key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-6 font-display text-2xl">
          {msgs[i]}
        </motion.p>
      </AnimatePresence>
    </motion.div>
  )
}
