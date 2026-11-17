# CLAUDE.md

Contexto para agentes que trabalham neste repositório.

## O que é

Loja de serviços digitais de cliente único (Angola, AOA): perfis de streaming, câmbio manual,
design gráfico e infoprodutos. Checkout **sem login**; só a equipa entra no back-office.

## Stack

- **Next.js 16 (App Router, Turbopack) + React 19 + TypeScript**
- **Tailwind v4 + shadcn/ui** (estilo `base-nova`, Base UI — **não** Radix)
- **Supabase**: Postgres, Auth (só admin), Storage (comprovativos)
- **Vercel** para deploy
- `zod` para validação de formulários; `@supabase/ssr` para sessão por cookies

## Comandos

```
pnpm dev            # servidor local
pnpm build          # build de produção (corre o type check)
pnpm lint           # eslint
npx supabase link --project-ref xyeskykcvubxsdhzxmqn
npx supabase db push        # aplica supabase/migrations no projecto ligado
```

## Regras de ouro

1. **`SUPABASE_SERVICE_ROLE_KEY` nunca sai do servidor.** Não prefixar com `NEXT_PUBLIC_`.
   Só é importada em `src/lib/supabase/admin.ts`, usada por Server Actions/Route Handlers.
2. **Toda a tabela nova tem RLS.** Sem policy = negado. Depois de cada migration, correr os
   advisors de segurança do Supabase.
3. **`anon` não escreve nada.** O checkout corre em Server Actions com service role + rate limit.
   Só a leitura de catálogo, câmbios e definições públicas é concedida a `anon`.
4. **Preços e cotações calculam-se no servidor.** O formulário envia quantidade/montante, nunca o total.
5. **Segredos de perfis** (email/password Netflix) vivem em `inventory_items.secret_ciphertext`,
   cifrados com AES-256-GCM (`src/lib/crypto.ts`). Só são decifrados no detalhe do pedido do admin.
   Nunca os pôr em `products.config`, logs, `order_events` ou no `outbox`.
6. **UI só com shadcn/ui.** Este estilo usa `render`/`className`, não `asChild`: para um link
   com aparência de botão usa `buttonVariants({...})` num `<Link>`.
7. **Dinheiro** é `numeric(12,2)` em AOA; formatar sempre com `formatAOA` de `src/lib/money.ts`.

## Estrutura

```
src/
  app/
    page.tsx                     vitrine (lê a view `catalog`)
    p/[slug]/                    página de produto
    checkout/[slug]/             formulário de checkout (um form, variações por tipo)
    pedido/[id]/                 estado do pedido + upload de comprovativo (link UUID = bearer)
    admin/login/                 login (fora do layout do painel)
    admin/(painel)/              back-office: pedidos, produtos, stock, câmbios, definições
    actions/checkout.ts          criar pedido, upload de comprovativo
    actions/admin.ts             confirmação, entrega, CRUD, definições
  lib/
    supabase/{server,client,admin}.ts
    auth.ts        getStaff/requireStaff (allowlist na tabela `admins`)
    crypto.ts      AES-256-GCM
    rate-limit.ts  contador por IP em Postgres
    settings.ts    leitura das definições públicas
  proxy.ts         Next 16: substitui o middleware (refresh de sessão + guarda do /admin)
```

## Modelo de dados (resumo)

- `products(type, slug, price, config jsonb, active)` — `type` ∈ profile | fx | design | digital
- `inventory_items` — stock de perfis, com `secret_ciphertext`, `status`, `expires_at`, `warranty_until`
- `fx_rates(base, quote, buy, sell, active)`
- `customers(name, whatsapp, email)`
- `orders(code, status, payment_method, total, payload)` + `order_items`
- `payment_proofs(order_id, file_path, status)` — só para `payment_method = 'transfer'`
- `order_events` (auditoria) e `outbox` (fila de notificações, ainda sem worker)
- `settings(key, value jsonb, is_public)` — IBAN, contacto, morada
- `admins(email)` — allowlist do back-office

Estados: `pending_payment → confirmed → delivered`, mais `cancelled`. O comprovativo tem estado
próprio (`pending/accepted/rejected`); rejeitar devolve o pedido a `pending_payment`.

## Notificações

Sem worker: `outbox` é auditável e o admin recebe um link `wa.me` com o resumo. Se um dia houver
envio automático, é um cron/route handler que lê `outbox where sent_at is null` — não mudar o checkout.

## Dívida conhecida

- Os tipos em `src/types/database.ts` foram escritos à mão para espelhar o schema. Quando houver
  login na CLI, regenerar com `npx supabase gen types typescript --project-id xyeskykcvubxsdhzxmqn`.
- `cacheComponents` está desligado em `next.config.ts` (ver comentário no ficheiro).
- Credenciais decifradas aparecem no HTML do detalhe do pedido; se o back-office for partilhado,
  passar a revelar por acção explícita.
