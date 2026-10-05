import React from 'react';
import {ChevronDown} from 'lucide-react';
const sections=[
 ['Começando no Prime',[
 ['O que é o Prime?','O Prime reúne ferramentas para afiliados: catálogo de produtos, organização de links, lojas, preparação de vídeos e materiais de divulgação.'],
 ['Preciso instalar um aplicativo?','Não. Você pode acessar pelo navegador do computador, tablet ou celular.'],
 ['Preciso ter estoque ou fazer entregas?','Não para trabalhar como afiliado. O vendedor e a plataforma da oferta cuidam da compra e da entrega, conforme suas próprias condições.'],
 ['O Prime garante vendas ou comissões?','Não. Os resultados dependem das ofertas, do público e da sua divulgação. As regras de comissão são definidas pelo programa de afiliados.']]],
 ['Planos e pagamentos',[
 ['Qual é a diferença entre SuperPrime e SuperPrime Heavy?','O SuperPrime é a assinatura mensal de R$ 169 por mês. O SuperPrime Heavy é o acesso vitalício de R$ 299 à vista. Confira os recursos e as condições na página de planos antes da compra.'],
 ['Posso parcelar o plano vitalício?','A opção apresentada é 12 parcelas de R$ 32, totalizando R$ 384, ou R$ 299 à vista. Confira os valores e meios de pagamento no checkout antes de confirmar.'],
 ['O plano mensal tem renovação?','Sim, é uma assinatura mensal. Confira a recorrência, a próxima cobrança e as condições de cancelamento no checkout e no comprovante da compra.'],
 ['Como cancelo a assinatura mensal?','Use o canal de gerenciamento da assinatura indicado no e-mail ou comprovante da compra. Cancelar a renovação e solicitar reembolso são pedidos diferentes.'],
 ['O Prime recebe meus dados de cartão?','Os dados de pagamento são preenchidos no checkout externo. O Prime não recebe os dados completos do seu cartão por esses links.']]],
 ['Reembolso',[
 ['Tenho sete dias para pedir reembolso?',<>Sim. Para contratações pela internet, o direito de arrependimento prevê sete dias a partir da contratação ou do recebimento do serviço, conforme o caso. Você pode desistir nesse prazo sem precisar justificar. Veja o <a href="https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm" target="_blank" rel="noopener noreferrer">artigo 49 do Código de Defesa do Consumidor</a>.</>],
 ['Como solicito o reembolso?','Solicite pelo canal de atendimento indicado no e-mail ou comprovante da compra, dentro do prazo. Informe o e-mail usado na compra e o número do pedido, e guarde o protocolo. Não envie sua senha ou os dados completos do cartão.'],
 ['Quando o valor aparece na minha conta?','O direito de arrependimento prevê a devolução dos valores pagos. O momento em que o estorno fica visível depende do meio de pagamento, do processador e, para cartão, do fechamento da fatura. Consulte o atendimento da compra para acompanhar seu pedido.'],
 ['Excluir minha conta cancela a cobrança?','Não trate a exclusão da conta como cancelamento da assinatura. Solicite o cancelamento ou reembolso pelo canal da compra para confirmar que o pedido foi registrado.']]],
 ['Produtos e divulgação',[
 ['O fornecedor está incluído?','O catálogo está incluído no Prime. Consulte as ofertas e confira preço, estoque, entrega e condições na página do vendedor antes de divulgar.'],
 ['Como consigo meu link de afiliado?','No fornecedor, abra “Obter link”, siga as instruções do conversor do programa de afiliados e salve seu link no Prime. É necessário estar cadastrado no programa para usar links elegíveis a comissão.'],
 ['Quem paga as minhas comissões?','O programa de afiliados em que você está cadastrado. O Prime ajuda a organizar a divulgação; ele não apura nem paga as comissões dos pedidos.'],
 ['O Prime gera o vídeo final?','A área de criação de vídeos prepara prompts, roteiros e imagens. A produção do vídeo final acontece na ferramenta externa que você escolher, conforme as regras e custos dessa ferramenta.'],
 ['Os grupos do Facebook são comunidades do Prime?','Não. O recurso usa palavras-chave para abrir a busca de grupos no Facebook. Verifique as regras de cada comunidade antes de entrar ou publicar ofertas.'],
 ['Para que servem os templates e stories?','Eles ajudam a preparar peças de divulgação com os seus produtos. Revise os textos, preços e links antes de compartilhar nas redes sociais.']]],
 ['Lojas, conta e acesso',[
 ['Como crio uma loja?','Abra Lojas, clique em “Criar loja”, selecione os produtos e personalize o modelo, as cores e as informações. Confira a prévia antes de concluir.'],
 ['A conexão da Shopee acessa minha conta de afiliado?','Nesta versão, o botão salva uma preferência local de conexão. A autenticação oficial com a Shopee ainda não está integrada e não há acesso à sua conta de afiliado.'],
 ['Onde meus dados ficam salvos?','Na versão atual, várias preferências, links e lojas ficam no armazenamento deste navegador. Apagar os dados do navegador ou trocar de dispositivo pode fazer com que essas informações deixem de aparecer.'],
 ['Onde vejo se os serviços estão funcionando?','Abra Gerenciar conta e selecione Status do serviço. Os recursos com verificação disponível mostram a situação medida; os demais indicam quando não há informação de monitoramento.'],
 ['Não consigo entrar ou criar uma conta. O que faço?','Entre com o e-mail e a senha da sua conta Prime. Para criar uma conta, use o mesmo e-mail informado na compra aprovada. Se já tem uma conta, seus dados e produtos salvos continuam disponíveis. Para dificuldades de acesso, procure o suporte.'],
 ['Como protejo minha conta e meus links?','Não compartilhe senhas ou códigos de acesso. Verifique o endereço dos sites de pagamento e afiliados e revise os links antes de publicar.']]]
];
export default function FaqContent(){return <div className="faq-page-content"><header><h1>Perguntas frequentes</h1><p>Respostas sobre o Prime, seus planos e sua rotina de afiliado.</p></header>{sections.map(([title,items])=><section className="landing-faq faq-category" key={title}><h2>{title}</h2><div>{items.map(([q,a])=><details key={q}><summary>{q}<ChevronDown size={16}/></summary><p>{a}</p></details>)}</div></section>)}</div>}
