// Opening visual layer.
// The red / black / white states now follow the currently displayed text,
// instead of advancing on fixed timers. Only the black -> white transition
// keeps a duration as a visual effect; it never blocks dialogue progression.

let openingFreshRun = false;
let openingWhiteFadeStarted = false;

function openingBackgroundForIndex(index) {
  if (index <= 0) return "#f00";
  if (index === 1) return "#000";
  return "#fff";
}

function updateOpeningVisual(index) {
  const opening = document.querySelector(".opening");
  if (!opening) return;

  opening.style.opacity = "1";
  opening.style.animation = "none";

  if (index === 0) {
    opening.style.transition = "none";
    opening.style.backgroundColor = "#f00";
    return;
  }

  if (index === 1) {
    opening.style.transition = "none";
    opening.style.backgroundColor = "#000";
    return;
  }

  // When the third line appears, the darkness fades into white.
  // The text itself remains player/AUTO controlled; this transition does not
  // schedule or advance any scenario line.
  if (openingFreshRun && !openingWhiteFadeStarted) {
    openingWhiteFadeStarted = true;
    opening.style.transition = `background-color ${FADE_TIME}ms ease`;
    opening.style.backgroundColor = "#fff";
    GameAudio.stop("tinnitus");
    return;
  }

  // Continue-from-save opens directly at the visual state for that line.
  if (!openingFreshRun) {
    opening.style.transition = "none";
    opening.style.backgroundColor = "#fff";
    GameAudio.stop("tinnitus");
  }
}

function flashRed() {
  playerName = document.getElementById("playerName").value.trim() || "主人公";
  GameAudio.stopAll();
  GameAudio.play("tinnitus");
  openingFreshRun = true;
  openingWhiteFadeStarted = false;
  showOpening(0);
}

function showOpening(startIndex = 0) {
  const initialBackground = openingBackgroundForIndex(startIndex);

  game.innerHTML = `<div class="opening" style="opacity:1;animation:none;background:${initialBackground}"><div id="character-area"></div><div class="dialog" id="dialog" style="display:none"><div class="dialog-message-area" id="messageArea"></div><div class="dialog-log-area" id="openingLogArea" role="region" aria-label="テキスト履歴" tabindex="0" hidden></div><div class="dialog-controls"><button type="button" class="auto-button" id="openingAutoButton" aria-pressed="false">AUTO OFF</button><button type="button" class="log-button" id="openingLogButton" aria-pressed="false" aria-expanded="false" aria-controls="openingLogArea">LOG</button><button type="button" class="next-button" id="nextButton" aria-label="次へ">▶</button></div></div></div>`;

  const dialog = document.getElementById("dialog");
  if (!dialog) return;
  dialog.style.display = "flex";

  const lines = expandScenario(openingScenario);
  Dialogue.start({
    lines,
    startIndex,
    messageArea: document.getElementById("messageArea"),
    nextButton: document.getElementById("nextButton"),
    autoButton: document.getElementById("openingAutoButton"),
    logButton: document.getElementById("openingLogButton"),
    logArea: document.getElementById("openingLogArea"),
    dialog,
    getTextSpeed: () => settings.textSpeed,
    onDisplay: (line, index) => {
      openingIndex = index;
      updateOpeningVisual(index);
      recordLog(line);
    },
    onComplete: () => {
      openingFreshRun = false;
      openingWhiteFadeStarted = false;
      endOpening();
    }
  });
}
