(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MastermindLogic = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const SYMBOLS = Object.freeze([
    Object.freeze({ id: "circle", mark: "○", label: "丸" }),
    Object.freeze({ id: "triangle", mark: "△", label: "三角" }),
    Object.freeze({ id: "square", mark: "□", label: "四角" }),
    Object.freeze({ id: "diamond", mark: "◇", label: "ひし形" }),
    Object.freeze({ id: "plus", mark: "＋", label: "プラス" })
  ]);

  const COLORS = Object.freeze([
    Object.freeze({ id: "red", label: "赤" }),
    Object.freeze({ id: "blue", label: "青" })
  ]);

  const SYMBOL_IDS = new Set(SYMBOLS.map(symbol => symbol.id));
  const COLOR_IDS = new Set(COLORS.map(color => color.id));

  function tokenKey(token) {
    return `${token.symbol}:${token.color}`;
  }

  function cloneCode(code) {
    return code.map(token => ({ symbol: token.symbol, color: token.color }));
  }

  function activeSymbols(symbolCount = SYMBOLS.length) {
    if (!Number.isInteger(symbolCount) || symbolCount < 1 || symbolCount > SYMBOLS.length) {
      throw new RangeError("invalid symbol count");
    }
    return SYMBOLS.slice(0, symbolCount);
  }

  function isValidCode(code, symbolCount = SYMBOLS.length) {
    const allowedSymbols = new Set(activeSymbols(symbolCount).map(symbol => symbol.id));
    if (!Array.isArray(code) || code.length !== symbolCount) return false;
    const usedSymbols = new Set();
    for (const token of code) {
      if (!token || !SYMBOL_IDS.has(token.symbol) || !allowedSymbols.has(token.symbol) || !COLOR_IDS.has(token.color)) return false;
      if (usedSymbols.has(token.symbol)) return false;
      usedSymbols.add(token.symbol);
    }
    return true;
  }

  function score(secret, guess) {
    const symbolCount = secret?.length;
    if (!isValidCode(secret, symbolCount) || !isValidCode(guess, symbolCount)) throw new TypeError("invalid mastermind code");
    let exact = 0;
    for (let index = 0; index < secret.length; index += 1) {
      if (tokenKey(secret[index]) === tokenKey(guess[index])) exact += 1;
    }
    const secretTokens = new Set(secret.map(tokenKey));
    const included = guess.reduce((count, token) => count + Number(secretTokens.has(tokenKey(token))), 0);
    return { exact, misplaced: included - exact };
  }

  function permutations(items) {
    if (items.length === 1) return [items.slice()];
    const output = [];
    items.forEach((item, index) => {
      const rest = items.slice(0, index).concat(items.slice(index + 1));
      permutations(rest).forEach(permutation => output.push([item, ...permutation]));
    });
    return output;
  }

  function generateAllCodes(symbolCount = SYMBOLS.length) {
    const codes = [];
    const symbolOrders = permutations(activeSymbols(symbolCount).map(symbol => symbol.id));
    symbolOrders.forEach(order => {
      for (let mask = 0; mask < 2 ** symbolCount; mask += 1) {
        codes.push(order.map((symbol, index) => ({
          symbol,
          color: COLORS[(mask >> index) & 1].id
        })));
      }
    });
    return codes;
  }

  function randomCode(random = Math.random, symbolCount = SYMBOLS.length) {
    const order = activeSymbols(symbolCount).map(symbol => symbol.id);
    for (let index = order.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
    }
    return order.map(symbol => ({
      symbol,
      color: COLORS[Math.floor(random() * COLORS.length)].id
    }));
  }

  function updateStats(current, attempts, maxAttempts = 8) {
    if (!Number.isInteger(attempts) || attempts < 1 || attempts > maxAttempts) {
      throw new RangeError("invalid attempt count");
    }
    const previousBest = Number.isInteger(current?.bestAttempts) ? current.bestAttempts : null;
    const clearCount = Number.isInteger(current?.clearCount) && current.clearCount >= 0 ? current.clearCount : 0;
    return {
      clearCount: clearCount + 1,
      bestAttempts: previousBest === null ? attempts : Math.min(previousBest, attempts),
      latestAttempts: attempts,
      latestRemaining: maxAttempts - attempts
    };
  }

  function shareText(attempts, maxAttempts = 8, difficulty = "ふつう 5×2") {
    return [
      `「いろしるパズル」を${attempts}回でクリア！`,
      `残り${maxAttempts - attempts}手でした。`,
      `難易度：${difficulty}`,
      "",
      "Web脱出ゲーム「最後の謎が解けるまで」ミニパズル",
      "#最後の謎が解けるまで #いろしるパズル"
    ].join("\n");
  }

  function shouldRevealLeftmost(attemptNumber, feedback, symbolCount, revealAt = 5) {
    return attemptNumber === revealAt
      && Number.isInteger(feedback?.exact)
      && Number.isInteger(feedback?.misplaced)
      && feedback.exact + feedback.misplaced === symbolCount;
  }

  return Object.freeze({
    SYMBOLS,
    COLORS,
    activeSymbols,
    tokenKey,
    cloneCode,
    isValidCode,
    score,
    generateAllCodes,
    randomCode,
    updateStats,
    shareText,
    shouldRevealLeftmost
  });
});
