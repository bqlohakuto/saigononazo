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
      .hana-choice-menu{width:min(500px,100%)}
      .hana-choice-menu h2{margin-bottom:8px}
      .hana-choice-lead{margin-bottom:20px;color:#62675f;font-size:15px;line-height:1.6}
      .hana-choice-list{display:grid;gap:10px}
      .hana-choice-button{width:100%;min-height:52px;padding:11px 16px;border:1px solid #b8bdb4;border-radius:8px;background:#fff;color:#30352e;font:inherit;font-size:18px;text-align:left;cursor:pointer}
      .hana-choice-button:hover{background:#f2f5ef}
      .hana-choice-button:focus-visible{outline:3px solid #2563eb;outline-offset:2px}
      .hana-choice-button.is-cancel{margin-top:4px;color:#666;background:#f3f3f1}
      @media(max-width:768px){.hana-choice-menu{padding:42px 20px 24px}.hana-choice-button{min-height:48px;font-size:16px}}
    `;
    document.head.appendChild(style);
  }

  function hanaHasIntroducedHerself() {
    if (typeof firstRoomState?.hanaIntroduced === "boolean") return firstRoomState.hanaIntroduced;
    return Number(firstRoomState?.hanaVisits || 0) > 0;
  }

  function getHanaChoices() {
    const choices = [];
    const introduced = hanaHasIntroducedHerself();

    if (!introduced) {
      choices.push({
        id: "about-hana",
        label: "あなたについて",
        lines: firstRoomScenario.hanaFirst,
        onComplete() {
          firstRoomState.hanaIntroduced = true;
        }
      });
    }

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
    const choices = getHanaChoices();
    const overlay = document.createElement("div");
    overlay.className = "device-overlay hana-choice-overlay";
    overlay.innerHTML = `
      <section class="menu-panel hana-choice-menu" aria-label="ハナに聞くことを選ぶ">
        <button type="button" class="device-close" aria-label="閉じる">×</button>
        <h2>ハナに何を聞く？</h2>
        <p class="hana-choice-lead">聞きたいことを選んでください。</p>
        <div class="hana-choice-list"></div>
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
        });
      });
    });
  }

  // script.js attaches this function when showFirstRoom() runs, so replacing
  // the global binding here changes only the first-room Hana interaction.
  talkToHana = showHanaChoiceMenu;
})();
