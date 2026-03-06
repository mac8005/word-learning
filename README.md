# Wort-Galaxie Trainer

[![GitHub Pages](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-blue)](https://mac8005.github.io/word-learning/)

A fun, gamified German word-learning app for primary school children (ages 7-10). Listen to words, type what you hear, earn coins, and unlock bonus arcade games.

**[Play now](https://mac8005.github.io/word-learning/)**

## Features

### Word Training
- **Dictation mode** — hear a German word via text-to-speech, type it correctly
- **Math mode** — practice multiplication tables (1x to 10x)
- **Letter groups** — pick which letter groups to practice
- **Spaced repetition** — words you get wrong appear more often
- **Correction lab** — fix mistakes after each mission for bonus coins

### Gamification
- **Coin economy** — earn coins for correct answers, spend them on arcade games
- **Daily streak** — track consecutive days of practice with a flame counter
- **Achievement badges** — unlock milestones like "Perfektionist", "Buecherwurm", "7-Day Streak"
- **Stats dashboard** — see total words practiced, accuracy %, and streak history

### Bonus Arcade Games
- **Tetris** — classic block-stacking with Korobeiniki music
- **Snake** — eat apples, grow longer, avoid yourself
- **Moorhuhn** — shoot flying chickens in a parallax countryside scene

### UI/UX
- **Dark mode** — toggle between light and dark themes
- **Sound effects** — audio feedback for correct/wrong answers
- **Smooth transitions** — animated panel switches
- **Mobile-friendly** — touch controls for all games, responsive layout
- **German TTS** — Google Translate Audio with Speech Synthesis fallback

## Architecture

Single-page app with no build system or dependencies:

| File | Purpose |
|------|---------|
| `index.html` | Page structure, game modals |
| `styles.css` | All styling, dark mode, responsive breakpoints |
| `app.js` | All logic (~4800 lines): quiz engine, 3 games, audio, stats |
| `words.json` | Word bank organized by letter groups |

**Key patterns:**
- Global `state` object holds all app state
- Global `els` object holds DOM references
- `localStorage` for persistence (coins, plays, stats, streaks, achievements, dark mode)
- Web Audio API for all sound (game music, SFX, quiz feedback)
- Canvas 2D for Tetris, Snake, and Moorhuhn rendering

## Adding Words

Edit `words.json` to add new letter groups or words:

```json
{
  "letters": [
    {
      "letter": "A",
      "words": ["Apfel", "Anfang", "aber", "Abend"]
    }
  ]
}
```

The UI automatically picks up new letter groups.

## Local Development

Start a local web server (needed for `fetch()` to load the JSON):

```bash
python3 -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080).

## Deployment

The app auto-deploys to GitHub Pages via `.github/workflows/deploy-pages.yml` on push to `main`.

## License

MIT
