import { motion, useInView } from 'motion/react'
import { useEffect, useId, useRef, useState } from 'react'

/** Libélula dourada com asas animadas — símbolo da marca */
export function Dragonfly({
  className,
  flap = true,
  color = '#B8893B',
}: {
  className?: string
  flap?: boolean
  color?: string
}) {
  const id = useId()
  const ref = useRef<SVGSVGElement>(null)
  const inView = useInView(ref, { margin: '80px' })
  const wing = (lower: boolean) => (
    <>
      <path
        d={
          lower
            ? 'M56 45 C42 47, 22 53, 11 61 C7 65, 11 69, 18 67 C32 61, 46 53, 56 48 Z'
            : 'M56 38 C40 26, 18 18, 6 22 C1 24, 4 31, 12 33 C26 37, 44 40, 56 41 Z'
        }
        fill={`url(#${id}-wing)`}
        stroke={color}
        strokeWidth="0.7"
      />
      <path
        d={lower ? 'M56 46.5 C42 50, 26 56, 14 63' : 'M56 39.5 C40 31, 22 25, 8 27'}
        fill="none"
        stroke={color}
        strokeOpacity="0.5"
        strokeWidth="0.5"
      />
    </>
  )
  const flapAnim = (dir: 1 | -1, delay: number) =>
    flap && inView
      ? {
          animate: { rotate: [0, 16 * dir, 0, -6 * dir, 0] },
          transition: { duration: 0.32, repeat: Infinity, delay, ease: 'easeInOut' as const },
        }
      : { animate: { rotate: 0 } }

  return (
    <svg ref={ref} viewBox="0 0 120 120" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}-wing`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F4E3BC" stopOpacity="0.85" />
          <stop offset="1" stopColor="#D4AF6A" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8E6A2B" />
          <stop offset="0.5" stopColor="#E4C98D" />
          <stop offset="1" stopColor="#8E6A2B" />
        </linearGradient>
      </defs>
      {/* asas esquerdas */}
      <motion.g style={{ originX: 1, originY: 0.5 }} {...flapAnim(-1, 0)}>
        {wing(false)}
      </motion.g>
      <motion.g style={{ originX: 1, originY: 0.2 }} {...flapAnim(-1, 0.08)}>
        {wing(true)}
      </motion.g>
      {/* asas direitas (espelhadas) */}
      <g transform="matrix(-1 0 0 1 120 0)">
        <motion.g style={{ originX: 1, originY: 0.5 }} {...flapAnim(-1, 0.04)}>
          {wing(false)}
        </motion.g>
        <motion.g style={{ originX: 1, originY: 0.2 }} {...flapAnim(-1, 0.12)}>
          {wing(true)}
        </motion.g>
      </g>
      {/* corpo */}
      <circle cx="60" cy="28" r="5" fill={`url(#${id}-body)`} />
      <ellipse cx="60" cy="40" rx="5" ry="8.5" fill={`url(#${id}-body)`} />
      <path d="M57.4 48 L62.6 48 L61.4 104 Q60 111 58.6 104 Z" fill={`url(#${id}-body)`} />
      {[56, 64, 72, 80, 88, 96].map((y) => (
        <line key={y} x1="57.6" x2="62.4" y1={y} y2={y} stroke="#7D5C28" strokeWidth="0.6" strokeOpacity="0.7" />
      ))}
    </svg>
  )
}

