# View-Based SPA Redesign with Visual Wow Factor

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure Galaxie Trainer from a single scrolling page into a view-based SPA with animated transitions, focused quiz experience, and celebration effects — making it visually stunning.

**Architecture:** Replace the current `hidden` class toggle with a view router that manages 5 views (Home, Setup, Quiz, Results, Arcade). Each view is a full-screen section with CSS-driven enter/exit transitions. The existing `state` object gets a `currentView` property. All game logic (Tetris, Snake, Moorhuhn) stays unchanged — only the shell and navigation around them changes.

**Tech Stack:** Plain HTML/CSS/JS (no framework). CSS `@keyframes` for transitions. Canvas API for starfield background. Existing app.js structure preserved.

---

## Important Conventions

- All files: `index.html`, `styles.css`, `app.js` (no new files except `words.json` stays)
- Views use `data-view="home"` attributes, shown/hidden via `.view-active` class
- Transitions: CSS classes `.view-enter`, `.view-exit` with `animationend` listeners
- The existing `els` object pattern continues — new elements get added there
- All existing localStorage keys and game logic remain untouched
- Commit after each task

---

### Task 1: Create Git Branch and View Router Infrastructure

**Files:**
- Modify: `app.js` (lines 176-198 — state object, and lines 1552-1568 — setPanelVisibility)
- Modify: `index.html` (lines 16-187 — restructure into views)
- Modify: `styles.css` (add view transition system)

**Step 1: Create feature branch**

```bash
git checkout -b feat/view-based-redesign
```

**Step 2: Add view state and router to app.js**

Add `currentView: "home"` to the `state` object (after line 198).

Replace `setPanelVisibility()` with a view router:

```javascript
const VIEWS = ["home", "setup", "quiz", "result", "arcade"];

function navigateTo(viewName) {
  if (!VIEWS.includes(viewName)) return;
  const current = document.querySelector('.view.view-active');
  const next = document.querySelector(`.view[data-view="${viewName}"]`);
  if (!next || next === current) return;

  state.currentView = viewName;

  if (current) {
    current.classList.add('view-exit');
    current.addEventListener('animationend', () => {
      current.classList.remove('view-active', 'view-exit');
    }, { once: true });
  }

  next.classList.add('view-active', 'view-enter');
  next.addEventListener('animationend', () => {
    next.classList.remove('view-enter');
  }, { once: true });
}
```

Update all callers of `setPanelVisibility`:
- `startWordQuiz()` / `startMathQuiz()`: replace `setPanelVisibility({ setup: false, quiz: true, result: false })` with `navigateTo("quiz")`
- `finishQuiz()`: replace with `navigateTo("result")`
- `resetToSetup()`: replace with `navigateTo("setup")`

Keep `setPanelVisibility` as a thin wrapper during migration so nothing breaks:
```javascript
function setPanelVisibility({ setup, quiz, result }) {
  if (quiz) navigateTo("quiz");
  else if (result) navigateTo("result");
  else if (setup) navigateTo("setup");
}
```

**Step 3: Restructure index.html into views**

Wrap existing sections in view containers. The current `<main class="layout">` becomes multiple view divs:

```html
<main class="views-container">
  <!-- HOME VIEW -->
  <div class="view view-active" data-view="home">
    <div class="home-hero">
      <div class="starfield" id="starfieldCanvas"></div>
      <p class="eyebrow">Lernspiel</p>
      <h1 class="home-title">Galaxie Trainer</h1>
      <p class="home-subtitle">Ube Worter und Mathe, sammle Munzen und spiele Bonus-Spiele.</p>
      <button id="goToSetupBtn" class="btn primary btn-xl pulse-glow">Mission starten</button>
      <div class="home-stats-row">
        <div class="home-stat" id="homeStreak"></div>
        <div class="home-stat" id="homeCoins"></div>
        <div class="home-stat" id="homeAccuracy"></div>
      </div>
    </div>
  </div>

  <!-- SETUP VIEW -->
  <div class="view" data-view="setup">
    <!-- Move existing setupPanel contents here -->
    <!-- Keep all IDs identical so els refs still work -->
  </div>

  <!-- QUIZ VIEW -->
  <div class="view" data-view="quiz">
    <!-- Move existing quizPanel contents here, made full-screen -->
  </div>

  <!-- RESULT VIEW -->
  <div class="view" data-view="result">
    <!-- Move existing resultPanel contents here -->
  </div>

  <!-- ARCADE VIEW -->
  <div class="view" data-view="arcade">
    <!-- Move existing miniGamePanel and statsPanel here -->
  </div>
</main>
```

