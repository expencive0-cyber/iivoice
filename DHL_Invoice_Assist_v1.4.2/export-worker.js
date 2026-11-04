/* The original page contents are copied, never rasterized or rewritten. */
importScripts('./vendor/pdf-lib.min.js','./vendor/jszip.min.js');
const waiting=new Map();let cache=new Map(),activeJob;
async function source(id){if(cache.has(id)){const pdf=cache.get(id);cache.delete(id);cache.set(id,pdf);return pdf;}const bytes=await new Promise((resolve,reject)=>{waiting.set(id,{resolve,reject});self.postMessage({type:'need-source',id});});const pdf=await PDFLib.PDFDocument.load(bytes);cache.set(id,pdf);if(cache.size>3)cache.delete(cache.keys().next().value);return pdf;}
async function assemble(records){
 const out=await PDFLib.PDFDocument.create(),slots=[],bySource=new Map();let count=0;
 for(const r of records)for(const index of r.indices){if(!bySource.has(r.sourceId))bySource.set(r.sourceId,[]);bySource.get(r.sourceId).push({index,position:count++});}
 let completed=0;for(const [id,list]of bySource){const input=await source(id),pages=await out.copyPages(input,list.map(x=>x.index));pages.forEach((p,i)=>slots[list[i].position]=p);completed+=pages.length;self.postMessage({type:'progress',pages:completed,total:count});}
 for(const page of slots)out.addPage(page);if(out.getPageCount()!==count)throw Error('Page completeness check failed.');out.setTitle('DHL Invoice Assist — Organized invoice documents');out.setProducer('DHL Invoice Assist v1.4.2');return out.save();
}
self.onmessage=async({data})=>{
 if(data.type==='source'){const pending=waiting.get(data.id);if(pending){waiting.delete(data.id);data.error?pending.reject(Error(data.error)):pending.resolve(new Uint8Array(data.bytes));}return;}
 if(data.type!=='export')return;
 if(activeJob){self.postMessage({type:'error',error:'An export is already running.'});return;}activeJob=data;cache=new Map();
 try{let bytes;if(data.zip){const zip=new JSZip();for(const file of data.files){self.postMessage({type:'file',name:file.name});zip.file(file.name,await assemble(file.records));}for(const file of data.textFiles||[])zip.file(file.name,file.text);bytes=await zip.generateAsync({type:'uint8array',compression:'STORE',streamFiles:true});}else bytes=await assemble(data.files[0].records);
  self.postMessage({type:'done',bytes:bytes.buffer},[bytes.buffer]);
 }catch(e){self.postMessage({type:'error',error:e.message});}finally{cache.clear();activeJob=null;}
};
