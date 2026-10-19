# GestAuto · Landing

Landing page di GestAuto, il gestionale con sito web per autosaloni.
Sito statico con Vite (HTML, CSS e TypeScript) più una funzione Vercel per le richieste di demo.

## Struttura

- `index.html`: tutti i testi e la struttura della pagina
- `src/style.css`: stile
- `src/main.ts`: anteprime, generatore contratti, calcolatore, filtri, FAQ, form
- `api/demo-request.ts`: riceve il form, salva il lead su Supabase, manda le credenziali via Resend e avvisa il titolare
- `supabase/migrations/…_demo_leads.sql`: tabella dei lead

## Sviluppo

```bash
npm install
npm run dev
```

Per provare anche il form in locale serve la Vercel CLI: `npx vercel dev`.

## Messa online

1. **Vercel**: importa questo repo come nuovo progetto. Framework: Vite (rilevato da solo).
2. **Supabase**: nel progetto che deve tenere i lead (non quello della demo, che si resetta ogni notte) apri SQL Editor, incolla il file in `supabase/migrations/` e premi Run.
3. **Resend**: verifica il dominio del mittente (record DNS) e crea una API key. Senza dominio verificato Resend consegna solo al tuo indirizzo.
4. **Variabili d'ambiente** su Vercel, Settings > Environment Variables: copia la lista da `.env.example` e metti i valori veri.
5. Rideploya il progetto dopo aver salvato le variabili.

## Sicurezza della demo

- Le credenziali del gestionale demo arrivano solo via email, la funzione non le restituisce mai al browser.
- Nella pagina di login del gestionale demo le credenziali non devono essere precompilate.
- Limite di 3 richieste ogni 24 ore per indirizzo email e campo trappola per i bot.

## Pagine legali

`/privacy`, `/cookie` e `/condizioni` sono in `privacy/`, `cookie/`, `condizioni/`.
I font sono serviti dal dominio stesso (pacchetti Fontsource), quindi nessun dato dei visitatori va a Google Fonts: se aggiungi analytics, mappe o video esterni aggiorna Cookie Policy e privacy e valuta un banner di consenso.

## Da completare

- Segnaposto tra parentesi quadre: indirizzo, P. IVA, email, telefono, area dei server Supabase, durata minima e preavvisi nelle condizioni
- Far rivedere privacy e condizioni da un professionista prima del lancio
- Foto delle auto: in `public/auto/`, prese da `lemac77/motori` (`brand/auto-demo/`) e ridimensionate
