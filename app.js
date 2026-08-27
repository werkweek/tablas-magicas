// Centro de Matemáticas 4º Grado - Persistencia LocalStorage, Dashboard de Avances & Social Sharing
let currentCategory = 'multiplication';
let currentLevel = 1;
let globalInputMode = 'draw';
let totalStars = 0;
let studentName = "Campeón(a)";
let userAnswers = {};
let userProcedures = {};
let levelProgressData = {}; // key: `${cat}-${lvl}` -> { bestScore: 0, stars: 0, completed: bool, attempts: 0 }
let digitDifficulty = 2;
let soundEnabled = true;

const APP_URL = "https://werkweek.github.io/tablas-magicas/";
const STORAGE_KEY = "tablas_magicas_progress_v1";

// Number to Words Converter
function numberToWordsES(n) {
  if (n === null || isNaN(n)) return "";
  n = Math.round(n);
  if (n === 0) return "cero";
  if (n < 0) return "menos " + numberToWordsES(Math.abs(n));

  const units = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
  const teens = ["diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve"];
  const tens = ["", "diez", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
  const twenties = ["veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve"];
  const hundreds = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];

  if (n === 100) return "cien";
  if (n < 10) return units[n];
  if (n < 20) return teens[n - 10];
  if (n < 30) return twenties[n - 20];
  if (n < 100) {
    const u = n % 10;
    const t = Math.floor(n / 10);
    return u === 0 ? tens[t] : `${tens[t]} y ${units[u]}`;
  }
  if (n < 1000) {
    const c = Math.floor(n / 100);
    const rest = n % 100;
    if (rest === 0) return c === 1 ? "cien" : hundreds[c];
    return `${hundreds[c]} ${numberToWordsES(rest)}`;
  }
  if (n === 1000) return "mil";
  return String(n);
}

function normalizeText(text) {
  return text.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ");
}

// Categories and Levels Definitions
const CATEGORY_DATA = {
  multiplication: {
    name: "Multiplicación",
    icon: "✖️",
    levels: [
      { id: 1, name: "Tabla del 1", table: 1, icon: "📘", desc: "Multiplica por 1 y escribe cada resultado." },
      { id: 2, name: "Tabla del 2", table: 2, icon: "📗", desc: "La tabla del doble: suma de 2 en 2." },
      { id: 3, name: "Tabla del 3", table: 3, icon: "📙", desc: "Multiplica por 3 y traza tus palabras." },
      { id: 4, name: "Tabla del 4", table: 4, icon: "🔮", desc: "El doble del 2: ¡vamos por el 4!" },
      { id: 5, name: "Tabla del 5", table: 5, icon: "🌸", desc: "Terminan en 5 o en 0, ¡súper fácil!" },
      { id: 6, name: "Tabla del 6", table: 6, icon: "💎", desc: "Avanzando como un crack de 4º grado." },
      { id: 7, name: "Tabla del 7", table: 7, icon: "🔥", desc: "¡El gran reto de la tabla del 7!" },
      { id: 8, name: "Tabla del 8", table: 8, icon: "⚡", desc: "El doble del 4: domina la tabla del 8." },
      { id: 9, name: "Tabla del 9", table: 9, icon: "🎯", desc: "La magia del 9: los dígitos suman 9." },
      { id: 10, name: "Tabla del 10", table: 10, icon: "🌟", desc: "Multiplica y agrega un cero al final." },
      { id: 11, name: "Reto Aleatorio", table: null, icon: "👑", desc: "Multiplicaciones aleatorias configurables por dígitos." }
    ]
  },
  addition: {
    name: "Sumas",
    icon: "➕",
    levels: [
      { id: 1, name: "Sumas de 1 Dígito", icon: "🟢", desc: "Cálculo mental rápido de 1 dígito." },
      { id: 2, name: "Sumas de 2 Dígitos", icon: "🟡", desc: "Sumas de dos cifras con y sin transformación." },
      { id: 3, name: "Sumas de 3 Dígitos", icon: "🔴", desc: "Sumas de centenas para 4º grado." },
      { id: 4, name: "Reto Sumas Mixtas", icon: "👑", desc: "Gran desafío de sumas variadas." }
    ]
  },
  subtraction: {
    name: "Restas",
    icon: "➖",
    levels: [
      { id: 1, name: "Restas de 1 Dígito", icon: "🟢", desc: "Restas directas y cálculo mental." },
      { id: 2, name: "Restas de 2 Dígitos", icon: "🟡", desc: "Restas con pedir prestado / transformación." },
      { id: 3, name: "Restas de 3 Dígitos", icon: "🔴", desc: "Restas de centenas para 4º grado." },
      { id: 4, name: "Reto Restas Mixtas", icon: "👑", desc: "Desafío de restas con números grandes." }
    ]
  },
  division: {
    name: "Divisiones",
    icon: "➗",
    levels: [
      { id: 1, name: "Divisiones Exactas Básicas", icon: "🟢", desc: "Repartos exactos con tablas del 1 al 10." },
      { id: 2, name: "2 Dígitos ÷ 1 Dígito", icon: "🟡", desc: "Usa la Pizarra de Casita para tu procedimiento." },
      { id: 3, name: "3 Dígitos ÷ 1 Dígito", icon: "🔴", desc: "Divisiones con centenas y algoritmo formal." },
      { id: 4, name: "Reto Gran División", icon: "👑", desc: "Desafío maestro de divisiones." }
    ]
  }
};

