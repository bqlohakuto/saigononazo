// Shared gameplay HUD for exploration rooms.
// Room 1 installs this UI first; later rooms can call GameplayUI.installRoom()
// with their own title, objective resolver and companion action.
(() => {
  const UI_SETTINGS_KEY = "saigononazo-gameplay-ui-v1";
  const TEXT_SIZES = ["small", "medium", "large"];
  let activeConfig = null;
  let uiSettings = loadUiSettings();

  function loadUiSettings() {
    try {
      const raw = JSON.parse(localStorage.getItem(UI_SETTINGS_KEY));
      return {
        textSize: TEXT_SIZES.includes(raw?.textSize) ? raw.textSize : "medium"
      };
    } catch {
      return { textSize: "medium" };
    }
  }

  function saveUiSettings() {
    localStorage.setItem(UI_SETTINGS_KEY, JSON.stringify(uiSettings));
  }

  function applyTextSize() {
    document.documentElement.dataset.gameTextSize = uiSettings.textSize;
    const button = document.getElementById("gameplayTextSizeButton");
    if (button) {
      const labels = { small: "小", medium: "中", large: "大" };
      button.textContent = `文字 ${labels[uiSettings.textSize]}`;
      button.setAttribute("aria-label", `文字サイズ ${labels[uiSettings.textSize]}。押すと次のサイズに変更`);
    }
  }

  function cycleTextSize() {
    const current = TEXT_SIZES.indexOf(uiSettings.textSize);
    uiSettings.textSize = TEXT_SIZES[(current + 1) % TEXT_SIZES.length];
    saveUiSettings();
    applyTextSize();
  }

  function ensureStyle() {
    if (document.getElementById("gameplay-ui-style")) return;
    const style = document.createElement("style");
    style.id = "gameplay-ui-style";
    style.textContent = `
      html[data-game-text-size="small"] .message{font-size:clamp(18px,2.2vw,22px)!important}
      html[data-game-text-size="medium"] .message{font-size:clamp(22px,2.8vw,28px)!important}
      html[data-game-text-size="large"] .message{font-size:clamp(26px,3.4vw,34px)!important}
      html[data-game-text-size="small"] .hana-choice-button{font-size:14px!important}
      html[data-game-text-size="medium"] .hana-choice-button{font-size:17px!important}
      html[data-game-text-size="large"] .hana-choice-button{font-size:20px!important}

      #game.gameplay-ui-active #manualSaveControl{display:none!important}
      #game.gameplay-ui-active{--ui-ink:#37312f;--ui-muted:#716a65;--ui-paper:rgba(250,248,244,.94);--ui-border:rgba(128,111,103,.38);--ui-accent:#8b6470;--ui-dark:rgba(32,29,28,.82)}
      .gameplay-hud{position:absolute;z-index:28;top:max(10px,env(safe-area-inset-top));left:max(12px,env(safe-area-inset-left));right:max(12px,env(safe-area-inset-right));display:flex;align-items:flex-start;justify-content:space-between;gap:12px;pointer-events:none;color:var(--ui-ink)}
      .gameplay-hud-left{display:grid;gap:7px;min-width:0;pointer-events:none}
      .gameplay-room-title{width:max-content;max-width:55vw;padding:6px 12px;border:1px solid var(--ui-border);border-radius:9px;background:var(--ui-paper);font-size:clamp(15px,2vw,20px);letter-spacing:.08em;box-shadow:0 3px 12px rgba(27,22,20,.12);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
      .gameplay-goal-row{display:flex;align-items:center;gap:7px;max-width:min(72vw,650px)}
      .gameplay-objective{min-width:0;padding:7px 11px;border:1px solid var(--ui-border);border-radius:999px;background:var(--ui-paper);font-size:clamp(11px,1.5vw,14px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-shadow:0 2px 10px rgba(27,22,20,.09);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
      .gameplay-objective strong{font-weight:normal;color:var(--ui-muted);margin-right:.35em}
      .gameplay-highlight-toggle{pointer-events:auto;flex:0 0 auto;min-height:34px;padding:6px 10px;border:1px solid var(--ui-border);border-radius:999px;background:var(--ui-paper);color:var(--ui-ink);font:inherit;font-size:12px;cursor:pointer;box-shadow:0 2px 10px rgba(27,22,20,.09)}
      .gameplay-highlight-toggle[aria-pressed="true"]{border-color:#a88363;background:#fff4df;color:#704b2d;box-shadow:0 0 0 2px rgba(204,159,99,.18)}
      .gameplay-hud-actions{display:flex;gap:6px;pointer-events:auto}
      .gameplay-top-button{min-width:60px;min-height:38px;padding:7px 10px;border:1px solid rgba(255,255,255,.66);border-radius:8px;background:var(--ui-dark);color:#fff;font:inherit;font-size:12px;letter-spacing:.05em;cursor:pointer;box-shadow:0 3px 12px rgba(0,0,0,.2);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
      .gameplay-top-button.menu{min-width:42px;font-size:20px;line-height:1}
      .gameplay-top-button:focus-visible,.gameplay-highlight-toggle:focus-visible,.gameplay-bottom-button:focus-visible{outline:3px solid #9d7782;outline-offset:2px}

      .room.gameplay-shell{grid-template-rows:minmax(0,1fr) 48px 30px;gap:7px;padding:82px 14px 66px;background:#e9e4dc}
      .room.gameplay-shell .room-header{display:none}
      .room.gameplay-shell .room-stage{box-shadow:0 8px 26px rgba(37,31,28,.16);border-radius:8px}
      .room.gameplay-shell .object>span{display:none}
      .room.gameplay-shell.show-hotspots .object:not(:disabled)::after{content:"";position:absolute;z-index:8;left:50%;top:50%;width:34px;height:34px;transform:translate(-50%,-50%);border:2px solid rgba(255,223,143,.95);border-radius:50%;background:rgba(255,247,218,.24);box-shadow:0 0 0 7px rgba(255,219,128,.14),0 0 18px rgba(255,205,94,.72);pointer-events:none;animation:gameplayHotspotPulse 1.8s ease-in-out infinite}
      @keyframes gameplayHotspotPulse{0%,100%{opacity:.76;box-shadow:0 0 0 5px rgba(255,219,128,.11),0 0 13px rgba(255,205,94,.55)}50%{opacity:1;box-shadow:0 0 0 9px rgba(255,219,128,.18),0 0 22px rgba(255,205,94,.86)}}
      .room.gameplay-shell .room-navigation{grid-template-columns:48px minmax(70px,110px) 48px;gap:8px;width:max-content;margin:auto}
      .room.gameplay-shell .room-navigation button{width:44px;height:44px;min-height:44px;padding:0;border:1px solid rgba(99,91,85,.42);border-radius:50%;background:rgba(250,248,244,.9);font-size:25px;box-shadow:0 3px 10px rgba(31,27,24,.12)}
      .room.gameplay-shell .room-navigation button span{display:none}
      .room.gameplay-shell .room-navigation p{padding:7px 12px;border-radius:999px;background:rgba(250,248,244,.78);font-size:13px;box-shadow:0 2px 8px rgba(31,27,24,.08)}
      .room.gameplay-shell .explore-status{width:min(720px,92%);padding:4px 10px;border-radius:7px;background:rgba(250,248,244,.72);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-shadow:0 2px 8px rgba(31,27,24,.07)}

      .gameplay-bottom-bar{position:absolute;z-index:30;left:50%;bottom:max(8px,env(safe-area-inset-bottom));transform:translateX(-50%);display:flex;align-items:center;gap:6px;padding:6px;border:1px solid var(--ui-border);border-radius:13px;background:rgba(248,246,242,.94);box-shadow:0 8px 24px rgba(28,24,22,.2);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);pointer-events:auto}
      .gameplay-bottom-button{min-width:68px;min-height:39px;padding:7px 10px;border:0;border-radius:8px;background:transparent;color:var(--ui-ink);font:inherit;font-size:12px;cursor:pointer;white-space:nowrap}
      .gameplay-bottom-button:hover{background:#eee8e3}
      .gameplay-bottom-button[aria-pressed="true"]{background:#eadde1;color:#704b57;box-shadow:inset 0 0 0 1px #b58c98}
      .gameplay-bottom-button.hana{padding-inline:14px;background:#f1e6e9;color:#754d59;font-weight:bold}

      .gameplay-ui-active .room-dialog-overlay{background:rgba(24,20,19,.3)}
      .gameplay-ui-active .room-dialog{margin-bottom:64px;border:1px solid rgba(139,112,106,.28);background:rgba(250,248,244,.96);box-shadow:0 12px 32px rgba(28,22,20,.24);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
      .gameplay-ui-active .room-dialog .auto-button,.gameplay-ui-active .room-dialog .log-button{position:absolute!important;width:1px!important;height:1px!important;min-width:0!important;min-height:0!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;white-space:nowrap!important;border:0!important}
      .gameplay-ui-active .room-dialog .dialog-controls{padding-top:7px}

      .gameplay-log-overlay,.gameplay-menu-overlay{position:absolute;inset:0;z-index:72;display:grid;place-items:center;padding:18px;background:rgba(20,18,17,.58);color:var(--ui-ink)}
      .gameplay-panel{position:relative;width:min(720px,100%);max-height:84dvh;padding:24px 22px 20px;border:1px solid var(--ui-border);border-radius:16px;background:#f8f6f2;box-shadow:0 16px 40px rgba(20,17,15,.34);overflow:auto}
      .gameplay-panel h2{margin:0 48px 14px 0;font-size:23px;font-weight:normal}
      .gameplay-panel-close{position:absolute;right:10px;top:9px;width:42px;height:42px;border:0;border-radius:8px;background:transparent;color:#3b3633;font-size:28px;cursor:pointer}
      .gameplay-panel-close:hover{background:#ece7e2}
      .gameplay-log-list{display:grid;gap:9px;max-height:65dvh;overflow:auto;padding-right:3px}
      .gameplay-log-row{padding:10px 12px;border:1px solid #ddd6cf;border-radius:9px;background:#fff;line-height:1.65;white-space:pre-wrap}
      .gameplay-log-row.heroine{border-color:#dec2cb;background:#fff3f6}.gameplay-log-row.player{border-color:#c7d5e6;background:#f2f7ff}.gameplay-log-row.narration{background:#fbfaf7}
      .gameplay-log-speaker{margin-bottom:3px;color:#766e68;font-size:11px;letter-spacing:.06em}.gameplay-log-text{font-size:14px}
      .gameplay-log-empty{padding:26px;text-align:center;color:#77706a}
      .gameplay-menu-list{display:grid;gap:9px}
      .gameplay-menu-item{min-height:48px;padding:10px 14px;border:1px solid #cdc5be;border-radius:9px;background:#fff;color:#383330;font:inherit;font-size:16px;text-align:left;cursor:pointer}
      .gameplay-menu-item:hover{background:#f2ece7}.gameplay-menu-item.danger{color:#7d3e32}.gameplay-menu-hint{min-height:1.5em;margin-top:12px;color:#766e68;font-size:12px;text-align:center}

      @media(max-width:768px){
        .gameplay-hud{top:max(7px,env(safe-area-inset-top));left:max(8px,env(safe-area-inset-left));right:max(8px,env(safe-area-inset-right));gap:7px}
        .gameplay-room-title{padding:5px 9px;font-size:14px}.gameplay-goal-row{gap:5px}.gameplay-objective{max-width:56vw;padding:6px 9px;font-size:10px}.gameplay-highlight-toggle{min-height:30px;padding:5px 8px;font-size:10px}
        .gameplay-hud-actions{gap:4px}.gameplay-top-button{min-width:48px;min-height:34px;padding:6px 7px;font-size:10px}.gameplay-top-button.menu{min-width:36px;font-size:18px}
        .room.gameplay-shell{padding:72px 8px 62px;grid-template-rows:minmax(0,1fr) 44px 26px;gap:5px}
        .room.gameplay-shell .room-navigation{grid-template-columns:42px 74px 42px}.room.gameplay-shell .room-navigation button{width:40px;height:40px;min-height:40px;font-size:22px}.room.gameplay-shell .room-navigation p{padding:6px 8px;font-size:11px}
        .room.gameplay-shell .explore-status{font-size:10px;padding:3px 7px}
        .gameplay-bottom-bar{bottom:max(6px,env(safe-area-inset-bottom));gap:3px;padding:4px;border-radius:11px;width:min(calc(100% - 14px),460px);justify-content:space-between}
        .gameplay-bottom-button{min-width:0;flex:1;min-height:36px;padding:6px 5px;font-size:10px}.gameplay-bottom-button.hana{padding-inline:8px}
        .gameplay-ui-active .room-dialog{margin-bottom:56px;width:calc(100% - 18px)}
        .gameplay-log-overlay,.gameplay-menu-overlay{padding:10px}.gameplay-panel{padding:20px 13px 14px;border-radius:13px}.gameplay-panel h2{font-size:20px}.gameplay-log-text{font-size:12px}.gameplay-menu-item{min-height:45px;font-size:14px}
      }
    `;
    document.head.appendChild(style);
  }

  function firstRoomObjective() {
    if (!firstRoomState) return "部屋を調べる";
    if (firstRoomState.doorUnlocked) return "開いた扉の先を確かめる";
    if (firstRoomState.melodySolved) return "蘇った記憶を確かめる";
    if (firstRoomState.pianoAttempted) return "会話に隠された音楽を見つける";
    if (firstRoomState.questionSeen) return "扉の謎を解く";
    if (firstRoomState.doorInspected) return "扉の問題文を調べる";
    return "部屋を調べる";
  }

  function currentObjective() {
    if (!activeConfig) return "";
    return typeof activeConfig.objective === "function" ? activeConfig.objective() : (activeConfig.objective || "部屋を調べる");
  }

  function updateObjective() {
    const element = document.getElementById("gameplayObjectiveText");
    if (element) element.textContent = currentObjective();
  }

  function openSaveLoad(mode) {
    const source = document.querySelector(`#manualSaveControl [data-action="${mode}"]`);
    if (source) {
      source.click();
      return true;
    }
    return false;
  }

  function syncAutoButton() {
    const button = document.getElementById("gameplayAutoButton");
    if (!button) return;
    const enabled = !!Dialogue.isAutoEnabled?.();
    button.textContent = enabled ? "AUTO ON" : "AUTO";
    button.setAttribute("aria-pressed", String(enabled));
  }

  function renderStandaloneLog(list) {
    list.replaceChildren();
    const entries = GameLog.list();
    if (!entries.length) {
      const empty = document.createElement("p");
      empty.className = "gameplay-log-empty";
      empty.textContent = "まだ履歴はありません。";
      list.appendChild(empty);
      return;
    }
    entries.forEach(entry => {
      const row = document.createElement("article");
      row.className = `gameplay-log-row ${entry.kind || "system"}`;
      if (entry.speaker) {
        const speaker = document.createElement("p");
        speaker.className = "gameplay-log-speaker";
        speaker.textContent = entry.thought ? "主人公・心の声" : entry.speaker;
        row.appendChild(speaker);
      }
      const text = document.createElement("p");
      text.className = "gameplay-log-text";
      text.textContent = entry.text;
      row.appendChild(text);
      list.appendChild(row);
    });
    list.scrollTop = list.scrollHeight;
  }

  function openStandaloneLog() {
    document.querySelector(".gameplay-log-overlay")?.remove();
    const opener = document.getElementById("gameplayLogButton");
    const overlay = document.createElement("div");
    overlay.className = "gameplay-log-overlay";
    overlay.innerHTML = `<section class="gameplay-panel" role="dialog" aria-modal="true" aria-label="会話と調査の履歴"><button type="button" class="gameplay-panel-close" aria-label="閉じる">×</button><h2>LOG</h2><div class="gameplay-log-list"></div></section>`;
    game.appendChild(overlay);
    const closeButton = overlay.querySelector(".gameplay-panel-close");
    const list = overlay.querySelector(".gameplay-log-list");
    const close = () => {
      document.removeEventListener("keydown", onKeyDown, true);
      overlay.remove();
      opener?.focus({preventScroll:true});
    };
    const onKeyDown = event => {
      if (event.key === "Escape") {
        event.preventDefault();event.stopImmediatePropagation();close();
      }
    };
    closeButton.addEventListener("click", close);
    overlay.addEventListener("click", event => { if (event.target === overlay) close(); });
    document.addEventListener("keydown", onKeyDown, true);
    renderStandaloneLog(list);
    closeButton.focus({preventScroll:true});
  }

  function toggleLog() {
    const internal = document.querySelector(".room-dialog-overlay .log-button");
    if (internal && !internal.disabled) {
      internal.click();
      requestAnimationFrame(() => {
        document.getElementById("gameplayLogButton")?.setAttribute("aria-pressed", String(!!document.querySelector(".room-dialog.is-log-open")));
      });
      return;
    }
    openStandaloneLog();
  }

  function openMenu() {
    document.querySelector(".gameplay-menu-overlay")?.remove();
    const opener = document.getElementById("gameplayMenuButton");
    const overlay = document.createElement("div");
    overlay.className = "gameplay-menu-overlay";
    overlay.innerHTML = `<section class="gameplay-panel" role="dialog" aria-modal="true" aria-label="ゲームメニュー"><button type="button" class="gameplay-panel-close" aria-label="閉じる">×</button><h2>メニュー</h2><div class="gameplay-menu-list"><button type="button" class="gameplay-menu-item" data-menu="settings">設定</button><button type="button" class="gameplay-menu-item" data-menu="save">セーブ</button><button type="button" class="gameplay-menu-item" data-menu="load">ロード</button><button type="button" class="gameplay-menu-item danger" data-menu="title">タイトルへ戻る</button></div><p class="gameplay-menu-hint" role="status" aria-live="polite"></p></section>`;
    game.appendChild(overlay);
    const hint = overlay.querySelector(".gameplay-menu-hint");
    let titleConfirm = false;
    let confirmTimer = null;
    const closeButton = overlay.querySelector(".gameplay-panel-close");
    const close = () => {
      clearTimeout(confirmTimer);
      document.removeEventListener("keydown", onKeyDown, true);
      overlay.remove();
      opener?.focus({preventScroll:true});
    };
    const onKeyDown = event => {
      if (event.key === "Escape") {
        event.preventDefault();event.stopImmediatePropagation();close();
      }
    };
    closeButton.addEventListener("click", close);
    overlay.addEventListener("click", event => { if (event.target === overlay) close(); });
    document.addEventListener("keydown", onKeyDown, true);
    overlay.querySelectorAll("[data-menu]").forEach(button => button.addEventListener("click", () => {
      const action = button.dataset.menu;
      if (action === "settings") { close(); showSettings(); return; }
      if (action === "save" || action === "load") { close(); openSaveLoad(action); return; }
      if (action === "title") {
        if (!titleConfirm) {
          titleConfirm = true;
          button.textContent = "もう一度押してタイトルへ";
          hint.textContent = "現在の進行をオートセーブしてタイトルへ戻ります。";
          confirmTimer = setTimeout(() => {
            titleConfirm = false;
            button.textContent = "タイトルへ戻る";
            hint.textContent = "";
          }, 3500);
          return;
        }
        saveGame();
        close();
        showTitle();
      }
    }));
    closeButton.focus({preventScroll:true});
  }

  function createHud(config) {
    document.getElementById("gameplayHud")?.remove();
    const hud = document.createElement("div");
    hud.id = "gameplayHud";
    hud.className = "gameplay-hud";
    hud.innerHTML = `<div class="gameplay-hud-left"><p class="gameplay-room-title"></p><div class="gameplay-goal-row"><p class="gameplay-objective"><strong>目的</strong><span id="gameplayObjectiveText"></span></p><button type="button" class="gameplay-highlight-toggle" id="gameplayHighlightButton" aria-pressed="false">調査表示</button></div></div><div class="gameplay-hud-actions"><button type="button" class="gameplay-top-button" data-gameplay="save">SAVE</button><button type="button" class="gameplay-top-button" data-gameplay="load">LOAD</button><button type="button" class="gameplay-top-button menu" id="gameplayMenuButton" aria-label="メニュー">☰</button></div>`;
    hud.querySelector(".gameplay-room-title").textContent = config.title;
    game.appendChild(hud);
    hud.querySelector('[data-gameplay="save"]').addEventListener("click", () => openSaveLoad("save"));
    hud.querySelector('[data-gameplay="load"]').addEventListener("click", () => openSaveLoad("load"));
    hud.querySelector("#gameplayMenuButton").addEventListener("click", openMenu);
    hud.querySelector("#gameplayHighlightButton").addEventListener("click", toggleHighlights);
  }

  function createBottomBar(config) {
    document.getElementById("gameplayBottomBar")?.remove();
    const bar = document.createElement("nav");
    bar.id = "gameplayBottomBar";
    bar.className = "gameplay-bottom-bar";
    bar.setAttribute("aria-label", "ゲーム操作");
    bar.innerHTML = `<button type="button" class="gameplay-bottom-button hana" id="gameplayHanaButton">ハナ</button><button type="button" class="gameplay-bottom-button" id="gameplayAutoButton" aria-pressed="false">AUTO</button><button type="button" class="gameplay-bottom-button" id="gameplayLogButton" aria-pressed="false">LOG</button><button type="button" class="gameplay-bottom-button" id="gameplayTextSizeButton">文字 中</button>`;
    game.appendChild(bar);
    bar.querySelector("#gameplayHanaButton").addEventListener("click", () => config.onCompanion?.());
    bar.querySelector("#gameplayAutoButton").addEventListener("click", () => { Dialogue.toggleAuto?.(); syncAutoButton(); });
    bar.querySelector("#gameplayLogButton").addEventListener("click", toggleLog);
    bar.querySelector("#gameplayTextSizeButton").addEventListener("click", cycleTextSize);
    syncAutoButton();
    applyTextSize();
  }

  function applyHighlightState() {
    const room = game.querySelector(".room");
    const button = document.getElementById("gameplayHighlightButton");
    if (!room || !button || !activeConfig) return;
    const enabled = !!activeConfig.getHighlights?.();
    room.classList.toggle("show-hotspots", enabled);
    button.setAttribute("aria-pressed", String(enabled));
    button.textContent = enabled ? "調査表示 ON" : "調査表示";
  }

  function toggleHighlights() {
    if (!activeConfig) return;
    const enabled = !activeConfig.getHighlights?.();
    activeConfig.setHighlights?.(enabled);
    applyHighlightState();
  }

  function installRoom(config) {
    ensureStyle();
    activeConfig = config;
    game.classList.add("gameplay-ui-active");
    const room = game.querySelector(".room");
    if (!room) return;
    room.classList.add("gameplay-shell");
    createHud(config);
    createBottomBar(config);
    applyHighlightState();
    updateObjective();
    applyTextSize();
  }

  const firstRoomConfig = {
    sceneId: "room01",
    title: "第一の部屋",
    objective: firstRoomObjective,
    onCompanion: () => talkToHana(),
    getHighlights: () => !!firstRoomState?.highlightEnabled,
    setHighlights: enabled => {
      if (!firstRoomState) return;
      firstRoomState.highlightEnabled = !!enabled;
      saveGame();
    }
  };

  const showFirstRoomBeforeGameplayUi = showFirstRoom;
  showFirstRoom = function (...args) {
    const result = showFirstRoomBeforeGameplayUi.apply(this, args);
    installRoom(firstRoomConfig);
    return result;
  };

  const saveGameBeforeGameplayUi = saveGame;
  saveGame = function (...args) {
    const result = saveGameBeforeGameplayUi.apply(this, args);
    updateObjective();
    return result;
  };

  const showTitleBeforeGameplayUi = showTitle;
  showTitle = function (...args) {
    activeConfig = null;
    game.classList.remove("gameplay-ui-active");
    return showTitleBeforeGameplayUi.apply(this, args);
  };

  document.addEventListener("dialogue:autochange", syncAutoButton);
  applyTextSize();

  window.GameplayUI = {
    installRoom,
    updateObjective,
    openLog: openStandaloneLog,
    openDataMenu: openSaveLoad,
    applyTextSize
  };
})();
