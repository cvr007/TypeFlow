'use strict';

// Change the round duration here; all times are in seconds.
const CONFIG = {
  linesPerRound: 4,
  durations: { beginner: 60, intermediate: 50, advanced: 40, expert: 35 },
  levels: ['beginner', 'intermediate', 'advanced', 'expert']
};

// Original sentence banks. Edit these freely; each round samples without repeats.
const SENTENCE_BANKS = {
  beginner: [
    'the sun is warm.', 'i like fresh bread.', 'we walk to school.', 'my cat naps here.', 'the bus is late.',
    'please close the door.', 'the soup smells good.', 'birds sit in trees.', 'i have a blue pen.', 'the rain is soft.',
    'we can play today.', 'this room feels calm.', 'dad makes hot tea.', 'the moon looks bright.', 'keep your shoes dry.',
    'the dog runs fast.', 'i found my keys.', 'flowers grow near home.'
  ],
  intermediate: [
    'Mira packed her lunch, then walked to the station.', 'The small garden looks brighter after yesterday’s rain.', 'Please leave your notebook beside the kitchen window.',
    'Our train arrived early, so we found a quiet seat.', 'A gentle breeze moved the curtains across the room.', 'He checked the map before choosing the shorter route.',
    'The library closes at six, but the reading room stays open.', 'I saved the document, then sent a copy to my teacher.',
    'Fresh oranges, warm bread, and tea made a simple breakfast.', 'We crossed the bridge and watched boats pass below.',
    'Her new schedule includes time for reading every evening.', 'The little shop sells handmade cards and wooden toys.',
    'Clouds gathered quickly, although the afternoon began with sunshine.', 'Remember to charge your phone before leaving the house.',
    'The coach explained each step, then answered our questions.', 'A quiet walk can make a busy day feel lighter.',
    'They planted three trees near the entrance last spring.', 'My brother enjoys cooking, especially when friends come over.'
  ],
  advanced: [
    'Before sunrise, the research team checked 12 instruments; every reading looked stable.', '“Are we ready?” Lena asked, then reviewed the final checklist once more.',
    'The old clock stopped at 8:45, although nobody remembered hearing it click.', 'When the signal turns green, press button 3; do not release it early!',
    'I thought the answer was simple, but the second example changed everything.', 'The workshop begins at 9:30; please bring your notes, questions, and a pen.',
    '“Keep moving!” the guide called, while distant thunder rolled across the valley.', 'Our first estimate was 27 units; the measured result was slightly higher.',
    'Why did the system restart? Check the power cable, then inspect the log.', 'She wrote “try again” on the board, adding a small star beside it.',
    'Although the path looked narrow, 6 cyclists passed safely before the rain.', 'The recipe says 2 teaspoons of salt; taste the sauce before adding more.',
    'A bright flash appeared at 10:02, then the entire screen went dark.', 'If the door will not open, wait 5 seconds and try the handle again.',
    'The speaker paused briefly: “Good ideas need patience, practice, and honest feedback.”', 'We reached checkpoint 4, but the compass pointed north-east instead of east.',
    'Can you explain the difference between speed and accuracy? Use one clear example!', 'The package arrived intact; its label showed code AX-17 and a return address.'
  ],
  expert: [
    'At 07:45, the analyst flagged record [Q-18]—its checksum was 9% below the expected threshold.',
    'Re-run `verify(input_03)` before deployment; a missing semicolon can invalidate the entire 2-step sequence.',
    'The revised model scored 98.6% on set B (n=2,400), yet its confidence interval remained unusually wide.',
    'If latency exceeds 120 ms, switch to fallback-mode; otherwise, preserve the cache and log event #42.',
    'Her note read: “Compare pre- and post-test results”; the difference was +14.2 units, not −14.2.',
    'A well-formed request uses key=value pairs, square brackets [ ], and a stable identifier such as usr-008.',
    'The archive contains 3,071 entries—filter by date, checksum, and owner before exporting any .json files.',
    'When x ≠ 0, evaluate (x² + 4x − 5) / x; report the result to 3 decimal places.',
    'Protocol v2.7 requires TLS, a 32-byte token, and explicit consent; defaults alone are not sufficient.',
    'The sensor registered 0.0048 A at 24°C; repeat the measurement after the display stabilizes for 10 seconds.',
    '“Do not overwrite /config/prod.yaml,” the warning stated; create a timestamped backup (YYYY-MM-DD) first.',
    'Their 5-point audit covered access, retention, encryption, recovery, and ownership—each item needs written evidence.',
    'The parser accepts {"mode":"safe","retry":3}, but rejects trailing commas and unescaped quotation marks.',
    'After 16 iterations, error fell from 3.8e−2 to 6.1e−5; document the seed and runtime environment.',
    'Choose option C only when (score ≥ 0.91) && (warnings === 0); otherwise, return status: "review".',
    'The 1.25-meter panel weighs 8.4 kg; secure both M6 bolts before applying the 240 N test load.',
    'For ticket INC-2048, attach the sanitized trace, note UTC offset (+05:30), and remove all personal identifiers.',
    'A robust workflow is repeatable, observable, and reversible—not merely fast when conditions are ideal.'
  ]
};

