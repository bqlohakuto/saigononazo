// Issue #25 A02: protect against accidental browser Back during gameplay.
// Uses a single same-URL history entry; never blocks intentional navigation.
(() => {
  "use strict";
  const marker = "__saigononazoBackGuard";
  const game = document.getElementById("game");
  const browserHistory = window.history;
  if (!game || !browserHistory?.pushState) return;

  const isGuard = state => !!(state && typeof state === "object" && state[marker] === true);
  const pushGuard = () => {
    const previous = browserHistory.state;
    const state = previous && typeof previous === "object" ? {...previous} : {};
    browserHistory.pushState({...state, [marker]: true}, "", window.location.href);
  };

  // Reloading the protected entry must not keep adding new Back steps.
  try {
    if (!isGuard(browserHistory.state)) pushGuard();
  } catch {
    // Local-file or embedded browser security policies may reject pushState.
    return;
  }

  let dialog = null;
  let previousFocus = null;

  function dismiss() {
    if (!dialog) return;
    dialog.remove();
    dialog = null;
    window.removeEventListener("keydown", onKeyDown, true);
    if (previousFocus?.isConnected) previousFocus.focus({preventScroll: true});
    previousFocus = null;
  }

  function continuePlaying() {
    if (!dialog) return;
    dismiss();
    try { pushGuard(); } catch { /* No forced navigation if history is unavailable. */ }
  }

  function leavePage() {
    if (!dialog) return;
    dismiss();
    // We are on the original entry after Back; another Back is intentional.
    browserHistory.back();
  }

  function onKeyDown(event) {
    if (!dialog) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopImmediatePropagation();
      continuePlaying();
      return;
    }
    if (event.key !== "Tab") return;
    const buttons = [...dialog.querySelectorAll("button")];
    const current = buttons.indexOf(document.activeElement);
    const next = current < 0 ? 0 : (current + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length;
    event.preventDefault();
    buttons[next]?.focus();
  }

  function confirmBack() {
    if (dialog) return;
    previousFocus = document.activeElement;
    const overlay = document.createElement("div");
    overlay.className = "browser-back-overlay";
    overlay.innerHTML = `<section class="browser-back-panel" role="dialog" aria-modal="true" aria-labelledby="browser-back-title" aria-describedby="browser-back-description">
      <h2 id="browser-back-title">ゲームを終了しますか？</h2>
      <p id="browser-back-description">ブラウザの「戻る」が押されました。プレイを続けるか、前のページへ戻るかを選んでください。</p>
      <div class="browser-back-actions">
        <button type="button" data-back-action="continue">ゲームを続ける</button>
        <button type="button" data-back-action="leave">前のページへ戻る</button>
      </div>
    </section>`;
    dialog = overlay;
    game.appendChild(overlay);
    overlay.querySelector('[data-back-action="continue"]').addEventListener("click", continuePlaying);
    overlay.querySelector('[data-back-action="leave"]').addEventListener("click", leavePage);
    window.addEventListener("keydown", onKeyDown, true);
    overlay.querySelector('[data-back-action="continue"]').focus({preventScroll: true});
  }

  window.addEventListener("popstate", event => {
    // Browser Forward from the original entry returns to the protected entry.
    if (isGuard(event.state)) {
      dismiss();
      return;
    }
    // On the title screen, Back behaves like normal browser navigation.
    if (game.querySelector(".title-screen")) {
      dismiss();
      browserHistory.back();
      return;
    }
    // Persist progress before displaying the confirmation; keep the scene alive.
    try { if (typeof window.saveGame === "function") window.saveGame(); } catch {}
    confirmBack();
  });
})();