// ----------------------------------------------------
// LOCALSTORAGE PERSISTENCE ENGINE
// ----------------------------------------------------
function saveStateToLocalStorage() {
  try {
    const payload = {
      studentName,
      totalStars,
      digitDifficulty,
      soundEnabled,
      userAnswers,
      userProcedures,
      levelProgressData
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn("Storage write error:", e);
  }
}

function loadStateFromLocalStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    const data = JSON.parse(saved);
    if (data.studentName) {
      studentName = data.studentName;
      const el = document.getElementById('student-name');
      if (el) el.value = studentName;
    }
    if (typeof data.totalStars === 'number') totalStars = data.totalStars;
    if (typeof data.digitDifficulty === 'number') digitDifficulty = data.digitDifficulty;
    if (typeof data.soundEnabled === 'boolean') soundEnabled = data.soundEnabled;
    if (data.userAnswers) userAnswers = data.userAnswers;
    if (data.userProcedures) userProcedures = data.userProcedures;
    if (data.levelProgressData) levelProgressData = data.levelProgressData;

    document.getElementById('total-stars').innerText = totalStars;
  } catch (e) {
    console.warn("Storage load error:", e);
  }
}

function onStudentNameChange(val) {
  studentName = val.trim() || "Campeón(a)";
  saveStateToLocalStorage();
}

// Audio Synthesizer
let audioCtx = null;
function getAudioContext() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playTone(freq, type = 'sine', duration = 0.12, gainLevel = 0.12) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(gainLevel, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch(e) {}
}

function playVictoryMelody() {
  if (!soundEnabled) return;
  const notes = [
    { f: 523.25, d: 0.12, t: 0 },
    { f: 523.25, d: 0.12, t: 140 },
    { f: 523.25, d: 0.12, t: 280 },
    { f: 659.25, d: 0.28, t: 420 },
    { f: 587.33, d: 0.14, t: 720 },
    { f: 659.25, d: 0.14, t: 880 },
    { f: 783.99, d: 0.45, t: 1040 },
    { f: 1046.50, d: 0.6, t: 1450 }
  ];
  notes.forEach(n => {
    setTimeout(() => {
      playTone(n.f, 'triangle', n.d, 0.18);
      playTone(n.f / 2, 'sine', n.d, 0.1);
    }, n.t);
  });
}

function playStarSound(starIndex) {
  if (!soundEnabled) return;
  const pitches = [587.33, 783.99, 1174.66];
  playTone(pitches[starIndex - 1] || 880, 'triangle', 0.25, 0.2);
}

// ----------------------------------------------------
// INITIALIZATION
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  loadStateFromLocalStorage();
  renderCategoryTabs();
  renderLevelTabs();
  loadLevel(1);
  setupHandwritingCanvas();
  setupProcedureCanvas();
});

const CATEGORY_KEYS = ['multiplication', 'addition', 'subtraction', 'division'];

function prevCategory() {
  const currentIndex = CATEGORY_KEYS.indexOf(currentCategory);
  const prevIndex = (currentIndex - 1 + CATEGORY_KEYS.length) % CATEGORY_KEYS.length;
  switchCategory(CATEGORY_KEYS[prevIndex]);
  scrollCategoryIntoView(CATEGORY_KEYS[prevIndex]);
  playTone(440, 'sine', 0.08);
}

function nextCategory() {
  const currentIndex = CATEGORY_KEYS.indexOf(currentCategory);
  const nextIndex = (currentIndex + 1) % CATEGORY_KEYS.length;
  switchCategory(CATEGORY_KEYS[nextIndex]);
  scrollCategoryIntoView(CATEGORY_KEYS[nextIndex]);
  playTone(440, 'sine', 0.08);
}

function scrollCategoryIntoView(catKey) {
  const map = { multiplication: 'mul', addition: 'add', subtraction: 'sub', division: 'div' };
  const tab = document.getElementById(`cat-${map[catKey]}`);
  if (tab) {
    tab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }
}

function scrollLevelsNav(direction) {
  const container = document.getElementById('levels-container');
  if (container) {
    container.scrollBy({ left: direction * 180, behavior: 'smooth' });
    playTone(520, 'triangle', 0.06);
  }
}

function switchCategory(catKey) {
  currentCategory = catKey;
  currentLevel = 1;
  renderCategoryTabs();
  renderLevelTabs();
  loadLevel(1);
  document.getElementById('current-op-badge').innerText = `${CATEGORY_DATA[catKey].icon} ${CATEGORY_DATA[catKey].name}`;
}

function renderCategoryTabs() {
  ['mul', 'add', 'sub', 'div'].forEach(key => {
    const map = { mul: 'multiplication', add: 'addition', sub: 'subtraction', div: 'division' };
    const btn = document.getElementById(`cat-${key}`);
    if (btn) btn.classList.toggle('active', currentCategory === map[key]);
  });
}

function renderLevelTabs() {
  const container = document.getElementById('levels-container');
  const catData = CATEGORY_DATA[currentCategory];
  container.innerHTML = catData.levels.map(lvl => {
    const progress = levelProgressData[`${currentCategory}-${lvl.id}`];
    const starStr = progress && progress.stars > 0 ? ' ⭐'.repeat(progress.stars) : '';
    return `
      <button class="level-tab-btn ${lvl.id === currentLevel ? 'active' : ''}" id="tab-lvl-${lvl.id}" onclick="loadLevel(${lvl.id})">
        <span style="font-size: 1.2rem;">${lvl.icon}</span>
        <span class="level-tab-title">${lvl.table ? 'Tabla ' + lvl.table : lvl.name.split(' ')[0]}</span>
        <span class="level-tab-sub">Nivel ${lvl.id}${starStr}</span>
      </button>
    `;
  }).join('');
}

function setGlobalInputMode(mode) {
  globalInputMode = mode;
  document.getElementById('mode-draw-btn').classList.toggle('active', mode === 'draw');
  document.getElementById('mode-type-btn').classList.toggle('active', mode === 'type');
  renderExercises();
}