/** Ramo de jasmim com folhas — ilustração floral da marca */
export function Blossom({ className, bloom = true }: { className?: string; bloom?: boolean }) {
  const id = useId()
  const petal = 'M0 0 C-11 -12, -14 -34, 0 -46 C14 -34, 11 -12, 0 0 Z'
  const leaf = 'M0 0 C18 -12, 52 -12, 74 0 C52 12, 18 12, 0 0 Z'
  return (
    <svg viewBox="0 0 220 220" className={className} aria-hidden>
      <defs>
        <radialGradient id={`${id}-petal`} cx="0.5" cy="1" r="1">
          <stop offset="0" stopColor="#EADBC0" />
          <stop offset="0.45" stopColor="#FBF4E8" />
          <stop offset="1" stopColor="#FFFDF8" />
        </radialGradient>
        <linearGradient id={`${id}-leaf`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7C8A4A" />
          <stop offset="1" stopColor="#4F5A2C" />
        </linearGradient>
      </defs>
      <path d="M30 210 C70 170, 100 140, 118 100 C126 80, 140 60, 160 44" stroke="#6B7A3E" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M92 146 C80 120, 60 110, 44 104" stroke="#6B7A3E" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {[
        { x: 70, y: 176, r: -30, s: 0.9 },
        { x: 112, y: 116, r: 200, s: 0.8 },
        { x: 46, y: 104, r: 190, s: 0.55 },
      ].map((l, i) => (
        <motion.g
          key={i}
          initial={bloom ? { opacity: 0, scale: 0.4 } : false}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 + i * 0.15, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <g transform={`translate(${l.x} ${l.y}) rotate(${l.r}) scale(${l.s})`}>
            <path d={leaf} fill={`url(#${id}-leaf)`} />
            <path d="M4 0 C24 -2, 50 -2, 70 0" stroke="#DDE2C6" strokeOpacity="0.55" strokeWidth="1" fill="none" />
          </g>
        </motion.g>
      ))}
      {/* botão */}
      <g transform="translate(162 42) rotate(40)">
        <ellipse cx="0" cy="-12" rx="7" ry="13" fill={`url(#${id}-petal)`} stroke="#E6D6C4" strokeWidth="0.8" />
        <path d="M-6 -2 L0 4 L6 -2 L0 -6 Z" fill="#6B7A3E" />
      </g>
      {/* flor */}
      <motion.g
        initial={bloom ? { scale: 0.3, rotate: -40, opacity: 0 } : false}
        whileInView={{ scale: 1, rotate: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        style={{ originX: 0.5, originY: 0.5 }}
      >
        <g transform="translate(120 98)">
          {[0, 72, 144, 216, 288].map((r) => (
            <path key={r} d={petal} transform={`rotate(${r})`} fill={`url(#${id}-petal)`} stroke="#E3D1B8" strokeWidth="0.8" />
          ))}
          {Array.from({ length: 9 }, (_, i) => {
            const a = (i / 9) * Math.PI * 2
            const x = Math.cos(a) * 9
            const y = Math.sin(a) * 9
            return (
              <g key={i}>
                <line x1="0" y1="0" x2={x} y2={y} stroke="#C49A4E" strokeWidth="0.8" />
                <circle cx={x} cy={y} r="2" fill="#D4AF6A" />
              </g>
            )
          })}
          <circle r="3" fill="#B8893B" />
        </g>
      </motion.g>
    </svg>
  )
}

/** Arquivo opcional da logo: coloque a imagem em public/brand/logo-mm.png */
const LOGO_URL = '/brand/logo-mm.png'
let logoAvailable: boolean | null = null
const logoProbe =
  typeof window === 'undefined'
    ? Promise.resolve(false)
    : new Promise<boolean>((resolve) => {
        const img = new Image()
        img.onload = () => resolve((logoAvailable = true))
        img.onerror = () => resolve((logoAvailable = false))
        img.src = LOGO_URL
      })

/** Monograma MM. Usa a logo real se existir em public/brand; caso contrário, desenha em SVG. */
export function LogoMark({ className }: { className?: string }) {
  const [hasImage, setHasImage] = useState(logoAvailable === true)
  const id = useId()
  useEffect(() => {
    if (logoAvailable === null) logoProbe.then(setHasImage)
  }, [])
  if (hasImage) {
    return <img src={LOGO_URL} alt="Boutique Marina Moura" className={`${className} rounded-full object-cover`} />
  }
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Boutique Marina Moura">
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#D9B876" />
          <stop offset="0.5" stopColor="#B8893B" />
          <stop offset="1" stopColor="#8E6A2B" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="49" fill="#FBF5EE" />
      <circle cx="50" cy="50" r="42" fill="none" stroke={`url(#${id}-g)`} strokeWidth="0.9" />
      <text x="40" y="57" textAnchor="middle" fontFamily="Cormorant Garamond, Georgia, serif" fontSize="36" fill={`url(#${id}-g)`}>
        M
      </text>
      <text x="58" y="72" textAnchor="middle" fontFamily="Cormorant Garamond, Georgia, serif" fontSize="36" fill={`url(#${id}-g)`}>
        M
      </text>
      <g transform="translate(58 12) rotate(30) scale(0.24)">
        <Dragonfly flap={false} />
      </g>
    </svg>
  )
}

export function Wordmark({ className = '', compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={`flex flex-col leading-none ${className}`}>
      {!compact && <span className="mb-1 text-[0.55rem] tracking-[0.5em] text-cocoa">BOUTIQUE</span>}
      <span className="font-display text-[1.35rem] tracking-[0.12em] whitespace-nowrap text-espresso">MARINA MOURA</span>
    </span>
  )
}
