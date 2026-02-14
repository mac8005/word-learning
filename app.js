const WORDS_URL_CANDIDATES = ["words.json", "data/words.json"];
const COIN_STORAGE_KEY = "word_galaxy_coins";
const TETRIS_PLAYS_STORAGE_KEY = "word_galaxy_tetris_plays";
const TETRIS_PLAY_BUNDLE_COST = 20;
const TETRIS_PLAY_BUNDLE_AMOUNT = 1;
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BASE_DROP_MS = 700;
const SPEECH_RATE = 0.5;

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

const state = {
  wordBank: {},
  letterKeys: [],
  quizWords: [],
  answers: [],
  currentIndex: 0,
  quizActive: false,
  correctionBonusGiven: false,
  coins: 0,
  tetrisPlays: 0,
  germanVoice: null,
  audioCtx: null,
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
  },
};

const els = {
  setupPanel: document.getElementById("setupPanel"),
  quizPanel: document.getElementById("quizPanel"),
  resultPanel: document.getElementById("resultPanel"),
  letterGroup: document.getElementById("letterGroup"),
  setSize: document.getElementById("setSize"),
  startBtn: document.getElementById("startBtn"),
  speakBtn: document.getElementById("speakBtn"),
  nextBtn: document.getElementById("nextBtn"),
  wordInput: document.getElementById("wordInput"),
  progressText: document.getElementById("progressText"),
  progressFill: document.getElementById("progressFill"),
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
  tetrisPlays: document.getElementById("tetrisPlays"),
  tetrisScore: document.getElementById("tetrisScore"),
  tetrisLines: document.getElementById("tetrisLines"),
  tetrisLevel: document.getElementById("tetrisLevel"),
  tetrisCoins: document.getElementById("tetrisCoins"),
  tetrisCanvas: document.getElementById("tetrisCanvas"),
  startMiniGameBtn: document.getElementById("startMiniGameBtn"),
  pauseMiniGameBtn: document.getElementById("pauseMiniGameBtn"),
  miniGameFeedback: document.getElementById("miniGameFeedback"),
};

const tetrisCtx = els.tetrisCanvas.getContext("2d");

initialize();

async function initialize() {
  state.coins = loadCoins();
  state.tetrisPlays = loadTetrisPlays();
  updateCoinDisplay();
  updateTetrisPlayDisplay();
  updateTetrisStats();
  bindEvents();
  setupSpeechVoices();
  drawTetris("TETRIS");

  els.startBtn.disabled = true;
  els.letterGroup.disabled = true;
  els.startBtn.textContent = "Wörter laden...";

  try {
    state.wordBank = await loadWords();
    state.letterKeys = Object.keys(state.wordBank).sort((a, b) => a.localeCompare(b, "de-DE"));
    populateLetterGroupOptions();
    els.startBtn.disabled = false;
    els.letterGroup.disabled = false;
    els.startBtn.textContent = "Mission starten";
    setFeedback(els.quizFeedback, "Drücke Start und höre genau zu.", "ok");
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
  els.speakBtn.addEventListener("click", speakCurrentWord);
  els.nextBtn.addEventListener("click", submitCurrentAnswer);
  els.wordInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      submitCurrentAnswer();
    }
  });
  els.checkCorrectionsBtn.addEventListener("click", checkCorrections);
  els.playAgainBtn.addEventListener("click", resetToSetup);

  els.buyTetrisPlaysBtn.addEventListener("click", buyTetrisPlays);
  els.startMiniGameBtn.addEventListener("click", startTetrisGame);
  els.pauseMiniGameBtn.addEventListener("click", toggleTetrisPause);

  window.addEventListener("keydown", handleTetrisKeyDown);
}

function setupSpeechVoices() {
  if (!("speechSynthesis" in window)) {
    return;
  }

  const assignVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    state.germanVoice =
      voices.find((voice) => voice.lang.toLowerCase() === "de-de") ||
      voices.find((voice) => voice.lang.toLowerCase().startsWith("de")) ||
      voices.find((voice) => /deutsch|german/i.test(voice.name)) ||
      null;
  };

  assignVoice();
  if (window.speechSynthesis.addEventListener) {
    window.speechSynthesis.addEventListener("voiceschanged", assignVoice);
  }
}

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
  els.letterGroup.innerHTML = "";

  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = `Alle Buchstaben (${state.letterKeys.length} Gruppen)`;
  els.letterGroup.appendChild(allOption);

  for (const letter of state.letterKeys) {
    const option = document.createElement("option");
    option.value = letter;
    option.textContent = `Nur ${letter}`;
    els.letterGroup.appendChild(option);
  }

  els.letterGroup.value = "all";
}

