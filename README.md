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

## Da completare

- Pagine `/privacy`, `/cookie` e `/condizioni` (i link nel footer e nel form puntano lì)
- P. IVA, email e telefono nel footer
- Foto vere delle auto: metterle in `public/auto/` e collegarle con il campo `img` in `src/main.ts`
