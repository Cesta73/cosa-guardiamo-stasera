# Cosa guardiamo stasera — GitHub e archivio famiglia

La stessa app, con gli stessi profili, gusti e serate su dispositivi diversi. Il sito è predisposto per GitHub Pages; l’archivio è predisposto per Supabase. Non serve un account ChatGPT per usarla.

**Stato di questa consegna:** progetto Supabase `kbzyefqconrvdpadvipa` creato; tabella `cgs_family_archives` installata con RLS attiva, tre regole e lettura pubblica negata. La configurazione pubblica è inserita; registrazioni pubbliche disattivate. La richiesta reale senza sessione alla tabella è stata rifiutata con HTTP 401 e codice 42501. Repository pubblicato: https://github.com/Cesta73/cosa-guardiamo-stasera. Sito attivo: https://cesta73.github.io/cosa-guardiamo-stasera/. Test e prima pubblicazione GitHub Actions completati con successo. Accesso famiglia creato. Collaudo sul database reale completato: lettura e salvataggio con il ruolo della famiglia, rifiuto delle revisioni obsolete e isolamento da un altro utente. Le operazioni di prova sono state annullate tramite rollback. Restano da confermare il primo accesso dall’app e l’aggiornamento tra dispositivi. I test automatici passano; non equivalgono ancora al collaudo finale autenticato sul database reale. È stato inoltre rimosso l’accesso pubblico alla funzione automatica RLS creata da Supabase: la correzione è documentata in `supabase/hardening.sql`.

## Il risultato finale

Tutti aprite lo stesso indirizzo GitHub Pages ed entrate con **un accesso famiglia dedicato**, con email e password scelta per questa app. Questo è un utente tecnico di Supabase, non il tuo account amministrativo Supabase, GitHub o ChatGPT. Dopo l’accesso si scelgono i tre profili delle persone, come prima. Non si usa la password del tuo account personale di Google o di altri servizi.

Ogni dispositivo conserva una sessione e resta collegato finché possibile. Nell’archivio c’è il pulsante **Esci da questo dispositivo**. Le altre sessioni restano aperte. In questa prima versione non c’è login Google né registrazione pubblica: il gestore crea l’unico accesso famiglia dalla console Supabase.

## 1. Prepara Supabase

**Se riutilizzi un progetto esistente:** crea soltanto la tabella dedicata `cgs_family_archives`. Non modificare registrazioni, provider, email o regole degli altri servizi. I suggerimenti sulle registrazioni pubbliche valgono soltanto per un progetto nuovo dedicato. Se il piano gratuito ha già due progetti attivi, la creazione di un terzo può essere bloccata: non mettere in pausa o eliminare altri progetti senza averne valutato l’uso.

