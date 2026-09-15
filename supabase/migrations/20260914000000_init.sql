-- =====================================================================
-- Boutique Marina Moura — esquema inicial
-- Usuários (clientes e administradores), catálogo, estoque, cupons e pedidos
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Utilitário: updated_at automático
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- =====================================================================
-- PERFIS
-- =====================================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  phone text,
  cpf text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);

-- Cria o perfil automaticamente quando um usuário se cadastra
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Mantém o e-mail do perfil sincronizado com o auth
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
after update of email on auth.users
for each row execute function public.handle_user_email_change();

-- Verifica se o usuário logado é administrador
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- Impede que um cliente altere o próprio papel ou e-mail pela API.
-- Chamadas sem usuário (SQL Editor / service role) são permitidas.
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.role is distinct from old.role then
      raise exception 'Você não tem permissão para alterar o tipo de acesso.';
    end if;
    new.email := old.email;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_protect_fields
before update on public.profiles
for each row execute function public.protect_profile_fields();

-- =====================================================================
-- CATÁLOGO
-- =====================================================================
create table public.sections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tagline text,
  description text,
  categories text[] not null default '{}',
  cover_url text,
  cover_path text,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger sections_updated_at before update on public.sections
for each row execute function public.set_updated_at();

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  section_id uuid references public.sections (id) on delete set null,
  cover_url text,
  cover_path text,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger collections_updated_at before update on public.collections
for each row execute function public.set_updated_at();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  details text[] not null default '{}',
  section_id uuid not null references public.sections (id) on delete restrict,
  collection_id uuid references public.collections (id) on delete set null,
  category text,
  price numeric(10, 2) not null check (price >= 0),
  compare_at_price numeric(10, 2) check (compare_at_price is null or compare_at_price >= 0),
  tags text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_section_idx on public.products (section_id);
create index products_collection_idx on public.products (collection_id);
create index products_active_idx on public.products (active);

create trigger products_updated_at before update on public.products
for each row execute function public.set_updated_at();

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null,
  path text,
  alt text,
  color_name text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index product_images_product_idx on public.product_images (product_id, sort_order);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  color_name text not null,
  color_hex text not null default '#D8C1A0',
  size text not null,
  sku text,
  stock int not null default 0 check (stock >= 0),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, color_name, size)
);

create index product_variants_product_idx on public.product_variants (product_id);

create trigger product_variants_updated_at before update on public.product_variants
for each row execute function public.set_updated_at();

-- =====================================================================
-- CUPONS
-- =====================================================================
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = upper(code) and length(code) >= 3),
  description text,
  discount_type text not null check (discount_type in ('percent', 'fixed', 'free_shipping')),
  value numeric(10, 2) not null default 0 check (value >= 0),
  min_subtotal numeric(10, 2) not null default 0 check (min_subtotal >= 0),
  max_uses int check (max_uses is null or max_uses > 0),
  used_count int not null default 0,
  starts_at timestamptz,
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (discount_type <> 'percent' or value <= 100)
);