function loadLevel(levelId) {
  currentLevel = levelId;
  renderLevelTabs();
  
  const catData = CATEGORY_DATA[currentCategory];
  const levelInfo = catData.levels.find(l => l.id === levelId) || catData.levels[0];
  
  document.getElementById('level-title').innerText = `${levelInfo.icon} Nivel ${levelInfo.id}: ${levelInfo.name}`;
  document.getElementById('level-desc').innerText = levelInfo.desc;
  
  renderExercises();
  updateLevelProgress();
}

function getQuestionsForCurrent() {
  const questions = [];

  if (currentCategory === 'multiplication') {
    if (currentLevel <= 10) {
      for (let i = 1; i <= 10; i++) {
        questions.push({ a: currentLevel, b: i, op: '×', res: currentLevel * i });
      }
    } else {
      for (let i = 0; i < 10; i++) {
        let a, b;
        if (digitDifficulty === 1) {
          a = Math.floor(Math.random() * 9) + 2;
          b = Math.floor(Math.random() * 9) + 2;
        } else if (digitDifficulty === 2) {
          a = Math.floor(Math.random() * 80) + 12;
          b = Math.floor(Math.random() * 8) + 2;
        } else {
          a = Math.floor(Math.random() * 300) + 100;
          b = Math.floor(Math.random() * 8) + 2;
        }
        questions.push({ a, b, op: '×', res: a * b });
      }
    }
  } else if (currentCategory === 'addition') {
    for (let i = 0; i < 10; i++) {
      let a, b;
      if (currentLevel === 1) { a = (i + 3); b = ((i * 2 + 1) % 9) + 1; }
      else if (currentLevel === 2) { a = 20 + (i * 7); b = 15 + (i * 6); }
      else if (currentLevel === 3) { a = 120 + (i * 45); b = 110 + (i * 38); }
      else { a = 250 + (i * 62); b = 140 + (i * 51); }
      questions.push({ a, b, op: '+', res: a + b });
    }
  } else if (currentCategory === 'subtraction') {
    for (let i = 0; i < 10; i++) {
      let a, b;
      if (currentLevel === 1) { a = 10 + i; b = i + 2; }
      else if (currentLevel === 2) { a = 50 + (i * 4); b = 18 + (i * 3); }
      else if (currentLevel === 3) { a = 450 + (i * 30); b = 125 + (i * 20); }
      else { a = 600 + (i * 35); b = 280 + (i * 25); }
      questions.push({ a, b, op: '−', res: a - b });
    }
  } else if (currentCategory === 'division') {
    for (let i = 0; i < 10; i++) {
      let divisor, quotient, dividend;
      if (currentLevel === 1) {
        divisor = (i % 8) + 2;
        quotient = (i % 9) + 1;
      } else if (currentLevel === 2) {
        divisor = (i % 7) + 3;
        quotient = 12 + i * 2;
      } else if (currentLevel === 3) {
        divisor = (i % 6) + 4;
        quotient = 45 + i * 15;
      } else {
        divisor = (i % 8) + 2;
        quotient = 60 + i * 20;
      }
      dividend = divisor * quotient;
      questions.push({ a: dividend, b: divisor, op: '÷', res: quotient });
    }
  }

  return questions;
}

function renderExercises() {
  const container = document.getElementById('exercise-grid');
  const questions = getQuestionsForCurrent();

  container.innerHTML = questions.map((q, idx) => {
    const key = `${currentCategory}-${currentLevel}-${idx}`;
    const data = userAnswers[key] || { num: '', text: '', drawing: null, correct: null };
    const hasProcedure = userProcedures[key];
    const resultWord = numberToWordsES(q.res);

    const statusClass = data.correct === true ? 'correct' : (data.correct === false ? 'incorrect' : '');
    const feedbackIcon = data.correct === true ? '✅' : (data.correct === false ? '❌' : '');

    return `
      <div class="exercise-row ${statusClass}" id="row-${key}">
        <div class="op-badge">${q.a} ${q.op} ${q.b}</div>
        <div class="equal-txt">=</div>
        
        <input type="number" class="num-input-box" id="num-${key}" 
               value="${data.num}" placeholder="?"
               oninput="onNumChange('${key}', this.value)">
               
        <div class="written-container">
          ${globalInputMode === 'type' ? `
            <input type="text" class="written-input-box" id="text-${key}"
                   value="${data.text}" placeholder="Ej: ${resultWord}"
                   oninput="onTextChange('${key}', this.value)">
          ` : `
            <div class="drawn-preview-slot" onclick="openDrawModal('${key}', '${q.a} ${q.op} ${q.b}', ${q.res})">
              ${data.drawing ? `
                <img src="${data.drawing}" alt="Trazo">
              ` : `
                <div class="draw-placeholder-btn">
                  <span>✏️ Trazar "<strong>${resultWord}</strong>"</span>
                </div>
              `}
            </div>
          `}
        </div>

        <button class="procedure-btn ${hasProcedure ? 'has-work' : ''}" 
                onclick="openProcedureModal('${key}', '${q.a} ${q.op} ${q.b}')"
                title="Abrir Pizarra para hacer el procedimiento con casita o pasos">
          ${hasProcedure ? '📐 Ver Casita' : '📐 Casita'}
        </button>

        <div class="feedback-icon">${feedbackIcon}</div>
      </div>
    `;
  }).join('');
}

function onNumChange(key, val) {
  if (!userAnswers[key]) userAnswers[key] = { num: '', text: '', drawing: null, correct: null };
  userAnswers[key].num = val;
  updateLevelProgress();
  saveStateToLocalStorage();
}

