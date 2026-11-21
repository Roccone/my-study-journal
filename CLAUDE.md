# My Study Journal (BSP, bullet study plan)

Bullet journal digitale per seguire, giorno per giorno, il piano di studio di vibe coding di René (UX/product designer che impara a programmare da zero). Il progetto finale del piano è un'app per imparare i kanji (alternativa a WaniKani).

- **App online:** https://roccone.github.io/my-study-journal/ (GitHub Pages dal branch `main`, cartella root; si aggiorna a ogni push)
- **Installazione sul Mac:** web app di Brave (barra indirizzi → Install, oppure menu → Save and Share → Install). `install.sh` è la vecchia versione (apriva una finestra nuova a ogni clic): non usarlo.

## Come lavorare su questo progetto

- Rispondi nella **lingua in cui scrive René** (passa tra italiano e inglese). Le scritte dell'interfaccia sono in **inglese**, i contenuti del piano in italiano.
- **Chiedi prima** se qualcosa è ambiguo; per i cambi grandi mostra un **mockup** prima di scrivere codice.
- Testa con Chrome headless + screenshot prima di pubblicare, poi commit e push su `main`.
- Aggiorna questo file quando cambiano decisioni, stato o prossimi passi.

## File

| File | Cosa contiene |
| --- | --- |
| `index.html` | Struttura: copertina, pagine, etichette (principali e sotto-etichette dei blocchi), modal, lightbox |
| `style.css` | Aspetto (palette, etichette, pagine, animazioni, grafico) |
| `app.js` | Tutta la logica (un'unica IIFE) |
| `plan.js` | Il piano giorno per giorno: `window.PLAN` → blocchi → scaglioni → giorni → task con prefisso `L` lezione, `P` progetto, `E` esercizio senza AI, `C` controllo con Claude, `R` diario. Link alle fonti dopo il testo con `|url` (anche più di uno), mostrati come badge "Odin ↗", "MDN ↗"… |
| `manifest.json`, `icon-*.png`, `icon.svg` | Web app e icona |

## Dati

- Tutto nel browser: `localStorage` chiave `msj-data-v1` (spunte, giornate, note, descrizioni home, intro viste, log azioni, aperture). Immagini delle note in **IndexedDB** `msj-images`. Backup export/import (immagini incluse) nella home del Full plan.
- Id dei task = posizione `scaglione-giorno-indice`: se si cambia `plan.js`, non spostare i task già esistenti o si perdono le spunte.
- Lo stato dell'interfaccia (sezione aperta, filtri…) vive solo in memoria: chiudendo l'app torna tutto alla copertina.

## Decisioni prese

- **Giornate:** una pagina diventa "attiva" (e si salva) solo quando si spunta qualcosa. Dopo aver finito il giorno si può continuare con il successivo.
- **Task non finiti (riporto):** si decide all'inizio della prima sessione di un giorno nuovo (stesso giorno = niente cambia). Si riportano i task non fatti dell'ultima sessione. Stime: diario 10, controllo 10, lezione 30, esercizio 20, mini-progetto 60, progetto finale 90 min. Se il riporto è ≤ 30 min va all'inizio della sessione; se è di più, riporto + prossime 4 sessioni vengono ridistribuiti in sessioni da ~90 min in ordine di piano (se non bastano 4 sessioni il piano si allunga). Dati: `D.queue` (sessioni ridistribuite, vengono prima dei giorni del piano), `D.absorbed` (giorni del piano assorbiti), `D.movedFrom` (data d'origine, mostrata come "from 18 Nov"), `entry.note` (nota sulla pagina).
- **Punti:** diario 5, lezione 10, controllo 10, esercizio 20, mini-progetto 30, progetto finale 50; bonus 50 per scaglione completato. Gradi 入門 → 見習い → 職人 → 達人 → 師匠 in base alla percentuale.
- **Etichette:** Full plan (blu polvere) con 5 sotto-etichette dei blocchi (Weeks 1–7, 8–15, 16–22, 23–24, Final, azzurro chiaro); Daily tasks (rosso mattone); Notes & questions (ocra); Cestino (grigio, compare solo se c'è qualcosa). Solo l'etichetta attiva sta sopra la pagina; dentro una sezione passa sul bordo sinistro. A diario chiuso le sotto-etichette sono corte, senza testo e sovrapposte sotto Full plan.
- **Homepage:** il clic su un'etichetta porta sempre alla home della sezione (pagina sinistra vuota, a destra titolo + contenuto + bottone centrale). Il bottone diventa "Back to…" se si arriva alla home da dentro la sezione. Descrizioni di Full plan e Notes modificabili.
- **Full plan:** impaginato come un diario, ogni scaglione su pagina nuova, frecce a metà pagina, home + barra di progresso in alto a sinistra, "Today's tasks →" in alto a destra.
- **Daily tasks:** un task alla volta con "✓ Done"; "all tasks" mostra la lista intera. Navigazione: All sessions ⌄ · ← Previous session · Next session → · Go today. Intro automatica prima del primo giorno di ogni scaglione, poi "🎯 Section goal". Data "Week X · 20 Nov 26".
- **Note e domande:** editor con immagini in linea (bottone o incolla), link cliccabili, Invio salva (Shift+Invio a capo), risposte sotto le domande, card selezionabili, cestino con ripristino ed eliminazione definitiva con conferma.
- **Stile:** palette viola per testi e bottoni, verde per i progressi, font scritto a mano (Caveat) per titoli e date, animazioni di pagina morbide.

## Stato

Funzionante e pubblicato (21 nov 2026). In uso quotidiano da René.

## Note sulle fonti

- Lezioni di The Odin Project verificate sul sito il 21 nov 2026 (il corso aveva cambiato alcuni nomi: niente più "Computer Basics" e "Installation Overview"; "Arrays and Loops" ora è "Loops and Arrays"). Per MDN e Figma si usano link di ricerca, più stabili.

## Prossimi passi / idee in sospeso

- Collegamento con Notion (rimandato: serve un piccolo server, il browser da solo non può scrivere su Notion).
- Riepiloghi settimanali e statistiche (i dati per farli sono già salvati: orari delle spunte, inizio e fine giornate, log).
- Eventuale sincronizzazione tra dispositivi (oggi i dati restano in un solo browser).
