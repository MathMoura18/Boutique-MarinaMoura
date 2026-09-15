-- Dados iniciais de exemplo (seções, coleção, cupons e produtos sem fotos).
-- Rode depois da migração. As fotos são adicionadas pelo painel administrativo.

insert into public.sections (slug, name, tagline, description, categories, sort_order) values
  ('casual', 'Casual', 'Elegância para todos os dias', 'Tecidos nobres, cortes atemporais e a leveza de quem se veste para si.', array['Vestidos', 'Blusas', 'Calças', 'Saias', 'Blazers', 'Jeans']::text[], 0),
  ('fitness', 'Fitness', 'Movimento com essência', 'Performance, conforto e estilo em peças que acompanham cada treino.', array['Leggings', 'Tops', 'Conjuntos', 'Shorts', 'Regatas', 'Jaquetas']::text[], 1)
on conflict (slug) do nothing;

insert into public.collections (slug, name, description, section_id, sort_order) values
  ('primavera-2026', 'Primavera 2026', 'Leveza, tons naturais e tecidos que respiram.', null, 0),
  ('essencia-fit', 'Essência Fit', 'Peças de performance com a delicadeza da marca.', (select id from public.sections where slug = 'fitness'), 1)
on conflict (slug) do nothing;

insert into public.coupons (code, description, discount_type, value, min_subtotal) values
  ('BEMVINDA10', '10% de boas-vindas', 'percent', 10, 0),
  ('ESSENCIA15', '15% off acima de R$ 400', 'percent', 15, 400),
  ('FRETEGRATIS', 'Frete econômico grátis', 'free_shipping', 0, 0)
on conflict (code) do nothing;

with p as (
  insert into public.products (slug, name, description, details, section_id, collection_id, category, price, compare_at_price, tags)
  values ('vestido-midi-jasmim', 'Vestido Midi Jasmim', 'Leve como uma manhã de primavera. Modelagem evasê em viscose fluida, alças finas reguláveis e amarração na cintura que valoriza a silhueta.', array['100% viscose', 'Forro na parte superior', 'Alças reguláveis', 'Comprimento midi', 'Lavar à mão']::text[],
    (select id from public.sections where slug = 'casual'),
    (select id from public.collections where slug = 'primavera-2026'),
    'Vestidos', 329.9, null, array['novo', 'mais-vendido']::text[])
  on conflict (slug) do nothing
  returning id
)
insert into public.product_variants (product_id, color_name, color_hex, size, stock, sort_order)
select p.id, v.color_name, v.color_hex, v.size, v.stock, v.sort_order from p, (values
  ('Off-white', '#F3EADF', 'PP', 0, 0),
  ('Off-white', '#F3EADF', 'P', 0, 1),
  ('Off-white', '#F3EADF', 'M', 8, 2),
  ('Off-white', '#F3EADF', 'G', 2, 3),
  ('Off-white', '#F3EADF', 'GG', 9, 4),
  ('Oliva', '#6B7A3E', 'PP', 5, 10),
  ('Oliva', '#6B7A3E', 'P', 0, 11),
  ('Oliva', '#6B7A3E', 'M', 8, 12),
  ('Oliva', '#6B7A3E', 'G', 2, 13),
  ('Oliva', '#6B7A3E', 'GG', 3, 14),
  ('Rosé', '#D9A99A', 'PP', 3, 20),
  ('Rosé', '#D9A99A', 'P', 3, 21),
  ('Rosé', '#D9A99A', 'M', 0, 22),
  ('Rosé', '#D9A99A', 'G', 5, 23),
  ('Rosé', '#D9A99A', 'GG', 0, 24)
) as v(color_name, color_hex, size, stock, sort_order);

with p as (
  insert into public.products (slug, name, description, details, section_id, collection_id, category, price, compare_at_price, tags)
  values ('camisa-seda-aurora', 'Camisa Seda Aurora', 'Toque acetinado e caimento impecável. A camisa que transita do escritório ao jantar com a mesma elegância.', array['Cetim de poliéster com toque de seda', 'Botões perolados', 'Punhos com abotoamento', 'Modelagem ampla']::text[],
    (select id from public.sections where slug = 'casual'),
    null,
    'Blusas', 259.9, null, array['mais-vendido']::text[])
  on conflict (slug) do nothing
  returning id
)
insert into public.product_variants (product_id, color_name, color_hex, size, stock, sort_order)
select p.id, v.color_name, v.color_hex, v.size, v.stock, v.sort_order from p, (values
  ('Creme', '#E9DAC3', 'PP', 3, 0),
  ('Creme', '#E9DAC3', 'P', 4, 1),
  ('Creme', '#E9DAC3', 'M', 0, 2),
  ('Creme', '#E9DAC3', 'G', 6, 3),
  ('Creme', '#E9DAC3', 'GG', 0, 4),
  ('Dourado', '#C49A4E', 'PP', 0, 10),
  ('Dourado', '#C49A4E', 'P', 2, 11),
  ('Dourado', '#C49A4E', 'M', 10, 12),
  ('Dourado', '#C49A4E', 'G', 4, 13),
  ('Dourado', '#C49A4E', 'GG', 10, 14),
  ('Espresso', '#3B2A1E', 'PP', 10, 20),
  ('Espresso', '#3B2A1E', 'P', 4, 21),
  ('Espresso', '#3B2A1E', 'M', 0, 22),
  ('Espresso', '#3B2A1E', 'G', 6, 23),
  ('Espresso', '#3B2A1E', 'GG', 8, 24)
) as v(color_name, color_hex, size, stock, sort_order);

