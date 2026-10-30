// Reset all playthrough data from the cleared title, without changing preferences.
(() => {
  const BUTTON_ID = "resetProgressButton";
  const DIALOG_ID = "resetProgressDialog";
  const CLEARED_KEY = "saigononazo-guide-unlocked-v1";
  const SLOT_PREFIX = `${SAVE_KEY}-slot-`;
  const NOTICE_KEY = "saigononazo-progress-reset-notice";

  function resetAllProgress() {
    // Remove the autosave, every current/legacy manual slot, and the ending unlock.
    const keys = [SAVE_KEY, CLEARED_KEY];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(SLOT_PREFIX)) keys.push(key);
    }
    for (const key of keys) localStorage.removeItem(key);
    clearSave();
    playerName = "";
  }

  function openConfirmation(opener) {
    if (document.getElementById(DIALOG_ID)) return;
    const title = game.querySelector(".title-home.title-cleared");
    if (!title) return;

    const overlay = document.createElement("div");
    overlay.id = DIALOG_ID;
    overlay.className = "reset-progress-overlay";
    overlay.innerHTML = `<section class="reset-progress-panel" role="dialog" aria-modal="true" aria-labelledby="resetProgressTitle" aria-describedby="resetProgressDescription">
      <h2 id="resetProgressTitle">クリアデータを削除</h2>
      <p id="resetProgressDescription">セーブデータを削除して、最初から始めますか？</p>
      <p>オートセーブ、すべての手動セーブ、クリア記録と解放済みの謎の解説が削除されます。この操作は取り消せません。</p>
      <p class="reset-progress-error" role="alert" hidden></p>
      <div class="reset-progress-actions">
        <button type="button" data-action="cancel">キャンセル</button>
        <button type="button" data-action="delete">すべて削除する</button>
      </div>
    </section>`;
    game.appendChild(overlay);
    const previousInert = title.inert;
    title.inert = true;
    const cancel = overlay.querySelector('[data-action="cancel"]');
    const remove = overlay.querySelector('[data-action="delete"]');
    const error = overlay.querySelector(".reset-progress-error");

    function close() {
      document.removeEventListener("keydown", onKeyDown, true);
      title.inert = previousInert;
      overlay.remove();
      if (opener.isConnected) opener.focus({ preventScroll: true });
    }

    function onKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        close();
      } else if (event.key === "Tab") {
        event.preventDefault();
        event.stopImmediatePropagation();
        (document.activeElement === cancel ? remove : cancel).focus({ preventScroll: true });
      }
    }

    cancel.addEventListener("click", close);
    overlay.addEventListener("click", event => {
      if (event.target === overlay) close();
    });
    remove.addEventListener("click", () => {
      try {
        resetAllProgress();
      } catch (cause) {
        error.hidden = false;
        error.textContent = "データの削除に失敗しました。ブラウザの保存設定を確認して、再度お試しください。";
        return;
      }
      // A reload also clears transient scene/UI state that lives only in memory.
      try { sessionStorage.setItem(NOTICE_KEY, "1"); } catch (_) {}
      window.location.reload();
    });
    document.addEventListener("keydown", onKeyDown, true);
    cancel.focus({ preventScroll: true });
  }

  function syncButton() {
    const title = game.querySelector(".title-home.title-cleared");
    if (!title || title.querySelector(`#${BUTTON_ID}`)) return;
    const button = document.createElement("button");
    button.id = BUTTON_ID;
    button.type = "button";
    button.className = "reset-progress-button";
    button.textContent = "クリアデータを削除";
    button.addEventListener("click", () => openConfirmation(button));
    title.appendChild(button);
  }

  const observer = new MutationObserver(syncButton);
  observer.observe(game, { childList: true, subtree: true });
  syncButton();

  try {
    if (sessionStorage.getItem(NOTICE_KEY) === "1") {
      sessionStorage.removeItem(NOTICE_KEY);
      const notice = game.querySelector(".title-home .title-notice");
      if (notice) notice.textContent = "クリアデータを削除しました。最初から遊べます。";
    }
  } catch (_) {}
})();
