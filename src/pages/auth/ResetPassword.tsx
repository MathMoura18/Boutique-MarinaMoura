import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Spinner } from '../../components/CartBits'
import { Alert, FormField } from '../../components/FormField'
import { FullPageLoader } from '../../components/RouteGuards'
import { errorMessage, supabase } from '../../lib/supabase'
import { useAuth } from '../../store/auth'
import { useUI } from '../../store/ui'
import { AuthLayout } from './AuthLayout'

export default function ResetPassword() {
  const navigate = useNavigate()
  const { session, loading: authLoading } = useAuth()
  const toast = useUI((s) => s.toast)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (authLoading) return <FullPageLoader />

  if (!session) {
    return (
      <AuthLayout title="Link expirado" subtitle="O link de redefinição é inválido ou já foi usado.">
        <Link to="/recuperar-senha" className="btn btn-primary w-full">
          Solicitar novo link
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Nova senha" subtitle="Escolha uma senha segura para sua conta.">
      <form
        className="space-y-5"
        onSubmit={async (e) => {
          e.preventDefault()
          if (password.length < 8) return setError('Use pelo menos 8 caracteres.')
          if (password !== confirm) return setError('As senhas não conferem.')
          setLoading(true)
          setError(null)
          const { error } = await supabase.auth.updateUser({ password })
          setLoading(false)
          if (error) return setError(errorMessage(error))
          useAuth.setState({ recovering: false })
          toast({ title: 'Senha atualizada', tone: 'success' })
          navigate('/conta', { replace: true })
        }}
      >
        {error && <Alert>{error}</Alert>}
        <FormField label="Nova senha" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} hint="Mínimo de 8 caracteres" />
        <FormField label="Confirmar nova senha" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <button className="btn btn-primary w-full py-4" disabled={loading}>
          {loading ? <Spinner /> : 'Salvar nova senha'}
        </button>
      </form>
    </AuthLayout>
  )
}
