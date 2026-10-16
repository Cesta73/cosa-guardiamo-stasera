import {empty,validate} from './storage.js';
export class ConflictError extends Error{constructor(){super('Un altro dispositivo ha appena modificato l’archivio. Le tue modifiche non hanno sostituito le sue.');this.name='ConflictError'}}
export class AuthError extends Error{constructor(){super('Accedi con l’accesso famiglia per aprire l’archivio condiviso.');this.name='AuthError'}}
// L’interfaccia non dipende da Supabase: questo adattatore mantiene load/save/import/export.
// La revisione impedisce di perdere modifiche quando due dispositivi scrivono insieme.
export function createCloudStorage(config,{fetcher=fetch,sessionStore=localStorage}={}){
 const url=new URL(config.url);if(url.protocol!=='https:'||!url.hostname.endsWith('.supabase.co')||url.pathname!=='/'||url.search||url.hash)throw Error('Indirizzo Supabase non valido.');
 if(!config.publishableKey||typeof config.publishableKey!=='string'||config.publishableKey.startsWith('sb_secret_'))throw Error('Usa soltanto la chiave pubblicabile Supabase.');
 if(config.publishableKey.startsWith('eyJ')){try{const claims=JSON.parse(atob(config.publishableKey.split('.')[1]));if(claims.role!=='anon')throw Error('Chiave non pubblica.')}catch{throw Error('Usa una chiave publishable o anon, mai service_role.')}}
 const base=url.origin,key='cgs-session-'+url.hostname;let revision=null,owner=null,refreshPromise=null;
 const readSession=()=>{try{return JSON.parse(sessionStore.getItem(key)||'null')}catch{return null}};
 async function request(path,{method='GET',body,token,headers={}}={}){
  let response;try{response=await fetcher(base+path,{method,headers:{apikey:config.publishableKey,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...headers},...(body!==undefined?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)})}catch{throw Error('Non riesco a raggiungere l’archivio famiglia. Controlla la connessione e riprova.')}
  const raw=await response.text();let data=null;try{data=raw?JSON.parse(raw):null}catch{throw Error('Risposta del servizio non valida.')}
  if(!response.ok){if(response.status===401||response.status===403)throw new AuthError();const err=Error(data?.message||data?.msg||'Il servizio non ha completato la richiesta.');err.code=data?.error_code??data?.code;err.status=response.status;throw err}return data;
 }
 function keep(session){if(!session?.access_token||!session?.refresh_token||!session?.user?.id)throw new AuthError();const stored={...session,expires_at:session.expires_at??Math.floor(Date.now()/1000)+(session.expires_in??3600)};sessionStore.setItem(key,JSON.stringify(stored));return stored}
 async function refresh(){const current=readSession();if(!current)throw new AuthError();if(current.expires_at>Date.now()/1000+60)return current;try{return keep(await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:current.refresh_token}}))}catch(e){if(e instanceof AuthError||e.status===400){sessionStore.removeItem(key);throw new AuthError()}throw e}}
 async function session(){if(refreshPromise)return refreshPromise;refreshPromise=(typeof navigator!=='undefined'&&navigator.locks?navigator.locks.request(key,refresh):refresh());try{return await refreshPromise}finally{refreshPromise=null}}
 const rowPath=id=>'/rest/v1/cgs_family_archives?owner_id=eq.'+encodeURIComponent(id);
 const adapter={isCloud:true,get authenticated(){return !!readSession()},get revision(){return revision},
  async signIn(email,password){let result;try{result=await request('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password}})}catch(e){if(e instanceof AuthError)throw Error('Email o password non corrette, oppure accesso non abilitato.');throw e}keep(result);revision=null;owner=null},
  async signOut(){const s=readSession();try{if(s)await request('/auth/v1/logout?scope=local',{method:'POST',token:s.access_token})}finally{sessionStore.removeItem(key);revision=null;owner=null}},
  async load(){const s=await session();const rows=await request(rowPath(s.user.id)+'&select=data,revision',{token:s.access_token});if(!Array.isArray(rows)||rows.length>1)throw Error('Archivio famiglia non valido.');let row=rows[0];
   if(!row){try{const inserted=await request('/rest/v1/cgs_family_archives',{method:'POST',body:{owner_id:s.user.id,data:empty(),revision:0},token:s.access_token,headers:{Prefer:'return=representation'}});row=inserted?.[0]}catch(e){if(e.code!=='23505')throw e;const existing=await request(rowPath(s.user.id)+'&select=data,revision',{token:s.access_token});row=existing?.[0]}}
   if(!row||!Number.isSafeInteger(row.revision))throw Error('Archivio non inizializzato. Verifica la configurazione Supabase.');const data=validate(row.data);revision=row.revision;owner=s.user.id;return structuredClone(data)},
  async save(data){validate(data);if(revision===null||!owner)throw Error('Apri prima l’archivio condiviso.');const s=await session();if(s.user.id!==owner)throw new AuthError();const rows=await request(rowPath(owner)+'&revision=eq.'+revision,{method:'PATCH',body:{data,revision:revision+1},token:s.access_token,headers:{Prefer:'return=representation'}});if(!Array.isArray(rows)||!rows.length)throw new ConflictError();revision=rows[0].revision;return structuredClone(data)},
  async changed(){const s=await session();const rows=await request(rowPath(s.user.id)+'&select=revision',{token:s.access_token});return rows?.[0]?.revision!==revision},
  async import(text){const data=validate(JSON.parse(text));await this.save(data);return data},export(data){return JSON.stringify(data,null,2)}
 };return adapter;
}
