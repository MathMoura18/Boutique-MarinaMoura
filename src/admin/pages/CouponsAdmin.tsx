import { Copy, Plus, Trash2 } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { Spinner } from '../../components/CartBits'
import { couponLabel } from '../../lib/commerce'
import { money } from '../../lib/format'
import { errorMessage, supabase } from '../../lib/supabase'
import { useUI } from '../../store/ui'
import type { Coupon, DiscountType } from '../../types'
import { useCoupons, useInvalidate } from '../data'
import { Alert, confirmAction, EmptyState, Modal, PageHeader, Panel, Pill, SelectField, TextField, Toggle, tdClass, thClass } from '../ui'

const couponState = (c: Coupon): { label: string; tone: 'good' | 'warn' | 'bad' | 'neutral' } => {
  const now = Date.now()
  if (!c.active) return { label: 'Inativo', tone: 'neutral' }
  if (c.expires_at && new Date(c.expires_at).getTime() < now) return { label: 'Expirado', tone: 'bad' }
  if (c.starts_at && new Date(c.starts_at).getTime() > now) return { label: 'Agendado', tone: 'warn' }
  if (c.max_uses && c.used_count >= c.max_uses) return { label: 'Esgotado', tone: 'bad' }
  return { label: 'Ativo', tone: 'good' }
}

