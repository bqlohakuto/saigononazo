(function () {
  "use strict";

  const Logic = window.MastermindLogic;
  const STORAGE_KEY = "saigononazo-mastermind-test-v1";
  const STATS_KEY = "saigononazo-mastermind-stats-v1";
  const HINT_AFTER = 5;
  const DIFFICULTIES = Object.freeze({
    easy: Object.freeze({ id: "easy", label: "やさしい 4×2", symbolCount: 4, maxAttempts: 6 }),
    normal: Object.freeze({ id: "normal", label: "ふつう 5×2", symbolCount: 5, maxAttempts: 8 })
  });
  const symbolById = new Map(Logic.SYMBOLS.map(symbol => [symbol.id, symbol]));
  const colorById = new Map(Logic.COLORS.map(color => [color.id, color]));

  const elements = {
    attemptCount: document.getElementById("attempt-count"),
    remainingCount: document.getElementById("remaining-count"),
    bestCount: document.getElementById("best-count"),
    instruction: document.getElementById("instruction-text"),
    difficultyButtons: [...document.querySelectorAll("[data-difficulty]")],
    slots: document.getElementById("answer-slots"),
    palette: document.getElementById("token-palette"),
    message: document.getElementById("message"),
    submit: document.getElementById("submit-button"),
    clear: document.getElementById("clear-button"),
    hintPanel: document.getElementById("hint-panel"),
    hintText: document.getElementById("hint-text"),
    historyList: document.getElementById("history-list"),
    historyEmpty: document.getElementById("history-empty"),
    resultPanel: document.getElementById("result-panel"),
    resultKicker: document.getElementById("result-kicker"),
    resultTitle: document.getElementById("result-title"),
    resultMessage: document.getElementById("result-message"),
    secretAnswer: document.getElementById("secret-answer"),
    clearRecord: document.getElementById("clear-record"),
    resultAttempts: document.getElementById("result-attempts"),
    resultRemaining: document.getElementById("result-remaining"),
    resultBest: document.getElementById("result-best"),
    xShare: document.getElementById("x-share-button"),
    retry: document.getElementById("retry-button"),
    reset: document.getElementById("reset-button")
  };

  let state = loadState();
  let stats = loadStats(state.difficulty);
  let currentGuess = [];
  let selectedSlot = null;

  function secureRandom() {
    if (!window.crypto?.getRandomValues) return Math.random();
    const values = new Uint32Array(1);
    window.crypto.getRandomValues(values);
    return values[0] / 4294967296;
  }

  function config() {
    return DIFFICULTIES[state?.difficulty] || DIFFICULTIES.normal;
  }

  function freshState(difficulty = "normal") {
    const selected = DIFFICULTIES[difficulty] || DIFFICULTIES.normal;
    return {
      difficulty: selected.id,
      secret: Logic.randomCode(secureRandom, selected.symbolCount),
      history: [],
      completed: false,
      revealed: false,
      clearRecorded: false,
      leftmostHintRevealed: false
    };
  }

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      const difficulty = DIFFICULTIES[parsed?.difficulty] ? parsed.difficulty : "normal";
      const selected = DIFFICULTIES[difficulty];
      const historyIsValid = Array.isArray(parsed?.history) && parsed.history.every(entry => (
        Logic.isValidCode(entry?.guess, selected.symbolCount)
        && Number.isInteger(entry?.feedback?.exact)
        && Number.isInteger(entry?.feedback?.misplaced)
      ));
      if (!Logic.isValidCode(parsed?.secret, selected.symbolCount) || !historyIsValid || parsed.history.length > selected.maxAttempts) {
        return freshState(difficulty);
      }
      return {
        difficulty,
        secret: Logic.cloneCode(parsed.secret),
        history: parsed.history.map(entry => ({
          guess: Logic.cloneCode(entry.guess),
          feedback: { exact: entry.feedback.exact, misplaced: entry.feedback.misplaced }
        })),
        completed: Boolean(parsed.completed),
        revealed: Boolean(parsed.revealed),
        clearRecorded: Boolean(parsed.clearRecorded),
        leftmostHintRevealed: Boolean(parsed.leftmostHintRevealed)
      };
    } catch (_error) {
      return freshState("normal");
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function loadStats(difficulty) {
    try {
      const difficultyKey = `${STATS_KEY}-${difficulty}`;
      const saved = localStorage.getItem(difficultyKey);
      const legacy = difficulty === "normal" ? localStorage.getItem(STATS_KEY) : null;
      const parsed = JSON.parse(saved || legacy);
      const selected = DIFFICULTIES[difficulty];
      return {
        clearCount: Number.isInteger(parsed?.clearCount) && parsed.clearCount >= 0 ? parsed.clearCount : 0,
        bestAttempts: Number.isInteger(parsed?.bestAttempts) && parsed.bestAttempts >= 1 && parsed.bestAttempts <= selected.maxAttempts ? parsed.bestAttempts : null,
        latestAttempts: Number.isInteger(parsed?.latestAttempts) ? parsed.latestAttempts : null,
        latestRemaining: Number.isInteger(parsed?.latestRemaining) ? parsed.latestRemaining : null
      };
    } catch (_error) {
      return { clearCount: 0, bestAttempts: null, latestAttempts: null, latestRemaining: null };
    }
  }

  function saveStats() {
    localStorage.setItem(`${STATS_KEY}-${state.difficulty}`, JSON.stringify(stats));
  }

  function recordClear() {
    if (!state.completed || state.clearRecorded) return;
    const attempts = state.history.length;
    stats = Logic.updateStats(stats, attempts, config().maxAttempts);
    state.clearRecorded = true;
    saveStats();
    saveState();
  }

  function shareUrl(attempts) {
    const text = Logic.shareText(attempts, config().maxAttempts, config().label);
    const gameUrl = new URL("./", window.location.href).href;
    const query = new URLSearchParams({ text, url: gameUrl });
    return `https://twitter.com/intent/tweet?${query.toString()}`;
  }

  function tokenText(token) {
    return `${colorById.get(token.color).label}${symbolById.get(token.symbol).mark}`;
  }

  function createToken(token, compact = false) {
    const chip = document.createElement("span");
    chip.className = `token token-${token.color}${compact ? " token-compact" : ""}`;
    chip.textContent = symbolById.get(token.symbol).mark;
    chip.setAttribute("aria-label", tokenText(token));
    chip.title = tokenText(token);
    if (!compact) {
      const label = document.createElement("small");
      label.textContent = colorById.get(token.color).label;
      chip.appendChild(label);
    }
    return chip;
  }

  function setMessage(text, type = "") {
    elements.message.textContent = text;
    elements.message.className = `message${type ? ` message-${type}` : ""}`;
  }

  function chooseToken(token) {
    if (state.completed || state.revealed) return;
    const existingIndex = currentGuess.findIndex(item => item.symbol === token.symbol);
    if (existingIndex >= 0) {
      if (currentGuess[existingIndex].color === token.color) currentGuess.splice(existingIndex, 1);
      else currentGuess[existingIndex] = token;
    } else if (currentGuess.length < config().symbolCount) {
      currentGuess.push(token);
    }
    selectedSlot = null;
    setMessage("");
    renderGuess();
    renderPalette();
  }

  function selectSlot(index) {
    if (!currentGuess[index] || state.completed || state.revealed) return;
    if (selectedSlot === null) {
      selectedSlot = index;
      setMessage("入れ替えるもう1つの枠をタップしてください。");
    } else if (selectedSlot === index) {
      selectedSlot = null;
      setMessage("");
    } else {
      [currentGuess[selectedSlot], currentGuess[index]] = [currentGuess[index], currentGuess[selectedSlot]];
      selectedSlot = null;
      setMessage("並びを入れ替えました。", "success");
    }
    renderGuess();
  }

  function renderGuess() {
    elements.slots.replaceChildren();
    elements.slots.style.setProperty("--slot-count", config().symbolCount);
    for (let index = 0; index < config().symbolCount; index += 1) {
      const slot = document.createElement("button");
      slot.type = "button";
      slot.className = `answer-slot${selectedSlot === index ? " is-selected" : ""}`;
      slot.setAttribute("aria-label", currentGuess[index] ? `${index + 1}番目、${tokenText(currentGuess[index])}` : `${index + 1}番目、空`);
      if (currentGuess[index]) slot.appendChild(createToken(currentGuess[index]));
      else slot.innerHTML = `<span class="slot-number">${index + 1}</span>`;
      slot.addEventListener("click", () => selectSlot(index));
      elements.slots.appendChild(slot);
    }
    elements.submit.disabled = currentGuess.length !== config().symbolCount || state.completed || state.revealed;
    elements.clear.disabled = currentGuess.length === 0 || state.completed || state.revealed;
  }

  function renderPalette() {
    elements.palette.replaceChildren();
    elements.palette.style.setProperty("--slot-count", config().symbolCount);
    Logic.COLORS.forEach(color => {
      Logic.activeSymbols(config().symbolCount).forEach(symbol => {
        const token = { symbol: symbol.id, color: color.id };
        const selected = currentGuess.some(item => Logic.tokenKey(item) === Logic.tokenKey(token));
        const button = document.createElement("button");
        button.type = "button";
        button.className = `palette-token${selected ? " is-active" : ""}`;
        button.disabled = state.completed || state.revealed;
        button.setAttribute("aria-pressed", String(selected));
        button.setAttribute("aria-label", tokenText(token));
        button.appendChild(createToken(token));
        button.addEventListener("click", () => chooseToken(token));
        elements.palette.appendChild(button);
      });
    });
  }

  function renderHistory() {
    elements.historyList.replaceChildren();
    elements.historyEmpty.hidden = state.history.length > 0;
    state.history.forEach((entry, index) => {
      const item = document.createElement("li");
      const number = document.createElement("span");
      number.className = "history-number";
      number.textContent = String(index + 1);
      const tokens = document.createElement("div");
      tokens.className = "history-tokens";
      entry.guess.forEach(token => tokens.appendChild(createToken(token, true)));
      const feedback = document.createElement("div");
      feedback.className = "feedback";
      feedback.setAttribute("aria-label", `位置まで正解${entry.feedback.exact}、駒だけ正解${entry.feedback.misplaced}`);
      feedback.innerHTML = `<span>● ${entry.feedback.exact}</span><span>○ ${entry.feedback.misplaced}</span>`;
      item.append(number, tokens, feedback);
      elements.historyList.appendChild(item);
    });
  }

  function renderHint() {
    elements.hintPanel.hidden = !state.leftmostHintRevealed || state.completed || state.revealed;
    elements.hintText.textContent = state.leftmostHintRevealed
      ? `${config().symbolCount}種類すべての色が一致しました。左端の記号は「${symbolById.get(state.secret[0].symbol).mark}」です。`
      : "";
  }

  function renderSecret() {
    elements.secretAnswer.replaceChildren();
    elements.secretAnswer.style.setProperty("--slot-count", config().symbolCount);
    state.secret.forEach(token => elements.secretAnswer.appendChild(createToken(token)));
  }

  function renderResult() {
    elements.resultPanel.hidden = !state.completed && !state.revealed;
    elements.clearRecord.hidden = !state.completed;
    elements.xShare.hidden = !state.completed;
    if (state.completed) {
      const attempts = state.history.length;
      const remaining = config().maxAttempts - attempts;
      elements.resultKicker.textContent = "CLEAR";
      elements.resultTitle.textContent = "いろしるパズル クリア！";
      elements.resultMessage.textContent = `${attempts}回の試行で正解しました。`;
      elements.resultAttempts.textContent = `${attempts}回`;
      elements.resultRemaining.textContent = `${remaining}手`;
      elements.resultBest.textContent = `${stats.bestAttempts}回`;
      elements.xShare.href = shareUrl(attempts);
      elements.retry.textContent = "別の問題を試す";
    } else if (state.revealed) {
      elements.resultKicker.textContent = "ANSWER";
      elements.resultTitle.textContent = `${config().maxAttempts}回使い切りました`;
      elements.resultMessage.textContent = "今回の正解です。確認したら、新しい問題へ挑戦できます。";
      elements.retry.textContent = "新しい問題に挑戦";
    }
    if (!elements.resultPanel.hidden) renderSecret();
  }

  function renderStatus() {
    const attempts = state.history.length;
    elements.attemptCount.textContent = `${attempts} / ${config().maxAttempts}`;
    elements.remainingCount.textContent = `${config().maxAttempts - attempts}回`;
    elements.bestCount.textContent = stats.bestAttempts === null ? "--" : `${stats.bestAttempts}回`;
  }

  function renderDifficulty() {
    elements.instruction.textContent = `${config().symbolCount}つの記号を1個ずつ使い、色と順番を当ててください。`;
    elements.difficultyButtons.forEach(button => {
      const active = button.dataset.difficulty === state.difficulty;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function render() {
    renderDifficulty();
    renderStatus();
    renderGuess();
    renderPalette();
    renderHistory();
    renderHint();
    renderResult();
  }

  function submitGuess() {
    if (!Logic.isValidCode(currentGuess, config().symbolCount)) {
      setMessage(`${config().symbolCount}種類の記号を1個ずつ選んでください。`, "error");
      return;
    }
    if (state.history.some(entry => entry.guess.every((token, index) => Logic.tokenKey(token) === Logic.tokenKey(currentGuess[index])))) {
      setMessage("同じ並びはすでに回答しています。", "error");
      return;
    }
    const guess = Logic.cloneCode(currentGuess);
    const feedback = Logic.score(state.secret, guess);
    state.history.push({ guess, feedback });
    currentGuess = [];
    selectedSlot = null;

    if (Logic.shouldRevealLeftmost(state.history.length, feedback, config().symbolCount, HINT_AFTER)) {
      state.leftmostHintRevealed = true;
    }

    if (feedback.exact === config().symbolCount) {
      state.completed = true;
      recordClear();
    }
    else if (state.history.length >= config().maxAttempts) state.revealed = true;

    saveState();
    setMessage(feedback.exact === config().symbolCount ? `${config().symbolCount}個すべて正解です。` : `● ${feedback.exact}　○ ${feedback.misplaced}`, feedback.exact === config().symbolCount ? "success" : "");
    render();
    if (state.completed || state.revealed) elements.resultPanel.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function startNewGame() {
    state = freshState(state.difficulty);
    currentGuess = [];
    selectedSlot = null;
    saveState();
    setMessage("新しい問題を開始しました。", "success");
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function selectDifficulty(difficulty) {
    if (!DIFFICULTIES[difficulty] || difficulty === state.difficulty) return;
    state = freshState(difficulty);
    stats = loadStats(difficulty);
    currentGuess = [];
    selectedSlot = null;
    saveState();
    setMessage(`${config().label}を開始しました。`, "success");
    render();
  }

  elements.submit.addEventListener("click", submitGuess);
  elements.clear.addEventListener("click", () => {
    currentGuess = [];
    selectedSlot = null;
    setMessage("");
    renderGuess();
    renderPalette();
  });
  elements.difficultyButtons.forEach(button => button.addEventListener("click", () => selectDifficulty(button.dataset.difficulty)));
  elements.retry.addEventListener("click", startNewGame);
  elements.reset.addEventListener("click", startNewGame);

  if (state.completed && !state.clearRecorded) recordClear();
  render();
})();
