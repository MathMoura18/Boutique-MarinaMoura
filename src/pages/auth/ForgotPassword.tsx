import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Spinner } from '../../components/CartBits'
import { Alert, FormField } from '../../components/FormField'
import { errorMessage, supabase } from '../../lib/supabase'
import { AuthLayout } from './AuthLayout'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  return (
    <AuthLayout
      title="Recuperar senha"
      subtitle="Enviaremos um link para você criar uma nova senha."
      footer={
        <Link to="/entrar" className="font-medium text-gold-700 underline-offset-4 hover:underline">
          Voltar para o login
        </Link>
      }
    >
      {sent ? (
        <Alert tone="success">
          Se existir uma conta com <strong className="font-medium">{email}</strong>, você receberá um e-mail com o link para redefinir a senha.
        </Alert>
      ) : (
        <form
          className="space-y-5"
          onSubmit={async (e) => {
            e.preventDefault()
            setLoading(true)
            setError(null)
            const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
              redirectTo: `${window.location.origin}/redefinir-senha`,
            })
            setLoading(false)
            if (error) setError(errorMessage(error))
            else setSent(true)
          }}
        >
          {error && <Alert>{error}</Alert>}
          <FormField label="E-mail" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="btn btn-primary w-full py-4" disabled={loading}>
            {loading ? <Spinner /> : 'Enviar link'}
          </button>
        </form>
      )}
    </AuthLayout>
  )
}