with p as (
  insert into public.products (slug, name, description, details, section_id, collection_id, category, price, compare_at_price, tags)
  values ('calca-pantalona-linho', 'Calça Pantalona Linho', 'Cintura alta, pernas amplas e o frescor natural do linho. Um clássico atemporal para compor looks sofisticados sem esforço.', array['55% linho, 45% viscose', 'Cós com elástico nas costas', 'Bolsos laterais', 'Pregas frontais']::text[],
    (select id from public.sections where slug = 'casual'),
    null,
    'Calças', 289.9, 349.9, array[]::text[])
  on conflict (slug) do nothing
  returning id
)
insert into public.product_variants (product_id, color_name, color_hex, size, stock, sort_order)
select p.id, v.color_name, v.color_hex, v.size, v.stock, v.sort_order from p, (values
  ('Areia', '#D8C1A0', '36', 2, 0),
  ('Areia', '#D8C1A0', '38', 4, 1),
  ('Areia', '#D8C1A0', '40', 5, 2),
  ('Areia', '#D8C1A0', '42', 7, 3),
  ('Areia', '#D8C1A0', '44', 9, 4),
  ('Off-white', '#F3EADF', '36', 2, 10),
  ('Off-white', '#F3EADF', '38', 4, 11),
  ('Off-white', '#F3EADF', '40', 5, 12),
  ('Off-white', '#F3EADF', '42', 7, 13),
  ('Off-white', '#F3EADF', '44', 9, 14),
  ('Café', '#6E4E3A', '36', 6, 20),
  ('Café', '#6E4E3A', '38', 8, 21),
  ('Café', '#6E4E3A', '40', 9, 22),
  ('Café', '#6E4E3A', '42', 0, 23),
  ('Café', '#6E4E3A', '44', 2, 24)
) as v(color_name, color_hex, size, stock, sort_order);

with p as (
  insert into public.products (slug, name, description, details, section_id, collection_id, category, price, compare_at_price, tags)
  values ('blazer-alfaiataria-essencia', 'Blazer Alfaiataria Essência', 'Alfaiataria moderna com ombros estruturados e lapela clássica. Eleva qualquer produção, do jeans ao vestido.', array['Crepe encorpado', 'Forro acetinado', 'Dois botões', 'Bolsos com lapela']::text[],
    (select id from public.sections where slug = 'casual'),
    (select id from public.collections where slug = 'primavera-2026'),
    'Blazers', 459.9, null, array['novo']::text[])
  on conflict (slug) do nothing
  returning id
)
insert into public.product_variants (product_id, color_name, color_hex, size, stock, sort_order)
select p.id, v.color_name, v.color_hex, v.size, v.stock, v.sort_order from p, (values
  ('Caramelo', '#B07A45', 'PP', 3, 0),
  ('Caramelo', '#B07A45', 'P', 7, 1),
  ('Caramelo', '#B07A45', 'M', 4, 2),
  ('Caramelo', '#B07A45', 'G', 9, 3),
  ('Caramelo', '#B07A45', 'GG', 0, 4),
  ('Creme', '#E9DAC3', 'PP', 3, 10),
  ('Creme', '#E9DAC3', 'P', 0, 11),
  ('Creme', '#E9DAC3', 'M', 8, 12),
  ('Creme', '#E9DAC3', 'G', 2, 13),
  ('Creme', '#E9DAC3', 'GG', 0, 14),
  ('Preto', '#2A2522', 'PP', 8, 20),
  ('Preto', '#2A2522', 'P', 10, 21),
  ('Preto', '#2A2522', 'M', 7, 22),
  ('Preto', '#2A2522', 'G', 0, 23),
  ('Preto', '#2A2522', 'GG', 6, 24)
) as v(color_name, color_hex, size, stock, sort_order);

with p as (
  insert into public.products (slug, name, description, details, section_id, collection_id, category, price, compare_at_price, tags)
  values ('saia-midi-plissada-dourada', 'Saia Midi Plissada', 'Plissado delicado que ganha movimento a cada passo. Brilho sutil acetinado e cós confortável.', array['Plissado permanente', 'Cós com elástico', 'Forro interno', 'Comprimento midi']::text[],
    (select id from public.sections where slug = 'casual'),
    null,
    'Saias', 239.9, null, array['mais-vendido']::text[])
  on conflict (slug) do nothing
  returning id
)
insert into public.product_variants (product_id, color_name, color_hex, size, stock, sort_order)
select p.id, v.color_name, v.color_hex, v.size, v.stock, v.sort_order from p, (values
  ('Dourado', '#C49A4E', 'PP', 9, 0),
  ('Dourado', '#C49A4E', 'P', 3, 1),
  ('Dourado', '#C49A4E', 'M', 0, 2),
  ('Dourado', '#C49A4E', 'G', 5, 3),
  ('Dourado', '#C49A4E', 'GG', 7, 4),
  ('Sálvia', '#A8B08A', 'PP', 0, 10),
  ('Sálvia', '#A8B08A', 'P', 2, 11),
  ('Sálvia', '#A8B08A', 'M', 10, 12),
  ('Sálvia', '#A8B08A', 'G', 4, 13),
  ('Sálvia', '#A8B08A', 'GG', 10, 14),
  ('Vinho', '#6D2E36', 'PP', 0, 20),
  ('Vinho', '#6D2E36', 'P', 10, 21),
  ('Vinho', '#6D2E36', 'M', 7, 22),
  ('Vinho', '#6D2E36', 'G', 0, 23),
  ('Vinho', '#6D2E36', 'GG', 10, 24)
) as v(color_name, color_hex, size, stock, sort_order);

