// Room 1: Hana topic selection.
// Loaded after script.js so the room's original talkToHana handler is replaced
// before the player can enter or resume the first room.
(() => {
  const STYLE_ID = "hana-choice-style";

  function ensureHanaChoiceStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .hana-choice-overlay{place-items:end center;padding:18px 18px 76px;background:rgba(20,18,17,.38)}
      .hana-choice-menu{width:min(720px,100%);padding:22px 24px 24px;border:1px solid rgba(151,129,120,.35);border-radius:18px;background:rgba(250,247,242,.97);box-shadow:0 16px 36px rgba(24,20,18,.28);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
      .hana-choice-speaker{margin:0 52px 3px 0;color:#8a5b68;font-size:14px;font-weight:bold;letter-spacing:.08em}
      .hana-choice-menu h2{margin:0 52px 8px 0;color:#302b29;font-size:24px;font-weight:normal}
      .hana-choice-lead{margin-bottom:16px;color:#69635f;font-size:14px;line-height:1.6}
      .hana-choice-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
      .hana-choice-list.is-introduction{grid-template-columns:1fr}
      .hana-choice-button{width:100%;min-height:56px;padding:12px 16px;border:1px solid #c9bdb6;border-radius:10px;background:#fffdfa;color:#38312f;font:inherit;font-size:17px;text-align:left;cursor:pointer;box-shadow:0 2px 8px rgba(41,34,30,.06)}
      .hana-choice-button:hover{background:#f7efeb;border-color:#a98891}
      .hana-choice-button:focus-visible{outline:3px solid #9a6f7a;outline-offset:2px}
      .hana-choice-button.is-cancel{color:#6d6662;background:#f2f0ed}
      .hana-choice-menu .device-close{top:10px;right:12px;color:#4a4541}
      @media(max-width:768px){
        .hana-choice-overlay{padding:10px 10px 66px}
        .hana-choice-menu{padding:18px 14px 16px;border-radius:16px}
        .hana-choice-menu h2{font-size:20px}.hana-choice-lead{margin-bottom:12px;font-size:12px}
        .hana-choice-list{gap:8px}.hana-choice-button{min-height:50px;padding:10px 11px;font-size:14px}
      }
    `;
    document.head.appendChild(style);
  }

  function hanaHasIntroducedHerself() {
    if (typeof firstRoomState?.hanaIntroduced === "boolean") return firstRoomState.hanaIntroduced;
    return Number(firstRoomState?.hanaVisits || 0) > 0;
  }

  function displayedHanaName() {
    return hanaHasIntroducedHerself() ? "ハナ" : "？？？";
  }

  function getHanaChoices() {
    const introduced = hanaHasIntroducedHerself();

    // Until she gives her name, nothing except "あなたについて" is available.
    if (!introduced) {
      return [{
        id: "about-hana",
        label: "あなたについて",
        lines: firstRoomScenario.hanaFirst,
        onComplete() {
          firstRoomState.hanaIntroduced = true;
          window.HanaIdentity?.refresh?.();
        }
      }];
    }

    const choices = [];
    if (firstRoomState.questionSeen) {
      choices.push({
        id: "question",
        label: "問題文について",
        lines: firstRoomScenario.hanaAfterQuestion
      });
    } else {
      choices.push({
        id: "door",
        label: "扉について",
        lines: firstRoomScenario.hanaBeforeQuestion
      });
    }

    if (
      firstRoomState.questionSeen &&
      firstRoomState.pianoAttempted &&
      hasCheckedAllMail("inbox") &&
      !hasCheckedAllMail("sent")
    ) {
      choices.push({
        id: "hint",
        label: firstRoomState.mailHintGiven ? "ヒントをもう一度聞く" : "ヒントがほしい",
        lines: firstRoomScenario.hanaMailHint,
        onComplete() {
          firstRoomState.mailHintGiven = true;
        }
      });
    }

    choices.push({id: "cancel", label: "なんでもない", cancel: true});
    return choices;
  }

  function showHanaChoiceMenu() {
    if (!firstRoomState || game.querySelector(".inspection-overlay,.room-dialog-overlay,.device-overlay")) return;

    ensureHanaChoiceStyle();
    const introduced = hanaHasIntroducedHerself();
    const speakerName = displayedHanaName();
    const choices = getHanaChoices();
    const overlay = document.createElement("div");
    overlay.className = "device-overlay hana-choice-overlay";
    overlay.innerHTML = `
      <section class="menu-panel hana-choice-menu" aria-label="${speakerName}に聞くことを選ぶ">
        <button type="button" class="device-close" aria-label="閉じる">×</button>
        <p class="hana-choice-speaker">${speakerName}</p>
        <h2>何を聞く？</h2>
        <p class="hana-choice-lead">聞きたいことを選んでください。</p>
        <div class="hana-choice-list${introduced ? "" : " is-introduction"}"></div>
      </section>`;
    game.appendChild(overlay);

    const list = overlay.querySelector(".hana-choice-list");
    choices.forEach(choice => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `hana-choice-button${choice.cancel ? " is-cancel" : ""}`;
      button.textContent = choice.label;
      button.dataset.choice = choice.id;
      list.appendChild(button);
    });

    const firstButton = list.querySelector("button");
    const close = activateDeviceModal(overlay, "hanaButton", firstButton);

    list.querySelectorAll(".hana-choice-button").forEach(button => {
      button.addEventListener("click", event => {
        event.stopPropagation();
        const choice = choices.find(item => item.id === button.dataset.choice);
        if (!choice) return;
        close();
        if (choice.cancel) return;

        showRoomDialog(choice.lines, () => {
          firstRoomState.hanaVisits = Number(firstRoomState.hanaVisits || 0) + 1;
          choice.onComplete?.();
          saveGame();
          window.HanaIdentity?.refresh?.();
        });
      });
    });
  }

  // script.js attaches this function when showFirstRoom() runs, so replacing
  // the global binding here changes only the first-room Hana interaction.
  talkToHana = showHanaChoiceMenu;
})();
