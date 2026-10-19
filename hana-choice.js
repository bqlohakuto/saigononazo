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
      .hana-choice-overlay{place-items:end center;padding:18px 18px 76px;background:rgba(20,39,49,.36)}
      .hana-choice-menu{width:min(720px,100%);padding:22px 24px 24px;border:1px solid #b9d5e2;border-radius:18px;background:rgba(248,253,255,.98);box-shadow:0 16px 36px rgba(22,54,70,.25);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
      .hana-choice-speaker{margin:0 52px 3px 0;color:#8a4058;font-size:14px;font-weight:bold;letter-spacing:.08em}
      .hana-choice-menu h2{margin:0 52px 8px 0;color:#302b29;font-size:24px;font-weight:normal}
      .hana-choice-lead{margin-bottom:16px;color:#69635f;font-size:14px;line-height:1.6}
      .hana-choice-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
      .hana-choice-list.is-introduction{grid-template-columns:1fr}
      .hana-choice-button{width:100%;min-height:56px;padding:12px 16px;border:1px solid #b8ced9;border-radius:10px;background:#fff;color:#2f414a;font:inherit;font-size:17px;text-align:left;cursor:pointer;box-shadow:0 2px 8px rgba(31,70,89,.06)}
      .hana-choice-button:hover{background:#eef8fc;border-color:#7fabbf}
      .hana-choice-button:focus-visible{outline:3px solid #367da0;outline-offset:2px}
      .hana-choice-button.is-cancel{color:#2f414a;background:#fff}
      .hana-choice-menu .device-close{top:10px;right:12px;color:#4a4541}
      .hana-scale-reference-overlay{place-items:center;padding:12px;background:rgba(20,39,49,.55)}
      .hana-scale-reference-menu{width:min(480px,100%);max-height:85vh;max-height:85dvh;overflow-y:auto;position:relative}
      .hana-scale-reference-table{width:100%;border-collapse:collapse;margin:8px 0 12px;color:#2f414a;font-size:15px}
      .hana-scale-reference-table th,.hana-scale-reference-table td{border-bottom:1px solid #c8d8df;padding:6px 10px;text-align:left}
      .hana-scale-reference-table thead th{background:#ebf4f6}
      .hana-scale-reference-table tbody th{width:68px;color:#8a4058}
      .hana-scale-reference-note{font-size:12px;line-height:1.6;color:#69635f}
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
    return window.HanaIdentity?.getName() || (hanaHasIntroducedHerself() ? "ハナ" : "？？？");
  }

  function hasViewedChoice(choice) {
    if (choice.cancel) return false;
    if (choice.reference) return GameLog.has("room1_hana_scale_reference_viewed");
    const lines = choice.id === "about-hana"
      ? [...firstRoomScenario.hanaFirst, ...firstRoomScenario.hanaAbout]
      : choice.lines;
    return Array.isArray(lines) && expandScenario(lines).some(line => GameLog.has(line.logId));
  }

  function showScaleReference() {
    if (!firstRoomState?.questionSeen || Number(firstRoomState.hintLevel || 0) < firstRoomScenario.hanaHints.length || firstRoomState.melodySolved || firstRoomState.doorUnlocked) return;
    ensureHanaChoiceStyle();
    const rows = firstRoomScenario.scaleReference.map(({note,example}) => `<tr><th scope="row">${note}</th><td>${example}</td></tr>`).join("");
    const overlay = document.createElement("div");
    overlay.className = "device-overlay hana-scale-reference-overlay";
    overlay.innerHTML = `<section class="hana-choice-menu hana-scale-reference-menu" aria-label="音階の参考">
      <button type="button" class="device-close" aria-label="閉じる">×</button>
      <p class="hana-choice-speaker">参考資料</p>
      <h2>音階の参考</h2>
      <p class="hana-choice-lead">それぞれの音から連想できる言葉の例だよ。</p>
      <table class="hana-scale-reference-table"><thead><tr><th scope="col">音</th><th scope="col">連想する言葉の例</th></tr></thead><tbody>${rows}</tbody></table>
      <p class="hana-scale-reference-note">※音階順の参考表です。メールの順番や、答えとなる8音の並びは示していません。</p>
    </section>`;
    game.appendChild(overlay);
    recordLog({logId:"room1_hana_scale_reference_viewed",logType:"investigation",speaker:"システム",text:"音階の参考表を確認した。"});
    activateDeviceModal(overlay, "hanaButton", overlay.querySelector(".device-close"));
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

    const choices = [
      {id: "about-hana", label: "あなたについて", lines: firstRoomScenario.hanaAbout},
      {id: "about-room", label: "この部屋について", lines: firstRoomScenario.hanaRoom}
    ];
    if (!firstRoomState.questionSeen) {
      choices.push({id: "first-puzzle", label: "最初の謎について", lines: firstRoomScenario.hanaFirstPuzzle});
    }
    if (firstRoomState.posterInspected) {
      choices.push({id: "poster", label: "ポスターについて", lines: firstRoomScenario.hanaPoster});
    }
    const mailSeen = firstRoomState.openedInbox.size + firstRoomState.openedSent.size > 0;
    if (mailSeen) {
      choices.push({id: "phone", label: "携帯電話について", lines: firstRoomScenario.hanaPhone});
    }
    if (firstRoomState.pianoIntroductionSeen || firstRoomState.pianoAttempted) {
      choices.push({id: "piano", label: "ピアノについて", lines: firstRoomScenario.hanaPiano});
    }
    if (firstRoomState.questionSeen && !firstRoomState.doorUnlocked && !firstRoomState.melodySolved) {
      // ヒントは調査状況と無関係に、直前の段階を読んだ後で一つずつ解放する。
      const available = Math.min(firstRoomScenario.hanaHints.length, Math.max(1, Number(firstRoomState.hintLevel || 0) + 1));
      for (let level = 1; level <= available; level++) {
        choices.push({
          id: `hint-${level}`,
          label: `扉の謎について（ヒント${level}）`,
          lines: firstRoomScenario.hanaHints[level - 1],
          onComplete() {
            firstRoomState.hintLevel = Math.max(Number(firstRoomState.hintLevel || 0), level);
            if (level >= 3) firstRoomState.mailHintGiven = true;
          }
        });
      }
      if (Number(firstRoomState.hintLevel || 0) >= firstRoomScenario.hanaHints.length) {
        choices.push({id: "scale-reference", label: "音階の参考を確認する", reference: true});
      }
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
        <h2>どうしたの？</h2>
        <p class="hana-choice-lead">聞きたいことを選んでください。</p>
        <div class="hana-choice-list${introduced ? "" : " is-introduction"}"></div>
      </section>`;
    game.appendChild(overlay);

    const list = overlay.querySelector(".hana-choice-list");
    choices.forEach(choice => {
      const button = document.createElement("button");
      const viewed = hasViewedChoice(choice);
      button.type = "button";
      button.className = `hana-choice-button${choice.cancel ? " is-cancel" : ""}${viewed ? " is-viewed" : ""}`;
      button.textContent = choice.label;
      button.dataset.choice = choice.id;
      if (viewed) button.setAttribute("aria-label", `${choice.label}（選択済み）`);
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
        if (choice.reference) { showScaleReference(); return; }

        showRoomDialog(choice.lines, () => {
          firstRoomState.hanaVisits = Number(firstRoomState.hanaVisits || 0) + 1;
          choice.onComplete?.();
          refreshFirstRoomNavigation();
          saveGame();
          window.HanaIdentity?.refresh?.();
        });
      });
    });
  }

  // script.js attaches this function when showFirstRoom() runs, so replacing
  // the global binding here changes only the first-room Hana interaction.
  window.HanaChoiceUI = { ensureStyle: ensureHanaChoiceStyle, getAvailableChoiceIds: () => getHanaChoices().filter(choice => !choice.cancel).map(choice => choice.id) };
  talkToHana = showHanaChoiceMenu;
})();