**Step 4: Add view transition CSS to styles.css**

```css
/* ── View system ── */
.views-container {
  position: relative;
  min-height: calc(100vh - 80px);
  overflow: hidden;
}

.view {
  display: none;
  width: 100%;
  min-height: calc(100vh - 80px);
  padding: 2rem;
}

.view.view-active {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.view.view-enter {
  animation: viewSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.view.view-exit {
  display: flex; /* keep visible during exit */
  animation: viewSlideOut 0.3s cubic-bezier(0.55, 0, 1, 0.45) forwards;
}

@keyframes viewSlideIn {
  from { opacity: 0; transform: translateY(30px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes viewSlideOut {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to   { opacity: 0; transform: translateY(-20px) scale(0.97); }
}
```

**Step 5: Verify the app loads and shows the home view**

Open `http://localhost:8080` — should see the home view with "Mission starten" button. Click it — should transition to setup. Start a quiz — should transition to quiz. Finish — should show results.

**Step 6: Commit**

```bash
git add index.html styles.css app.js
git commit -m "feat: view-based router with animated transitions"
```

---

### Task 2: Bottom Navigation Bar

**Files:**
- Modify: `index.html` (add nav bar markup after views-container)
- Modify: `styles.css` (nav bar styles)
- Modify: `app.js` (nav click handlers, active state tracking)

**Step 1: Add nav bar HTML**

After `</main>`, before the modal divs:

```html
<nav class="bottom-nav" id="bottomNav">
  <button class="nav-item active" data-nav="home" aria-label="Home">
    <span class="nav-icon">🏠</span>
    <span class="nav-label">Home</span>
  </button>
  <button class="nav-item" data-nav="setup" aria-label="Training">
    <span class="nav-icon">📝</span>
    <span class="nav-label">Training</span>
  </button>
  <button class="nav-item" data-nav="arcade" aria-label="Spiele">
    <span class="nav-icon">🎮</span>
    <span class="nav-label">Spiele</span>
  </button>
</nav>
```

**Step 2: Add nav bar CSS**

```css
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  justify-content: center;
  gap: 0;
  background: rgba(12, 10, 29, 0.92);
  backdrop-filter: blur(16px);
  border-top: 1px solid var(--card-border);
  padding: 0.4rem 1rem calc(0.4rem + env(safe-area-inset-bottom));
}

.nav-item {
  flex: 1;
  max-width: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 0.5rem;
  background: none;
  border: none;
  color: var(--ink-dim);
  cursor: pointer;
  transition: color var(--transition), transform var(--transition);
  font-family: var(--font-body);
}

.nav-item:hover, .nav-item.active {
  color: var(--accent);
}

.nav-item.active .nav-icon {
  transform: scale(1.15);
}

.nav-icon {
  font-size: 1.4rem;
  transition: transform var(--transition);
}

.nav-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* Pad body bottom so nav doesn't cover content */
body { padding-bottom: calc(70px + env(safe-area-inset-bottom)); }
```

**Step 3: Wire up nav in app.js**

In `bindEvents()`, add:

```javascript
document.getElementById('bottomNav').addEventListener('click', (e) => {
  const item = e.target.closest('.nav-item');
  if (!item) return;
  const view = item.dataset.nav;
  navigateTo(view);
});
```

Update `navigateTo()` to sync nav active state:

```javascript
// Inside navigateTo, after setting state.currentView:
for (const btn of document.querySelectorAll('.nav-item')) {
  btn.classList.toggle('active', btn.dataset.nav === viewName);
}
```

**Step 4: Hide nav during quiz and result views**

```javascript
// Inside navigateTo:
const nav = document.getElementById('bottomNav');
nav.classList.toggle('hidden', viewName === 'quiz' || viewName === 'result');
```

**Step 5: Verify** — nav appears at bottom, highlights active tab, navigates between Home/Setup/Arcade. Hidden during quiz.

**Step 6: Commit**

