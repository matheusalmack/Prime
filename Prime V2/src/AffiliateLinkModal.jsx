import React,{useId,useState} from 'react';
import {ArrowUpRight} from 'lucide-react';
import Modal,{ModalCloseButton} from './Modal';
import {notify} from './Alerts';
export default function AffiliateLinkModal({product,value,onChange,onSubmit,onClose,editing=false,saving=false,error='',overlayClassName=''}){
 const fieldId=useId(),[copyStatus,setCopyStatus]=useState('');
 async function copyProductLink(){try{await navigator.clipboard.writeText(product.source_url);setCopyStatus('')}catch{notify('Não foi possível copiar o link');setCopyStatus('Não foi possível copiar o link')}}
 return <Modal label="Obter link do produto" mobileBack={false} className="supplier-modal affiliate-link-sheet" overlayClassName={overlayClassName} onClose={onClose}>
 <ModalCloseButton className="supplier-modal-close" onClick={onClose}/>
 <h2>{editing?'Editar link':'Obter link'}</h2>
 <div className="affiliate-tutorial"><p>Como gerar seu link de afiliado</p><ol><li>Abra o conversor para copiar o link do produto.</li><li>Cole em <strong>Link personalizado</strong> e gere seu link.</li><li>Volte, cole seu link abaixo e clique em <strong>Salvar</strong>.</li></ol></div>
 <a className="affiliate-converter" href="https://affiliate.shopee.com.br/offer/custom_link" target="_blank" rel="noreferrer" onClick={copyProductLink}>Abrir conversor de afiliado<ArrowUpRight size={15}/></a>
 {copyStatus.startsWith('Não')&&<div className="affiliate-copy-status"><input aria-label="Link do produto para copiar" readOnly value={product.source_url} onFocus={e=>e.target.select()}/></div>}
 <form onSubmit={onSubmit} autoComplete="on"><label htmlFor={fieldId}>Seu link de afiliado</label><input id={fieldId} autoFocus autoComplete="on" type="url" required placeholder="Cole aqui seu link de afiliado da Shopee" value={value} onChange={e=>onChange(e.target.value)} aria-invalid={!!error}/>{error&&<p className="affiliate-copy-status" role="alert">{error}</p>}<div className="affiliate-modal-actions"><button type="button" onClick={onClose}>Cancelar</button><button type="submit" disabled={saving}>{saving?'Salvando…':'Salvar'}</button></div></form>
 </Modal>;
}