const LEVEL_META = {
  beginner: { name: 'Beginner', range: 'Under 20 WPM' },
  intermediate: { name: 'Intermediate', range: '20 to 40 WPM' },
  advanced: { name: 'Advanced', range: '40 to 60 WPM' },
  expert: { name: 'Expert', range: '60+ WPM' }
};

const $ = (selector) => document.querySelector(selector);
const els = {
  levelScreen: $('#levelScreen'), typingScreen: $('#typingScreen'), resultsScreen: $('#resultsScreen'),
  levelGrid: $('#levelGrid'), keyboardDock: $('#keyboardDock'), keyboard: $('#keyboard'), sentenceList: $('#sentenceList'),
  timerValue: $('#timerValue'), wpmValue: $('#wpmValue'), accuracyValue: $('#accuracyValue'), progressBar: $('#progressBar'),
  roundLevel: $('#roundLevel'), roundMessage: $('#roundMessage'), typingArea: $('#typingArea'), themeToggle: $('#themeToggle'),
  hintToggle: $('#hintToggle'), phoneNotice: $('#phoneNotice'), toast: $('#toast')
};

const state = {
  level: null, sentences: [], lineIndex: 0, typed: '', startedAt: null, deadline: null,
  timerId: null, finished: false, errors: 0, totalTyped: 0, correctChars: 0, completedLines: 0,
  pressedCodes: new Set(), flashTimers: new Map(), keyElements: new Map(), hintsEnabled: true,
  theme: 'light', newBest: false, roundDuration: 60, usedTime: 0
};

const KEY_ROWS = [
  [ ['Escape','Esc',1], ['Digit1','1',1], ['Digit2','2',1], ['Digit3','3',1], ['Digit4','4',1], ['Digit5','5',1], ['Digit6','6',1], ['Digit7','7',1], ['Digit8','8',1], ['Digit9','9',1], ['Digit0','0',1], ['Minus','-',1], ['Equal','=',1], ['Backspace','Backspace',2] ],
  [ ['Tab','Tab',1.5], ['KeyQ','Q',1], ['KeyW','W',1], ['KeyE','E',1], ['KeyR','R',1], ['KeyT','T',1], ['KeyY','Y',1], ['KeyU','U',1], ['KeyI','I',1], ['KeyO','O',1], ['KeyP','P',1], ['BracketLeft','[',1], ['BracketRight',']',1], ['Backslash','\\',1.5] ],
  [ ['CapsLock','Caps',1.75], ['KeyA','A',1], ['KeyS','S',1], ['KeyD','D',1], ['KeyF','F',1], ['KeyG','G',1], ['KeyH','H',1], ['KeyJ','J',1], ['KeyK','K',1], ['KeyL','L',1], ['Semicolon',';',1], ['Quote',"'",1], ['Enter','Enter',2.25] ],
  [ ['ShiftLeft','Shift',2.25], ['KeyZ','Z',1], ['KeyX','X',1], ['KeyC','C',1], ['KeyV','V',1], ['KeyB','B',1], ['KeyN','N',1], ['KeyM','M',1], ['Comma',',',1], ['Period','.',1], ['Slash','/',1], ['ShiftRight','Shift',2.75] ],
  [ ['ControlLeft','Ctrl',1.25], ['MetaLeft','Win',1.15], ['AltLeft','Alt',1.15], ['Space','',6.25], ['AltRight','Alt',1.15], ['Fn','Fn',1], ['ContextMenu','Menu',1], ['ControlRight','Ctrl',1.25] ]
];

