# My Study Journal · BSP (bullet study plan)

Un bullet journal digitale per seguire, giorno per giorno, il mio piano di studio di vibe coding: dalle basi di HTML fino a un'app per imparare i kanji.

**App:** https://roccone.github.io/my-study-journal/

## Installare l'icona sul Mac

Apri il Terminale e incolla:

```bash
curl -fsSL https://roccone.github.io/my-study-journal/install.sh | bash
```

Lo script crea l'app "My Study Journal" in `~/Applications` e un collegamento sulla Scrivania. Trascinalo nel Dock: un clic apre il quaderno in una finestra di Brave senza barre.

## Come è fatta

| File | A cosa serve |
| --- | --- |
| `index.html` | La struttura: copertina, pagine, etichette |
| `style.css` | L'aspetto del quaderno |
| `app.js` | La logica: giorni, spunte, note e domande, calendario, animazioni |
| `plan.js` | Il piano di studio, giorno per giorno |
| `install.sh` | Crea l'app con l'icona sul Mac |

## Dove finiscono i miei dati

Spunte, note e domande restano **solo nel browser** (localStorage di Brave, chiave `msj-data-v1`). Nel repository c'è solo il codice. Per sicurezza, ogni tanto: *Full plan → Export backup*.

I dati salvano già le informazioni utili per statistiche future: data e ora di ogni spunta, inizio e fine di ogni giornata, note con data di creazione e modifica, un registro delle azioni e il numero di aperture al giorno.
