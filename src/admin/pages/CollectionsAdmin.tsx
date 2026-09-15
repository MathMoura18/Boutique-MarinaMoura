import { Pencil, Plus, Trash2 } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { Spinner } from '../../components/CartBits'
import { ProductImage } from '../../components/ProductImage'
import { slugify } from '../../lib/commerce'
import { removeImages } from '../../lib/images'
import { errorMessage, supabase } from '../../lib/supabase'
import { useUI } from '../../store/ui'
import type { Collection } from '../../types'
import { useAdminCollections, useAdminProducts, useAdminSections, useInvalidate } from '../data'
import { Alert, confirmAction, CoverUpload, EmptyState, Modal, PageHeader, Pill, SelectField, TextArea, TextField, Toggle } from '../ui'

export default function CollectionsAdmin() {
  const { data: collections = [], isLoading, error } = useAdminCollections()
  const { data: sections = [] } = useAdminSections()
  const { data: products = [] } = useAdminProducts()
  const invalidate = useInvalidate()
  const toast = useUI((s) => s.toast)
  const [editing, setEditing] = useState<Collection | 'new' | null>(null)

  const remove = async (c: Collection) => {
    const count = products.filter((p) => p.collection_id === c.id).length
    const ok = await confirmAction({
      title: 'Remover coleção',
      description: count ? `“${c.name}” tem ${count} produtos. Eles continuarão na loja, apenas sem coleção.` : `A coleção “${c.name}” será removida.`,
      confirmLabel: 'Remover',
      danger: true,
    })
    if (!ok) return
    const { error } = await supabase.from('collections').delete().eq('id', c.id)
    if (error) return toast({ title: 'Erro ao remover', description: errorMessage(error) })
    await removeImages([c.cover_path])
    toast({ title: 'Coleção removida', tone: 'success' })
    invalidate('collections', 'products')
  }

  return (
    <div>
      <PageHeader
        title="Coleções"
        description="Agrupamentos editoriais (ex.: Primavera 2026). Têm página própria com capa."
        actions={
          <button onClick={() => setEditing('new')} className="btn btn-gold">
            <Plus className="h-4 w-4" /> Nova coleção
          </button>
        }
      />
      {error && <Alert>{errorMessage(error)}</Alert>}
      {isLoading ? (
        <div className="flex justify-center py-16 text-gold-600">
          <Spinner className="h-7 w-7 border-2" />
        </div>
      ) : collections.length === 0 ? (
        <EmptyState title="Nenhuma coleção" description="Crie coleções para contar histórias com suas peças." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {collections.map((c, i) => {
            const count = products.filter((p) => p.collection_id === c.id).length
            const section = sections.find((s) => s.id === c.section_id)
            return (
              <motion.article key={c.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="overflow-hidden rounded-3xl border border-linen/80 bg-ivory">
                <div className="relative">
                  <ProductImage src={c.cover_url} alt={c.name} placeholderLabel={false} className="aspect-[4/3] w-full" />
                  <span className="absolute top-3 right-3">
                    <Pill tone={c.active ? 'good' : 'neutral'}>{c.active ? 'Visível' : 'Oculta'}</Pill>
                  </span>
                </div>
                <div className="p-5">
                  <h2 className="font-display text-3xl leading-tight">{c.name}</h2>
                  <p className="text-xs text-taupe">
                    /colecoes/{c.slug} {section && `· ${section.name}`}
                  </p>
                  {c.description && <p className="mt-2 line-clamp-2 text-sm text-cocoa">{c.description}</p>}
                  <div className="mt-4 flex items-center justify-between border-t border-linen pt-3">
                    <span className="text-sm text-taupe">
                      {count} {count === 1 ? 'produto' : 'produtos'}
                    </span>
                    <div>
                      <button onClick={() => setEditing(c)} className="rounded-full p-2 hover:bg-sand" aria-label={`Editar ${c.name}`}>
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => remove(c)} className="rounded-full p-2 hover:bg-rose/10 hover:text-rose" aria-label={`Remover ${c.name}`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.article>
            )
          })}
        </div>
      )}

      {editing && <CollectionForm key={editing === 'new' ? 'new' : editing.id} collection={editing === 'new' ? null : editing} nextOrder={collections.length} onClose={() => setEditing(null)} />}
    </div>
  )
}

function CollectionForm({ collection, nextOrder, onClose }: { collection: Collection | null; nextOrder: number; onClose: () => void }) {
  const { data: sections = [] } = useAdminSections()
  const invalidate = useInvalidate()
  const toast = useUI((s) => s.toast)
  const [form, setForm] = useState({
    name: collection?.name ?? '',
    slug: collection?.slug ?? '',
    description: collection?.description ?? '',
    section_id: collection?.section_id ?? '',
    cover_url: collection?.cover_url ?? null,
    cover_path: collection?.cover_path ?? null,
    sort_order: collection?.sort_order ?? nextOrder,
    active: collection?.active ?? true,
  })
  const [slugTouched, setSlugTouched] = useState(!!collection)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const slug = slugTouched ? form.slug : slugify(form.name)

  const save = async () => {
    if (!form.name.trim() || !slugify(slug)) return setError('Informe o nome da coleção.')
    setSaving(true)
    setError(null)
    const row = {
      name: form.name.trim(),
      slug: slugify(slug),
      description: form.description.trim() || null,
      section_id: form.section_id || null,
      cover_url: form.cover_url,
      cover_path: form.cover_path,
      sort_order: Number(form.sort_order) || 0,
      active: form.active,
    }
    const { error } = collection ? await supabase.from('collections').update(row).eq('id', collection.id) : await supabase.from('collections').insert(row)
    setSaving(false)
    if (error) return setError(errorMessage(error))
    if (collection?.cover_path && collection.cover_path !== form.cover_path) removeImages([collection.cover_path])
    toast({ title: collection ? 'Coleção atualizada' : 'Coleção criada', description: row.name, tone: 'success' })
    invalidate('collections', 'products')
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={collection ? 'Editar coleção' : 'Nova coleção'}
      size="lg"
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-gold" onClick={save} disabled={saving}>
            {saving ? <Spinner /> : 'Salvar'}
          </button>
        </>
      }
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {error && (
          <div className="sm:col-span-2">
            <Alert>{error}</Alert>
          </div>
        )}
        <TextField label="Nome" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex.: Primavera 2026" />
        <TextField
          label="Endereço (slug)"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true)
            setForm((f) => ({ ...f, slug: e.target.value }))
          }}
          hint={`/colecoes/${slugify(slug) || '...'}`}
        />
        <TextArea label="Descrição" className="sm:col-span-2" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        <SelectField label="Seção (opcional)" value={form.section_id} onChange={(e) => setForm((f) => ({ ...f, section_id: e.target.value }))}>
          <option value="">Todas as seções</option>
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </SelectField>
        <TextField label="Ordem de exibição" type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))} />
        <div className="sm:col-span-2">
          <CoverUpload label="Foto de capa" folder="collections" value={{ url: form.cover_url, path: form.cover_path }} onChange={(v) => setForm((f) => ({ ...f, cover_url: v.url, cover_path: v.path }))} />
        </div>
        <Toggle checked={form.active} onChange={(v) => setForm((f) => ({ ...f, active: v }))} label={form.active ? 'Visível na loja' : 'Oculta'} />
      </div>
    </Modal>
  )
}