function safeGet(key, fallback = null) { try { const value = localStorage.getItem(key); return value === null ? fallback : value; } catch { return fallback; } }
function safeSet(key, value) { try { localStorage.setItem(key, String(value)); } catch { /* Private browsing or storage restrictions: app still works. */ } }
function shuffle(items) { const copy = [...items]; for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; } return copy; }
function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function getBest(level) { const value = Number(safeGet(`typeflow-best-${level}`, '0')); return Number.isFinite(value) ? value : 0; }
function getElapsedSeconds() { if (!state.startedAt) return 0; return Math.min(state.roundDuration, Math.max(0, (performance.now() - state.startedAt) / 1000)); }
function getWpm() { const minutes = getElapsedSeconds() / 60; return minutes > 0 ? Math.round((state.correctChars / 5) / minutes) : 0; }
function getAccuracy() { return state.totalTyped > 0 ? Math.round((state.correctChars / state.totalTyped) * 100) : 100; }
function showScreen(screen) { [els.levelScreen, els.typingScreen, els.resultsScreen].forEach((node) => { node.hidden = node !== screen; }); }

function init() {
  initTheme();
  state.hintsEnabled = safeGet('typeflow-hints', 'true') !== 'false';
  if (els.hintToggle) els.hintToggle.checked = state.hintsEnabled;
  // The on-screen keyboard is the supplied photo, not generated individual key elements.
  buildKeyboard();
  bindEvents();
  const savedLevel = safeGet('typeflow-level', 'beginner');
  selectLevelCard(LEVEL_META[savedLevel] ? savedLevel : 'beginner');
  checkKeyboardSupport();
}

