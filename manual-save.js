// Five manual save slots plus the existing autosave.
// SAVE / LOAD are available while playing, and Continue opens the same load picker.
(() => {
  const SLOT_COUNT = 5;
  const SLOT_PREFIX = `${SAVE_KEY}-slot-`;
  const STYLE_ID = "manual-save-style";
  const CONTROL_ID = "manualSaveControl";
  const OVERLAY_ID = "saveSlotOverlay";
  const originalReadSavedGame = readSavedGame;
  const originalSaveGame = saveGame;
  const originalResumeGame = resumeGame;

  const slotKey = slot => `${SLOT_PREFIX}${slot}`;

  function parseRaw(rawText) {
    if (!rawText) return null;
    try {
      const raw = JSON.parse(rawText);
      const saved = SaveData.normalize(raw);
      return saved ? { raw, saved } : null;
    } catch {
      return null;
    }
  }

  function readSlot(slot) {
    return parseRaw(localStorage.getItem(slotKey(slot)));
  }

  function readAutosave() {
    return parseRaw(localStorage.getItem(SAVE_KEY));
  }

  function hasAnyManualSlot() {
    for (let slot = 1; slot <= SLOT_COUNT; slot++) {
      if (readSlot(slot)) return true;
    }
    return false;
  }

  function hasAnySave() {
    return !!readAutosave() || hasAnyManualSlot();
  }

  function migrateLegacySave() {
    if (hasAnyManualSlot()) return;
    const legacy = readAutosave();
    if (!legacy) return;
    const migrated = {
      ...legacy.raw,
      slotMeta: {
        ...(legacy.raw.slotMeta || {}),
        savedAt: new Date().toISOString(),
        migratedFromLegacy: true
      }
    };
    localStorage.setItem(slotKey(1), JSON.stringify(migrated));
  }

  function sceneLabel(saved) {
    if (saved.currentScene === "opening") return "オープニング";
    if (saved.currentScene === "room01") {
      const state = saved.rooms?.room01 || {};
      if (state.doorUnlocked) return "第一の部屋・扉解錠後";
      if (state.questionSeen) return "第一の部屋・謎解き中";
      return "第一の部屋";
    }
    if (saved.currentScene === "room02") {
      const state = saved.rooms?.room02 || {};
      if (state.unlocked) return "第二の部屋・謎解きクリア後";
      if (state.attempts) return `第二の部屋・${state.attempts}回挑戦済み`;
      return "第二の部屋";
    }
    return saved.currentScene || "進行データ";
  }

  function formatSavedAt(raw) {
    const value = raw?.slotMeta?.savedAt;
    if (!value) return "保存日時なし";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "保存日時なし";
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit"
    }).format(date);
  }

  function snapshotCurrentGameToSlot(slot) {
    originalSaveGame();
    const current = readAutosave();
    if (!current) return false;
    const snapshot = {
      ...current.raw,
      slotMeta: {
        ...(current.raw.slotMeta || {}),
        savedAt: new Date().toISOString(),
        slot
      }
    };
    localStorage.setItem(slotKey(slot), JSON.stringify(snapshot));
    return true;
  }

  function loadData(entry) {
    if (!entry) return false;
    localStorage.setItem(SAVE_KEY, JSON.stringify(entry.raw));
    document.getElementById(OVERLAY_ID)?.remove();
    originalResumeGame();
    return true;
  }

  // Keep the original autosave as the active-session data. If autosave is absent,
  // title-screen availability can still be determined from the five manual slots.
  readSavedGame = function () {
    const auto = originalReadSavedGame();
    if (auto) return auto;
    for (let slot = 1; slot <= SLOT_COUNT; slot++) {
      const entry = readSlot(slot);
      if (entry) return entry.saved;
    }
    return null;
  };

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .manual-save-control{
        position:absolute;top:max(12px,env(safe-area-inset-top));right:max(12px,env(safe-area-inset-right));
        z-index:35;display:flex;align-items:center;gap:8px;pointer-events:none
      }
      .manual-data-button{
        pointer-events:auto;min-width:70px;min-height:42px;padding:8px 12px;border:1px solid rgba(255,255,255,.72);
        border-radius:8px;background:rgba(24,28,31,.82);color:#fff;font:inherit;font-size:13px;letter-spacing:.08em;
        cursor:pointer;box-shadow:0 3px 12px rgba(0,0,0,.24);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)
      }
      .manual-data-button:hover{background:rgba(39,45,49,.94)}
      .manual-data-button:active{transform:translateY(1px)}
      .manual-data-button:focus-visible,.save-slot-close:focus-visible,.save-slot-action:focus-visible{outline:3px solid #60a5fa;outline-offset:2px}
      .save-slot-overlay{
        position:absolute;inset:0;z-index:80;display:grid;place-items:center;padding:20px;background:rgba(0,0,0,.68);color:#2f332e
      }
      .save-slot-panel{
        position:relative;width:min(720px,100%);max-height:min(88dvh,760px);overflow:auto;padding:30px 28px 26px;
        border-radius:16px;background:#f7f7f3;box-shadow:0 16px 44px rgba(0,0,0,.44)
      }
      .save-slot-panel h2{margin:0 48px 6px 0;font-size:26px;font-weight:normal}
      .save-slot-guide{margin-bottom:18px;color:#686d65;font-size:14px;line-height:1.6}
      .save-slot-close{position:absolute;top:12px;right:14px;width:42px;height:42px;border:0;border-radius:7px;background:transparent;color:#333;font-size:29px;cursor:pointer}
      .save-slot-close:hover{background:#e6e7e2}
      .save-slot-list{display:grid;gap:10px}
      .save-slot-card{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px 16px;align-items:center;padding:14px 15px;border:1px solid #d2d5ce;border-radius:10px;background:#fff}
      .save-slot-card.is-empty{background:#f0f1ed;color:#777b74}
      .save-slot-title{font-size:17px;letter-spacing:.06em}
      .save-slot-summary{margin-top:4px;font-size:14px;line-height:1.5;color:#4f554d}
      .save-slot-time{margin-top:2px;font-size:12px;color:#7a8077}
      .save-slot-action{grid-column:2;grid-row:1/4;min-width:100px;min-height:44px;padding:8px 13px;border:1px solid #969e91;border-radius:8px;background:#f8faf6;color:#333;font:inherit;font-size:14px;cursor:pointer}
      .save-slot-action:hover:not(:disabled){background:#edf4e9}
      .save-slot-action:disabled{opacity:.45;cursor:not-allowed}
      .save-slot-action.is-confirm{border-color:#9b663e;background:#fff1e5;color:#6e3511}
      .save-slot-section-title{margin:19px 0 8px;font-size:14px;font-weight:normal;color:#6d726a;letter-spacing:.08em}
      .save-slot-status{min-height:1.5em;margin-top:14px;color:#4d6750;font-size:14px;text-align:center}
      @media(max-width:768px){
        .manual-save-control{top:max(8px,env(safe-area-inset-top));right:max(8px,env(safe-area-inset-right));gap:6px}
        .manual-data-button{min-width:58px;min-height:38px;padding:6px 9px;font-size:11px}
        .save-slot-overlay{padding:10px}.save-slot-panel{max-height:92dvh;padding:26px 14px 18px;border-radius:12px}
        .save-slot-panel h2{font-size:22px}.save-slot-card{grid-template-columns:minmax(0,1fr) 88px;padding:11px 10px;gap:5px 8px}
        .save-slot-title{font-size:15px}.save-slot-summary{font-size:12px}.save-slot-time{font-size:11px}.save-slot-action{min-width:88px;min-height:42px;padding:7px 8px;font-size:12px}
      }
    `;
    document.head.appendChild(style);
  }

  function createSlotCard({ title, entry, actionLabel, disabled = false, onAction, className = "" }) {
    const card = document.createElement("div");
    card.className = `save-slot-card${entry ? "" : " is-empty"}${className ? ` ${className}` : ""}`;

    const text = document.createElement("div");
    const heading = document.createElement("p");
    heading.className = "save-slot-title";
    heading.textContent = title;
    const summary = document.createElement("p");
    summary.className = "save-slot-summary";
    summary.textContent = entry ? `${sceneLabel(entry.saved)} / ${entry.saved.playerName || "主人公"}` : "データなし";
    const time = document.createElement("p");
    time.className = "save-slot-time";
    time.textContent = entry ? formatSavedAt(entry.raw) : "";
    text.append(heading, summary, time);

    const action = document.createElement("button");
    action.type = "button";
    action.className = "save-slot-action";
    action.textContent = actionLabel;
    action.disabled = disabled;
    if (onAction) action.addEventListener("click", () => onAction(action));

    card.append(text, action);
    return card;
  }

  function openSlotPanel(mode, opener = document.activeElement) {
    ensureStyle();
    document.getElementById(OVERLAY_ID)?.remove();

    const overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    overlay.className = "save-slot-overlay";
    overlay.innerHTML = `
      <section class="save-slot-panel" role="dialog" aria-modal="true" aria-label="${mode === "save" ? "セーブ" : "ロード"}">
        <button type="button" class="save-slot-close" aria-label="閉じる">×</button>
        <h2>${mode === "save" ? "セーブ" : "ロード"}</h2>
        <p class="save-slot-guide">${mode === "save" ? "保存するスロットを選んでください。" : "読み込むデータを選んでください。"}</p>
        <div class="save-slot-list"></div>
        <p class="save-slot-status" role="status" aria-live="polite"></p>
      </section>`;
    game.appendChild(overlay);

    const panel = overlay.querySelector(".save-slot-panel");
    const list = overlay.querySelector(".save-slot-list");
    const status = overlay.querySelector(".save-slot-status");
    const closeButton = overlay.querySelector(".save-slot-close");
    let confirmSlot = null;
    let confirmTimer = null;

    function close() {
      clearTimeout(confirmTimer);
      document.removeEventListener("keydown", onKeyDown, true);
      overlay.remove();
      if (opener?.isConnected && !opener.disabled) opener.focus({ preventScroll: true });
    }

    function focusables() {
      return [...panel.querySelectorAll("button:not(:disabled)")];
    }

    function onKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        close();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (!items.length) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const current = items.indexOf(document.activeElement);
      const next = current < 0 ? 0 : (current + (event.shiftKey ? -1 : 1) + items.length) % items.length;
      items[next].focus({ preventScroll: true });
    }

    function resetConfirmButtons() {
      list.querySelectorAll(".save-slot-action.is-confirm").forEach(button => {
        button.classList.remove("is-confirm");
        button.textContent = "上書き保存";
      });
    }

    function render() {
      list.replaceChildren();

      for (let slot = 1; slot <= SLOT_COUNT; slot++) {
        const entry = readSlot(slot);
        if (mode === "save") {
          const card = createSlotCard({
            title: `SLOT ${slot}`,
            entry,
            actionLabel: entry ? "上書き保存" : "セーブ",
            onAction: button => {
              if (entry && confirmSlot !== slot) {
                confirmSlot = slot;
                clearTimeout(confirmTimer);
                resetConfirmButtons();
                button.classList.add("is-confirm");
                button.textContent = "もう一度押す";
                status.textContent = `SLOT ${slot} を上書きします。もう一度押してください。`;
                confirmTimer = setTimeout(() => {
                  confirmSlot = null;
                  resetConfirmButtons();
                  status.textContent = "";
                }, 3500);
                return;
              }

              clearTimeout(confirmTimer);
              confirmSlot = null;
              if (snapshotCurrentGameToSlot(slot)) {
                status.textContent = `SLOT ${slot} に保存しました。`;
                render();
              } else {
                status.textContent = "現在のデータを保存できませんでした。";
              }
            }
          });
          list.appendChild(card);
        } else {
          list.appendChild(createSlotCard({
            title: `SLOT ${slot}`,
            entry,
            actionLabel: "ロード",
            disabled: !entry,
            onAction: () => entry && loadData(entry)
          }));
        }
      }

      if (mode === "load") {
        const sectionTitle = document.createElement("p");
        sectionTitle.className = "save-slot-section-title";
        sectionTitle.textContent = "オートセーブ";
        list.appendChild(sectionTitle);
        const auto = readAutosave();
        const autoCard = createSlotCard({
          title: "AUTO",
          entry: auto,
          actionLabel: "ロード",
          disabled: !auto,
          onAction: () => auto && loadData(auto)
        });
        if (auto) autoCard.querySelector(".save-slot-time").textContent = "現在の進行を自動保存";
        list.appendChild(autoCard);
      }
    }

    closeButton.addEventListener("click", close);
    overlay.addEventListener("click", event => {
      if (event.target === overlay) close();
    });
    document.addEventListener("keydown", onKeyDown, true);
    render();
    closeButton.focus({ preventScroll: true });
  }

  function installDataControls() {
    ensureStyle();
    document.getElementById(CONTROL_ID)?.remove();

    const control = document.createElement("div");
    control.id = CONTROL_ID;
    control.className = "manual-save-control";
    control.innerHTML = `
      <button type="button" class="manual-data-button" data-action="save" aria-label="セーブメニューを開く">SAVE</button>
      <button type="button" class="manual-data-button" data-action="load" aria-label="ロードメニューを開く">LOAD</button>`;
    game.appendChild(control);

    control.querySelector('[data-action="save"]').addEventListener("click", event => {
      event.preventDefault(); event.stopPropagation();
      openSlotPanel("save", event.currentTarget);
    });
    control.querySelector('[data-action="load"]').addEventListener("click", event => {
      event.preventDefault(); event.stopPropagation();
      openSlotPanel("load", event.currentTarget);
    });
  }

  const originalShowOpening = showOpening;
  showOpening = function (...args) {
    const result = originalShowOpening.apply(this, args);
    installDataControls();
    return result;
  };

  const originalShowFirstRoom = showFirstRoom;
  showFirstRoom = function (...args) {
    const result = originalShowFirstRoom.apply(this, args);
    installDataControls();
    return result;
  };

  // Room 2 is loaded before this module in index.html so its manual save/load
  // controls can share the same five-slot screen as the opening and room 1.
  const originalShowSecondRoom = showSecondRoom;
  showSecondRoom = function (...args) {
    const result = originalShowSecondRoom.apply(this, args);
    installDataControls();
    return result;
  };

  // Continue now lets the player choose among the five slots or autosave.
  resumeGame = function () {
    if (!hasAnySave()) {
      showTitle("再開できるデータがありません。");
      return;
    }
    openSlotPanel("load", document.getElementById("continueButton"));
  };

  migrateLegacySave();

  // script.js rendered the first title screen before this enhancement loaded.
  // Re-render once so Continue uses the slot-aware handler and availability state.
  if (document.querySelector(".title-screen")) showTitle();
})();
