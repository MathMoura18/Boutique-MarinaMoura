# Boutique Marina Moura

Loja online da Boutique Marina Moura, com seções como **Casual** e **Fitness**, usuários, painel administrativo e catálogo com fotos, tudo integrado ao **Supabase**.

## Stack

- React 19, TypeScript e Vite
- Tailwind CSS v4 (cores da marca em `src/index.css`)
- Motion para as animações
- Supabase: Auth, Postgres com RLS e Storage
- TanStack Query para os dados do servidor e Zustand para sacola, favoritos e interface
- React Router

## Configurando o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No **SQL Editor**, rode, nesta ordem:
   - `supabase/migrations/20260914000000_init.sql`: tabelas, RLS, storage e funções.
   - `supabase/seed.sql` (opcional): seções, coleções, cupons e 24 produtos de exemplo, com estoque e sem fotos.
3. Copie `.env.example` para `.env.local` e preencha:
   ```
   VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   VITE_SUPABASE_ANON_KEY=...
   ```
   A chave `anon` / `publishable` fica em Project Settings → API.
4. Em **Authentication → URL Configuration**, defina a *Site URL* (em desenvolvimento, `http://localhost:5173`) e adicione `http://localhost:5173/**` às *Redirect URLs*. Sem isso, os links de confirmação de e-mail e de redefinição de senha não funcionam.
5. Rode o projeto:
   ```bash
   npm install
   npm run dev
   ```

### Criando o primeiro administrador

Cadastre-se normalmente na loja (`/cadastro`) e rode no SQL Editor:

```sql
update public.profiles set role = 'admin' where email = 'seu@email.com';
```

A partir daí, o painel fica em `/admin`. Outros administradores podem ser promovidos pela tela **Usuários**.

## Tipos de usuário

| Papel | Pode fazer |
| --- | --- |
| **Cliente** (`customer`) | Criar conta, entrar, recuperar senha, editar seus dados, comprar e ver os próprios pedidos. |
| **Administrador** (`admin`) | Tudo o que o cliente faz, mais o painel: dashboard, pedidos, produtos, fotos, estoque, seções, coleções, cupons e usuários. |

As permissões são garantidas no banco por **Row Level Security**, não só na interface:

- Clientes só leem o próprio perfil e os próprios pedidos.
- Clientes não conseguem alterar o próprio papel.
- Cupons não são expostos: a validação passa pela função `validate_coupon`.
- Pedidos só são criados pela função `place_order`. Ela confere o estoque, dá baixa, aplica o cupom e recalcula os totais no servidor.
- Só administradores gravam no catálogo e enviam fotos para o bucket `catalog`.
- Cancelar um pedido devolve as peças ao estoque automaticamente.

## Painel administrativo (`/admin`)

- **Dashboard**: faturamento, pedidos, clientes, estoque baixo, vendas dos últimos 14 dias e pedidos recentes.
- **Pedidos**: filtro por status, detalhes e atualização de status.
- **Produtos**: cadastro e edição com:
  - várias fotos, com arrastar e soltar, reordenação, escolha da capa e foto vinculada a uma cor;
  - grade de variações cor × tamanho com estoque;
  - preço promocional, seção, coleção, categoria e destaques;
  - publicar ou ocultar.
- **Estoque**: ajuste rápido por variação e filtro de estoque baixo.
- **Seções** e **Coleções**: cadastro com foto de capa, categorias, ordem e visibilidade.
- **Cupons**: percentual, valor fixo ou frete grátis, com compra mínima, limite de usos e validade.
- **Usuários**: lista de clientes e promoção ou remoção de administradores.

As fotos são redimensionadas no navegador (até 1800px, em WebP) antes do envio. Use fotos verticais **3:4**, por exemplo 1200×1600.

## Loja

- Home com as fotos dos produtos marcados como **Destaque**, seções com capa (ou colagem de fotos), coleções em formato editorial, novidades e mais vendidos.
- Catálogo por seção (`/loja/:secao`) e por coleção (`/colecoes/:slug`), com filtros de categoria, tamanho, cor, preço e destaques.
- Página de produto:
  - galeria com zoom, swipe e tela cheia;
  - as fotos mudam conforme a cor escolhida;
  - tamanhos esgotados ficam desabilitados.
- Sacola com os limites de estoque, cupons validados no servidor e checkout (exige login) que preenche os dados do perfil.
- Área **Minha conta**: dados pessoais, pedidos e troca de senha.

> Pagamentos são simulados: cartão é aprovado na hora; Pix e boleto ficam "aguardando pagamento".

## Regras comerciais

Frete grátis acima de R$ 299, 5% de desconto no Pix e até 6x sem juros. Essas regras existem em dois lugares, que precisam ficar iguais:

- `src/lib/commerce.ts`: valores exibidos na loja.
- funções `shipping_quote` / `place_order` na migração: cálculo oficial feito no banco.