-- =====================================================================
-- PEDIDOS
-- =====================================================================
create sequence public.order_number_seq start 100001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique default ('MM' || nextval('public.order_number_seq')),
  user_id uuid references public.profiles (id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled')),
  customer jsonb not null,
  shipping_address jsonb,
  shipping_method text not null,
  shipping_label text not null,
  shipping_eta text not null,
  payment_method text not null check (payment_method in ('pix', 'card', 'boleto')),
  installments int not null default 1,
  subtotal numeric(10, 2) not null,
  coupon_code text,
  coupon_discount numeric(10, 2) not null default 0,
  payment_discount numeric(10, 2) not null default 0,
  shipping_cost numeric(10, 2) not null default 0,
  total numeric(10, 2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_user_idx on public.orders (user_id, created_at desc);
create index orders_status_idx on public.orders (status);

create trigger orders_updated_at before update on public.orders
for each row execute function public.set_updated_at();

-- Cancelar um pedido devolve as peças ao estoque
create or replace function public.restock_cancelled_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'cancelled' and old.status <> 'cancelled' then
    update public.product_variants v
       set stock = v.stock + i.quantity
      from public.order_items i
     where i.order_id = new.id and i.variant_id = v.id;
  elsif old.status = 'cancelled' and new.status <> 'cancelled' then
    raise exception 'Pedidos cancelados não podem ser reabertos.';
  end if;
  return new;
end;
$$;

create trigger orders_restock_on_cancel
after update of status on public.orders
for each row execute function public.restock_cancelled_order();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  variant_id uuid references public.product_variants (id) on delete set null,
  product_name text not null,
  product_slug text,
  image_url text,
  color_name text not null,
  size text not null,
  quantity int not null check (quantity > 0),
  unit_price numeric(10, 2) not null
);

create index order_items_order_idx on public.order_items (order_id);

-- =====================================================================
-- REGRAS COMERCIAIS (espelhadas em src/lib/commerce.ts)
-- =====================================================================
create or replace function public.coupon_discount(p_coupon public.coupons, p_subtotal numeric)
returns numeric
language sql
immutable
as $$
  select case p_coupon.discount_type
    when 'percent' then round(p_subtotal * p_coupon.value / 100, 2)
    when 'fixed' then least(p_coupon.value, p_subtotal)
    else 0
  end;
$$;

create or replace function public.shipping_quote(p_method text, p_cep text, p_subtotal numeric, p_free_coupon boolean)
returns table (price numeric, label text, eta text)
language plpgsql
immutable
as $$
declare
  v_first int := coalesce(nullif(left(regexp_replace(coalesce(p_cep, ''), '\D', '', 'g'), 1), '')::int, 0);
  v_near boolean := v_first <= 3 or v_first >= 8;
begin
  if p_method = 'retirada' then
    return query select 0::numeric, 'Retirar na boutique'::text, 'Pronto em 24h'::text;
  elsif p_method = 'sedex' then
    return query select (case when v_near then 34.90 else 46.90 end)::numeric, 'Expressa'::text,
      (case when v_near then '2 a 3 dias úteis' else '3 a 5 dias úteis' end)::text;
  elsif p_method = 'pac' then
    return query select
      (case when p_free_coupon or p_subtotal >= 299 then 0 when v_near then 19.90 else 27.90 end)::numeric,
      'Econômica'::text,
      (case when v_near then '5 a 8 dias úteis' else '8 a 12 dias úteis' end)::text;
  else
    raise exception 'Forma de entrega inválida.';
  end if;
end;
$$;

-- Busca e valida um cupom (clientes não leem a tabela de cupons diretamente)
create or replace function public.validate_coupon(p_code text, p_subtotal numeric)
returns table (
  code text,
  description text,
  discount_type text,
  value numeric,
  min_subtotal numeric,
  discount numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_coupon public.coupons;
begin
  select * into v_coupon from public.coupons c where c.code = upper(trim(p_code));

  if not found or not v_coupon.active then
    raise exception 'Cupom inválido.';
  end if;
  if v_coupon.starts_at is not null and v_coupon.starts_at > now() then
    raise exception 'Este cupom ainda não está válido.';
  end if;
  if v_coupon.expires_at is not null and v_coupon.expires_at < now() then
    raise exception 'Este cupom expirou.';
  end if;
  if v_coupon.max_uses is not null and v_coupon.used_count >= v_coupon.max_uses then
    raise exception 'Este cupom atingiu o limite de usos.';
  end if;
  if p_subtotal < v_coupon.min_subtotal then
    raise exception 'Cupom válido para compras a partir de R$ %.', to_char(v_coupon.min_subtotal, 'FM999G990D00');
  end if;

  return query select v_coupon.code, v_coupon.description, v_coupon.discount_type, v_coupon.value,
    v_coupon.min_subtotal, public.coupon_discount(v_coupon, p_subtotal);
end;
$$;

-- Cria o pedido de forma atômica: valida estoque, baixa estoque, aplica cupom e calcula totais
create or replace function public.place_order(
  p_items jsonb,
  p_customer jsonb,
  p_address jsonb,
  p_shipping_method text,
  p_payment_method text,
  p_installments int,
  p_coupon_code text
)
returns table (id uuid, number text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_order_id uuid;
  v_number text;
  v_item jsonb;
  v_row record;
  v_qty int;
  v_image text;
  v_subtotal numeric := 0;
  v_coupon public.coupons;
  v_coupon_code text := nullif(upper(trim(coalesce(p_coupon_code, ''))), '');
  v_coupon_discount numeric := 0;
  v_free_shipping boolean := false;
  v_payment_discount numeric := 0;
  v_ship record;
  v_total numeric;
  v_installments int := greatest(1, least(coalesce(p_installments, 1), 6));
begin
  if v_user is null then
    raise exception 'Faça login para finalizar a compra.';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Sua sacola está vazia.';
  end if;
  if coalesce(trim(p_customer ->> 'name'), '') = '' or coalesce(trim(p_customer ->> 'email'), '') = '' then
    raise exception 'Informe seus dados de contato.';
  end if;
  if p_payment_method not in ('pix', 'card', 'boleto') then
    raise exception 'Forma de pagamento inválida.';
  end if;

  insert into public.orders (
    user_id, status, customer, shipping_address, shipping_method, shipping_label, shipping_eta,
    payment_method, installments, subtotal, total
  )
  values (
    v_user, 'pending', p_customer, case when p_shipping_method = 'retirada' then null else p_address end,
    p_shipping_method, '', '', p_payment_method, v_installments, 0, 0
  )
  returning orders.id, orders.number into v_order_id, v_number;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item ->> 'quantity')::int;
    if v_qty is null or v_qty < 1 then
      raise exception 'Quantidade inválida.';
    end if;

    select v.id as variant_id, v.stock, v.color_name, v.size,
           p.id as product_id, p.name, p.slug, p.price, p.active
      into v_row
      from public.product_variants v
      join public.products p on p.id = v.product_id
     where v.id = (v_item ->> 'variant_id')::uuid
       for update of v;

    if not found or not v_row.active then
      raise exception 'Um dos produtos da sacola não está mais disponível.';
    end if;
    if v_row.stock < v_qty then
      raise exception 'Estoque insuficiente para % (% · %). Disponível: %.',
        v_row.name, v_row.color_name, v_row.size, v_row.stock;
    end if;

    update public.product_variants set stock = stock - v_qty where product_variants.id = v_row.variant_id;

    select i.url into v_image
      from public.product_images i
     where i.product_id = v_row.product_id
     order by (i.color_name = v_row.color_name) desc nulls last, i.sort_order
     limit 1;

    insert into public.order_items (
      order_id, product_id, variant_id, product_name, product_slug, image_url, color_name, size, quantity, unit_price
    )
    values (
      v_order_id, v_row.product_id, v_row.variant_id, v_row.name, v_row.slug, v_image,
      v_row.color_name, v_row.size, v_qty, v_row.price
    );

    v_subtotal := v_subtotal + v_row.price * v_qty;
  end loop;

  if v_coupon_code is not null then
    select * into v_coupon from public.coupons c where c.code = v_coupon_code for update;
    if not found or not v_coupon.active
       or (v_coupon.starts_at is not null and v_coupon.starts_at > now())
       or (v_coupon.expires_at is not null and v_coupon.expires_at < now())
       or (v_coupon.max_uses is not null and v_coupon.used_count >= v_coupon.max_uses)
       or v_subtotal < v_coupon.min_subtotal then
      raise exception 'O cupom % não é mais válido para este pedido.', v_coupon_code;
    end if;
    v_coupon_discount := public.coupon_discount(v_coupon, v_subtotal);
    v_free_shipping := v_coupon.discount_type = 'free_shipping';
    update public.coupons set used_count = used_count + 1 where coupons.id = v_coupon.id;
  end if;

  select * into v_ship
    from public.shipping_quote(p_shipping_method, p_address ->> 'cep', v_subtotal - v_coupon_discount, v_free_shipping);

  if p_payment_method = 'pix' then
    v_payment_discount := round((v_subtotal - v_coupon_discount) * 0.05, 2);
  end if;
  if p_payment_method <> 'card' then
    v_installments := 1;
  end if;

  v_total := v_subtotal - v_coupon_discount - v_payment_discount + v_ship.price;

  update public.orders
     set subtotal = v_subtotal,
         coupon_code = case when v_coupon_code is null then null else v_coupon.code end,
         coupon_discount = v_coupon_discount,
         payment_discount = v_payment_discount,
         shipping_cost = v_ship.price,
         shipping_label = v_ship.label,
         shipping_eta = v_ship.eta,
         installments = v_installments,
         total = v_total,
         -- Demonstração: cartão é aprovado na hora; Pix e boleto aguardam pagamento
         status = case when p_payment_method = 'card' then 'paid' else 'pending' end
   where orders.id = v_order_id;

  return query select v_order_id, v_number;
end;
$$;

-- Indicadores do painel administrativo
create or replace function public.admin_dashboard()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Acesso restrito a administradores.';
  end if;

  select jsonb_build_object(
    'revenue', coalesce((select sum(total) from orders where status in ('paid', 'preparing', 'shipped', 'delivered')), 0),
    'revenue_30d', coalesce((select sum(total) from orders
                              where status in ('paid', 'preparing', 'shipped', 'delivered')
                                and created_at >= now() - interval '30 days'), 0),
    'orders', (select count(*) from orders),
    'orders_pending', (select count(*) from orders where status = 'pending'),
    'customers', (select count(*) from profiles where role = 'customer'),
    'products_active', (select count(*) from products where active),
    'low_stock', (select count(*) from product_variants where stock <= 3),
    'sales_by_day', coalesce((
      select jsonb_agg(jsonb_build_object('day', d.day, 'total', d.total) order by d.day)
      from (
        select gs::date as day,
               coalesce((select sum(o.total) from orders o
                          where o.created_at::date = gs::date
                            and o.status in ('paid', 'preparing', 'shipped', 'delivered')), 0) as total
          from generate_series(current_date - 13, current_date, interval '1 day') gs
      ) d
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

revoke execute on function public.place_order(jsonb, jsonb, jsonb, text, text, int, text) from public, anon;
revoke execute on function public.admin_dashboard() from public, anon;
grant execute on function public.place_order(jsonb, jsonb, jsonb, text, text, int, text) to authenticated;
grant execute on function public.admin_dashboard() to authenticated;

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.sections enable row level security;
alter table public.collections enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Perfis
create policy "Usuário vê o próprio perfil; admin vê todos"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

create policy "Usuário edita o próprio perfil; admin edita todos"
  on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- Catálogo: leitura pública do que está ativo, escrita só para admin
create policy "Seções visíveis" on public.sections for select
  using (active or public.is_admin());
create policy "Admin gerencia seções" on public.sections for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Coleções visíveis" on public.collections for select
  using (active or public.is_admin());
create policy "Admin gerencia coleções" on public.collections for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Produtos visíveis" on public.products for select
  using (active or public.is_admin());
create policy "Admin gerencia produtos" on public.products for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Imagens visíveis" on public.product_images for select using (true);
create policy "Admin gerencia imagens" on public.product_images for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Variações visíveis" on public.product_variants for select using (true);
create policy "Admin gerencia variações" on public.product_variants for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Cupons: somente admin (clientes usam validate_coupon)
create policy "Admin gerencia cupons" on public.coupons for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Pedidos: cliente vê os próprios; admin vê e atualiza todos. Criação apenas via place_order.
create policy "Cliente vê os próprios pedidos" on public.orders for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy "Admin atualiza pedidos" on public.orders for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Itens dos pedidos visíveis ao dono" on public.order_items for select to authenticated
  using (exists (
    select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())
  ));

-- Permissões da Data API (o RLS acima continua decidindo o que cada um vê e altera)
grant usage on schema public to anon, authenticated;
grant select on public.sections, public.collections, public.products, public.product_images, public.product_variants to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on function public.validate_coupon(text, numeric) to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- =====================================================================
-- STORAGE: fotos de produtos, seções e coleções
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('catalog', 'catalog', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

create policy "Fotos do catálogo são públicas" on storage.objects for select
  using (bucket_id = 'catalog');
create policy "Admin envia fotos" on storage.objects for insert to authenticated
  with check (bucket_id = 'catalog' and public.is_admin());
create policy "Admin atualiza fotos" on storage.objects for update to authenticated
  using (bucket_id = 'catalog' and public.is_admin());
create policy "Admin remove fotos" on storage.objects for delete to authenticated
  using (bucket_id = 'catalog' and public.is_admin());