with p as (
  insert into public.products (slug, name, description, details, section_id, collection_id, category, price, compare_at_price, tags)
  values ('calca-jeans-reta-marina', 'Calça Jeans Reta Marina', 'O jeans perfeito existe: cintura alta, perna reta e lavagem clássica com leve elasticidade.', array['98% algodão, 2% elastano', 'Cintura alta', 'Cinco bolsos', 'Barra a fio']::text[],
    (select id from public.sections where slug = 'casual'),
    null,
    'Jeans', 279.9, null, array[]::text[])
  on conflict (slug) do nothing
  returning id
)
insert into public.product_variants (product_id, color_name, color_hex, size, stock, sort_order)
select p.id, v.color_name, v.color_hex, v.size, v.stock, v.sort_order from p, (values
  ('Jeans claro', '#8FA3B8', '36', 4, 0),
  ('Jeans claro', '#8FA3B8', '38', 6, 1),
  ('Jeans claro', '#8FA3B8', '40', 7, 2),
  ('Jeans claro', '#8FA3B8', '42', 9, 3),
  ('Jeans claro', '#8FA3B8', '44', 0, 4),
  ('Jeans escuro', '#46556B', '36', 6, 10),
  ('Jeans escuro', '#46556B', '38', 8, 11),
  ('Jeans escuro', '#46556B', '40', 9, 12),
  ('Jeans escuro', '#46556B', '42', 0, 13),
  ('Jeans escuro', '#46556B', '44', 2, 14)
) as v(color_name, color_hex, size, stock, sort_order);

with p as (
  insert into public.products (slug, name, description, details, section_id, collection_id, category, price, compare_at_price, tags)
  values ('t-shirt-premium-libelula', 'T-shirt Premium Libélula', 'Algodão pima de toque macio e gola bem acabada. A base de todo guarda-roupa elegante.', array['100% algodão pima', 'Fio 40.1 penteado', 'Modelagem reta', 'Não desbota']::text[],
    (select id from public.sections where slug = 'casual'),
    null,
    'Blusas', 129.9, 159.9, array['mais-vendido']::text[])
  on conflict (slug) do nothing
  returning id
)
insert into public.product_variants (product_id, color_name, color_hex, size, stock, sort_order)
select p.id, v.color_name, v.color_hex, v.size, v.stock, v.sort_order from p, (values
  ('Off-white', '#F3EADF', 'PP', 5, 0),
  ('Off-white', '#F3EADF', 'P', 4, 1),
  ('Off-white', '#F3EADF', 'M', 0, 2),
  ('Off-white', '#F3EADF', 'G', 6, 3),
  ('Off-white', '#F3EADF', 'GG', 3, 4),
  ('Preto', '#2A2522', 'PP', 10, 10),
  ('Preto', '#2A2522', 'P', 0, 11),
  ('Preto', '#2A2522', 'M', 8, 12),
  ('Preto', '#2A2522', 'G', 2, 13),
  ('Preto', '#2A2522', 'GG', 8, 14),
  ('Sálvia', '#A8B08A', 'PP', 3, 20),
  ('Sálvia', '#A8B08A', 'P', 2, 21),
  ('Sálvia', '#A8B08A', 'M', 10, 22),
  ('Sálvia', '#A8B08A', 'G', 4, 23),
  ('Sálvia', '#A8B08A', 'GG', 0, 24),
  ('Rosé', '#D9A99A', 'PP', 9, 30),
  ('Rosé', '#D9A99A', 'P', 9, 31),
  ('Rosé', '#D9A99A', 'M', 6, 32),
  ('Rosé', '#D9A99A', 'G', 0, 33),
  ('Rosé', '#D9A99A', 'GG', 7, 34)
) as v(color_name, color_hex, size, stock, sort_order);

with p as (
  insert into public.products (slug, name, description, details, section_id, collection_id, category, price, compare_at_price, tags)
  values ('macacao-pantalona-serena', 'Macacão Serena', 'Uma peça, look completo. Decote delicado, cintura marcada e pernas amplas para dias leves.', array['Viscolinho', 'Zíper invisível nas costas', 'Bolsos laterais', 'Alças fixas']::text[],
    (select id from public.sections where slug = 'casual'),
    (select id from public.collections where slug = 'primavera-2026'),
    'Vestidos', 379.9, null, array['novo']::text[])
  on conflict (slug) do nothing
  returning id
)
insert into public.product_variants (product_id, color_name, color_hex, size, stock, sort_order)
select p.id, v.color_name, v.color_hex, v.size, v.stock, v.sort_order from p, (values
  ('Terracota', '#B5655A', 'PP', 4, 0),
  ('Terracota', '#B5655A', 'P', 4, 1),
  ('Terracota', '#B5655A', 'M', 0, 2),
  ('Terracota', '#B5655A', 'G', 6, 3),
  ('Terracota', '#B5655A', 'GG', 2, 4),
  ('Oliva', '#6B7A3E', 'PP', 7, 10),
  ('Oliva', '#6B7A3E', 'P', 4, 11),
  ('Oliva', '#6B7A3E', 'M', 0, 12),
  ('Oliva', '#6B7A3E', 'G', 6, 13),
  ('Oliva', '#6B7A3E', 'GG', 5, 14),
  ('Preto', '#2A2522', 'PP', 8, 20),
  ('Preto', '#2A2522', 'P', 9, 21),
  ('Preto', '#2A2522', 'M', 6, 22),
  ('Preto', '#2A2522', 'G', 0, 23),
  ('Preto', '#2A2522', 'GG', 6, 24)
) as v(color_name, color_hex, size, stock, sort_order);

with p as (
  insert into public.products (slug, name, description, details, section_id, collection_id, category, price, compare_at_price, tags)
  values ('vestido-longo-veu-dourado', 'Vestido Longo Véu', 'Para ocasiões especiais: tecido com brilho acetinado, fenda discreta e caimento fluido até os pés.', array['Cetim fluido', 'Fenda lateral', 'Bojo removível', 'Alças finas']::text[],
    (select id from public.sections where slug = 'casual'),
    null,
    'Vestidos', 419.9, 499.9, array[]::text[])
  on conflict (slug) do nothing
  returning id
)
insert into public.product_variants (product_id, color_name, color_hex, size, stock, sort_order)
select p.id, v.color_name, v.color_hex, v.size, v.stock, v.sort_order from p, (values
  ('Vinho', '#6D2E36', 'PP', 5, 0),
  ('Vinho', '#6D2E36', 'P', 2, 1),
  ('Vinho', '#6D2E36', 'M', 10, 2),
  ('Vinho', '#6D2E36', 'G', 4, 3),
  ('Vinho', '#6D2E36', 'GG', 3, 4),
  ('Dourado', '#C49A4E', 'PP', 5, 10),
  ('Dourado', '#C49A4E', 'P', 7, 11),
  ('Dourado', '#C49A4E', 'M', 4, 12),
  ('Dourado', '#C49A4E', 'G', 9, 13),
  ('Dourado', '#C49A4E', 'GG', 3, 14),
  ('Espresso', '#3B2A1E', 'PP', 9, 20),
  ('Espresso', '#3B2A1E', 'P', 8, 21),
  ('Espresso', '#3B2A1E', 'M', 5, 22),
  ('Espresso', '#3B2A1E', 'G', 10, 23),
  ('Espresso', '#3B2A1E', 'GG', 7, 24)
) as v(color_name, color_hex, size, stock, sort_order);

