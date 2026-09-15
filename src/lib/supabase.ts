import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase = createClient(url || 'http://localhost:54321', anonKey || 'missing-key', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

export const CATALOG_BUCKET = 'catalog'

/** Converte erros do Supabase/Postgres em mensagens legíveis */
export function errorMessage(error: unknown): string {
  if (!error) return 'Algo deu errado. Tente novamente.'
  const e = error as { message?: string; code?: string }
  const msg = e.message ?? String(error)
  if (e.code === '23505') return 'Já existe um registro com esse identificador (slug ou código).'
  if (e.code === '23503') return 'Este item está vinculado a outros registros e não pode ser removido.'
  if (e.code === '42501') return 'Você não tem permissão para esta ação.'
  const known: [RegExp, string][] = [
    [/Invalid login credentials/i, 'E-mail ou senha incorretos.'],
    [/Email not confirmed/i, 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.'],
    [/User already registered/i, 'Já existe uma conta com este e-mail.'],
    [/Password should be at least/i, 'A senha deve ter pelo menos 6 caracteres.'],
    [/should be different from the old password/i, 'A nova senha deve ser diferente da atual.'],
    [/rate limit/i, 'Muitas tentativas. Aguarde alguns instantes e tente novamente.'],
    [/Failed to fetch/i, 'Não foi possível conectar ao servidor. Verifique sua conexão.'],
  ]
  return known.find(([re]) => re.test(msg))?.[1] ?? msg
}
