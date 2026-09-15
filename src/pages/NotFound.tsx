import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { Dragonfly } from '../components/Brand'
import { PageTransition } from '../components/motion'

export default function NotFound() {
  return (
    <PageTransition>
      <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-24 text-center">
        <motion.div
          animate={{ x: [0, 40, -30, 0], y: [0, -20, 10, 0], rotate: [0, 20, -15, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Dragonfly className="h-32 w-32" />
        </motion.div>
        <p className="mt-6 font-display text-8xl text-gold-gradient">404</p>
        <h1 className="mt-2 text-4xl">Esta página voou para longe</h1>
        <p className="mt-3 text-taupe">O endereço que você procura não existe ou mudou de lugar.</p>
        <div className="mt-8 flex gap-3">
          <Link to="/" className="btn btn-outline">
            Início
          </Link>
          <Link to="/loja" className="btn btn-primary">
            Ver a loja
          </Link>
        </div>
      </div>
    </PageTransition>
  )
}
