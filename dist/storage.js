// Unico punto di accesso ai dati. Un futuro adattatore Supabase può esporre gli stessi metodi asincroni.
const KEY='cosa-guardiamo-v1';
export const empty=()=>({version:1,profiles:[],platforms:[],history:[],pending:null,exposures:{},onboarded:false});
const plain=x=>x&&typeof x==='object'&&!Array.isArray(x);
export function validate(x){
 if(!plain(x)||x.version!==1||!Array.isArray(x.profiles)||!Array.isArray(x.platforms)||!Array.isArray(x.history)||!plain(x.exposures)||typeof x.onboarded!=='boolean')throw Error('Questo file non è un archivio valido della versione 1.');
 const ids=new Set();
 for(const p of x.profiles){if(!plain(p)||typeof p.id!=='string'||!p.id||ids.has(p.id)||typeof p.name!=='string'||!p.name.trim()||p.name.length>40||!Number.isInteger(p.age)||p.age<0||p.age>110||!/^#[0-9a-f]{6}$/i.test(p.color)||!plain(p.tastes)||!plain(p.ratings))throw Error('Uno dei profili non è valido.');ids.add(p.id);for(const v of Object.values(p.tastes))if(![-2,0,2].includes(v))throw Error('Gusti non validi.');for(const v of Object.values(p.ratings))if(![-1,0,1,2].includes(v))throw Error('Valutazioni non valide.');}
 if(x.platforms.some(v=>typeof v!=='string'||!v.trim()||v.length>50)||new Set(x.platforms).size!==x.platforms.length)throw Error('Piattaforme non valide.');
 const validEvent=h=>plain(h)&&typeof h.titleId==='string'&&Array.isArray(h.participants)&&h.participants.every(i=>ids.has(i))&&typeof h.date==='string'&&plain(h.votes)&&Object.values(h.votes).every(v=>[-1,0,1].includes(v));
 if(x.history.some(h=>!validEvent(h)))throw Error('Cronologia non valida.');
 if(x.pending!==null&&!validEvent(x.pending))throw Error('Visione in corso non valida.');
 if(Object.values(x.exposures).some(v=>!Number.isFinite(v)||v<0))throw Error('Archivio dei suggerimenti non valido.');return x;
}
export const storage={
 async load(){const raw=localStorage.getItem(KEY);return raw?validate(JSON.parse(raw)):empty();},
 async save(data){validate(data);localStorage.setItem(KEY,JSON.stringify(data));},
 async import(text){const data=validate(JSON.parse(text));await this.save(data);return data;},
 export(data){return JSON.stringify(data,null,2);}
};