```bash
git add index.html styles.css app.js
git commit -m "feat: bottom navigation bar with active state tracking"
```

---

### Task 3: Animated Home Screen

**Files:**
- Modify: `styles.css` (home view styles, starfield, animations)
- Modify: `app.js` (canvas starfield, home stats population)
- Modify: `index.html` (refine home view markup)

**Step 1: Add starfield canvas and home view CSS**

```css
.home-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: calc(100vh - 160px);
  position: relative;
  gap: 1.2rem;
}

#starfieldCanvas {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.home-title {
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 8vw, 4.5rem);
  font-weight: 800;
  background: linear-gradient(135deg, var(--accent) 0%, var(--teal) 50%, var(--gold) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  position: relative;
  z-index: 1;
  animation: titleFloat 3s ease-in-out infinite;
}

@keyframes titleFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.home-subtitle {
  font-size: 1.1rem;
  color: var(--ink-muted);
  max-width: 400px;
  position: relative;
  z-index: 1;
}

.btn-xl {
  font-size: 1.3rem;
  padding: 1rem 3rem;
  border-radius: var(--radius-pill);
  position: relative;
  z-index: 1;
}

.pulse-glow {
  animation: pulseGlow 2s ease-in-out infinite;
}

@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 20px var(--accent-glow); }
  50% { box-shadow: 0 0 40px var(--accent-glow), 0 0 60px rgba(124, 77, 255, 0.2); }
}

.home-stats-row {
  display: flex;
  gap: 2rem;
  margin-top: 1.5rem;
  position: relative;
  z-index: 1;
}

.home-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  font-size: 0.85rem;
  color: var(--ink-muted);
}

.home-stat strong {
  font-size: 1.4rem;
  color: var(--ink);
}
```

**Step 2: Add starfield canvas animation in app.js**

```javascript
function initStarfield() {
  const container = document.getElementById('starfieldCanvas');
  if (!container) return;
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'width:100%;height:100%;display:block;';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const stars = [];
  const STAR_COUNT = 120;

  function resize() {
    canvas.width = container.offsetWidth * devicePixelRatio;
    canvas.height = container.offsetHeight * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * container.offsetWidth,
      y: Math.random() * container.offsetHeight,
      r: Math.random() * 1.5 + 0.3,
      speed: Math.random() * 0.3 + 0.05,
      alpha: Math.random() * 0.6 + 0.4,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinklePhase: Math.random() * Math.PI * 2,
    });
  }

  let frame = 0;
  function draw() {
    const w = container.offsetWidth;
    const h = container.offsetHeight;
    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
      s.y -= s.speed;
      if (s.y < -2) { s.y = h + 2; s.x = Math.random() * w; }
      const alpha = s.alpha * (0.6 + 0.4 * Math.sin(frame * s.twinkleSpeed + s.twinklePhase));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fill();
    }
    frame++;
    requestAnimationFrame(draw);
  }
  draw();
}
```

Call `initStarfield()` at end of `initialize()`.

**Step 3: Populate home stats**

```javascript
function updateHomeStats() {
  const streak = document.getElementById('homeStreak');
  const coins = document.getElementById('homeCoins');
  const accuracy = document.getElementById('homeAccuracy');
  if (streak) streak.innerHTML = `<strong>🔥 ${state.streak.current}</strong>Tage-Serie`;
  if (coins) coins.innerHTML = `<strong>💰 ${state.coins}</strong>Munzen`;
  const pct = state.stats.totalPracticed > 0
    ? Math.round(state.stats.totalCorrect / state.stats.totalPracticed * 100)
    : 0;
  if (accuracy) accuracy.innerHTML = `<strong>🎯 ${pct}%</strong>Genauigkeit`;
}
```

Call `updateHomeStats()` in `initialize()` and inside `navigateTo("home")`.

**Step 4: Wire "Mission starten" on home to go to setup**

```javascript
document.getElementById('goToSetupBtn').addEventListener('click', () => navigateTo('setup'));
```

**Step 5: Verify** — home screen shows animated starfield, floating gradient title, pulsing CTA button, and live stats. Clicking "Mission starten" slides to setup.

**Step 6: Commit**

```bash
git add index.html styles.css app.js
git commit -m "feat: animated home screen with starfield and gradient title"
```

---

