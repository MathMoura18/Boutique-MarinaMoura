import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Collection } from '../types'
import { Reveal } from './motion'
import { ProductImage } from './ProductImage'

export function CollectionTile({ collection, cover, large = false }: { collection: Collection; cover: string | null; large?: boolean }) {
  return (
    <Reveal className="h-full">
      <Link
        to={`/colecoes/${collection.slug}`}
        className={`group relative block h-full overflow-hidden rounded-[2rem] ${large ? 'min-h-[420px] lg:min-h-[560px]' : 'min-h-[260px]'}`}
      >
        <ProductImage src={cover} alt={collection.name} className="absolute inset-0 h-full w-full transition-transform duration-[1.4s] ease-[var(--ease-silk)] group-hover:scale-105" />
        <span className="absolute inset-0 bg-gradient-to-t from-espresso/75 via-espresso/10 to-transparent" />
        <span className="absolute inset-x-6 bottom-6 flex items-end justify-between gap-4 text-ivory sm:inset-x-8 sm:bottom-8">
          <span>
            <span className="eyebrow text-gold-200!">Coleção</span>
            <span className={`mt-1 block font-display leading-none ${large ? 'text-5xl sm:text-6xl' : 'text-4xl'}`}>{collection.name}</span>
            {large && collection.description && <span className="mt-3 block max-w-sm text-sm text-ivory/80">{collection.description}</span>}
          </span>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ivory text-espresso transition-transform duration-500 group-hover:rotate-45">
            <ArrowUpRight className="h-5 w-5" />
          </span>
        </span>
      </Link>
    </Reveal>
  )
}
