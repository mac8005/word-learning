const WORDS_URL_CANDIDATES = ["words.json", "data/words.json"];
const COIN_STORAGE_KEY = "word_galaxy_coins";
const TETRIS_PLAYS_STORAGE_KEY = "word_galaxy_tetris_plays";
const TETRIS_PLAY_BUNDLE_COST = 20;
const TETRIS_PLAY_BUNDLE_AMOUNT = 1;
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BASE_DROP_MS = 700;
const SPEECH_RATE = 0.5;
const BUILD_DATE = "2026-02-23 09:44";
const TABLE_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);

const SNAKE_PLAYS_STORAGE_KEY = "word_galaxy_snake_plays";
const SNAKE_PLAY_BUNDLE_COST = 20;
const SNAKE_PLAY_BUNDLE_AMOUNT = 1;
const SNAKE_COLS = 20;
const SNAKE_ROWS = 20;
const BASE_SNAKE_MS = 190;
const SNAKE_LEVEL_SPEEDS = [190,165,143,124,108,95,84,75,68,62,57,53,50,47,45];
const TETRIS_HIGHSCORE_KEY = "word_galaxy_tetris_highscore";
const SNAKE_HIGHSCORE_KEY = "word_galaxy_snake_highscore";

const SHAPES = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
};

const PIECE_COLORS = {
  I: "#22d3ee",
  O: "#fde047",
  T: "#c084fc",
  S: "#4ade80",
  Z: "#fb7185",
  J: "#60a5fa",
  L: "#fb923c",
};

// Tetris theme (Korobeiniki) – melody voice [frequency, eighthNotes]
const TETRIS_MELODY = [
  // Section A
  [329.63,2],[246.94,1],[261.63,1],[293.66,2],[261.63,1],[246.94,1],
  [220,2],[220,1],[261.63,1],[329.63,2],[293.66,1],[261.63,1],
  [246.94,3],[261.63,1],[293.66,2],[329.63,2],
  [261.63,2],[220,2],[220,4],
  // Section B
  [0,1],[293.66,2],[349.23,1],[440,2],[392,1],[349.23,1],
  [329.63,3],[261.63,1],[329.63,2],[293.66,1],[261.63,1],
  [246.94,3],[261.63,1],[293.66,2],[329.63,2],
  [261.63,2],[220,2],[220,4],
];

// Tetris theme – bass voice [frequency, eighthNotes]
const TETRIS_BASS = [
  [110,4],[82.41,4],
  [110,4],[110,4],
  [103.83,4],[82.41,4],
  [110,4],[82.41,4],
  [146.83,4],[146.83,4],
  [130.81,4],[130.81,4],
  [123.47,4],[82.41,4],
  [110,4],[82.41,4],
];

// Snake theme – upbeat 8-bit melody [frequency, eighthNotes]
const SNAKE_MELODY = [
  [659,1],[784,1],[1047,2],[784,1],[659,1],
  [523,2],[523,1],[659,1],[784,2],
  [698,1],[880,1],[1047,1],[880,1],[698,2],
  [587,4],
  [523,1],[659,1],[784,1],[1047,2],[784,1],
  [659,2],[523,2],[392,2],
  [440,1],[587,1],[698,1],[880,2],[698,1],
  [587,2],[440,2],[440,4],
];

// Snake theme – bass voice [frequency, eighthNotes]
const SNAKE_BASS = [
  [131,4],[165,4],
  [131,4],[175,4],
  [147,4],[196,4],
  [175,4],[131,4],
  [131,4],[165,4],
  [131,4],[131,4],
  [110,4],[138,4],
  [147,4],[131,4],
];

const state = {
  wordBank: {},
  letterKeys: [],
  quizMode: "words",
  quizItems: [],
  answers: [],
  currentIndex: 0,
  quizActive: false,
  correctionBonusGiven: false,
  coins: 0,
  tetrisPlays: 0,
  snakePlays: 0,
  tetrisHighscore: 0,
  snakeHighscore: 0,
  germanVoice: null,
  audioCtx: null,
  savedScrollY: 0,
  tetris: {
    active: false,
    paused: false,
    board: [],
    current: null,
    next: null,
    score: 0,
    lines: 0,
    level: 1,
    dropMs: BASE_DROP_MS,
    lastDropMs: 0,
    rafId: 0,
    musicTimerId: 0,
    musicGain: null,
    musicMelodyIdx: 0,
    musicBassIdx: 0,
  },
  snake: {
    active: false,
    paused: false,
    body: [],           // [{x,y}], [0]=Kopf
    dir: {x:1, y:0},   // aktuelle Richtung
    nextDir: {x:1, y:0}, // gepufferte Richtung
    food: null,         // {x,y}
    bonusFood: null,    // {x,y} optional
    bonusFoodTick: 0,   // eaten-Zähler bei dem Bonus abläuft
    score: 0,
    eaten: 0,
    level: 1,
    tickMs: BASE_SNAKE_MS,
    lastTickMs: 0,
    rafId: 0,
    particles: [],      // [{x,y,vx,vy,life,color}]
    musicTimerId: 0,
    musicGain: null,
    musicMelodyIdx: 0,
    musicBassIdx: 0,
  },
};

const els = {
  setupPanel: document.getElementById("setupPanel"),
  modeSelect: document.getElementById("modeSelect"),
  letterGroupPicker: document.getElementById("letterGroupPicker"),
  letterGroupCount: document.getElementById("letterGroupCount"),
  selectAllGroupsBtn: document.getElementById("selectAllGroupsBtn"),
  selectNoGroupsBtn: document.getElementById("selectNoGroupsBtn"),
  wordSettings: document.getElementById("wordSettings"),
  mathSettings: document.getElementById("mathSettings"),
  tablePicker: document.getElementById("tablePicker"),
  tableCount: document.getElementById("tableCount"),
  selectAllTablesBtn: document.getElementById("selectAllTablesBtn"),
  selectNoTablesBtn: document.getElementById("selectNoTablesBtn"),
  quizPanel: document.getElementById("quizPanel"),
  resultPanel: document.getElementById("resultPanel"),
  setSizeLabel: document.getElementById("setSizeLabel"),
  setSize: document.getElementById("setSize"),
  startBtn: document.getElementById("startBtn"),
  speakBtn: document.getElementById("speakBtn"),
  nextBtn: document.getElementById("nextBtn"),
  wordInput: document.getElementById("wordInput"),
  wordNote: document.getElementById("wordNote"),
  mathNote: document.getElementById("mathNote"),
  quizTitle: document.getElementById("quizTitle"),
  progressText: document.getElementById("progressText"),
  progressFill: document.getElementById("progressFill"),
  taskDisplay: document.getElementById("taskDisplay"),
  letterSlots: document.getElementById("letterSlots"),
  quizFeedback: document.getElementById("quizFeedback"),
  ratingLabel: document.getElementById("ratingLabel"),
  scoreLine: document.getElementById("scoreLine"),
  coinRewardLine: document.getElementById("coinRewardLine"),
  mistakesBlock: document.getElementById("mistakesBlock"),
  mistakesList: document.getElementById("mistakesList"),
  checkCorrectionsBtn: document.getElementById("checkCorrectionsBtn"),
  correctionFeedback: document.getElementById("correctionFeedback"),
  playAgainBtn: document.getElementById("playAgainBtn"),
  coinCount: document.getElementById("coinCount"),
  buyTetrisPlaysBtn: document.getElementById("buyTetrisPlaysBtn"),
  openTetrisBtn: document.getElementById("openTetrisBtn"),
  tetrisPlays: document.getElementById("tetrisPlays"),
  miniGameFeedback: document.getElementById("miniGameFeedback"),
  // Modal elements
  tetrisModalBackdrop: document.getElementById("tetrisModalBackdrop"),
  closeTetrisBtn: document.getElementById("closeTetrisBtn"),
  tetrisCoins: document.getElementById("tetrisCoins"),
  tetrisPlaysModal: document.getElementById("tetrisPlaysModal"),
  tetrisScore: document.getElementById("tetrisScore"),
  tetrisLines: document.getElementById("tetrisLines"),
  tetrisLevel: document.getElementById("tetrisLevel"),
  tetrisCanvas: document.getElementById("tetrisCanvas"),
  nextPieceCanvas: document.getElementById("nextPieceCanvas"),
  startMiniGameBtn: document.getElementById("startMiniGameBtn"),
  pauseMiniGameBtn: document.getElementById("pauseMiniGameBtn"),
  tetrisModalFeedback: document.getElementById("tetrisModalFeedback"),
  // Touch controls (Tetris)
  touchLeft: document.getElementById("touchLeft"),
  touchRight: document.getElementById("touchRight"),
  touchRotate: document.getElementById("touchRotate"),
  touchDown: document.getElementById("touchDown"),
  touchDrop: document.getElementById("touchDrop"),
  // Tetris highscore
  tetrisHighscore: document.getElementById("tetrisHighscore"),
  // Snake panel
  snakePlays: document.getElementById("snakePlays"),
  buySnakePlaysBtn: document.getElementById("buySnakePlaysBtn"),
  openSnakeBtn: document.getElementById("openSnakeBtn"),
  // Snake modal
  snakeModalBackdrop: document.getElementById("snakeModalBackdrop"),
  closeSnakeBtn: document.getElementById("closeSnakeBtn"),
  snakeCoins: document.getElementById("snakeCoins"),
  snakePlaysModal: document.getElementById("snakePlaysModal"),
  snakeScore: document.getElementById("snakeScore"),
  snakeLevel: document.getElementById("snakeLevel"),
  snakeLength: document.getElementById("snakeLength"),
  snakeHighscore: document.getElementById("snakeHighscore"),
  snakeCanvas: document.getElementById("snakeCanvas"),
  startSnakeGameBtn: document.getElementById("startSnakeGameBtn"),
  pauseSnakeGameBtn: document.getElementById("pauseSnakeGameBtn"),
  snakeModalFeedback: document.getElementById("snakeModalFeedback"),
  snakeTouchUp: document.getElementById("snakeTouchUp"),
  snakeTouchDown: document.getElementById("snakeTouchDown"),
  snakeTouchLeft: document.getElementById("snakeTouchLeft"),
  snakeTouchRight: document.getElementById("snakeTouchRight"),
};

const tetrisCtx = els.tetrisCanvas.getContext("2d");
const nextCtx = els.nextPieceCanvas.getContext("2d");
const snakeCtx = els.snakeCanvas.getContext("2d");

initialize();