with p as (
  insert into public.products (slug, name, description, details, section_id, collection_id, category, price, compare_at_price, tags)
  values ('shorts-alfaiataria-brisa', 'Shorts Alfaiataria Brisa', 'Cintura alta com pregas e acabamento de alfaiataria. Sofisticação para os dias quentes.', array['Linho misto', 'Pregas frontais', 'Passantes para cinto', 'Bolsos faca']::text[],
    (select id from public.sections where slug = 'casual'),
    (select id from public.collections where slug = 'primavera-2026'),
    'Calças', 179.9, null, array['novo']::text[])
  on conflict (slug) do nothing
  returning id
)
insert into public.product_variants (product_id, color_name, color_hex, size, stock, sort_order)
select p.id, v.color_name, v.color_hex, v.size, v.stock, v.sort_order from p, (values
  ('Creme', '#E9DAC3', '36', 0, 0),
  ('Creme', '#E9DAC3', '38', 3, 1),
  ('Creme', '#E9DAC3', '40', 4, 2),
  ('Creme', '#E9DAC3', '42', 6, 3),
  ('Creme', '#E9DAC3', '44', 8, 4),
  ('Caramelo', '#B07A45', '36', 3, 10),
  ('Caramelo', '#B07A45', '38', 5, 11),
  ('Caramelo', '#B07A45', '40', 6, 12),
  ('Caramelo', '#B07A45', '42', 8, 13),
  ('Caramelo', '#B07A45', '44', 10, 14),
  ('Oliva', '#6B7A3E', '36', 5, 20),
  ('Oliva', '#6B7A3E', '38', 7, 21),
  ('Oliva', '#6B7A3E', '40', 8, 22),
  ('Oliva', '#6B7A3E', '42', 10, 23),
  ('Oliva', '#6B7A3E', '44', 0, 24)
) as v(color_name, color_hex, size, stock, sort_order);

with p as (
  insert into public.products (slug, name, description, details, section_id, collection_id, category, price, compare_at_price, tags)
  values ('blusa-manga-longa-petala', 'Blusa Pétala', 'Tecido leve com textura suave e mangas amplas. Romântica na medida certa.', array['Crepe georgette', 'Decote em V', 'Mangas bufantes', 'Forro removível']::text[],
    (select id from public.sections where slug = 'casual'),
    null,
    'Blusas', 189.9, null, array[]::text[])
  on conflict (slug) do nothing
  returning id
)
insert into public.product_variants (product_id, color_name, color_hex, size, stock, sort_order)
select p.id, v.color_name, v.color_hex, v.size, v.stock, v.sort_order from p, (values
  ('Rosé', '#D9A99A', 'PP', 5, 0),
  ('Rosé', '#D9A99A', 'P', 0, 1),
  ('Rosé', '#D9A99A', 'M', 9, 2),
  ('Rosé', '#D9A99A', 'G', 3, 3),
  ('Rosé', '#D9A99A', 'GG', 3, 4),
  ('Off-white', '#F3EADF', 'PP', 4, 10),
  ('Off-white', '#F3EADF', 'P', 7, 11),
  ('Off-white', '#F3EADF', 'M', 4, 12),
  ('Off-white', '#F3EADF', 'G', 9, 13),
  ('Off-white', '#F3EADF', 'GG', 2, 14),
  ('Lavanda', '#B7A7C6', 'PP', 9, 20),
  ('Lavanda', '#B7A7C6', 'P', 3, 21),
  ('Lavanda', '#B7A7C6', 'M', 0, 22),
  ('Lavanda', '#B7A7C6', 'G', 5, 23),
  ('Lavanda', '#B7A7C6', 'GG', 7, 24)
) as v(color_name, color_hex, size, stock, sort_order);

with p as (
  insert into public.products (slug, name, description, details, section_id, collection_id, category, price, compare_at_price, tags)
  values ('jaqueta-sarja-outono', 'Jaqueta Sarja Outono', 'Estilo utilitário com um toque refinado: sarja encorpada, zíper dourado e gola alta.', array['100% algodão', 'Zíper metálico dourado', 'Bolsos frontais', 'Punho com ajuste']::text[],
    (select id from public.sections where slug = 'casual'),
    null,
    'Blazers', 349.9, null, array['mais-vendido']::text[])
  on conflict (slug) do nothing
  returning id
)
insert into public.product_variants (product_id, color_name, color_hex, size, stock, sort_order)
select p.id, v.color_name, v.color_hex, v.size, v.stock, v.sort_order from p, (values
  ('Oliva', '#6B7A3E', 'PP', 6, 0),
  ('Oliva', '#6B7A3E', 'P', 0, 1),
  ('Oliva', '#6B7A3E', 'M', 8, 2),
  ('Oliva', '#6B7A3E', 'G', 2, 3),
  ('Oliva', '#6B7A3E', 'GG', 4, 4),
  ('Caramelo', '#B07A45', 'PP', 5, 10),
  ('Caramelo', '#B07A45', 'P', 4, 11),
  ('Caramelo', '#B07A45', 'M', 0, 12),
  ('Caramelo', '#B07A45', 'G', 6, 13),
  ('Caramelo', '#B07A45', 'GG', 3, 14),
  ('Areia', '#D8C1A0', 'PP', 4, 20),
  ('Areia', '#D8C1A0', 'P', 7, 21),
  ('Areia', '#D8C1A0', 'M', 4, 22),
  ('Areia', '#D8C1A0', 'G', 9, 23),
  ('Areia', '#D8C1A0', 'GG', 2, 24)
) as v(color_name, color_hex, size, stock, sort_order);

