import { Dragonfly, LogoMark } from '../components/Brand'

const steps = [
  'Crie um projeto em supabase.com (plano gratuito serve).',
  'No SQL Editor, rode supabase/migrations/20260914000000_init.sql e depois supabase/seed.sql.',
  'Copie .env.example para .env.local e preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (Project Settings → API).',
  'Reinicie o servidor (npm run dev).',
]

/** Exibida quando as variáveis do Supabase não foram configuradas */
export default function SetupRequired() {
  return (
    <div className="paper-grain flex min-h-screen items-center justify-center bg-cream px-6 py-16">
      <div className="card relative w-full max-w-2xl overflow-hidden p-8 sm:p-12">
        <Dragonfly className="absolute top-8 right-8 w-20 opacity-70" />
        <LogoMark className="h-14 w-14" />
        <p className="eyebrow mt-6">Configuração necessária</p>
        <h1 className="mt-2 text-5xl">Conecte o Supabase</h1>
        <p className="mt-3 text-cocoa">A loja usa o Supabase para usuários, catálogo, estoque, cupons e pedidos. Siga os passos abaixo:</p>
        <ol className="mt-8 space-y-4">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-espresso text-sm text-ivory">{i + 1}</span>
              <span className="pt-1 text-sm text-cocoa">{s}</span>
            </li>
          ))}
        </ol>
        <p className="mt-8 rounded-2xl bg-gold-50 p-4 text-xs text-cocoa">
          Para tornar sua conta administradora, cadastre-se na loja e rode no SQL Editor:
          <code className="mt-2 block rounded-lg bg-ivory px-3 py-2 font-mono text-[0.7rem] text-espresso">
            update public.profiles set role = 'admin' where email = 'seu@email.com';
          </code>
        </p>
      </div>
    </div>
  )
}