async function initialize() {
  state.coins = loadCoins();
  state.tetrisPlays = loadTetrisPlays();
  state.snakePlays = loadSnakePlays();
  state.tetrisHighscore = loadTetrisHighscore();
  state.snakeHighscore = loadSnakeHighscore();
  updateCoinDisplay();
  updateTetrisPlayDisplay();
  updateSnakePlaysDisplay();
  updateTetrisHighscoreDisplay();
  updateSnakeHighscoreDisplay();
  updateTetrisStats();
  updateSnakeStats();
  bindEvents();
  setupSnakeEventListeners();
  setupSpeechVoices();
  drawTetris("TETRIS");
  drawSnakeGame("SNAKE");

  const buildEl = document.getElementById("buildInfo");
  if (buildEl) buildEl.textContent = "Build: " + BUILD_DATE;

  els.startBtn.disabled = true;
  els.startBtn.textContent = "Wörter laden...";

  try {
    state.wordBank = await loadWords();
    state.letterKeys = Object.keys(state.wordBank).sort((a, b) => a.localeCompare(b, "de-DE"));
    populateLetterGroupOptions();
    populateTableOptions();
    applyModeUI();
    els.startBtn.disabled = false;
    els.startBtn.textContent = "Mission starten";
    setSetupFeedback();
  } catch (error) {
    console.error(error);
    els.startBtn.textContent = "Laden fehlgeschlagen";
    setFeedback(
      els.quizFeedback,
      "Wortliste konnte nicht geladen werden. Starte einen lokalen Server und lade neu.",
      "bad"
    );
  }
}

function bindEvents() {
  els.startBtn.addEventListener("click", startQuiz);
  els.modeSelect.addEventListener("change", () => {
    state.quizMode = els.modeSelect.value;
    applyModeUI();
    setSetupFeedback();
  });
  els.selectAllGroupsBtn.addEventListener("click", () => {
    for (const pill of els.letterGroupPicker.querySelectorAll(".lg-pill")) {
      pill.classList.add("selected");
    }
    updateLetterGroupCount();
  });
  els.selectNoGroupsBtn.addEventListener("click", () => {
    for (const pill of els.letterGroupPicker.querySelectorAll(".lg-pill")) {
      pill.classList.remove("selected");
    }
    updateLetterGroupCount();
  });
  els.letterGroupPicker.addEventListener("click", (e) => {
    const pill = e.target.closest(".lg-pill");
    if (!pill) return;
    pill.classList.toggle("selected");
    updateLetterGroupCount();
  });
  els.selectAllTablesBtn.addEventListener("click", () => {
    for (const pill of els.tablePicker.querySelectorAll(".lg-pill")) {
      pill.classList.add("selected");
    }
    updateTableCount();
  });
  els.selectNoTablesBtn.addEventListener("click", () => {
    for (const pill of els.tablePicker.querySelectorAll(".lg-pill")) {
      pill.classList.remove("selected");
    }
    updateTableCount();
  });
  els.tablePicker.addEventListener("click", (e) => {
    const pill = e.target.closest(".lg-pill");
    if (!pill) return;
    pill.classList.toggle("selected");
    updateTableCount();
  });
  els.speakBtn.addEventListener("click", speakCurrentItem);
  els.nextBtn.addEventListener("click", submitCurrentAnswer);
  els.wordInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      submitCurrentAnswer();
    }
  });
  els.checkCorrectionsBtn.addEventListener("click", checkCorrections);
  els.playAgainBtn.addEventListener("click", resetToSetup);

  els.buyTetrisPlaysBtn.addEventListener("click", buyTetrisPlays);
  els.openTetrisBtn.addEventListener("click", openTetrisModal);
  els.closeTetrisBtn.addEventListener("click", closeTetrisModal);
  els.startMiniGameBtn.addEventListener("click", startTetrisGame);
  els.pauseMiniGameBtn.addEventListener("click", toggleTetrisPause);

  els.tetrisModalBackdrop.addEventListener("click", (event) => {
    if (event.target === els.tetrisModalBackdrop && !state.tetris.active) {
      closeTetrisModal();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !els.tetrisModalBackdrop.classList.contains("hidden")) {
      if (!state.tetris.active) {
        closeTetrisModal();
      }
    }
  });

  window.addEventListener("keydown", handleTetrisKeyDown);

  // Touch D-pad buttons
  bindTouchButton(els.touchLeft, () => {
    if (tryMovePiece(-1, 0)) { playSfx("move"); drawTetris(); }
  });
  bindTouchButton(els.touchRight, () => {
    if (tryMovePiece(1, 0)) { playSfx("move"); drawTetris(); }
  });
  bindTouchButton(els.touchRotate, () => {
    if (tryRotatePiece()) { playSfx("rotate"); drawTetris(); }
  }, false);
  bindTouchButton(els.touchDown, () => {
    if (tryMovePiece(0, 1)) {
      state.tetris.score += 1;
      updateTetrisStats();
    } else {
      lockCurrentPiece();
    }
    drawTetris();
  });
  bindTouchButton(els.touchDrop, () => {
    hardDrop();
    drawTetris();
  }, false);

  // Swipe gestures on canvas
  bindSwipeGestures(els.tetrisCanvas);
}

function bindTouchButton(el, action, repeat = true) {
  let intervalId = null;
  const REPEAT_DELAY = 150;

  const start = (e) => {
    e.preventDefault();
    if (!state.tetris.active || state.tetris.paused) return;
    action();
    if (!repeat) return;
    clearInterval(intervalId);
    intervalId = setInterval(() => {
      if (!state.tetris.active || state.tetris.paused) { clearInterval(intervalId); return; }
      action();
    }, REPEAT_DELAY);
  };

  const stop = (e) => {
    e.preventDefault();
    clearInterval(intervalId);
    intervalId = null;
  };

  el.addEventListener("touchstart", start, { passive: false });
  el.addEventListener("touchend", stop, { passive: false });
  el.addEventListener("touchcancel", stop, { passive: false });
  el.addEventListener("mousedown", start);
  el.addEventListener("mouseup", stop);
  el.addEventListener("mouseleave", stop);
}

function bindSwipeGestures(canvas) {
  let startX = 0;
  let startY = 0;
  let swiped = false;

  canvas.addEventListener("touchstart", (e) => {
    if (!state.tetris.active || state.tetris.paused) return;
    e.preventDefault();
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    swiped = false;
  }, { passive: false });

  canvas.addEventListener("touchmove", (e) => {
    if (!state.tetris.active || state.tetris.paused || swiped) return;
    e.preventDefault();
    const touch = e.touches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    const MIN_SWIPE = 30;

    if (Math.abs(dx) > MIN_SWIPE && Math.abs(dx) > Math.abs(dy)) {
      swiped = true;
      if (dx > 0) {
        if (tryMovePiece(1, 0)) playSfx("move");
      } else {
        if (tryMovePiece(-1, 0)) playSfx("move");
      }
      startX = touch.clientX;
      swiped = false;
      drawTetris();
    } else if (dy > MIN_SWIPE && Math.abs(dy) > Math.abs(dx)) {
      swiped = true;
      if (tryMovePiece(0, 1)) {
        state.tetris.score += 1;
        updateTetrisStats();
      }
      startY = touch.clientY;
      swiped = false;
      drawTetris();
    }
  }, { passive: false });

  canvas.addEventListener("touchend", (e) => {
    if (!state.tetris.active || state.tetris.paused) return;
    e.preventDefault();
    // Tap to rotate
    if (!swiped) {
      const touch = e.changedTouches[0];
      const dx = Math.abs(touch.clientX - startX);
      const dy = Math.abs(touch.clientY - startY);
      if (dx < 10 && dy < 10) {
        if (tryRotatePiece()) playSfx("rotate");
        drawTetris();
      }
    }
  }, { passive: false });
}

// ─── Modal ───

function openTetrisModal() {
  state.savedScrollY = window.scrollY;
  document.body.classList.add("modal-open");
  document.body.style.top = `-${state.savedScrollY}px`;
  els.tetrisModalBackdrop.classList.remove("hidden");
  updateCoinDisplay();
  updateTetrisPlayDisplay();
  updateTetrisHighscoreDisplay();
  drawTetris(state.tetris.active ? "" : "TETRIS");
  drawNextPiece();
  setFeedback(els.tetrisModalFeedback, "", "ok");
}

function closeTetrisModal() {
  if (state.tetris.active) {
    setFeedback(els.tetrisModalFeedback, "Beende erst das Spiel.", "bad");
    return;
  }
  els.tetrisModalBackdrop.classList.add("hidden");
  document.body.classList.remove("modal-open");
  document.body.style.top = "";
  window.scrollTo(0, state.savedScrollY || 0);
}

function openSnakeModal() {
  state.savedScrollY = window.scrollY;
  document.body.classList.add("modal-open");
  document.body.style.top = `-${state.savedScrollY}px`;
  els.snakeModalBackdrop.classList.remove("hidden");
  updateCoinDisplay();
  updateSnakePlaysDisplay();
  updateSnakeHighscoreDisplay();
  drawSnakeGame(state.snake.active ? "" : "SNAKE");
  setFeedback(els.snakeModalFeedback, "", "ok");
}

function closeSnakeModal() {
  if (state.snake.active) {
    setFeedback(els.snakeModalFeedback, "Beende erst das Spiel.", "bad");
    return;
  }
  els.snakeModalBackdrop.classList.add("hidden");
  document.body.classList.remove("modal-open");
  document.body.style.top = "";
  window.scrollTo(0, state.savedScrollY || 0);
}

// ─── Speech ───

function scoreVoice(voice) {
  const name = voice.name.toLowerCase();
  const lang = voice.lang.toLowerCase();
  let score = 0;
  if (lang === "de-de") score += 10;
  else if (lang.startsWith("de")) score += 5;
  else if (/deutsch|german/i.test(voice.name)) score += 3;
  else return 0; // not a German voice at all

  // Strongly prefer high-quality cloud / neural voices (available in Chrome & Edge on Windows)
  if (/natural|neural|online|wavenet|enhanced/i.test(name)) score += 100;
  // Slightly prefer remote voices (often higher quality than local)
  if (!voice.localService) score += 20;
  return score;
}

function setupSpeechVoices() {
  if (!("speechSynthesis" in window)) {
    return;
  }

  const assignVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    const scored = voices
      .map((v) => ({ voice: v, score: scoreVoice(v) }))
      .filter((e) => e.score > 0)
      .sort((a, b) => b.score - a.score);
    state.germanVoice = scored.length > 0 ? scored[0].voice : null;
  };

  assignVoice();
  if (window.speechSynthesis.addEventListener) {
    window.speechSynthesis.addEventListener("voiceschanged", assignVoice);
  }
}

// ─── Word loading ───

async function loadWords() {
  let loadedFrom = null;
  let data = null;

  for (const candidate of WORDS_URL_CANDIDATES) {
    const response = await fetch(candidate);
    if (!response.ok) {
      continue;
    }
    loadedFrom = candidate;
    data = await response.json();
    break;
  }

  if (!data) {
    throw new Error(`Fehler beim Laden der Wortdatei (${WORDS_URL_CANDIDATES.join(", ")})`);
  }

  console.log(`[Words] Konfiguration geladen aus: ${loadedFrom}`);
  return normalizeWordConfig(data);
}

