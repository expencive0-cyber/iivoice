export function exportInWorker(job,sources,onProgress=()=>{}){
 return new Promise((resolve,reject)=>{
  const worker=new Worker(new URL('./export-worker.js',import.meta.url)),finish=(error,result)=>{worker.terminate();error?reject(error):resolve(result);};
  worker.onerror=e=>finish(Error(e.message||'Export worker failed.'));
  worker.onmessage=async({data})=>{if(data.type==='need-source'){try{const source=sources.get(data.id);if(!source)throw Error('Missing source file.');const bytes=source.blob?await source.blob.arrayBuffer():source.bytes.slice().buffer;worker.postMessage({type:'source',id:data.id,bytes},[bytes]);}catch(e){worker.postMessage({type:'source',id:data.id,error:e.message});}}else if(data.type==='done')finish(null,new Uint8Array(data.bytes));else if(data.type==='error')finish(Error(data.error));else onProgress(data);};worker.postMessage({type:'export',...job});
 });
}