function startQuiz() {
  const letterGroup = els.letterGroup.value;
  const requestedSize = Number.parseInt(els.setSize.value, 10);
  const pool = getWordPool(letterGroup);

  if (!pool.length) {
    setFeedback(els.quizFeedback, "Keine Wörter für diese Auswahl gefunden.", "bad");
    return;
  }

  const shuffled = shuffle(pool.slice());
  const setSize = Math.min(requestedSize, shuffled.length);
  state.quizWords = shuffled.slice(0, setSize);
  state.answers = [];
  state.currentIndex = 0;
  state.quizActive = true;
  state.correctionBonusGiven = false;

  setPanelVisibility({ setup: false, quiz: true, result: false });
  renderCurrentWordState();
  speakCurrentWord();
}

function getWordPool(letterGroup) {
  if (letterGroup === "all") {
    const allWords = [];
    for (const letter of state.letterKeys) {
      allWords.push(...(state.wordBank[letter] ?? []));
    }
    return allWords;
  }
  return state.wordBank[letterGroup] ?? [];
}

function renderCurrentWordState() {
  const currentWord = state.quizWords[state.currentIndex];
  if (!currentWord) {
    return;
  }

  const total = state.quizWords.length;
  const progressPercent = (state.currentIndex / total) * 100;
  els.progressText.textContent = `Wort ${state.currentIndex + 1} / ${total}`;
  els.progressFill.style.width = `${Math.max(6, progressPercent)}%`;

  els.letterSlots.innerHTML = "";
  for (const char of currentWord) {
    if (char === " ") continue;
    const bubble = document.createElement("span");
    bubble.className = "slot";
    els.letterSlots.appendChild(bubble);
  }

  els.wordInput.value = "";
  els.wordInput.focus();
  setFeedback(els.quizFeedback, "Hören und tippen. Das Wort wird nicht angezeigt.", "ok");
}

function speakCurrentWord() {
  if (!state.quizActive) {
    return;
  }
  const word = state.quizWords[state.currentIndex];
  speakWord(word);
}