export default function CouponsAdmin() {
  const { data: coupons = [], isLoading, error } = useCoupons()
  const invalidate = useInvalidate()
  const toast = useUI((s) => s.toast)
  const [creating, setCreating] = useState(false)

  const toggle = async (c: Coupon) => {
    const { error } = await supabase.from('coupons').update({ active: !c.active }).eq('id', c.id)
    if (error) return toast({ title: 'Erro', description: errorMessage(error) })
    invalidate('coupons')
  }

  const remove = async (c: Coupon) => {
    const ok = await confirmAction({
      title: 'Remover cupom',
      description: `O cupom ${c.code} deixará de funcionar imediatamente. Pedidos que já o usaram não são afetados.`,
      confirmLabel: 'Remover',
      danger: true,
    })
    if (!ok) return
    const { error } = await supabase.from('coupons').delete().eq('id', c.id)
    if (error) return toast({ title: 'Erro ao remover', description: errorMessage(error) })
    toast({ title: 'Cupom removido', description: c.code, tone: 'success' })
    invalidate('coupons')
  }

  return (
    <div>
      <PageHeader
        title="Cupons de desconto"
        description="Crie códigos promocionais com percentual, valor fixo ou frete grátis."
        actions={
          <button onClick={() => setCreating(true)} className="btn btn-gold">
            <Plus className="h-4 w-4" /> Novo cupom
          </button>
        }
      />
      {error && <Alert>{errorMessage(error)}</Alert>}
      <Panel>
        {isLoading ? (
          <div className="flex justify-center py-16 text-gold-600">
            <Spinner className="h-7 w-7 border-2" />
          </div>
        ) : coupons.length === 0 ? (
          <EmptyState title="Nenhum cupom" description="Crie o primeiro cupom para suas campanhas." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className={thClass}>Código</th>
                  <th className={thClass}>Benefício</th>
                  <th className={thClass}>Regras</th>
                  <th className={thClass}>Usos</th>
                  <th className={thClass}>Situação</th>
                  <th className={thClass}>Ativo</th>
                  <th className={thClass} />
                </tr>
              </thead>
              <tbody>
                {coupons.map((c, i) => {
                  const state = couponState(c)
                  return (
                    <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-t border-linen/70">
                      <td className={tdClass}>
                        <button
                          onClick={() => {
                            navigator.clipboard?.writeText(c.code)
                            toast({ title: 'Código copiado', description: c.code, tone: 'success' })
                          }}
                          className="group flex items-center gap-2 rounded-lg border border-dashed border-gold-300 bg-gold-50 px-2.5 py-1 font-mono text-xs tracking-wider"
                        >
                          {c.code} <Copy className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
                        </button>
                        {c.description && <p className="mt-1 max-w-[220px] truncate text-xs text-taupe">{c.description}</p>}
                      </td>
                      <td className={`${tdClass} whitespace-nowrap`}>{couponLabel(c)}</td>
                      <td className={`${tdClass} text-xs text-cocoa`}>
                        {c.min_subtotal > 0 && <p>Mínimo {money(c.min_subtotal)}</p>}
                        {c.expires_at && <p>Até {new Date(c.expires_at).toLocaleDateString('pt-BR')}</p>}
                        {!c.min_subtotal && !c.expires_at && <p className="text-taupe">Sem restrições</p>}
                      </td>
                      <td className={`${tdClass} whitespace-nowrap`}>
                        {c.used_count}
                        {c.max_uses ? ` / ${c.max_uses}` : ''}
                      </td>
                      <td className={tdClass}>
                        <Pill tone={state.tone}>{state.label}</Pill>
                      </td>
                      <td className={tdClass}>
                        <Toggle checked={c.active} onChange={() => toggle(c)} />
                      </td>
                      <td className={`${tdClass} text-right`}>
                        <button onClick={() => remove(c)} className="rounded-full p-2 hover:bg-rose/10 hover:text-rose" aria-label={`Remover ${c.code}`}>
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

      {creating && <CouponForm onClose={() => setCreating(false)} />}
    </div>
  )
}

function CouponForm({ onClose }: { onClose: () => void }) {
  const invalidate = useInvalidate()
  const toast = useUI((s) => s.toast)
  const [form, setForm] = useState({
    code: '',
    description: '',
    discount_type: 'percent' as DiscountType,
    value: '10',
    min_subtotal: '',
    max_uses: '',
    starts_at: '',
    expires_at: '',
    active: true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))

  const save = async () => {
    const code = form.code.trim().toUpperCase()
    const value = Number(form.value.replace(',', '.'))
    if (!/^[A-Z0-9_-]{3,30}$/.test(code)) return setError('O código deve ter de 3 a 30 caracteres (letras, números, - ou _).')
    if (form.discount_type !== 'free_shipping' && (!value || value <= 0)) return setError('Informe o valor do desconto.')
    if (form.discount_type === 'percent' && value > 100) return setError('O percentual não pode passar de 100%.')
    if (form.starts_at && form.expires_at && form.expires_at < form.starts_at) return setError('A data final deve ser depois da inicial.')
    setSaving(true)
    setError(null)
    const { error } = await supabase.from('coupons').insert({
      code,
      description: form.description.trim() || null,
      discount_type: form.discount_type,
      value: form.discount_type === 'free_shipping' ? 0 : value,
      min_subtotal: Number(form.min_subtotal.replace(',', '.')) || 0,
      max_uses: Number(form.max_uses) || null,
      starts_at: form.starts_at ? new Date(`${form.starts_at}T00:00:00`).toISOString() : null,
      expires_at: form.expires_at ? new Date(`${form.expires_at}T23:59:59`).toISOString() : null,
      active: form.active,
    })
    setSaving(false)
    if (error) return setError(error.code === '23505' ? 'Já existe um cupom com esse código.' : errorMessage(error))
    toast({ title: 'Cupom criado', description: code, tone: 'success' })
    invalidate('coupons')
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Novo cupom"
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-gold" onClick={save} disabled={saving}>
            {saving ? <Spinner /> : 'Criar cupom'}
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
        <TextField label="Código" value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase().replace(/\s/g, ''))} placeholder="EX.: VERAO20" className="sm:col-span-2" />
        <TextField label="Descrição interna (opcional)" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Campanha de verão no Instagram" className="sm:col-span-2" />
        <SelectField label="Tipo de desconto" value={form.discount_type} onChange={(e) => set('discount_type', e.target.value as DiscountType)}>
          <option value="percent">Percentual (%)</option>
          <option value="fixed">Valor fixo (R$)</option>
          <option value="free_shipping">Frete grátis</option>
        </SelectField>
        {form.discount_type !== 'free_shipping' ? (
          <TextField label={form.discount_type === 'percent' ? 'Percentual' : 'Valor (R$)'} inputMode="decimal" value={form.value} onChange={(e) => set('value', e.target.value)} />
        ) : (
          <p className="self-end pb-3 text-xs text-taupe">Zera o frete da entrega econômica.</p>
        )}
        <TextField label="Compra mínima (R$)" inputMode="decimal" value={form.min_subtotal} onChange={(e) => set('min_subtotal', e.target.value)} placeholder="Sem mínimo" />
        <TextField label="Limite de usos" type="number" min={1} value={form.max_uses} onChange={(e) => set('max_uses', e.target.value)} placeholder="Ilimitado" />
        <TextField label="Válido a partir de" type="date" value={form.starts_at} onChange={(e) => set('starts_at', e.target.value)} />
        <TextField label="Válido até" type="date" value={form.expires_at} onChange={(e) => set('expires_at', e.target.value)} />
        <div className="sm:col-span-2">
          <Toggle checked={form.active} onChange={(v) => set('active', v)} label="Ativar imediatamente" />
        </div>
      </div>
    </Modal>
  )
}
