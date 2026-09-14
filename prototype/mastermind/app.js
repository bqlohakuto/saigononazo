(function () {
  "use strict";

  const Logic = window.MastermindLogic;
  const STORAGE_KEY = "saigononazo-mastermind-test-v1";
  const MAX_ATTEMPTS = 8;
  const HINT_AFTER = 5;
  const symbolById = new Map(Logic.SYMBOLS.map(symbol => [symbol.id, symbol]));
  const colorById = new Map(Logic.COLORS.map(color => [color.id, color]));

  const elements = {
    attemptCount: document.getElementById("attempt-count"),
    remainingCount: document.getElementById("remaining-count"),
    slots: document.getElementById("answer-slots"),
    palette: document.getElementById("token-palette"),
    message: document.getElementById("message"),
    submit: document.getElementById("submit-button"),
    clear: document.getElementById("clear-button"),
    hintPanel: document.getElementById("hint-panel"),
    hintButton: document.getElementById("hint-button"),
    hintText: document.getElementById("hint-text"),
    historyList: document.getElementById("history-list"),
    historyEmpty: document.getElementById("history-empty"),
    resultPanel: document.getElementById("result-panel"),
    resultKicker: document.getElementById("result-kicker"),
    resultTitle: document.getElementById("result-title"),
    resultMessage: document.getElementById("result-message"),
    secretAnswer: document.getElementById("secret-answer"),
    retry: document.getElementById("retry-button"),
    reset: document.getElementById("reset-button")
  };

  let state = loadState();
  let currentGuess = [];
  let selectedSlot = null;

  function secureRandom() {
    if (!window.crypto?.getRandomValues) return Math.random();
    const values = new Uint32Array(1);
    window.crypto.getRandomValues(values);
    return values[0] / 4294967296;
  }

  function freshState() {
    return {
      secret: Logic.randomCode(secureRandom),
      history: [],
      hintUsed: false,
      completed: false,
      revealed: false
    };
  }

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      const historyIsValid = Array.isArray(parsed?.history) && parsed.history.every(entry => (
        Logic.isValidCode(entry?.guess)
        && Number.isInteger(entry?.feedback?.exact)
        && Number.isInteger(entry?.feedback?.misplaced)
      ));
      if (!Logic.isValidCode(parsed?.secret) || !historyIsValid || parsed.history.length > MAX_ATTEMPTS) {
        return freshState();
      }
      return {
        secret: Logic.cloneCode(parsed.secret),
        history: parsed.history.map(entry => ({
          guess: Logic.cloneCode(entry.guess),
          feedback: { exact: entry.feedback.exact, misplaced: entry.feedback.misplaced }
        })),
        hintUsed: Boolean(parsed.hintUsed),
        completed: Boolean(parsed.completed),
        revealed: Boolean(parsed.revealed)
      };
    } catch (_error) {
      return freshState();
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
    } else if (currentGuess.length < Logic.SYMBOLS.length) {
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
    for (let index = 0; index < Logic.SYMBOLS.length; index += 1) {
      const slot = document.createElement("button");
      slot.type = "button";
      slot.className = `answer-slot${selectedSlot === index ? " is-selected" : ""}`;
      slot.setAttribute("aria-label", currentGuess[index] ? `${index + 1}番目、${tokenText(currentGuess[index])}` : `${index + 1}番目、空`);
      if (currentGuess[index]) slot.appendChild(createToken(currentGuess[index]));
      else slot.innerHTML = `<span class="slot-number">${index + 1}</span>`;
      slot.addEventListener("click", () => selectSlot(index));
      elements.slots.appendChild(slot);
    }
    elements.submit.disabled = currentGuess.length !== Logic.SYMBOLS.length || state.completed || state.revealed;
    elements.clear.disabled = currentGuess.length === 0 || state.completed || state.revealed;
  }

  function renderPalette() {
    elements.palette.replaceChildren();
    Logic.COLORS.forEach(color => {
      Logic.SYMBOLS.forEach(symbol => {
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
    const available = state.history.length >= HINT_AFTER && !state.completed && !state.revealed;
    elements.hintPanel.hidden = !available;
    elements.hintButton.hidden = state.hintUsed;
    if (state.hintUsed) {
      const redCount = state.secret.filter(token => token.color === "red").length;
      elements.hintText.textContent = `ヒント：正解には赤い駒が${redCount}個使われています。`;
    } else {
      elements.hintText.textContent = "";
    }
  }

  function renderSecret() {
    elements.secretAnswer.replaceChildren();
    state.secret.forEach(token => elements.secretAnswer.appendChild(createToken(token)));
  }

  function renderResult() {
    elements.resultPanel.hidden = !state.completed && !state.revealed;
    if (state.completed) {
      elements.resultKicker.textContent = "CLEAR";
      elements.resultTitle.textContent = "正解です";
      elements.resultMessage.textContent = `${state.history.length}回でクリアしました。`;
      elements.retry.textContent = "別の問題を試す";
    } else if (state.revealed) {
      elements.resultKicker.textContent = "ANSWER";
      elements.resultTitle.textContent = "8回使い切りました";
      elements.resultMessage.textContent = "今回の正解です。確認したら、新しい問題へ挑戦できます。";
      elements.retry.textContent = "新しい問題に挑戦";
    }
    if (!elements.resultPanel.hidden) renderSecret();
  }

  function renderStatus() {
    const attempts = state.history.length;
    elements.attemptCount.textContent = `${attempts} / ${MAX_ATTEMPTS}`;
    elements.remainingCount.textContent = `${MAX_ATTEMPTS - attempts}回`;
  }

  function render() {
    renderStatus();
    renderGuess();
    renderPalette();
    renderHistory();
    renderHint();
    renderResult();
  }

  function submitGuess() {
    if (!Logic.isValidCode(currentGuess)) {
      setMessage("5種類の記号を1個ずつ選んでください。", "error");
      return;
    }
    if (state.history.some(entry => entry.guess.every((token, index) => Logic.tokenKey(token) === Logic.tokenKey(currentGuess[index])))) {
      setMessage("同じ並びはすでに回答しています。", "error");
      return;
    }
    if (!Logic.isConsistentCode(currentGuess, state.history)) {
      setMessage("その並びは、これまでの判定結果と矛盾しています。", "error");
      return;
    }

    const guess = Logic.cloneCode(currentGuess);
    const feedback = Logic.score(state.secret, guess);
    state.history.push({ guess, feedback });
    currentGuess = [];
    selectedSlot = null;

    if (feedback.exact === Logic.SYMBOLS.length) state.completed = true;
    else if (state.history.length >= MAX_ATTEMPTS) state.revealed = true;

    saveState();
    setMessage(feedback.exact === Logic.SYMBOLS.length ? "5個すべて正解です。" : `● ${feedback.exact}　○ ${feedback.misplaced}`, feedback.exact === Logic.SYMBOLS.length ? "success" : "");
    render();
    if (state.completed || state.revealed) elements.resultPanel.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function startNewGame() {
    state = freshState();
    currentGuess = [];
    selectedSlot = null;
    saveState();
    setMessage("新しい問題を開始しました。", "success");
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  elements.submit.addEventListener("click", submitGuess);
  elements.clear.addEventListener("click", () => {
    currentGuess = [];
    selectedSlot = null;
    setMessage("");
    renderGuess();
    renderPalette();
  });
  elements.hintButton.addEventListener("click", () => {
    state.hintUsed = true;
    saveState();
    renderHint();
  });
  elements.retry.addEventListener("click", startNewGame);
  elements.reset.addEventListener("click", startNewGame);

  render();
})();
