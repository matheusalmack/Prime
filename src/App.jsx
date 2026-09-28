import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { getProductCampaign, buildProductCaption, buildVideoPrompt, getFacebookGroupTerms } from './utils/campaigns';
import { HugeiconsIcon } from '@hugeicons/react';
import productsPart1 from './shopeeProductsPart1';
import productsPart2 from './shopeeProductsPart2';
import productsPart3 from './shopeeProductsPart3';
import productsPart4 from './shopeeProductsPart4';
import productsPart5 from './shopeeProductsPart5';
import DateRangePicker, { createTodayRange } from './components/DateRangePicker';
import useDialogFocus from './hooks/useDialogFocus';
import { supabase } from './utils/supabase';
import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  CoinsDollarIcon,
  DashboardSquare01Icon,
  Copy01Icon,
  Download01Icon,
  GiftIcon,
  GithubIcon,
  ImagePlayIcon,
  InformationCircleIcon,
  InstagramIcon,
  Linkedin02Icon,
  Logout02Icon,
  HelpCircleIcon,
  Menu01Icon,
  NewTwitterIcon,
  PanelLeftIcon,
  PanelRightIcon,
  Search01Icon,
  SecurityLockIcon,
  Settings01Icon,
  ShoppingBag01Icon,
  ShoppingBag03Icon,
  TextIcon,
  Timer02Icon,
  Tick02Icon,
  UserCircleIcon,
  UserGroupIcon,
  UserMultipleIcon,
  Video01Icon,
  PaintBrush01Icon,
} from '@hugeicons/core-free-icons';

const LoginFrontend = React.lazy(() => import('../login-frontend/src/App.tsx'));

const APP_LOGO_URL = 'https://ikgilxwdllxyjmufvtqh.supabase.co/storage/v1/object/public/logo/universal.png';
function AppLogo({ className = '' }) {
  return <span className={`app-logo ${className}`}><img src={APP_LOGO_URL} alt="Prime" /></span>;
}

const sidebarItems = [
  { label: 'Criar novo anúncio', icon: Add01Icon, path: '/novo' },
  { label: 'Produtos', icon: ShoppingBag01Icon, path: '/produtos' },
  { label: 'Meus produtos', icon: ShoppingBag03Icon, path: '/meus-produtos' },
];

const defaultPath = '/';
const offerPath = '/oferta';
const PROMOTION_COUPON = (import.meta.env.VITE_INVITE_COUPON?.trim() || 'AMIGO50').toUpperCase();
const authPaths = ['/entrar', '/criar-conta'];
const internalPaths = sidebarItems.map((item) => item.path);
const legacyPaths = {
  '/divulgar': '/novo',
  '/divulgar-produto': '/novo',
  '/painel': '/produtos',
  '/painel-de-controle': '/produtos',
};
const sidebarPreferenceKey = 'workspace-sidebar-collapsed';
const PRODUCTS_PER_PAGE = 20;

function getValidPath(pathname) {
  if (pathname === defaultPath || pathname === offerPath) return pathname;
  if (legacyPaths[pathname]) return legacyPaths[pathname];
  if (authPaths.includes(pathname)) return pathname;
  return internalPaths.includes(pathname) ? pathname : defaultPath;
}

function isInternalPath(pathname) {
  return internalPaths.includes(pathname);
}

function Icon({ icon, size = 20, strokeWidth = 1.8 }) {
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      strokeWidth={strokeWidth}
      color="currentColor"
      aria-hidden="true"
    />
  );
}

const metrics = [
  { label: 'Cliques', value: '—' },
  { label: 'Pedido', value: '—' },
  { label: 'Comissão est. (R$)', value: '—' },
  { label: 'Itens vendidos', value: '—' },
  { label: 'Valor do pedido (R$)', value: '—' },
  { label: 'Novos compradores', value: '—' },
];

const productCategories = [
  'Todos',
  'Eletrônicos',
  'Casa e construção',
  'Beleza',
  'Roupas femininas',
  'Moda infantil',
  'Mãe e bebê',
  'Roupa masculina',
  'Fitness',
  'Pets',
  'Automotivo',
];

// Catálogo real recuperado dos datasets parciais salvos pela Apify.
// A fonte pública não fornece comissão nem vendas para todos os itens;
// esses campos continuam nulos até a integração com a Affiliate Open API.
const productOffers = [
  ...productsPart1,
  ...productsPart2,
  ...productsPart3,
  ...productsPart4,
  ...productsPart5,
];

function formatPrice(priceCents, currency = 'BRL') {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format((priceCents ?? 0) / 100);
}

function mapDatabaseProduct(product) {
  return {
    id: product.id,
    itemId: product.item_id,
    shopId: product.shop_id,
    name: product.name,
    category: product.category,
    image: product.image_url || product.source_image_url,
    url: product.source_url,
    price: formatPrice(product.price_cents, product.currency),
    currency: product.currency,
    commission: product.commission_rate == null ? null : `${product.commission_rate}%`,
    sales: product.sales_count == null ? null : `${product.sales_count.toLocaleString('pt-BR')} vendas`,
  };
}

const influencerProfiles = [
  { id: 1, name: 'Caio — Lifestyle cotidiano', tone: 'natural, próximo e espontâneo', image: '/assets/influencers/ugc-man-01.jpg' },
  { id: 2, name: 'Davi — Reviews práticos', tone: 'confiante, simpático e objetivo', image: '/assets/influencers/ugc-man-02.jpg' },
  { id: 3, name: 'Marcelo — Especialista', tone: 'didático, experiente e detalhista', image: '/assets/influencers/ugc-man-03.jpg' },
  { id: 4, name: 'Kenji — Tecnologia e rotina', tone: 'direto, curioso e contemporâneo', image: '/assets/influencers/ugc-man-04.jpg' },
  { id: 5, name: 'André — Casa e bem-estar', tone: 'caloroso, positivo e confiável', image: '/assets/influencers/ugc-man-05.jpg' },
  { id: 6, name: 'Lucas — Humor cotidiano', tone: 'leve, bem-humorado e espontâneo', image: '/assets/influencers/ugc-man-06.jpg' },
  { id: 7, name: 'Paulo — Família e utilidades', tone: 'acolhedor, experiente e útil', image: '/assets/influencers/ugc-man-07.jpg' },
  { id: 8, name: 'Gabriel — Achadinhos', tone: 'casual, entusiasmado e convincente', image: '/assets/influencers/ugc-man-08.jpg' },
  { id: 9, name: 'Bruno — Fitness e aventura', tone: 'energético, motivador e informal', image: '/assets/influencers/ugc-man-09.jpg' },
  { id: 10, name: 'Renato — Empreendedor', tone: 'seguro, estratégico e inspirador', image: '/assets/influencers/ugc-man-10.jpg' },
  { id: 11, name: 'Aline — Beleza autêntica', tone: 'alegre, próxima e espontânea', image: '/assets/influencers/ugc-woman-01.jpg' },
  { id: 12, name: 'Camila — Casa prática', tone: 'natural, acolhedora e útil', image: '/assets/influencers/ugc-woman-02.jpg' },
  { id: 13, name: 'Laura — Especialista em beleza', tone: 'elegante, confiante e detalhista', image: '/assets/influencers/ugc-woman-03.jpg' },
  { id: 14, name: 'Marina — Moda acessível', tone: 'estilosa, amigável e prática', image: '/assets/influencers/ugc-woman-04.jpg' },
  { id: 15, name: 'Jéssica — Criadora UGC', tone: 'casual, direta e com linguagem de rede social', image: '/assets/influencers/ugc-woman-05.jpg' },
  { id: 16, name: 'Bianca — Cozinha e rotina', tone: 'calorosa, didática e espontânea', image: '/assets/influencers/ugc-woman-06.jpg' },
  { id: 17, name: 'Helena — Bem-estar', tone: 'serena, positiva e confiável', image: '/assets/influencers/ugc-woman-07.jpg' },
  { id: 18, name: 'Lívia — Tendências e ofertas', tone: 'jovem, dinâmica e convincente', image: '/assets/influencers/ugc-woman-08.jpg' },
  { id: 19, name: 'Patrícia — Mãe prática', tone: 'afetiva, realista e acolhedora', image: '/assets/influencers/ugc-woman-09.jpg' },
  { id: 20, name: 'Sofia — Lifestyle autêntico', tone: 'leve, próxima e espontânea', image: '/assets/influencers/ugc-woman-10.jpg' },
];

const facebookGroupIdeas = {
  'Casa e construção': ['Organização e decoração da casa', 'Achadinhos para casa', 'Cozinha prática e organizada', 'Ofertas para o lar', 'Decoração com economia', 'Casa limpa e funcional', 'Utilidades domésticas', 'Reforma e construção', 'Dicas para apartamentos', 'Produtos indispensáveis para casa'],
  'Melhor performance': ['Corrida e vida saudável', 'Treino em casa', 'Ofertas fitness', 'Esporte e performance', 'Academia e musculação', 'Vida saudável todos os dias', 'Acessórios esportivos', 'Corredores do Brasil', 'Dicas de treino e saúde', 'Achadinhos para atletas'],
  'Roupas femininas': ['Moda feminina e tendências', 'Looks acessíveis', 'Achadinhos de moda', 'Promoções femininas', 'Moda feminina online', 'Looks do dia', 'Roupas e acessórios femininos', 'Estilo com economia', 'Dicas de moda feminina', 'Brechó e moda consciente'],
  'Comissão da marca': ['Ofertas das melhores marcas', 'Achadinhos da internet', 'Cupons e promoções', 'Produtos mais vendidos', 'Descontos de marcas', 'Ofertas verificadas', 'Promoções do dia', 'Compras inteligentes', 'Achadinhos com desconto', 'Recomendações de produtos'],
  Beleza: ['Dicas de beleza', 'Maquiagem e cuidados pessoais', 'Perfumes e cosméticos', 'Achadinhos de beleza', 'Skincare e autocuidado', 'Beleza com economia', 'Maquiagem para iniciantes', 'Cuidados com a pele', 'Ofertas de cosméticos', 'Resenhas de produtos de beleza'],
  'Mãe e bebê': ['Mães e bebês', 'Dicas de maternidade', 'Enxoval e ofertas', 'Família e cuidados infantis', 'Mães que economizam', 'Produtos para bebês', 'Gestantes e mamães', 'Rotina com crianças', 'Achadinhos de maternidade', 'Cuidados com o recém-nascido'],
  'Moda infantil': ['Moda infantil', 'Achadinhos para crianças', 'Mães que economizam', 'Ofertas infantis', 'Roupas para crianças', 'Looks infantis', 'Moda bebê e infantil', 'Promoções para os pequenos', 'Desapego infantil', 'Compras infantis com economia'],
};

