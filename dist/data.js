import {storage as localStorageAdapter,empty} from './storage.js';
import {createCloudStorage} from './cloud-storage.js';
export {empty};
export let storage=localStorageAdapter;
export async function configureStorage(){
 const response=await fetch('./cloud-config.json',{cache:'no-store'});if(!response.ok)throw Error('Configurazione dell’archivio mancante.');
 const config=await response.json();
 // Senza configurazione reale non si finge una sincronizzazione: resta la modalità locale, dichiarata nell’interfaccia.
 if(!config.url&&!config.publishableKey)return false;
 storage=createCloudStorage(config);return true;
}
