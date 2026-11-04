import {unique} from './core.mjs';
export function etaInvoiceIds(text){
 return unique([...text.matchAll(/\bInternal\s+ID\s*:\s*([A-Z0-9][A-Z0-9._/-]{2,79})/gi)].map(m=>m[1].toUpperCase()).filter(id=>/\d/.test(id)));
}
export function etaPageInfo(text){const ids=etaInvoiceIds(text);return {etaInvoice:ids.length===1?ids[0]:'',etaCandidates:ids,etaStatus:text.match(/\bStatus\s*:\s*(Valid|Rejected|Cancelled|Submitted)/i)?.[1]||''};}
export async function readETAImage(worker,images,knownInvoices=new Set()){
 const candidates=[];await worker.setParameters({tessedit_char_whitelist:''});for(const image of images)for(const psm of ['6','11','3']){await worker.setParameters({tessedit_pageseg_mode:psm});const data=(await worker.recognize(image)).data,info=etaPageInfo(data.text);candidates.push(...info.etaCandidates);if(info.etaInvoice&&knownInvoices.has(info.etaInvoice))return {...info,confidence:data.confidence};}
 const ids=unique(candidates);return {etaInvoice:ids.length===1?ids[0]:'',etaCandidates:ids,etaStatus:''};
}
