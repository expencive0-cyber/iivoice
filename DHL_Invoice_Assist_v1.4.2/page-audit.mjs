// Every imported page is an occurrence: even identical files have distinct source IDs.
export function auditPages(records,sources){
 const counts=new Map(),invalid=[];
 for(const r of records)for(const index of r.indices){const source=sources.get(r.sourceId);if(!source||!Number.isInteger(index)||index<0||index>=source.pageCount){invalid.push({sourceId:r.sourceId,index});continue;}const key=r.sourceId+':'+index;counts.set(key,(counts.get(key)||0)+1);}
 const missing=[],duplicated=[];let expected=0;
 for(const [sourceId,source]of sources){expected+=source.pageCount;for(let i=0;i<source.pageCount;i++){const count=counts.get(sourceId+':'+i)||0;if(count===0)missing.push({sourceId,index:i});else if(count>1)duplicated.push({sourceId,index:i,count});}}
 return {ok:!missing.length&&!duplicated.length&&!invalid.length,expected,actual:records.reduce((s,r)=>s+r.indices.length,0),missing,duplicated,invalid};
}
