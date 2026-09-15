import { Eye, EyeOff } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'

type Props = {
  label: string
  error?: string | null
  hint?: ReactNode
  className?: string
} & InputHTMLAttributes<HTMLInputElement>

/** Campo com rótulo acima — padrão dos formulários de conta e do painel */
export function FormField({ label, error, hint, className = '', type, ...rest }: Props) {
  const id = useId()
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium tracking-[0.12em] text-cocoa uppercase">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && show ? 'text' : type}
          aria-invalid={!!error}
          {...rest}
          className={`input ${isPassword ? 'pr-12!' : ''} ${error ? 'border-rose/70!' : ''} disabled:opacity-60`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1.5 text-taupe hover:text-espresso"
            aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      <AnimatePresence>
        {error ? (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-1 text-xs text-rose">
            {error}
          </motion.p>
        ) : (
          hint && <p className="mt-1 text-xs text-taupe">{hint}</p>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Alert({ tone = 'error', children }: { tone?: 'error' | 'success' | 'info'; children: ReactNode }) {
  const tones = {
    error: 'border-rose/30 bg-rose/10 text-rose',
    success: 'border-olive-300 bg-olive-50 text-olive-700',
    info: 'border-gold-200 bg-gold-50 text-cocoa',
  }
  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl border px-4 py-3 text-sm ${tones[tone]}`} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
    </motion.div>
  )
}
