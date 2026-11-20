// My Study Journal — piano giorno per giorno.
// Prefisso di ogni task: L = lezione, P = mini-progetto, E = esercizio senza AI, C = controllo con Claude, R = ripasso/diario.
// Gli id dei task vengono generati dalla posizione (scaglione-giorno-task): se cambi un testo, i progressi restano.
window.PLAN = [
{ id:"A", title:"Blocco A — Le basi del web", weeks:"settimane 1–7",
  desc:"Alla fine hai online una pagina portfolio scritta interamente da te.",
  steps:[
  { n:1, title:"Terminale e Git", weeks:"settimana 1",
    what:"Il terminale è un modo di parlare al computer scrivendo comandi. Git salva \"fotografie\" del tuo lavoro per poter tornare indietro; GitHub le tiene online.",
    days:[
      ["L The Odin Project › Prerequisites: \"Computer Basics\" e \"How Does the Web Work?\"","L Prerequisites: \"Installation Overview\" e \"Installations\" (segui la parte per macOS)","R Scrivi 3 righe su cosa ti aspetti da questo percorso"],
      ["L Prerequisites: \"Text Editors\" — installa VS Code","L Prerequisites: \"Command Line Basics\"","E Dal terminale: crea, rinomina e cancella una cartella di prova"],
      ["L Prerequisites: \"Setting up Git\" — crea le chiavi e collegale a GitHub","L Git Basics: \"Introduction to Git\"","E Fai 3 commit su un file di testo e guardali con git log"],
      ["L Git Basics: \"Git Basics\" (add, commit, push, status)","P Crea il repository diario-di-codice su GitHub con un README.md","P Scrivi nel README cosa hai imparato questa settimana e fai push"],
      ["E Esercizio 1: crea la cartella prova con testi/, immagini/ e testi/note.txt","E Esercizio 2: trasforma prova in repository e fai 3 commit con messaggi chiari","E Esercizio 3: modifica note.txt, guarda git diff, poi annulla la modifica","E Esercizio 4: copia l'output di git log --oneline e spiega cos'è un commit","C Manda gli esercizi a Claude per il controllo"]
    ]},
  { n:2, title:"HTML: la struttura", weeks:"settimane 2–3",
    what:"HTML descrive il contenuto di una pagina (titolo, paragrafo, link) con dei tag come <h1> e <p>. L'aspetto lo decide il CSS.",
    days:[
      ["L HTML Foundations: \"Introduction to HTML and CSS\"","L HTML Foundations: \"Elements and Tags\"","E Scrivi a mano 5 tag diversi e spiega a parole cosa fa ognuno"],
      ["L HTML Foundations: \"HTML Boilerplate\"","E Crea index.html con lo scheletro completo e aprilo nel browser","R Commit: \"primo file HTML\""],
      ["L HTML Foundations: \"Working with Text\"","E Una pagina con titolo, sottotitolo, 3 paragrafi, grassetto e corsivo"],
      ["L HTML Foundations: \"Lists\"","L HTML Foundations: \"Links and Images\"","E Una pagina con una lista, un link esterno e un'immagine"],
      ["L HTML Foundations: \"Commit Messages\"","P Pagina \"Chi sono\": crea il file e scrivi la presentazione","R Diario: cosa ti è risultato facile e cosa no"],
      ["P Pagina \"Chi sono\": esperienze in lista con date e ruoli","P Aggiungi link a LinkedIn e al portfolio","R Commit e push"],
      ["L Leggi su MDN cosa sono i tag semantici (header, main, section, footer)","P Riorganizza la pagina \"Chi sono\" con i tag semantici"],
      ["L Leggi su MDN l'introduzione ai form (form, label, input, textarea, button)","E Un piccolo modulo con un campo e la sua etichetta"],
      ["E Esercizio 1: scheletro di una pagina HTML scritto da zero","E Esercizio 2: lista numerata di 5 hiragana e lista puntata di 3 libri","E Esercizio 3: link in una nuova scheda e immagine con testo alternativo"],
      ["E Esercizio 4: modulo di contatto con nome, email e messaggio, ogni campo con label","E Esercizio 5: trova i 3 errori nella pagina che ti manda Claude","C Manda gli esercizi a Claude per il controllo"]
    ]},
  { n:3, title:"CSS: l'aspetto", weeks:"settimane 4–5",
    what:"Il CSS dice al browser come mostrare l'HTML. Il box model (contenuto, padding, bordo, margine) lo conosci già da Figma con un altro nome.",
    days:[
      ["L CSS Foundations: \"Intro to CSS\" (selettori e proprietà)","E Collega un file style.css a una pagina e cambia colore ai titoli"],
      ["L Finisci \"Intro to CSS\" e fai gli esercizi css-exercises che indica","R Commit e push degli esercizi"],
      ["L CSS Foundations: \"The Cascade\"","E Crea due regole in conflitto e prevedi quale vince prima di provarla"],
      ["L CSS Foundations: \"Inspecting HTML and CSS\"","E Apri gli strumenti per sviluppatori di Brave e modifica un colore dal vivo"],
      ["L CSS Foundations: \"The Box Model\"","E Una card con padding, bordo e margine: misura tutto con l'ispettore"],
      ["L CSS Foundations: \"Block and Inline\"","R Diario: il box model spiegato con un paragone a Figma"],
      ["P In Figma: mini design system con 2 colori, 2 caratteri e 3 spaziature","P Collega style.css alla pagina \"Chi sono\" e applica colori e caratteri"],
      ["P Applica le spaziature e stila la lista delle esperienze","R Commit e push"],
      ["E Esercizio 1: titoli blu e solo i paragrafi con classe nota grigi","E Esercizio 2: bottone con padding, angoli arrotondati e :hover"],
      ["E Esercizio 3: spiega perché l'elemento del caso di Claude è più largo","E Esercizio 4: ricrea la card che ti manda Claude come immagine","C Manda gli esercizi a Claude per il controllo"]
    ]},
  { n:4, title:"Layout e pubblicazione", weeks:"settimane 6–7",
    what:"Flexbox e Grid dispongono gli elementi in righe e griglie, come l'Auto Layout. Le media query adattano la pagina a telefono e computer.",
    days:[
      ["L Flexbox: \"Introduction to Flexbox\"","E Tre box in riga con Flexbox"],
      ["L Flexbox: \"Growing and Shrinking\" e \"Axes\"","E Gioca a Flexbox Froggy (flexboxfroggy.com) fino al livello 12"],
      ["L Flexbox: \"Alignment\"","E Finisci Flexbox Froggy"],
      ["L Leggi su MDN le basi di CSS Grid","E Gioca a Grid Garden (cssgridgarden.com) fino al livello 10"],
      ["L Leggi su MDN le media query e il design responsive","E Una pagina che cambia colore di sfondo sotto i 600px di larghezza"],
      ["P Portfolio: disegna in Figma la pagina con 3 casi studio (desktop e mobile)","P Crea portfolio.html con la struttura HTML"],
      ["P Portfolio: layout con Flexbox e Grid","P Portfolio: versione per telefono con le media query"],
      ["L Cerca \"GitHub Pages\" nella documentazione GitHub e leggi la guida rapida","P Pubblica il portfolio con GitHub Pages","R Diario: il link pubblico del tuo primo sito"],
      ["E Esercizio 1: barra di navigazione con logo a sinistra e 3 link a destra","E Esercizio 2: griglia di 6 card, 3 colonne su computer e 1 su telefono"],
      ["E Esercizio 3: centra un elemento in due modi diversi","E Esercizio 4: manda il link della pagina pubblicata","C Manda gli esercizi a Claude per il controllo"]
    ]}
  ]},
{ id:"B", title:"Blocco B — JavaScript", weeks:"settimane 8–15",
  desc:"Alla fine hai online un quiz di hiragana e katakana con digitazione e punteggio.",
  steps:[
  { n:5, title:"Variabili, condizioni, funzioni", weeks:"settimane 8–9",
    what:"Una variabile è una scatola con un nome; un if fa scegliere una strada; una funzione è una ricetta riutilizzabile.",
    days:[
      ["L JavaScript Basics: \"Variables and Operators\"","E Nella console di Brave crea 3 variabili e fai qualche calcolo"],
      ["L JavaScript Basics: \"Installing Node.js\"","E Esegui un file .js dal terminale con node"],
      ["L JavaScript Basics: \"Data Types and Conditionals\"","E Un if che risponde \"buongiorno\" o \"buonasera\" in base a un'ora"],
      ["L JavaScript Basics: \"JavaScript Developer Tools\"","E Usa un breakpoint per fermare il codice e guardare le variabili"],
      ["L JavaScript Basics: \"Function Basics\"","E Una funzione che raddoppia un numero e una che saluta per nome"],
      ["L JavaScript Basics: \"Problem Solving\" e \"Understanding Errors\"","R Diario: un errore che hai incontrato e come l'hai capito"],
      ["P Convertitore yen ↔ euro: funzione che riceve importo e tasso","P Arrotonda il risultato a 2 decimali e prova casi strani (0, negativi)"],
      ["P Convertitore: aggiungi la conversione inversa e commenta il codice","R Commit e push"],
      ["E Esercizio 1: funzione maggiorenne/minorenne","E Esercizio 2: funzione prezzo scontato"],
      ["E Esercizio 3: FizzBuzz da 1 a 30","E Esercizio 4: trova il bug nella funzione di Claude con console.log","C Manda gli esercizi a Claude per il controllo"]
    ]},
  { n:6, title:"Array, oggetti, cicli", weeks:"settimane 10–11",
    what:"Un array è una lista (una colonna di Excel), un oggetto è una scheda con campi (una riga con intestazioni). Un ciclo ripete un'azione per ogni elemento.",
    days:[
      ["L JavaScript Basics: \"Clean Code\"","L JavaScript Basics: \"Arrays and Loops\" (prima metà)"],
      ["L Finisci \"Arrays and Loops\"","E Un ciclo for che stampa i numeri pari da 2 a 20"],
      ["L javascript.info: \"Array methods\" (map, filter, find)","E Da un array di parole, tieni solo quelle con più di 4 lettere"],
      ["L JavaScript Basics: \"Object Basics\"","E Un oggetto \"kanji\" con carattere, significato e letture"],
      ["L Rifai gli esercizi javascript-exercises indicati dal corso fino a questo punto","R Diario: array e oggetti spiegati con Excel"],
      ["P Quiz hiragana in console: array di oggetti { kana, romaji } con 10 hiragana","P Funzione che fa una domanda e controlla la risposta"],
      ["P Ordine casuale delle domande","P Conteggio delle risposte giuste e messaggio finale"],
      ["P Allarga il quiz a tutte le 46 sillabe di base","R Commit e push"],
      ["E Esercizio 1: totale e prezzo più alto da un array di prezzi","E Esercizio 2: nomi degli studenti con voto sopra 25"],
      ["E Esercizio 3: conta le lettere in una parola","E Esercizio 4: mescola un array e spiega il tuo metodo","C Manda gli esercizi a Claude per il controllo"]
    ]},
  { n:7, title:"Il DOM e gli eventi", weeks:"settimane 12–13",
    what:"Il DOM è la pagina vista da JavaScript: leggi cosa scrive l'utente, reagisci ai clic e cambi la pagina. localStorage ricorda dati nel browser.",
    days:[
      ["L Foundations: \"DOM Manipulation and Events\" (prima metà)","E Cambia il testo di un titolo da JavaScript"],
      ["L Finisci \"DOM Manipulation and Events\"","E Un bottone che cambia colore allo sfondo"],
      ["L Leggi su MDN gli eventi della tastiera (keydown) e dei form (submit)","E Un campo che reagisce al tasto Invio"],
      ["L Leggi su MDN localStorage","E Salva il tuo nome nel browser e mostralo dopo aver ricaricato"],
      ["P Quiz nel browser: HTML e CSS della card (carattere grande, campo, bottone)","P Collega l'array dello scaglione 6 alla pagina"],
      ["P Controllo della risposta con Invio, verde se giusto, rosso se sbagliato","P Passaggio automatico alla domanda successiva"],
      ["P Punteggio e record salvato con localStorage","P Pubblica il quiz su GitHub Pages e mandalo a un compagno di studio"],
      ["R Leggi i feedback e scegli una sola cosa da migliorare","P Migliorala","R Commit e push"],
      ["E Esercizio 1: bottone che conta i clic","E Esercizio 2: contatore dei caratteri in tempo reale"],
      ["E Esercizio 3: lista di cose da fare (aggiungi, segna, elimina)","E Esercizio 4: la stessa lista salvata dopo il ricaricamento","C Manda gli esercizi a Claude per il controllo"]
    ]},
  { n:8, title:"Dati dall'esterno", weeks:"settimana 14",
    what:"Le API mandano dati in JSON. Le richieste richiedono tempo, quindi si usa async/await per aspettare la risposta.",
    days:[
      ["L javascript.info: \"JSON methods, toJSON\"","L javascript.info: \"Fetch\"","E Fai una richiesta a kanjiapi.dev dalla console e guarda la risposta"],
      ["L javascript.info: \"Promise\" e \"Async/await\"","E Riscrivi la richiesta di ieri con async/await"],
      ["P \"Cerca un kanji\": pagina con campo di ricerca e bottone","P Mostra significati e letture dalla risposta dell'API"],
      ["P Messaggio di errore, stato \"caricamento…\" e pubblicazione","R Commit e push"],
      ["E Esercizio 1: carica un JSON locale con 10 vocaboli e mostrali in lista","E Esercizio 2: errore chiaro se la ricerca fallisce","E Esercizio 3: indicatore \"caricamento…\"","C Manda gli esercizi a Claude per il controllo"]
    ]},
  { n:9, title:"Lavorare con l'AI", weeks:"settimana 15",
    what:"Da qui l'AI entra nel lavoro vero: Claude Code propone un piano e modifica i file; tu dirigi, controlli e capisci.",
    days:[
      ["L Installa Claude Code e aprilo nella cartella del quiz","L Chiedigli di spiegarti la struttura del progetto, senza modificare niente"],
      ["L Scrivi un file CLAUDE.md con le regole del progetto","P In planning mode chiedi di aggiungere il katakana: leggi il piano prima di approvare"],
      ["L Leggi tutte le modifiche con git diff","P Aggiungi la modalità \"ripassa gli errori\" con lo stesso metodo"],
      ["P Scrivi nel README, con parole tue, come funziona il codice nuovo","R Commit e push"],
      ["E Esercizio 1: spiega riga per riga la modifica che ti manda Claude","E Esercizio 2: trova e correggi a mano l'errore nella stessa modifica","E Esercizio 3: scrivi il prompt per una nuova funzione del quiz","C Manda gli esercizi a Claude per il controllo"]
    ]}
  ]},
{ id:"C", title:"Blocco C — React e Next.js", weeks:"settimane 16–22",
  desc:"Alla fine il portfolio è un sito Next.js con componenti che vengono dal tuo Figma.",
  steps:[
  { n:10, title:"React: componenti e props", weeks:"settimane 16–17",
    what:"I componenti React sono come i componenti Figma; le props sono le proprietà di un'istanza (varianti, testi).",
    days:[
      ["L react.dev/learn: \"Quick Start\"","L Crea un progetto React di prova con Vite (npm create vite@latest)"],
      ["L react.dev: \"Your First Component\" e \"Importing and Exporting Components\"","E Un componente Saluto e usalo 3 volte"],
      ["L react.dev: \"Writing Markup with JSX\" e \"JavaScript in JSX with Curly Braces\"","E Mostra in JSX una variabile e un calcolo"],
      ["L react.dev: \"Passing Props to a Component\"","E Saluto che riceve il nome come prop"],
      ["L react.dev: \"Conditional Rendering\" e \"Rendering Lists\"","E Una lista di 5 kanji con map"],
      ["P Libreria: componente Bottone con 3 varianti (principale, secondario, testo)","P Pagina di prova che mostra tutte le varianti"],
      ["P Libreria: componente Card e componente Badge","P Usa i colori del tuo mini design system"],
      ["P Rifinisci e scrivi nel README come si usa ogni componente","R Commit e push"],
      ["E Esercizio 1: componente Bottone con testo e variante come props","E Esercizio 2: componente CardKanji"],
      ["E Esercizio 3: 5 CardKanji da un array con map","E Esercizio 4: bottone disattivato con aspetto diverso","C Manda gli esercizi a Claude per il controllo"]
    ]},
  { n:11, title:"React: stato ed eventi", weeks:"settimane 18–19",
    what:"Lo stato è la memoria di un componente. Quando cambia, React ridisegna da solo la parte di pagina interessata.",
    days:[
      ["L react.dev: \"Responding to Events\"","E Un bottone che mostra un messaggio al clic"],
      ["L react.dev: \"State: A Component's Memory\"","E Un contatore con useState"],
      ["L react.dev: \"Render and Commit\" e \"Updating Objects in State\"","R Diario: perché non si modifica lo stato direttamente"],
      ["L react.dev: \"Reacting to Input with State\"","E Un campo di testo controllato che mostra quello che scrivi"],
      ["L react.dev: \"Sharing State Between Components\"","E Due componenti che leggono lo stesso contatore"],
      ["P Timer Pomodoro: interfaccia in Figma e componenti","P Stato del timer: minuti, secondi, in pausa o in corso"],
      ["P Conto alla rovescia con setInterval e useEffect (chiedi spiegazioni all'AI)","P Alternanza 25 minuti di studio e 5 di pausa"],
      ["P Contatore delle sessioni completate e pubblicazione","R Commit e push"],
      ["E Esercizio 1: contatore + e − che non scende sotto zero","E Esercizio 2: bottone che mostra e nasconde la soluzione"],
      ["E Esercizio 3: campo che diventa verde con la parola giusta","E Esercizio 4: rifai il quiz di hiragana in React","C Manda gli esercizi a Claude per il controllo"]
    ]},
  { n:12, title:"Next.js, Tailwind e Vercel", weeks:"settimane 20–21",
    what:"Next.js gestisce pagine e pubblicazione sopra React; Tailwind è CSS a classi brevi; Vercel pubblica a ogni salvataggio su GitHub.",
    days:[
      ["L nextjs.org/learn: capitoli 1–2 (introduzione e stili)","L Crea il progetto Next.js del corso"],
      ["L nextjs.org/learn: capitoli 3–4 (font, immagini, layout e pagine)","E Aggiungi una pagina /prova"],
      ["L nextjs.org/learn: capitolo 5 (navigazione tra pagine)","E Un menu che porta alle tue pagine"],
      ["L Leggi la guida introduttiva di Tailwind CSS","E Rifai un bottone con le sole classi Tailwind"],
      ["L Crea un account Vercel collegato a GitHub","L Pubblica il progetto del corso su Vercel"],
      ["P Portfolio in Next.js: crea il progetto e la home","P Una pagina per ogni caso studio"],
      ["P Portfolio: stile con Tailwind e i tuoi colori","P Versione mobile"],
      ["P Pubblica su Vercel e aggiorna il link nel CV","R Commit e push"],
      ["E Esercizio 1: pagina /contatti raggiungibile dal menu","E Esercizio 2: intestazione e piè di pagina in un layout comune"],
      ["E Esercizio 3: ricrea con Tailwind la card dello scaglione 3","C Manda gli esercizi a Claude per il controllo"]
    ]},
  { n:13, title:"Da Figma al codice", weeks:"settimana 22",
    what:"Con variabili e componenti ordinati in Figma e il server MCP di Figma collegato a Claude Code, l'AI genera componenti fedeli al tuo design system.",
    days:[
      ["L Trasforma colori, spaziature e caratteri del tuo Figma in variabili","L Leggi la guida di installazione di shadcn/ui per Next.js"],
      ["L Collega il server MCP di Figma a Claude Code (segui la guida ufficiale Figma)","P Chiedi a Claude Code di importare le variabili come token CSS"],
      ["P Genera 3 componenti dai frame Figma, uno alla volta, in planning mode","P Confronta ogni componente con il frame e correggi le differenze"],
      ["P Scrivi una bozza di caso studio: come sei passato da Figma al codice","R Commit e push"],
      ["E Esercizio 1: cambia un colore nei token e verifica che cambi ovunque","E Esercizio 2: sostituisci a mano un valore \"scritto a caso\" dall'AI","E Esercizio 3: aggiungi a mano una variante al bottone","C Manda gli esercizi a Claude per il controllo"]
    ]}
  ]},
{ id:"D", title:"Blocco D — I dati", weeks:"settimane 23–24",
  desc:"Alla fine hai un'app con login e database che usi davvero per cercare lavoro.",
  steps:[
  { n:14, title:"SQL e Supabase", weeks:"settimane 23–24",
    what:"Un database è un insieme di tabelle collegate, come fogli Excel che si richiamano con un codice comune. SQL le interroga; Supabase ti dà database e login.",
    days:[
      ["L Fai le prime lezioni di sqlbolt.com (SELECT e WHERE)","R Diario: SQL contro i filtri di Excel"],
      ["L sqlbolt.com: ORDER BY, LIMIT e JOIN","E Scrivi 3 query sugli esempi del sito senza guardare le soluzioni"],
      ["L sqlbolt.com: aggregazioni e GROUP BY","L sqlbolt.com: INSERT, UPDATE, DELETE"],
      ["L Crea un account Supabase e un progetto","L Crea una tabella dall'editor e inserisci 3 righe a mano"],
      ["L Leggi la guida Supabase per Next.js (quickstart)","E Mostra le righe della tabella in una pagina Next.js"],
      ["L Supabase Auth: login con email","L Row Level Security: ogni utente vede solo i suoi dati","R Chiavi segrete: crea il file .env.local e controlla che non vada su GitHub"],
      ["P Tracker candidature: tabella e campi (azienda, ruolo, link, stato, data, note)","P Pagina con l'elenco delle candidature"],
      ["P Modulo per aggiungere e modificare una candidatura","P Login e regole di accesso"],
      ["P Pubblica su Vercel e inserisci le tue candidature vere","R Commit e push"],
      ["E Esercizio 1: disegna tabelle e relazioni prima di crearle","E Esercizio 2: query delle candidature in \"colloquio\", dalla più recente","E Esercizio 3: conta le candidature per stato","E Esercizio 4: aggiungi il campo \"fonte\"","C Manda gli esercizi a Claude per il controllo"]
    ]}
  ]},
{ id:"F", title:"Progetto finale — L'app kanji", weeks:"dalla settimana 25", final:true,
  desc:"Metti insieme quello che hai costruito in piccolo. Il piano dettagliato lo scriviamo insieme quando avrai la descrizione completa.",
  steps:[
  { n:"漢", title:"Prototipo", weeks:"4–5 settimane", final:true,
    what:"50 tra radicali, kanji e vocaboli, solo SRS e digitazione.",
    days:[
      ["P Scrivi con Claude il piano dettagliato del prototipo","P Scegli i 50 elementi e scrivili in un file JSON"],
      ["P Digitazione romaji → kana con la libreria WanaKana","P Domanda di significato e domanda di lettura"],
      ["P Sinonimi accettati e tolleranza ai refusi","P Logica SRS con test automatici"],
      ["P Pubblica il prototipo","P Fallo provare a 3–5 studenti e raccogli i feedback"]
    ]},
  { n:"字", title:"Database e account", weeks:"4–5 settimane", final:true,
    what:"I contenuti passano su Supabase, ogni utente ha i suoi progressi.",
    days:[
      ["P Schema del database: elementi, traduzioni, percorsi, progressi, review","P Importa i 50 elementi"],
      ["P Login e progressi per utente","P Sposta la logica SRS sul database mantenendo i test"],
      ["P Deploy stabile su Vercel e prova con gli stessi tester"]
    ]},
  { n:"道", title:"Funzioni distintive", weeks:"6+ settimane", final:true,
    what:"Quello che rende l'app diversa da WaniKani. L'ordine finale lo decidi tu.",
    days:[
      ["P Sessioni da massimo 50 review"],
      ["P \"Questi li conosco già\": livello di partenza"],
      ["P Ordine Genki, Minna no Nihongo o Jōyō"],
      ["P Interfaccia e contenuti in più lingue"],
      ["P Strumento di revisione per collaboratori"]
    ]}
  ]}
];