### Task 4: Immersive Full-Screen Quiz View

**Files:**
- Modify: `styles.css` (quiz view redesign)
- Modify: `index.html` (quiz view markup tweaks)
- Modify: `app.js` (enhanced feedback animations)

**Step 1: Redesign quiz layout CSS**

The quiz should feel focused and immersive — centered content, larger elements, more breathing room:

```css
.view[data-view="quiz"] {
  justify-content: center;
  padding: 1.5rem;
}

.quiz-card {
  width: 100%;
  max-width: 600px;
  background: var(--card);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-lg);
  padding: 2.5rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  box-shadow: var(--shadow-lg);
  position: relative;
  overflow: hidden;
}

.quiz-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 0%, var(--accent-glow), transparent 60%);
  pointer-events: none;
}

.quiz-progress-ring {
  font-size: 0.9rem;
  color: var(--ink-muted);
  font-weight: 700;
}

.letter-slots {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
  min-height: 3rem;
}

.slot {
  width: 2.2rem;
  height: 2.8rem;
  border-radius: 0.5rem;
  background: var(--bg-surface);
  border: 2px solid var(--card-border);
  transition: all 0.2s ease;
}

.slot.filled {
  background: var(--accent);
  border-color: var(--accent);
  transform: scale(1.05);
  box-shadow: 0 0 12px var(--accent-glow);
}

.slot.correct-slot {
  background: var(--success);
  border-color: var(--success);
  box-shadow: 0 0 12px var(--success-glow);
  animation: slotPop 0.3s ease;
}

.slot.wrong-slot {
  background: var(--error);
  border-color: var(--error);
  box-shadow: 0 0 12px var(--error-glow);
  animation: slotShake 0.4s ease;
}

@keyframes slotPop {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1.05); }
}

@keyframes slotShake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(3px); }
}

/* Larger input for quiz */
.quiz-input {
  font-size: 1.5rem;
  text-align: center;
  padding: 0.8rem 1.5rem;
  border-radius: var(--radius);
  width: 100%;
  max-width: 320px;
}

.quiz-actions {
  display: flex;
  gap: 1rem;
  width: 100%;
  max-width: 400px;
}

.quiz-actions .btn {
  flex: 1;
}
```

**Step 2: Update quiz HTML structure**

Wrap the quiz content in a `.quiz-card` inside the quiz view. Move the speak button above the input. Make the input larger. Group the action buttons.

**Step 3: Add correct/wrong mini-celebration in app.js**

After `playSfx(lastAnswer.correct ? "quizCorrect" : "quizWrong")` in `submitCurrentAnswer()`:

```javascript
if (lastAnswer.correct) {
  // Spawn mini confetti burst from the input area
  spawnMiniCelebration(els.wordInput);
}
```

```javascript
function spawnMiniCelebration(anchor) {
  const rect = anchor.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top;
  const colors = ['#69f0ae', '#ffd740', '#18ffff', '#7c4dff'];
  for (let i = 0; i < 12; i++) {
    const dot = document.createElement('span');
    dot.className = 'mini-confetti';
    dot.style.left = cx + 'px';
    dot.style.top = cy + 'px';
    dot.style.background = colors[i % colors.length];
    dot.style.setProperty('--dx', (Math.random() - 0.5) * 120 + 'px');
    dot.style.setProperty('--dy', -(Math.random() * 80 + 30) + 'px');
    document.body.appendChild(dot);
    setTimeout(() => dot.remove(), 700);
  }
}
```

CSS for mini confetti:
```css
.mini-confetti {
  position: fixed;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  pointer-events: none;
  z-index: 9999;
  animation: miniConfettiBurst 0.6s ease-out forwards;
}

@keyframes miniConfettiBurst {
  0% { transform: translate(0, 0) scale(1); opacity: 1; }
  100% { transform: translate(var(--dx), var(--dy)) scale(0); opacity: 0; }
}
```

**Step 4: Verify** — quiz feels centered and immersive. Letter slots are bigger and glow when filled. Correct answers spawn confetti burst. Wrong answers shake.

**Step 5: Commit**

```bash
git add index.html styles.css app.js
git commit -m "feat: immersive full-screen quiz with enhanced feedback animations"
```

---

### Task 5: Celebration Results Screen

