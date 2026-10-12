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
  currentScene="opening";
  const initialBackground = openingBackgroundForIndex(startIndex);

  game.innerHTML = `<div class="opening" style="opacity:1;animation:none;background:${initialBackground}"><div id="openingWorld" class="pixel-opening-world"><div class="pixel-opening-background"></div><div class="pixel-opening-veil"></div><div class="pixel-opening-door"><svg viewBox="0 0 72 120" shape-rendering="crispEdges"><path fill="#7d8999" d="M0 0h72v120H0z"/><path fill="#c2cad5" d="M4 4h64v116H4z"/><path fill="#fffdf5" d="M8 8h56v112H8z"/></svg><svg class="door-panel" viewBox="0 0 56 112" shape-rendering="crispEdges"><path fill="#d0d5dd" d="M0 0h56v112H0z"/><path fill="#ecedf0" d="M4 4h48v104H4z"/><path fill="#b4becb" d="M6 8h44v2H6zM6 102h44v2H6zM44 52h6v4h-6z"/></svg></div><div id="character-area" class="pixel-opening-hana" hidden><img id="openingHanaSprite" alt="白髪の女性" src="images/pixel-ui/hana-v8/idle/01.png"><img id="openingBubble" alt="" hidden></div><div class="pixel-opening-whiteout"></div></div><div class="room-dialog-overlay"><div class="dialog room-dialog" id="dialog" style="display:none"><div class="dialog-message-area" id="messageArea"></div><div class="dialog-log-area" id="openingLogArea" role="region" aria-label="テキスト履歴" tabindex="0" hidden></div><div class="dialog-controls"><button type="button" class="auto-button" id="openingAutoButton" aria-pressed="false">AUTO OFF</button><button type="button" class="skip-button" id="openingSkipButton" aria-pressed="false" disabled>SKIP</button><button type="button" class="log-button" id="openingLogButton" aria-pressed="false" aria-expanded="false" aria-controls="openingLogArea">LOG</button><button type="button" class="next-button" id="nextButton" aria-label="次へ">▶</button></div></div></div></div>`;

  const dialog = document.getElementById("dialog");
  if (!dialog) return;
  dialog.style.display = "flex";

  window.GameplayUI?.installRoom({sceneId:"opening",title:"オープニング"});
  const lines = expandScenario(openingScenario);
  window.DesignUI?.beginDialogue(lines);
  Dialogue.start({
    lines,
    startIndex,
    messageArea: document.getElementById("messageArea"),
    nextButton: document.getElementById("nextButton"),
    autoButton: document.getElementById("openingAutoButton"),
    skipButton: document.getElementById("openingSkipButton"),
    logButton: document.getElementById("openingLogButton"),
    logArea: document.getElementById("openingLogArea"),
    dialog,
    getTextSpeed: () => settings.instantText ? 0 : settings.textSpeed,
    isRead: line => GameLog.has(line.logId),
    onDisplay: (line, index) => {
      openingIndex = line.sourceIndex ?? index;
      updateOpeningVisual(openingIndex);
      updatePixelOpening(line);
      if (!line.uiPage) recordLog(line.logSource || line);
    },
    onComplete: () => {
      window.DesignUI?.endDialogue();
      openingFreshRun = false;
      openingWhiteFadeStarted = false;
      endOpening();
    }
  });
  startOpeningIdle();
}

// Port of the approved prototype: the source LOG IDs control every visual beat.
function pixelOpeningState(line) {
  const id=line.logSource?.logId||line.logId||"";
  const original=openingScenario.filter(l=>id===l.logId||id.startsWith(l.logId+"_")).sort((a,b)=>b.logId.length-a.logId.length)[0];
  const at=openingScenario.indexOf(original);
  const order=id=>openingScenario.findIndex(l=>l.logId===id);
  return {id:original?.logId,phase:at===0?'red':at===1?'black':at<6?'white':'room',
    hana:at>=order('opening_14')&&at<order('opening_31'),
    view:at>=order('opening_31')?'door':at>=order('opening_14')?'hana':'front',
    door:at>=order('opening_31'),open:at>=order('opening_39'),whiteout:at>=order('opening_41'),
    emotion:({'opening_18':'sadness','opening_24_response':'sadness','opening_27':'joy'})[original?.logId]||'idle',
    bubble:({'opening_18':'sweat','opening_19':'question','opening_29':'thinking'})[original?.logId]||''};
}
function updatePixelOpening(line) {
  const opening=document.querySelector('.opening'),world=document.getElementById('openingWorld');
  if(!opening||!world)return;
  const v=pixelOpeningState(line),previous=opening.dataset.view;
  opening.dataset.phase=v.phase;opening.dataset.hanaVisible=String(v.hana&&!v.whiteout);opening.dataset.view=v.view;
  world.querySelector('.pixel-opening-door').classList.toggle('visible',v.door);
  world.querySelector('.pixel-opening-door').classList.toggle('open',v.open);
  world.querySelector('.pixel-opening-whiteout').classList.toggle('visible',v.whiteout);
  document.getElementById('character-area').hidden=!v.hana||v.whiteout;
  const sprite=document.getElementById('openingHanaSprite');sprite.dataset.emotion=v.emotion;
  if(v.emotion!=='idle')sprite.src='images/pixel-ui/hana-v8/'+v.emotion+'.png';
  const bubble=document.getElementById('openingBubble');bubble.hidden=!v.bubble||!v.hana;
  if(!bubble.hidden){bubble.src='images/pixel-ui/bubbles-side/right/'+v.bubble+'.png';bubble.alt=v.bubble==='question'?'疑問':v.bubble==='thinking'?'考え中':'困惑'}
  if(previous&&previous!==v.view&&!matchMedia('(prefers-reduced-motion: reduce)').matches){world.classList.remove('is-turning');void world.offsetWidth;world.classList.add('is-turning')}
  window.DesignUI?.displayLine(line,Dialogue.kindOf?.(line)||(['ハナ','花音'].includes(line.speaker)?'heroine':'narration'));
}
function startOpeningIdle() {
  const sprite=document.getElementById('openingHanaSprite');if(!sprite)return;
  const start=performance.now();let last='';
  const sequence=[[1,2200],[2,900],[1,700],[3,90],[4,100],[3,90],[1,150]];
  function animate(now){
    if(!sprite.isConnected)return;
    if(sprite.dataset.emotion==='idle'&&!document.hidden&&!game.querySelector('.design-overlay,.is-log-open')){
      let frame=1,t=(now-start)%4230;
      if(!matchMedia('(prefers-reduced-motion: reduce)').matches)for(const [f,ms] of sequence){if(t<ms){frame=f;break}t-=ms}
      const path='images/pixel-ui/hana-v8/idle/0'+frame+'.png';if(path!==last||sprite.src.endsWith('/joy.png')||sprite.src.endsWith('/sadness.png')){sprite.src=path;last=path}
    }
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}
