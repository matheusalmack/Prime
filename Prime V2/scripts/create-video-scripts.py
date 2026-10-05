"""Materialize five short, editable scripts for every catalog product."""
import json, re, unicodedata
from pathlib import Path
root = Path(__file__).resolve().parents[1]
products = json.loads((root/'src/products.json').read_text())
def norm(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s.lower()) if not unicodedata.combining(c))
# Natural short names, rather than cutting the long marketplace titles mid-phrase.
rules = [
(r'talheres.*bebe', 'kit de talheres para bebe'),
(r'suedine', 'conjunto de roupas para bebe'),
(r'cotoveleira', 'cotoveleira para treino'),
(r'conjuntos infantis', 'conjunto infantil'),
(r'(organizador|armazenamento|almofada).*(carro|geely|byd|console)', 'organizador para o carro'),
(r'fone|earphone|headphone|airdots', 'fone de ouvido Bluetooth'),
(r'cueiro', 'cueiro para o bebe'),
(r'toalhas? umedecid|lencos? umedecid', 'lencos umedecidos para bebe'),
(r'fraldas? de pano', 'fraldas de pano para bebe'),
(r'prendedor de chupeta', 'prendedor de chupeta infantil'),
(r'chupeta.*aliment|mordedor.*frut|porta frutas', 'chupeta alimentadora para bebe'),
(r'chupeta|pacifier', 'chupeta para o bebe'),
(r'chocalho|mordedor', 'kit de brinquedos para bebe'),
(r'almofada.*(bebe|cabeca)|apoio.*bebe', 'almofada de pescoco para bebe'),
(r'joelheira.*bebe', 'joelheira para bebe engatinhar'),
(r'toalha.*(bebe|infantil)|roupao', 'toalha infantil com capuz'),
(r'cortador.*unha|lixa.*bebe', 'aparador de unhas para bebe'),
(r'higiene.*bebe|bebe.*higiene', 'kit de higiene para bebe'),
(r'trocador', 'trocador para o bebe'),
(r'canguru|hipseat|banco de cintura', 'canguru para passeio com bebe'),
(r'manta.*bebe|mantinha|cobertor.*bebe', 'manta para o bebe'),
(r'saida.*maternidade', 'kit de saida de maternidade'),
(r'body|bodie|pagao|mijao', 'conjunto de roupas para bebe'),
(r'macacao|macacoes', 'macacao para o bebe'),
(r'meias.*bebe', 'kit de meias para bebe'),
(r'sapat|tenis.*bebe', 'sapatinho para o bebe'),
(r'pomada.*baby', 'pomada para cuidados do bebe'),
(r'vestido', 'vestido feminino'),
(r'calca', 'calca infantil'),
(r'camiseta.*infantil|camisa.*infantil', 'camiseta infantil'),
(r'short.*infantil|bermuda.*infantil', 'bermuda infantil'),
(r'roupa.*infantil|conjunto.*(infantil|menina|menino|bebe)|regata.*bebe', 'conjunto infantil'),
(r'camiseta|camisa|t-shirt', 'camiseta para o dia a dia'),
(r'luva|grip', 'luva para treino na academia'),
(r'joelheira', 'joelheira para treino'),
(r'munhequeira', 'munhequeira para treino'),
(r'ombreira', 'suporte para o ombro'),
(r'strap|strep', 'strap para musculacao'),
(r'coxal', 'manga de compressao para coxa'),
(r'puxador', 'kit de puxadores para musculacao'),
(r'colchonete', 'colchonete para exercicios'),
(r'elastic|bands', 'elastico para exercicios'),
(r'plaquinha|identificacao.*pet', 'plaquinha de identificacao para pet'),
(r'peitoral|coleira.*guia|guia.*coleira', 'peitoral com guia para pet'),
(r'coleira|colar.*cachorro', 'coleira para pet'),
(r'roupinha|roupa.*(cachorro|pet)|camiseta pet', 'roupinha para pet'),
(r'toca|caminha|cama.*cachorro', 'caminha para pet'),
(r'manta.*pet|cobertor.*pet', 'manta para pet'),
(r'bandana|lenco.*caes', 'bandana para pet'),
(r'laco.*pet', 'laco para pet'),
(r'adesivo.*pet|sticker.*pet', 'adesivos para pet'),
(r'focinheira', 'focinheira para cachorro'),
(r'rede.*(gato|cachorro)', 'rede de contencao para pet'),
(r'serum|seruns', 'serum facial'),
(r'argila', 'argila para cuidados faciais'),
(r'tonico|tranexamico.*90', 'tonico facial'),
(r'gel.*limpeza', 'gel de limpeza facial'),
(r'mascara.*facial|mascaras.*facial|fresh mask', 'mascara facial'),
(r'hidratante|creme facial|cream', 'hidratante facial'),
(r'mandelico|glicolico', 'produto para cuidados faciais'),
(r'skin.?care|dolomita|rosa mosqueta', 'kit de cuidados faciais'),
(r'fruteira', 'fruteira para a cozinha'),
(r'potes?|hermetic', 'kit de potes para cozinha'),
(r'condimento|tempero', 'organizador de temperos'),
(r'porta talher|utensilio', 'porta talheres para cozinha'),
(r'escorredor', 'escorredor de loucas'),
(r'organizador.*tamp|suporte.*tamp', 'organizador de tampas de panela'),
(r'porta xicar|suporte.*xicara', 'suporte para xicaras'),
(r'prato', 'organizador de pratos'),
(r'geladeira', 'organizador de geladeira'),
(r'carrinho.*organizador', 'carrinho organizador'),
(r'organizador|organizadora|cesto|prateleira|suporte.*cozinha', 'organizador para a casa'),
(r'central.*multimidia|multimidia|mp5', 'tela multimidia para carro'),
(r'suporte.*(celular|telefone|tablet)|carregador.*fio', 'suporte de celular para carro'),
(r'copo.*carro|carro.*copo|coaster', 'acessorio para copo do carro'),
(r'oculos', 'porta oculos para carro'),
(r'aromat|cheirinho', 'aromatizador para carro'),
(r'lixeira', 'lixeira para carro'),
(r'apoio.*braco|descanso.*braco', 'apoio de braco para carro'),
(r'pelicula|filme.*vinil', 'pelicula decorativa para carro'),
(r'emblema|logotipo|logo.*carro', 'emblema decorativo para carro'),
(r'adesivo|decalque|stier', 'adesivo decorativo para carro'),
(r'gancho|encosto.*cabeca', 'gancho organizador para carro'),
(r'carro|geely|volkswagen|byd', 'acessorio para o carro'),
]
# Restore Portuguese accents in the phrases used above.
accents={'bebe':'bebê','lencos':'lenços','pescoco':'pescoço','saida':'saída','macacao':'macacão','musculacao':'musculação','elastico':'elástico','exercicios':'exercícios','identificacao':'identificação','laco':'laço','contencao':'contenção','serum':'sérum','tonico':'tônico','mascara':'máscara','loucas':'louças','xicaras':'xícaras','multimidia':'multimídia','acessorio':'acessório','oculos':'óculos','braco':'braço','pelicula':'película'}
def accented(label):
    return ' '.join(accents.get(w,w) for w in label.split())
