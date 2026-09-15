import { Heart } from 'lucide-react'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { PageTransition, SplitText } from '../components/motion'
import { ProductGrid } from '../components/ProductCard'
import { useProducts } from '../hooks/queries'
import { useWishlist } from '../store/wishlist'

export default function Wishlist() {
  const ids = useWishlist((s) => s.ids)
  const { data: products = [], isLoading } = useProducts()
  const list = products.filter((p) => ids.includes(p.id))

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-6 pt-12 lg:px-8">
        <p className="eyebrow">Sua seleção</p>
        <h1 className="mt-2 text-6xl">
          <SplitText text="Favoritos" />
        </h1>
        <p className="mt-2 text-taupe">
          {list.length > 0 ? `${list.length} ${list.length === 1 ? 'peça salva' : 'peças salvas'} para quando você quiser.` : 'Guarde aqui as peças que conquistaram você.'}
        </p>

        {isLoading && ids.length > 0 ? (
          <div className="mt-10">
            <ProductGrid products={[]} loading skeletons={Math.min(ids.length, 4)} />
          </div>
        ) : list.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card mt-10 flex flex-col items-center px-6 py-20 text-center">
            <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.4, repeat: Infinity }} className="flex h-20 w-20 items-center justify-center rounded-full bg-sand">
              <Heart className="h-9 w-9 text-rose" strokeWidth={1.4} />
            </motion.div>
            <h2 className="mt-6 text-4xl">Nenhum favorito ainda</h2>
            <p className="mt-2 max-w-sm text-taupe">Toque no coração das peças que você amar para vê-las aqui.</p>
            <Link to="/loja" className="btn btn-primary mt-8">
              Explorar a boutique
            </Link>
          </motion.div>
        ) : (
          <div className="mt-10">
            <ProductGrid products={list} />
          </div>
        )}
      </div>
    </PageTransition>
  )
}
