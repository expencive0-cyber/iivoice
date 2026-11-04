export function normalizeCustomer(name){return name.normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('en');}
export function safeFilename(name){let s=name.normalize('NFC').replace(/[\u0000-\u001F<>:"/\\|?*]/g,' ').replace(/\s+/g,' ').replace(/[. ]+$/,'').trim();if(!s)s='Customer';if(/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(s))s='_'+s;return [...s].slice(0,160).join('');}
export function groupCustomers(groups,overrides=new Map()){
 const customers=new Map();for(const g of groups){const name=(overrides.get(g.id)??g.customerName).trim()||'Customer '+g.id,key=normalizeCustomer(name);if(!customers.has(key))customers.set(key,{name,groups:[],pages:0});const c=customers.get(key);c.groups.push(g);c.pages+=g.pages;}
 const names=new Set();for(const c of customers.values()){const base=safeFilename(c.name);let name=base,n=2;while(names.has(name.toLocaleLowerCase('en')))name=base+' ('+n+++')';names.add(name.toLocaleLowerCase('en'));c.filename=name+'.pdf';}return [...customers.values()];
}
