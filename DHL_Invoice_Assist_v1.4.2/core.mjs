export const unique = a => [...new Set(a)];
export function invoiceIds(text){
 const labeled=[...text.matchAll(/(?:Invoice\s*(?:Number|No\.?)|Rechnungsnummer|Num[eé]ro\s+de\s+facture|N[uú]mero\s+de\s+factura)\s*:?\s*([A-Z0-9][A-Z0-9/-]{3,39})/gi)].map(m=>m[1].toUpperCase()).filter(id=>/\d/.test(id));
 const observed=text.toUpperCase().match(/\b(?:CAIR\d{9}|CAIIR\d{8})\b/g)||[];
 return unique(labeled.length?labeled:observed.length?observed:(text.toUpperCase().match(/\b[A-Z]{2,6}\d{6,14}\b/g)||[]));
}
export function validInvoiceId(value){return /^[\p{L}\p{N}][\p{L}\p{N}._/-]{2,79}$/u.test(value);}
export function filenameInfo(name){
 const base=name.split(/[\\/]/).pop();const invoices=invoiceIds(base);
 const match=base.match(/^(\d{10})(?=[_^.])/);const awb=match?.[1]||'';
 return {invoice:invoices.length===1?invoices[0]:'',awb,kind:invoices.length?'billing':/_INV_/i.test(base)?'commercial':/_AWB_/i.test(base)?'waybill':'support'};
}
export function pageInfo(content,width,height=width*1.414){
 const items=content.items.filter(x=>typeof x.str==='string');const text=items.map(x=>x.str).join(' ');
 // Read the invoice-number field geometrically: PDF text can list all labels before all values.
 const fields=[];for(const label of items.filter(x=>/^(?:Invoice\s*(?:Number|No\.?)|Rechnungsnummer|Num[eé]ro\s+de\s+facture|N[uú]mero\s+de\s+factura)\s*:?\s*$/i.test(x.str.trim()))){const value=items.filter(x=>validInvoiceId(x.str.trim())&&/\d/.test(x.str)&&Math.abs(x.transform[5]-label.transform[5])<2.5&&x.transform[4]>label.transform[4]+(label.width||0)*.75&&x.transform[4]-label.transform[4]<width*.5).sort((a,b)=>a.transform[4]-b.transform[4])[0];if(value)fields.push(value.str.trim().toUpperCase());}
 const ids=fields.length?unique(fields):invoiceIds(text),account=/(?:Account\s+Number|Kundennummer|Num[eé]ro\s+de\s+compte|N[uú]mero\s+de\s+cuenta)/i.test(text),pagesLabel=/Number\s+of\s+Pages/i.test(text);
 const isBill=/(?:INVOICE|RECHNUNG|FACTURE|FACTURA)/i.test(text)&&ids.length===1&&account&&(pagesLabel||/(?:DHL|mybill\.dhl)/i.test(text));
 // This rule is restricted to the observed DHL billing table layout: AWB column at the left edge.
 const tableAWBs=isBill&&/Air\s*Waybill/i.test(text)?unique(items.filter(x=>x.transform[4]<width*.085&&x.transform[5]<width*1.2&&/^\d{10}$/.test(x.str.trim())).sort((a,b)=>b.transform[5]-a.transform[5]||a.transform[4]-b.transform[4]).map(x=>x.str.trim())):[];
 const compactLabel=text.match(/(?:WAYBILL|AWB\s*(?:NO\.?|NUMBER)?)[\s:#-]+((?:\d[ -]*){10})(?!\d)/i);
 const barcode=text.match(/#BarCode,Code39,(\d{10}),/i);
 const headerText=items.filter(x=>x.transform[4]>=width*.4&&x.transform[5]>=height*.88).sort((a,b)=>b.transform[5]-a.transform[5]||a.transform[4]-b.transform[4]).map(x=>x.str).join(' ');
 const headerMatch=headerText.match(/\bAWB\s*(?:No\.?|Number)?[\s:#.-]*((?:\d[ \t-]*){10})(?![ \t-]*\d)/i);
 const headerAWB=headerMatch?.[1].replace(/\D/g,'')||'';
 const awb=isBill?'':headerAWB||barcode?.[1]||compactLabel?.[1].replace(/\D/g,'')||'';
 const numbering=isBill?text.match(/\b(\d+)\s+of\s+(\d+)\b/i):null;
 const tableReferences=[];for(const id of tableAWBs){const a=items.find(x=>x.str.trim()===id&&x.transform[4]<width*.085);if(!a)continue;const ref=items.find(x=>Math.abs(x.transform[5]-a.transform[5])<2.5&&x.transform[4]>=width*.06&&x.transform[4]<width*.14&&/^[A-Z0-9-]{5,25}$/i.test(x.str.trim()));if(ref)tableReferences.push({awb:id,reference:ref.str.trim()});}
 const recipient=items.filter(x=>x.transform[4]>width*.04&&x.transform[4]<width*.48&&x.transform[5]>height*.70&&x.transform[5]<height*.92&&x.str.trim()).sort((a,b)=>b.transform[5]-a.transform[5]||a.transform[4]-b.transform[4]);
 const first=recipient[0],customerName=isBill&&Number(numbering?.[1]||1)===1&&first?recipient.filter(x=>Math.abs(x.transform[5]-first.transform[5])<2).map(x=>x.str.trim()).join(' '):'';
 return {text,invoice:isBill?ids[0]:'',tableAWBs,tableReferences,awb,headerAWB:isBill?'':headerAWB,customerName,serviceInvoice:isBill&&/LOGISTICS\s+SERVICES/i.test(text),invoicePage:Number(numbering?.[1]||0),invoiceTotal:Number(numbering?.[2]||0),kind:isBill?'billing':awb?'waybill':'support'};
}
export function reconcile(records){
 const invoices=new Map();const awbMap=new Map();
 for(const r of records)if(r.kind==='billing'&&r.invoice){
  if(!invoices.has(r.invoice))invoices.set(r.invoice,{id:r.invoice,bills:[],etas:[],docs:[],expected:[],missing:[],pages:0});
  const g=invoices.get(r.invoice);g.bills.push(r);
 }
 for(const g of invoices.values()){g.bills.sort((a,b)=>(a.invoicePage||0)-(b.invoicePage||0)||a.id-b.id);for(const r of g.bills)g.expected=unique([...g.expected,...r.tableAWBs]);g.customerName=g.bills.find(r=>r.customerName)?.customerName||'';g.serviceInvoice=!g.expected.length&&g.bills.some(r=>r.serviceInvoice);}
 for(const g of invoices.values())for(const awb of g.expected){if(!awbMap.has(awb))awbMap.set(awb,new Set());awbMap.get(awb).add(g.id);}
 for(const r of records){
  if(r.kind==='billing')continue;
  if(r.kind==='eta'){r.invoice=invoices.has(r.etaInvoice)?r.etaInvoice:'';r.awb='';r.reason=r.invoice?'ETA مرتبط برقم الفاتورة فقط':'ETA بدون فاتورة مطابقة في المصدر';if(r.invoice)invoices.get(r.invoice).etas.push(r);continue;}
  if(!r.manual){const targets=r.blocked?null:awbMap.get(r.awb),context=targets?.size>1&&targets.has(r.sourceInvoice)?r.sourceInvoice:'';r.invoice=targets?.size===1?[...targets][0]:context;r.reason=r.blocked?'تعارض بين اسم المستند ومحتواه':context?'رقم البوليصة وسياق الفاتورة في المصدر':r.invoice?(r.ocrMethod?.startsWith('top-right')?'قراءة AWB أعلى اليمين وربط بجدول الفاتورة':r.ocr?'قراءة صورة وربط بجدول الفاتورة':'مرتبط بجدول الفاتورة'):targets?.size>1?'رقم البوليصة وارد في أكثر من فاتورة':r.awb?'رقم البوليصة غير مرتبط بفاتورة في الملفات':'لا يوجد رقم بوليصة موثوق';}
  if(r.invoice&&invoices.has(r.invoice))invoices.get(r.invoice).docs.push(r);
 }
 for(const g of invoices.values()){
  const found=new Set(g.docs.map(r=>r.awb)),waybills=new Set(g.docs.filter(r=>r.kind==='waybill').map(r=>r.awb));g.counts=new Map();for(const r of g.docs){if(!g.counts.has(r.awb))g.counts.set(r.awb,{waybill:0,commercial:0,support:0});g.counts.get(r.awb)[r.kind]++;}
  g.missing=g.expected.filter(awb=>!found.has(awb));
  g.etas.sort((a,b)=>a.id-b.id);g.etaPages=g.etas.reduce((s,r)=>s+r.indices.length,0);g.pages=[...g.bills,...g.etas,...g.docs].reduce((s,r)=>s+r.indices.length,0);
  g.missingWaybills=g.expected.filter(awb=>!waybills.has(awb));
  g.manualOutsideTable=g.docs.some(r=>r.manual&&(!r.awb||!g.expected.includes(r.awb)));
  g.review=false;
 }
 return {groups:[...invoices.values()],unmatched:records.filter(r=>!r.invoice||!invoices.has(r.invoice))};
}
export function parseExportPayload(raw){
 const params=new URLSearchParams(raw.trim());const entries=params.getAll('docid');
 if(!entries.length)throw Error('لم يتم العثور على docid. انسخ Form Data باستخدام View source.');
 const pattern=/^[0-9A-F]{8}-[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}-\d{8}$/i;
 const invalid=entries.filter(v=>!pattern.test(v));if(invalid.length)throw Error('بعض معرّفات المستندات لا تطابق صيغة DHL المشاهدة.');
 const ids=unique(entries);return {count:entries.length,uniqueCount:ids.length,duplicates:entries.length-ids.length,otherFieldCount:[...params.keys()].filter(k=>k!=='docid').length};
}
export function orderedRecords(group,order='invoice-first'){
 const rank={waybill:0,commercial:1,support:2};
 const positions=new Map(group.expected.map((awb,i)=>[awb,i]));
 const docs=[...group.docs].sort((a,b)=>(positions.get(a.awb)??Number.MAX_SAFE_INTEGER)-(positions.get(b.awb)??Number.MAX_SAFE_INTEGER)||(a.awb!==b.awb?(a.awb||'~').localeCompare(b.awb||'~'):0)||(rank[a.kind]??3)-(rank[b.kind]??3)||a.id-b.id||a.indices[0]-b.indices[0]);
 const bills=[...group.bills].sort((a,b)=>(a.invoicePage||0)-(b.invoicePage||0)||a.id-b.id||a.indices[0]-b.indices[0]);
 return [...bills,...(group.etas||[]),...docs];
}
