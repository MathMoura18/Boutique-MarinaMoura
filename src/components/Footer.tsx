import { CreditCard, Lock, MapPin, RefreshCw, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useSections } from '../hooks/queries'
import { FREE_SHIPPING_THRESHOLD } from '../lib/commerce'
import { money } from '../lib/format'
import { Blossom, LogoMark, Wordmark } from './Brand'
import { InstagramIcon, PixIcon, WhatsappIcon } from './Icons'
import { Marquee, Reveal } from './motion'

const perks = [
  { icon: Truck, title: 'Frete grátis', text: `Acima de ${money(FREE_SHIPPING_THRESHOLD)}` },
  { icon: RefreshCw, title: 'Troca fácil', text: 'Primeira troca grátis em 30 dias' },
  { icon: CreditCard, title: '6x sem juros', text: 'Em todos os cartões' },
  { icon: Lock, title: 'Compra segura', text: 'Dados protegidos de ponta a ponta' },
]

export function Footer() {
  const { data: sections = [] } = useSections()
  return (
    <footer className="relative mt-24 overflow-hidden bg-espresso text-ivory">
      <div className="border-b border-ivory/10 bg-gold-gradient py-3 text-xs tracking-[0.3em] text-ivory uppercase">
        <Marquee items={['Sua essência, seu estilo', 'Casual', 'Fitness', 'Feito com carinho', 'Boutique Marina Moura']} />
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {perks.map(({ icon: Icon, title, text }, i) => (
          <Reveal key={title} delay={i * 0.08} className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold-300/40 text-gold-300">
              <Icon className="h-5 w-5" strokeWidth={1.4} />
            </span>
            <div>
              <p className="font-display text-xl">{title}</p>
              <p className="text-sm text-ivory/60">{text}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-12 border-t border-ivory/10 px-6 py-14 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        <Blossom className="pointer-events-none absolute -right-10 -bottom-16 h-72 w-72 opacity-10" bloom={false} />
        <div>
          <div className="flex items-center gap-3">
            <LogoMark className="h-14 w-14" />
            <Wordmark className="[&_span]:text-ivory" />
          </div>
          <p className="mt-5 max-w-xs font-display text-2xl text-gold-200 italic">Sua essência, seu estilo.</p>
          <p className="mt-3 max-w-sm text-sm text-ivory/60">
            Moda feminina com delicadeza e personalidade — do casual elegante ao fitness que acompanha o seu ritmo.
          </p>
          <div className="mt-6 flex gap-3">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="rounded-full border border-ivory/20 p-2.5 transition hover:border-gold-300 hover:text-gold-300">
              <InstagramIcon className="h-5 w-5" />
            </a>
            <a href="https://wa.me/" target="_blank" rel="noreferrer" aria-label="WhatsApp" className="rounded-full border border-ivory/20 p-2.5 transition hover:border-gold-300 hover:text-gold-300">
              <WhatsappIcon className="h-5 w-5" />
            </a>
          </div>
        </div>

        <FooterCol
          title="Comprar"
          links={[
            ...sections.map((sec) => [`/loja/${sec.slug}`, sec.name] as [string, string]),
            ['/colecoes', 'Coleções'],
            ['/loja?tag=novo', 'Novidades'],
            ['/loja?tag=promo', 'Sale'],
          ]}
        />
        <FooterCol
          title="Minha conta"
          links={[
            ['/conta', 'Minha conta'],
            ['/conta/pedidos', 'Meus pedidos'],
            ['/favoritos', 'Favoritos'],
            ['/carrinho', 'Sacola'],
          ]}
        />
        <div>
          <p className="eyebrow text-gold-300!">Atendimento</p>
          <ul className="mt-4 space-y-2 text-sm text-ivory/70">
            <li>Seg a sex · 9h às 18h</li>
            <li>contato@marinamoura.com.br</li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-300" strokeWidth={1.5} />
              Boutique física com retirada em 24h
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-ivory/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 text-xs text-ivory/50 sm:flex-row lg:px-8">
          <p>© {new Date().getFullYear()} Boutique Marina Moura. Todos os direitos reservados.</p>
          <div className="flex items-center gap-3">
            <PixIcon className="h-4 w-4" />
            {['VISA', 'MASTER', 'ELO', 'AMEX', 'BOLETO'].map((b) => (
              <span key={b} className="rounded border border-ivory/15 px-1.5 py-0.5 text-[0.6rem] tracking-wider">
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="eyebrow text-gold-300!">{title}</p>
      <ul className="mt-4 space-y-2">
        {links.map(([to, label]) => (
          <li key={label}>
            <Link to={to} className="group inline-flex items-center gap-2 text-sm text-ivory/70 transition hover:text-ivory">
              <span className="h-px w-0 bg-gold-300 transition-all duration-300 group-hover:w-3" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