1. Apri [Supabase](https://supabase.com/dashboard) e accedi o crea il tuo account amministrativo. Non è l’account che useranno i familiari nell’app.
2. Crea un **New project**, chiamandolo `cosa-guardiamo-stasera`. Scegli una regione europea e valuta il piano e i suoi limiti prima di confermare. La password del database resta soltanto a te: non va nel codice e non serve inviarmela.
3. Attendi che il progetto sia pronto.
4. Apri **SQL Editor**, crea una nuova query e incolla il contenuto di `supabase/schema.sql`. Eseguila una sola volta in questo progetto dedicato. Crea la tabella dell’archivio e le regole di accesso.
5. Apri **Authentication → Users → Add user / Create user**. Crea l’accesso dedicato della famiglia con una email che controlli e una nuova password. Se il modulo offre la conferma amministrativa dell’email, conferma il nuovo utente; altrimenti completa la verifica richiesta prima di usare l’app. Non inviare password in chat.
6. In **Authentication → Sign In / Providers**, lascia attivo l’accesso email e password. Disattiva **Allow new users to sign up** se presente: l’app non richiede registrazioni pubbliche.
7. Verifica che siano ammesse più sessioni contemporanee per questo utente: ciascun dispositivo della famiglia deve poter restare collegato.
8. Dal pulsante **Connect** o dalle impostazioni API copia il **Project URL** e la chiave **Publishable**. Se il progetto usa le chiavi precedenti, va bene la chiave **anon**. Non usare mai `secret`, `service_role` o la password del database.
9. Inserisci quei due valori reali in `dist/cloud-config.json`, nei campi `url` e `publishableKey`. Il file contiene solo configurazione pubblica. I campi sono lasciati vuoti proprio per non inventare connessioni o credenziali.

La chiave pubblicabile è progettata per il browser e può stare su GitHub. La protezione dei dati è data dall’accesso famiglia e dalle regole RLS, non dal nascondere quella chiave. Tutti i dati dei profili restano fuori dal repository.

Fonti ufficiali: [chiavi API](https://supabase.com/docs/guides/getting-started/api-keys), [email e password](https://supabase.com/docs/guides/auth/passwords), [regole RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

## 2. Crea il repository GitHub

Accedi a [GitHub](https://github.com/new) come **Cesta73** e crea `cosa-guardiamo-stasera`.

Per GitHub Pages con il piano gratuito, usa un repository **pubblico**. Sarà pubblico il codice dell’app: non pubblicare backup JSON, nomi, età, preferenze, password, token o chiavi amministrative. Un repository privato con Pages richiede un piano compatibile: controlla il tuo account se preferisci mantenere privato anche il codice.

Carica i file di questa cartella conservando la struttura, compresa `.github/workflows/pages.yml`. Non caricare un’unica cartella esterna che li annidi tutti. Il ramo previsto dal flusso è `main`.

Se usi il terminale, una volta effettuato l’accesso con `gh auth login`, puoi creare e pubblicare il repository dalla cartella del progetto:

```sh
git init -b main
git add .
git commit -m "Crea Cosa guardiamo stasera con archivio famiglia"
gh repo create Cesta73/cosa-guardiamo-stasera --public --source=. --remote=origin --push
```

Esegui questi comandi soltanto se il repository non è già stato creato. Non rigenerare il repository se esiste: usa quello esistente.

## 3. Attiva GitHub Pages

1. Nel repository apri **Settings → Pages**.
2. In **Build and deployment → Source**, scegli **GitHub Actions**.
3. Apri **Actions → Pubblica Cosa guardiamo stasera** e avvia il flusso con **Run workflow**, oppure invia una modifica al ramo `main`.
4. Attendi il risultato verde. Il flusso mostra l’indirizzo finale di GitHub Pages. Non è attivo finché il flusso non termina correttamente.

Il flusso controlla i test e pubblica esclusivamente `dist`. Non richiede chiavi Supabase amministrative o segreti GitHub. Ogni aggiornamento a `main` ripubblica il sito.

Fonte: [pubblicazione tramite GitHub Actions](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## 4. Trasferisci i tre profili già creati

1. Nell’app precedente scegli **Il tuo archivio → Esporta archivio**.
2. Apri il nuovo sito GitHub Pages e accedi con l’accesso famiglia.
3. Scegli **Importa archivio**, seleziona il backup e conferma la sostituzione.
4. Apri lo stesso sito da un secondo dispositivo ed entra con la stessa email e password dell’app.
5. Verifica che compaiano gli stessi tre profili. Non serve importarli su ogni dispositivo.

Se preferisci ripartire, crea i tre profili da un solo dispositivo dopo il collegamento. Gli altri li vedranno automaticamente. Non sono inclusi profili dimostrativi nei file.

## Sincronizzazione e conflitti

Le modifiche vengono inviate al database quando tocchi un comando. Gli altri dispositivi controllano gli aggiornamenti ogni **10 secondi** e quando si torna alla scheda. Se stai compilando un campo, il caricamento automatico aspetta per non cancellare ciò che stai scrivendo.

Ogni salvataggio usa una revisione. Se qualcuno ha modificato l’archivio nel frattempo, il salvataggio viene rifiutato: non sovrascrive i dati dell’altra persona. L’app mostra un avviso e permette di esportare la copia locale prima di riaprire la versione condivisa e ripetere le modifiche necessarie. Non viene effettuata una fusione automatica arbitraria.

Quando manca la rete, il salvataggio non viene dichiarato riuscito e non vengono accodate scritture invisibili. Conserva le modifiche con **Esporta la mia copia**, poi ricollegati. Evita di reimportare un intero backup per correggere una sola preferenza: l’importazione sostituisce l’archivio per tutta la famiglia e richiede conferma.

## Avvio e test locali

Con Python 3, dalla cartella del progetto:

```sh
python3 -m http.server 5173 --directory dist
```

Apri `http://localhost:5173`. Non aprire il file HTML con doppio clic. Se non hai ancora configurato Supabase, l’app resta locale e lo dichiara.

Con Node:

```sh
node tests.mjs
node cloud-tests.mjs
```

Il primo gruppo verifica i suggerimenti, i minori e i backup. Il secondo usa un **trasporto simulato solo nei test** per verificare l’adattatore: accesso richiesto, due dispositivi sullo stesso archivio, rifiuto delle revisioni obsolete, errori di rete, importazioni malformate e uscita locale. Questi test non attestano l’esecuzione delle regole SQL su Supabase: il collaudo reale seguente resta necessario.

### Collaudo sul progetto reale

- Accedi da due browser o dispositivi e crea un profilo di prova. Verifica che compaia anche sull’altro dopo 10 secondi.
- Modifica un gusto e controlla che l’altro dispositivo lo riceva.
- Prova un salvataggio concorrente: una revisione obsoleta deve mostrare l’avviso, senza perdere il primo salvataggio.
- Prova il filtro con un bambino di 6 anni e verifica che nessuna proposta superi l’età consigliata.
- Esci da un dispositivo: l’altro deve restare collegato.
- Verifica dalla console Supabase che la tabella abbia RLS attiva e che l’accesso senza sessione non possa leggerla. Se crei un secondo utente di prova, non deve poter leggere la riga della famiglia.

## Struttura

`dist/app.js` gestisce le schermate; `data.js` sceglie l’adattatore; `storage.js` mantiene archivio locale e validazione; `cloud-storage.js` gestisce Supabase e revisioni; `cloud-config.json` contiene la configurazione pubblica. `supabase/schema.sql` contiene tabella, RLS e controllo revisioni. `.github/workflows/pages.yml` pubblica il sito.

Il catalogo resta quello locale, con 24 titoli reali e fonti. Non è un catalogo aggiornato in tempo reale e copre inizialmente Netflix, Disney+ e Apple TV+. Le età sono consigli editoriali prudenti e le durate delle serie sono indicative. Controlla sempre la disponibilità e la scheda della piattaforma.

## Cosa è rimandato

Login Google individuale e inviti separati, fusione automatica delle modifiche concorrenti, uso offline con coda sincronizzata, catalogo esterno e AI. Il modello attuale usa un singolo accesso famiglia dedicato: non condividere le credenziali dei tuoi account personali o amministrativi.