with p as (
  insert into public.products (slug, name, description, details, section_id, collection_id, category, price, compare_at_price, tags)
  values ('legging-sculpt-cintura-alta', 'Legging Sculpt Cintura Alta', 'Compressão na medida certa, cós anatômico que não enrola e tecido 100% opaco. Do agachamento ao café pós-treino.', array['Poliamida com elastano', 'Proteção UV50+', 'Secagem rápida', 'Não fica transparente', 'Cós duplo']::text[],
    (select id from public.sections where slug = 'fitness'),
    null,
    'Leggings', 199.9, null, array['mais-vendido']::text[])
  on conflict (slug) do nothing
  returning id
)
insert into public.product_variants (product_id, color_name, color_hex, size, stock, sort_order)
select p.id, v.color_name, v.color_hex, v.size, v.stock, v.sort_order from p, (values
  ('Oliva', '#6B7A3E', 'PP', 2, 0),
  ('Oliva', '#6B7A3E', 'P', 5, 1),
  ('Oliva', '#6B7A3E', 'M', 2, 2),
  ('Oliva', '#6B7A3E', 'G', 7, 3),
  ('Oliva', '#6B7A3E', 'GG', 0, 4),
  ('Preto', '#2A2522', 'PP', 3, 10),
  ('Preto', '#2A2522', 'P', 10, 11),
  ('Preto', '#2A2522', 'M', 7, 12),
  ('Preto', '#2A2522', 'G', 0, 13),
  ('Preto', '#2A2522', 'GG', 0, 14),
  ('Café', '#6E4E3A', 'PP', 5, 20),
  ('Café', '#6E4E3A', 'P', 0, 21),
  ('Café', '#6E4E3A', 'M', 9, 22),
  ('Café', '#6E4E3A', 'G', 3, 23),
  ('Café', '#6E4E3A', 'GG', 3, 24),
  ('Rosé', '#D9A99A', 'PP', 8, 30),
  ('Rosé', '#D9A99A', 'P', 5, 31),
  ('Rosé', '#D9A99A', 'M', 2, 32),
  ('Rosé', '#D9A99A', 'G', 7, 33),
  ('Rosé', '#D9A99A', 'GG', 6, 34)
) as v(color_name, color_hex, size, stock, sort_order);

with p as (
  insert into public.products (slug, name, description, details, section_id, collection_id, category, price, compare_at_price, tags)
  values ('top-cruzado-movimento', 'Top Cruzado Movimento', 'Sustentação média com alças cruzadas nas costas e bojo removível. Conforto que acompanha cada movimento.', array['Poliamida com elastano', 'Bojo removível', 'Alças cruzadas', 'Sustentação média']::text[],
    (select id from public.sections where slug = 'fitness'),
    (select id from public.collections where slug = 'essencia-fit'),
    'Tops', 139.9, null, array['novo', 'mais-vendido']::text[])
  on conflict (slug) do nothing
  returning id
)
insert into public.product_variants (product_id, color_name, color_hex, size, stock, sort_order)
select p.id, v.color_name, v.color_hex, v.size, v.stock, v.sort_order from p, (values
  ('Oliva', '#6B7A3E', 'PP', 4, 0),
  ('Oliva', '#6B7A3E', 'P', 10, 1),
  ('Oliva', '#6B7A3E', 'M', 7, 2),
  ('Oliva', '#6B7A3E', 'G', 0, 3),
  ('Oliva', '#6B7A3E', 'GG', 2, 4),
  ('Preto', '#2A2522', 'PP', 5, 10),
  ('Preto', '#2A2522', 'P', 4, 11),
  ('Preto', '#2A2522', 'M', 0, 12),
  ('Preto', '#2A2522', 'G', 6, 13),
  ('Preto', '#2A2522', 'GG', 3, 14),
  ('Rosé', '#D9A99A', 'PP', 2, 20),
  ('Rosé', '#D9A99A', 'P', 6, 21),
  ('Rosé', '#D9A99A', 'M', 3, 22),
  ('Rosé', '#D9A99A', 'G', 8, 23),
  ('Rosé', '#D9A99A', 'GG', 0, 24),
  ('Areia', '#D8C1A0', 'PP', 2, 30),
  ('Areia', '#D8C1A0', 'P', 6, 31),
  ('Areia', '#D8C1A0', 'M', 3, 32),
  ('Areia', '#D8C1A0', 'G', 8, 33),
  ('Areia', '#D8C1A0', 'GG', 0, 34)
) as v(color_name, color_hex, size, stock, sort_order);

with p as (
  insert into public.products (slug, name, description, details, section_id, collection_id, category, price, compare_at_price, tags)
  values ('conjunto-essencia-fit', 'Conjunto Essência Fit', 'Top + legging combinando em tecido de toque gelado. O look completo para treinar com estilo.', array['Top com bojo + legging cintura alta', 'Toque gelado', 'Tecido respirável', 'Costuras flatlock']::text[],
    (select id from public.sections where slug = 'fitness'),
    null,
    'Conjuntos', 319.9, 379.9, array['mais-vendido']::text[])
  on conflict (slug) do nothing
  returning id
)
insert into public.product_variants (product_id, color_name, color_hex, size, stock, sort_order)
select p.id, v.color_name, v.color_hex, v.size, v.stock, v.sort_order from p, (values
  ('Sálvia', '#A8B08A', 'PP', 3, 0),
  ('Sálvia', '#A8B08A', 'P', 10, 1),
  ('Sálvia', '#A8B08A', 'M', 7, 2),
  ('Sálvia', '#A8B08A', 'G', 0, 3),
  ('Sálvia', '#A8B08A', 'GG', 0, 4),
  ('Café', '#6E4E3A', 'PP', 8, 10),
  ('Café', '#6E4E3A', 'P', 3, 11),
  ('Café', '#6E4E3A', 'M', 0, 12),
  ('Café', '#6E4E3A', 'G', 5, 13),
  ('Café', '#6E4E3A', 'GG', 6, 14),
  ('Preto', '#2A2522', 'PP', 3, 20),
  ('Preto', '#2A2522', 'P', 2, 21),
  ('Preto', '#2A2522', 'M', 10, 22),
  ('Preto', '#2A2522', 'G', 4, 23),
  ('Preto', '#2A2522', 'GG', 0, 24)
) as v(color_name, color_hex, size, stock, sort_order);

