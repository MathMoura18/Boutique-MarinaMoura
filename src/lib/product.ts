import type { Product, ProductImage } from '../types'

const SIZE_ORDER = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XGG', 'U', 'ÚNICO']

export const sortSizes = (sizes: string[]) =>
  [...sizes].sort((a, b) => {
    const ia = SIZE_ORDER.indexOf(a.toUpperCase())
    const ib = SIZE_ORDER.indexOf(b.toUpperCase())
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
    return a.localeCompare(b, 'pt-BR', { numeric: true })
  })

export const colorsOf = (p: Pick<Product, 'variants'>) => {
  const seen = new Map<string, string>()
  ;[...p.variants].sort((a, b) => a.sort_order - b.sort_order).forEach((v) => !seen.has(v.color_name) && seen.set(v.color_name, v.color_hex))
  return [...seen.entries()].map(([name, hex]) => ({ name, hex }))
}

export const sizesOf = (p: Pick<Product, 'variants'>) => sortSizes([...new Set(p.variants.map((v) => v.size))])

export const variantOf = (p: Pick<Product, 'variants'>, color: string, size: string) =>
  p.variants.find((v) => v.color_name === color && v.size === size)

export const stockOf = (p: Pick<Product, 'variants'>, color?: string) =>
  p.variants.filter((v) => !color || v.color_name === color).reduce((n, v) => n + v.stock, 0)

export const isSoldOut = (p: Pick<Product, 'variants'>) => p.variants.length > 0 && stockOf(p) === 0

export const discountPercent = (p: Pick<Product, 'price' | 'compare_at_price'>) =>
  p.compare_at_price && p.compare_at_price > p.price ? Math.round((1 - p.price / p.compare_at_price) * 100) : 0

/** Fotos da cor escolhida primeiro; se a cor não tiver fotos próprias, usa as gerais */
export const imagesFor = (p: Pick<Product, 'images'>, color?: string): ProductImage[] => {
  const sorted = [...p.images].sort((a, b) => a.sort_order - b.sort_order)
  if (!color) return sorted
  const own = sorted.filter((i) => i.color_name === color)
  const general = sorted.filter((i) => !i.color_name)
  return own.length ? [...own, ...general] : sorted
}

export const coverOf = (p: Pick<Product, 'images'>, color?: string) => imagesFor(p, color)[0]?.url ?? null
