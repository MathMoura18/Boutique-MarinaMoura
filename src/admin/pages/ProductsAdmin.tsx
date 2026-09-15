import { ImageOff, Pencil, Plus, Trash2 } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Spinner } from '../../components/CartBits'
import { ProductImage } from '../../components/ProductImage'
import { LOW_STOCK, normalizeText } from '../../lib/commerce'
import { money } from '../../lib/format'
import { removeImages } from '../../lib/images'
import { coverOf, stockOf } from '../../lib/product'
import { errorMessage, supabase } from '../../lib/supabase'
import { useUI } from '../../store/ui'
import type { Product } from '../../types'
import { useAdminProducts, useAdminSections, useInvalidate } from '../data'
import { Alert, confirmAction, EmptyState, PageHeader, Panel, Pill, SearchInput, tdClass, thClass, Toggle } from '../ui'

type StatusFilter = 'all' | 'active' | 'inactive' | 'no-photo' | 'sold-out'

export default function ProductsAdmin() {
  const { data: products = [], isLoading, error } = useAdminProducts()
  const { data: sections = [] } = useAdminSections()
  const invalidate = useInvalidate()
  const toast = useUI((s) => s.toast)
  const [q, setQ] = useState('')
  const [section, setSection] = useState('all')
  const [status, setStatus] = useState<StatusFilter>('all')

  const list = products.filter((p) => {
    if (section !== 'all' && p.section_id !== section) return false
    if (status === 'active' && !p.active) return false
    if (status === 'inactive' && p.active) return false
    if (status === 'no-photo' && p.images.length > 0) return false
    if (status === 'sold-out' && stockOf(p) > 0) return false
    return !q || normalizeText(`${p.name} ${p.slug} ${p.category ?? ''}`).includes(normalizeText(q))
  })

  const toggleActive = async (p: Product) => {
    const { error } = await supabase.from('products').update({ active: !p.active }).eq('id', p.id)
    if (error) return toast({ title: 'Erro', description: errorMessage(error) })
    toast({ title: p.active ? 'Produto ocultado da loja' : 'Produto publicado', description: p.name, tone: 'success' })
    invalidate('products', 'dashboard')
  }

  const remove = async (p: Product) => {
    const ok = await confirmAction({
      title: 'Remover produto',
      description: `“${p.name}” e todas as suas fotos e variações serão removidos. Pedidos antigos continuam registrados. Esta ação não pode ser desfeita.`,
      confirmLabel: 'Remover',
      danger: true,
    })
    if (!ok) return
    const { error } = await supabase.from('products').delete().eq('id', p.id)
    if (error) return toast({ title: 'Erro ao remover', description: errorMessage(error) })
    await removeImages(p.images.map((i) => i.path))
    toast({ title: 'Produto removido', description: p.name, tone: 'success' })
    invalidate('products', 'dashboard')
  }

  return (
    <div>
      <PageHeader
        title="Produtos"
        description={`${products.length} produtos cadastrados`}
        actions={
          <Link to="/admin/produtos/novo" className="btn btn-gold">
            <Plus className="h-4 w-4" /> Novo produto
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Buscar por nome ou categoria" />
        <select value={section} onChange={(e) => setSection(e.target.value)} className="input w-auto! py-2.5!" aria-label="Filtrar por seção">
          <option value="all">Todas as seções</option>
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} className="input w-auto! py-2.5!" aria-label="Filtrar por status">
          <option value="all">Todos os status</option>
          <option value="active">Publicados</option>
          <option value="inactive">Ocultos</option>
          <option value="no-photo">Sem fotos</option>
          <option value="sold-out">Esgotados</option>
        </select>
      </div>

      {error && <Alert>{errorMessage(error)}</Alert>}

      <Panel>
        {isLoading ? (
          <div className="flex justify-center py-16 text-gold-600">
            <Spinner className="h-7 w-7 border-2" />
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            title={products.length ? 'Nenhum produto com esses filtros' : 'Nenhum produto ainda'}
            action={
              !products.length && (
                <Link to="/admin/produtos/novo" className="btn btn-primary">
                  Cadastrar primeiro produto
                </Link>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className={thClass}>Produto</th>
                  <th className={thClass}>Seção</th>
                  <th className={thClass}>Preço</th>
                  <th className={thClass}>Estoque</th>
                  <th className={thClass}>Na loja</th>
                  <th className={thClass} />
                </tr>
              </thead>
              <tbody>
                {list.map((p, i) => {
                  const stock = stockOf(p)
                  return (
                    <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i, 12) * 0.02 }} className="border-t border-linen/70 hover:bg-cream/50">
                      <td className={tdClass}>
                        <Link to={`/admin/produtos/${p.id}`} className="flex items-center gap-3">
                          <span className="relative shrink-0">
                            <ProductImage src={coverOf(p)} alt="" placeholderLabel={false} className="h-16 w-12 rounded-lg" />
                            {p.images.length === 0 && (
                              <span className="absolute -right-1.5 -bottom-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gold-500 text-ivory" title="Sem fotos">
                                <ImageOff className="h-3 w-3" />
                              </span>
                            )}
                          </span>
                          <span className="min-w-0">
                            <span className="block max-w-[260px] truncate font-medium hover:text-gold-700">{p.name}</span>
                            <span className="block text-xs text-taupe">
                              {p.category ?? 'Sem categoria'} · {p.images.length} {p.images.length === 1 ? 'foto' : 'fotos'}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className={tdClass}>
                        <span className="whitespace-nowrap">{p.section?.name}</span>
                        {p.collection && <span className="block text-xs text-taupe">{p.collection.name}</span>}
                      </td>
                      <td className={`${tdClass} whitespace-nowrap`}>
                        {money(p.price)}
                        {p.compare_at_price && p.compare_at_price > p.price && <span className="block text-xs text-taupe line-through">{money(p.compare_at_price)}</span>}
                      </td>
                      <td className={tdClass}>
                        <Pill tone={stock === 0 ? 'bad' : stock <= LOW_STOCK ? 'warn' : 'good'}>{stock === 0 ? 'Esgotado' : `${stock} un.`}</Pill>
                      </td>
                      <td className={tdClass}>
                        <Toggle checked={p.active} onChange={() => toggleActive(p)} />
                      </td>
                      <td className={`${tdClass} text-right whitespace-nowrap`}>
                        <Link to={`/admin/produtos/${p.id}`} className="inline-flex rounded-full p-2 text-cocoa hover:bg-sand" aria-label={`Editar ${p.name}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button onClick={() => remove(p)} className="rounded-full p-2 text-cocoa hover:bg-rose/10 hover:text-rose" aria-label={`Remover ${p.name}`}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}
