import assert from 'node:assert/strict';
import {createCloudStorage,ConflictError,AuthError} from './dist/cloud-storage.js';
import {empty} from './dist/storage.js';
// Trasporto simulato soltanto per i test: non è un servizio o un collegamento reale.
const records=new Map();let failNetwork=false;
const memory=()=>{const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)}};
const response=(x,status=200)=>new Response(JSON.stringify(x),{status});
async function transport(raw,opts){
 if(failNetwork)throw Error('offline');const u=new URL(raw),body=opts.body?JSON.parse(opts.body):null;
 if(u.pathname==='/auth/v1/token'){
  if(body.email==='wrong')return response({message:'bad credentials'},400);
  const id=body.email==='other@test.invalid'?'other':'family';
  return response({access_token:id,refresh_token:'refresh-'+id,expires_in:3600,user:{id}});
 }
 if(u.pathname==='/auth/v1/logout')return response({});
 const owner=opts.headers.Authorization?.replace('Bearer ','');if(!owner)return response({},401);
 if(opts.method==='POST'){if(body.owner_id!==owner)return response({},403);if(records.has(owner))return response({code:'23505'},409);records.set(owner,structuredClone(body));return response([body])}
 const requested=u.searchParams.get('owner_id')?.slice(3);if(requested!==owner)return response([]);
 const row=records.get(owner);if(opts.method==='PATCH'){const rev=Number(u.searchParams.get('revision').slice(3));if(row?.revision!==rev)return response([]);Object.assign(row,structuredClone(body));return response([row])}return response(row?[structuredClone(row)]:[]);
}
const config={url:'https://test-fixture.supabase.co',publishableKey:'sb_publishable_test_fixture'};
const client=()=>createCloudStorage(config,{fetcher:transport,sessionStore:memory()});
const a=client(),b=client(),other=client();await assert.rejects(()=>a.load(),AuthError);
await a.signIn('family@test.invalid','test-only');assert.deepEqual(await a.load(),empty());assert.equal(a.revision,0);
await b.signIn('family@test.invalid','test-only');await b.load();
const first=empty();first.platforms=['Netflix'];await a.save(first);assert.equal(await b.changed(),true);
const stale=empty();stale.platforms=['Disney+'];await assert.rejects(()=>b.save(stale),ConflictError);assert.deepEqual((await a.load()).platforms,['Netflix']);
await b.load();await b.save(stale);assert.deepEqual((await a.load()).platforms,['Disney+']);
await other.signIn('other@test.invalid','test-only');assert.deepEqual(await other.load(),empty());assert.equal(records.size,2);
const before=records.get('family').revision;await assert.rejects(()=>a.import('{"bad":true}'));assert.equal(records.get('family').revision,before);
failNetwork=true;await assert.rejects(()=>a.save(first),/connessione/);failNetwork=false;assert.deepEqual((await a.load()).platforms,['Disney+']);
await a.signOut();assert.equal(a.authenticated,false);assert.equal(b.authenticated,true);await assert.rejects(()=>a.load(),AuthError);
assert.throws(()=>createCloudStorage({...config,publishableKey:'sb_secret_invalid'},{fetcher:transport,sessionStore:memory()}));
console.log('Verificati con trasporto simulato: accesso, archivio condiviso, conflitti, separazione utenti, importazione, offline e logout locale. Serve ancora il collaudo sul progetto Supabase reale.');
