import { coverOf, variantOf } from '../lib/product'
import { useCart } from '../store/cart'
import { useUI } from '../store/ui'
import type { Product } from '../types'

export function useAddToCart() {
  const add = useCart((s) => s.add)
  const { fly, toast } = useUI()
  return (e: { clientX: number; clientY: number } | null, product: Product, color: string, size: string, qty = 1) => {
    const variant = variantOf(product, color, size)
    if (!variant || variant.stock < 1) {
      toast({ title: 'Tamanho esgotado', description: `${product.name} · ${color} · ${size}` })
      return false
    }
    const image = coverOf(product, color)
    add(
      {
        variantId: variant.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image,
        color,
        colorHex: variant.color_hex,
        size,
        stock: variant.stock,
      },
      qty,
    )
    if (e) fly({ x: e.clientX, y: e.clientY }, variant.color_hex, image)
    toast({ title: 'Adicionado à sacola', description: `${product.name} · ${color} · ${size}`, tone: 'success' })
    return true
  }
}
