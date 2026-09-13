// Opening cinematic timing layer.
// Keeps the established 1s red flash -> 1s blackout -> 3s white fade -> 2s pause,
// while the first two finalized narration lines are shown with those visual beats.

const openingSequenceLines = expandScenario(openingScenario);

function renderOpeningCinematic(className, line, index) {
  Dialogue.stop();
  openingIndex = index;

  game.innerHTML = `<div class="${className}" id="openingCinematicFrame"><div id="openingCinematicCaption"></div></div>`;

  const frame = document.getElementById("openingCinematicFrame");
  const caption = document.getElementById("openingCinematicCaption");

  Object.assign(frame.style, {
    position: "relative",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    padding: "20px"
  });

  Object.assign(caption.style, {
    width: "min(900px, calc(100% - 16px))",
    marginBottom: "max(20px, env(safe-area-inset-bottom))",
    padding: "16px 20px",
    border: "2px solid rgba(220,220,220,.9)",
    borderRadius: "18px",
    background: "rgba(248,248,248,.94)",
    color: "#333",
    fontSize: "clamp(20px, 3vw, 30px)",
    lineHeight: "1.8",
    textAlign: "left",
    overflowWrap: "anywhere",
    boxShadow: "0 5px 20px rgba(0,0,0,.2)"
  });

  caption.textContent = line.text;
  recordLog(line);
}

function flashRed() {
  playerName = document.getElementById("playerName").value.trim() || "主人公";
  GameAudio.stopAll();
  GameAudio.play("tinnitus");
  renderOpeningCinematic("flash", openingSequenceLines[0], 0);
  setTimeout(showBlack, FLASH_TIME);
}

function showBlack() {
  renderOpeningCinematic("black", openingSequenceLines[1], 1);
  setTimeout(showFade, BLACK_TIME);
}

function showFade() {
  // The remaining scenario begins after the white fade has completed and
  // two seconds of stillness have passed.
  showOpening(2, { delay: FADE_TIME + TEXT_DELAY, cinematic: true });
  const opening = document.querySelector(".opening");
  if (opening) opening.classList.add("fade-in");

  // The tinnitus sound is intended to last five seconds total:
  // red 1s + black 1s + white fade 3s.
  setTimeout(() => GameAudio.stop("tinnitus"), FADE_TIME);
}

function showOpening(startIndex = 0, options = {}) {
  const delay = Number.isFinite(options.delay) ? Math.max(0, options.delay) : 0;
  const cinematic = !!options.cinematic;

  game.innerHTML = `<div class="opening"><div id="character-area"></div><div class="dialog" id="dialog" style="display:none"><div class="dialog-message-area" id="messageArea"></div><div class="dialog-log-area" id="openingLogArea" role="region" aria-label="テキスト履歴" tabindex="0" hidden></div><div class="dialog-controls"><button type="button" class="auto-button" id="openingAutoButton" aria-pressed="false">AUTO OFF</button><button type="button" class="log-button" id="openingLogButton" aria-pressed="false" aria-expanded="false" aria-controls="openingLogArea">LOG</button><button type="button" class="next-button" id="nextButton" aria-label="次へ">▶</button></div></div></div>`;

  const opening = document.querySelector(".opening");
  if (!cinematic && opening) {
    // Continue-from-save should return immediately to the current line,
    // rather than replaying the five-second opening fade.
    opening.style.opacity = "1";
    opening.style.animation = "none";
  }

  const beginDialogue = () => {
    const dialog = document.getElementById("dialog");
    if (!dialog) return;
    dialog.style.display = "flex";
    startScenario(openingScenario, startIndex);
  };

  if (delay > 0) setTimeout(beginDialogue, delay);
  else beginDialogue();
}
