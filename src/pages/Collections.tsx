import { CollectionTile } from '../components/CollectionTile'
import { Dragonfly } from '../components/Brand'
import { PageTransition, SplitText } from '../components/motion'
import { useCollections, useProducts } from '../hooks/queries'
import { coverOf } from '../lib/product'

export default function Collections() {
  const { data: collections = [], isLoading } = useCollections()
  const { data: products = [] } = useProducts()

  const coverFor = (id: string, url: string | null) =>
    url ?? coverOf(products.find((p) => p.collection_id === id && p.images.length) ?? { images: [] })

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-6 pt-12 lg:px-8">
        <p className="eyebrow">Editorial</p>
        <h1 className="mt-2 text-6xl sm:text-7xl">
          <SplitText text="Coleções" />
        </h1>
        <p className="mt-3 max-w-lg text-cocoa">Histórias contadas em peças — escolha a que mais combina com o seu momento.</p>

        {isLoading ? (
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="min-h-[360px] animate-pulse rounded-[2rem] bg-sand" />
            ))}
          </div>
        ) : collections.length === 0 ? (
          <div className="py-24 text-center">
            <Dragonfly className="mx-auto h-24 w-24 opacity-70" />
            <h2 className="mt-4 text-3xl">Novas coleções em breve</h2>
          </div>
        ) : (
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {collections.map((c, i) => (
              <div key={c.id} className={i === 0 && collections.length % 2 === 1 ? 'md:col-span-2' : ''}>
                <CollectionTile collection={c} cover={coverFor(c.id, c.cover_url)} large={i === 0} />
              </div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  )
}
