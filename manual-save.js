// Manual save control for active gameplay screens.
// Keeps the existing autosave behavior and lets the player explicitly
// overwrite the same continue-data slot at any moment.
(() => {
  const STYLE_ID = "manual-save-style";
  const CONTROL_ID = "manualSaveControl";

  function ensureManualSaveStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .manual-save-control{
        position:absolute;
        top:max(12px,env(safe-area-inset-top));
        right:max(12px,env(safe-area-inset-right));
        z-index:30;
        display:flex;
        align-items:center;
        gap:10px;
        pointer-events:none;
      }
      .manual-save-button{
        pointer-events:auto;
        min-width:76px;
        min-height:42px;
        padding:8px 14px;
        border:1px solid rgba(255,255,255,.72);
        border-radius:8px;
        background:rgba(24,28,31,.82);
        color:#fff;
        font:inherit;
        font-size:14px;
        letter-spacing:.08em;
        cursor:pointer;
        box-shadow:0 3px 12px rgba(0,0,0,.24);
        backdrop-filter:blur(4px);
        -webkit-backdrop-filter:blur(4px);
      }
      .manual-save-button:hover{background:rgba(39,45,49,.92)}
      .manual-save-button:active{transform:translateY(1px)}
      .manual-save-button:focus-visible{outline:3px solid #60a5fa;outline-offset:2px}
      .manual-save-status{
        opacity:0;
        transform:translateY(-3px);
        padding:7px 10px;
        border-radius:7px;
        background:rgba(24,28,31,.86);
        color:#fff;
        font-size:13px;
        white-space:nowrap;
        transition:opacity .18s ease,transform .18s ease;
        box-shadow:0 3px 12px rgba(0,0,0,.2);
      }
      .manual-save-status.is-visible{opacity:1;transform:translateY(0)}
      @media(max-width:768px){
        .manual-save-control{top:max(8px,env(safe-area-inset-top));right:max(8px,env(safe-area-inset-right));gap:7px}
        .manual-save-button{min-width:66px;min-height:38px;padding:7px 11px;font-size:12px}
        .manual-save-status{font-size:12px;padding:6px 8px}
      }
    `;
    document.head.appendChild(style);
  }

  function installManualSaveControl() {
    ensureManualSaveStyle();
    document.getElementById(CONTROL_ID)?.remove();

    const control = document.createElement("div");
    control.id = CONTROL_ID;
    control.className = "manual-save-control";
    control.innerHTML = `
      <span class="manual-save-status" role="status" aria-live="polite"></span>
      <button type="button" class="manual-save-button" aria-label="現在の場所でセーブする">SAVE</button>`;
    game.appendChild(control);

    const button = control.querySelector(".manual-save-button");
    const status = control.querySelector(".manual-save-status");
    let hideTimer = null;

    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      saveGame();

      clearTimeout(hideTimer);
      status.textContent = "保存しました";
      status.classList.add("is-visible");
      hideTimer = setTimeout(() => status.classList.remove("is-visible"), 1600);
    });
  }

  const originalShowOpening = showOpening;
  showOpening = function (...args) {
    const result = originalShowOpening.apply(this, args);
    installManualSaveControl();
    return result;
  };

  const originalShowFirstRoom = showFirstRoom;
  showFirstRoom = function (...args) {
    const result = originalShowFirstRoom.apply(this, args);
    installManualSaveControl();
    return result;
  };
})();