**Files:**
- Modify: `styles.css` (results view styles)
- Modify: `index.html` (results view markup)
- Modify: `app.js` (animated score reveal, coin animation)

**Step 1: Redesign results view**

Center the results with a big animated score reveal:

```css
.result-card {
  width: 100%;
  max-width: 560px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.result-score-circle {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: conic-gradient(var(--accent) var(--pct), var(--bg-surface) var(--pct));
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  animation: scoreReveal 1s ease-out forwards;
}

.result-score-circle::before {
  content: '';
  width: 130px;
  height: 130px;
  border-radius: 50%;
  background: var(--bg-mid);
  position: absolute;
}

.result-score-number {
  position: relative;
  z-index: 1;
  font-family: var(--font-display);
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--ink);
}

@keyframes scoreReveal {
  from { transform: scale(0.5); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.coin-fly {
  position: fixed;
  font-size: 1.5rem;
  pointer-events: none;
  z-index: 9999;
  animation: coinFlyUp 1s ease-out forwards;
}

@keyframes coinFlyUp {
  0% { transform: translateY(0) scale(1); opacity: 1; }
  100% { transform: translateY(-100px) scale(0.5); opacity: 0; }
}
```

**Step 2: Add animated score counter in app.js**

In `finishQuiz()`, after setting result text, animate the percentage counter:

```javascript
function animateScoreCounter(element, target, duration) {
  const start = performance.now();
  function tick(now) {
    const elapsed = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - elapsed, 3); // ease-out cubic
    element.textContent = Math.round(target * eased) + '%';
    if (elapsed < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
```

**Step 3: Add coin fly animation**

When coins are awarded, spawn small coin emojis that fly upward:

```javascript
function spawnCoinAnimation(count) {
  const target = document.getElementById('coinBadge');
  if (!target) return;
  const rect = target.getBoundingClientRect();
  for (let i = 0; i < Math.min(count, 10); i++) {
    const coin = document.createElement('span');
    coin.className = 'coin-fly';
    coin.textContent = '🪙';
    coin.style.left = (rect.left + Math.random() * rect.width) + 'px';
    coin.style.top = rect.top + 'px';
    coin.style.animationDelay = (i * 0.1) + 's';
    document.body.appendChild(coin);
    setTimeout(() => coin.remove(), 1200);
  }
}
```

Call `spawnCoinAnimation(earnedCoins)` in `finishQuiz()` after `addCoins()`.

**Step 4: Verify** — finishing a quiz shows centered result with circular score graphic, animated percentage counter, coin emojis flying, and confetti on good scores.

**Step 5: Commit**

```bash
git add index.html styles.css app.js
git commit -m "feat: celebration results screen with score animation and coin effects"
```

---

### Task 6: Arcade View with Distinct Game Cards

**Files:**
- Modify: `index.html` (arcade view with game cards)
- Modify: `styles.css` (distinct game card styles)

**Step 1: Redesign arcade game cards**

Each game gets its own color identity and visual treatment:

```css
.arcade-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  width: 100%;
  max-width: 920px;
}

.game-card {
  border-radius: var(--radius-lg);
  padding: 1.8rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;
  overflow: hidden;
  border: 1px solid;
  transition: transform var(--transition), box-shadow var(--transition);
}

.game-card:hover {
  transform: translateY(-4px);
}

.game-card--tetris {
  background: linear-gradient(135deg, rgba(124,77,255,0.15), rgba(96,165,250,0.1));
  border-color: rgba(124,77,255,0.3);
  box-shadow: 0 8px 32px rgba(124,77,255,0.15);
}

.game-card--snake {
  background: linear-gradient(135deg, rgba(74,222,128,0.15), rgba(24,255,255,0.1));
  border-color: rgba(74,222,128,0.3);
  box-shadow: 0 8px 32px rgba(74,222,128,0.15);
}

.game-card--moorhuhn {
  background: linear-gradient(135deg, rgba(255,145,0,0.15), rgba(255,215,64,0.1));
  border-color: rgba(255,145,0,0.3);
  box-shadow: 0 8px 32px rgba(255,145,0,0.15);
}

.game-card-title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 800;
}

.game-card-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: var(--ink-muted);
}
```

**Step 2: Restructure arcade HTML**

