import type { Session } from '@supabase/supabase-js'
import { create } from 'zustand'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { Profile } from '../types'

interface AuthState {
  session: Session | null
  profile: Profile | null
  /** true até a sessão inicial ser carregada */
  loading: boolean
  /** true quando o usuário chegou pelo link de redefinição de senha */
  recovering: boolean
  init: () => () => void
  loadProfile: () => Promise<void>
  signOut: () => Promise<void>
}

export const useAuth = create<AuthState>()((set, get) => ({
  session: null,
  profile: null,
  loading: true,
  recovering: false,

  init: () => {
    if (!isSupabaseConfigured) {
      set({ loading: false })
      return () => {}
    }

    supabase.auth.getSession().then(async ({ data }) => {
      set({ session: data.session })
      if (data.session) await get().loadProfile()
      set({ loading: false })
    })

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      const changedUser = session?.user.id !== get().session?.user.id
      set({ session, recovering: event === 'PASSWORD_RECOVERY' ? true : get().recovering })
      if (!session) set({ profile: null, recovering: false })
      // Evita chamar o Supabase dentro do callback (recomendação da documentação)
      else if (changedUser || event === 'USER_UPDATED') setTimeout(() => get().loadProfile(), 0)
    })
    return () => data.subscription.unsubscribe()
  },

  loadProfile: async () => {
    const userId = get().session?.user.id
    if (!userId) return
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    set({ profile: (data as Profile) ?? null })
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, profile: null })
  },
}))

export const useIsAdmin = () => useAuth((s) => s.profile?.role === 'admin')
