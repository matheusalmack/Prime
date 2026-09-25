# Prime

Aplicativo React/Vite com catálogo de produtos, links pessoais, autenticação e planos via Supabase e Applyfy.

Produção: https://prime-bay-seven.vercel.app

## Desenvolvimento

Requisitos: Node.js 24 e pnpm 11.19.0.

1. Copie `.env.example` para `.env` e configure a URL e a chave publicável do Supabase.
2. Execute `pnpm install --frozen-lockfile` e `pnpm dev`.
3. Execute `pnpm test` e `pnpm build` antes de publicar.

## Vercel

Importe este repositório e use a raiz do projeto. O arquivo `vercel.json` configura a compilação e as rotas do aplicativo.

Variáveis necessárias: `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
Opcionais: `VITE_INVITE_COUPON` (padrão AMIGO50) e `VITE_INVITE_URL` (padrão `/oferta#precos` no domínio atual).

Nunca use chaves administrativas ou tokens de webhook em variáveis `VITE_*`.

## Backend

Migrations e Edge Function estão em `supabase/`. O backend existente é publicado separadamente no Supabase, não durante o build da Vercel. Não reaplique seeds ou migrations em produção sem conferir o histórico.

A função `applyfy-webhook` usa os secrets `APPLYFY_MONTHLY_TOKEN` e `APPLYFY_LIFETIME_TOKEN`, configurados somente no Supabase. O Auth Hook Before User Created exige compra aprovada. A confirmação de e-mail está desativada por decisão do proprietário.

O domínio de produção já está configurado no Supabase e nos funis dos dois produtos Applyfy, com retorno para `/criar-conta`. Ao trocar para um domínio próprio, atualize essas três configurações.

Veja `docs/payment-activation.md` para estado da integração e validações realizadas.