function onTextChange(key, val) {
  if (!userAnswers[key]) userAnswers[key] = { num: '', text: '', drawing: null, correct: null };
  userAnswers[key].text = val;
  updateLevelProgress();
  saveStateToLocalStorage();
}

function updateLevelProgress() {
  const questions = getQuestionsForCurrent();
  let filledCount = 0;

  questions.forEach((_, idx) => {
    const key = `${currentCategory}-${currentLevel}-${idx}`;
    const data = userAnswers[key];
    if (data && data.num !== '' && (data.text !== '' || data.drawing !== null)) {
      filledCount++;
    }
  });

  const pct = Math.round((filledCount / 10) * 100);
  document.getElementById('level-progress-fill').style.width = `${pct}%`;
  document.getElementById('level-progress-text').innerText = `${filledCount} / 10 completadas`;
}

// ----------------------------------------------------
// DYNAMIC SCORE & EVALUATION
// ----------------------------------------------------
let lastScoreStats = { correct: 0, stars: 0, levelName: "", student: "" };

function checkCurrentLevel() {
  const questions = getQuestionsForCurrent();
  let correctCount = 0;

  questions.forEach((q, idx) => {
    const key = `${currentCategory}-${currentLevel}-${idx}`;
    const data = userAnswers[key] || { num: '', text: '', drawing: null, correct: null };
    const expectedNum = q.res;
    const expectedWord = numberToWordsES(expectedNum);

    const isNumCorrect = parseInt(data.num) === expectedNum;
    let isTextCorrect = false;

    if (globalInputMode === 'draw') {
      isTextCorrect = data.drawing !== null || data.text !== '';
    } else {
      isTextCorrect = normalizeText(data.text) === normalizeText(expectedWord);
    }

    if (isNumCorrect && (globalInputMode === 'draw' ? (data.drawing !== null || isTextCorrect) : isTextCorrect)) {
      data.correct = true;
      correctCount++;
    } else {
      data.correct = false;
    }
    userAnswers[key] = data;
  });

  renderExercises();

  let earnedStars = 0;
  if (correctCount === 10) earnedStars = 3;
  else if (correctCount >= 7) earnedStars = 2;
  else if (correctCount >= 1) earnedStars = 1;

  // Track progress in levelProgressData
  const lvlKey = `${currentCategory}-${currentLevel}`;
  const prevData = levelProgressData[lvlKey] || { bestScore: 0, stars: 0, completed: false, attempts: 0 };
  
  const starsDiff = Math.max(0, earnedStars - prevData.stars);
  totalStars += starsDiff;
  document.getElementById('total-stars').innerText = totalStars;

  levelProgressData[lvlKey] = {
    bestScore: Math.max(prevData.bestScore, correctCount),
    stars: Math.max(prevData.stars, earnedStars),
    completed: correctCount >= 7,
    attempts: prevData.attempts + 1
  };

  saveStateToLocalStorage();
  renderLevelTabs();

  const catData = CATEGORY_DATA[currentCategory];
  const levelInfo = catData.levels.find(l => l.id === currentLevel) || catData.levels[0];
  const student = studentName;

  lastScoreStats = {
    correct: correctCount,
    stars: earnedStars,
    levelName: levelInfo.name,
    categoryName: catData.name,
    student: student
  };

  openScoreModal(correctCount, earnedStars);
}

function openScoreModal(correctCount, earnedStars) {
  const modal = document.getElementById('victory-modal');
  const catData = CATEGORY_DATA[currentCategory];
  const levelInfo = catData.levels.find(l => l.id === currentLevel) || catData.levels[0];

  document.getElementById('victory-title').innerText = `¡Resultado de ${studentName}!`;
  document.getElementById('animated-score-val').innerText = '0';
  document.getElementById('animated-pct').innerText = '0%';
  document.getElementById('victory-msg').innerText = 'Evaluando respuestas...';

  for (let i = 1; i <= 3; i++) {
    const slot = document.getElementById(`star-${i}`);
    slot.className = 'star-slot';
    slot.innerText = '☆';
  }

  modal.classList.add('active');

  let currentVal = 0;
  const duration = 1000;
  const stepTime = Math.max(Math.floor(duration / (correctCount || 1)), 60);

  const counterInterval = setInterval(() => {
    if (currentVal < correctCount) {
      currentVal++;
      document.getElementById('animated-score-val').innerText = currentVal;
      document.getElementById('animated-pct').innerText = `${Math.round((currentVal / 10) * 100)}%`;
      playTone(440 + currentVal * 40, 'sine', 0.08, 0.08);
    } else {
      clearInterval(counterInterval);
      document.getElementById('animated-score-val').innerText = correctCount;
      document.getElementById('animated-pct').innerText = `${correctCount * 10}%`;

      setTimeout(() => {
        animateStars(earnedStars, correctCount, levelInfo);
      }, 250);
    }
  }, stepTime);
}

function animateStars(earnedStars, correctCount, levelInfo) {
  let starIdx = 1;
  function popNextStar() {
    if (starIdx <= earnedStars) {
      const slot = document.getElementById(`star-${starIdx}`);
      slot.classList.add('earned');
      slot.innerText = '⭐';
      playStarSound(starIdx);
      starIdx++;
      setTimeout(popNextStar, 320);
    } else {
      finalizeScorePresentation(earnedStars, correctCount, levelInfo);
    }
  }

  if (earnedStars > 0) popNextStar();
  else finalizeScorePresentation(0, correctCount, levelInfo);
}