function normalizeWordConfig(data) {
  const bank = {};

  if (Array.isArray(data?.letters)) {
    for (const group of data.letters) {
      const letter = String(group?.letter ?? "").trim();
      const words = sanitizeWords(group?.words);
      if (!letter || !words.length) continue;
      bank[letter] = words;
    }
  } else if (data?.letters && typeof data.letters === "object") {
    for (const [letter, words] of Object.entries(data.letters)) {
      const cleanLetter = String(letter).trim();
      const cleanWords = sanitizeWords(words);
      if (!cleanLetter || !cleanWords.length) continue;
      bank[cleanLetter] = cleanWords;
    }
  } else if (data && typeof data === "object") {
    for (const [letter, words] of Object.entries(data)) {
      const cleanLetter = String(letter).trim();
      const cleanWords = sanitizeWords(words);
      if (!cleanLetter || !cleanWords.length) continue;
      bank[cleanLetter] = cleanWords;
    }
  }

  if (!Object.keys(bank).length) {
    throw new Error("Die Wortdatei enthält keine gültigen Buchstabengruppen.");
  }
  return bank;
}

function sanitizeWords(words) {
  if (!Array.isArray(words)) return [];
  const result = [];
  for (const word of words) {
    const cleanWord = normalizeDoubleS(String(word ?? "").trim());
    if (cleanWord) {
      result.push(cleanWord);
    }
  }
  return result;
}

function normalizeDoubleS(value) {
  return value.replaceAll("\u00DF", "ss").replaceAll("\u1E9E", "SS");
}

function populateLetterGroupOptions() {
  els.letterGroupPicker.innerHTML = "";
  els.letterGroupPicker.classList.remove("loading");

  for (const letter of state.letterKeys) {
    const pill = document.createElement("span");
    pill.className = "lg-pill selected";
    pill.dataset.value = letter;
    pill.textContent = letter;
    els.letterGroupPicker.appendChild(pill);
  }

  updateLetterGroupCount();
}

function updateLetterGroupCount() {
  const total = els.letterGroupPicker.querySelectorAll(".lg-pill").length;
  const selected = els.letterGroupPicker.querySelectorAll(".lg-pill.selected").length;
  if (total === 0) {
    els.letterGroupCount.textContent = "";
  } else if (selected === total) {
    els.letterGroupCount.textContent = `Alle ${total} Gruppen ausgewählt`;
  } else if (selected === 0) {
    els.letterGroupCount.textContent = "Keine Gruppe ausgewählt";
  } else {
    els.letterGroupCount.textContent = `${selected} von ${total} Gruppen ausgewählt`;
  }
}

function populateTableOptions() {
  els.tablePicker.innerHTML = "";
  for (const table of TABLE_OPTIONS) {
    const pill = document.createElement("span");
    pill.className = "lg-pill selected";
    pill.dataset.value = String(table);
    pill.textContent = `${table}er`;
    els.tablePicker.appendChild(pill);
  }
  updateTableCount();
}

function updateTableCount() {
  const total = els.tablePicker.querySelectorAll(".lg-pill").length;
  const selected = els.tablePicker.querySelectorAll(".lg-pill.selected").length;
  if (total === 0) {
    els.tableCount.textContent = "";
  } else if (selected === total) {
    els.tableCount.textContent = `Alle ${total} Reihen ausgewählt`;
  } else if (selected === 0) {
    els.tableCount.textContent = "Keine Reihe ausgewählt";
  } else {
    els.tableCount.textContent = `${selected} von ${total} Reihen ausgewählt`;
  }
}

function applyModeUI() {
  const isMath = state.quizMode === "math";
  els.wordSettings.classList.toggle("hidden", isMath);
  els.mathSettings.classList.toggle("hidden", !isMath);
  els.wordNote.classList.toggle("hidden", isMath);
  els.mathNote.classList.toggle("hidden", !isMath);
  els.setSizeLabel.textContent = isMath ? "Aufgaben pro Mission" : "Wörter pro Mission";
  els.quizTitle.textContent = isMath ? "Löse die Aufgabe" : "Schreibe, was du hörst";
  els.speakBtn.textContent = isMath ? "Aufgabe vorlesen" : "Wort vorlesen";
  els.nextBtn.textContent = isMath ? "Nächste Aufgabe" : "Nächstes Wort";
  els.wordInput.placeholder = isMath ? "Antwort eingeben" : "Wort hier eingeben";
  els.wordInput.setAttribute(
    "aria-label",
    isMath ? "Antwort eingeben" : "Gesprochenes Wort eingeben"
  );
  for (const option of els.setSize.querySelectorAll("option")) {
    const count = option.value;
    option.textContent = `${count} ${isMath ? "Aufgaben" : "Wörter"}`;
  }
}

function setSetupFeedback() {
  if (state.quizMode === "math") {
    setFeedback(els.quizFeedback, "Wähle Reihen und starte die Mission.", "ok");
  } else {
    setFeedback(els.quizFeedback, "Wähle ein Set und starte die Mission.", "ok");
  }
}

function isMathMode() {
  return state.quizMode === "math";
}

function modeNoun() {
  return isMathMode() ? "Aufgabe" : "Wort";
}

function modeNounPlural() {
  return isMathMode() ? "Aufgaben" : "Wörter";
}

// ─── Quiz ───

function startQuiz() {
  state.quizMode = els.modeSelect.value;
  applyModeUI();
  if (isMathMode()) {
    startMathQuiz();
    return;
  }
  startWordQuiz();
}

function startWordQuiz() {
  const selectedGroups = [...els.letterGroupPicker.querySelectorAll(".lg-pill.selected")].map((p) => p.dataset.value);
  if (!selectedGroups.length) {
    setFeedback(els.quizFeedback, "Bitte mindestens eine Buchstabengruppe auswählen.", "bad");
    return;
  }
  const requestedSize = Number.parseInt(els.setSize.value, 10);
  const pool = getWordPool(selectedGroups);

  if (!pool.length) {
    setFeedback(els.quizFeedback, "Keine Wörter für diese Auswahl gefunden.", "bad");
    return;
  }

  const shuffled = shuffle(pool.slice());
  const setSize = Math.min(requestedSize, shuffled.length);
  state.quizItems = shuffled.slice(0, setSize).map((word) => ({
    type: "word",
    prompt: word,
    answer: word,
    displayText: "",
    speakText: word,
  }));
  state.answers = [];
  state.currentIndex = 0;
  state.quizActive = true;
  state.correctionBonusGiven = false;

  setPanelVisibility({ setup: false, quiz: true, result: false });
  renderCurrentQuizState();
  speakCurrentItem();
}

function startMathQuiz() {
  const selectedTables = [...els.tablePicker.querySelectorAll(".lg-pill.selected")].map((p) =>
    Number.parseInt(p.dataset.value ?? "0", 10)
  ).filter((value) => Number.isFinite(value) && value > 0);

  if (!selectedTables.length) {
    setFeedback(els.quizFeedback, "Bitte mindestens eine Reihe auswählen.", "bad");
    return;
  }

  const requestedSize = Number.parseInt(els.setSize.value, 10);
  const tasks = buildMathTasks(selectedTables, requestedSize);
  if (!tasks.length) {
    setFeedback(els.quizFeedback, "Keine Aufgaben für diese Auswahl gefunden.", "bad");
    return;
  }

  state.quizItems = tasks.map((task) => {
    const displayText = `${task.a} × ${task.b}`;
    return {
      type: "math",
      prompt: `${task.a} x ${task.b}`,
      answer: task.a * task.b,
      displayText,
      speakText: `${task.a} mal ${task.b}`,
    };
  });
  state.answers = [];
  state.currentIndex = 0;
  state.quizActive = true;
  state.correctionBonusGiven = false;

  setPanelVisibility({ setup: false, quiz: true, result: false });
  renderCurrentQuizState();
  speakCurrentItem();
}

function buildMathTasks(tables, count) {
  const pool = [];
  for (const table of tables) {
    for (let factor = 0; factor <= 10; factor += 1) {
      pool.push({ a: table, b: factor });
    }
  }
  if (!pool.length) return [];
  const shuffled = shuffle(pool.slice());
  const tasks = [];
  for (let i = 0; i < count; i += 1) {
    const next = shuffled[i] ?? pool[Math.floor(Math.random() * pool.length)];
    tasks.push(next);
  }
  return tasks;
}

function getWordPool(letterGroups) {
  const allWords = [];
  for (const letter of letterGroups) {
    allWords.push(...(state.wordBank[letter] ?? []));
  }
  return allWords;
}

function renderCurrentQuizState() {
  const currentItem = state.quizItems[state.currentIndex];
  if (!currentItem) {
    return;
  }

  const total = state.quizItems.length;
  const progressPercent = (state.currentIndex / total) * 100;
  els.progressText.textContent = `${modeNoun()} ${state.currentIndex + 1} / ${total}`;
  els.progressFill.style.width = `${Math.max(6, progressPercent)}%`;

  if (isMathMode()) {
    els.taskDisplay.textContent = currentItem.displayText ?? "";
    els.taskDisplay.classList.remove("hidden");
    els.letterSlots.classList.add("hidden");
    els.letterSlots.innerHTML = "";
  } else {
    els.taskDisplay.classList.add("hidden");
    els.letterSlots.classList.remove("hidden");
    els.letterSlots.innerHTML = "";
    for (const char of currentItem.answer) {
      if (char === " ") continue;
      const bubble = document.createElement("span");
      bubble.className = "slot";
      els.letterSlots.appendChild(bubble);
    }
  }

  els.wordInput.value = "";
  els.wordInput.focus();
  if (isMathMode()) {
    setFeedback(els.quizFeedback, "Hören und rechnen. Die Aufgabe wird angezeigt.", "ok");
  } else {
    setFeedback(els.quizFeedback, "Hören und tippen. Das Wort wird nicht angezeigt.", "ok");
  }
}

function speakCurrentItem() {
  if (!state.quizActive) {
    return;
  }
  const item = state.quizItems[state.currentIndex];
  if (!item) return;
  speakWord(item.speakText);
}

// ─── Google Translate TTS fallback ───

const GOOGLE_TTS_TIMEOUT_MS = 3000;

function speakWordViaGoogleAudio(word) {
  return new Promise((resolve, reject) => {
    const url =
      "https://translate.google.com/translate_tts?ie=UTF-8&tl=de&client=tw-ob&q=" +
      encodeURIComponent(word);
    const audio = new Audio(url);
    let settled = false;
    const fail = (err) => { if (!settled) { settled = true; reject(err); } };
    const ok = (v) => { if (!settled) { settled = true; resolve(v); } };

    // Timeout: on iOS, audio.load() may hang silently without firing events
    const timer = setTimeout(() => {
      console.log("[TTS] Google Translate Audio Timeout");
      fail(new Error("Google TTS timeout"));
    }, GOOGLE_TTS_TIMEOUT_MS);

    audio.addEventListener("canplaythrough", () => {
      clearTimeout(timer);
      console.log("[TTS] Verwende Google Translate Audio");
      audio.play().then(ok).catch(fail);
    }, { once: true });
    audio.addEventListener("error", () => {
      clearTimeout(timer);
      fail(new Error("Google TTS audio error"));
    }, { once: true });
    // Trigger load
    audio.load();
  });
}