Replace the repetitive `arcade-game-row` divs with distinct `.game-card` elements inside an `.arcade-grid`. Keep all button IDs unchanged.

**Step 3: Add stats panel as a collapsible section within arcade view**

Move the stats/badges below the game cards in the arcade view, or make it accessible from home. The stats panel should not compete with games — consider a "Statistiken" expandable section.

**Step 4: Verify** — arcade view shows 3 visually distinct game cards with their own color themes. Hover lifts them. Buy/play buttons work as before.

**Step 5: Commit**

```bash
git add index.html styles.css app.js
git commit -m "feat: arcade view with distinct colored game cards"
```

---

### Task 7: Header Simplification and Global Polish

**Files:**
- Modify: `index.html` (simplify header, it's now minimal since home has the hero)
- Modify: `styles.css` (compact header, view-aware, polish)
- Modify: `app.js` (update header coin/streak on navigateTo)

**Step 1: Simplify the header**

The header becomes a slim top bar (not the big hero card — home view handles that now):

```css
.top-bar {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 1.2rem;
  background: rgba(12, 10, 29, 0.9);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--card-border);
}

.top-bar-title {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--accent);
}

.top-bar-badges {
  display: flex;
  gap: 0.8rem;
  align-items: center;
}
```

**Step 2: Hide top bar on home view**

```javascript
// Inside navigateTo:
const topBar = document.querySelector('.top-bar');
if (topBar) topBar.classList.toggle('hidden', viewName === 'home');
```

**Step 3: Add smooth scroll-to-top on view transitions**

```javascript
// Inside navigateTo, before animation:
window.scrollTo({ top: 0 });
```

**Step 4: Ensure all displays update on navigation**

In `navigateTo()`, call the relevant update functions:

```javascript
if (viewName === 'home') updateHomeStats();
if (viewName === 'arcade') {
  updateCoinDisplay();
  updateTetrisPlayDisplay();
  updateSnakePlaysDisplay();
  updateMoorhuhnPlaysDisplay();
}
```

**Step 5: Verify** — slim top bar with coin/streak badges, hidden on home view. All views transition cleanly. State is fresh on each view entry.

**Step 6: Commit**

```bash
git add index.html styles.css app.js
git commit -m "feat: slim top bar and global navigation polish"
```

---

### Task 8: Light Mode Compatibility and Final Polish

**Files:**
- Modify: `styles.css` (ensure all new styles respect `.light-mode`)
- Modify: `app.js` (minor cleanup)

**Step 1: Audit light mode**

Go through every new CSS addition and ensure `.light-mode` overrides exist for:
- `.top-bar` background
- `.bottom-nav` background
- `.home-title` gradient (should still look good in light)
- `.quiz-card` background
- `.game-card` backgrounds
- `.view` transitions

**Step 2: Test all views in both themes**

Toggle dark mode toggle. All views should look polished in both themes.

**Step 3: Test mobile responsiveness**

Check at 375px width:
- Home view: title should scale down, stats row should wrap
- Quiz view: input should be full width, buttons stack
- Arcade: cards should stack vertically
- Nav bar: should respect safe-area-inset

**Step 4: Remove old layout CSS**

Remove or refactor the old `.layout` grid CSS that positioned setup/stats/arcade side-by-side, since views are now full-screen.

**Step 5: Commit**

```bash
git add index.html styles.css app.js
git commit -m "feat: light mode compatibility and responsive polish"
```

---

### Task 9: Integration Test and Cleanup

**Step 1: Full manual walkthrough**

Test complete flow:
1. App loads → home view with starfield
2. Click "Mission starten" → setup view
3. Select groups, start quiz → quiz view (immersive, centered)
4. Complete quiz → results with score animation, confetti, coin fly
5. Click "Neues Set" → back to setup
6. Navigate to Arcade via nav → game cards
7. Buy and play Tetris/Snake/Moorhuhn → modals work unchanged
8. Toggle dark mode → all views correct
9. Check mobile layout

**Step 2: Remove any dead code**

- Remove old `setPanelVisibility` if fully migrated
- Remove old `.hero.card` CSS if replaced by `.top-bar`
- Remove old `.layout` grid CSS

**Step 3: Final commit**

```bash
git add -A
git commit -m "chore: cleanup dead code and finalize view-based redesign"
```
