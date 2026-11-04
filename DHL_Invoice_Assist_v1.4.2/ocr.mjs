export function readOCRReferences(text,knownAWBs,knownReferences=new Map()){
 const refs=[];const re=/(?:\bAWB\s*(?:No\.?|Number)?|\bWAYBILL)[\s:#.-]*((?:\d[ \t-]*){10})(?![ \t-]*\d)/gi;
 for(const m of text.matchAll(re)){const id=m[1].replace(/\D/g,'');if(knownAWBs.has(id))refs.push(id);}
 const commercial=/\b(?:COMMERCIAL\s+INVOICE|INVOICE\s*(?:[NU]?UMBER|NO\.?))\b/i.test(text);
 let method='awb-label';
 if(!refs.length){method='known-number';for(const id of knownAWBs){const numberPattern=new RegExp('(?<![A-Z0-9])'+id.split('').join('[ \\t-]*')+'(?!\\d)','i');if(numberPattern.test(text))refs.push(id);}}
 if(!refs.length&&commercial){method='commercial-reference';for(const [ref,ids] of knownReferences)if(ids.size===1&&new RegExp('\\b'+ref.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b','i').test(text))refs.push([...ids][0]);}
 const candidates=[...new Set(refs)];return {awb:candidates.length===1?candidates[0]:'',candidates,method,kind:commercial?'commercial':'waybill'};
}
export function readHeaderReference(text,knownAWBs=new Set()){
 let method='top-right-awb';const refs=[...text.matchAll(/\bAWB\s*(?:No\.?|Number)?[\s:#.-]*((?:\d[ \t-]*){10})(?![ \t-]*\d)/gi)].map(m=>m[1].replace(/\D/g,''));
 // Some DHL header stamps omit "AWB No." but retain the 10-digit number followed by Page.
 if(!refs.length&&!/\bPID\b/i.test(text)){method='top-right-number';for(const m of text.matchAll(/(?:^|[^\d])((?:\d[ \t-]*){10})[ \t]*(?:Page|Pg)\.?[ \t]+\d+\b/gi)){const id=m[1].replace(/\D/g,'');if(knownAWBs.has(id))refs.push(id);}}
 const candidates=[...new Set(refs)];return {awb:candidates.length===1?candidates[0]:'',candidates,method,kind:'waybill'};
}
export class LocalOCR{
 constructor({createWorker=globalThis.Tesseract?.createWorker,options}={}){this.createWorker=createWorker;this.options=options;this.worker=null;}
 async init(){if(this.worker)return;const root=new URL('./vendor/ocr/',import.meta.url);const options=this.options||{workerPath:new URL('worker.min.js',root).href,corePath:root.href,langPath:root.href.replace(/\/$/,''),workerBlobURL:false,gzip:false,cacheMethod:'none'};this.worker=await this.createWorker('eng',1,options);await this.worker.setParameters({tessedit_pageseg_mode:'3'});}
 async readHeader(headers,knownAWBs){
  await this.init();
  // Read the label in the upper-right corner first. Never interpret PID as AWB.
  for(const header of headers)for(const psm of ['6','7']){
   await this.worker.setParameters({tessedit_pageseg_mode:psm});const data=(await this.worker.recognize(header)).data,refs=readHeaderReference(data.text,knownAWBs);
   if(refs.candidates.length)return {...refs,confidence:data.confidence};
  }
  return {awb:'',candidates:[],method:'header-unresolved',kind:'waybill'};
 }
 async readBody(image,knownAWBs,knownReferences,variants=[]){
  await this.init();await this.worker.setParameters({tessedit_pageseg_mode:'3'});let data=(await this.worker.recognize(image)).data;let refs=readOCRReferences(data.text,knownAWBs,knownReferences);
  // Ambiguous evidence stays unresolved; another crop must not erase a conflict.
  if(!refs.candidates.length){for(const psm of ['11','6']){await this.worker.setParameters({tessedit_pageseg_mode:psm});const second=(await this.worker.recognize(image)).data,other=readOCRReferences(second.text,knownAWBs,knownReferences);if(other.candidates.length)return {...other,confidence:second.confidence};}const rest=typeof variants==='function'?variants():variants;for(const input of rest)for(const psm of ['11','6']){await this.worker.setParameters({tessedit_pageseg_mode:psm});const second=(await this.worker.recognize(input)).data,other=readOCRReferences(second.text,knownAWBs,knownReferences);if(other.candidates.length)return {...other,confidence:second.confidence};}}
  return {...refs,confidence:data.confidence};
 }
 async read(image,knownAWBs,knownReferences,variants=[],headers=[]){const header=await this.readHeader(headers,knownAWBs);return header.candidates.length?header:this.readBody(image,knownAWBs,knownReferences,variants);}
 async close(){if(this.worker){await this.worker.terminate();this.worker=null;}}
}
