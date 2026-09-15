import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { Spinner } from '../../components/CartBits'
import { ProductImage } from '../../components/ProductImage'
import { slugify } from '../../lib/commerce'
import { removeImages } from '../../lib/images'
import { errorMessage, supabase } from '../../lib/supabase'
import { useUI } from '../../store/ui'
import type { Section } from '../../types'
import { useAdminProducts, useAdminSections, useInvalidate } from '../data'
import { Alert, confirmAction, CoverUpload, EmptyState, Modal, PageHeader, Pill, TextArea, TextField, Toggle } from '../ui'

const empty = { name: '', slug: '', tagline: '', description: '', categories: [] as string[], cover_url: null as string | null, cover_path: null as string | null, sort_order: 0, active: true }

export default function SectionsAdmin() {
  const { data: sections = [], isLoading, error } = useAdminSections()
  const { data: products = [] } = useAdminProducts()
  const invalidate = useInvalidate()
  const toast = useUI((s) => s.toast)
  const [editing, setEditing] = useState<Section | 'new' | null>(null)

  const remove = async (s: Section) => {
    const count = products.filter((p) => p.section_id === s.id).length
    if (count) return toast({ title: 'Seção com produtos', description: `Mova ou remova os ${count} produtos de “${s.name}” antes de excluí-la.` })
    const ok = await confirmAction({ title: 'Remover seção', description: `A seção “${s.name}” será removida da loja.`, confirmLabel: 'Remover', danger: true })
    if (!ok) return
    const { error } = await supabase.from('sections').delete().eq('id', s.id)
    if (error) return toast({ title: 'Erro ao remover', description: errorMessage(error) })
    await removeImages([s.cover_path])
    toast({ title: 'Seção removida', tone: 'success' })
    invalidate('sections', 'collections')
  }

  return (
    <div>
      <PageHeader
        title="Seções"
        description="As grandes áreas da loja (ex.: Casual, Fitness). Aparecem no menu e na página inicial."
        actions={
          <button onClick={() => setEditing('new')} className="btn btn-gold">
            <Plus className="h-4 w-4" /> Nova seção
          </button>
        }
      />
      {error && <Alert>{errorMessage(error)}</Alert>}
      {isLoading ? (
        <div className="flex justify-center py-16 text-gold-600">
          <Spinner className="h-7 w-7 border-2" />
        </div>
      ) : sections.length === 0 ? (
        <EmptyState title="Nenhuma seção" description="Crie a primeira seção para começar a cadastrar produtos." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((s, i) => {
            const count = products.filter((p) => p.section_id === s.id).length
            return (
              <motion.article key={s.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="overflow-hidden rounded-3xl border border-linen/80 bg-ivory">
                <ProductImage src={s.cover_url} alt={s.name} placeholderLabel={false} className="aspect-[16/9] w-full" />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-3xl leading-tight">{s.name}</h2>
                      <p className="text-xs text-taupe">/loja/{s.slug}</p>
                    </div>
                    <Pill tone={s.active ? 'good' : 'neutral'}>{s.active ? 'Visível' : 'Oculta'}</Pill>
                  </div>
                  {s.tagline && <p className="mt-2 text-sm text-cocoa">{s.tagline}</p>}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {s.categories.map((c) => (
                      <span key={c} className="rounded-full bg-sand px-2 py-0.5 text-[0.68rem] text-cocoa">
                        {c}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-linen pt-3">
                    <span className="text-sm text-taupe">
                      {count} {count === 1 ? 'produto' : 'produtos'}
                    </span>
                    <div>
                      <button onClick={() => setEditing(s)} className="rounded-full p-2 hover:bg-sand" aria-label={`Editar ${s.name}`}>
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => remove(s)} className="rounded-full p-2 hover:bg-rose/10 hover:text-rose" aria-label={`Remover ${s.name}`}>
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

      {editing && <SectionForm key={editing === 'new' ? 'new' : editing.id} section={editing === 'new' ? null : editing} nextOrder={sections.length} onClose={() => setEditing(null)} />}
    </div>
  )
}

function SectionForm({ section, nextOrder, onClose }: { section: Section | null; nextOrder: number; onClose: () => void }) {
  const invalidate = useInvalidate()
  const toast = useUI((s) => s.toast)
  const [form, setForm] = useState(section ? { ...empty, ...section, tagline: section.tagline ?? '', description: section.description ?? '' } : { ...empty, sort_order: nextOrder })
  const [slugTouched, setSlugTouched] = useState(!!section)
  const [newCategory, setNewCategory] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const slug = slugTouched ? form.slug : slugify(form.name)

  const addCategory = () => {
    const c = newCategory.trim()
    if (c && !form.categories.includes(c)) setForm((f) => ({ ...f, categories: [...f.categories, c] }))
    setNewCategory('')
  }

  const save = async () => {
    if (!form.name.trim() || !slugify(slug)) return setError('Informe o nome da seção.')
    setSaving(true)
    setError(null)
    const row = {
      name: form.name.trim(),
      slug: slugify(slug),
      tagline: form.tagline.trim() || null,
      description: form.description.trim() || null,
      categories: form.categories,
      cover_url: form.cover_url,
      cover_path: form.cover_path,
      sort_order: Number(form.sort_order) || 0,
      active: form.active,
    }
    const { error } = section ? await supabase.from('sections').update(row).eq('id', section.id) : await supabase.from('sections').insert(row)
    setSaving(false)
    if (error) return setError(errorMessage(error))
    if (section?.cover_path && section.cover_path !== form.cover_path) removeImages([section.cover_path])
    toast({ title: section ? 'Seção atualizada' : 'Seção criada', description: row.name, tone: 'success' })
    invalidate('sections', 'products')
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={section ? 'Editar seção' : 'Nova seção'}
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
        <TextField label="Nome" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex.: Fitness" />
        <TextField
          label="Endereço (slug)"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true)
            setForm((f) => ({ ...f, slug: e.target.value }))
          }}
          hint={`/loja/${slugify(slug) || '...'}`}
        />
        <TextField label="Frase de destaque" className="sm:col-span-2" value={form.tagline} onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))} placeholder="Ex.: Movimento com essência" />
        <TextArea label="Descrição" className="sm:col-span-2" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        <div className="sm:col-span-2">
          <p className="mb-1.5 text-xs font-medium tracking-[0.12em] text-cocoa uppercase">Categorias</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {form.categories.map((c) => (
              <span key={c} className="flex items-center gap-1 rounded-full bg-sand py-1 pr-1 pl-3 text-xs">
                {c}
                <button type="button" onClick={() => setForm((f) => ({ ...f, categories: f.categories.filter((x) => x !== c) }))} className="rounded-full p-0.5 hover:bg-linen" aria-label={`Remover ${c}`}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault()
                  addCategory()
                }
              }}
              onBlur={addCategory}
              placeholder="Adicionar e Enter"
              className="input w-40! rounded-full! px-3! py-1.5! text-xs!"
              aria-label="Nova categoria"
            />
          </div>
          <p className="mt-1 text-xs text-taupe">Viram atalhos no menu e filtros da seção.</p>
        </div>
        <div className="sm:col-span-2">
          <CoverUpload label="Foto de capa" folder="sections" value={{ url: form.cover_url, path: form.cover_path }} onChange={(v) => setForm((f) => ({ ...f, cover_url: v.url, cover_path: v.path }))} />
        </div>
        <TextField label="Ordem de exibição" type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))} />
        <div className="flex items-end pb-2">
          <Toggle checked={form.active} onChange={(v) => setForm((f) => ({ ...f, active: v }))} label={form.active ? 'Visível na loja' : 'Oculta'} />
        </div>
      </div>
    </Modal>
  )
}