with p as (
  insert into public.products (slug, name, description, details, section_id, collection_id, category, price, compare_at_price, tags)
  values ('shorts-biker-energia', 'Shorts Biker Energia', 'Comprimento ideal para corrida e bike, com bolso lateral para celular e cós que fica no lugar.', array['Bolso lateral', 'Cós alto anatômico', 'Tecido opaco', 'Secagem rápida']::text[],
    (select id from public.sections where slug = 'fitness'),
    null,
    'Shorts', 119.9, null, array[]::text[])
  on conflict (slug) do nothing
  returning id
)
insert into public.product_variants (product_id, color_name, color_hex, size, stock, sort_order)
select p.id, v.color_name, v.color_hex, v.size, v.stock, v.sort_order from p, (values
  ('Preto', '#2A2522', 'PP', 5, 0),
  ('Preto', '#2A2522', 'P', 0, 1),
  ('Preto', '#2A2522', 'M', 8, 2),
  ('Preto', '#2A2522', 'G', 2, 3),
  ('Preto', '#2A2522', 'GG', 3, 4),
  ('Oliva', '#6B7A3E', 'PP', 4, 10),
  ('Oliva', '#6B7A3E', 'P', 6, 11),
  ('Oliva', '#6B7A3E', 'M', 3, 12),
  ('Oliva', '#6B7A3E', 'G', 8, 13),
  ('Oliva', '#6B7A3E', 'GG', 2, 14),
  ('Terracota', '#B5655A', 'PP', 2, 20),
  ('Terracota', '#B5655A', 'P', 6, 21),
  ('Terracota', '#B5655A', 'M', 3, 22),
  ('Terracota', '#B5655A', 'G', 8, 23),
  ('Terracota', '#B5655A', 'GG', 0, 24)
) as v(color_name, color_hex, size, stock, sort_order);

with p as (
  insert into public.products (slug, name, description, details, section_id, collection_id, category, price, compare_at_price, tags)
  values ('regata-dry-fit-leveza', 'Regata Dry Leveza', 'Leve, respirável e com cavas amplas. Perfeita para treinos intensos ou yoga.', array['Dry fit', 'Proteção UV', 'Cavas nadador', 'Barra arredondada']::text[],
    (select id from public.sections where slug = 'fitness'),
    (select id from public.collections where slug = 'essencia-fit'),
    'Regatas', 99.9, null, array['novo']::text[])
  on conflict (slug) do nothing
  returning id
)
insert into public.product_variants (product_id, color_name, color_hex, size, stock, sort_order)
select p.id, v.color_name, v.color_hex, v.size, v.stock, v.sort_order from p, (values
  ('Off-white', '#F3EADF', 'PP', 6, 0),
  ('Off-white', '#F3EADF', 'P', 0, 1),
  ('Off-white', '#F3EADF', 'M', 8, 2),
  ('Off-white', '#F3EADF', 'G', 2, 3),
  ('Off-white', '#F3EADF', 'GG', 4, 4),
  ('Sálvia', '#A8B08A', 'PP', 5, 10),
  ('Sálvia', '#A8B08A', 'P', 10, 11),
  ('Sálvia', '#A8B08A', 'M', 7, 12),
  ('Sálvia', '#A8B08A', 'G', 0, 13),
  ('Sálvia', '#A8B08A', 'GG', 3, 14),
  ('Preto', '#2A2522', 'PP', 3, 20),
  ('Preto', '#2A2522', 'P', 9, 21),
  ('Preto', '#2A2522', 'M', 6, 22),
  ('Preto', '#2A2522', 'G', 0, 23),
  ('Preto', '#2A2522', 'GG', 0, 24),
  ('Lavanda', '#B7A7C6', 'PP', 9, 30),
  ('Lavanda', '#B7A7C6', 'P', 8, 31),
  ('Lavanda', '#B7A7C6', 'M', 5, 32),
  ('Lavanda', '#B7A7C6', 'G', 10, 33),
  ('Lavanda', '#B7A7C6', 'GG', 7, 34)
) as v(color_name, color_hex, size, stock, sort_order);

with p as (
  insert into public.products (slug, name, description, details, section_id, collection_id, category, price, compare_at_price, tags)
  values ('jaqueta-corta-vento-trilha', 'Jaqueta Corta-Vento Trilha', 'Ultraleve e dobrável, com proteção contra vento e garoa. Sua companheira de corridas ao ar livre.', array['Tecido repelente à água', 'Capuz embutido', 'Bolsos com zíper', 'Detalhes refletivos']::text[],
    (select id from public.sections where slug = 'fitness'),
    null,
    'Jaquetas', 289.9, null, array[]::text[])
  on conflict (slug) do nothing
  returning id
)
insert into public.product_variants (product_id, color_name, color_hex, size, stock, sort_order)
select p.id, v.color_name, v.color_hex, v.size, v.stock, v.sort_order from p, (values
  ('Areia', '#D8C1A0', 'PP', 2, 0),
  ('Areia', '#D8C1A0', 'P', 9, 1),
  ('Areia', '#D8C1A0', 'M', 6, 2),
  ('Areia', '#D8C1A0', 'G', 0, 3),
  ('Areia', '#D8C1A0', 'GG', 0, 4),
  ('Oliva', '#6B7A3E', 'PP', 4, 10),
  ('Oliva', '#6B7A3E', 'P', 2, 11),
  ('Oliva', '#6B7A3E', 'M', 10, 12),
  ('Oliva', '#6B7A3E', 'G', 4, 13),
  ('Oliva', '#6B7A3E', 'GG', 2, 14),
  ('Preto', '#2A2522', 'PP', 5, 20),
  ('Preto', '#2A2522', 'P', 7, 21),
  ('Preto', '#2A2522', 'M', 4, 22),
  ('Preto', '#2A2522', 'G', 9, 23),
  ('Preto', '#2A2522', 'GG', 3, 24)
) as v(color_name, color_hex, size, stock, sort_order);

