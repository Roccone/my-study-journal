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
- Posizione dell'interfaccia salvata in `localStorage` chiave `msj-ui-v1` (sezione, home/contenuto, sessione o pagina aperta). All'avvio il diario parte chiuso e si apre con l'animazione dove si era rimasti; se il giorno è cambiato e si era sulla sessione di "oggi", si apre sulla sessione del giorno nuovo. Ricerche, filtri e schede aperte invece ripartono vuoti.

## Decisioni prese

- **Giornate:** una pagina diventa "attiva" (e si salva) solo quando si spunta qualcosa. Dopo aver finito il giorno si può continuare con il successivo.
- **Task non finiti (riporto):** si decide all'inizio della prima sessione di un giorno nuovo (stesso giorno = niente cambia). Si riportano i task non fatti dell'ultima sessione. Stime: diario 10, controllo 10, lezione 30, esercizio 20, mini-progetto 60, progetto finale 90 min. Se il riporto è ≤ 30 min va all'inizio della sessione; se è di più, riporto + prossime 4 sessioni vengono ridistribuiti in sessioni da ~90 min in ordine di piano (se non bastano 4 sessioni il piano si allunga). Dati: `D.queue` (sessioni ridistribuite, vengono prima dei giorni del piano), `D.absorbed` (giorni del piano assorbiti), `D.movedFrom` (data d'origine, mostrata come "from 18 Nov"), `entry.note` (nota sulla pagina).
- **Punti:** diario 5, lezione 10, controllo 10, esercizio 20, mini-progetto 30, progetto finale 50; bonus 50 per scaglione completato. Gradi 入門 → 見習い → 職人 → 達人 → 師匠 in base alla percentuale.
- **Etichette:** Full plan (blu polvere) con 5 sotto-etichette dei blocchi (Weeks 1–7, 8–15, 16–22, 23–24, Final, azzurro chiaro); Daily tasks (rosso mattone); Notes & questions (ocra); ⏳ History (verde salvia); Cestino (grigio, compare solo se c'è qualcosa). Solo l'etichetta attiva sta sopra la pagina; dentro una sezione passa sul bordo sinistro. A diario chiuso le sotto-etichette sono corte, senza testo e sovrapposte sotto Full plan.
- **Homepage:** il clic su un'etichetta porta sempre alla home della sezione (pagina sinistra vuota, a destra titolo + contenuto + bottone centrale). Il bottone diventa "Back to…" se si arriva alla home da dentro la sezione. Descrizioni di Full plan e Notes modificabili.
- **Full plan:** impaginato come un diario, ogni scaglione su pagina nuova, frecce a metà pagina, home + barra di progresso in alto a sinistra, "Today's tasks →" in alto a destra.
- **Daily tasks:** un task alla volta con "✓ Done"; "all tasks" mostra la lista intera. Navigazione: All sessions ⌄ · ← Previous session · Next session → · Go today. Intro automatica prima del primo giorno di ogni scaglione, poi "🎯 Section goal". Data "Week X · 20 Nov 26".
- **History:** home con descrizione modificabile e "See history →"; poi le sessioni completate dalla più recente, a pagine con frecce (come il Full plan). Ogni sessione: "Week X · giorno · data" (scritta più piccola), "X/Y tasks done, X points", orario primo–ultimo ✓, task con ora, note/domande del giorno. In alto a destra ricerca (filtra i task) e "All sessions ⌄" (stesso menu delle altre sezioni) che sfoglia fino alla data. Solo lettura.
- **Note e domande:** editor con immagini in linea (bottone o incolla), link cliccabili, Invio salva (Shift+Invio a capo), risposte sotto le domande, card selezionabili, cestino con ripristino ed eliminazione definitiva con conferma.
- **Tag dei task:** icona al posto della scritta (📖 lezione, ✏️ esercizio, 🛠️ progetto, 🔍 controllo, 📓 diario), colore per tipo; il nome compare come tooltip al passaggio del mouse o al clic (clic fuori o uscita del mouse lo chiude; il clic non spunta il task).
- **Stile:** palette viola per testi e bottoni, verde per i progressi, font scritto a mano (Caveat) per titoli e date, animazioni di pagina morbide.

## Stato

Funzionante e pubblicato (21 nov 2026). In uso quotidiano da René.

## Note sulle fonti

- Lezioni di The Odin Project verificate sul sito il 21 nov 2026 (il corso aveva cambiato alcuni nomi: niente più "Computer Basics" e "Installation Overview"; "Arrays and Loops" ora è "Loops and Arrays"). Per MDN e Figma si usano link di ricerca, più stabili.

## Next fixes (fatti e pubblicati il 24 nov 2026, dopo il backup di René)

Specifiche anche nella pagina Notion del progetto, sezione "Da migliorare".

1. **Doppio clic su una nota o domanda** → entra subito in modifica, con il cursore dove si è cliccato (Daily tasks e sezione Notes; History e Cestino restano in sola lettura). Doppio clic sulla risposta di una domanda → modifica la risposta. Esc = annulla, Invio o clic fuori = salva. Se il testo viene svuotato, il clic fuori annulla (il testo vecchio resta). Il bottone ✍🏻 resta. Si salva (e compare "edited") solo se il testo è cambiato.
2. **Pulsanti "+ 📝" e "+ ❓"** (pagina sinistra di Daily tasks): bottoni secondari color marrone chiaro (`.btn.add`, sfondo `#e8dac6`, testo `#6e5139`, hover `#8b6a4c` con testo bianco), solo icona, tooltip "New note" / "New question" al passaggio del mouse (solo su dispositivi con mouse).
3. **Riga dei filtri sempre visibile** (anche senza note):
   - Al massimo un tipo: "Filter:" + "All notes" disabilitato (stesso aspetto dello stato normale, non cliccabile).
   - Almeno 2 tipi: "Filter: All notes · Notes · Questions"; dopo aver aggiunto una nota il filtro torna su "All notes".
   - Filtri = pulsanti terziari (`.ftag`), solo testo in grassetto, senza sfondo. Normale = marrone chiaro `#b39c83`; selezionato = viola (`--brown`) + linea sotto.
   - La sezione Notes non ha questi filtri (ha già due colonne Notes / Questions).

## Prossima fase: risposte agli esercizi (da costruire, planning fatto il 24 nov 2026)

Prima versione semplice dell'idea Notion "nuovo tipo di nota Esercizio" (il controllo e il feedback di Claude restano per dopo: serve un server).

- **Dove si scrive:** ogni task ✏️ esercizio (`E`, 66 nel piano) ha nella sua card un campo "Your answer…" + bottone "Save answer". Facoltativo (alcuni esercizi si fanno nel terminale).
- **Nota "exercise":** nuovo tipo di nota (`type: "exercise"`, con l'id del task). Una sola per esercizio: risalvare aggiorna la stessa nota. Data = giorno in cui si scrive, così entra nelle note di quella sessione.
- **Aspetto:** icona ✏️; testo dell'esercizio in alto come il titolo di una domanda (non modificabile), risposta sotto. Doppio clic sulla risposta = modifica; cestino e ripristino come le altre note. A capo mantenuti, link cliccabili.
- **Filtri Daily tasks:** "Filter: All notes · Notes · Questions · Exercises" (stesse regole e stile `.ftag` dei filtri attuali).
- **Sezione Notes:** gli esercizi vanno nella colonna 📝 Notes, con un piccolo filtro sopra la colonna "All · Notes · Exercises".
- **History:** compaiono con le altre note del giorno.
- **Da confermare con René prima del codice** (proposte di Claude tra parentesi):
  1. "Save answer" spunta anche il task? (no, separati: si può salvare una bozza)
  2. Risposte in font monospaziato, visto che spesso c'è codice? (sì)
  3. Con 3 tipi, la riga filtri mostra solo i tipi presenti quel giorno o sempre tutti e 4? (solo quelli presenti)

## Prossimi passi / idee in sospeso

- Da migliorare (Notion): parte destra di Daily tasks visivamente più chiara, distinguere meglio note e domande dalle cose da fare.
- Collegamento con Notion (rimandato: serve un piccolo server, il browser da solo non può scrivere su Notion).
- Riepiloghi settimanali e statistiche (i dati per farli sono già salvati: orari delle spunte, inizio e fine giornate, log).
- Eventuale sincronizzazione tra dispositivi (oggi i dati restano in un solo browser).