function finalizeScorePresentation(earnedStars, correctCount, levelInfo) {
  const msgEl = document.getElementById('victory-msg');
  const emojiEl = document.getElementById('score-emoji');
  const nextBtn = document.getElementById('next-level-btn');
  const totalLevels = CATEGORY_DATA[currentCategory].levels.length;

  if (currentLevel < totalLevels) {
    nextBtn.innerText = '¡Siguiente Nivel! 🚀';
  } else {
    nextBtn.innerText = '🏆 ¡Terminar y Ver Diploma!';
  }

  if (earnedStars === 3) {
    emojiEl.innerText = '🏆';
    msgEl.innerText = `¡PERFECTO! 10 de 10 en ${levelInfo.name}. ¡Ganaste 3 Estrellas de Oro! ⭐⭐⭐`;
    playVictoryMelody();
    triggerMultiConfetti();
  } else if (earnedStars === 2) {
    emojiEl.innerText = '🎉';
    msgEl.innerText = `¡Muy Bien! Tuviste ${correctCount} aciertos y ganaste 2 Estrellas ⭐⭐.`;
    playVictoryMelody();
    triggerSingleConfetti();
  } else if (earnedStars === 1) {
    emojiEl.innerText = '💪';
    msgEl.innerText = `¡Buen intento! Tuviste ${correctCount} de 10 aciertos. Ganaste 1 Estrella ⭐.`;
    playTone(523.25, 'triangle', 0.25);
    triggerSingleConfetti();
  } else {
    emojiEl.innerText = '📚';
    msgEl.innerText = `Tuviste 0 aciertos en esta ocasión. ¡Puedes avanzar o repasar cuando gustes!`;
    playTone(330, 'sine', 0.2);
  }
}

function triggerMultiConfetti() {
  if (typeof confetti === 'function') {
    confetti({ particleCount: 80, angle: 60, spread: 55, origin: { x: 0, y: 0.7 } });
    setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 55, origin: { x: 1, y: 0.7 } }), 200);
    setTimeout(() => confetti({ particleCount: 140, spread: 90, origin: { y: 0.5 } }), 450);
  }
}

function triggerSingleConfetti() {
  if (typeof confetti === 'function') confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
}

function closeVictoryModal() {
  document.getElementById('victory-modal').classList.remove('active');
}

function nextLevelFromVictory() {
  document.getElementById('victory-modal').classList.remove('active');
  const totalLevels = CATEGORY_DATA[currentCategory].levels.length;
  if (currentLevel < totalLevels) {
    loadLevel(currentLevel + 1);
  } else {
    showFinalMasterCelebration();
  }
}

function showFinalMasterCelebration() {
  const modal = document.getElementById('victory-modal');
  const student = studentName;
  const catName = CATEGORY_DATA[currentCategory].name;
  
  document.getElementById('score-emoji').innerText = '👑';
  document.getElementById('victory-title').innerText = `¡GRAN MAESTRO DE ${catName.toUpperCase()}! 🎓`;
  document.getElementById('animated-score-val').innerText = totalStars;
  document.getElementById('animated-pct').innerText = '⭐ Estrellas';
  document.getElementById('victory-msg').innerText = `¡Felicidades, ${student}! Has completado con éxito todos los niveles de ${catName}. ¡Eres un genio de 4º Grado!`;
  
  for (let i = 1; i <= 3; i++) {
    const slot = document.getElementById(`star-${i}`);
    slot.className = 'star-slot earned';
    slot.innerText = '⭐';
  }

  lastScoreStats = {
    correct: 10,
    stars: 3,
    levelName: `Todos los Niveles de ${catName}`,
    categoryName: catName,
    student: student
  };

  const nextBtn = document.getElementById('next-level-btn');
  nextBtn.innerText = '🔄 Jugar de Nuevo desde Nivel 1';
  nextBtn.onclick = () => {
    modal.classList.remove('active');
    loadLevel(1);
  };

  modal.classList.add('active');
  playVictoryMelody();
  triggerMultiConfetti();
}

function resetCurrentLevel() {
  const questions = getQuestionsForCurrent();
  questions.forEach((_, idx) => {
    const key = `${currentCategory}-${currentLevel}-${idx}`;
    delete userAnswers[key];
  });
  saveStateToLocalStorage();
  renderExercises();
  updateLevelProgress();
  playTone(330, 'sine', 0.15);
}

// ----------------------------------------------------
// 📊 DASHBOARD DE AVANCES & ESTADÍSTICAS
// ----------------------------------------------------
let activeDashCategory = 'multiplication';

function openDashboardModal() {
  document.getElementById('dash-student-title').innerText = `Progreso de ${studentName}`;
  document.getElementById('dash-total-stars').innerText = totalStars;

  // Calculate total levels and completed levels across all categories
  let totalPossibleLevels = 0;
  let completedCount = 0;
  let totalScoreSum = 0;
  let maxPossibleScore = 0;

  Object.keys(CATEGORY_DATA).forEach(catKey => {
    const levels = CATEGORY_DATA[catKey].levels;
    totalPossibleLevels += levels.length;
    levels.forEach(lvl => {
      maxPossibleScore += 10;
      const prog = levelProgressData[`${catKey}-${lvl.id}`];
      if (prog) {
        if (prog.completed || prog.stars >= 2) completedCount++;
        totalScoreSum += (prog.bestScore || 0);
      }
    });
  });

  const masteryPct = Math.min(100, Math.round((totalScoreSum / (maxPossibleScore || 1)) * 100));
  document.getElementById('dash-levels-completed').innerText = `${completedCount} / ${totalPossibleLevels}`;
  document.getElementById('dash-overall-mastery').innerText = `${masteryPct}%`;

  renderDashboardTab(activeDashCategory);
  renderDashboardAchievements();

  document.getElementById('dashboard-modal').classList.add('active');
}

function closeDashboardModal() {
  document.getElementById('dashboard-modal').classList.remove('active');
}