const fallbackFacebookGroups = ['Achadinhos da internet', 'Cupons e promoções', 'Produtos recomendados', 'Ofertas online', 'Compras inteligentes', 'Promoções do dia', 'Produtos mais vendidos', 'Descontos e oportunidades', 'Recomendações de compras', 'Achados com bom custo-benefício'];

const creatorBrands = [
  {
    name: 'O Boticário',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/d/de/Logotipo_do_O_Botic%C3%A1rio.svg',
  },
  {
    name: 'iFood',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/9/90/IFood_logo.svg',
  },
  {
    name: 'Nubank',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f7/Nubank_logo_2021.svg',
  },
  {
    name: 'Mercado Livre',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/1/16/Mercado_Livre_wordmark_%28Portuguese_version%29.svg',
  },
  {
    name: 'Shopee',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fe/Shopee.svg',
  },
  {
    name: 'Natura',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/7/75/Natura_logo.svg',
  },
  {
    name: 'Magazine Luiza',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/0/00/Magazine_Luiza_%282019%29.svg',
  },
  {
    name: 'Samsung',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/9/9c/Samsung_logo_wordmark.svg',
  },
];

function SalesPage({ onNavigate, products = productOffers, promotionApplied = false }) {
  const [discountApplied, setDiscountApplied] = useState(promotionApplied);
  const [couponInput, setCouponInput] = useState(promotionApplied ? PROMOTION_COUPON : '');
  const [couponError, setCouponError] = useState('');

  function applyCoupon(event) {
    event.preventDefault();
    if (couponInput.trim().toUpperCase() !== PROMOTION_COUPON) {
      setCouponError('Cupom inválido. Confira o código e tente novamente.');
      return;
    }
    setDiscountApplied(true);
    setCouponInput(PROMOTION_COUPON);
    setCouponError('');
  }

  const previewProducts = products.length ? products.slice(0, 8) : productOffers.slice(0, 8);

  const catalogPreviewProducts = [23, 37, 52, 68, 81, 96].map((index) => productOffers[index]).filter(Boolean);

  function openApp(event, path) {
    event.preventDefault();
    onNavigate(path);
  }

  return (
    <div className="sales-page">
      <header className="sales-nav">
        <AppLogo className="sales-logo" />

        <nav aria-label="Navegação da página de vendas">
          <a href="#produto">Catálogo</a>
          <a href="#como-funciona">Como funciona</a>
          <a href="#precos">Preços</a>
        </nav>

        <div className="sales-nav-actions">
          <a href="/entrar" onClick={(event) => openApp(event, '/entrar')}>Entrar</a>
          <a className="sales-nav-primary" href="/novo" onClick={(event) => openApp(event, '/novo')}>Começar agora</a>
        </div>
      </header>

      <main className="sales-hero" id="produto">
        <div className="sales-hero-copy">
          <h1><span>Os produtos que mais vendem hoje,</span>{' '}<span>em um só catálogo completo</span></h1>
          <p>
            <span>Produtos virais e campeões de vendas para se afiliar e vender com confiança.</span>{' '}
            <span>Estoque disponível e entrega na casa do cliente, em um só catálogo.</span>
          </p>

          <div className="sales-hero-actions">
            <a href="/produtos" onClick={(event) => openApp(event, '/produtos')}>
              Explorar catálogo
            </a>
            <a href="#precos">Ver planos</a>
          </div>

        </div>

        <div className="sales-visual" id="como-funciona" aria-label="Prévia da plataforma">
          <svg className="sales-flow-lines" viewBox="0 0 760 620" aria-hidden="true">
            {Array.from({ length: 9 }, (_, index) => (
              <path
                key={index}
                d="M -120 700 C 120 250, 410 520, 860 -80"
                transform={`translate(0 ${index * 18 - 72})`}
              />
            ))}
          </svg>

          <div className="sales-app-preview">
            <aside>
              <div className="preview-sidebar-head">
                <AppLogo className="preview-logo" />
                <div>
                  <span><Icon icon={PanelRightIcon} size={13} /></span>
                </div>
              </div>
              <div className="preview-nav"><Icon icon={Add01Icon} size={14} /> Criar novo anúncio</div>
              <div className="preview-nav active"><Icon icon={ShoppingBag01Icon} size={14} /> Produtos</div>
              <div className="preview-nav"><Icon icon={ShoppingBag03Icon} size={14} /> Meus produtos</div>

            </aside>

            <section className="preview-catalog-page">
              <div className="preview-catalog-heading">
                <h2>Produtos</h2>
                <div className="preview-search">
                  <Icon icon={Search01Icon} size={12} />
                  <span>Buscar por todos os produtos</span>
                  <button type="button" tabIndex={-1}>Pesquisar</button>
                </div>
              </div>

              <nav className="preview-category-tabs" aria-label="Categorias de produtos">
                {productCategories.map((category, index) => (
                  <span className={index === 0 ? 'active' : ''} key={category}>{category}</span>
                ))}
              </nav>

              <div className="preview-product-grid">
                {previewProducts.map((product) => (
                  <article className="preview-product-card" key={product.id}>
                    <div className="preview-product-image"><img src={product.image} alt="" /></div>
                    <div className="preview-product-body">
                      <h3>{product.name}</h3>
                      <div><strong>{product.price}</strong>{product.sales ? <span>{product.sales}</span> : null}</div>
                      {product.commission ? <p>Taxa de comissão {product.commission}</p> : null}
                      <button type="button" tabIndex={-1}>Obter link</button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      <section className="sales-community" id="comunidade" aria-labelledby="community-title">
        <div className="sales-community-copy">
          <h2 id="community-title">Feito para afiliados de todos os nichos</h2>
        </div>

        <div className="sales-brand-grid" aria-label="Empresas presentes na plataforma">
          {creatorBrands.map((brand) => (
            <div className="sales-brand-tile" key={brand.name}>
              <img src={brand.logo} alt={brand.name} />
            </div>
          ))}
        </div>
      </section>

      <section className="sales-features" aria-labelledby="features-title">
        <header className="sales-features-head">
          <h2 id="features-title">Tudo começa com o produto certo. <strong>Encontre o seu no catálogo Prime.</strong></h2>
        </header>

        <div className="sales-feature-grid">
          <article className="sales-feature-card">
            <div className="sales-feature-visual product-discovery-visual" aria-hidden="true">
              <span>Beleza</span>
              <span>Casa</span>
              <span>Fitness</span>
              <span>Moda</span>
              <div><Icon icon={Search01Icon} size={28} /></div>
            </div>
            <div className="sales-feature-copy">
              <h3>Um fornecedor de boas oportunidades</h3>
              <p>Produtos virais e entre os mais vendidos em diferentes nichos, reunidos para você escolher, se afiliar e vender com confiança.</p>
            </div>
          </article>

          <article className="sales-feature-card">
            <div className="sales-feature-visual unified-flow-visual" aria-hidden="true">
              {[
                [ShoppingBag01Icon, 'Escolher produto'],
                [Video01Icon, 'Criar vídeo'],
                [TextIcon, 'Gerar legenda'],
                [UserGroupIcon, 'Encontrar grupos'],
              ].map(([icon, label]) => (
                <div key={label}>
                  <Icon icon={icon} size={16} />
                  <span>{label}</span>
                  <Icon icon={Tick02Icon} size={14} />
                </div>
              ))}
            </div>
            <div className="sales-feature-copy">
              <h3>Criação em um só fluxo</h3>
              <p>Produto, vídeo, prompt e legenda organizados em um processo claro, do início ao fim.</p>
            </div>
          </article>

          <article className="sales-feature-card">
            <div className="sales-feature-visual performance-visual" aria-hidden="true">
              <div className="performance-heading"><span>Alcance estimado</span><strong>248 mil</strong></div>
              <svg viewBox="0 0 320 130">
                <polyline points="0,105 34,92 65,100 98,70 132,80 168,48 204,62 240,28 276,38 320,10" />
              </svg>
              <div className="performance-stats"><span>10 grupos</span><span>4 conteúdos</span><span>1 campanha</span></div>
            </div>
            <div className="sales-feature-copy">
              <h3>Divulgação direcionada</h3>
              <p>Encontre comunidades do nicho e leve cada conteúdo até as pessoas certas.</p>
            </div>
          </article>
        </div>
      </section>

      <section className="sales-automation" aria-labelledby="automation-title">
        <header className="sales-automation-head">
          <h2 id="automation-title">Tecnologia e IA para transformar produtos em campanhas prontas</h2>
          <p>Crie vídeos, legendas e materiais de divulgação em um único fluxo para focar no que realmente vende</p>
        </header>

        <div className="sales-automation-grid">
          <article className="automation-card automation-primary">
            <div className="automation-primary-visual catalog-showcase">
              <svg className="automation-wave" viewBox="0 0 900 360" preserveAspectRatio="none" aria-hidden="true">
                {Array.from({ length: 9 }, (_, index) => (
                  <path
                    key={index}
                    d={`M -50 ${86 + index * 8} C 170 ${178 + index * 5}, 350 ${300 + index * 2}, 565 ${252 + index * 3} C 715 ${220 + index * 2}, 780 ${125 + index * 5}, 950 ${150 + index * 4}`}
                  />
                ))}
              </svg>
              <div className="catalog-showcase-grid" aria-hidden="true" inert>
                {catalogPreviewProducts.map((product) => (
                  <article className="catalog-showcase-product" key={product.id}>
                    <img src={product.image} alt={product.name} loading="lazy" />
                    <div>
                      <h4>{product.name}</h4>
                      <strong>{product.price}</strong>
                      <span className="catalog-showcase-action">Obter link</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <div className="automation-copy automation-primary-copy">
              <h3>Catálogo de produtos</h3>
              <p>Encontre produtos virais e campeões de vendas para se afiliar e vender com confiança, com estoque disponível e entrega na casa do cliente. Escolha seu próximo sucesso no catálogo.</p>
            </div>
          </article>

          <article className="automation-card automation-side">
            <div className="automation-mini-visual prompt-visual" aria-hidden="true">
              {['Mostre o produto em uso', 'Destaque o principal benefício', 'Finalize com uma chamada clara'].map((label, index) => (
                <div key={label}>
                  <span>{index + 1}</span>
                  <i><b>{label}</b><em /></i>
                </div>
              ))}
            </div>
            <div className="automation-copy">
              <h3>Prompts inteligentes</h3>
              <p>Receba uma direção de cena completa, já adaptada ao produto e ao perfil escolhido.</p>
            </div>
          </article>

          <article className="automation-card automation-side">
            <div className="automation-mini-visual caption-visual" aria-hidden="true">
              <div>
                <Icon icon={TextIcon} size={17} />
                <strong>Legenda pronta para publicar</strong>
                <span />
                <span />
                <button type="button">Copiar</button>
              </div>
            </div>
            <div className="automation-copy">
              <h3>Legendas prontas</h3>
              <p>Transforme os benefícios do produto em uma mensagem direta, natural e convincente.</p>
            </div>
          </article>

          <article className="automation-card automation-small">
            <div className="automation-small-visual agent-preview" aria-hidden="true">
              <div className="ad-preview-composer">
                <div className="ad-preview-top"><span>Novo anúncio</span></div>
                <div className="ad-preview-body">
                  <div className="ad-preview-media">
                    <img src={catalogPreviewProducts[0]?.image} alt="" loading="lazy" />
                    <span className="ad-preview-play">▶</span>
                    <small>00:15</small>
                  </div>
                  <div className="ad-preview-caption">
                    <span className="ad-preview-label">Legenda do anúncio</span>
                    <strong>Seu próximo favorito está aqui.</strong>
                    <p>Conheça os detalhes e aproveite a oferta.</p>
                    <span className="ad-preview-rule" /><span className="ad-preview-rule short" />
                    <span className="ad-preview-export"><Icon icon={Download01Icon} size={13} />Exportar anúncio</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="automation-copy ad-creation-copy">
              <h3>Crie anúncios para vender</h3>
              <p>Transforme produtos em anúncios com vídeo e legenda, prontos para suas campanhas.</p>
            </div>
          </article>

          <article className="automation-card automation-small">
            <div className="automation-small-visual flow-visual" aria-hidden="true">
              <div>
                <img
                  className="flow-logo"
                  src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
                  alt=""
                />
                <div className="flow-card-copy">
                  <strong>Google Flow</strong>
                  <span>Imagens e prompt prontos para gerar seu vídeo</span>
                </div>
              </div>
            </div>
            <div className="automation-copy">
              <h3>Pronto para o Google Flow</h3>
              <p>Use produto, influenciador e prompt juntos para produzir o vídeo sem refazer etapas.</p>
            </div>
          </article>

          <article className="automation-card automation-small">
            <div className="automation-small-visual groups-visual" aria-hidden="true">
              <div className="group-avatars"><span>MF</span><span>CV</span><span>+</span></div>
              <strong>Comunidades do seu nicho</strong>
              <small>10 sugestões por produto</small>
              <i><b /></i>
            </div>
            <div className="automation-copy">
              <h3>Grupos do seu nicho</h3>
              <p>Encontre comunidades relacionadas ao público do produto e divulgue com mais precisão.</p>
            </div>
          </article>
        </div>
      </section>

      <section className="sales-proof" aria-labelledby="proof-title">
        <div className="sales-proof-head">
          <h2 id="proof-title">Estrutura e consistência <strong>para criar campanhas todos os dias</strong></h2>
          <a href="/novo" onClick={(event) => openApp(event, '/novo')}>
            Conhecer a plataforma
          </a>
        </div>

        <div className="sales-proof-metrics">
          <article>
            <Icon icon={CoinsDollarIcon} size={30} />
            <strong>R$ 2 mi+</strong>
            <span>em comissões geradas para afiliados</span>
          </article>
          <article>
            <Icon icon={UserMultipleIcon} size={30} />
            <strong>1,8 mil+</strong>
            <span>afiliados usando a plataforma</span>
          </article>
          <article>
            <Icon icon={Timer02Icon} size={30} />
            <strong>&lt; 2 min</strong>
            <span>para preparar uma nova divulgação</span>
          </article>
        </div>
      </section>

      <section className="sales-integrations" aria-labelledby="integrations-title">
        <div className="sales-integrations-cta">
          <svg viewBox="0 0 1200 300" preserveAspectRatio="none" aria-hidden="true">
            {Array.from({ length: 8 }, (_, index) => (
              <path
                key={index}
                d={`M 610 ${320 + index * 7} C 760 ${235 + index * 4}, 930 ${120 + index * 4}, 1240 ${-8 + index * 5}`}
              />
            ))}
          </svg>
          <h2 id="integrations-title">Um sistema completo para afiliados venderem mais</h2>
          <a href="/novo" onClick={(event) => openApp(event, '/novo')}>
            Começar agora
          </a>
        </div>

        <div className="sales-integrations-grid" aria-label="Ferramentas presentes no fluxo">
          <article className="integration-tool integration-google">
            <div className="integration-logo">
              <img src={'https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg'} alt="" />
              <strong>Google Flow</strong>
            </div>
          </article>
          <article className="integration-tool integration-facebook">
            <div className="integration-logo">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/8/89/Facebook_Logo_%282019%29.svg"
                alt="Facebook"
              />
            </div>
          </article>
          <article className="integration-tool integration-shopee">
            <div className="integration-logo">
              <img src="https://upload.wikimedia.org/wikipedia/commons/f/fe/Shopee.svg" alt="Shopee" />
            </div>
          </article>
        </div>
      </section>

      <section className="sales-testimonials" aria-label="Depoimentos de afiliados">
        <header className="sales-testimonials-head">
          <h2>O que dizem nossos afiliados</h2>
        </header>
        <div className="sales-testimonials-grid">
          <article className="sales-testimonial">
            <header className="testimonial-person">
              <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="" />
              <strong>Marina Alves</strong>
            </header>
            <p>Essa ferramenta destravou meu trabalho como afiliada. Passei a divulgar com muito mais frequência e meu faturamento na Shopee cresceu de verdade.</p>
            <div className="testimonial-print-slot" aria-label="Espaço reservado para print real do resultado" />
          </article>

          <article className="sales-testimonial">
            <header className="testimonial-person">
              <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="" />
              <strong>Lucas Ferreira</strong>
            </header>
            <p>Eu já tentava vender como afiliado, mas não conseguia manter ritmo. Depois que comecei a usar a plataforma, produzi mais conteúdos e passei a faturar muito mais.</p>
            <div className="testimonial-print-slot" aria-label="Espaço reservado para print real do resultado" />
          </article>

          <article className="sales-testimonial">
            <header className="testimonial-person">
              <img src="https://randomuser.me/api/portraits/women/75.jpg" alt="" />
              <strong>Camila Rocha</strong>
            </header>
            <p>Foi o que faltava para eu levar a Shopee a sério. Organizei minhas divulgações, encontrei produtos melhores e comecei a ver resultados que antes pareciam distantes.</p>
            <div className="testimonial-print-slot" aria-label="Espaço reservado para print real do resultado" />
          </article>
        </div>
      </section>

      <section className="sales-pricing" id="precos" aria-labelledby="pricing-title">
        <header className="sales-pricing-head">
          <h2 id="pricing-title">Escolha o plano ideal para você</h2>
          <p>O catálogo de produtos Prime é o principal benefício dos dois planos. Produtos virais e mais vendidos para se afiliar, com ferramentas de criação e divulgação incluídas.</p>
          <form className="pricing-coupon-form" onSubmit={applyCoupon}>
            <label htmlFor="pricing-coupon">Tem um cupom?</label>
            <div><input id="pricing-coupon" value={couponInput} onChange={(event) => { setCouponInput(event.target.value); setCouponError(''); setDiscountApplied(false); }} placeholder="Digite seu cupom" autoComplete="off" aria-invalid={!!couponError} aria-describedby="pricing-coupon-feedback" /><button type="submit">Aplicar</button></div>
            <p id="pricing-coupon-feedback" className={couponError ? 'coupon-error' : ''} role="status">{couponError || (discountApplied ? 'Cupom aplicado' : '')}</p>
          </form>
        </header>

        <div className="sales-pricing-grid">
          {invitePlans.map((plan) => (
            <article className={`sales-plan ${plan.id === 'vitalicio' ? 'sales-plan-featured' : ''}`} key={plan.id}>
              <div className="sales-plan-topline">
                <span>{plan.name}</span>
              </div>
              <p>{plan.description}</p>
              <div className="sales-plan-price">
                {discountApplied && <div><del>{plan.previousPrice}{plan.id === 'mensal' ? '/mês' : ' à vista'}</del></div>}
                {plan.id === 'vitalicio' ? (
                  <>
                    <strong><span className="installment-prefix">12x de </span>{discountApplied ? 'R$ 31,86' : 'R$ 63,82'}</strong>
                    <span>ou {discountApplied ? plan.price : plan.previousPrice} à vista</span>
                  </>
                ) : (
                  <><strong>{discountApplied ? plan.price : plan.previousPrice}</strong><span>por mês</span></>
                )}
              </div>
              <a href={discountApplied ? plan.discountedCheckoutUrl : plan.checkoutUrl}>
                Escolher {plan.id === 'mensal' ? 'mensal' : 'vitalício'}
              </a>
              <ul>
                {plan.benefits.map((benefit) => (
                  <li key={benefit}><span className="sales-benefit-check"><Icon icon={Tick02Icon} size={18} strokeWidth={2.2} /></span> {benefit}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <footer className="sales-footer">
        <div className="sales-footer-top">
          <div className="sales-footer-brand">
            <AppLogo className="sales-logo" />
            <p>© 2026 Prime. Todos os direitos reservados.<br />Feito no Brasil.</p>
          </div>

          <nav className="sales-footer-social" aria-label="Redes sociais">
            <a href="#instagram" aria-label="Instagram"><Icon icon={InstagramIcon} size={22} /></a>
            <a href="#twitter" aria-label="X"><Icon icon={NewTwitterIcon} size={21} /></a>
            <a href="#github" aria-label="GitHub"><Icon icon={GithubIcon} size={22} /></a>
            <a href="#linkedin" aria-label="LinkedIn"><Icon icon={Linkedin02Icon} size={22} /></a>
          </nav>
        </div>

        <div className="sales-footer-legal">
          <p>
            Ao utilizar a plataforma, você concorda com nossa <a href="#privacidade">Política de Privacidade</a>,
            {' '}<a href="#termos">Termos de Uso</a> e <a href="#regras">Diretrizes de Divulgação</a>.
          </p>
          <p>
            A Prime fornece um catálogo de produtos para afiliados, além de ferramentas para criar e organizar campanhas. Não somos afiliados,
            patrocinados ou administrados pela Shopee, Meta/Facebook ou Google. Todas as marcas pertencem aos seus respectivos proprietários.
          </p>
          <p>
            Conteúdos gerados com inteligência artificial devem ser revisados antes da publicação. O usuário é responsável por
            seguir as regras dos marketplaces e das comunidades onde realiza suas divulgações.
          </p>
          <p>Resultados e valores apresentados são exemplos ilustrativos e não garantem desempenho ou faturamento futuro.</p>
        </div>
      </footer>
    </div>
  );
}

function DashboardPage({ period, onPeriodChange }) {
  return (
    <div className="dashboard-page">
      <section className="data-toolbar" aria-label="Cabeçalho do painel de controle">
        <h1>Painel de controle</h1>
        <DateRangePicker value={period} onChange={onPeriodChange} />
      </section>

      <section className="dashboard-panel metrics-panel" aria-label="Métricas principais">
        <div className="metrics-grid">
          {metrics.map((metric) => (
            <article className="metric-card" key={metric.label}>
              <div className="metric-label">
                <span>{metric.label}</span>
                <button type="button" aria-label={`Informações sobre ${metric.label}`} title={`Informações sobre ${metric.label}`}>
                  <Icon icon={InformationCircleIcon} size={16} />
                </button>
              </div>
              <div className="metric-value">
                <strong aria-label="Dados ainda não disponíveis">{metric.value}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-panel products-panel" aria-labelledby="top-products-title">
        <h2 id="top-products-title">Meus Top 5 produtos</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>
                  <span className="sortable-heading">Itens vendidos <Icon icon={ArrowDown01Icon} size={14} /></span>
                </th>
                <th>
                  <span className="sortable-heading muted-sort">Comissão est. (R$) <Icon icon={ArrowDown01Icon} size={14} /></span>
                </th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }, (_, index) => (
                <tr key={index}>
                  <td>--</td>
                  <td>--</td>
                  <td>--</td>
                  <td>--</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

const promotionSteps = [
  { label: 'Escolher produto', icon: ShoppingBag01Icon },
  { label: 'Criar vídeo', icon: Video01Icon },
  { label: 'Gerar legenda', icon: TextIcon },
  { label: 'Divulgar', icon: UserGroupIcon },
];

function PromoteProductPage({ affiliateLinks, products, onSaveLink }) {
  const [currentStep, setCurrentStep] = useState(1);
  const stepperRef = useRef(null);
  useEffect(() => {
    if (window.matchMedia('(max-width: 899px)').matches) {
      stepperRef.current?.querySelector('[aria-current="step"]')?.scrollIntoView({ block: 'nearest', inline: 'center' });
    }
  }, [currentStep]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedInfluencerId, setSelectedInfluencerId] = useState(null);
  const [copiedItem, setCopiedItem] = useState('');
  const [editingAffiliateLink, setEditingAffiliateLink] = useState(false);

  const selectedProduct = products.find((product) => product.id === selectedProductId);
  const selectedInfluencer = influencerProfiles.find((profile) => profile.id === selectedInfluencerId);
  const campaign = getProductCampaign(selectedProduct);
  const groups = selectedProduct
    ? getFacebookGroupTerms(facebookGroupIdeas[selectedProduct.category] ?? fallbackFacebookGroups)
    : [];
  const videoPrompt = selectedProduct && selectedInfluencer ? buildVideoPrompt(selectedProduct) : '';
  const caption = buildProductCaption(selectedProduct, affiliateLinks);

  async function copyText(text, item) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }
    setCopiedItem(item);
    window.setTimeout(() => setCopiedItem(''), 1600);
  }

  async function downloadImage(url, fileName) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = fileName;
      anchor.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  async function downloadAssets() {
    if (!selectedProduct || !selectedInfluencer) return;
    await Promise.all([
      downloadImage(selectedProduct.image, `produto-${selectedProduct.id}.jpg`),
      downloadImage(selectedInfluencer.image, `influenciador-${selectedInfluencer.id}.jpg`),
    ]);
  }

  function goNext() {
    if (currentStep === 1 && (!selectedProduct || !campaign)) return;
    if (currentStep === 2 && !selectedInfluencer) return;
    setCurrentStep((step) => Math.min(step + 1, promotionSteps.length));
  }

  function restart() {
    setCurrentStep(1);
    setSelectedProductId(null);
    setSelectedInfluencerId(null);
  }

  return (
    <div className="promotion-page">
      <div className="promotion-topbar">
      <header className="promotion-header">
        <h1>Criar novo anúncio</h1>
        <span>Passo {currentStep} de {promotionSteps.length}</span>
      </header>

      <ol ref={stepperRef} className="promotion-stepper" aria-label="Etapas para divulgar produto">
        {promotionSteps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isComplete = stepNumber < currentStep;
          return (
            <li key={step.label} className={`${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''}`}>
              <button type="button" aria-current={isActive ? 'step' : undefined} onClick={() => isComplete && setCurrentStep(stepNumber)} disabled={!isComplete && !isActive}>
                <span>{isComplete ? <Icon icon={Tick02Icon} size={12} strokeWidth={2.2} /> : stepNumber}</span>
                <Icon icon={step.icon} size={17} />
                <strong>{step.label}</strong>
              </button>
            </li>
          );
        })}
      </ol>
      </div>

      <section key={currentStep} className={`promotion-content${currentStep === 1 ? ' is-product-step' : ''}${currentStep === 2 ? ' is-video-step' : ''}`}>
        {currentStep === 1 && (
          <div className="promotion-section promotion-product-step" aria-label="Escolha o produto">
            <div className="product-grid promotion-catalog-grid" role="region" aria-label="Catálogo para escolher produto" tabIndex={0}>
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  selected={selectedProductId === product.id}
                  actionLabel={selectedProductId === product.id ? 'Selecionado' : 'Selecionar'}
                  onAction={() => setSelectedProductId(product.id)}
                />
              ))}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="promotion-section promotion-video-step">
            <div className="promotion-section-head">
              <div>
                <h2>Escolha o influenciador</h2>
                <p>Selecione uma foto para gerar o prompt e preparar os materiais do vídeo.</p>
              </div>
            </div>

            <div className="video-builder-layout">
              <div className="influencer-grid" role="region" aria-label="Escolha uma foto de influenciador" tabIndex={0}>
                {influencerProfiles.map((profile) => (
                  <button
                    type="button"
                    key={profile.id}
                    className={selectedInfluencerId === profile.id ? 'selected' : ''}
                    onClick={() => setSelectedInfluencerId(profile.id)}
                    aria-label={`Selecionar ${profile.name}`}
                    aria-pressed={selectedInfluencerId === profile.id}
                    title={profile.name}
                  >
                    <img src={profile.image} alt="" loading="lazy" />
                  </button>
                ))}
              </div>

              <aside className="video-kit">
                <div className="video-assets">
                  <img src={selectedProduct.image} alt="Produto selecionado" />
                  {selectedInfluencer ? (
                    <img src={selectedInfluencer.image} alt="Influenciador selecionado" />
                  ) : (
                    <div className="influencer-placeholder">Escolha uma foto</div>
                  )}
                </div>

                <button type="button" className="download-assets" onClick={downloadAssets} disabled={!selectedInfluencer}>
                  <Icon icon={Download01Icon} size={15} /> Baixar imagens
                </button>

                <div className="generated-copy">
                  <div className="generated-copy-head">
                    <label htmlFor="video-prompt">Prompt do vídeo</label>
                    <button type="button" onClick={() => copyText(videoPrompt, 'prompt')} disabled={!selectedInfluencer}>
                      <Icon icon={Copy01Icon} size={15} /> {copiedItem === 'prompt' ? 'Copiado' : 'Copiar prompt'}
                    </button>
                  </div>
                  <textarea
                    id="video-prompt"
                    value={videoPrompt}
                    placeholder="Escolha uma foto para gerar o prompt."
                    readOnly
                  />
                </div>

                <div className="flow-actions">
                  <p>Baixe as duas fotos, copie o prompt e use os três itens no Google Flow.</p>
                  <a href="https://labs.google/fx/tools/flow" target="_blank" rel="noreferrer">
                    Abrir Google Flow <Icon icon={ArrowRight01Icon} size={15} />
                  </a>
                </div>
              </aside>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="promotion-section caption-step">
            <div className="promotion-section-head">
              <div>
                <h2>Legenda pronta</h2>
                <p>Revise e copie a legenda para publicar junto com o vídeo.</p>
              </div>
              <button type="button" onClick={() => copyText(caption, 'caption')} disabled={!caption}>
                <Icon icon={Copy01Icon} size={15} /> {copiedItem === 'caption' ? 'Copiada' : 'Copiar legenda'}
              </button>
            </div>
            {!caption && campaign && (
              <div className="campaign-link-notice" role="status">
                <p>Adicione seu link de afiliado deste produto para copiar a legenda completa.</p>
                <button type="button" onClick={() => setEditingAffiliateLink(true)}>Adicionar meu link</button>
              </div>
            )}
            <textarea value={caption || (campaign ? `${campaign.caption}\n\n${campaign.hashtags.join(' ')}` : '')} rows={14} readOnly aria-label="Legenda gerada" />
          </div>
        )}

        {currentStep === 4 && (
          <div className="promotion-section">
            <div className="promotion-section-head">
              <div>
                <h2>Grupos do Facebook</h2>
                <p>Comece por achadinhos e ofertas da Shopee, depois explore seu nicho. Confira as regras de cada grupo antes de publicar.</p>
              </div>
            </div>
            <div className="facebook-groups-grid">
              {groups.map((group, index) => (
                <article key={group}>
                  <Icon icon={UserGroupIcon} size={20} />
                  <div>
                    <strong>{group}</strong>
                    <small>{index < 2 ? 'Busca por ofertas e achadinhos Shopee' : 'Busca relacionada ao seu produto'}</small>
                  </div>
                  <a href={`https://www.facebook.com/search/groups/?q=${encodeURIComponent(group)}`} target="_blank" rel="noreferrer">
                    Buscar grupo <Icon icon={ArrowRight01Icon} size={14} />
                  </a>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      <footer className="promotion-footer">
        <button type="button" className="secondary" onClick={() => setCurrentStep((step) => Math.max(step - 1, 1))} disabled={currentStep === 1}>
          <Icon icon={ArrowLeft01Icon} size={15} /> Voltar
        </button>
        {currentStep < promotionSteps.length ? (
          <button
            type="button"
            className="primary"
            onClick={goNext}
            disabled={(currentStep === 1 && (!selectedProduct || !campaign)) || (currentStep === 2 && !selectedInfluencer)}
          >
            Próximo <Icon icon={ArrowRight01Icon} size={15} />
          </button>
        ) : (
          <button type="button" className="primary" onClick={restart}>Criar nova divulgação</button>
        )}
      </footer>
      {selectedProduct && !campaign && <p className="campaign-unavailable" role="status">O conteúdo deste produto ainda não está disponível.</p>}
      <AffiliateLinkModal product={editingAffiliateLink ? selectedProduct : null}
        initialLink={selectedProduct ? affiliateLinks[selectedProduct.id] ?? '' : ''}
        onClose={() => setEditingAffiliateLink(false)} onSave={onSaveLink} />
    </div>
  );
}

function ProductCard({ product, actionLabel, onAction, selected = false }) {
  return (
    <article className={`product-card ${selected ? 'selected' : ''}`}>
      <div className="product-image-wrap">
        <img src={product.image} alt="" loading="lazy" />
      </div>
      <div className="product-card-body">
        <h2>{product.name}</h2>
        <div className="product-meta">
          <strong>{product.price}</strong>
          {product.sales && <span>{product.sales}</span>}
        </div>
        {product.commission && <p>Taxa de comissão {product.commission}</p>}
        <button type="button" onClick={onAction}>{actionLabel}</button>
      </div>
    </article>
  );
}

function ProductPagination({ currentPage, pageCount, onPageChange }) {
  const pageValues = pageCount <= 7
    ? Array.from({ length: pageCount }, (_, index) => index + 1)
    : [
        1,
        ...(currentPage > 3 ? ['ellipsis-left'] : []),
        ...Array.from(
          { length: Math.min(3, pageCount - 2) },
          (_, index) => Math.max(2, Math.min(currentPage - 1 + index, pageCount - 1)),
        ),
        ...(currentPage < pageCount - 2 ? ['ellipsis-right'] : []),
        pageCount,
      ].filter((value, index, values) => values.indexOf(value) === index);

  return (
    <nav className="product-pagination" aria-label="Paginação de produtos">
      <button
        type="button"
        className="product-pagination-arrow"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        aria-label="Página anterior"
      >
        <Icon icon={ArrowLeft01Icon} size={15} />
      </button>
      {pageValues.map((page) => page.startsWith?.('ellipsis') ? (
        <span className="product-pagination-ellipsis" key={page}>…</span>
      ) : (
        <button
          type="button"
          key={page}
          className={page === currentPage ? 'active' : ''}
          onClick={() => onPageChange(page)}
          aria-current={page === currentPage ? 'page' : undefined}
        >
          {page}
        </button>
      ))}
      <button
        type="button"
        className="product-pagination-arrow"
        onClick={() => onPageChange(Math.min(pageCount, currentPage + 1))}
        disabled={currentPage === pageCount}
        aria-label="Próxima página"
      >
        <Icon icon={ArrowRight01Icon} size={15} />
      </button>
    </nav>
  );
}

function AffiliateLinkModal({ product, initialLink = '', onClose, onSave }) {
  const [affiliateLink, setAffiliateLink] = useState(initialLink);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const dialogRef = useDialogFocus(Boolean(product));

  useEffect(() => {
    setAffiliateLink(initialLink);
    setErrorMessage('');
  }, [initialLink, product]);

  useEffect(() => {
    if (!product) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [product, onClose]);

  if (!product) return null;

  const shopeeProductUrl = product.url ?? `https://shopee.com.br/search?keyword=${encodeURIComponent(product.name)}`;

  async function handleSubmit(event) {
    event.preventDefault();
    const normalizedLink = affiliateLink.trim();
    if (!normalizedLink) return;
    setSaving(true);
    setErrorMessage('');
    try {
      await onSave(product.id, normalizedLink);
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Não foi possível salvar o link.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="link-modal-overlay" role="presentation" onMouseDown={onClose}>
      <section
        className="link-modal"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="affiliate-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="link-modal-head">
          <div>
            <h2 id="affiliate-modal-title">Adicionar link de afiliado</h2>
            <p>{product.name}</p>
          </div>
          <button type="button" aria-label="Fechar" onClick={onClose}>
            <Icon icon={Cancel01Icon} size={18} />
          </button>
        </header>

        <div className="link-modal-instructions">
          <p>Para gerar seu link de afiliado:</p>
          <ol>
            <li>O link público será copiado automaticamente ao abrir o conversor.</li>
            <li>No Portal do Afiliado Shopee, abra a opção Link personalizado.</li>
            <li>Cole o link lá, gere seu link de afiliado e volte para salvar aqui.</li>
          </ol>
        </div>

        <a
          className="open-shopee-button"
          href="https://affiliate.shopee.com.br/offer/custom_link"
          target="_blank"
          rel="noreferrer"
          onClick={() => {
            if (navigator.clipboard?.writeText) {
              navigator.clipboard.writeText(shopeeProductUrl).catch(() => {});
            }
          }}
        >
          Abrir conversor de afiliado
          <Icon icon={ArrowRight01Icon} size={16} />
        </a>

        <form className="affiliate-link-form" onSubmit={handleSubmit}>
          <label htmlFor="affiliate-link">Link de afiliado</label>
          <input
            id="affiliate-link"
            type="url"
            value={affiliateLink}
            onChange={(event) => setAffiliateLink(event.target.value)}
            placeholder="Cole aqui o link de afiliado da Shopee"
            autoFocus
            required
          />
          {errorMessage ? <p className="form-error" role="alert">{errorMessage}</p> : null}
          <div className="link-modal-actions">
            <button type="button" onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ProductsPage({ affiliateLinks, onSaveLink, products }) {
  const [query, setQuery] = useState('');
  const resultsRef = useRef(null);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
  const visibleProducts = products.filter((product) => {
    const matchesCategory = activeCategory === 'Todos' || product.category === activeCategory;
    const matchesQuery = !normalizedQuery || product.name.toLocaleLowerCase('pt-BR').includes(normalizedQuery);
    return matchesCategory && matchesQuery;
  });
  const pageCount = Math.max(1, Math.ceil(visibleProducts.length / PRODUCTS_PER_PAGE));
  const paginatedProducts = visibleProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [query, activeCategory]);

  useEffect(() => {
    if (currentPage > pageCount) setCurrentPage(pageCount);
  }, [currentPage, pageCount]);

  useEffect(() => {
    if (window.matchMedia('(max-width: 899px)').matches) {
      resultsRef.current?.scrollTo({ top: 0 });
    }
  }, [query, activeCategory, currentPage]);

  return (
    <div className="offers-page product-browser">
      <header className="offers-header">
        <h1>Produtos</h1>
        <form className="product-search" role="search" onSubmit={(event) => event.preventDefault()}>
          <Icon icon={Search01Icon} size={17} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por todos os produtos"
            aria-label="Buscar produtos"
          />
          <button type="submit">Pesquisar</button>
        </form>
      </header>

      <nav className="category-tabs" aria-label="Categorias de produtos">
        {productCategories.map((category) => (
          <button
            type="button"
            key={category}
            className={activeCategory === category ? 'active' : ''}
            aria-pressed={activeCategory === category}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </nav>

      <div className="product-results" ref={resultsRef} role="region" aria-label="Lista de produtos" tabIndex={0}>
      {visibleProducts.length > 0 ? (
        <section className="product-grid" aria-label="Ofertas disponíveis">
          {paginatedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              actionLabel={affiliateLinks[product.id] ? 'Editar link' : 'Obter link'}
              onAction={() => setSelectedProduct(product)}
            />
          ))}
        </section>
      ) : (
        <div className="empty-products">
          <Icon icon={ShoppingBag01Icon} size={22} />
          <p>Nenhum produto encontrado.</p>
        </div>
      )}

      {visibleProducts.length > PRODUCTS_PER_PAGE && (
        <ProductPagination currentPage={currentPage} pageCount={pageCount} onPageChange={setCurrentPage} />
      )}

      </div>

      <AffiliateLinkModal
        product={selectedProduct}
        initialLink={selectedProduct ? affiliateLinks[selectedProduct.id] ?? '' : ''}
        onClose={() => setSelectedProduct(null)}
        onSave={onSaveLink}
      />
    </div>
  );
}

function MyProductsPage({ affiliateLinks, products }) {
  const [query, setQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const searchInputRef = React.useRef(null);
  const normalizeSearch = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
  const normalizedQuery = normalizeSearch(query.trim());
  const addedProducts = products.filter((product) => Boolean(affiliateLinks[product.id]));
  const visibleProducts = addedProducts.filter((product) => normalizeSearch(product.name).includes(normalizedQuery));
  const pageCount = Math.max(1, Math.ceil(visibleProducts.length / PRODUCTS_PER_PAGE));
  const displayPage = Math.min(currentPage, pageCount);
  const paginatedProducts = visibleProducts.slice(
    (displayPage - 1) * PRODUCTS_PER_PAGE,
    displayPage * PRODUCTS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [query, affiliateLinks]);

  function clearSearch() {
    setQuery('');
    searchInputRef.current?.focus();
  }

  async function copyProductLink(product) {
    const link = affiliateLinks[product.id];

    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // Mantém a confirmação visual se o navegador bloquear o clipboard.
    }

    setCopiedId(product.id);
    window.setTimeout(() => setCopiedId(null), 1600);
  }

  return (
    <div className="offers-page saved-products-page">
      <header className="offers-header saved-products-header">
        <h1>Meus produtos</h1>
        <form className="product-search saved-products-search" role="search" onSubmit={(event) => event.preventDefault()}>
          <Icon icon={Search01Icon} size={17} />
          <input
            id="saved-products-search"
            ref={searchInputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar nos meus produtos"
            aria-label="Buscar nos meus produtos"
          />
          {query && (
            <button type="button" className="saved-products-clear" onClick={clearSearch} aria-label="Limpar busca">
              <Icon icon={Cancel01Icon} size={16} />
            </button>
          )}
          <button type="submit">Pesquisar</button>
        </form>
      </header>

      {visibleProducts.length > 0 ? (
        <section className="product-grid" aria-label="Produtos adicionados">
          {paginatedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              actionLabel={copiedId === product.id ? 'Link copiado' : 'Copiar link'}
              onAction={() => copyProductLink(product)}
            />
          ))}
        </section>
      ) : (
        <div className="empty-products saved-products-empty" role="status">
          <Icon icon={addedProducts.length > 0 ? Search01Icon : ShoppingBag03Icon} size={22} />
          {addedProducts.length > 0 ? (
            <>
              <p>Nenhum produto encontrado para “{query.trim()}”.</p>
              <button type="button" onClick={clearSearch}>Limpar busca</button>
            </>
          ) : (
            <p>Os produtos adicionados aparecerão aqui.</p>
          )}
        </div>
      )}

      {visibleProducts.length > PRODUCTS_PER_PAGE && (
        <ProductPagination currentPage={displayPage} pageCount={pageCount} onPageChange={setCurrentPage} />
      )}
    </div>
  );
}

function SettingsModal({ open, onClose, account, sidebarCollapsed, onSidebarChange, onLogout }) {
  const dialogRef = useDialogFocus(open);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return undefined;
    setError('');
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  async function handleLogout() {
    setSigningOut(true);
    setError('');
    try {
      await onLogout();
    } catch {
      setError('Não foi possível sair. Tente novamente.');
    } finally {
      setSigningOut(false);
    }
  }

  if (!open) return null;

  return (
    <div className="settings-overlay" role="presentation" onMouseDown={onClose}>
      <section className="settings-modal" ref={dialogRef} role="dialog" aria-modal="true"
        aria-labelledby="settings-title" onMouseDown={(event) => event.stopPropagation()}>
        <aside className="settings-sidebar">
          <h1 id="settings-title">Configurações</h1>
          <nav aria-label="Seções das configurações">
            <button type="button" className="active" aria-current="page">
              <Icon icon={Settings01Icon} size={19} /><span>Geral</span>
            </button>
          </nav>
        </aside>
        <div className="settings-content">
          <div className="settings-content-head">
            <h2>Geral</h2>
            <button type="button" className="settings-close" aria-label="Fechar configurações" onClick={onClose} autoFocus>
              <Icon icon={Cancel01Icon} size={19} />
            </button>
          </div>
          <div className="general-settings">
            <p className="settings-eyebrow">Sua conta</p>
            <div className="settings-account-row">
              <Icon icon={UserCircleIcon} size={24} />
              <span><strong>{account.name}</strong><small>{account.email || 'E-mail não informado'}</small></span>
            </div>
            <div className="settings-plan-row">
              <span><strong>{account.planLabel}</strong><small>{account.accessDescription}</small></span>
            </div>
            <div className="settings-preferences">
              <label className="settings-preference-row" htmlFor="settings-sidebar-mode">
                <span>Menu lateral</span>
                <select id="settings-sidebar-mode" value={sidebarCollapsed ? 'collapsed' : 'expanded'}
                  onChange={(event) => onSidebarChange(event.target.value === 'collapsed')}>
                  <option value="expanded">Expandido</option>
                  <option value="collapsed">Recolhido</option>
                </select>
              </label>
            </div>
            <button className="settings-simple-row" type="button" onClick={handleLogout} disabled={signingOut}>
              <span>{signingOut ? 'Saindo…' : 'Sair da conta'}</span><Icon icon={Logout02Icon} size={18} />
            </button>
          </div>
          {error && <p className="settings-error" role="alert">{error}</p>}
        </div>
      </section>
    </div>
  );
}

const invitePlans = [
  {
    id: 'mensal',
    name: 'Plano mensal',
    checkoutUrl: 'https://checkout.applyfy.com.br/checkout/cmucrf9v601z301q16mul4qag?offer=X1XE2DU',
    discountedCheckoutUrl: 'https://checkout.applyfy.com.br/checkout/cmucrf9v601z301q16mul4qag?offer=2E2RG39',
    previousPrice: 'R$ 339',
    price: 'R$ 169',
    cadence: 'por mês',
    description: 'Acesso ao catálogo de produtos Prime, com cobrança mensal e liberdade para cancelar quando quiser.',
    benefits: ['Catálogo de produtos Prime', 'Produtos virais e campeões de vendas', 'Produtos de confiança, com estoque e entrega', 'IA para criar seus vídeos', 'IA para gerar legendas prontas', 'Afiliação semiautomática pela Shopee', 'Catálogo de grupos para divulgação', 'Cancele quando quiser'],
  },
  {
    id: 'vitalicio',
    name: 'Plano vitalício',
    checkoutUrl: 'https://checkout.applyfy.com.br/checkout/cmucrkrsx01ut01oo0065w954?offer=ENMG0W8',
    discountedCheckoutUrl: 'https://checkout.applyfy.com.br/checkout/cmucrkrsx01ut01oo0065w954?offer=L83RFTI',
    previousPrice: 'R$ 599',
    price: 'R$ 299',
    cadence: 'pagamento único',
    description: 'Acesso vitalício ao catálogo de produtos Prime. Pague uma única vez, sem mensalidades.',
    benefits: ['Catálogo de produtos Prime', 'Produtos virais e campeões de vendas', 'Produtos de confiança, com estoque e entrega', 'IA para criar seus vídeos', 'IA para gerar legendas prontas', 'Afiliação semiautomática pela Shopee', 'Catálogo de grupos para divulgação', 'Acesso vitalício sem mensalidade'],
  },
];

async function checkPurchaseEligibility(email) {
  const { data: eligible, error } = await supabase.rpc('check_signup_eligibility', {
    p_email: email.trim().toLowerCase(),
  });
  if (error) throw new Error('Não foi possível verificar sua compra agora. Tente novamente.');
  if (!eligible) throw new Error('Nenhuma compra aprovada e ativa foi encontrada. Use o e-mail da compra ou aguarde a confirmação do pagamento.');
}

function LoginFrontendRoute({ mode, onNavigate, onAuthenticate, onComplete }) {
  function handleModeChange(nextMode) {
    const nextPath = nextMode === 'signup' ? '/criar-conta' : '/entrar';
    onNavigate(nextPath);
  }

  return (
    <React.Suspense fallback={<DelayedAuthLoading />}>
      <LoginFrontend
        initialMode={mode}
        onModeChange={handleModeChange}
        onAuthenticate={onAuthenticate}
        onCheckPurchase={checkPurchaseEligibility}
        onComplete={onComplete}
      />
    </React.Suspense>
  );
}

function DelayedAuthLoading() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 350);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className={`auth-route-loading${visible ? ' is-visible' : ''}`} aria-busy="true" aria-label="Abrindo área de acesso">
      <span className="auth-route-spinner" aria-hidden="true" />
    </main>
  );
}

function InviteOfferModal({ open, onClose }) {
  const dialogRef = useDialogFocus(open);
  const [feedback, setFeedback] = useState('');
  const [qrCode, setQrCode] = useState('');
  const coupon = PROMOTION_COUPON;
  const configuredUrl = import.meta.env.VITE_INVITE_URL?.trim() || '';
  let inviteUrl = `${window.location.origin}${offerPath}#precos`;
  try {
    const parsed = new URL(configuredUrl);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') inviteUrl = parsed.href;
  } catch { /* Use the existing local offer page until a campaign URL is configured. */ }

  useEffect(() => {
    if (!open || !inviteUrl) return;
    let active = true;
    setQrCode('');
    QRCode.toDataURL(inviteUrl, { width: 240, margin: 1, errorCorrectionLevel: 'M' })
      .then((url) => { if (active) setQrCode(url); })
      .catch(() => { if (active) setQrCode(''); });
    return () => { active = false; };
  }, [open, inviteUrl]);

  useEffect(() => {
    if (!open) return undefined;
    setFeedback('');
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKey = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose]);

  async function copy(value, label) {
    try {
      await navigator.clipboard.writeText(value);
      setFeedback(`${label} copiado!`);
    } catch {
      setFeedback('Não foi possível copiar. Selecione o texto abaixo e copie manualmente.');
    }
  }
  if (!open) return null;
  return (
    <div className="settings-overlay" onMouseDown={onClose}>
      <section className="invite-offer-modal" ref={dialogRef} role="dialog" aria-modal="true"
        aria-labelledby="invite-offer-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="invite-hero">
          <button type="button" className="settings-close" onClick={onClose} aria-label="Fechar oferta"><Icon icon={Cancel01Icon} size={20} /></button>
          <span className="invite-badge">Promoção de fim de ano</span>
          <div className="invite-bloom" aria-hidden="true"><i /><i /><i /><i /><span>✦</span></div>
          <h2 id="invite-offer-title">Convide um amigo</h2>
          <p>e dê <strong>50% de desconto</strong></p>
        </header>
        <section className="invite-how" aria-labelledby="invite-how-title">
          <h3 id="invite-how-title">Como funciona</h3>
          <ol>
            <li><Icon icon={UserMultipleIcon} size={20} /><span>Compartilhe seu <strong>link de convite.</strong></span></li>
            <li><Icon icon={Copy01Icon} size={20} /><span>Envie também o cupom para seu amigo.</span></li>
            <li><Icon icon={GiftIcon} size={20} /><span>Ele usa o cupom na contratação e aproveita <strong>50% de desconto.</strong></span></li>
          </ol>
        </section>
        <div className="invite-coupon-row">
          <label htmlFor="invite-coupon">Cupom de desconto</label>
          <div><input id="invite-coupon" type="password" autoComplete="off" readOnly value={coupon} placeholder="••••••••" />
          <button type="button" onClick={() => copy(coupon, 'Cupom')}>Copiar cupom</button></div>
        </div>
        <div className="invite-share">
          {qrCode && <img className="invite-qr" src={qrCode} alt="QR code para abrir a oferta" width="112" height="112" />}
          <div className="invite-share-controls">
            <input id="invite-link" aria-label="Link direto da oferta" readOnly value={inviteUrl} />
            <button type="button" onClick={() => copy(inviteUrl, 'Link')}><Icon icon={Copy01Icon} size={17} />Copiar link</button>
          </div>
        </div>
        <p className="invite-offer-feedback" role="status">{feedback}</p>
      </section>
    </div>
  );
}

function Sidebar({ open, onClose, collapsed, onCollapse, onExpand, activePath, onNavigate, onOpenSettings, onLogout, account }) {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const accountMenuRef = useRef(null);
  const drawerRef = useDialogFocus(open && !inviteOpen);
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 900px)');
    const closeOnDesktop = () => { if (desktop.matches && open) onClose(); };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, [open, onClose]);
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);
  useEffect(() => {
    const escape = (event) => { if (open && event.key === 'Escape' && !inviteOpen) onClose(); };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [open, inviteOpen, onClose]);

  useEffect(() => {
    if (!accountMenuOpen) return undefined;

    function closeAccountMenu(event) {
      if (!accountMenuRef.current?.contains(event.target)) setAccountMenuOpen(false);
    }

    function handleEscape(event) {
      if (event.key === 'Escape') setAccountMenuOpen(false);
    }

    document.addEventListener('pointerdown', closeAccountMenu);
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', closeAccountMenu);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [accountMenuOpen]);

  function inviteFriend() {
    setAccountMenuOpen(false);
    setInviteOpen(true);
  }

  function openSettings(section) {
    setAccountMenuOpen(false);
    onClose();
    onOpenSettings(section);
  }

  return (
    <>
      {open && <button className="backdrop" aria-label="Fechar menu" onClick={onClose} />}
      <aside ref={drawerRef} id="app-navigation" className={`sidebar ${open ? 'is-open' : ''} ${collapsed ? 'is-collapsed' : ''}`} aria-label="Navegação principal">
        <div className="sidebar-head">
          <a
            className="brand"
            href={defaultPath}
            aria-label="Página inicial"
            onClick={(event) => {
              event.preventDefault();
              onNavigate(defaultPath);
            }}
          >
            <AppLogo className="sidebar-logo" />
          </a>
          <button className="compact-brand" aria-label="Expandir barra lateral" onClick={onExpand}>
            <AppLogo className="compact-logo" />
            <span className="compact-expand-icon" aria-hidden="true"><Icon icon={PanelLeftIcon} size={19} /></span>
          </button>
          <div className="sidebar-tools">
            <button className="icon-button desktop-only" aria-label="Recolher barra lateral" onClick={onCollapse}>
              <Icon icon={PanelRightIcon} size={18} />
            </button>
            <button className="icon-button mobile-close" aria-label="Fechar barra lateral" onClick={onClose}>
              <Icon icon={Cancel01Icon} />
            </button>
          </div>
        </div>

        <nav className="sidebar-nav">
          {sidebarItems.map((item) => (
            <a
              key={item.label}
              href={item.path}
              className={`nav-item ${activePath === item.path ? 'active' : ''}`}
              aria-current={activePath === item.path ? 'page' : undefined}
              title={collapsed ? item.label : undefined}
              onClick={(event) => {
                event.preventDefault();
                onNavigate(item.path);
              }}
            >
              <Icon icon={item.icon} size={19} />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="account-menu-anchor" ref={accountMenuRef}>
            {accountMenuOpen && (
              <div className="account-menu" id="account-menu" role="menu">
                <p>{account.email || 'E-mail não informado'}</p>
                <button type="button" role="menuitem" onClick={() => openSettings('general')}>
                  <Icon icon={Settings01Icon} size={18} />
                  <span>Configurações</span>
                </button>
                <button type="button" role="menuitem" onClick={inviteFriend}>
                  <Icon icon={UserMultipleIcon} size={18} />
                  <span>Convidar amigo</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setAccountMenuOpen(false);
                    onLogout();
                  }}
                >
                  <Icon icon={Logout02Icon} size={18} />
                  <span>Sair</span>
                </button>
              </div>
            )}

            <button
              className={`account${accountMenuOpen ? ' is-menu-open' : ''}`}
              onClick={() => setAccountMenuOpen((current) => !current)}
              aria-label="Abrir menu do perfil"
              aria-haspopup="menu"
              aria-expanded={accountMenuOpen}
              aria-controls={accountMenuOpen ? 'account-menu' : undefined}
            >
              <span className="avatar">{account.initials}</span>
              <span className="account-copy">
                <strong>{account.name}</strong>
                <small>{account.email || 'E-mail não informado'}</small>
              </span>
            </button>
          </div>
          <button type="button" className="redeem" onClick={inviteFriend} aria-label="Resgatar oferta" title="Resgatar oferta">
            <Icon icon={GiftIcon} size={17} /><span>Resgatar oferta</span>
          </button>
        </div>
      </aside>
      <InviteOfferModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </>
  );
}

function normalizeAccountProfile(profile) {
  const firstName = typeof profile?.firstName === 'string' ? profile.firstName.trim() : '';
  const lastName = typeof profile?.lastName === 'string' ? profile.lastName.trim() : '';
  const email = typeof profile?.email === 'string' ? profile.email.trim() : '';
  const fallbackName = email ? email.split('@')[0].replace(/[._-]+/g, ' ') : 'Sua conta';
  const name = [firstName, lastName].filter(Boolean).join(' ') || fallbackName;
  const nameParts = name.split(/\s+/).filter(Boolean);
  const initials = nameParts.length > 1
    ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();

  const planCode = profile?.planCode ?? null;
  const accessEndsAt = profile?.accessEndsAt ?? null;
  const planLabel = planCode === 'lifetime' ? 'Plano Vitalício' : planCode === 'monthly' ? 'Plano Mensal' : 'Sem plano ativo';
  const accessDescription = planCode === 'lifetime'
    ? 'Acesso completo e permanente'
    : accessEndsAt
      ? `Acesso completo até ${new Intl.DateTimeFormat('pt-BR').format(new Date(accessEndsAt))}`
      : 'Nenhum acesso ativo encontrado';

  return {
    firstName,
    lastName,
    email,
    name,
    initials,
    role: profile?.role ?? 'member',
    planCode,
    planLabel,
    accessEndsAt,
    accessDescription,
  };
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardPeriod, setDashboardPeriod] = useState(createTodayRange);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      const savedPreference = window.localStorage.getItem(sidebarPreferenceKey);
      return savedPreference === null ? true : savedPreference === 'true';
    } catch {
      return true;
    }
  });
  const [authReady, setAuthReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authenticatedUserId, setAuthenticatedUserId] = useState(null);
  const [accountProfile, setAccountProfile] = useState(() => normalizeAccountProfile({}));
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [currentPath, setCurrentPath] = useState(() => {
    const requestedPath = getValidPath(window.location.pathname);
    return isInternalPath(requestedPath) ? '/entrar' : requestedPath;
  });
  const [affiliateLinks, setAffiliateLinks] = useState({});
  const activeNavigationPath = currentPath === defaultPath ? '/produtos' : currentPath;

  useEffect(() => {
    try {
      window.localStorage.setItem(sidebarPreferenceKey, String(sidebarCollapsed));
    } catch {
      // Mantém o estado da sessão quando o armazenamento do navegador está indisponível.
    }
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (!authenticatedUserId || !authReady) return;
    supabase.from('user_preferences').upsert({
      user_id: authenticatedUserId,
      sidebar_collapsed: sidebarCollapsed,
    }, { onConflict: 'user_id' }).then(({ error }) => {
      if (error) console.error('Falha ao salvar preferência da barra lateral:', error.message);
    });
  }, [authReady, authenticatedUserId, sidebarCollapsed]);

  useEffect(() => {
    let active = true;

    async function loadCatalog() {
      const { data, error } = await supabase
        .from('products')
        .select('id,item_id,shop_id,name,category,source_image_url,image_url,source_url,price_cents,currency,commission_rate,sales_count')
        .eq('is_active', true)
        .order('imported_at', { ascending: true });

      if (!active) return;
      if (error) {
        console.error('Falha ao carregar produtos:', error.message);
        setCatalogProducts([]);
        return;
      }
      setCatalogProducts((data ?? []).map(mapDatabaseProduct));
    }

    loadCatalog();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;

    let hydratedUserId = null;

    async function hydrateSession(session) {
      if (!active) return;
      const user = session?.user;
      if (!user) {
        hydratedUserId = null;
        setAuthenticatedUserId(null);
        setIsAuthenticated(false);
        setAccountProfile(normalizeAccountProfile({}));
        setAffiliateLinks({});
        setAuthReady(true);
        return;
      }

      const [{ data: profile }, { data: savedProducts }, { data: preferences }, { data: accessRows, error: accessError }] = await Promise.all([
        supabase.from('profiles').select('first_name,last_name,email').eq('id', user.id).maybeSingle(),
        supabase.from('saved_products').select('product_id,affiliate_url').eq('user_id', user.id),
        supabase.from('user_preferences').select('sidebar_collapsed').eq('user_id', user.id).maybeSingle(),
        supabase.rpc('get_my_access'),
      ]);
      if (!active) return;

      const access = accessRows?.[0];
      if (accessError || !access?.has_access) {
        await supabase.auth.signOut();
        if (!active) return;
        setAuthenticatedUserId(null);
        setIsAuthenticated(false);
        setAccountProfile(normalizeAccountProfile({}));
        setAffiliateLinks({});
        setAuthReady(true);
        window.history.replaceState({}, '', '/entrar');
        setCurrentPath('/entrar');
        return;
      }

      setAuthenticatedUserId(user.id);
      setAccountProfile(normalizeAccountProfile({
        firstName: profile?.first_name ?? user.user_metadata?.first_name,
        lastName: profile?.last_name ?? user.user_metadata?.last_name,
        email: profile?.email ?? user.email,
        role: access.account_role,
        planCode: access.plan_code,
        accessEndsAt: access.access_ends_at,
      }));
      setAffiliateLinks(Object.fromEntries((savedProducts ?? []).map((item) => [item.product_id, item.affiliate_url])));
      if (typeof preferences?.sidebar_collapsed === 'boolean') setSidebarCollapsed(preferences.sidebar_collapsed);
      setIsAuthenticated(true);
      setAuthReady(true);

      const requestedPath = getValidPath(window.location.pathname);
      // Open Products on entry; token refreshes preserve the current screen.
      if ((hydratedUserId !== user.id && requestedPath !== offerPath) || authPaths.includes(requestedPath)) {
        window.history.replaceState({}, '', '/produtos');
        setCurrentPath('/produtos');
      }
      hydratedUserId = user.id;
    }

    supabase.auth.getSession().then(({ data }) => hydrateSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => hydrateSession(session), 0);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (window.location.pathname !== currentPath) {
      window.history.replaceState({}, '', currentPath);
    }

    function handlePopState() {
      const requestedPath = getValidPath(window.location.pathname);

      if (!isAuthenticated && isInternalPath(requestedPath)) {
        window.history.replaceState({}, '', '/entrar');
        setCurrentPath('/entrar');
        return;
      }

      if (isAuthenticated && authPaths.includes(requestedPath)) {
        window.history.replaceState({}, '', '/produtos');
        setCurrentPath('/produtos');
        return;
      }

      setCurrentPath(requestedPath);
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAuthenticated]);

  useEffect(() => {
    document.title = 'Prime';
  }, []);

  function navigate(path, { replace = false } = {}) {
    const requestedPath = getValidPath(path);
    let nextPath = requestedPath;

    if (!isAuthenticated && isInternalPath(requestedPath)) {
      nextPath = '/entrar';
    } else if (isAuthenticated && authPaths.includes(requestedPath)) {
      nextPath = '/produtos';
    }

    if (window.location.pathname !== nextPath) {
      window.history[replace ? 'replaceState' : 'pushState']({}, '', nextPath);
    }
    setCurrentPath(nextPath);
    setSidebarOpen(false);
  }

  async function authenticate({ mode, email, password, firstName, lastName }) {
    const normalizedEmail = email.trim().toLocaleLowerCase('pt-BR');
    if (!normalizedEmail || !password) throw new Error('Informe seu e-mail e sua senha.');
    if (mode === 'signup' && password.length < 8) throw new Error('A senha deve ter pelo menos 8 caracteres.');

    if (mode === 'signup') await checkPurchaseEligibility(normalizedEmail);

    const result = mode === 'signup'
      ? await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: { first_name: firstName?.trim() ?? '', last_name: lastName?.trim() ?? '' },
            emailRedirectTo: `${window.location.origin}/entrar`,
          },
        })
      : await supabase.auth.signInWithPassword({ email: normalizedEmail, password });

    if (result.error) {
      const message = result.error.message.toLocaleLowerCase('pt-BR');
      if (message.includes('invalid login')) throw new Error('E-mail ou senha incorretos.');
      if (message.includes('already registered') || message.includes('already been registered')) throw new Error('Este e-mail já possui uma conta.');
      if (message.includes('email not confirmed')) throw new Error('Confirme seu e-mail antes de entrar.');
      if (message.includes('compra aprovada') || message.includes('approved purchase')) throw new Error('Nenhuma compra aprovada foi encontrada para este e-mail.');
      if (message.includes('rate limit')) throw new Error('Muitas tentativas. Aguarde um pouco e tente novamente.');
      throw new Error('Não foi possível acessar sua conta agora.');
    }

    if (mode === 'signup' && !result.data.session) {
      return { requiresEmailConfirmation: true, message: 'Conta criada. Confirme o link enviado ao seu e-mail para entrar.' };
    }

    if (result.data.session) {
      const { data: accessRows, error: accessError } = await supabase.rpc('get_my_access');
      if (accessError || !accessRows?.[0]?.has_access) {
        await supabase.auth.signOut();
        throw new Error('Seu plano não está ativo. Regularize o pagamento para recuperar o acesso.');
      }
    }
    return {};
  }

  function completeAuthentication() {
    const destination = '/produtos';
    setIsAuthenticated(true);
    window.history.replaceState({}, '', destination);
    setCurrentPath(destination);
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setAuthenticatedUserId(null);
    setIsAuthenticated(false);
    setAccountProfile(normalizeAccountProfile({}));
    setAffiliateLinks({});
    setSettingsOpen(false);
    window.history.replaceState({}, '', '/entrar');
    setCurrentPath('/entrar');
  }

  useEffect(() => {
    if (!isAuthenticated || !authenticatedUserId) return undefined;
    let active = true;
    let checking = false;
    async function checkAccess() {
      if (checking) return;
      checking = true;
      try {
        const { data, error } = await supabase.rpc('get_my_access');
        if (!active || error) return;
        if (!data?.[0]?.has_access) {
          // Clear private UI even if the sign-out request cannot reach the server.
          setIsAuthenticated(false);
          setAuthenticatedUserId(null);
          setAffiliateLinks({});
          setSettingsOpen(false);
          setAccountProfile(normalizeAccountProfile({}));
          window.history.replaceState({}, '', '/entrar');
          setCurrentPath('/entrar');
          await supabase.auth.signOut();
        }
      } catch {
        // Retry transient network failures on the next check; RLS enforces access.
      } finally {
        checking = false;
      }
    }
    const interval = window.setInterval(checkAccess, 60000);
    const expiresAt = accountProfile.accessEndsAt && new Date(accountProfile.accessEndsAt).getTime();
    const delay = expiresAt ? Math.max(0, expiresAt - Date.now() + 100) : null;
    const expiryTimer = delay !== null && delay <= 2147483647 ? window.setTimeout(checkAccess, delay) : null;
    const onVisible = () => { if (document.visibilityState === 'visible') checkAccess(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      active = false;
      window.clearInterval(interval);
      if (expiryTimer !== null) window.clearTimeout(expiryTimer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [isAuthenticated, authenticatedUserId, accountProfile.accessEndsAt]);

  async function saveAffiliateLink(productId, link) {
    if (!authenticatedUserId) throw new Error('Entre novamente para salvar este link.');
    let parsedUrl;
    try {
      parsedUrl = new URL(link);
    } catch {
      throw new Error('Informe um link válido.');
    }
    if (parsedUrl.protocol !== 'https:') throw new Error('O link precisa usar HTTPS.');

    const { error } = await supabase.from('saved_products').upsert({
      user_id: authenticatedUserId,
      product_id: productId,
      affiliate_url: parsedUrl.toString(),
    }, { onConflict: 'user_id,product_id' });
    if (error) throw new Error('Não foi possível salvar o link. Tente novamente.');
    setAffiliateLinks((currentLinks) => ({
      ...currentLinks,
      [productId]: parsedUrl.toString(),
    }));
  }

  if (!authReady && currentPath !== defaultPath && currentPath !== offerPath) return <DelayedAuthLoading />;

  if (currentPath === defaultPath || currentPath === offerPath) {
    return <SalesPage key={currentPath} onNavigate={navigate} products={catalogProducts} promotionApplied={currentPath === offerPath} />;
  }

  if (currentPath === '/entrar') {
    return (
      <LoginFrontendRoute
        mode="login"
        onNavigate={navigate}
        onAuthenticate={authenticate}
        onComplete={completeAuthentication}
      />
    );
  }

  if (currentPath === '/criar-conta') {
    return (
      <LoginFrontendRoute
        mode="signup"
        onNavigate={navigate}
        onAuthenticate={authenticate}
        onComplete={completeAuthentication}
      />
    );
  }

  return (
    <div className="app-shell">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onCollapse={() => setSidebarCollapsed(true)}
        onExpand={() => setSidebarCollapsed(false)}
        activePath={activeNavigationPath}
        onNavigate={navigate}
        onOpenSettings={() => {
          setSettingsOpen(true);
        }}
        onLogout={logout}
        account={accountProfile}
      />

      <main
        className={`main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
        aria-label={sidebarItems.find((item) => item.path === activeNavigationPath)?.label}
      >
        <button
          className="mobile-menu"
          aria-label="Abrir menu"
          aria-expanded={sidebarOpen}
          aria-controls="app-navigation"
          onClick={() => {
            setSidebarOpen(true);
          }}
        >
          <Icon icon={Menu01Icon} />
        </button>

        {currentPath === '/novo' && <PromoteProductPage affiliateLinks={affiliateLinks} products={catalogProducts} onSaveLink={saveAffiliateLink} />}
        {currentPath === '/produtos' && (
          <ProductsPage affiliateLinks={affiliateLinks} onSaveLink={saveAffiliateLink} products={catalogProducts} />
        )}
        {currentPath === '/meus-produtos' && <MyProductsPage affiliateLinks={affiliateLinks} products={catalogProducts} />}
      </main>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        sidebarCollapsed={sidebarCollapsed}
        onSidebarChange={setSidebarCollapsed}
        onLogout={logout}
        account={accountProfile}
      />
    </div>
  );
}

export default App;
