import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, GripVertical, ImagePlus, Plus, Star, Trash2, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Spinner } from '../../components/CartBits'
import { fetchProductById } from '../../lib/api'
import { slugify } from '../../lib/commerce'
import { money } from '../../lib/format'
import { removeImages, uploadImage } from '../../lib/images'
import { colorsOf, sortSizes } from '../../lib/product'
import { errorMessage, supabase } from '../../lib/supabase'
import { useUI } from '../../store/ui'
import type { Product, ProductTag } from '../../types'
import { useAdminCollections, useAdminProducts, useAdminSections, useInvalidate } from '../data'
import { Alert, PageHeader, Panel, SelectField, TextArea, TextField, Toggle } from '../ui'

interface EditableImage {
  key: string
  id: string | null
  url: string
  path: string | null
  alt: string
  color_name: string | null
}

interface ColorRow {
  key: string
  name: string
  hex: string
}

const LETTER_SIZES = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'U']
const NUMBER_SIZES = ['34', '36', '38', '40', '42', '44', '46']
const TAGS: { id: ProductTag; label: string; hint: string }[] = [
  { id: 'novo', label: 'Novidade', hint: 'Selo “Novo” e filtro de novidades' },
  { id: 'mais-vendido', label: 'Mais vendido', hint: 'Aparece no carrossel da home' },
  { id: 'destaque', label: 'Destaque', hint: 'Aparece no topo da página inicial' },
]

const uid = () => crypto.randomUUID()
const stockKey = (color: string, size: string) => `${color}|${size}`

export default function ProductEditor() {
  const { id } = useParams()
  const [product, setProduct] = useState<Product | null | undefined>(id ? undefined : null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetchProductById(id)
      .then((p) => setProduct(p))
      .catch((e) => setLoadError(errorMessage(e)))
  }, [id])

  if (loadError) return <Alert>{loadError}</Alert>
  if (product === undefined)
    return (
      <div className="flex justify-center py-24 text-gold-600">
        <Spinner className="h-8 w-8 border-2" />
      </div>
    )
  if (id && product === null) return <Alert>Produto não encontrado.</Alert>
  return <EditorForm key={product?.id ?? 'novo'} initial={product} />
}