function renderDashboardTab(catKey) {
  activeDashCategory = catKey;
  ['mul', 'add', 'sub', 'div'].forEach(k => {
    const map = { mul: 'multiplication', add: 'addition', sub: 'subtraction', div: 'division' };
    const btn = document.getElementById(`dash-tab-${k}`);
    if (btn) btn.classList.toggle('active', catKey === map[k]);
  });

  const container = document.getElementById('dash-discipline-content');
  const catData = CATEGORY_DATA[catKey];

  container.innerHTML = catData.levels.map(lvl => {
    const prog = levelProgressData[`${catKey}-${lvl.id}`] || { bestScore: 0, stars: 0, completed: false, attempts: 0 };
    const isMastered = prog.stars === 3;
    const isProgress = prog.attempts > 0 && prog.stars < 3;

    let badgeClass = 'status-not-started';
    let badgeText = 'No Iniciado';
    if (isMastered || prog.completed) {
      badgeClass = 'status-completed';
      badgeText = 'Dominado';
    } else if (isProgress) {
      badgeClass = 'status-progress';
      badgeText = 'En Práctica';
    }

    let starsDisplay = '';
    for (let s = 1; s <= 3; s++) {
      starsDisplay += s <= prog.stars ? '⭐' : '☆';
    }

    return `
      <div class="dash-level-card ${isMastered ? 'mastered' : ''}">
        <div class="dash-card-header">
          <span class="dash-card-title">${lvl.icon} ${lvl.name}</span>
          <span class="dash-status-badge ${badgeClass}">${badgeText}</span>
        </div>
        <div class="dash-stars">${starsDisplay}</div>
        <div class="dash-score-text">
          Mejor puntaje: <strong>${prog.bestScore} / 10</strong> (${prog.attempts} intento${prog.attempts === 1 ? '' : 's'})
        </div>
      </div>
    `;
  }).join('');
}

function renderDashboardAchievements() {
  const container = document.getElementById('dash-achievements-list');
  if (!container) return;

  // Check achievement criteria
  let totalLevelsCompleted = 0;
  let perfectCount = 0;
  let mult10Count = 0;
  let divCompleted = 0;

  Object.keys(CATEGORY_DATA).forEach(catKey => {
    CATEGORY_DATA[catKey].levels.forEach(lvl => {
      const prog = levelProgressData[`${catKey}-${lvl.id}`];
      if (prog) {
        if (prog.stars >= 2) totalLevelsCompleted++;
        if (prog.bestScore === 10) perfectCount++;
        if (catKey === 'multiplication' && lvl.id <= 10 && prog.stars >= 2) mult10Count++;
        if (catKey === 'division' && prog.stars >= 2) divCompleted++;
      }
    });
  });

  const achievements = [
    { icon: "🌟", title: "Primer Paso", desc: "Completar al menos 1 nivel con estrellas.", unlocked: totalLevelsCompleted >= 1 },
    { icon: "🥇", title: "Puntaje Perfecto", desc: "Obtener 10 de 10 en cualquier tabla u operación.", unlocked: perfectCount >= 1 },
    { icon: "👑", title: "Rey de las Tablas", desc: "Aprobar las 10 tablas de multiplicar.", unlocked: mult10Count >= 10 },
    { icon: "➗", title: "Maestro de la Casita", desc: "Completar 3 o más niveles de división.", unlocked: divCompleted >= 3 },
    { icon: "🚀", title: "Coleccionista Cósmico", desc: "Acumular 20 o más estrellas doradas.", unlocked: totalStars >= 20 }
  ];

  container.innerHTML = achievements.map(ach => `
    <div class="achievement-item ${ach.unlocked ? 'unlocked' : ''}">
      <span class="ach-icon">${ach.icon}</span>
      <div class="ach-info">
        <strong class="ach-title">${ach.title}</strong>
        <span class="ach-desc">${ach.desc}</span>
      </div>
    </div>
  `).join('');
}

function confirmResetAllProgress() {
  if (confirm("¿Estás seguro de que deseas reiniciar todo el progreso y las estrellas de " + studentName + "?")) {
    localStorage.removeItem(STORAGE_KEY);
    totalStars = 0;
    userAnswers = {};
    userProcedures = {};
    levelProgressData = {};
    document.getElementById('total-stars').innerText = 0;
    closeDashboardModal();
    loadLevel(1);
    showToast("Progreso reiniciado correctamente 🔄");
  }
}

// ----------------------------------------------------
// SOCIAL SHARING & DUOLINGO-STYLE CARD GENERATOR
// ----------------------------------------------------
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.innerText = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

function getShareText() {
  const starsTxt = "⭐".repeat(Math.max(lastScoreStats.stars, 1));
  return `¡Hola! 🚀 ${lastScoreStats.student} completó el nivel "${lastScoreStats.levelName}" en Tablas Mágicas (4º Grado) y ganó ${lastScoreStats.stars} estrellas ${starsTxt}! 🏆 Practica gratis aquí: ${APP_URL}`;
}

function shareOnWhatsApp() {
  const text = encodeURIComponent(getShareText());
  window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
}

function shareOnFacebook() {
  const url = encodeURIComponent(APP_URL);
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
}

function copyShareLink() {
  navigator.clipboard.writeText(APP_URL).then(() => {
    showToast("¡Enlace copiado al portapapeles! 📋");
  }).catch(() => {
    prompt("Copia este enlace:", APP_URL);
  });
}

