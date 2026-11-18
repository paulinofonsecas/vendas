-- Vendaz · seed de catálogo (idempotente)
-- 30 produtos: 8 perfis, 6 pares de câmbio, 8 design, 8 digitais.
-- Correr com:  npx supabase db reset      (local)
--               psql "$DATABASE_URL" -f supabase/seed.sql   (remoto)

-- ---------------------------------------------------------------------------
-- definições (não sobrescreve edições feitas no back-office)
-- ---------------------------------------------------------------------------

insert into public.settings (key, value, is_public) values
  ('store', '{"name":"Vendaz","whatsapp":"244900000000","email":"","address":"Luanda, Angola","hours":"Seg-Sáb, 08h-18h","currency":"AOA"}'::jsonb, true),
  ('payment', '{"transfer":{"enabled":true,"bank":"BAI","holder":"Vendaz Lda","iban":"AO06 0000 0000 0000 0000 0","instructions":"Envia o comprovativo na página do pedido."},"cash":{"enabled":true,"instructions":"Pagamento no acto da entrega, em Luanda."}}'::jsonb, true)
on conflict (key) do nothing;

-- carrossel da home: flyers 1920x400 (substituir pelas artes reais em Definições)
insert into public.settings (key, value, is_public) values
  ('banners', '[
    {"image":"https://picsum.photos/seed/banner1/1920/400","title":"","subtitle":"","cta":"","href":"/categoria/profile"},
    {"image":"https://picsum.photos/seed/banner2/1920/400","title":"","subtitle":"","cta":"","href":"/categoria/fx"},
    {"image":"https://picsum.photos/seed/banner3/1920/400","title":"","subtitle":"","cta":"","href":"/categoria/design"},
    {"image":"https://picsum.photos/seed/banner4/1920/400","title":"","subtitle":"","cta":"","href":"/categoria/digital"},
    {"image":"https://picsum.photos/seed/banner5/1920/400","title":"","subtitle":"","cta":"","href":"/#catalogo"}
  ]'::jsonb, true)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- câmbios
-- ---------------------------------------------------------------------------

insert into public.fx_rates (base, quote, buy, sell, source) values
  ('USD', 'AOA',  900.0000,  940.0000, 'manual'),
  ('EUR', 'AOA',  975.0000, 1020.0000, 'manual'),
  ('BRL', 'AOA',  170.0000,  195.0000, 'manual'),
  ('ZAR', 'AOA',   48.0000,   57.0000, 'manual'),
  ('GBP', 'AOA', 1130.0000, 1190.0000, 'manual'),
  ('USDT', 'AOA', 895.0000,  935.0000, 'manual')
on conflict (base, quote) do update
  set buy = excluded.buy, sell = excluded.sell, active = true, updated_at = now();

-- ---------------------------------------------------------------------------
-- produtos
-- ---------------------------------------------------------------------------