with p as (
  insert into public.products (slug, name, description, details, section_id, collection_id, category, price, compare_at_price, tags)
  values ('legging-flare-yoga', 'Legging Flare Yoga', 'Boca flare, cintura alta e toque aveludado. Do tapete de yoga para a rua com naturalidade.', array['Tecido peletizado', 'Cintura alta', 'Boca flare', 'Alta elasticidade']::text[],
    (select id from public.sections where slug = 'fitness'),
    (select id from public.collections where slug = 'essencia-fit'),
    'Leggings', 219.9, null, array['novo']::text[])
  on conflict (slug) do nothing
  returning id
)
insert into public.product_variants (product_id, color_name, color_hex, size, stock, sort_order)
select p.id, v.color_name, v.color_hex, v.size, v.stock, v.sort_order from p, (values
  ('Café', '#6E4E3A', 'PP', 7, 0),
  ('Café', '#6E4E3A', 'P', 7, 1),
  ('Café', '#6E4E3A', 'M', 4, 2),
  ('Café', '#6E4E3A', 'G', 9, 3),
  ('Café', '#6E4E3A', 'GG', 5, 4),
  ('Preto', '#2A2522', 'PP', 7, 10),
  ('Preto', '#2A2522', 'P', 0, 11),
  ('Preto', '#2A2522', 'M', 9, 12),
  ('Preto', '#2A2522', 'G', 3, 13),
  ('Preto', '#2A2522', 'GG', 5, 14),
  ('Sálvia', '#A8B08A', 'PP', 3, 20),
  ('Sálvia', '#A8B08A', 'P', 10, 21),
  ('Sálvia', '#A8B08A', 'M', 7, 22),
  ('Sálvia', '#A8B08A', 'G', 0, 23),
  ('Sálvia', '#A8B08A', 'GG', 0, 24)
) as v(color_name, color_hex, size, stock, sort_order);

with p as (
  insert into public.products (slug, name, description, details, section_id, collection_id, category, price, compare_at_price, tags)
  values ('top-nadador-impacto', 'Top Nadador Alto Impacto', 'Alta sustentação para corrida, crossfit e HIIT. Faixa inferior firme e costas nadador.', array['Alta sustentação', 'Faixa elástica reforçada', 'Costas nadador', 'Bojo fixo']::text[],
    (select id from public.sections where slug = 'fitness'),
    null,
    'Tops', 159.9, null, array[]::text[])
  on conflict (slug) do nothing
  returning id
)
insert into public.product_variants (product_id, color_name, color_hex, size, stock, sort_order)
select p.id, v.color_name, v.color_hex, v.size, v.stock, v.sort_order from p, (values
  ('Preto', '#2A2522', 'PP', 5, 0),
  ('Preto', '#2A2522', 'P', 10, 1),
  ('Preto', '#2A2522', 'M', 7, 2),
  ('Preto', '#2A2522', 'G', 0, 3),
  ('Preto', '#2A2522', 'GG', 3, 4),
  ('Terracota', '#B5655A', 'PP', 4, 10),
  ('Terracota', '#B5655A', 'P', 5, 11),
  ('Terracota', '#B5655A', 'M', 2, 12),
  ('Terracota', '#B5655A', 'G', 7, 13),
  ('Terracota', '#B5655A', 'GG', 2, 14),
  ('Oliva', '#6B7A3E', 'PP', 8, 20),
  ('Oliva', '#6B7A3E', 'P', 5, 21),
  ('Oliva', '#6B7A3E', 'M', 2, 22),
  ('Oliva', '#6B7A3E', 'G', 7, 23),
  ('Oliva', '#6B7A3E', 'GG', 6, 24)
) as v(color_name, color_hex, size, stock, sort_order);

with p as (
  insert into public.products (slug, name, description, details, section_id, collection_id, category, price, compare_at_price, tags)
  values ('camiseta-oversized-studio', 'Camiseta Oversized Studio', 'Modelagem ampla e tecido tecnológico que não marca o suor. Estilo athleisure no dia a dia.', array['Poliamida tecnológica', 'Anti-odor', 'Modelagem oversized', 'Ombro caído']::text[],
    (select id from public.sections where slug = 'fitness'),
    null,
    'Regatas', 129.9, 149.9, array[]::text[])
  on conflict (slug) do nothing
  returning id
)
insert into public.product_variants (product_id, color_name, color_hex, size, stock, sort_order)
select p.id, v.color_name, v.color_hex, v.size, v.stock, v.sort_order from p, (values
  ('Creme', '#E9DAC3', 'PP', 6, 0),
  ('Creme', '#E9DAC3', 'P', 9, 1),
  ('Creme', '#E9DAC3', 'M', 6, 2),
  ('Creme', '#E9DAC3', 'G', 0, 3),
  ('Creme', '#E9DAC3', 'GG', 4, 4),
  ('Preto', '#2A2522', 'PP', 7, 10),
  ('Preto', '#2A2522', 'P', 8, 11),
  ('Preto', '#2A2522', 'M', 5, 12),
  ('Preto', '#2A2522', 'G', 10, 13),
  ('Preto', '#2A2522', 'GG', 5, 14),
  ('Oliva', '#6B7A3E', 'PP', 6, 20),
  ('Oliva', '#6B7A3E', 'P', 3, 21),
  ('Oliva', '#6B7A3E', 'M', 0, 22),
  ('Oliva', '#6B7A3E', 'G', 5, 23),
  ('Oliva', '#6B7A3E', 'GG', 4, 24)
) as v(color_name, color_hex, size, stock, sort_order);

