import { useState } from 'react'
import { Dragonfly } from './Brand'

interface Props {
  src: string | null | undefined
  alt: string
  className?: string
  /** 'eager' para imagens acima da dobra */
  loading?: 'lazy' | 'eager'
  sizes?: string
  placeholderLabel?: boolean
}

/** Foto com carregamento suave (shimmer → fade-in) e placeholder elegante quando não existe */
export function ProductImage({ src, alt, className = '', loading = 'lazy', sizes, placeholderLabel = true }: Props) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  if (!src || failed) return <ImagePlaceholder label={placeholderLabel} className={className} />

  return (
    <span className={`relative block overflow-hidden bg-sand ${className}`}>
      {!loaded && (
        <span className="absolute inset-0 animate-shimmer bg-[linear-gradient(100deg,transparent_30%,rgba(255,251,246,.55)_50%,transparent_70%)] bg-[length:200%_100%]" />
      )}
      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        sizes={sizes}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`h-full w-full object-cover object-center transition-[opacity,filter,transform] duration-700 ease-[var(--ease-silk)] ${
          loaded ? 'opacity-100 blur-0' : 'opacity-0 blur-md'
        }`}
      />
    </span>
  )
}

export function ImagePlaceholder({ label = true, className = '' }: { label?: boolean; className?: string }) {
  return (
    <span className={`relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-sand via-cream to-linen ${className}`}>
      <span className="absolute inset-[12%] rounded-full border border-gold-300/40" />
      <Dragonfly className="relative w-1/4 max-w-20 opacity-60" flap={false} />
      {label && <span className="relative mt-2 text-[0.6rem] tracking-[0.25em] text-taupe uppercase">Foto em breve</span>}
    </span>
  )
}