templates=[
'Olha só: {label}. Veja os detalhes de perto e descubra se essa opção combina com o que você procura.',
'Procurando {label}? Antes de escolher, confira o visual e os detalhes dessa opção. O link está disponível para conhecer melhor.',
'Esse achado merece atenção: {label}. Confira os detalhes comigo e veja se faz sentido para o seu dia a dia.',
'Uma opção para sua lista: {label}. Vou mostrar de perto para você comparar os detalhes e escolher com mais calma.',
'Já conhece {label}? Confira os detalhes dessa opção e veja o link para saber mais antes de fazer sua escolha.',
]
result={};unmatched=[]
for p in products:
    name=norm(p['name']);label=next((label for regex,label in rules if re.search(regex,name)),None)
    if not label:
        unmatched.append(p['name']);continue
    label=accented(label)
    # Keep a concrete model, brand or visible catalog characteristic when available.
    if 'fone de ouvido' in label:
        model=re.search(r'\b(x15|x55|m10|m25|q19|q71|d68|p9|p47|j760|air31|e6s|i12|inpods|ows-15|ky2|kd-4219)\b',name)
        if model: label+=' '+model[0].upper()
    elif label=='vestido feminino':
        for attr in ['longo','midi','curto','chemise','plus size']:
            if attr in name:label+=' '+attr;break
    elif label=='sérum facial':
        if 'retinol' in name:label+=' com retinol'
        elif 'niacinamida' in name:label+=' com niacinamida'
        elif 'vitamina c' in name:label+=' com vitamina C'
        elif 'pdrn' in name:label+=' PDRN'
    elif label=='hidratante facial' and 'creamy' in name:label+=' Creamy'
    elif label=='conjunto infantil':
        if 'verao' in name:label+=' de verão'
        elif 'inverno' in name:label+=' de inverno'
    elif label=='camiseta para o dia a dia':
        if 'personaliz' in name:label='camiseta personalizada'
        elif 'oversized' in name:label='camiseta oversized'
        elif 'dry' in name:label='camiseta dry fit'
        elif 'insider' in name:label='camiseta Daily Insider'
    if len(label.split())<3: label+=' do catálogo'
    assert 3<=len(label.split())<=6,(p['id'],label)
    scripts=[t.format(label=label) for t in templates]
    assert len(set(scripts))==5
    assert all(20<=len(s.split())<=25 for s in scripts),(p['id'],scripts)
    result[p['id']]=scripts
assert not unmatched,unmatched
assert len(result)==len(products)==500
(root/'src/video-scripts.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(f'{len(result)} produtos, {sum(map(len,result.values()))} roteiros. Todos com 20–25 palavras.')
print('\n'.join(result[products[0]['id']]))
