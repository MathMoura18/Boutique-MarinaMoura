import { MailCheck } from 'lucide-react'
import { motion } from 'motion/react'
import { useState, type ChangeEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Spinner } from '../../components/CartBits'
import { Alert, FormField } from '../../components/FormField'
import { validators } from '../../lib/format'
import { errorMessage, supabase } from '../../lib/supabase'
import { AuthLayout } from './AuthLayout'

export default function Register() {
  const location = useLocation()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }))

  if (sentTo) {
    return (
      <AuthLayout title="Confirme seu e-mail">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold-50 text-gold-600">
            <MailCheck className="h-7 w-7" />
          </span>
          <p className="mt-5 text-cocoa">
            Enviamos um link de confirmação para <strong className="font-medium text-espresso">{sentTo}</strong>. Abra o e-mail e clique no link para ativar sua conta.
          </p>
          <Link to="/entrar" className="btn btn-primary mt-8">
            Ir para o login
          </Link>
        </motion.div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Criar conta"
      subtitle="Leva menos de um minuto."
      footer={
        <>
          Já tem conta?{' '}
          <Link to="/entrar" state={location.state} className="font-medium text-gold-700 underline-offset-4 hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <form
        className="space-y-5"
        noValidate
        onSubmit={async (e) => {
          e.preventDefault()
          const errs: Record<string, string> = {}
          if (!validators.name(form.name)) errs.name = 'Informe nome e sobrenome'
          if (!validators.email(form.email)) errs.email = 'E-mail inválido'
          if (form.password.length < 8) errs.password = 'Use pelo menos 8 caracteres'
          if (form.confirm !== form.password) errs.confirm = 'As senhas não conferem'
          setErrors(errs)
          if (Object.keys(errs).length) return

          setLoading(true)
          setError(null)
          const { data, error } = await supabase.auth.signUp({
            email: form.email.trim(),
            password: form.password,
            options: { data: { full_name: form.name.trim() }, emailRedirectTo: `${window.location.origin}/conta` },
          })
          setLoading(false)
          if (error) return setError(errorMessage(error))
          // Supabase retorna usuário sem identidades quando o e-mail já existe
          if (data.user && data.user.identities?.length === 0) return setError('Já existe uma conta com este e-mail.')
          // Com confirmação de e-mail desativada já existe sessão e o GuestOnly redireciona
          if (!data.session) setSentTo(form.email.trim())
        }}
      >
        {error && <Alert>{error}</Alert>}
        <FormField label="Nome completo" autoComplete="name" value={form.name} onChange={set('name')} error={errors.name} />
        <FormField label="E-mail" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} />
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Senha" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} error={errors.password} hint="Mínimo de 8 caracteres" />
          <FormField label="Confirmar senha" type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} />
        </div>
        <button className="btn btn-primary w-full py-4" disabled={loading}>
          {loading ? <Spinner /> : 'Criar minha conta'}
        </button>
        <p className="text-center text-xs text-taupe">Ao criar sua conta você concorda com nossos termos de uso e política de privacidade.</p>
      </form>
    </AuthLayout>
  )
}
