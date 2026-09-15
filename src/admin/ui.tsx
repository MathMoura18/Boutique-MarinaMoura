import { AlertTriangle, ChevronDown, ImagePlus, Search, Trash2, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useId, useRef, useState, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { create } from 'zustand'
import { Spinner } from '../components/CartBits'
import { ImagePlaceholder } from '../components/ProductImage'
import { silk } from '../lib/easing'
import { uploadImage } from '../lib/images'
import { errorMessage } from '../lib/supabase'
import { useUI } from '../store/ui'

export { FormField as TextField, Alert } from '../components/FormField'

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-4xl sm:text-5xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-taupe">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Panel({ children, className = '', title, actions }: { children: ReactNode; className?: string; title?: string; actions?: ReactNode }) {
  return (
    <section className={`rounded-3xl border border-linen/80 bg-ivory ${className}`}>
      {title && (
        <header className="flex items-center justify-between gap-3 border-b border-linen/80 px-5 py-4">
          <h2 className="font-display text-2xl">{title}</h2>
          {actions}
        </header>
      )}
      {children}
    </section>
  )
}

const labelClass = 'mb-1.5 block text-xs font-medium tracking-[0.12em] text-cocoa uppercase'

export function TextArea({ label, hint, className = '', ...rest }: { label: string; hint?: string; className?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <textarea id={id} rows={4} {...rest} className="input resize-y" />
      {hint && <p className="mt-1 text-xs text-taupe">{hint}</p>}
    </div>
  )
}

export function SelectField({ label, children, className = '', ...rest }: { label: string; className?: string; children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative">
        <select id={id} {...rest} className="input appearance-none pr-10!">
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-taupe" />
      </div>
    </div>
  )
}

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label?: string; description?: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-olive-500' : 'bg-linen'}`}
      >
        <motion.span layout transition={{ type: 'spring', stiffness: 600, damping: 35 }} className={`absolute top-0.5 h-5 w-5 rounded-full bg-ivory shadow ${checked ? 'right-0.5' : 'left-0.5'}`} />
      </button>
      {(label || description) && (
        <span>
          {label && <span className="block text-sm">{label}</span>}
          {description && <span className="block text-xs text-taupe">{description}</span>}
        </span>
      )}
    </label>
  )
}

export function SearchInput({ value, onChange, placeholder = 'Buscar…' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative w-full sm:w-72">
      <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-taupe" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input py-2.5! pl-10!" aria-label={placeholder} />
    </div>
  )
}

export function Pill({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'good' | 'warn' | 'bad' | 'gold' }) {
  const tones = {
    neutral: 'bg-sand text-cocoa',
    good: 'bg-olive-100 text-olive-700',
    warn: 'bg-gold-100 text-gold-700',
    bad: 'bg-rose/15 text-rose',
    gold: 'bg-gold-500 text-ivory',
  }
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.68rem] font-medium whitespace-nowrap ${tones[tone]}`}>{children}</span>
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <ImagePlaceholder label={false} className="h-24 w-24 rounded-full" />
      <p className="mt-4 font-display text-2xl">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-taupe">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  size?: 'md' | 'lg'
}) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-espresso/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ duration: 0.35, ease: silk }}
            className={`relative flex max-h-[92vh] w-full flex-col rounded-t-[2rem] bg-cream shadow-lift sm:rounded-[2rem] ${size === 'lg' ? 'max-w-3xl' : 'max-w-xl'}`}
          >
            <header className="flex items-center justify-between border-b border-linen px-6 py-4">
              <h2 className="font-display text-3xl">{title}</h2>
              <button onClick={onClose} className="rounded-full p-2 hover:bg-sand" aria-label="Fechar">
                <X className="h-5 w-5" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer && <footer className="flex justify-end gap-2 border-t border-linen px-6 py-4">{footer}</footer>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

/* ——— Confirmação global ——— */

interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  danger?: boolean
}

const useConfirmStore = create<{ options: ConfirmOptions | null; resolve?: (v: boolean) => void }>(() => ({ options: null }))

export const confirmAction = (options: ConfirmOptions) =>
  new Promise<boolean>((resolve) => useConfirmStore.setState({ options, resolve }))

export function ConfirmHost() {
  const { options, resolve } = useConfirmStore()
  const close = (v: boolean) => {
    resolve?.(v)
    useConfirmStore.setState({ options: null, resolve: undefined })
  }
  return (
    <Modal
      open={!!options}
      onClose={() => close(false)}
      title={options?.title ?? ''}
      footer={
        <>
          <button className="btn btn-outline" onClick={() => close(false)}>
            Cancelar
          </button>
          <button className={`btn ${options?.danger ? 'bg-rose text-ivory hover:brightness-110' : 'btn-primary'}`} onClick={() => close(true)}>
            {options?.confirmLabel ?? 'Confirmar'}
          </button>
        </>
      }
    >
      <div className="flex gap-4">
        {options?.danger && (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose/10 text-rose">
            <AlertTriangle className="h-5 w-5" />
          </span>
        )}
        <p className="pt-2 text-sm text-cocoa">{options?.description}</p>
      </div>
    </Modal>
  )
}

/* ——— Upload de imagem única (capas de seção/coleção) ——— */

export function CoverUpload({
  label,
  value,
  folder,
  onChange,
}: {
  label: string
  value: { url: string | null; path: string | null }
  folder: string
  onChange: (v: { url: string | null; path: string | null }) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const toast = useUI((s) => s.toast)

  const handle = async (file?: File) => {
    if (!file) return
    setUploading(true)
    try {
      onChange(await uploadImage(file, folder))
    } catch (e) {
      toast({ title: 'Falha no upload', description: errorMessage(e) })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <p className={labelClass}>{label}</p>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          handle(e.dataTransfer.files[0])
        }}
        className="group relative aspect-[16/9] overflow-hidden rounded-2xl border-2 border-dashed border-linen bg-sand/40"
      >
        {value.url ? (
          <>
            <img src={value.url} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-espresso/40 opacity-0 transition group-hover:opacity-100">
              <button type="button" onClick={() => inputRef.current?.click()} className="btn bg-ivory px-4! py-2! text-espresso">
                Trocar
              </button>
              <button type="button" onClick={() => onChange({ url: null, path: null })} className="btn bg-rose px-4! py-2! text-ivory" aria-label="Remover capa">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : (
          <button type="button" onClick={() => inputRef.current?.click()} className="flex h-full w-full flex-col items-center justify-center gap-2 text-sm text-taupe hover:text-gold-700">
            <ImagePlus className="h-7 w-7" strokeWidth={1.4} />
            Clique ou arraste uma foto
            <span className="text-xs">JPG, PNG ou WebP · recomendado 1600×900</span>
          </button>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-ivory/70 text-gold-600">
            <Spinner className="h-7 w-7 border-2" />
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => handle(e.target.files?.[0])} />
    </div>
  )
}

export const thClass = 'px-4 py-3 text-left text-[0.68rem] font-medium tracking-[0.14em] text-taupe uppercase whitespace-nowrap'
export const tdClass = 'px-4 py-3 align-middle'
