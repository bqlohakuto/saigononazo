// First-visit notes; confirmation is independent of progress and save deletion.
(() => {
  "use strict";
  const STORAGE_KEY = "saigononazo-first-visit-notice-v1";
  const OVERLAY_ID = "firstVisitNotice";
  const title = game.querySelector(".title-home");
  if (!title) return;

  try {
    if (localStorage.getItem(STORAGE_KEY) === "accepted") return;
  } catch (_) {
    // Still show the notice when storage is unavailable.
  }

  const overlay = document.createElement("div");
  overlay.id = OVERLAY_ID;
  overlay.className = "first-visit-overlay";
  overlay.innerHTML = `
    <section class="first-visit-panel" role="dialog" aria-modal="true"
             aria-labelledby="firstVisitTitle" aria-describedby="firstVisitLead">
      <header class="first-visit-header">
        <span class="first-visit-eyebrow">BEFORE PLAYING</span>
        <h2 id="firstVisitTitle">プレイ前のご案内</h2>
        <p id="firstVisitLead">『最後の謎が解けるまで』を遊ぶ前にご確認ください。</p>
      </header>
      <div class="first-visit-notes">
        <p><strong>画面について</strong>スマートフォンでは横画面でのみプレイできます。端末を横向きにしてお楽しみください。</p>
        <p><strong>音について</strong>BGM・効果音が流れます。音量はタイトル画面の「設定」から調整できます。</p>
        <p><strong>セーブについて</strong>進行状況はこのブラウザ内に保存されます。サイトデータを削除するとセーブが失われます。プライベートブラウズでは保存が残らない場合があります。</p>
      </div>
      <div class="first-visit-footer">
        <button type="button" id="firstVisitAccept">確認してはじめる</button>
      </div>
    </section>`;

  // Do not allow the title controls behind the initial notice to be activated.
  const priorInert = title.inert;
  title.inert = true;
  game.appendChild(overlay);
  const button = overlay.querySelector("#firstVisitAccept");

  function keepFocus(event) {
    if (event.key === "Tab" || event.key === "Escape") {
      event.preventDefault();
      event.stopImmediatePropagation();
      button.focus({ preventScroll: true });
    }
  }

  function accept() {
    // Confirmation is the only time this flag is written. It is intentionally
    // not erased by the completed-game progress reset.
    try { localStorage.setItem(STORAGE_KEY, "accepted"); } catch (_) {}
    document.removeEventListener("keydown", keepFocus, true);
    title.inert = priorInert;
    overlay.remove();
    title.querySelector("#startButton")?.focus({ preventScroll: true });
  }

  document.addEventListener("keydown", keepFocus, true);
  button.addEventListener("click", accept);
  button.focus({ preventScroll: true });
})();
