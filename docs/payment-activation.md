# Prime: ativação por compra

## Estado

Atualizado em 23/09/2026: backend publicado no Supabase. Before User Created ativo, confirmação de e-mail desligada por decisão do proprietário. Criados na Applyfy os webhooks Prime - Mensal e Prime - Lifetime, cada um restrito ao produto correspondente. Tokens salvos nos secrets do Supabase; nenhum token armazenado neste documento ou no frontend.

- Mensal: cmuemx8py1euz01pye442iutv, produto cmucrf9v301z201q19b4j4dif.
- Vitalício: cmuemxuoi1c8501q1lguv8fp2, produto cmucrkrst01us01oog9d3ikwa.
- Tipo Padrão; eventos TRANSACTION_CREATED, TRANSACTION_PAID, TRANSACTION_CANCELED, TRANSACTION_REFUNDED e TRANSACTION_CHARGED_BACK.
- Endpoints: https://ikgilxwdllxyjmufvtqh.supabase.co/functions/v1/applyfy-webhook?plan=monthly e ?plan=lifetime.

Frontend publicado em 24/09/2026: https://prime-bay-seven.vercel.app.
Repositório: https://github.com/matheusalmack/Prime. Projeto Vercel: https://vercel.com/matheusalmack/prime.

- Vercel com variáveis públicas do Supabase configuradas, build Vite e rotas SPA.
- Supabase Site URL atualizado para o domínio publicado e redirect de produção autorizado.
- Funis dos produtos mensal e vitalício salvos com etapa inicial conectada à página final externa https://prime-bay-seven.vercel.app/criar-conta, para todas as ofertas de cada produto.
- Página de vendas dos dois produtos atualizada para o domínio publicado.
- Cadastro publicado carregou corretamente; cupom AMIGO50 alterou preços e os dois checkouts no navegador.
- Páginas públicas, rotas de acesso e favicon responderam HTTP 200. Doze testes locais e build passaram antes do deploy.

## Fluxo implementado

1. Pagamento aprovado registra uma compra vinculada ao e-mail e à oferta. Não cria senha nem envia dados do proprietário para o comprador.
2. Em Criar conta, o e-mail é verificado antes da etapa de senha. O Auth Hook precisa estar ativo para também impedir cadastro direto pela API sem compra válida.
3. Cadastro cria usuário, perfil com nome/sobrenome e preferências próprias. Meus produtos começa vazio. Catálogo público é compartilhado.
4. Confirmação de e-mail permanece desativada por escolha explícita do proprietário, verificada no painel hospedado. A elegibilidade verifica a compra; esse fluxo não comprova a posse do e-mail informado.
5. Mensal dura 30 dias a partir do pagamento (ou período explícito validado do gateway). Renovação estende acesso; cancelamento mantém tempo já pago; estorno/chargeback retiram o pagamento do cálculo. Vitalício não expira.
6. RLS bloqueia dados privados após expiração mesmo com token válido. Frontend verifica expiração e encerra acesso visual.

## Ofertas

| Código | Plano |
| --- | --- |
| X1XE2DU | Mensal normal |
| 2E2RG39 | Mensal com desconto |
| ENMG0W8 | Vitalício normal |
| L83RFTI | Vitalício com desconto |

## Pendências para produção

- Testar primeira compra real ou sandbox autorizado do checkout até ativação da conta, incluindo renovação recorrente. Nenhum pagamento real foi efetuado pelo agente.
- Confirmar presença de offerCode nas renovações reais. Eventos sem oferta reconhecida são rejeitados, sem liberar acesso indevido.

## Contrato oficial confirmado

Documentação: https://app.applyfy.com.br/docs/v1/webhooks/payment e https://app.applyfy.com.br/docs/v1/webhooks.

Autenticação por payload.token, separado por plano; não HMAC. Campos: event, offerCode, client.email, transaction.id, transaction.status e transaction.payedAt. Aprovação exige TRANSACTION_PAID, COMPLETED e data válida. Identidade deduplicada por transaction.id + event. Não guardar token nem dados financeiros desnecessários no histórico. Novas cobranças devem ter IDs de transação próprios.

## Validação local

`pnpm test:payments`: oito testes com PostgreSQL via PGlite cobrem ofertas/status, compra antes do cadastro, conta vazia, expiração, lifetime, duplicação, renovação, estorno e RLS. Não substituem teste real da Applyfy, do Auth hospedado ou SMTP.

`pnpm build` e typecheck do login executados com sucesso.

## Validação hospedada

- Cadastro sem compra: HTTP 403, nenhum usuário criado.
- Token inválido: HTTP 401 nos dois planos.
- Teste enviado pelo painel Applyfy alcançou a função e passou autenticação, mas a massa fictícia recebeu HTTP 422 na validação dos campos. Não se trata de teste de compra aprovado.
- Eventos controlados no formato oficial com ofertas Prime e os tokens configurados: HTTP 200 em ambos os planos.
- Conferência SQL: mensal aprovado com exatamente 30 dias; vitalício aprovado sem vencimento; ambos elegíveis para ativação e sem usuários criados automaticamente.
- Todos os registros fictícios desses dois eventos foram removidos com filtros exatos de IDs. Consulta final retornou zero compras de teste restantes.
- Oito testes locais e build passaram. Teste de checkout real e criação de conta completa ainda não realizados.
