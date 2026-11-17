# Vendaz

Loja de serviços digitais (Angola, AOA): perfis de streaming, câmbio manual, design e infoprodutos.
Checkout sem login; back-office autenticado.

## Arranque

```bash
pnpm install
cp .env.example .env.local   # preenche os valores
pnpm dev
```

`.env.local` precisa de:

| Variável | Onde |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | mesma página (publishable key) |
| `SUPABASE_SERVICE_ROLE_KEY` | mesma página (secret key) — **só servidor** |
| `SECRETS_ENC_KEY` | `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` em dev |

## Base de dados

Migrations em `supabase/migrations`, aplicadas neste projecto (`xyeskykcvubxsdhzxmqn`).

```bash
npx supabase login                       # necessário para db push / gen types
npx supabase link --project-ref xyeskykcvubxsdhzxmqn
npx supabase db push
npx supabase gen types typescript --project-ref xyeskykcvubxsdhzxmqn --schema public > src/types/database.ts
```

## Criar o primeiro admin

1. Supabase → Authentication → Users → **Add user** (email + password).
2. Autoriza o email na allowlist:

```sql
insert into public.admins (email, name) values ('equipa@exemplo.com', 'Equipa');
```

3. Entra em `/admin/login`.

Sem linha em `admins`, o login funciona mas o back-office devolve acesso negado (as policies
de RLS usam `private.is_staff()`).

## Configuração da loja

Em `/admin/definicoes` estão dois blocos JSON públicos: `store` (nome, WhatsApp, morada, horário)
e `payment` (IBAN, titular, instruções de transferência e de pagamento presencial). Preenche antes
de divulgar o site — o checkout mostra estes valores ao cliente.

## Fluxo do pedido

```
pending_payment → confirmed → delivered
       ↘ cancelled
```

- **Transferência**: o cliente envia o comprovativo na página do pedido (bucket privado, signed URL
  só no admin). O admin confirma ou rejeita com motivo.
- **Dinheiro**: o admin confirma no acto da entrega.
- **Entrega de perfis**: o botão "Marcar como entregue" atribui itens de `inventory_items`
  e grava validade + garantia no item.

## Deploy (Vercel)

```bash
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add SECRETS_ENC_KEY
vercel env add NEXT_PUBLIC_SITE_URL
vercel --prod
```

## Segurança

- `anon` só lê catálogo, câmbios e definições públicas. Nenhuma escrita anónima.
- Checkout e uploads passam por Server Actions com service role, zod e rate limit por IP.
- Credenciais de perfis cifradas com AES-256-GCM e decifradas apenas no detalhe do pedido.
- Bucket `proofs` privado, sem policy de escrita (uploads só pelo servidor).

Corre os advisors depois de cada migration:

```
Supabase → Advisors → Security
```