function initTheme() {
  // TypeFlow's requested default is the light beige theme; the toggle can still switch to dark.
  state.theme = 'light';
  safeSet('typeflow-theme', 'light');
  applyTheme();
}
function applyTheme() { document.documentElement.dataset.theme = state.theme; els.themeToggle.textContent = state.theme === 'dark' ? '☼' : '◐'; els.themeToggle.setAttribute('aria-label', state.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'); }
function checkKeyboardSupport() {
  const isSmallTouch = window.matchMedia && window.matchMedia('(max-width: 520px) and (hover: none) and (pointer: coarse)').matches;
  if (isSmallTouch) { els.phoneNotice.hidden = false; els.levelScreen.hidden = true; els.typingScreen.hidden = true; els.resultsScreen.hidden = true; els.keyboardDock.hidden = true; }
}
function selectLevelCard(level) {
  document.querySelectorAll('.level-card').forEach((card) => { const selected = card.dataset.level === level; card.classList.toggle('selected', selected); card.setAttribute('aria-pressed', String(selected)); });
}
function bindEvents() {
  // Bind each card directly so selection always works even if nested markup changes.
  document.querySelectorAll('.level-card[data-level]').forEach((card) => {
    card.addEventListener('click', () => startRound(card.dataset.level));
  });
  // Delegated fallback supports cards added dynamically later.
  els.levelGrid.addEventListener('click', (event) => { const card = event.target.closest('.level-card[data-level]'); if (card && !event.target.closest('button')) startRound(card.dataset.level); });
  els.themeToggle.addEventListener('click', () => { state.theme = state.theme === 'dark' ? 'light' : 'dark'; safeSet('typeflow-theme', state.theme); applyTheme(); });
  if (els.hintToggle) els.hintToggle.addEventListener('change', () => { state.hintsEnabled = els.hintToggle.checked; safeSet('typeflow-hints', state.hintsEnabled); renderKeyboardHints(); });
  $('#restartButton').addEventListener('click', () => startRound(state.level));
  $('#backButton').addEventListener('click', showLevels);
  $('#tryAgainButton').addEventListener('click', () => startRound(state.level));
  $('#changeLevelButton').addEventListener('click', showLevels);
  $('#brandHome').addEventListener('click', (event) => { event.preventDefault(); showLevels(); });
  document.addEventListener('keydown', handleKeyDown, true);
  document.addEventListener('keyup', handleKeyUp, true);
  window.addEventListener('blur', handleWindowBlur);
  window.addEventListener('focus', handleWindowFocus);
  window.addEventListener('resize', checkKeyboardSupport);
  document.addEventListener('visibilitychange', () => { if (document.hidden && state.startedAt && !state.finished) pauseRoundForFocus(); });
}

function startRound(level) {
  if (!LEVEL_META[level]) return;
  clearTimer(); clearFlashTimers();
  state.level = level; state.sentences = shuffle(SENTENCE_BANKS[level]).slice(0, CONFIG.linesPerRound);
  state.lineIndex = 0; state.typed = ''; state.startedAt = null; state.deadline = null; state.finished = false;
  state.errors = 0; state.totalTyped = 0; state.correctChars = 0; state.completedLines = 0; state.pressedCodes.clear(); state.newBest = false; state.usedTime = 0;
  state.roundDuration = CONFIG.durations[level];
  safeSet('typeflow-level', level); selectLevelCard(level);
  els.roundLevel.textContent = LEVEL_META[level].name;
  els.roundMessage.textContent = 'Start typing to begin the timer.';
  els.keyboardDock.hidden = false; els.phoneNotice.hidden = true;
  showScreen(els.typingScreen); renderSentences(); renderStats(); renderKeyboardHints(); updateKeyboardPressed();
  els.typingArea.focus({ preventScroll: true });
}
function showLevels() { clearTimer(); state.finished = true; clearFlashTimers(); els.keyboardDock.hidden = true; showScreen(els.levelScreen); selectLevelCard(state.level || safeGet('typeflow-level', 'beginner')); }

function renderSentences() {
  els.sentenceList.replaceChildren();
  state.sentences.forEach((sentence, index) => {
    const line = document.createElement('div'); line.className = `sentence-line ${index < state.lineIndex ? 'completed' : index === state.lineIndex ? 'active' : 'upcoming'}`; line.dataset.line = String(index); line.setAttribute('aria-label', sentence);
    if (index < state.lineIndex) { line.textContent = sentence; }
    else if (index > state.lineIndex) { line.textContent = sentence; }
    else { renderActiveLine(line, sentence); }
    els.sentenceList.append(line);
  });
}
function renderActiveLine(line, sentence) {
  line.replaceChildren();
  for (let i = 0; i < sentence.length; i++) {
    const span = document.createElement('span'); span.className = 'char'; span.textContent = sentence[i] === ' ' ? '\u00a0' : sentence[i];
    if (i < state.typed.length) span.classList.add(state.typed[i] === sentence[i] ? 'correct' : 'incorrect');
    if (i === state.typed.length) { span.classList.add('current'); if (sentence[i] === ' ') span.classList.add('current-space'); }
    line.append(span);
  }
  if (state.typed.length >= sentence.length) { const caret = document.createElement('span'); caret.className = 'char current'; caret.textContent = ' '; line.append(caret); }
}
function refreshActiveLine() {
  const line = els.sentenceList.querySelector(`[data-line="${state.lineIndex}"]`);
  if (line) renderActiveLine(line, state.sentences[state.lineIndex]);
  renderKeyboardHints();
}

function handleKeyDown(event) {
  const code = event.code || '';
  if (code) { state.pressedCodes.add(code); updateKeyboardPressed(); }
  if (els.typingScreen.hidden) {
    if (!event.repeat && ['Digit1','Digit2','Digit3','Digit4'].includes(code) && !els.resultsScreen.hidden) return;
    if (!event.repeat && !els.levelScreen.hidden && ['Digit1','Digit2','Digit3','Digit4'].includes(code)) { event.preventDefault(); startRound(CONFIG.levels[Number(code.slice(-1)) - 1]); }
    return;
  }
  if (state.finished) return;
  // While a round is active, reserve Escape for restart and suppress browser shortcuts used by typing.
  if (['Space','Tab','Backspace','Quote','Slash','Escape'].includes(code)) event.preventDefault();
  if (code === 'Escape') { if (!event.repeat) startRound(state.level); return; }
  if (event.repeat) return;
  if (code === 'Enter' && event.shiftKey) return;
  if (code === 'Tab' && event.shiftKey) return;
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (['ShiftLeft','ShiftRight','ControlLeft','ControlRight','AltLeft','AltRight','MetaLeft','MetaRight','CapsLock','Fn','ContextMenu'].includes(code)) return;
  if (code === 'Backspace') { handleBackspace(); return; }
  if (code === 'Tab') { if (state.startedAt) { showToast('Use Restart to begin a fresh round.'); } return; }
  if (code === 'Enter') { scoreCharacter('\n', code); return; }
  // Prefer the browser's actual character so Shift, Caps Lock, and keyboard layouts work.
  // event.code remains the physical-key identifier for shortcuts and the keyboard reference.
  const char = (typeof event.key === 'string' && event.key.length === 1)
    ? event.key
    : keyCodeToCharacter(code, event.shiftKey);
  if (char !== null) scoreCharacter(char, code);
}
function handleKeyUp(event) { state.pressedCodes.delete(event.code); updateKeyboardPressed(); }
function handleWindowBlur() { state.pressedCodes.clear(); updateKeyboardPressed(); }
function handleWindowFocus() {
  state.pressedCodes.clear(); updateKeyboardPressed();
  // If the page regained focus while a round was running, resume UI ticks against the original deadline.
  if (state.startedAt && !state.finished && state.deadline && state.timerId === null) {
    if (Date.now() >= state.deadline) finishRound('time');
    else state.timerId = setInterval(tickTimer, 100);
  }
}
function pauseRoundForFocus() {
  // Keep the deadline honest when focus returns, but stop an orphaned interval while hidden.
  if (state.timerId) { clearInterval(state.timerId); state.timerId = null; }
  if (state.deadline && Date.now() >= state.deadline) finishRound('time');
}
function keyCodeToCharacter(code, shifted) {
  const map = {
    Space: ' ', Backquote: shifted ? '~' : '`', Minus: shifted ? '_' : '-', Equal: shifted ? '+' : '=', BracketLeft: shifted ? '{' : '[', BracketRight: shifted ? '}' : ']', Backslash: shifted ? '|' : '\\',
    Semicolon: shifted ? ':' : ';', Quote: shifted ? '"' : "'", Comma: shifted ? '<' : ',', Period: shifted ? '>' : '.', Slash: shifted ? '?' : '/',
    Digit1: shifted ? '!' : '1', Digit2: shifted ? '@' : '2', Digit3: shifted ? '#' : '3', Digit4: shifted ? '$' : '4', Digit5: shifted ? '%' : '5', Digit6: shifted ? '^' : '6', Digit7: shifted ? '&' : '7', Digit8: shifted ? '*' : '8', Digit9: shifted ? '(' : '9', Digit0: shifted ? ')' : '0'
  };
  if (Object.prototype.hasOwnProperty.call(map, code)) return map[code];
  if (/^Key[A-Z]$/.test(code)) return shifted ? code.slice(3) : code.slice(3).toLowerCase();
  return null;
}
function normalizeTypedCharacter(char) {
  // Map typographic punctuation in the sentence bank to keys available on a standard keyboard.
  const equivalents = {
    '’': "'", '‘': "'", '“': '"', '”': '"',
    '–': '-', '—': '-', '−': '-', '…': '.',
    '²': '2', '°': '°', '≠': '!=', '≥': '>=', '≤': '<=', '×': '*', '÷': '/'
  };
  return equivalents[char] ?? char;
}

function shakeActiveSentence() {
  const line = els.sentenceList.querySelector('.sentence-line.active');
  if (!line) return;
  // Restart the 2-second shake on every incorrect key without changing typing state.
  line.classList.remove('wrong-shake');
  void line.offsetWidth;
  line.classList.add('wrong-shake');
  if (line._shakeTimer) clearTimeout(line._shakeTimer);
  line._shakeTimer = setTimeout(() => line.classList.remove('wrong-shake'), 2000);
}

function scoreCharacter(char, code) {
  if (state.finished) return;
  if (!state.startedAt) startTimer();
  if (state.finished) return;
  const sentence = state.sentences[state.lineIndex];
  if (char === '\n') { flashKey(code, false); state.errors++; state.totalTyped++; shakeActiveSentence(); renderStats(); return; }
  const position = state.typed.length;
  if (position >= sentence.length) return;
  state.totalTyped++;
  if (normalizeTypedCharacter(char) === normalizeTypedCharacter(sentence[position])) {
    // Store the target character, not the physical input glyph, so progress stays consistent.
    state.typed += sentence[position]; state.correctChars++; flashKey(code, true);
  } else {
    // Wrong keys count as errors but do NOT advance the caret or fill the sentence.
    state.errors++; flashKey(code, false);
    shakeActiveSentence();
    refreshActiveLine(); renderStats();
    els.roundMessage.textContent = 'That key was incorrect. Try the highlighted character again.';
    if (state.deadline && Date.now() >= state.deadline) finishRound('time');
    return;
  }
  // Strict progression: only correct characters advance; mistakes must be corrected by retrying.
  if (state.typed.length === sentence.length && state.typed === sentence) {
    state.completedLines++; state.lineIndex++; state.typed = '';
    if (state.lineIndex >= state.sentences.length) { renderSentences(); renderStats(); finishRound('complete'); return; }
    renderSentences();
    els.roundMessage.textContent = 'Line complete. Keep going.';
  } else {
    refreshActiveLine();
    els.roundMessage.textContent = state.typed.length ? 'Keep going — accuracy first.' : 'Start typing to begin the timer.';
  }
  renderStats();
  if (state.deadline && Date.now() >= state.deadline) finishRound('time');
}
function handleBackspace() {
  if (!state.typed.length || state.finished) return;
  const removed = state.typed.slice(-1);
  // Removing a correct character removes it from the correct-character count; errors remain cumulative attempts.
  if (removed === state.sentences[state.lineIndex][state.typed.length - 1]) state.correctChars = Math.max(0, state.correctChars - 1);
  state.typed = state.typed.slice(0, -1);
  refreshActiveLine(); renderStats();
}
function startTimer() {
  state.startedAt = performance.now(); state.deadline = Date.now() + state.roundDuration * 1000;
  els.roundMessage.textContent = 'Timer running. Stay in the flow.';
  clearTimer(); state.timerId = setInterval(tickTimer, 100);
}
function tickTimer() {
  if (state.finished) return;
  const remaining = Math.max(0, (state.deadline - Date.now()) / 1000);
  els.timerValue.innerHTML = `${Math.ceil(remaining)}<span>s</span>`;
  renderStats();
  if (remaining <= 0) finishRound('time');
}
function clearTimer() { if (state.timerId !== null) { clearInterval(state.timerId); state.timerId = null; } }
function renderStats() {
  els.wpmValue.textContent = String(getWpm()); els.accuracyValue.innerHTML = `${getAccuracy()}<span>%</span>`;
  const elapsed = getElapsedSeconds();
  const remaining = state.startedAt ? Math.max(0, state.roundDuration - elapsed) : state.roundDuration;
  els.timerValue.innerHTML = `${Math.ceil(remaining)}<span>s</span>`;
  els.progressBar.style.width = `${clamp((state.completedLines / CONFIG.linesPerRound) * 100, 0, 100)}%`;
}
function finishRound(reason) {
  if (state.finished) return;
  state.finished = true; clearTimer(); clearFlashTimers(); state.usedTime = state.startedAt ? Math.min(state.roundDuration, Math.max(0, getElapsedSeconds())) : 0;
  const finalWpm = state.usedTime > 0 ? Math.round((state.correctChars / 5) / (state.usedTime / 60)) : 0;
  const previousBest = getBest(state.level);
  state.newBest = finalWpm > previousBest;
  if (state.newBest) safeSet(`typeflow-best-${state.level}`, finalWpm);
  $('#finalWpm').textContent = String(finalWpm);
  $('#finalAccuracy').textContent = `${getAccuracy()}%`;
  $('#finalErrors').textContent = String(state.errors);
  $('#finalTime').textContent = `${Math.round(state.usedTime * 10) / 10}s`;
  $('#finalLines').textContent = `${state.completedLines} / ${CONFIG.linesPerRound}`;
  $('#bestLevelName').textContent = LEVEL_META[state.level].name;
  $('#bestWpm').textContent = `${Math.max(previousBest, finalWpm)} WPM`;
  $('#newBestLabel').hidden = !state.newBest;
  $('#resultsHeading').textContent = reason === 'complete' ? 'Nice work.' : 'Time is up.';
  $('#resultSubheading').textContent = reason === 'complete' ? 'You completed all four lines. Keep that rhythm going.' : 'A little practice goes a long way. Give it another round.';
  els.keyboardDock.hidden = true; showScreen(els.resultsScreen);
}

function buildKeyboard() {
  els.keyboard.replaceChildren(); state.keyElements.clear();
  KEY_ROWS.forEach((row) => {
    const rowNode = document.createElement('div'); rowNode.className = 'key-row';
    row.forEach(([code, label, width]) => {
      const key = document.createElement('div'); key.className = 'key'; key.dataset.code = code; key.style.setProperty('--u', width);
      if (width >= 1.5 || ['CapsLock','Enter','ShiftLeft','ShiftRight','ControlLeft','ControlRight','AltLeft','AltRight','MetaLeft','ContextMenu','Space','Backspace','Tab'].includes(code)) key.classList.add('wide');
      if (code === 'Space') key.classList.add('space-key');
      key.textContent = label; key.setAttribute('aria-hidden', 'true'); rowNode.append(key); state.keyElements.set(code, key);
    });
    els.keyboard.append(rowNode);
  });
}
function updateKeyboardPressed() {
  state.keyElements.forEach((element, code) => element.classList.toggle('pressed', state.pressedCodes.has(code)));
}
function flashKey(code, correct) {
  const element = state.keyElements.get(code); if (!element) return;
  element.classList.remove('flash-correct','flash-wrong'); void element.offsetWidth;
  element.classList.add(correct ? 'flash-correct' : 'flash-wrong');
  const oldTimer = state.flashTimers.get(code); if (oldTimer) clearTimeout(oldTimer);
  const timer = setTimeout(() => { element.classList.remove('flash-correct','flash-wrong'); state.flashTimers.delete(code); }, 230);
  state.flashTimers.set(code, timer);
}
function clearFlashTimers() { state.flashTimers.forEach((timer) => clearTimeout(timer)); state.flashTimers.clear(); state.keyElements.forEach((element) => element.classList.remove('flash-correct','flash-wrong','pressed','expected','expected-shift')); }
function getExpectedKey() {
  if (state.finished || !state.sentences.length || state.lineIndex >= state.sentences.length) return null;
  const char = state.sentences[state.lineIndex][state.typed.length];
  if (char === undefined) return null;
  const shifted = /[A-Z!@#$%^&*()_+{}|:"<>?~]/.test(char);
  let code = null;
  if (char === ' ') code = 'Space';
  else if (/^[a-z]$/i.test(char)) code = `Key${char.toUpperCase()}`;
  else {
    const unshiftedMap = { '`':'Backquote','~':'Backquote','-':'Minus','_':'Minus','=':'Equal','+':'Equal','[':'BracketLeft','{':'BracketLeft',']':'BracketRight','}':'BracketRight','\\':'Backslash','|':'Backslash',';':'Semicolon',':':'Semicolon',"'":'Quote','"':'Quote',',':'Comma','<':'Comma','.':'Period','>':'Period','/':'Slash','?':'Slash','!':'Digit1','@':'Digit2','#':'Digit3','$':'Digit4','%':'Digit5','^':'Digit6','&':'Digit7','*':'Digit8','(':'Digit9',')':'Digit0'};
    code = unshiftedMap[char] || (/^\d$/.test(char) ? `Digit${char}` : null);
  }
  return { code, shifted };
}
function renderKeyboardHints() {
  // Hints are drawn directly on the live keyboard keys.
  state.keyElements.forEach((element) => element.classList.remove('expected','expected-shift'));
  if (!state.hintsEnabled || els.typingScreen.hidden || state.finished) return;
  const expected = getExpectedKey(); if (!expected) return;
  if (expected.code && state.keyElements.has(expected.code)) state.keyElements.get(expected.code).classList.add('expected');
  if (expected.shifted) { const shiftCode = state.pressedCodes.has('ShiftRight') ? 'ShiftRight' : 'ShiftLeft'; const shift = state.keyElements.get(shiftCode); if (shift) shift.classList.add('expected-shift'); }
}
function showToast(message) { els.toast.textContent = message; els.toast.classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => els.toast.classList.remove('show'), 1600); }

// Initial selection shortcut handling is included in the global keydown listener.
init();
