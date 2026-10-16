// Il catalogo esterno o un servizio AI potranno essere collegati qui, mantenendo i filtri locali.
export async function loadCatalog(){const r=await fetch('./catalog.json');if(!r.ok)throw Error('Non riesco a caricare il catalogo. Riprova tra poco.');return r.json();}
export function eligible(catalog,state,ids,platform=''){
 const people=state.profiles.filter(p=>ids.includes(p.id));if(!people.length)return [];
 const age=Math.min(...people.map(p=>p.age));
 return catalog.filter(t=>t.age<=age&&t.platforms.some(p=>state.platforms.includes(p)&&(!platform||platform===p))&&!people.some(p=>Object.hasOwn(p.ratings,t.id)));
}
export function affinity(title,person,catalog){
 const category=title.genres.reduce((a,g)=>a+(person.tastes[g]??0),0)/title.genres.length;
 const known=catalog.filter(t=>person.ratings[t.id]!==undefined&&person.ratings[t.id]!==2);
 const learned=known.reduce((sum,t)=>sum+person.ratings[t.id]*title.genres.filter(g=>t.genres.includes(g)).length*.3,0);
 return category+Math.max(-1,Math.min(1,learned));
}
export function recommend(catalog,state,ids,mood,platform,skip=[]){
 const people=state.profiles.filter(p=>ids.includes(p.id));
 let pool=eligible(catalog,state,ids,platform).filter(t=>!skip.includes(t.id));
 if(mood==='short')pool=pool.filter(t=>t.minutes<=45);
 const target={laugh:['commedia'],light:['family','commedia','animazione'],tension:['thriller','crime','azione'],long:['fantasy','drammatico'],surprise:[]}[mood]??[];
 const score=t=>{const vals=people.map(p=>affinity(t,p,catalog));const mean=vals.reduce((a,b)=>a+b,0)/vals.length;
 // Il gusto meno soddisfatto pesa quanto la media: nessun profilo domina la serata.
 return mean*.5+Math.min(...vals)*.5+(t.genres.some(g=>target.includes(g))?1:0)-(state.exposures[t.id]??0)*.7;};
 pool.sort((a,b)=>score(b)-score(a)||a.id.localeCompare(b.id));
 const picks=[];if(pool.length)picks.push(pool.shift());
 if(pool.length){let i=pool.findIndex(t=>!picks[0].genres.every(g=>t.genres.includes(g)));if(i<0)i=0;picks.push(pool.splice(i,1)[0]);}
 if(pool.length){pool.sort((a,b)=>{const novelty=t=>t.genres.filter(g=>!picks.some(x=>x.genres.includes(g))).length+score(t)*.25;return novelty(b)-novelty(a);});picks.push(pool[0]);}return picks;
}
export function reason(t,people){return people.map(p=>{const liked=t.genres.filter(g=>(p.tastes[g]??0)>0);const disliked=t.genres.filter(g=>(p.tastes[g]??0)<0);return `${p.name}: ${liked.length?'ritrova '+liked.join(' e '):disliked.length?'un compromesso, con elementi di '+disliked.join(' e '):'un’occasione per scoprire '+t.genres[0]}`;}).join(' · ');}