// ─── Speech Synthesis fallback ───

function findGermanVoiceNow() {
  if (!state.germanVoice && "speechSynthesis" in window) {
    const voices = window.speechSynthesis.getVoices();
    const scored = voices
      .map((v) => ({ voice: v, score: scoreVoice(v) }))
      .filter((e) => e.score > 0)
      .sort((a, b) => b.score - a.score);
    if (scored.length > 0) state.germanVoice = scored[0].voice;
  }
}

function speakWordViaSynthesis(word) {
  if (!("speechSynthesis" in window)) return;
  findGermanVoiceNow();
  console.log("[TTS] Verwende Speech Synthesis:", state.germanVoice ? state.germanVoice.name : "(Browser-Standard de-DE)");
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "de-DE";
  if (state.germanVoice) utterance.voice = state.germanVoice;
  utterance.rate = SPEECH_RATE;
  utterance.pitch = 1.02;
  window.speechSynthesis.speak(utterance);
}

// ─── Public speak function ───

const IS_IOS =
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

function speakWord(word) {
  if (!word) return;

  // iOS Safari: speechSynthesis.speak() MUST be called synchronously inside
  // a user-gesture handler.  Async chains lose the gesture context and Safari
  // blocks all audio.
  if (IS_IOS) {
    console.log("[TTS] iOS erkannt – verwende Speech Synthesis direkt");
    speakWordViaSynthesis(word);
    return;
  }

  // Non-iOS: Google Translate Audio → local Speech Synthesis
  speakWordViaGoogleAudio(word)
    .catch(() => speakWordViaSynthesis(word));
}

function submitCurrentAnswer() {
  if (!state.quizActive) {
    return;
  }

  const currentItem = state.quizItems[state.currentIndex];
  if (!currentItem) {
    return;
  }

  const rawInput = els.wordInput.value.trim();
  if (!rawInput) {
    setFeedback(
      els.quizFeedback,
      isMathMode() ? "Bitte erst eine Antwort eingeben." : "Bitte erst ein Wort eingeben.",
      "bad"
    );
    return;
  }

  if (isMathMode()) {
    if (!/^\d+$/.test(rawInput)) {
      setFeedback(els.quizFeedback, "Bitte nur Zahlen eingeben.", "bad");
      return;
    }
    const userValue = Number.parseInt(rawInput, 10);
    const correct = userValue === currentItem.answer;
    state.answers.push({
      target: String(currentItem.answer),
      userInput: rawInput,
      correct,
      caseOnlyError: false,
      prompt: currentItem.prompt,
    });
  } else {
    const userInput = normalizeDoubleS(rawInput);
    const target = currentItem.answer;
    const correct = userInput === target;
    const caseOnlyError =
      !correct && userInput.localeCompare(target, "de-DE", { sensitivity: "base" }) === 0;

    state.answers.push({
      target,
      userInput,
      correct,
      caseOnlyError,
      prompt: currentItem.prompt,
    });
  }

  state.currentIndex += 1;
  if (state.currentIndex >= state.quizItems.length) {
    finishQuiz();
    return;
  }

  renderCurrentQuizState();
  speakCurrentItem();
}

function finishQuiz() {
  state.quizActive = false;

  const total = state.answers.length;
  const correctCount = state.answers.filter((entry) => entry.correct).length;
  const percent = Math.round((correctCount / total) * 100);
  const rating = getRating(percent);

  const earnedCoins = Math.round(20 * correctCount / total);
  addCoins(earnedCoins);

  els.ratingLabel.textContent = rating;
  els.scoreLine.textContent = `${correctCount} / ${total} richtig (${percent}%)`;
  els.coinRewardLine.textContent = `+${earnedCoins} Münzen erhalten`;
  els.progressFill.style.width = "100%";

  renderMistakes();
  setPanelVisibility({ setup: false, quiz: false, result: true });

  if (percent >= 80) {
    spawnCelebration();
  }
}

function getRating(percent) {
  if (percent >= 95) return "Galaxie-Grossmeister";
  if (percent >= 80) return "Lern-Held";
  if (percent >= 60) return "Starker Denker";
  return "Lern-Entdecker";
}

function renderMistakes() {
  const mistakes = state.answers
    .map((entry, index) => ({ ...entry, index }))
    .filter((entry) => !entry.correct);

  els.mistakesList.innerHTML = "";
  setFeedback(els.correctionFeedback, "", "ok");

  if (!mistakes.length) {
    const nounPlural = modeNounPlural();
    els.mistakesBlock.innerHTML = `
      <h3>Perfekte Mission</h3>
      <p>Alle ${nounPlural} waren richtig. Stark!</p>
    `;
    return;
  }

  const nounPlural = modeNounPlural();
  els.mistakesBlock.innerHTML = `
    <h3>Fehler-Labor</h3>
    <p>Korrigiere die falschen ${nounPlural} und hole Bonus-Münzen.</p>
    <div id="mistakesList"></div>
    <button id="checkCorrectionsBtn" class="btn primary">Korrekturen prüfen</button>
    <p id="correctionFeedback" class="feedback"></p>
  `;

  els.mistakesList = document.getElementById("mistakesList");
  els.checkCorrectionsBtn = document.getElementById("checkCorrectionsBtn");
  els.correctionFeedback = document.getElementById("correctionFeedback");
  els.checkCorrectionsBtn.addEventListener("click", checkCorrections);

  for (const mistake of mistakes) {
    const row = document.createElement("div");
    row.className = "mistake-item";
    row.dataset.answerIndex = String(mistake.index);
    let detail = "";
    if (isMathMode()) {
      detail = "Die Rechnung ist falsch.";
    } else {
      detail = mistake.caseOnlyError
        ? "Buchstaben stimmen, aber Gross-/Kleinschreibung ist falsch."
        : "Die Schreibweise ist falsch.";
    }
    const wrongLabel = isMathMode() ? "Falsche Antwort vorlesen" : "Falsche Eingabe vorlesen";
    const correctLabel = isMathMode() ? "Richtige Antwort vorlesen" : "Richtiges Wort vorlesen";
    const inputPlaceholder = isMathMode() ? "Korrekte Antwort eingeben" : "Korrektes Wort eingeben";
    const promptLine = isMathMode()
      ? `<p class="mistake-meta">Aufgabe: <strong>${escapeHtml(mistake.prompt ?? "")}</strong></p>`
      : "";

    row.innerHTML = `
      <div class="mistake-title">Nochmal versuchen</div>
      ${promptLine}
      <p class="mistake-meta">Deine ${isMathMode() ? "Antwort" : "Eingabe"}: <strong>${escapeHtml(mistake.userInput)}</strong> <button type="button" class="btn secondary speak-wrong">${wrongLabel}</button></p>
      <p class="mistake-meta">${detail}</p>
      <button type="button" class="btn secondary retry-audio">${correctLabel}</button>
      <input type="text" class="correction-input" placeholder="${inputPlaceholder}" />
    `;

    const retryAudioButton = row.querySelector(".retry-audio");
    if (retryAudioButton) {
      retryAudioButton.addEventListener("click", () => speakWord(mistake.target));
    }
    const speakWrongButton = row.querySelector(".speak-wrong");
    if (speakWrongButton) {
      speakWrongButton.addEventListener("click", () => speakWord(mistake.userInput));
    }

    const correctionInput = row.querySelector(".correction-input");
    if (correctionInput) {
      correctionInput.addEventListener("keydown", (e) => {
        if (e.key !== "Enter") return;
        e.preventDefault();
        const allInputs = [...els.mistakesList.querySelectorAll(".correction-input")];
        const currentIndex = allInputs.indexOf(correctionInput);
        const nextInput = allInputs.slice(currentIndex + 1).find((inp) => !inp.closest(".mistake-item.corrected"));
        if (nextInput) {
          nextInput.focus();
        } else {
          checkCorrections();
        }
      });
    }

    els.mistakesList.appendChild(row);
  }
}

function checkCorrections() {
  const rows = [...els.mistakesList.querySelectorAll(".mistake-item")];
  if (!rows.length) {
    return;
  }

  let fixedCount = 0;
  let allCorrectNow = true;

  for (const row of rows) {
    const answerIndex = Number.parseInt(row.dataset.answerIndex ?? "-1", 10);
    const correctionInput = row.querySelector(".correction-input");
    if (!correctionInput) {
      continue;
    }

    const rawValue = correctionInput.value.trim();
    const target = state.answers[answerIndex]?.target;
    if (!target) {
      allCorrectNow = false;
      row.classList.remove("corrected");
      continue;
    }

    if (isMathMode()) {
      if (!/^\d+$/.test(rawValue)) {
        allCorrectNow = false;
        row.classList.remove("corrected");
        continue;
      }
      const proposedNumber = Number.parseInt(rawValue, 10);
      const targetNumber = Number.parseInt(target, 10);
      if (proposedNumber !== targetNumber) {
        console.log(`[Korrektur] Richtige Antwort: ${target}`);
        allCorrectNow = false;
        row.classList.remove("corrected");
        continue;
      }
      console.log(`[Korrektur] Richtige Antwort: ${target}`);
      row.classList.add("corrected");
      fixedCount += 1;
    } else {
      const proposed = normalizeDoubleS(rawValue);
      if (proposed !== target) {
        console.log(`[Korrektur] Richtiges Wort: ${target}`);
        allCorrectNow = false;
        row.classList.remove("corrected");
        continue;
      }
      console.log(`[Korrektur] Richtiges Wort: ${target}`);
      row.classList.add("corrected");
      fixedCount += 1;
    }
  }

  if (!allCorrectNow) {
    setFeedback(
      els.correctionFeedback,
      `${fixedCount} korrigiert. Versuche die restlichen ${modeNounPlural()} nochmal.`,
      "bad"
    );
    return;
  }

  if (!state.correctionBonusGiven) {
    const bonus = 2;
    addCoins(bonus);
    state.correctionBonusGiven = true;
    setFeedback(els.correctionFeedback, `Alles korrigiert! +${bonus} Bonus-Münzen.`, "ok");
    spawnCelebration();
    return;
  }

  setFeedback(els.correctionFeedback, "Alle Korrekturen sind schon erledigt.", "ok");
}

function resetToSetup() {
  state.quizActive = false;
  setPanelVisibility({ setup: true, quiz: false, result: false });
  applyModeUI();
  setSetupFeedback();
}

function setPanelVisibility({ setup, quiz, result }) {
  els.setupPanel.classList.toggle("hidden", !setup);
  els.quizPanel.classList.toggle("hidden", !quiz);
  els.resultPanel.classList.toggle("hidden", !result);
}

// ─── Coins & plays ───

