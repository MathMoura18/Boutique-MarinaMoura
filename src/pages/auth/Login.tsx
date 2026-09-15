import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Spinner } from '../../components/CartBits'
import { Alert, FormField } from '../../components/FormField'
import { errorMessage, supabase } from '../../lib/supabase'
import { useAuth } from '../../store/auth'
import { AuthLayout } from './AuthLayout'

export default function Login() {
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  return (
    <AuthLayout
      title="Entrar"
      subtitle="Que bom ter você de volta."
      footer={
        <>
          Ainda não tem conta?{' '}
          <Link to="/cadastro" state={location.state} className="font-medium text-gold-700 underline-offset-4 hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
      <form
        className="space-y-5"
        onSubmit={async (e) => {
          e.preventDefault()
          setLoading(true)
          setError(null)
          const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
          if (error) {
            setError(errorMessage(error))
            setLoading(false)
            return
          }
          // O redirecionamento (conta, painel ou página de origem) é feito pelo GuestOnly
          await useAuth.getState().loadProfile()
        }}
      >
        {error && <Alert>{error}</Alert>}
        <FormField label="E-mail" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <FormField label="Senha" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="text-right">
          <Link to="/recuperar-senha" className="text-sm text-cocoa underline-offset-4 hover:text-gold-700 hover:underline">
            Esqueci minha senha
          </Link>
        </div>
        <button className="btn btn-primary w-full py-4" disabled={loading}>
          {loading ? <Spinner /> : 'Entrar'}
        </button>
      </form>
    </AuthLayout>
  )
}