function EditorForm({ initial }: { initial: Product | null }) {
  const navigate = useNavigate()
  const invalidate = useInvalidate()
  const toast = useUI((s) => s.toast)
  const { data: sections = [] } = useAdminSections()
  const { data: collections = [] } = useAdminCollections()
  const { data: allProducts = [] } = useAdminProducts()

  const isNew = !initial
  const [productId] = useState(initial?.id ?? uid())
  const [name, setName] = useState(initial?.name ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(!!initial)
  const [description, setDescription] = useState(initial?.description ?? '')
  const [details, setDetails] = useState((initial?.details ?? []).join('\n'))
  const [sectionId, setSectionId] = useState(initial?.section_id ?? '')
  const [collectionId, setCollectionId] = useState(initial?.collection_id ?? '')
  const [category, setCategory] = useState(initial?.category ?? '')
  const [price, setPrice] = useState(initial ? String(initial.price) : '')
  const [compareAt, setCompareAt] = useState(initial?.compare_at_price ? String(initial.compare_at_price) : '')
  const [tags, setTags] = useState<ProductTag[]>(initial?.tags ?? ['novo'])
  const [active, setActive] = useState(initial?.active ?? true)

  const [images, setImages] = useState<EditableImage[]>(
    (initial?.images ?? []).map((i) => ({ key: i.id, id: i.id, url: i.url, path: i.path, alt: i.alt ?? '', color_name: i.color_name })),
  )
  const [removedImages, setRemovedImages] = useState<EditableImage[]>([])
  const [uploading, setUploading] = useState(0)

  const [colors, setColors] = useState<ColorRow[]>(
    initial ? colorsOf(initial).map((c) => ({ key: uid(), ...c })) : [{ key: uid(), name: '', hex: '#D8C1A0' }],
  )
  const [sizes, setSizes] = useState<string[]>(initial ? sortSizes([...new Set(initial.variants.map((v) => v.size))]) : ['P', 'M', 'G'])
  const [stock, setStock] = useState<Record<string, number>>(() =>
    Object.fromEntries((initial?.variants ?? []).map((v) => [stockKey(v.color_name, v.size), v.stock])),
  )
  const [customSize, setCustomSize] = useState('')
  const [fillAll, setFillAll] = useState('')

  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const slugValue = slugTouched ? slug : slugify(name)
  const section = sections.find((s) => s.id === sectionId)
  const sectionCollections = collections.filter((c) => !c.section_id || c.section_id === sectionId)
  const knownColors = useMemo(() => {
    const m = new Map<string, string>()
    allProducts.forEach((p) => colorsOf(p).forEach((c) => m.set(c.name, c.hex)))
    return [...m.entries()].filter(([n]) => !colors.some((c) => c.name === n)).slice(0, 12)
  }, [allProducts, colors])
  const validColors = colors.filter((c) => c.name.trim())
  const totalStock = validColors.reduce((n, c) => n + sizes.reduce((m, s) => m + (stock[stockKey(c.name.trim(), s)] ?? 0), 0), 0)
  const numPrice = Number(price.replace(',', '.'))
  const numCompare = Number(compareAt.replace(',', '.'))

  /* ——— Fotos ——— */
  const addFiles = async (files: FileList | File[]) => {
    const list = [...files].filter((f) => f.type.startsWith('image/'))
    if (!list.length) return
    setUploading((n) => n + list.length)
    await Promise.all(
      list.map(async (file) => {
        try {
          const { url, path } = await uploadImage(file, `products/${productId}`)
          setImages((imgs) => [...imgs, { key: uid(), id: null, url, path, alt: '', color_name: null }])
        } catch (e) {
          toast({ title: `Falha ao enviar ${file.name}`, description: errorMessage(e) })
        } finally {
          setUploading((n) => n - 1)
        }
      }),
    )
  }

  const moveImage = (from: number, to: number) =>
    setImages((imgs) => {
      if (to < 0 || to >= imgs.length) return imgs
      const next = [...imgs]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })

  const removeImage = (img: EditableImage) => {
    setImages((imgs) => imgs.filter((i) => i.key !== img.key))
    setRemovedImages((r) => [...r, img])
  }

  /* ——— Salvar ——— */
  const save = async () => {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = 'Informe o nome'
    if (!slugify(slugValue)) errs.slug = 'Informe o endereço (slug)'
    if (!sectionId) errs.section = 'Escolha a seção'
    if (!numPrice || numPrice <= 0) errs.price = 'Preço inválido'
    if (compareAt && numCompare <= numPrice) errs.compareAt = 'O preço “de” deve ser maior que o preço de venda'
    if (!validColors.length) errs.colors = 'Cadastre pelo menos uma cor'
    if (!sizes.length) errs.sizes = 'Selecione pelo menos um tamanho'
    if (new Set(validColors.map((c) => c.name.trim().toLowerCase())).size !== validColors.length) errs.colors = 'Há cores com nomes repetidos'
    setErrors(errs)
    if (Object.keys(errs).length) {
      setFormError('Revise os campos destacados.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (uploading) return toast({ title: 'Aguarde o envio das fotos terminar' })

    setSaving(true)
    setFormError(null)
    try {
      const row = {
        id: productId,
        name: name.trim(),
        slug: slugify(slugValue),
        description: description.trim(),
        details: details.split('\n').map((d) => d.trim()).filter(Boolean),
        section_id: sectionId,
        collection_id: collectionId || null,
        category: category.trim() || null,
        price: numPrice,
        compare_at_price: compareAt ? numCompare : null,
        tags,
        active,
      }
      const { error } = isNew ? await supabase.from('products').insert(row) : await supabase.from('products').update(row).eq('id', productId)
      if (error) throw error

      // Variações: grava a grade cor × tamanho e remove combinações que saíram
      const desired = validColors.flatMap((c, ci) =>
        sizes.map((s, si) => ({
          product_id: productId,
          color_name: c.name.trim(),
          color_hex: c.hex,
          size: s,
          stock: Math.max(0, Math.floor(stock[stockKey(c.name.trim(), s)] ?? 0)),
          sort_order: ci * 100 + si,
        })),
      )
      const { error: upErr } = await supabase.from('product_variants').upsert(desired, { onConflict: 'product_id,color_name,size' })
      if (upErr) throw upErr
      const keep = new Set(desired.map((d) => stockKey(d.color_name, d.size)))
      const stale = (initial?.variants ?? []).filter((v) => !keep.has(stockKey(v.color_name, v.size))).map((v) => v.id)
      if (stale.length) {
        const { error: delErr } = await supabase.from('product_variants').delete().in('id', stale)
        if (delErr) throw delErr
      }

      // Fotos: remove as excluídas e grava ordem/cor das restantes
      const removedIds = removedImages.map((i) => i.id).filter((x): x is string => !!x)
      if (removedIds.length) {
        const { error: imgDel } = await supabase.from('product_images').delete().in('id', removedIds)
        if (imgDel) throw imgDel
      }
      if (images.length) {
        const validNames = new Set(validColors.map((c) => c.name.trim()))
        const { error: imgErr } = await supabase.from('product_images').upsert(
          images.map((img, i) => ({
            id: img.id ?? uid(),
            product_id: productId,
            url: img.url,
            path: img.path,
            alt: img.alt.trim() || null,
            color_name: img.color_name && validNames.has(img.color_name) ? img.color_name : null,
            sort_order: i,
          })),
        )
        if (imgErr) throw imgErr
      }
      await removeImages(removedImages.map((i) => i.path))

      await invalidate('products', 'dashboard')
      toast({ title: isNew ? 'Produto criado' : 'Alterações salvas', description: row.name, tone: 'success' })
      if (isNew) navigate(`/admin/produtos/${productId}`, { replace: true })
      else navigate('/admin/produtos')
    } catch (e) {
      setFormError(errorMessage(e))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="pb-24">
      <Link to="/admin/produtos" className="mb-4 inline-flex items-center gap-2 text-sm text-cocoa hover:text-gold-700">
        <ArrowLeft className="h-4 w-4" /> Produtos
      </Link>
      <PageHeader
        title={isNew ? 'Novo produto' : name || 'Editar produto'}
        description={isNew ? 'Preencha as informações, envie as fotos e defina o estoque.' : `Última versão salva · /produto/${initial?.slug}`}
        actions={
          !isNew &&
          initial?.active && (
            <a href={`/produto/${initial.slug}`} target="_blank" rel="noreferrer" className="btn btn-outline px-4! py-2.5!">
              <ExternalLink className="h-4 w-4" /> Ver na loja
            </a>
          )
        }
      />

      {formError && (
        <div className="mb-6">
          <Alert>{formError}</Alert>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Panel title="Informações">
            <div className="grid gap-5 p-5 sm:grid-cols-2">
              <TextField label="Nome do produto" className="sm:col-span-2" value={name} error={errors.name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Vestido Midi Jasmim" />
              <TextField
                label="Endereço (slug)"
                className="sm:col-span-2"
                value={slugValue}
                error={errors.slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  setSlug(e.target.value)
                }}
                hint={`marinamoura.com.br/produto/${slugify(slugValue) || '...'}`}
              />
              <TextArea label="Descrição" className="sm:col-span-2" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Conte o que torna esta peça especial." />
              <TextArea
                label="Detalhes e composição"
                className="sm:col-span-2"
                rows={4}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={'100% viscose\nForro na parte superior\nLavar à mão'}
                hint="Um item por linha."
              />
            </div>
          </Panel>

          <Panel title="Fotos" actions={<span className="text-xs text-taupe">{images.length} {images.length === 1 ? 'foto' : 'fotos'}</span>}>
            <ImageManager
              images={images}
              uploading={uploading}
              colors={validColors.map((c) => c.name.trim())}
              onAdd={addFiles}
              onMove={moveImage}
              onRemove={removeImage}
              onChange={(key, patch) => setImages((imgs) => imgs.map((i) => (i.key === key ? { ...i, ...patch } : i)))}
            />
          </Panel>

          <Panel title="Variações e estoque" actions={<span className="text-sm text-taupe">Total: {totalStock} un.</span>}>
            <div className="space-y-6 p-5">
              {/* Cores */}
              <div>
                <p className="mb-2 text-xs font-medium tracking-[0.12em] text-cocoa uppercase">Cores</p>
                <div className="space-y-2">
                  <AnimatePresence initial={false}>
                    {colors.map((c) => (
                      <motion.div key={c.key} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-2">
                        <label className="relative h-11 w-11 shrink-0 cursor-pointer overflow-hidden rounded-full border border-linen" style={{ background: c.hex }} title="Escolher cor">
                          <input
                            type="color"
                            value={c.hex}
                            onChange={(e) => setColors((cs) => cs.map((x) => (x.key === c.key ? { ...x, hex: e.target.value } : x)))}
                            className="absolute inset-0 cursor-pointer opacity-0"
                            aria-label="Cor"
                          />
                        </label>
                        <input
                          value={c.name}
                          onChange={(e) => {
                            const prev = c.name.trim()
                            const nextName = e.target.value
                            setColors((cs) => cs.map((x) => (x.key === c.key ? { ...x, name: nextName } : x)))
                            // mantém estoque e fotos vinculados ao renomear a cor
                            setStock((st) => {
                              const out: Record<string, number> = {}
                              Object.entries(st).forEach(([k, v]) => {
                                const [col, size] = k.split('|')
                                out[col === prev ? stockKey(nextName.trim(), size) : k] = v
                              })
                              return out
                            })
                            setImages((imgs) => imgs.map((i) => (i.color_name === prev ? { ...i, color_name: nextName.trim() } : i)))
                          }}
                          placeholder="Nome da cor (ex.: Off-white)"
                          className="input py-2.5!"
                          aria-label="Nome da cor"
                        />
                        <button
                          type="button"
                          onClick={() => setColors((cs) => cs.filter((x) => x.key !== c.key))}
                          disabled={colors.length === 1}
                          className="rounded-full p-2 text-taupe hover:bg-rose/10 hover:text-rose disabled:opacity-30"
                          aria-label="Remover cor"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                {errors.colors && <p className="mt-1 text-xs text-rose">{errors.colors}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => setColors((cs) => [...cs, { key: uid(), name: '', hex: '#D8C1A0' }])} className="btn btn-outline px-4! py-2! text-xs">
                    <Plus className="h-3.5 w-3.5" /> Adicionar cor
                  </button>
                  {knownColors.map(([n, hex]) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setColors((cs) => [...cs.filter((x) => x.name.trim()), { key: uid(), name: n, hex }])}
                      className="flex items-center gap-1.5 rounded-full border border-linen bg-ivory px-2.5 py-1 text-xs hover:border-gold-300"
                    >
                      <span className="h-3 w-3 rounded-full border border-linen" style={{ background: hex }} /> {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tamanhos */}
              <div>
                <p className="mb-2 text-xs font-medium tracking-[0.12em] text-cocoa uppercase">Tamanhos</p>
                <div className="flex flex-wrap gap-1.5">
                  {[...LETTER_SIZES, ...NUMBER_SIZES, ...sizes.filter((s) => !LETTER_SIZES.includes(s) && !NUMBER_SIZES.includes(s))].map((s) => {
                    const on = sizes.includes(s)
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSizes((ss) => (on ? ss.filter((x) => x !== s) : sortSizes([...ss, s])))}
                        className={`min-w-11 rounded-xl border px-3 py-2 text-xs font-medium transition ${on ? 'border-espresso bg-espresso text-ivory' : 'border-linen bg-ivory hover:border-gold-300'}`}
                      >
                        {s}
                      </button>
                    )
                  })}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      const v = customSize.trim().toUpperCase()
                      if (v && !sizes.includes(v)) setSizes((ss) => sortSizes([...ss, v]))
                      setCustomSize('')
                    }}
                    className="flex"
                  >
                    <input value={customSize} onChange={(e) => setCustomSize(e.target.value)} placeholder="Outro" className="input w-24! rounded-xl! px-3! py-2! text-xs!" aria-label="Tamanho personalizado" />
                  </form>
                </div>
                {errors.sizes && <p className="mt-1 text-xs text-rose">{errors.sizes}</p>}
              </div>

              {/* Grade de estoque */}
              {validColors.length > 0 && sizes.length > 0 && (
                <div>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-medium tracking-[0.12em] text-cocoa uppercase">Estoque por variação</p>
                    <form
                      className="flex items-center gap-2"
                      onSubmit={(e) => {
                        e.preventDefault()
                        const v = Math.max(0, Number(fillAll) || 0)
                        setStock((st) => {
                          const out = { ...st }
                          validColors.forEach((c) => sizes.forEach((s) => (out[stockKey(c.name.trim(), s)] = v)))
                          return out
                        })
                      }}
                    >
                      <input type="number" min={0} value={fillAll} onChange={(e) => setFillAll(e.target.value)} placeholder="Qtd." className="input w-20! px-3! py-2! text-sm" aria-label="Quantidade para todas" />
                      <button className="btn btn-outline px-3! py-2! text-xs">Aplicar a todas</button>
                    </form>
                  </div>
                  <div className="overflow-x-auto rounded-2xl border border-linen">
                    <table className="w-full text-sm">
                      <thead className="bg-sand/50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-taupe">Cor</th>
                          {sizes.map((s) => (
                            <th key={s} className="px-2 py-2 text-center text-xs font-medium text-taupe">
                              {s}
                            </th>
                          ))}
                          <th className="px-3 py-2 text-right text-xs font-medium text-taupe">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validColors.map((c) => {
                          const cName = c.name.trim()
                          const rowTotal = sizes.reduce((n, s) => n + (stock[stockKey(cName, s)] ?? 0), 0)
                          return (
                            <tr key={c.key} className="border-t border-linen bg-ivory">
                              <td className="px-3 py-2">
                                <span className="flex items-center gap-2 whitespace-nowrap">
                                  <span className="h-4 w-4 rounded-full border border-linen" style={{ background: c.hex }} />
                                  {cName}
                                </span>
                              </td>
                              {sizes.map((s) => {
                                const k = stockKey(cName, s)
                                const v = stock[k] ?? 0
                                return (
                                  <td key={s} className="px-1.5 py-1.5 text-center">
                                    <input
                                      type="number"
                                      min={0}
                                      value={stock[k] ?? ''}
                                      placeholder="0"
                                      onChange={(e) => setStock((st) => ({ ...st, [k]: Math.max(0, Number(e.target.value) || 0) }))}
                                      className={`w-16 rounded-lg border px-2 py-1.5 text-center tabular-nums focus:border-gold-400 focus:outline-none ${v === 0 ? 'border-rose/30 bg-rose/5' : 'border-linen bg-cream/40'}`}
                                      aria-label={`Estoque ${cName} ${s}`}
                                    />
                                  </td>
                                )
                              })}
                              <td className="px-3 py-2 text-right font-medium tabular-nums">{rowTotal}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </Panel>
        </div>

        {/* Lateral */}
        <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <Panel title="Publicação">
            <div className="p-5">
              <Toggle checked={active} onChange={setActive} label={active ? 'Visível na loja' : 'Oculto da loja'} description="Produtos ocultos não aparecem para clientes." />
              {active && images.length === 0 && <p className="mt-3 rounded-xl bg-gold-50 px-3 py-2 text-xs text-gold-700">Dica: adicione fotos antes de publicar — a vitrine fica muito mais atraente.</p>}
            </div>
          </Panel>

          <Panel title="Preço">
            <div className="grid gap-4 p-5">
              <TextField label="Preço de venda (R$)" inputMode="decimal" value={price} error={errors.price} onChange={(e) => setPrice(e.target.value)} placeholder="0,00" />
              <TextField
                label="Preço “de” (opcional)"
                inputMode="decimal"
                value={compareAt}
                error={errors.compareAt}
                onChange={(e) => setCompareAt(e.target.value)}
                placeholder="0,00"
                hint={numCompare > numPrice && numPrice > 0 ? `Exibe ${Math.round((1 - numPrice / numCompare) * 100)}% off · de ${money(numCompare)} por ${money(numPrice)}` : 'Preencha para mostrar como promoção.'}
              />
            </div>
          </Panel>

          <Panel title="Organização">
            <div className="grid gap-4 p-5">
              <SelectField label="Seção" value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
                <option value="">Selecione…</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {!s.active ? ' (oculta)' : ''}
                  </option>
                ))}
              </SelectField>
              {errors.section && <p className="-mt-3 text-xs text-rose">{errors.section}</p>}
              <SelectField label="Coleção (opcional)" value={collectionId} onChange={(e) => setCollectionId(e.target.value)}>
                <option value="">Nenhuma</option>
                {sectionCollections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </SelectField>
              <div>
                <TextField label="Categoria" list="category-options" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex.: Vestidos" />
                <datalist id="category-options">
                  {section?.categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
                {section && section.categories.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {section.categories.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCategory(c)}
                        className={`rounded-full border px-2.5 py-1 text-xs ${category === c ? 'border-espresso bg-espresso text-ivory' : 'border-linen bg-ivory hover:border-gold-300'}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <p className="mb-2 text-xs font-medium tracking-[0.12em] text-cocoa uppercase">Destaques</p>
                <div className="space-y-2">
                  {TAGS.map((t) => (
                    <label key={t.id} className="flex cursor-pointer items-start gap-3 rounded-xl p-2 hover:bg-sand/50">
                      <input
                        type="checkbox"
                        checked={tags.includes(t.id)}
                        onChange={(e) => setTags((ts) => (e.target.checked ? [...ts, t.id] : ts.filter((x) => x !== t.id)))}
                        className="mt-1 h-4 w-4 accent-gold-500"
                      />
                      <span>
                        <span className="block text-sm">{t.label}</span>
                        <span className="block text-xs text-taupe">{t.hint}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      {/* Barra de ações */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-linen bg-ivory/95 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-10">
          <p className="hidden text-sm text-taupe sm:block">{uploading > 0 ? `Enviando ${uploading} foto(s)…` : isNew ? 'Novo produto ainda não salvo' : 'Lembre-se de salvar as alterações'}</p>
          <div className="ml-auto flex gap-2">
            <Link to="/admin/produtos" className="btn btn-outline">
              Cancelar
            </Link>
            <button onClick={save} disabled={saving || uploading > 0} className="btn btn-gold min-w-40">
              {saving ? <Spinner /> : isNew ? 'Criar produto' : 'Salvar alterações'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ——————————————————— Gerenciador de fotos ——————————————————— */

function ImageManager({
  images,
  uploading,
  colors,
  onAdd,
  onMove,
  onRemove,
  onChange,
}: {
  images: EditableImage[]
  uploading: number
  colors: string[]
  onAdd: (files: FileList | File[]) => void
  onMove: (from: number, to: number) => void
  onRemove: (img: EditableImage) => void
  onChange: (key: string, patch: Partial<EditableImage>) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  return (
    <div className="p-5">
      <div
        onDragOver={(e) => {
          if (dragIndex !== null) return
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          if (dragIndex !== null) return
          e.preventDefault()
          setDragOver(false)
          onAdd(e.dataTransfer.files)
        }}
        className={`rounded-2xl border-2 border-dashed p-4 transition ${dragOver ? 'border-gold-400 bg-gold-50' : 'border-linen'}`}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <AnimatePresence>
            {images.map((img, i) => (
              <motion.div
                key={img.key}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: dragIndex === i ? 0.5 : 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                draggable
                onDragStartCapture={() => setDragIndex(i)}
                onDragEndCapture={() => setDragIndex(null)}
                onDragOverCapture={(e) => {
                  e.preventDefault()
                  if (dragIndex !== null && dragIndex !== i) {
                    onMove(dragIndex, i)
                    setDragIndex(i)
                  }
                }}
                className="group relative overflow-hidden rounded-xl border border-linen bg-ivory"
              >
                <div className="relative aspect-[3/4] bg-sand">
                  <img src={img.url} alt={img.alt} className="h-full w-full object-cover" draggable={false} />
                  {i === 0 && (
                    <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-gold-500 px-2 py-0.5 text-[0.6rem] font-medium tracking-wider text-ivory uppercase">
                      <Star className="h-3 w-3 fill-ivory" /> Capa
                    </span>
                  )}
                  <span className="absolute top-2 right-2 cursor-grab rounded-full bg-ivory/90 p-1 text-cocoa opacity-0 transition group-hover:opacity-100" title="Arraste para reordenar">
                    <GripVertical className="h-4 w-4" />
                  </span>
                  <div className="absolute inset-x-2 bottom-2 flex justify-between opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                    <div className="flex gap-1">
                      <button type="button" onClick={() => onMove(i, i - 1)} disabled={i === 0} className="rounded-full bg-ivory/90 p-1.5 disabled:opacity-40" aria-label="Mover para a esquerda">
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => onMove(i, i + 1)} disabled={i === images.length - 1} className="rounded-full bg-ivory/90 p-1.5 disabled:opacity-40" aria-label="Mover para a direita">
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                      {i > 0 && (
                        <button type="button" onClick={() => onMove(i, 0)} className="rounded-full bg-ivory/90 px-2 text-[0.65rem]" aria-label="Definir como capa">
                          Capa
                        </button>
                      )}
                    </div>
                    <button type="button" onClick={() => onRemove(img)} className="rounded-full bg-rose p-1.5 text-ivory" aria-label="Remover foto">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {colors.length > 1 && (
                  <select
                    value={img.color_name ?? ''}
                    onChange={(e) => onChange(img.key, { color_name: e.target.value || null })}
                    className="w-full border-t border-linen bg-ivory px-2 py-1.5 text-xs focus:outline-none"
                    aria-label="Cor da foto"
                  >
                    <option value="">Todas as cores</option>
                    {colors.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {Array.from({ length: uploading }, (_, i) => (
            <div key={`up-${i}`} className="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-xl border border-linen bg-sand/50 text-xs text-taupe">
              <Spinner className="h-6 w-6 border-2 text-gold-600" />
              Enviando…
            </div>
          ))}

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-linen bg-cream/40 px-3 text-center text-xs text-taupe transition hover:border-gold-400 hover:text-gold-700"
          >
            <ImagePlus className="h-7 w-7" strokeWidth={1.3} />
            <span className="font-medium">Adicionar fotos</span>
            <span>ou arraste para cá</span>
          </button>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) onAdd(e.target.files)
          e.target.value = ''
        }}
      />
      <ul className="mt-3 space-y-0.5 text-xs text-taupe">
        <li>• A primeira foto é a capa na vitrine; a segunda aparece ao passar o mouse.</li>
        <li>• Use fotos verticais (proporção 3:4, ex.: 1200×1600). Elas são otimizadas automaticamente.</li>
        {colors.length > 1 && <li>• Vincule fotos a uma cor para trocarem quando a cliente escolher a cor.</li>}
      </ul>
    </div>
  )
}
