# Wort-Galaxie Trainer

## GitHub Pages

Live-App: [https://mac8005.github.io/word-learning/](https://mac8005.github.io/word-learning/)

Kinderfreundliche Schreiblern-App mit:

- zentraler Wort-Konfiguration in `/words.json` (im Repo-Root)
- dynamischer Buchstaben-Auswahl aus der JSON-Datei (keine hardcodierten Buchstaben)
- zufälliger Wortreihenfolge
- deutscher Sprachausgabe
- Prüfung auf exakte Schreibweise inkl. Gross-/Kleinschreibung
- Korrekturmodus mit Fehleranzeige
- Münzsystem + Tetris-Bonusspiel
- Malrechnen-Modus mit auswählbaren 1er bis 10er Reihen (Aufgaben werden angezeigt & vorgelesen)

## Wörter erweitern

Neue Buchstaben oder Wörter einfach in `/words.json` eintragen.
Die Dropdown-Auswahl im UI passt sich automatisch an.

## Starten

Lokalen Webserver starten, damit `fetch()` die JSON laden kann:

```bash
cd /Users/massimo/Git/word-learning
python3 -m http.server 8080
```

Dann öffnen:

`http://localhost:8080`