function speakWord(word) {
  if (!word) {
    return;
  }
  if (!("speechSynthesis" in window)) {
    setFeedback(els.quizFeedback, "Vorlesen wird in diesem Browser nicht unterstützt.", "bad");
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = state.germanVoice?.lang ?? "de-DE";
  utterance.voice = state.germanVoice;
  utterance.rate = SPEECH_RATE;
  utterance.pitch = 1.02;
  window.speechSynthesis.speak(utterance);
}

function submitCurrentAnswer() {
  if (!state.quizActive) {
    return;
  }

  const userInput = normalizeDoubleS(els.wordInput.value.trim());
  if (!userInput) {
    setFeedback(els.quizFeedback, "Bitte erst ein Wort eingeben.", "bad");
    return;
  }

  const target = state.quizWords[state.currentIndex];
  const correct = userInput === target;
  const caseOnlyError =
    !correct && userInput.localeCompare(target, "de-DE", { sensitivity: "base" }) === 0;

  state.answers.push({
    target,
    userInput,
    correct,
    caseOnlyError,
  });

  state.currentIndex += 1;
  if (state.currentIndex >= state.quizWords.length) {
    finishQuiz();
    return;
  }

  renderCurrentWordState();
  speakCurrentWord();
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
  if (percent >= 80) return "Wort-Held";
  if (percent >= 60) return "Starker Schreiber";
  return "Lern-Entdecker";
}

function renderMistakes() {
  const mistakes = state.answers
    .map((entry, index) => ({ ...entry, index }))
    .filter((entry) => !entry.correct);

  els.mistakesList.innerHTML = "";
  setFeedback(els.correctionFeedback, "", "ok");

  if (!mistakes.length) {
    els.mistakesBlock.innerHTML = `
      <h3>Perfekte Mission</h3>
      <p>Alle Wörter waren richtig. Stark!</p>
    `;
    return;
  }

  els.mistakesBlock.innerHTML = `
    <h3>Fehler-Labor</h3>
    <p>Korrigiere die falschen Wörter und hole Bonus-Münzen.</p>
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
    const detail = mistake.caseOnlyError
      ? "Buchstaben stimmen, aber Gross-/Kleinschreibung ist falsch."
      : "Die Schreibweise ist falsch.";

    row.innerHTML = `
      <div class="mistake-title">Nochmal versuchen</div>
      <p class="mistake-meta">Deine Eingabe: <strong>${escapeHtml(mistake.userInput)}</strong></p>
      <p class="mistake-meta">${detail}</p>
      <button type="button" class="btn secondary retry-audio">Nochmal vorlesen</button>
      <input type="text" class="correction-input" placeholder="Korrektes Wort eingeben" />
    `;

    const retryAudioButton = row.querySelector(".retry-audio");
    if (retryAudioButton) {
      retryAudioButton.addEventListener("click", () => speakWord(mistake.target));
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

    const proposed = normalizeDoubleS(correctionInput.value.trim());
    const target = state.answers[answerIndex]?.target;
    if (!target || proposed !== target) {
      if (target) {
        console.log(`[Korrektur] Richtiges Wort: ${target}`);
      }
      allCorrectNow = false;
      row.classList.remove("corrected");
      continue;
    }

    console.log(`[Korrektur] Richtiges Wort: ${target}`);
    row.classList.add("corrected");
    fixedCount += 1;
  }

  if (!allCorrectNow) {
    setFeedback(
      els.correctionFeedback,
      `${fixedCount} korrigiert. Versuche die restlichen Wörter nochmal.`,
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
  setFeedback(els.quizFeedback, "Wähle ein Set und starte die Mission.", "ok");
}

function setPanelVisibility({ setup, quiz, result }) {
  els.setupPanel.classList.toggle("hidden", !setup);
  els.quizPanel.classList.toggle("hidden", !quiz);
  els.resultPanel.classList.toggle("hidden", !result);
}

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
}

function setFeedback(el, text, type) {
  el.textContent = text;
  el.classList.remove("ok", "bad");
  if (type === "ok") el.classList.add("ok");
  if (type === "bad") el.classList.add("bad");
}

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

function startTetrisGame() {
  if (state.tetris.active) {
    setFeedback(els.miniGameFeedback, "Tetris läuft bereits.", "bad");
    return;
  }

  if (state.tetrisPlays < 1) {
    setFeedback(
      els.miniGameFeedback,
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
  setFeedback(els.miniGameFeedback, "Tetris gestartet. Viel Spass!", "ok");
  playSfx("start");
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
}

function toggleTetrisPause() {
  if (!state.tetris.active) {
    setFeedback(els.miniGameFeedback, "Starte zuerst eine Tetris-Runde.", "bad");
    return;
  }

  state.tetris.paused = !state.tetris.paused;
  if (state.tetris.paused) {
    setFeedback(els.miniGameFeedback, "Tetris pausiert.", "ok");
    drawTetris("PAUSE");
  } else {
    setFeedback(els.miniGameFeedback, "Tetris läuft weiter.", "ok");
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
  drawTetris("ENDE");

  setFeedback(
    els.miniGameFeedback,
    `Tetris vorbei! Punkte: ${state.tetris.score}, Linien: ${state.tetris.lines}. Trainiere Wörter für neue Spiele!`,
    "ok"
  );

  if (state.tetris.lines >= 4) {
    spawnCelebration();
  }
  playSfx("gameOver");
}

function updateTetrisStats() {
  els.tetrisScore.textContent = `Punkte: ${state.tetris.score}`;
  els.tetrisLines.textContent = `Linien: ${state.tetris.lines}`;
  els.tetrisLevel.textContent = `Level: ${state.tetris.level}`;
}

function drawTetris(overlayText = "") {
  const cell = Math.floor(
    Math.min(els.tetrisCanvas.width / BOARD_WIDTH, els.tetrisCanvas.height / BOARD_HEIGHT)
  );
  tetrisCtx.clearRect(0, 0, els.tetrisCanvas.width, els.tetrisCanvas.height);
  tetrisCtx.fillStyle = "#020617";
  tetrisCtx.fillRect(0, 0, els.tetrisCanvas.width, els.tetrisCanvas.height);

  drawBoard(cell);
  drawPiece(state.tetris.current, cell);
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

function drawBoard(cell) {
  for (let y = 0; y < BOARD_HEIGHT; y += 1) {
    for (let x = 0; x < BOARD_WIDTH; x += 1) {
      const color = state.tetris.board[y]?.[x];
      if (!color) continue;
      drawCell(x, y, cell, color);
    }
  }
}

function drawPiece(piece, cell) {
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
