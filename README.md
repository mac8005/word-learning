# Word Galaxy Trainer

Kid-friendly spelling web app that:

- stores words in JSON (`/data/words.json`)
- picks words in random order
- reads each word aloud (German voice)
- checks exact spelling and capitalization
- shows mistakes and lets the child correct them
- rewards coins and unlocks a mini game

## Run

Use a local web server so `fetch()` can load JSON:

```bash
cd /Users/massimo/Git/word-learning
python3 -m http.server 8080
```

Then open:

`http://localhost:8080`
