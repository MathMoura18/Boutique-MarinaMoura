import { Minus, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Spinner } from '../../components/CartBits'
import { ProductImage } from '../../components/ProductImage'
import { LOW_STOCK, normalizeText } from '../../lib/commerce'
import { coverOf } from '../../lib/product'
import { errorMessage, supabase } from '../../lib/supabase'
import { useUI } from '../../store/ui'
import type { Product, ProductVariant } from '../../types'
import { useAdminProducts, useInvalidate } from '../data'
import { Alert, EmptyState, PageHeader, Panel, Pill, SearchInput, tdClass, thClass } from '../ui'

export default function StockAdmin() {
  const { data: products = [], isLoading, error } = useAdminProducts()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const lowOnly = params.get('baixo') === '1'

  const rows = useMemo(
    () =>
      products
        .flatMap((p) => p.variants.map((v) => ({ product: p, variant: v })))
        .filter(({ product, variant }) => (!lowOnly || variant.stock <= LOW_STOCK) && (!q || normalizeText(`${product.name} ${variant.color_name} ${variant.size} ${variant.sku ?? ''}`).includes(normalizeText(q))))
        .sort((a, b) => a.product.name.localeCompare(b.product.name, 'pt-BR') || a.variant.sort_order - b.variant.sort_order),
    [products, lowOnly, q],
  )

  const totals = useMemo(() => {
    const all = products.flatMap((p) => p.variants)
    return { units: all.reduce((n, v) => n + v.stock, 0), soldOut: all.filter((v) => v.stock === 0).length, low: all.filter((v) => v.stock > 0 && v.stock <= LOW_STOCK).length }
  }, [products])

  return (
    <div>
      <PageHeader title="Estoque" description="Ajuste as quantidades por cor e tamanho. As vendas baixam o estoque automaticamente." actions={<SearchInput value={q} onChange={setQ} placeholder="Produto, cor ou tamanho" />} />

      <div className="mb-4 grid grid-cols-3 gap-3">
        {[
          { label: 'Unidades em estoque', value: totals.units },
          { label: 'Estoque baixo', value: totals.low },
          { label: 'Variações esgotadas', value: totals.soldOut },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-linen/80 bg-ivory p-4">
            <p className="text-[0.68rem] tracking-[0.12em] text-taupe uppercase">{k.label}</p>
            <p className="font-display text-3xl">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex gap-2">
        {[
          [false, 'Todas as variações'],
          [true, `Estoque baixo (≤ ${LOW_STOCK})`],
        ].map(([v, label]) => (
          <button
            key={String(v)}
            onClick={() => setParams(v ? { baixo: '1' } : {}, { replace: true })}
            className={`rounded-full border px-4 py-2 text-xs transition ${lowOnly === v ? 'border-espresso bg-espresso text-ivory' : 'border-linen bg-ivory hover:border-gold-300'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <Alert>{errorMessage(error)}</Alert>}

      <Panel>
        {isLoading ? (
          <div className="flex justify-center py-16 text-gold-600">
            <Spinner className="h-7 w-7 border-2" />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState title={lowOnly ? 'Nenhuma variação com estoque baixo' : 'Nenhuma variação encontrada'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className={thClass}>Produto</th>
                  <th className={thClass}>Cor</th>
                  <th className={thClass}>Tamanho</th>
                  <th className={thClass}>Situação</th>
                  <th className={`${thClass} text-right`}>Quantidade</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ product, variant }) => (
                  <StockRow key={`${variant.id}-${variant.stock}`} product={product} variant={variant} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}

function StockRow({ product, variant }: { product: Product; variant: ProductVariant }) {
  const invalidate = useInvalidate()
  const toast = useUI((s) => s.toast)
  const [value, setValue] = useState(String(variant.stock))
  const [saving, setSaving] = useState(false)
  const current = Number(value) || 0
  const dirty = current !== variant.stock

  const save = async (next: number) => {
    const qty = Math.max(0, Math.floor(next))
    setValue(String(qty))
    if (qty === variant.stock) return
    setSaving(true)
    const { error } = await supabase.from('product_variants').update({ stock: qty }).eq('id', variant.id)
    setSaving(false)
    if (error) {
      setValue(String(variant.stock))
      return toast({ title: 'Erro ao salvar estoque', description: errorMessage(error) })
    }
    invalidate('products', 'dashboard')
  }

  return (
    <tr className="border-t border-linen/70 hover:bg-cream/50">
      <td className={tdClass}>
        <Link to={`/admin/produtos/${product.id}`} className="flex items-center gap-3">
          <ProductImage src={coverOf(product, variant.color_name)} alt="" placeholderLabel={false} className="h-12 w-9 shrink-0 rounded-lg" />
          <span className="max-w-[240px] truncate font-medium hover:text-gold-700">{product.name}</span>
        </Link>
      </td>
      <td className={tdClass}>
        <span className="flex items-center gap-2 whitespace-nowrap">
          <span className="h-3.5 w-3.5 rounded-full border border-linen" style={{ background: variant.color_hex }} />
          {variant.color_name}
        </span>
      </td>
      <td className={tdClass}>{variant.size}</td>
      <td className={tdClass}>
        <Pill tone={variant.stock === 0 ? 'bad' : variant.stock <= LOW_STOCK ? 'warn' : 'good'}>{variant.stock === 0 ? 'Esgotado' : variant.stock <= LOW_STOCK ? 'Baixo' : 'OK'}</Pill>
      </td>
      <td className={`${tdClass} text-right`}>
        <div className="inline-flex items-center gap-1">
          <button onClick={() => save(current - 1)} disabled={current <= 0 || saving} className="rounded-full p-1.5 hover:bg-sand disabled:opacity-30" aria-label="Diminuir">
            <Minus className="h-3.5 w-3.5" />
          </button>
          <input
            type="number"
            min={0}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => dirty && save(current)}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            className={`w-16 rounded-lg border px-2 py-1.5 text-center tabular-nums focus:border-gold-400 focus:outline-none ${dirty ? 'border-gold-400 bg-gold-50' : 'border-linen bg-ivory'}`}
            aria-label={`Estoque de ${product.name} ${variant.color_name} ${variant.size}`}
          />
          <button onClick={() => save(current + 1)} disabled={saving} className="rounded-full p-1.5 hover:bg-sand disabled:opacity-30" aria-label="Aumentar">
            <Plus className="h-3.5 w-3.5" />
          </button>
          <span className="w-5">{saving && <Spinner className="h-3.5 w-3.5 border-2 text-gold-600" />}</span>
        </div>
      </td>
    </tr>
  )
}