insert into public.products (type, slug, name, description, price, config, sort) values
  -- perfis de streaming
  ('profile', 'netflix-1-ecra', 'Netflix Premium — 1 ecrã',
   'Perfil Netflix Premium por 30 dias, com garantia de substituição.',
   8500.00, '{"duration_days":30,"screens":1,"warranty_days":7}'::jsonb, 10),
  ('profile', 'netflix-2-ecras', 'Netflix Premium — 2 ecrãs',
   'Dois perfis Netflix Premium na mesma conta, por 30 dias.',
   15000.00, '{"duration_days":30,"screens":2,"warranty_days":7}'::jsonb, 20),
  ('profile', 'netflix-4-ecras', 'Netflix Premium — 4 ecrãs',
   'Conta completa com 4 perfis por 30 dias. Ideal para família.',
   25000.00, '{"duration_days":30,"screens":4,"warranty_days":7}'::jsonb, 30),
  ('profile', 'netflix-90-dias', 'Netflix Premium — 90 dias',
   'Perfil Netflix Premium com validade alargada de três meses.',
   22000.00, '{"duration_days":90,"screens":1,"warranty_days":14}'::jsonb, 40),
  ('profile', 'prime-video', 'Prime Video — 1 ecrã',
   'Acesso ao Prime Video por 30 dias, incluindo conteúdo original.',
   6000.00, '{"duration_days":30,"screens":1,"warranty_days":5}'::jsonb, 50),
  ('profile', 'disney-plus', 'Disney+ — 1 ecrã',
   'Perfil Disney+ por 30 dias com Marvel, Star Wars e Pixar.',
   6500.00, '{"duration_days":30,"screens":1,"warranty_days":5}'::jsonb, 60),
  ('profile', 'spotify-premium', 'Spotify Premium — Individual',
   'Sem anúncios e com downloads offline durante 30 dias.',
   7000.00, '{"duration_days":30,"screens":1,"warranty_days":7}'::jsonb, 70),
  ('profile', 'youtube-premium', 'YouTube Premium — 1 conta',
   'Vídeos sem anúncios, reprodução em segundo plano e YouTube Music.',
   7500.00, '{"duration_days":30,"screens":1,"warranty_days":7}'::jsonb, 80),

  -- câmbio
  ('fx', 'cambio-usd-aoa', 'Câmbio USD → AOA',
   'Compra ou venda de dólares com taxa actualizada. Confirma o montante no checkout.',
   0.00, '{"base":"USD","quote":"AOA","min_amount":50}'::jsonb, 10),
  ('fx', 'cambio-eur-aoa', 'Câmbio EUR → AOA',
   'Compra ou venda de euros com cotação do dia.',
   0.00, '{"base":"EUR","quote":"AOA","min_amount":50}'::jsonb, 20),
  ('fx', 'cambio-brl-aoa', 'Câmbio BRL → AOA',
   'Reais para kwanzas, com taxa fixada no momento do pedido.',
   0.00, '{"base":"BRL","quote":"AOA","min_amount":200}'::jsonb, 30),
  ('fx', 'cambio-zar-aoa', 'Câmbio ZAR → AOA',
   'Randes sul-africanos para kwanzas, para quem viaja ou importa.',
   0.00, '{"base":"ZAR","quote":"AOA","min_amount":500}'::jsonb, 40),
  ('fx', 'cambio-gbp-aoa', 'Câmbio GBP → AOA',
   'Libras para kwanzas com spread competitivo.',
   0.00, '{"base":"GBP","quote":"AOA","min_amount":50}'::jsonb, 50),
  ('fx', 'cambio-usdt-aoa', 'Câmbio USDT → AOA',
   'Tether para kwanzas, com confirmação após validação on-chain.',
   0.00, '{"base":"USDT","quote":"AOA","min_amount":20}'::jsonb, 60),

  -- design
  ('design', 'flyer-digital', 'Flyer digital',
   'Flyer para redes sociais, 1080x1080, entrega até 48h após o briefing.',
   5000.00, '{"formats":["1080x1080","1080x1920"],"delivery_hours":48,"revisions":2}'::jsonb, 10),
  ('design', 'logotipo-essencial', 'Logotipo essencial',
   'Logotipo com duas propostas, ficheiros vectoriais e versões a preto e branco.',
   35000.00, '{"delivery_hours":72,"revisions":3}'::jsonb, 20),
  ('design', 'cartao-de-visita', 'Cartão de visita',
   'Cartão frente e verso, pronto para impressão em gráfica local.',
   12000.00, '{"formats":["85x55mm"],"delivery_hours":48,"revisions":2}'::jsonb, 30),
  ('design', 'banner-redes-sociais', 'Banner para redes sociais',
   'Capa de página ou grupo, optimizada para telemóvel e desktop.',
   9000.00, '{"formats":["1200x630","1640x924"],"delivery_hours":36,"revisions":2}'::jsonb, 40),
  ('design', 'pack-5-posts', 'Pack de 5 posts',
   'Cinco artes coerentes para uma campanha, com texto editável.',
   20000.00, '{"delivery_hours":72,"revisions":2}'::jsonb, 50),
  ('design', 'apresentacao-slides', 'Apresentação de slides',
   'Até 12 slides para proposta comercial ou aula, em PDF e PPTX.',
   18000.00, '{"delivery_hours":72,"revisions":2}'::jsonb, 60),
  ('design', 'capa-youtube', 'Capa de YouTube',
   'Thumbnail com contraste alto, pensada para cliques no feed.',
   8000.00, '{"formats":["1280x720"],"delivery_hours":24,"revisions":1}'::jsonb, 70),
  ('design', 'identidade-visual-basica', 'Identidade visual básica',
   'Logotipo, paleta, tipografia e três aplicações. Para marcas a arrancar.',
   65000.00, '{"delivery_hours":120,"revisions":3}'::jsonb, 80),

  -- produtos digitais
  ('digital', 'guia-investimento', 'Guia de investimento local',
   'PDF com 40 páginas sobre oportunidades de investimento em Angola.',
   3000.00, '{"delivery":"link","format":"pdf"}'::jsonb, 10),
  ('digital', 'ebook-cambio-forex', 'Ebook — Câmbio e Forex para iniciantes',
   'Como ler cotações, calcular spread e evitar erros comuns.',
   4500.00, '{"delivery":"link","format":"pdf"}'::jsonb, 20),
  ('digital', 'template-planilha-financeira', 'Template de gestão financeira',
   'Planilha com fluxo de caixa, stock e margem por produto.',
   6000.00, '{"delivery":"link","format":"xlsx"}'::jsonb, 30),
  ('digital', 'pack-100-flyers-editaveis', 'Pack de 100 flyers editáveis',
   'Ficheiros Canva prontos a personalizar, por sector de actividade.',
   8000.00, '{"delivery":"link","format":"canva"}'::jsonb, 40),
  ('digital', 'guia-netflix-seguro', 'Guia — Usar perfis partilhados com segurança',
   'Boas práticas de PIN, perfis e dispositivos para evitar bloqueios.',
   2500.00, '{"delivery":"link","format":"pdf"}'::jsonb, 50),
  ('digital', 'curso-vender-online', 'Curso — Vender online em Angola',
   'Seis módulos em vídeo sobre catálogo, pagamentos e entrega.',
   15000.00, '{"delivery":"link","format":"video"}'::jsonb, 60),
  ('digital', 'pack-icones-sociais', 'Pack de ícones para redes sociais',
   'Mais de 200 ícones em SVG e PNG, uso comercial incluído.',
   3500.00, '{"delivery":"link","format":"zip"}'::jsonb, 70),
  ('digital', 'manual-whatsapp-business', 'Manual — WhatsApp Business',
   'Configuração, catálogo, respostas rápidas e etiquetas.',
   4000.00, '{"delivery":"link","format":"pdf"}'::jsonb, 80)
on conflict (slug) do update
  set type = excluded.type,
      name = excluded.name,
      description = excluded.description,
      price = excluded.price,
      config = excluded.config,
      sort = excluded.sort,
      active = true;
