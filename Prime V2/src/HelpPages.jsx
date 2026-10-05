import React from 'react';

const sections=[
 ['Fornecedor e produtos',[
  'Catálogo com 500 produtos organizado em dez categorias, de eletrônicos a automotivo',
  'Pesquisa por nome e filtros de categoria no Fornecedor e em Meus produtos',
  'Cadastre ou edite o link de afiliado de cada produto em uma janela própria',
  'Copie seus links salvos diretamente pelos cartões de Meus produtos'
 ]],
 ['Suas lojas',[
  'Crie uma loja selecionando vários produtos do catálogo',
  'Personalize o nome, o endereço, o logo e o banner da loja',
  'Escolha as cores primária e secundária para combinar com sua marca',
  'Encontre suas lojas pela pesquisa e abra cada uma pela página Lojas ou pela sidebar'
 ]],
 ['Oito modelos de loja',[
  'Essencial: banner amplo e uma grade direta de produtos',
  'Editorial: composição dividida e produtos com destaque visual',
  'Boutique: marca centralizada e uma apresentação com inspiração editorial',
  'Soft: cartões arredondados e uma composição mais suave',
  'Catálogo: pesquisa, filtros e uma apresentação compacta dos produtos',
  'Impacto: blocos marcantes e destaque para a cor da marca',
  'Galeria: banner panorâmico e uma vitrine centrada nas imagens',
  'Destaque: capa, logo e um produto em evidência',
  'Os modelos se adaptam a telas menores e usam as imagens escolhidas para a loja'
 ]],
 ['Vídeos e roteiros',[
  'Escolha um influenciador, selecione um produto e escreva a fala do vídeo',
  'Troque o influenciador ou o produto sem sair da tela do roteiro',
  'A fala tem um limite de 25 palavras, com contagem durante a edição',
  'O botão Gerar com IA oferece sugestões de roteiros prontos para o produto',
  'Gere o prompt e use a ação de abrir no Google Flow para baixar as imagens de referência'
 ]],
 ['Busca no Prime',[
  'Pesquise produtos do fornecedor, seus produtos, lojas e influenciadores em um único lugar',
  'Alterne entre os filtros com uma animação suave',
  'Abra a busca com o ícone da sidebar ou com Ctrl K e ⌘ K',
  'Os resultados levam diretamente à página ou à ação correspondente'
 ]],
 ['Interface e ajustes',[
  'Aparência clara e escura com cores consistentes em menus e janelas',
  'Alertas compactos no canto inferior direito',
  'Ajustes na navegação do submenu Ajuda para facilitar a passagem do mouse',
  'Comentários com motivo, descrição e até cinco anexos, salvos neste navegador',
  'Acesso às perguntas frequentes, à comunidade e à página de links compartilhados pelo menu Ajuda'
 ]]
];

export function ReleaseNotes(){
 return <section className="help-page release-page" aria-labelledby="release-title">
  <h1 id="release-title">Notas de lançamento</h1>
  <article className="release-entry">
   <time dateTime="2026-10-03">3 out 2026</time>
   <div className="release-content">
    <h2>Uma nova experiência no Prime</h2>
    <p className="release-intro">Conheça os recursos e os ajustes desta versão</p>
    {sections.map(([title,items])=><section className="release-section" key={title}><h3>{title}</h3><ul>{items.map(item=><li key={item}>{item}</li>)}</ul></section>)}
   </div>
  </article>
 </section>
}

export function SharedLinks(){
 return <section className="help-page shared-links-page" aria-labelledby="shared-links-title">
  <h1 id="shared-links-title">Links compartilhados</h1>
  <p className="shared-links-description">Seus links de produtos e lojas compartilhados ficam reunidos aqui</p>
  <div className="shared-links-empty"><p>Nada compartilhado ainda</p></div>
 </section>
}