with p as (
  insert into public.products (slug, name, description, details, section_id, collection_id, category, price, compare_at_price, tags)
  values ('macaquinho-fit-pilates', 'Macaquinho Pilates', 'Peça única com alças finas e decote nas costas. Liberdade total para pilates e dança.', array['Bojo removível', 'Costas abertas', 'Compressão leve', 'Tecido respirável']::text[],
    (select id from public.sections where slug = 'fitness'),
    (select id from public.collections where slug = 'essencia-fit'),
    'Conjuntos', 249.9, null, array['novo']::text[])
  on conflict (slug) do nothing
  returning id
)
insert into public.product_variants (product_id, color_name, color_hex, size, stock, sort_order)
select p.id, v.color_name, v.color_hex, v.size, v.stock, v.sort_order from p, (values
  ('Rosé', '#D9A99A', 'PP', 8, 0),
  ('Rosé', '#D9A99A', 'P', 2, 1),
  ('Rosé', '#D9A99A', 'M', 10, 2),
  ('Rosé', '#D9A99A', 'G', 4, 3),
  ('Rosé', '#D9A99A', 'GG', 6, 4),
  ('Preto', '#2A2522', 'PP', 4, 10),
  ('Preto', '#2A2522', 'P', 10, 11),
  ('Preto', '#2A2522', 'M', 7, 12),
  ('Preto', '#2A2522', 'G', 0, 13),
  ('Preto', '#2A2522', 'GG', 2, 14),
  ('Sálvia', '#A8B08A', 'PP', 8, 20),
  ('Sálvia', '#A8B08A', 'P', 0, 21),
  ('Sálvia', '#A8B08A', 'M', 8, 22),
  ('Sálvia', '#A8B08A', 'G', 2, 23),
  ('Sálvia', '#A8B08A', 'GG', 6, 24)
) as v(color_name, color_hex, size, stock, sort_order);

with p as (
  insert into public.products (slug, name, description, details, section_id, collection_id, category, price, compare_at_price, tags)
  values ('legging-costura-contorno', 'Legging Contorno', 'Recortes estratégicos que valorizam as curvas e tecido de compressão média para treinos variados.', array['Recortes contorno', 'Compressão média', 'Bolso no cós', 'Opaca']::text[],
    (select id from public.sections where slug = 'fitness'),
    null,
    'Leggings', 179.9, 229.9, array[]::text[])
  on conflict (slug) do nothing
  returning id
)
insert into public.product_variants (product_id, color_name, color_hex, size, stock, sort_order)
select p.id, v.color_name, v.color_hex, v.size, v.stock, v.sort_order from p, (values
  ('Terracota', '#B5655A', 'PP', 7, 0),
  ('Terracota', '#B5655A', 'P', 2, 1),
  ('Terracota', '#B5655A', 'M', 10, 2),
  ('Terracota', '#B5655A', 'G', 4, 3),
  ('Terracota', '#B5655A', 'GG', 5, 4),
  ('Preto', '#2A2522', 'PP', 6, 10),
  ('Preto', '#2A2522', 'P', 8, 11),
  ('Preto', '#2A2522', 'M', 5, 12),
  ('Preto', '#2A2522', 'G', 10, 13),
  ('Preto', '#2A2522', 'GG', 4, 14),
  ('Oliva', '#6B7A3E', 'PP', 5, 20),
  ('Oliva', '#6B7A3E', 'P', 3, 21),
  ('Oliva', '#6B7A3E', 'M', 0, 22),
  ('Oliva', '#6B7A3E', 'G', 5, 23),
  ('Oliva', '#6B7A3E', 'GG', 3, 24)
) as v(color_name, color_hex, size, stock, sort_order);

with p as (
  insert into public.products (slug, name, description, details, section_id, collection_id, category, price, compare_at_price, tags)
  values ('shorts-corrida-leve', 'Shorts Corrida Leve', 'Shorts dois em um com bermuda interna de compressão. Leveza para seus melhores tempos.', array['Dois em um', 'Bolso interno', 'Tecido leve', 'Cós com cordão']::text[],
    (select id from public.sections where slug = 'fitness'),
    null,
    'Shorts', 109.9, null, array['mais-vendido']::text[])
  on conflict (slug) do nothing
  returning id
)
insert into public.product_variants (product_id, color_name, color_hex, size, stock, sort_order)
select p.id, v.color_name, v.color_hex, v.size, v.stock, v.sort_order from p, (values
  ('Sálvia', '#A8B08A', 'PP', 10, 0),
  ('Sálvia', '#A8B08A', 'P', 0, 1),
  ('Sálvia', '#A8B08A', 'M', 8, 2),
  ('Sálvia', '#A8B08A', 'G', 2, 3),
  ('Sálvia', '#A8B08A', 'GG', 8, 4),
  ('Preto', '#2A2522', 'PP', 4, 10),
  ('Preto', '#2A2522', 'P', 6, 11),
  ('Preto', '#2A2522', 'M', 3, 12),
  ('Preto', '#2A2522', 'G', 8, 13),
  ('Preto', '#2A2522', 'GG', 2, 14),
  ('Areia', '#D8C1A0', 'PP', 0, 20),
  ('Areia', '#D8C1A0', 'P', 8, 21),
  ('Areia', '#D8C1A0', 'M', 5, 22),
  ('Areia', '#D8C1A0', 'G', 10, 23),
  ('Areia', '#D8C1A0', 'GG', 10, 24)
) as v(color_name, color_hex, size, stock, sort_order);
