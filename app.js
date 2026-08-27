// Centro de Matemáticas 4º Grado - Multiplicación (1 al 10 + Aleatorio), Sumas, Restas y Divisiones
let currentCategory = 'multiplication'; // 'multiplication', 'addition', 'subtraction', 'division'
let currentLevel = 1;
let globalInputMode = 'draw'; // 'draw' or 'type'
let totalStars = 0;
let userAnswers = {};
let userProcedures = {}; // key -> procedure dataURL
let digitDifficulty = 2; // 1, 2, or 3 digits
let soundEnabled = true;

// Spanish Number to Words Converter (0 to 1000)
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

// Category & Levels Definition
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
  renderCategoryTabs();
  renderLevelTabs();
  loadLevel(1);
  setupHandwritingCanvas();
  setupProcedureCanvas();
});

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
  container.innerHTML = catData.levels.map(lvl => `
    <button class="level-tab-btn ${lvl.id === currentLevel ? 'active' : ''}" id="tab-lvl-${lvl.id}" onclick="loadLevel(${lvl.id})">
      <span style="font-size: 1.2rem;">${lvl.icon}</span>
      <span class="level-tab-title">${lvl.table ? 'Tabla ' + lvl.table : lvl.name.split(' ')[0]}</span>
      <span class="level-tab-sub">Nivel ${lvl.id}</span>
    </button>
  `).join('');
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

// Generate Questions according to category, level, and difficulty settings
function getQuestionsForCurrent() {
  const seed = `${currentCategory}-${currentLevel}`;
  const questions = [];

  if (currentCategory === 'multiplication') {
    if (currentLevel <= 10) {
      // Table 1 to 10
      for (let i = 1; i <= 10; i++) {
        questions.push({ a: currentLevel, b: i, op: '×', res: currentLevel * i });
      }
    } else {
      // Level 11: Random / Multidigit Challenge
      for (let i = 0; i < 10; i++) {
        let a, b;
        if (digitDifficulty === 1) {
          a = Math.floor(Math.random() * 9) + 2;
          b = Math.floor(Math.random() * 9) + 2;
        } else if (digitDifficulty === 2) {
          a = Math.floor(Math.random() * 80) + 12; // 2 digits
          b = Math.floor(Math.random() * 8) + 2;
        } else {
          a = Math.floor(Math.random() * 300) + 100; // 3 digits
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
        
        <!-- Numeric input -->
        <input type="number" class="num-input-box" id="num-${key}" 
               value="${data.num}" placeholder="?"
               oninput="onNumChange('${key}', this.value)">
               
        <!-- Written Word / Drawing Section -->
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

        <!-- Procedure / Casita Whiteboard Button (Especially for Division / Multidigit) -->
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
}

function onTextChange(key, val) {
  if (!userAnswers[key]) userAnswers[key] = { num: '', text: '', drawing: null, correct: null };
  userAnswers[key].text = val;
  updateLevelProgress();
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

  totalStars += earnedStars;
  document.getElementById('total-stars').innerText = totalStars;

  openScoreModal(correctCount, earnedStars);
}

function openScoreModal(correctCount, earnedStars) {
  const modal = document.getElementById('victory-modal');
  const student = document.getElementById('student-name').value || "Campeón(a)";
  const catData = CATEGORY_DATA[currentCategory];
  const levelInfo = catData.levels.find(l => l.id === currentLevel) || catData.levels[0];

  document.getElementById('victory-title').innerText = `¡Resultado de ${student}!`;
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
  const student = document.getElementById('student-name').value || "Campeón(a)";
  const catName = CATEGORY_DATA[currentCategory].name;
  
  document.getElementById('score-emoji').innerText = '👑';
  document.getElementById('victory-title').innerText = `¡GRAN MAESTRO DE ${catName.toUpperCase()}! 🎓`;
  document.getElementById('animated-score-val').innerText = totalStars;
  document.getElementById('animated-pct').innerText = '⭐ Estrellas';
  document.getElementById('victory-msg').innerText = `¡Felicidades, ${student}! Has completado con éxito todos los niveles de ${catName}. ¡Eres un orgullo de 4º Grado!`;
  
  for (let i = 1; i <= 3; i++) {
    const slot = document.getElementById(`star-${i}`);
    slot.className = 'star-slot earned';
    slot.innerText = '⭐';
  }

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
  renderExercises();
  updateLevelProgress();
  playTone(330, 'sine', 0.15);
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
}

function toggleSound(enabled) {
  soundEnabled = enabled;
}

// ----------------------------------------------------
// 1. HANDWRITING CANVAS LOGIC (Word Drawing)
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
    isHwDrawing = true;
    hwStrokeHistory.push(hwCanvas.toDataURL());
    if (hwStrokeHistory.length > 15) hwStrokeHistory.shift();
    const { x, y } = getCanvasCoords(hwCanvas, e);
    hwCtx.beginPath();
    hwCtx.moveTo(x, y);
    hwCtx.strokeStyle = hwDrawColor;
    hwCtx.lineWidth = 4.5;
    hwCtx.lineCap = 'round';
    hwCtx.lineJoin = 'round';
  });

  hwCanvas.addEventListener('pointermove', e => {
    if (!isHwDrawing) return;
    const { x, y } = getCanvasCoords(hwCanvas, e);
    hwCtx.lineTo(x, y);
    hwCtx.stroke();
  });

  const stopHw = () => { if (isHwDrawing) { hwCtx.closePath(); isHwDrawing = false; } };
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
  closeDrawModal();
  renderExercises();
  updateLevelProgress();
  playTone(880, 'sine', 0.1);
}

// ----------------------------------------------------
// 2. PROCEDURE CANVAS LOGIC (Division Casita Whiteboard)
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
    const { x, y } = getCanvasCoords(procCanvas, e);
    procCtx.lineTo(x, y);
    procCtx.stroke();
  });

  const stopProc = () => { if (isProcDrawing) { procCtx.closePath(); isProcDrawing = false; } };
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
