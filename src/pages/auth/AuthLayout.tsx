import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { Blossom, Dragonfly, LogoMark } from '../../components/Brand'
import { PageTransition } from '../../components/motion'
import { silk } from '../../lib/easing'

export function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <PageTransition>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:py-16">
        {/* Painel da marca */}
        <motion.aside
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: silk }}
          className="relative hidden overflow-hidden rounded-[2.5rem] bg-espresso p-12 text-ivory lg:flex lg:flex-col lg:justify-between"
        >
          <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full border border-gold-300/20" />
          <div className="pointer-events-none absolute -top-10 -right-10 h-56 w-56 rounded-full border border-gold-300/15" />
          <motion.div
            className="absolute top-16 right-14 w-24"
            animate={{ y: [0, -12, 0], rotate: [12, 4, 12] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Dragonfly />
          </motion.div>
          <LogoMark className="h-16 w-16" />
          <div className="relative">
            <p className="eyebrow text-gold-300!">Boutique Marina Moura</p>
            <p className="mt-4 font-display text-5xl leading-tight">
              Sua essência,
              <br />
              <span className="text-gold-gradient italic">seu estilo.</span>
            </p>
            <ul className="mt-8 space-y-2 text-sm text-ivory/70">
              <li>✦ Acompanhe seus pedidos em tempo real</li>
              <li>✦ Checkout mais rápido com seus dados salvos</li>
              <li>✦ Ofertas e lançamentos exclusivos</li>
            </ul>
          </div>
          <Blossom className="pointer-events-none absolute -right-12 -bottom-12 w-72 opacity-80" />
        </motion.aside>

        {/* Formulário */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: silk }}
          className="card mx-auto w-full max-w-lg self-center p-7 sm:p-10"
        >
          <div className="mb-8 text-center lg:text-left">
            <LogoMark className="mx-auto mb-5 h-14 w-14 lg:hidden" />
            <h1 className="text-5xl">{title}</h1>
            {subtitle && <p className="mt-2 text-taupe">{subtitle}</p>}
          </div>
          {children}
          {footer && <div className="mt-8 border-t border-linen pt-6 text-center text-sm text-cocoa">{footer}</div>}
        </motion.div>
      </div>
    </PageTransition>
  )
}