function loadCoins() {
  const parsed = Number.parseInt(window.localStorage.getItem(COIN_STORAGE_KEY) ?? "0", 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function addCoins(delta) {
  state.coins = Math.max(0, state.coins + delta);
  window.localStorage.setItem(COIN_STORAGE_KEY, String(state.coins));
  updateCoinDisplay();
}

function updateCoinDisplay() {
  els.coinCount.textContent = String(state.coins);
  els.tetrisCoins.textContent = `Münzen: ${state.coins}`;
  els.snakeCoins.textContent = `Münzen: ${state.coins}`;
}

function loadTetrisPlays() {
  const parsed = Number.parseInt(
    window.localStorage.getItem(TETRIS_PLAYS_STORAGE_KEY) ?? "0",
    10
  );
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function saveTetrisPlays() {
  window.localStorage.setItem(TETRIS_PLAYS_STORAGE_KEY, String(state.tetrisPlays));
}

function updateTetrisPlayDisplay() {
  els.tetrisPlays.textContent = String(state.tetrisPlays);
  els.tetrisPlaysModal.textContent = String(state.tetrisPlays);
}

function loadTetrisHighscore() {
  const parsed = Number.parseInt(window.localStorage.getItem(TETRIS_HIGHSCORE_KEY) ?? "0", 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function saveTetrisHighscore() {
  window.localStorage.setItem(TETRIS_HIGHSCORE_KEY, String(state.tetrisHighscore));
}

function updateTetrisHighscoreDisplay() {
  els.tetrisHighscore.textContent = String(state.tetrisHighscore);
}

function loadSnakePlays() {
  const parsed = Number.parseInt(window.localStorage.getItem(SNAKE_PLAYS_STORAGE_KEY) ?? "0", 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function saveSnakePlays() {
  window.localStorage.setItem(SNAKE_PLAYS_STORAGE_KEY, String(state.snakePlays));
}

function updateSnakePlaysDisplay() {
  els.snakePlays.textContent = String(state.snakePlays);
  els.snakePlaysModal.textContent = String(state.snakePlays);
}

function loadSnakeHighscore() {
  const parsed = Number.parseInt(window.localStorage.getItem(SNAKE_HIGHSCORE_KEY) ?? "0", 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function saveSnakeHighscore() {
  window.localStorage.setItem(SNAKE_HIGHSCORE_KEY, String(state.snakeHighscore));
}

function updateSnakeHighscoreDisplay() {
  els.snakeHighscore.textContent = String(state.snakeHighscore);
}

function setFeedback(el, text, type) {
  el.textContent = text;
  el.classList.remove("ok", "bad");
  if (type === "ok") el.classList.add("ok");
  if (type === "bad") el.classList.add("bad");
}

// ─── Tetris shop ───

function buyTetrisPlays() {
  if (state.coins < TETRIS_PLAY_BUNDLE_COST) {
    setFeedback(
      els.miniGameFeedback,
      `${TETRIS_PLAY_BUNDLE_COST} Münzen nötig. Erst Wörter trainieren.`,
      "bad"
    );
    playSfx("error");
    return;
  }

  addCoins(-TETRIS_PLAY_BUNDLE_COST);
  state.tetrisPlays += TETRIS_PLAY_BUNDLE_AMOUNT;
  saveTetrisPlays();
  updateTetrisPlayDisplay();
  setFeedback(
    els.miniGameFeedback,
    `1 Tetris-Spiel gekauft (−${TETRIS_PLAY_BUNDLE_COST} Münzen). Verbleibend: ${state.coins} Münzen.`,
    "ok"
  );
  playSfx("buy");
}

function buySnakePlays() {
  if (state.coins < SNAKE_PLAY_BUNDLE_COST) {
    setFeedback(
      els.miniGameFeedback,
      `${SNAKE_PLAY_BUNDLE_COST} Münzen nötig. Erst Wörter trainieren.`,
      "bad"
    );
    playSfx("error");
    return;
  }

  addCoins(-SNAKE_PLAY_BUNDLE_COST);
  state.snakePlays += SNAKE_PLAY_BUNDLE_AMOUNT;
  saveSnakePlays();
  updateSnakePlaysDisplay();
  setFeedback(
    els.miniGameFeedback,
    `1 Snake-Spiel gekauft (−${SNAKE_PLAY_BUNDLE_COST} Münzen). Verbleibend: ${state.coins} Münzen.`,
    "ok"
  );
  playSfx("buy");
}

// ─── Tetris game ───

function startTetrisGame() {
  if (state.tetris.active) {
    setFeedback(els.tetrisModalFeedback, "Tetris läuft bereits.", "bad");
    return;
  }

  if (state.tetrisPlays < 1) {
    setFeedback(
      els.tetrisModalFeedback,
      "Keine Spiele übrig. Kaufe 1 Spiel für 20 Münzen.",
      "bad"
    );
    playSfx("error");
    return;
  }

  state.tetrisPlays -= 1;
  saveTetrisPlays();
  updateTetrisPlayDisplay();

  initTetrisRound();
  state.tetris.active = true;
  state.tetris.paused = false;
  state.tetris.lastDropMs = performance.now();
  setFeedback(els.tetrisModalFeedback, "Tetris gestartet. Viel Spass!", "ok");
  playSfx("start");
  startTetrisMusic();
  state.tetris.rafId = requestAnimationFrame(runTetrisFrame);
}

function initTetrisRound() {
  state.tetris.board = createEmptyBoard();
  state.tetris.score = 0;
  state.tetris.lines = 0;
  state.tetris.level = 1;
  state.tetris.dropMs = BASE_DROP_MS;
  state.tetris.current = createRandomPiece();
  state.tetris.next = createRandomPiece();
  updateTetrisStats();
  drawTetris();
  drawNextPiece();
}

function toggleTetrisPause() {
  if (!state.tetris.active) {
    setFeedback(els.tetrisModalFeedback, "Starte zuerst eine Tetris-Runde.", "bad");
    return;
  }

  state.tetris.paused = !state.tetris.paused;
  if (state.tetris.paused) {
    pauseTetrisMusic();
    setFeedback(els.tetrisModalFeedback, "Tetris pausiert.", "ok");
    drawTetris("PAUSE");
  } else {
    resumeTetrisMusic();
    setFeedback(els.tetrisModalFeedback, "Tetris läuft weiter.", "ok");
    state.tetris.lastDropMs = performance.now();
    state.tetris.rafId = requestAnimationFrame(runTetrisFrame);
  }
}

function runTetrisFrame(timestamp) {
  if (!state.tetris.active) {
    return;
  }
  if (state.tetris.paused) {
    drawTetris("PAUSE");
    return;
  }

  if (timestamp - state.tetris.lastDropMs >= state.tetris.dropMs) {
    if (!tryMovePiece(0, 1)) {
      lockCurrentPiece();
    }
    state.tetris.lastDropMs = timestamp;
  }

  drawTetris();
  state.tetris.rafId = requestAnimationFrame(runTetrisFrame);
}

function handleTetrisKeyDown(event) {
  if (!state.tetris.active || state.tetris.paused) {
    return;
  }

  const controlledKeys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "];
  if (controlledKeys.includes(event.key)) {
    event.preventDefault();
  }

  if (event.key === "ArrowLeft") {
    if (tryMovePiece(-1, 0)) playSfx("move");
  } else if (event.key === "ArrowRight") {
    if (tryMovePiece(1, 0)) playSfx("move");
  } else if (event.key === "ArrowUp") {
    if (tryRotatePiece()) playSfx("rotate");
  } else if (event.key === "ArrowDown") {
    if (tryMovePiece(0, 1)) {
      state.tetris.score += 1;
      updateTetrisStats();
    } else {
      lockCurrentPiece();
    }
  } else if (event.key === " ") {
    hardDrop();
  }

  drawTetris();
}

function hardDrop() {
  let dropped = 0;
  while (tryMovePiece(0, 1)) {
    dropped += 1;
  }
  state.tetris.score += dropped * 2;
  updateTetrisStats();
  playSfx("drop");
  lockCurrentPiece();
}

function createEmptyBoard() {
  return Array.from({ length: BOARD_HEIGHT }, () => Array.from({ length: BOARD_WIDTH }, () => 0));
}

function createRandomPiece() {
  const types = Object.keys(SHAPES);
  const type = types[Math.floor(Math.random() * types.length)];
  const shape = SHAPES[type].map((row) => row.slice());
  const x = Math.floor((BOARD_WIDTH - shape[0].length) / 2);
  const y = -1;
  return { type, shape, x, y, color: PIECE_COLORS[type] };
}

function tryMovePiece(dx, dy) {
  const piece = state.tetris.current;
  if (!piece) return false;
  if (collides(piece, piece.shape, dx, dy)) return false;
  piece.x += dx;
  piece.y += dy;
  return true;
}

function tryRotatePiece() {
  const piece = state.tetris.current;
  if (!piece) return false;

  const rotated = rotateMatrix(piece.shape);
  const kicks = [0, -1, 1, -2, 2];
  for (const offset of kicks) {
    if (!collides(piece, rotated, offset, 0)) {
      piece.shape = rotated;
      piece.x += offset;
      return true;
    }
  }
  return false;
}

function rotateMatrix(matrix) {
  const size = matrix.length;
  const rotated = Array.from({ length: size }, () => Array.from({ length: size }, () => 0));
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      rotated[x][size - 1 - y] = matrix[y][x];
    }
  }
  return rotated;
}

function collides(piece, shape, dx, dy) {
  const board = state.tetris.board;
  for (let y = 0; y < shape.length; y += 1) {
    for (let x = 0; x < shape[y].length; x += 1) {
      if (!shape[y][x]) continue;

      const nextX = piece.x + x + dx;
      const nextY = piece.y + y + dy;

      if (nextX < 0 || nextX >= BOARD_WIDTH || nextY >= BOARD_HEIGHT) {
        return true;
      }
      if (nextY >= 0 && board[nextY][nextX]) {
        return true;
      }
    }
  }
  return false;
}

function lockCurrentPiece() {
  const board = state.tetris.board;
  const piece = state.tetris.current;
  if (!piece) return;

  for (let y = 0; y < piece.shape.length; y += 1) {
    for (let x = 0; x < piece.shape[y].length; x += 1) {
      if (!piece.shape[y][x]) continue;
      const boardY = piece.y + y;
      const boardX = piece.x + x;

      if (boardY < 0) {
        endTetrisGame();
        return;
      }
      board[boardY][boardX] = piece.color;
    }
  }

  const cleared = clearLines();
  if (cleared > 0) {
    playSfx("line");
  } else {
    playSfx("lock");
  }

  state.tetris.current = state.tetris.next;
  state.tetris.next = createRandomPiece();
  drawNextPiece();

  if (collides(state.tetris.current, state.tetris.current.shape, 0, 0)) {
    endTetrisGame();
    return;
  }

  updateTetrisStats();
}

function clearLines() {
  const board = state.tetris.board;
  let cleared = 0;

  for (let y = BOARD_HEIGHT - 1; y >= 0; y -= 1) {
    if (board[y].every(Boolean)) {
      board.splice(y, 1);
      board.unshift(Array.from({ length: BOARD_WIDTH }, () => 0));
      cleared += 1;
      y += 1;
    }
  }

  if (!cleared) {
    return 0;
  }

  const pointsByLines = { 1: 100, 2: 300, 3: 500, 4: 800 };
  state.tetris.score += (pointsByLines[cleared] ?? 0) * state.tetris.level;
  state.tetris.lines += cleared;
  state.tetris.level = 1 + Math.floor(state.tetris.lines / 10);
  // Classic Tetris speed curve: gets noticeably faster each level
  const LEVEL_SPEEDS = [
    700, 620, 550, 470, 380, 300, 220, 170, 130, 100,
     80,  80,  80,  70,  70,  70,  50,  50,  50,  30,
  ];
  const lvl = state.tetris.level;
  state.tetris.dropMs = LEVEL_SPEEDS[Math.min(lvl - 1, LEVEL_SPEEDS.length - 1)] ?? 30;
  return cleared;
}

function endTetrisGame() {
  state.tetris.active = false;
  state.tetris.paused = false;
  cancelAnimationFrame(state.tetris.rafId);
  stopTetrisMusic();
  drawTetris("ENDE");

  let feedback = `Tetris vorbei! Punkte: ${state.tetris.score}, Linien: ${state.tetris.lines}. Trainiere Wörter für neue Spiele!`;
  if (state.tetris.score > 0 && state.tetris.score > state.tetrisHighscore) {
    state.tetrisHighscore = state.tetris.score;
    saveTetrisHighscore();
    updateTetrisHighscoreDisplay();
    feedback += " Neuer Rekord!";
  }

  setFeedback(els.tetrisModalFeedback, feedback, "ok");

  if (state.tetris.lines >= 4) {
    spawnCelebration();
  }
  playSfx("gameOver");
}

// ─── Snake game ───

function startSnakeGame() {
  if (state.snake.active) {
    setFeedback(els.snakeModalFeedback, "Snake läuft bereits.", "bad");
    return;
  }

  if (state.snakePlays < 1) {
    setFeedback(
      els.snakeModalFeedback,
      "Keine Spiele übrig. Kaufe 1 Spiel für 20 Münzen.",
      "bad"
    );
    playSfx("error");
    return;
  }

  state.snakePlays -= 1;
  saveSnakePlays();
  updateSnakePlaysDisplay();

  initSnakeRound();
  state.snake.active = true;
  state.snake.paused = false;
  state.snake.lastTickMs = performance.now();
  setFeedback(els.snakeModalFeedback, "Snake gestartet. Viel Spass!", "ok");
  playSfx("start");
  startSnakeMusic();
  state.snake.rafId = requestAnimationFrame(runSnakeFrame);
}

function initSnakeRound() {
  const midX = Math.floor(SNAKE_COLS / 2);
  const midY = Math.floor(SNAKE_ROWS / 2);
  state.snake.body = [
    {x: midX, y: midY},
    {x: midX - 1, y: midY},
    {x: midX - 2, y: midY},
  ];
  state.snake.dir = {x: 1, y: 0};
  state.snake.nextDir = {x: 1, y: 0};
  state.snake.score = 0;
  state.snake.eaten = 0;
  state.snake.level = 1;
  state.snake.tickMs = BASE_SNAKE_MS;
  state.snake.bonusFood = null;
  state.snake.bonusFoodTick = 0;
  state.snake.particles = [];
  state.snake.food = placeFood(false);
  updateSnakeStats();
  drawSnakeGame();
}

function placeFood(isBonus) {
  const occupied = new Set(state.snake.body.map(s => `${s.x},${s.y}`));
  if (state.snake.food) occupied.add(`${state.snake.food.x},${state.snake.food.y}`);
  if (state.snake.bonusFood) occupied.add(`${state.snake.bonusFood.x},${state.snake.bonusFood.y}`);

  const candidates = [];
  for (let y = 0; y < SNAKE_ROWS; y++) {
    for (let x = 0; x < SNAKE_COLS; x++) {
      if (!occupied.has(`${x},${y}`)) candidates.push({x, y});
    }
  }

  if (!candidates.length) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function toggleSnakePause() {
  if (!state.snake.active) {
    setFeedback(els.snakeModalFeedback, "Starte zuerst eine Snake-Runde.", "bad");
    return;
  }
  state.snake.paused = !state.snake.paused;
  if (state.snake.paused) {
    pauseSnakeMusic();
    setFeedback(els.snakeModalFeedback, "Snake pausiert.", "ok");
    drawSnakeGame("PAUSE");
  } else {
    resumeSnakeMusic();
    setFeedback(els.snakeModalFeedback, "Snake läuft weiter.", "ok");
    state.snake.lastTickMs = performance.now();
    state.snake.rafId = requestAnimationFrame(runSnakeFrame);
  }
}

function runSnakeFrame(ts) {
  if (!state.snake.active) return;
  if (state.snake.paused) {
    drawSnakeGame("PAUSE");
    return;
  }

  if (ts - state.snake.lastTickMs >= state.snake.tickMs) {
    moveSnake();
    state.snake.lastTickMs = ts;
  }

  drawSnakeGame();
  state.snake.rafId = requestAnimationFrame(runSnakeFrame);
}

function moveSnake() {
  state.snake.dir = state.snake.nextDir;
  const head = state.snake.body[0];
  const newHead = {
    x: head.x + state.snake.dir.x,
    y: head.y + state.snake.dir.y,
  };

  // Wall collision
  if (newHead.x < 0 || newHead.x >= SNAKE_COLS || newHead.y < 0 || newHead.y >= SNAKE_ROWS) {
    endSnakeGame();
    return;
  }

  // Self collision
  if (state.snake.body.some(s => s.x === newHead.x && s.y === newHead.y)) {
    endSnakeGame();
    return;
  }

  state.snake.body.unshift(newHead);

  // Check bonus food
  if (state.snake.bonusFood && newHead.x === state.snake.bonusFood.x && newHead.y === state.snake.bonusFood.y) {
    state.snake.score += 50 * state.snake.level;
    state.snake.bonusFood = null;
    spawnSnakeParticles(newHead.x, newHead.y, "#fbbf24");
    spawnCelebration();
    updateSnakeStats();
    return; // grow: don't remove tail
  }

  // Check bonus food expiry
  if (state.snake.bonusFood && state.snake.eaten >= state.snake.bonusFoodTick) {
    state.snake.bonusFood = null;
  }

  // Check normal food
  if (state.snake.food && newHead.x === state.snake.food.x && newHead.y === state.snake.food.y) {
    state.snake.score += 10 * state.snake.level;
    state.snake.eaten += 1;
    spawnSnakeParticles(newHead.x, newHead.y, "#ef4444");

    // Level up every 5 eaten
    if (state.snake.eaten % 5 === 0) {
      state.snake.level += 1;
      const idx = Math.min(state.snake.level - 1, SNAKE_LEVEL_SPEEDS.length - 1);
      state.snake.tickMs = SNAKE_LEVEL_SPEEDS[idx];
    }

    // Spawn bonus food every 10 eaten
    if (state.snake.eaten % 10 === 0) {
      state.snake.bonusFood = placeFood(true);
      state.snake.bonusFoodTick = state.snake.eaten + 8;
    }

    state.snake.food = placeFood(false);
    updateSnakeStats();
    return; // grow: don't remove tail
  }

  // Normal move: remove tail
  state.snake.body.pop();
}

function endSnakeGame() {
  state.snake.active = false;
  state.snake.paused = false;
  cancelAnimationFrame(state.snake.rafId);
  stopSnakeMusic();
  drawSnakeGame("ENDE");

  let feedback = `Snake vorbei! Punkte: ${state.snake.score}, Länge: ${state.snake.body.length}. Trainiere Wörter für neue Spiele!`;
  if (state.snake.score > 0 && state.snake.score > state.snakeHighscore) {
    state.snakeHighscore = state.snake.score;
    saveSnakeHighscore();
    updateSnakeHighscoreDisplay();
    feedback += " Neuer Rekord!";
  }

  setFeedback(els.snakeModalFeedback, feedback, "ok");

  if (state.snake.score >= 100) {
    spawnCelebration();
  }
  playSfx("gameOver");
}

function spawnSnakeParticles(gx, gy, color) {
  const cell = Math.floor(Math.min(els.snakeCanvas.width, els.snakeCanvas.height) / SNAKE_COLS);
  const px = gx * cell + cell / 2;
  const py = gy * cell + cell / 2;
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    state.snake.particles.push({
      x: px, y: py,
      vx: Math.cos(angle) * (2 + Math.random() * 2),
      vy: Math.sin(angle) * (2 + Math.random() * 2),
      life: 1,
      color,
    });
  }
}

// ─── Tetris rendering ───

function updateTetrisStats() {
  els.tetrisScore.textContent = String(state.tetris.score);
  els.tetrisLines.textContent = String(state.tetris.lines);
  els.tetrisLevel.textContent = String(state.tetris.level);
}

// ─── Snake rendering ───

function updateSnakeStats() {
  els.snakeScore.textContent = String(state.snake.score);
  els.snakeLevel.textContent = String(state.snake.level);
  els.snakeLength.textContent = String(state.snake.body.length);
}

function drawSnakeGame(overlayText = "") {
  const canvas = els.snakeCanvas;
  const ctx = snakeCtx;
  const cell = Math.floor(Math.min(canvas.width, canvas.height) / SNAKE_COLS);
  const W = canvas.width;
  const H = canvas.height;
  const pad = 1;

  // Background
  ctx.fillStyle = "#021209";
  ctx.fillRect(0, 0, W, H);

  // Subtle grid
  ctx.strokeStyle = "rgba(22, 163, 74, 0.08)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= SNAKE_COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * cell, 0);
    ctx.lineTo(x * cell, H);
    ctx.stroke();
  }
  for (let y = 0; y <= SNAKE_ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * cell);
    ctx.lineTo(W, y * cell);
    ctx.stroke();
  }

  // Draw snake body (tail → head for gradient layering)
  const body = state.snake.body;
  for (let i = body.length - 1; i >= 0; i--) {
    const seg = body[i];
    const t = body.length > 1 ? i / (body.length - 1) : 0; // 0=head, 1=tail
    const g = Math.round(163 - t * 80);
    const r = Math.round(22 + t * 10);
    ctx.fillStyle = `rgb(${r}, ${g}, 74)`;

    const sx = seg.x * cell;
    const sy = seg.y * cell;
    ctx.fillRect(sx + pad, sy + pad, cell - 2 * pad, cell - 2 * pad);

    // Connector to next segment (fills the gap between cells)
    if (i < body.length - 1) {
      const next = body[i + 1];
      if (next.x === seg.x + 1) {
        ctx.fillRect(sx + cell - pad, sy + pad, 2 * pad, cell - 2 * pad);
      } else if (next.x === seg.x - 1) {
        ctx.fillRect(sx, sy + pad, 2 * pad, cell - 2 * pad);
      } else if (next.y === seg.y + 1) {
        ctx.fillRect(sx + pad, sy + cell - pad, cell - 2 * pad, 2 * pad);
      } else if (next.y === seg.y - 1) {
        ctx.fillRect(sx + pad, sy, cell - 2 * pad, 2 * pad);
      }
    }
  }

  // Snake head eyes + pupils
  if (body.length > 0) {
    const head = body[0];
    const dir = state.snake.dir;
    const hx = head.x * cell;
    const hy = head.y * cell;
    const eyeR = Math.max(1.5, cell * 0.15);
    let e1x, e1y, e2x, e2y;

    if (dir.x === 1) {
      e1x = hx + cell * 0.75; e1y = hy + cell * 0.3;
      e2x = hx + cell * 0.75; e2y = hy + cell * 0.7;
    } else if (dir.x === -1) {
      e1x = hx + cell * 0.25; e1y = hy + cell * 0.3;
      e2x = hx + cell * 0.25; e2y = hy + cell * 0.7;
    } else if (dir.y === -1) {
      e1x = hx + cell * 0.3; e1y = hy + cell * 0.25;
      e2x = hx + cell * 0.7; e2y = hy + cell * 0.25;
    } else {
      e1x = hx + cell * 0.3; e1y = hy + cell * 0.75;
      e2x = hx + cell * 0.7; e2y = hy + cell * 0.75;
    }

    ctx.fillStyle = "white";
    ctx.beginPath(); ctx.arc(e1x, e1y, eyeR, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(e2x, e2y, eyeR, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#030712";
    ctx.beginPath(); ctx.arc(e1x + dir.x, e1y + dir.y, eyeR * 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(e2x + dir.x, e2y + dir.y, eyeR * 0.5, 0, Math.PI * 2); ctx.fill();
  }

  // Normal food (red circle with shine)
  if (state.snake.food) {
    const f = state.snake.food;
    const fx = f.x * cell + cell / 2;
    const fy = f.y * cell + cell / 2;
    const fr = cell * 0.38;
    ctx.beginPath();
    ctx.arc(fx, fy, fr, 0, Math.PI * 2);
    ctx.fillStyle = "#ef4444";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(fx - fr * 0.25, fy - fr * 0.3, fr * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fill();
  }

  // Bonus food (gold, pulsing with star)
  if (state.snake.bonusFood) {
    const b = state.snake.bonusFood;
    const bx = b.x * cell + cell / 2;
    const by = b.y * cell + cell / 2;
    const pulse = 1 + 0.15 * Math.sin(performance.now() / 200);
    const br = cell * 0.4 * pulse;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fillStyle = "#fbbf24";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(bx - br * 0.25, by - br * 0.3, br * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fill();
    ctx.fillStyle = "#92400e";
    ctx.font = `bold ${Math.max(8, Math.floor(cell * 0.5))}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("★", bx, by);
    ctx.textBaseline = "alphabetic";
  }

  // Particles
  for (let i = state.snake.particles.length - 1; i >= 0; i--) {
    const p = state.snake.particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.07;
    if (p.life <= 0) {
      state.snake.particles.splice(i, 1);
      continue;
    }
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Overlay (SNAKE / PAUSE / ENDE)
  if (overlayText) {
    ctx.fillStyle = "rgba(2, 18, 9, 0.74)";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#4ade80";
    ctx.font = "700 34px 'Baloo 2'";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(overlayText, W / 2, H / 2);
    ctx.textBaseline = "alphabetic";
  }
}

function drawTetris(overlayText = "") {
  const cell = Math.floor(
    Math.min(els.tetrisCanvas.width / BOARD_WIDTH, els.tetrisCanvas.height / BOARD_HEIGHT)
  );
  tetrisCtx.clearRect(0, 0, els.tetrisCanvas.width, els.tetrisCanvas.height);
  tetrisCtx.fillStyle = "#020617";
  tetrisCtx.fillRect(0, 0, els.tetrisCanvas.width, els.tetrisCanvas.height);

  drawBoard(cell);
  drawPiece(state.tetris.current, cell, tetrisCtx);
  drawGrid(cell);

  if (overlayText) {
    tetrisCtx.fillStyle = "rgba(2, 6, 23, 0.74)";
    tetrisCtx.fillRect(0, 0, els.tetrisCanvas.width, els.tetrisCanvas.height);
    tetrisCtx.fillStyle = "#f8fafc";
    tetrisCtx.font = "700 34px 'Baloo 2'";
    tetrisCtx.textAlign = "center";
    tetrisCtx.fillText(overlayText, els.tetrisCanvas.width / 2, els.tetrisCanvas.height / 2);
  }
}

function drawNextPiece() {
  const canvas = els.nextPieceCanvas;
  const ctx = nextCtx;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(2, 6, 23, 0.5)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const piece = state.tetris.next;
  if (!piece) return;

  const cellSize = 20;
  const shape = piece.shape;
  const shapeW = shape[0].length * cellSize;
  const shapeH = shape.length * cellSize;
  const offsetX = Math.floor((canvas.width - shapeW) / 2);
  const offsetY = Math.floor((canvas.height - shapeH) / 2);

  for (let y = 0; y < shape.length; y += 1) {
    for (let x = 0; x < shape[y].length; x += 1) {
      if (!shape[y][x]) continue;
      const px = offsetX + x * cellSize;
      const py = offsetY + y * cellSize;
      ctx.fillStyle = piece.color;
      ctx.fillRect(px, py, cellSize, cellSize);
      ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
      ctx.fillRect(px + 2, py + 2, cellSize - 4, cellSize / 3);
      ctx.strokeStyle = "rgba(15, 23, 42, 0.35)";
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
    }
  }
}

function drawBoard(cell) {
  for (let y = 0; y < BOARD_HEIGHT; y += 1) {
    for (let x = 0; x < BOARD_WIDTH; x += 1) {
      const color = state.tetris.board[y]?.[x];
      if (!color) continue;
      drawCell(x, y, cell, color);
    }
  }
}

function drawPiece(piece, cell, ctx) {
  if (!piece) return;
  for (let y = 0; y < piece.shape.length; y += 1) {
    for (let x = 0; x < piece.shape[y].length; x += 1) {
      if (!piece.shape[y][x]) continue;
      const drawY = piece.y + y;
      if (drawY < 0) continue;
      drawCell(piece.x + x, drawY, cell, piece.color);
    }
  }
}

function drawCell(x, y, cell, color) {
  tetrisCtx.fillStyle = color;
  tetrisCtx.fillRect(x * cell, y * cell, cell, cell);
  tetrisCtx.fillStyle = "rgba(255, 255, 255, 0.35)";
  tetrisCtx.fillRect(x * cell + 2, y * cell + 2, cell - 4, cell / 3);
  tetrisCtx.strokeStyle = "rgba(15, 23, 42, 0.35)";
  tetrisCtx.lineWidth = 2;
  tetrisCtx.strokeRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2);
}

function drawGrid(cell) {
  tetrisCtx.strokeStyle = "rgba(148, 163, 184, 0.14)";
  tetrisCtx.lineWidth = 1;
  for (let x = 0; x <= BOARD_WIDTH; x += 1) {
    tetrisCtx.beginPath();
    tetrisCtx.moveTo(x * cell, 0);
    tetrisCtx.lineTo(x * cell, els.tetrisCanvas.height);
    tetrisCtx.stroke();
  }
  for (let y = 0; y <= BOARD_HEIGHT; y += 1) {
    tetrisCtx.beginPath();
    tetrisCtx.moveTo(0, y * cell);
    tetrisCtx.lineTo(els.tetrisCanvas.width, y * cell);
    tetrisCtx.stroke();
  }
}

// ─── Audio ───

function ensureAudio() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!state.audioCtx) {
    state.audioCtx = new Ctx();
  }
  if (state.audioCtx.state === "suspended") {
    state.audioCtx.resume();
  }
  return state.audioCtx;
}

// iOS requires AudioContext to be unlocked during a user gesture.
// Play a tiny silent buffer on the very first interaction so that
// all subsequent playTone / music scheduling works reliably.
function unlockAudioOnce() {
  const ctx = ensureAudio();
  if (!ctx) return;
  const buf = ctx.createBuffer(1, 1, ctx.sampleRate);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(ctx.destination);
  src.start(0);
  // Only needs to run once
  document.removeEventListener("touchstart", unlockAudioOnce, true);
  document.removeEventListener("click", unlockAudioOnce, true);
}
document.addEventListener("touchstart", unlockAudioOnce, true);
document.addEventListener("click", unlockAudioOnce, true);

function playTone(frequency, duration, options = {}) {
  const ctx = ensureAudio();
  if (!ctx) return;

  const type = options.type ?? "square";
  const gainValue = options.gain ?? 0.03;
  const delay = options.delay ?? 0;
  const endFrequency = options.endFrequency ?? frequency;

  const startTime = ctx.currentTime + delay;
  const endTime = startTime + duration;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startTime);
  osc.frequency.linearRampToValueAtTime(endFrequency, endTime);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(gainValue, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(endTime + 0.01);
}

function playSfx(name) {
  if (!(window.AudioContext || window.webkitAudioContext)) {
    return;
  }

  if (name === "move") {
    playTone(190, 0.04, { type: "square", gain: 0.015 });
  } else if (name === "rotate") {
    playTone(320, 0.05, { type: "triangle", gain: 0.018 });
    playTone(520, 0.04, { type: "triangle", gain: 0.014, delay: 0.05 });
  } else if (name === "drop") {
    playTone(210, 0.08, { type: "sawtooth", gain: 0.02, endFrequency: 120 });
  } else if (name === "line") {
    playTone(340, 0.08, { type: "square", gain: 0.02 });
    playTone(440, 0.08, { type: "square", gain: 0.018, delay: 0.07 });
    playTone(620, 0.11, { type: "square", gain: 0.018, delay: 0.14 });
  } else if (name === "lock") {
    playTone(140, 0.05, { type: "square", gain: 0.014 });
  } else if (name === "start") {
    playTone(260, 0.08, { type: "triangle", gain: 0.02 });
    playTone(390, 0.1, { type: "triangle", gain: 0.02, delay: 0.08 });
  } else if (name === "buy") {
    playTone(520, 0.07, { type: "triangle", gain: 0.02 });
    playTone(780, 0.09, { type: "triangle", gain: 0.02, delay: 0.08 });
  } else if (name === "error") {
    playTone(220, 0.08, { type: "sawtooth", gain: 0.02, endFrequency: 170 });
  } else if (name === "gameOver") {
    playTone(280, 0.09, { type: "sawtooth", gain: 0.018, endFrequency: 180 });
    playTone(210, 0.1, { type: "sawtooth", gain: 0.018, delay: 0.09, endFrequency: 130 });
    playTone(160, 0.12, { type: "sawtooth", gain: 0.018, delay: 0.19, endFrequency: 90 });
  }
}

// ─── Tetris music (Korobeiniki) ───

function scheduleMusicNote(freq, when, dur, type, vol) {
  const ctx = state.audioCtx;
  const dest = state.tetris.musicGain;
  if (!ctx || !dest) return;

  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;

  const end = when + dur;
  const attack = when + 0.015;
  const release = Math.max(attack + 0.001, end - 0.02);

  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(vol, attack);
  g.gain.setValueAtTime(vol, release);
  g.gain.exponentialRampToValueAtTime(0.0001, end);

  osc.connect(g).connect(dest);
  osc.start(when);
  osc.stop(end + 0.01);
}

function runMusicScheduler() {
  const ctx = state.audioCtx;
  if (!ctx || !state.tetris.musicGain) return;

  const BPM = 144;
  const eighth = 60 / BPM / 2;
  let melTime = ctx.currentTime + 0.05;
  let bassTime = ctx.currentTime + 0.05;

  function tick() {
    if (!state.tetris.musicGain) return;

    while (melTime < ctx.currentTime + 0.25) {
      const [f, d] = TETRIS_MELODY[state.tetris.musicMelodyIdx];
      const dur = d * eighth;
      if (f > 0) scheduleMusicNote(f, melTime, dur * 0.9, "square", 0.012);
      melTime += dur;
      state.tetris.musicMelodyIdx = (state.tetris.musicMelodyIdx + 1) % TETRIS_MELODY.length;
    }

    while (bassTime < ctx.currentTime + 0.25) {
      const [f, d] = TETRIS_BASS[state.tetris.musicBassIdx];
      const dur = d * eighth;
      if (f > 0) scheduleMusicNote(f, bassTime, dur * 0.85, "triangle", 0.010);
      bassTime += dur;
      state.tetris.musicBassIdx = (state.tetris.musicBassIdx + 1) % TETRIS_BASS.length;
    }

    state.tetris.musicTimerId = setTimeout(tick, 100);
  }

  tick();
}

function startTetrisMusic() {
  const ctx = ensureAudio();
  if (!ctx) return;
  stopTetrisMusic();

  const begin = () => {
    const gain = ctx.createGain();
    gain.gain.value = 1;
    gain.connect(ctx.destination);
    state.tetris.musicGain = gain;
    state.tetris.musicMelodyIdx = 0;
    state.tetris.musicBassIdx = 0;
    runMusicScheduler();
  };

  // On iOS the context may still be resuming; wait for it before scheduling
  if (ctx.state === "suspended") {
    ctx.resume().then(begin);
  } else {
    begin();
  }
}

function pauseTetrisMusic() {
  clearTimeout(state.tetris.musicTimerId);
  state.tetris.musicTimerId = 0;
  if (state.tetris.musicGain && state.audioCtx) {
    state.tetris.musicGain.gain.setTargetAtTime(0, state.audioCtx.currentTime, 0.03);
  }
}

function resumeTetrisMusic() {
  if (!state.tetris.musicGain || !state.audioCtx) return;
  state.tetris.musicGain.gain.setTargetAtTime(1, state.audioCtx.currentTime, 0.03);
  runMusicScheduler();
}

function stopTetrisMusic() {
  clearTimeout(state.tetris.musicTimerId);
  state.tetris.musicTimerId = 0;
  if (state.tetris.musicGain) {
    try {
      if (state.audioCtx) {
        state.tetris.musicGain.gain.setValueAtTime(0, state.audioCtx.currentTime);
      }
      state.tetris.musicGain.disconnect();
    } catch (_) { /* ignore */ }
    state.tetris.musicGain = null;
  }
  state.tetris.musicMelodyIdx = 0;
  state.tetris.musicBassIdx = 0;
}

// ─── Snake music ───

function scheduleSnakeMusicNote(freq, when, dur, type, vol) {
  const ctx = state.audioCtx;
  const dest = state.snake.musicGain;
  if (!ctx || !dest) return;

  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;

  const end = when + dur;
  const attack = when + 0.015;
  const release = Math.max(attack + 0.001, end - 0.02);

  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(vol, attack);
  g.gain.setValueAtTime(vol, release);
  g.gain.exponentialRampToValueAtTime(0.0001, end);

  osc.connect(g).connect(dest);
  osc.start(when);
  osc.stop(end + 0.01);
}

function runSnakeMusicScheduler() {
  const ctx = state.audioCtx;
  if (!ctx || !state.snake.musicGain) return;

  const BPM = 168;
  const eighth = 60 / BPM / 2;
  let melTime = ctx.currentTime + 0.05;
  let bassTime = ctx.currentTime + 0.05;

  function tick() {
    if (!state.snake.musicGain) return;

    while (melTime < ctx.currentTime + 0.25) {
      const [f, d] = SNAKE_MELODY[state.snake.musicMelodyIdx];
      const dur = d * eighth;
      if (f > 0) scheduleSnakeMusicNote(f, melTime, dur * 0.9, "square", 0.010);
      melTime += dur;
      state.snake.musicMelodyIdx = (state.snake.musicMelodyIdx + 1) % SNAKE_MELODY.length;
    }

    while (bassTime < ctx.currentTime + 0.25) {
      const [f, d] = SNAKE_BASS[state.snake.musicBassIdx];
      const dur = d * eighth;
      if (f > 0) scheduleSnakeMusicNote(f, bassTime, dur * 0.85, "triangle", 0.008);
      bassTime += dur;
      state.snake.musicBassIdx = (state.snake.musicBassIdx + 1) % SNAKE_BASS.length;
    }

    state.snake.musicTimerId = setTimeout(tick, 100);
  }

  tick();
}

function startSnakeMusic() {
  const ctx = ensureAudio();
  if (!ctx) return;
  stopSnakeMusic();

  const begin = () => {
    const gain = ctx.createGain();
    gain.gain.value = 1;
    gain.connect(ctx.destination);
    state.snake.musicGain = gain;
    state.snake.musicMelodyIdx = 0;
    state.snake.musicBassIdx = 0;
    runSnakeMusicScheduler();
  };

  if (ctx.state === "suspended") {
    ctx.resume().then(begin);
  } else {
    begin();
  }
}

function pauseSnakeMusic() {
  clearTimeout(state.snake.musicTimerId);
  state.snake.musicTimerId = 0;
  if (state.snake.musicGain && state.audioCtx) {
    state.snake.musicGain.gain.setTargetAtTime(0, state.audioCtx.currentTime, 0.03);
  }
}

function resumeSnakeMusic() {
  if (!state.snake.musicGain || !state.audioCtx) return;
  state.snake.musicGain.gain.setTargetAtTime(1, state.audioCtx.currentTime, 0.03);
  runSnakeMusicScheduler();
}

function stopSnakeMusic() {
  clearTimeout(state.snake.musicTimerId);
  state.snake.musicTimerId = 0;
  if (state.snake.musicGain) {
    try {
      if (state.audioCtx) {
        state.snake.musicGain.gain.setValueAtTime(0, state.audioCtx.currentTime);
      }
      state.snake.musicGain.disconnect();
    } catch (_) { /* ignore */ }
    state.snake.musicGain = null;
  }
  state.snake.musicMelodyIdx = 0;
  state.snake.musicBassIdx = 0;
}

// ─── Snake event listeners ───

function setupSnakeEventListeners() {
  els.buySnakePlaysBtn.addEventListener("click", buySnakePlays);
  els.openSnakeBtn.addEventListener("click", openSnakeModal);
  els.closeSnakeBtn.addEventListener("click", closeSnakeModal);
  els.startSnakeGameBtn.addEventListener("click", startSnakeGame);
  els.pauseSnakeGameBtn.addEventListener("click", toggleSnakePause);

  els.snakeModalBackdrop.addEventListener("click", (event) => {
    if (event.target === els.snakeModalBackdrop && !state.snake.active) {
      closeSnakeModal();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !els.snakeModalBackdrop.classList.contains("hidden")) {
      if (!state.snake.active) closeSnakeModal();
    }
  });

  window.addEventListener("keydown", handleSnakeKeyDown);

  // Touch D-pad
  els.snakeTouchUp.addEventListener("pointerdown", () => setSnakeDir(0, -1));
  els.snakeTouchDown.addEventListener("pointerdown", () => setSnakeDir(0, 1));
  els.snakeTouchLeft.addEventListener("pointerdown", () => setSnakeDir(-1, 0));
  els.snakeTouchRight.addEventListener("pointerdown", () => setSnakeDir(1, 0));

  bindSnakeSwipeGestures(els.snakeCanvas);
}

function setSnakeDir(dx, dy) {
  if (!state.snake.active || state.snake.paused) return;
  const cur = state.snake.dir;
  // Prevent 180° turns
  if (dx !== 0 && dx === -cur.x) return;
  if (dy !== 0 && dy === -cur.y) return;
  state.snake.nextDir = {x: dx, y: dy};
}

function handleSnakeKeyDown(event) {
  if (els.snakeModalBackdrop.classList.contains("hidden")) return;

  if (event.key === " ") {
    event.preventDefault();
    toggleSnakePause();
    return;
  }

  if (!state.snake.active || state.snake.paused) return;

  const KEY_MAP = {
    ArrowUp: {x:0,y:-1}, w: {x:0,y:-1}, W: {x:0,y:-1},
    ArrowDown: {x:0,y:1}, s: {x:0,y:1}, S: {x:0,y:1},
    ArrowLeft: {x:-1,y:0}, a: {x:-1,y:0}, A: {x:-1,y:0},
    ArrowRight: {x:1,y:0}, d: {x:1,y:0}, D: {x:1,y:0},
  };

  const dir = KEY_MAP[event.key];
  if (dir) {
    event.preventDefault();
    setSnakeDir(dir.x, dir.y);
  }
}

function bindSnakeSwipeGestures(canvas) {
  let startX = 0;
  let startY = 0;

  canvas.addEventListener("touchstart", (e) => {
    if (!state.snake.active || state.snake.paused) return;
    e.preventDefault();
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, {passive: false});

  canvas.addEventListener("touchmove", (e) => {
    if (!state.snake.active || state.snake.paused) return;
    e.preventDefault();
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;
    const MIN_SWIPE = 30;

    if (Math.abs(dx) > MIN_SWIPE && Math.abs(dx) > Math.abs(dy)) {
      setSnakeDir(dx > 0 ? 1 : -1, 0);
      startX = e.touches[0].clientX;
    } else if (Math.abs(dy) > MIN_SWIPE && Math.abs(dy) > Math.abs(dx)) {
      setSnakeDir(0, dy > 0 ? 1 : -1);
      startY = e.touches[0].clientY;
    }
  }, {passive: false});
}

// ─── Utilities ───

function spawnCelebration() {
  const colors = ["#22c55e", "#eab308", "#f97316", "#3b82f6", "#ef4444"];
  for (let i = 0; i < 45; i += 1) {
    const piece = document.createElement("span");
    piece.className = "celebration";
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random() * 0.4}s`;
    document.body.appendChild(piece);
    window.setTimeout(() => piece.remove(), 2000);
  }
}

function shuffle(items) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function escapeHtml(value) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return value.replace(/[&<>"']/g, (char) => map[char]);
}