function generateAndDownloadCard() {
  const cardCanvas = document.getElementById('card-generator-canvas');
  if (!cardCanvas) return;
  const c = cardCanvas.getContext('2d');
  const w = 1080;
  const h = 1080;

  const grad = c.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#312e81');
  grad.addColorStop(0.5, '#4f46e5');
  grad.addColorStop(1, '#7c3aed');
  c.fillStyle = grad;
  c.fillRect(0, 0, w, h);

  c.fillStyle = 'rgba(255, 255, 255, 0.05)';
  c.beginPath(); c.arc(100, 100, 220, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(980, 900, 280, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(950, 150, 140, 0, Math.PI * 2); c.fill();

  c.shadowColor = 'rgba(0, 0, 0, 0.4)';
  c.shadowBlur = 50;
  c.shadowOffsetY = 25;
  c.fillStyle = '#ffffff';
  roundRect(c, 70, 70, w - 140, h - 140, 50, true, false);
  c.shadowColor = 'transparent';

  c.fillStyle = '#fef08a';
  roundRect(c, 320, 120, 440, 65, 30, true, false);
  c.fillStyle = '#854d0e';
  c.font = 'bold 30px Nunito, sans-serif';
  c.textAlign = 'center';
  c.fillText('🚀 TABLAS MÁGICAS • 4º GRADO', w / 2, 163);

  c.font = '140px sans-serif';
  c.fillText(lastScoreStats.stars === 3 ? '🏆' : (lastScoreStats.stars >= 2 ? '🎉' : '⭐'), w / 2, 330);

  c.fillStyle = '#1e1b4b';
  c.font = '900 58px Fredoka, Nunito, sans-serif';
  c.fillText('¡LOGRO DESBLOQUEADO!', w / 2, 420);

  c.fillStyle = '#4f46e5';
  c.font = '800 50px Nunito, sans-serif';
  c.fillText(`¡Felicidades, ${lastScoreStats.student}!`, w / 2, 490);

  c.fillStyle = '#f8fafc';
  c.strokeStyle = '#e2e8f0';
  c.lineWidth = 4;
  roundRect(c, 140, 530, w - 280, 240, 30, true, true);

  c.fillStyle = '#64748b';
  c.font = 'bold 30px Nunito, sans-serif';
  c.fillText(lastScoreStats.levelName.toUpperCase(), w / 2, 590);

  c.fillStyle = '#10b981';
  c.font = '900 64px Fredoka, sans-serif';
  c.fillText(`${lastScoreStats.correct} / 10 Aciertos (${lastScoreStats.correct * 10}%)`, w / 2, 670);

  const starsCount = Math.max(lastScoreStats.stars, 1);
  let starsStr = '';
  for (let i = 0; i < 3; i++) {
    starsStr += i < starsCount ? '⭐ ' : '☆ ';
  }
  c.font = '65px sans-serif';
  c.fillText(starsStr.trim(), w / 2, 745);

  c.fillStyle = '#475569';
  c.font = 'bold 30px Nunito, sans-serif';
  c.fillText('Practica matemáticas y supera tus retos gratis en:', w / 2, 860);

  c.fillStyle = '#4338ca';
  c.font = '900 38px Nunito, sans-serif';
  c.fillText('werkweek.github.io/tablas-magicas/', w / 2, 920);

  cardCanvas.toBlob(blob => {
    if (!blob) return;
    const file = new File([blob], `Logro_Tablas_Magicas_${lastScoreStats.student}.png`, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({
        files: [file],
        title: 'Mi Logro en Tablas Mágicas 🏆',
        text: getShareText()
      }).catch(() => downloadBlob(blob));
    } else {
      downloadBlob(blob);
    }
  }, 'image/png');
}

function downloadBlob(blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Logro_Tablas_Magicas_${lastScoreStats.student.replace(/\s+/g, '_')}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast("¡Tarjeta de logro descargada! 🖼️");
}

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

// ----------------------------------------------------
// SETTINGS MODAL
// ----------------------------------------------------
function openSettingsModal() {
  document.getElementById('settings-modal').classList.add('active');
}

function closeSettingsModal() {
  document.getElementById('settings-modal').classList.remove('active');
  if (currentLevel === 11) renderExercises();
}

function setDigitDifficulty(diff) {
  digitDifficulty = parseInt(diff);
  saveStateToLocalStorage();
}

function toggleSound(enabled) {
  soundEnabled = enabled;
  saveStateToLocalStorage();
}

// ----------------------------------------------------
// 1. HANDWRITING CANVAS LOGIC (MOBILE & TOUCH OPTIMIZED)
// ----------------------------------------------------
let activeDrawingKey = null;
let hwCanvas, hwCtx;
let isHwDrawing = false;
let hwDrawColor = '#1e3a8a';
let hwStrokeHistory = [];

function setupHandwritingCanvas() {
  hwCanvas = document.getElementById('handwriting-canvas');
  if (!hwCanvas) return;
  hwCtx = hwCanvas.getContext('2d');

  hwCanvas.addEventListener('pointerdown', e => {
    e.preventDefault();
    hwCanvas.setPointerCapture(e.pointerId);
    isHwDrawing = true;
    hwStrokeHistory.push(hwCanvas.toDataURL());
    if (hwStrokeHistory.length > 15) hwStrokeHistory.shift();
    const { x, y } = getCanvasCoords(hwCanvas, e);
    hwCtx.beginPath();
    hwCtx.moveTo(x, y);
    hwCtx.strokeStyle = hwDrawColor;
    hwCtx.lineWidth = 4;
    hwCtx.lineCap = 'round';
    hwCtx.lineJoin = 'round';
  });

  hwCanvas.addEventListener('pointermove', e => {
    if (!isHwDrawing) return;
    e.preventDefault();
    const { x, y } = getCanvasCoords(hwCanvas, e);
    hwCtx.lineTo(x, y);
    hwCtx.stroke();
  });

  const stopHw = e => {
    if (isHwDrawing) {
      hwCtx.closePath();
      isHwDrawing = false;
      try { hwCanvas.releasePointerCapture(e.pointerId); } catch(err){}
    }
  };
  hwCanvas.addEventListener('pointerup', stopHw);
  hwCanvas.addEventListener('pointercancel', stopHw);
}

function openDrawModal(key, opTitle, res) {
  activeDrawingKey = key;
  const word = numberToWordsES(res);
  document.getElementById('modal-op-title').innerText = `${opTitle} = ${res}`;
  document.getElementById('modal-hint-word').innerText = word;

  clearCanvas();
  const existing = userAnswers[key]?.drawing;
  if (existing) {
    const img = new Image();
    img.onload = () => hwCtx.drawImage(img, 0, 0);
    img.src = existing;
  }

  document.getElementById('draw-modal').classList.add('active');
}

function closeDrawModal() {
  document.getElementById('draw-modal').classList.remove('active');
}

function setDrawColor(color) {
  hwDrawColor = color;
  document.querySelectorAll('#draw-modal .color-dot').forEach(d => {
    d.classList.toggle('active', d.style.backgroundColor === color || d.getAttribute('style').includes(color));
  });
}

function clearCanvas() {
  if (hwCtx && hwCanvas) {
    hwCtx.clearRect(0, 0, hwCanvas.width, hwCanvas.height);
    hwStrokeHistory = [];
  }
}

function undoCanvas() {
  if (hwStrokeHistory.length > 0) {
    const prev = hwStrokeHistory.pop();
    const img = new Image();
    img.onload = () => {
      hwCtx.clearRect(0, 0, hwCanvas.width, hwCanvas.height);
      hwCtx.drawImage(img, 0, 0);
    };
    img.src = prev;
  } else {
    clearCanvas();
  }
}

function saveDrawingToExercise() {
  if (!activeDrawingKey) return;
  const dataURL = hwCanvas.toDataURL('image/png');
  if (!userAnswers[activeDrawingKey]) {
    userAnswers[activeDrawingKey] = { num: '', text: '', drawing: null, correct: null };
  }
  userAnswers[activeDrawingKey].drawing = dataURL;
  saveStateToLocalStorage();
  closeDrawModal();
  renderExercises();
  updateLevelProgress();
  playTone(880, 'sine', 0.1);
}

// ----------------------------------------------------
// 2. PROCEDURE CANVAS LOGIC (CASITA & FORMAL DIVISION)
// ----------------------------------------------------
let activeProcedureKey = null;
let procCanvas, procCtx;
let isProcDrawing = false;
let procDrawColor = '#1e293b';
let procStrokeHistory = [];

function setupProcedureCanvas() {
  procCanvas = document.getElementById('procedure-canvas');
  if (!procCanvas) return;
  procCtx = procCanvas.getContext('2d');

  procCanvas.addEventListener('pointerdown', e => {
    e.preventDefault();
    procCanvas.setPointerCapture(e.pointerId);
    isProcDrawing = true;
    procStrokeHistory.push(procCanvas.toDataURL());
    if (procStrokeHistory.length > 20) procStrokeHistory.shift();
    const { x, y } = getCanvasCoords(procCanvas, e);
    procCtx.beginPath();
    procCtx.moveTo(x, y);
    procCtx.strokeStyle = procDrawColor;
    procCtx.lineWidth = 3.5;
    procCtx.lineCap = 'round';
    procCtx.lineJoin = 'round';
  });

  procCanvas.addEventListener('pointermove', e => {
    if (!isProcDrawing) return;
    e.preventDefault();
    const { x, y } = getCanvasCoords(procCanvas, e);
    procCtx.lineTo(x, y);
    procCtx.stroke();
  });

  const stopProc = e => {
    if (isProcDrawing) {
      procCtx.closePath();
      isProcDrawing = false;
      try { procCanvas.releasePointerCapture(e.pointerId); } catch(err){}
    }
  };
  procCanvas.addEventListener('pointerup', stopProc);
  procCanvas.addEventListener('pointercancel', stopProc);
}

function openProcedureModal(key, opTitle) {
  activeProcedureKey = key;
  document.getElementById('procedure-op-title').innerText = `📐 ${opTitle}`;
  clearProcCanvas();

  const existing = userProcedures[key];
  if (existing) {
    const img = new Image();
    img.onload = () => procCtx.drawImage(img, 0, 0);
    img.src = existing;
  }

  document.getElementById('procedure-modal').classList.add('active');
}

function closeProcedureModal() {
  document.getElementById('procedure-modal').classList.remove('active');
}

function setProcDrawColor(color) {
  procDrawColor = color;
  document.querySelectorAll('#procedure-modal .color-dot').forEach(d => {
    d.classList.toggle('active', d.style.backgroundColor === color || d.getAttribute('style').includes(color));
  });
}

function clearProcCanvas() {
  if (procCtx && procCanvas) {
    procCtx.clearRect(0, 0, procCanvas.width, procCanvas.height);
    procStrokeHistory = [];
  }
}

function undoProcCanvas() {
  if (procStrokeHistory.length > 0) {
    const prev = procStrokeHistory.pop();
    const img = new Image();
    img.onload = () => {
      procCtx.clearRect(0, 0, procCanvas.width, procCanvas.height);
      procCtx.drawImage(img, 0, 0);
    };
    img.src = prev;
  } else {
    clearProcCanvas();
  }
}

function saveProcedureToExercise() {
  if (!activeProcedureKey) return;
  userProcedures[activeProcedureKey] = procCanvas.toDataURL('image/png');
  saveStateToLocalStorage();
  closeProcedureModal();
  renderExercises();
  playTone(880, 'sine', 0.1);
}

function getCanvasCoords(c, e) {
  const rect = c.getBoundingClientRect();
  const scaleX = c.width / rect.width;
  const scaleY = c.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
}
