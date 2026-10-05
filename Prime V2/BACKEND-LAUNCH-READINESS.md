# Prime V2 — validação de lançamento, 5 de outubro de 2026

Produção ainda permanece no V1. A V2 foi enviada ao GitHub na branch `codex/prime-v2-launch` (commit `b66b391`) e a prévia da Vercel está pronta: https://prime-8nsiseolb-matheusalmack.vercel.app/. A prévia exige autenticação Vercel; o navegador do proprietário já consegue acessá-la.

## Dados e contas preservados

A V2 usa o mesmo projeto Supabase do V1. Depois das migrations novas, o banco continua com 4 usuários e 38 produtos salvos, sem seeds ou reinicialização. O catálogo mantém 500 produtos ativos e os IDs antigos. O proprietário tem 29 produtos salvos.

Login e cadastro manual usam Supabase Auth; cadastro exige compra aprovada e ativa no mesmo e-mail. Perfis, nomes, sobrenomes, data original, fotos privadas, produtos/links salvos, preferências, lojas por usuário e sessões usam o backend real. RLS limita os dados ao proprietário; vitrines públicas consultam apenas lojas publicadas com acesso ativo. Tokens de sessões encerradas seguem o prazo de validade do JWT; a V2 também consulta a existência da sessão ao carregar e periodicamente.

## Exclusão e novas compras

A função `prime-account` autentica o usuário no servidor, exige confirmação do e-mail e agenda a exclusão para após 30 dias. Encerra as sessões existentes; um novo login cancela o pedido por trigger em `auth.sessions`. Login e finalização bloqueiam a mesma linha de usuário para evitar remover uma conta cujo pedido foi cancelado. Fotos são enfileiradas para remoção pela Storage API após a transação.

`prime-maintenance` foi publicada e o agendamento a cada 10 minutos foi ativado. Usa uma chave privada no Vault ou autenticação administrativa server-side; não expõe a chave ao frontend. O proprietário aprovou a criação dessa credencial e a substituição da verificação de JWT legado pela validação interna das funções.

O webhook Applyfy hospedado foi atualizado para invocar a manutenção após persistir a aprovação; a trigger no banco conserva a fila para novas tentativas. A função rejeitou uma chamada com token inválido com 401. Nenhum pagamento fictício foi aprovado.

A fila de ativação considera apenas novas compras aprovadas, revalida o acesso antes do envio e preserva clientes existentes. Não substitui senhas, fotos, nomes ou IDs. Convites falhos ficam disponíveis para novas tentativas.

**SMTP foi adiado pelo proprietário.** SMTP personalizado está desligado. O cadastro manual pelo e-mail da compra continua disponível. Ativação automática por e-mail fica desativada até configurar SMTP e o segredo server-side `PRIME_AUTO_ACTIVATION_ENABLED=true`. Recuperação de senha para clientes depende do mesmo provedor. Esses fluxos de e-mail não estão validados para produção.

## Migrations e infraestrutura

Aplicadas pelo SQL Editor, com conferência das estruturas:

- `20261005060000_prime_v2_stores.sql`
- `20261005061000_prime_v2_sessions.sql`
- `20261005062000_prime_v2_avatars.sql`
- `20261005063000_prime_v2_analytics.sql`
- `20261005064000_prime_v2_account_lifecycle.sql`
- `20261005065000_prime_v2_maintenance_schedule.sql`

Conferir o histórico remoto antes de um `db push`; não reaplicar seeds ou migrations iniciais indiscriminadamente. Nenhuma exclusão foi solicitada ou executada em contas reais nesta validação.

A configuração raiz da Vercel prepara install/build/output para `Prime V2`, preservando rotas SPA e cabeçalhos existentes. `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` já existem para Production e Preview. O lockfile npm da V2 foi regenerado sem links locais; instalação limpa com `npm ci` foi validada.

## Cookies e interface

Aviso de cookies compartilhado em todas as páginas; escolhas persistem em cookie próprio e armazenamento local. Fechar ou rejeitar mantém somente essenciais; a escolha evita repetição por navegador. Análises opcionais coletam IP do gateway, navegador, aparelho e sessão somente com consentimento. A tabela tem RLS e bloqueia leitura anônima. Nenhum pixel de publicidade está conectado.

Carregamento compartilhado com logo central animada para autenticação, saída, catálogo e loja, respeitando movimento reduzido. O campo de e-mail permanece editável após falha de login. Erro compacto vermelho e contorno nos campos são limpos ao editar.

## Verificações concluídas e limites

- 32 testes do projeto principal e 13 da V2 aprovados: pagamento, renovação, reembolso, isolamento por conta, avatares privados, sessões, lojas, cookies, rotas, exclusão adiada e ativação.
- Build da V2 após instalação limpa aprovado, inclusive no servidor Vercel (Ready, build em 11,92 s). Permanece aviso de bundle grande. FAQ e login carregam pelas rotas diretas no navegador autenticado na Vercel; respostas HTTP da prévia protegida não foram contadas como teste de rota porque levam ao login da Vercel.
- APIs hospedadas de conta/manutenção rejeitam chamadas sem autenticação com 401; a RPC de finalização não aceita acesso anônimo.
- Agendamento e chamada manual com filas vazias retornaram HTTP 200, sem timeout, com zero falhas, exclusões, remoções ou ativações. Ativação por e-mail permanece desligada.
- Site URL Auth atualizado para `https://primeafiliado.com`; recuperação permite os destinos exatos `/recuperar-senha` no domínio principal e www, preservando destinos anteriores.
- Banco preserva as 4 contas e 38 produtos salvos; nenhuma solicitação de exclusão ou ativação foi criada na validação.

Ainda concluir antes de afirmar que todos os fluxos foram comprovados:

- Login visual do proprietário, conferência dos 29 produtos e perfil, e validação de escrita/persistência em dados autorizados.
- Fluxo de compra completo no Applyfy e recebimento do evento hospedado. Testes de contrato e banco não comprovam uma transação real.
- SMTP/ativação e recuperação por e-mail, adiados pelo proprietário.
- Conexão Shopee da V2 permanece explicitamente em demonstração; não é uma autenticação real Shopee.
