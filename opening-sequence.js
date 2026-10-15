// Opening visual layer.
// Scene states follow the displayed text. Darkness remains through opening_04.
// Two eyelid masks reveal a white horizontal slit, then open upward/downward.
// The visual animation never advances scenario text on its own.

let openingFreshRun = false;
let openingWhiteFadeStarted = false;

function openingBackgroundForIndex(index) {
  if (index <= 0) return "#f00";
  if (index <= 3) return "#000";
  return "#fff";
}

function updateOpeningVisual(index) {
  const opening = document.querySelector(".opening");
  if (!opening) return;
  opening.style.opacity = "1";
  opening.style.animation = "none";
  opening.style.transition = "none";
  opening.style.backgroundColor = openingBackgroundForIndex(index);
  if(index >= 4){
    openingWhiteFadeStarted = true;
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

  game.innerHTML = `<div class="opening" style="opacity:1;animation:none;background:${initialBackground}"><div id="openingWorld" class="pixel-opening-world"><div class="pixel-opening-background"></div><div class="pixel-opening-veil"></div><div class="pixel-opening-door"><svg viewBox="0 0 216 360" shape-rendering="crispEdges"><path fill="#7d8999" d="M0 0h216v360H0z"/><path fill="#a5afbd" d="M3 3h210v357H3z"/><path fill="#c2cad5" d="M9 9h198v351H9z"/><path fill="#e6e9ed" d="M12 12h192v348H12z"/><path fill="#a0aabb" d="M21 21h174v339H21z"/><path fill="#fffdf5" d="M24 24h168v336H24z"/><path fill="#f5f5f5" d="M12 12h192v3H15v345h-3z"/><path fill="#8591a3" d="M204 12h3v348h-3z"/></svg><svg class="door-panel" viewBox="0 0 168 336" shape-rendering="crispEdges"><path fill="#a4afbe" d="M0 0h168v336H0z"/><path fill="#d0d5dd" d="M3 3h162v330H3z"/><path fill="#ecedf0" d="M12 12h144v312H12z"/><path fill="#fafafa" d="M12 12h144v3H15v309h-3z"/><path fill="#bdc5d0" d="M153 15h3v309H12v-3h141z"/><path fill="#aeb8c6" d="M21 24h126v114H21zM21 174h126v132H21z"/><path fill="#f7f8f9" d="M24 27h120v108H24zM24 177h120v126H24z"/><path fill="#d9dfe6" d="M27 30h117v105H27zM27 180h117v123H27z"/><path fill="#e9ecf0" d="M30 33h111v99H30zM30 183h111v117H30z"/><path fill="#adb7c5" d="M132 153h15v21h-15z"/><path fill="#e7eaf0" d="M135 156h9v15h-9z"/><path fill="#6b788b" d="M117 159h30v6h-30z"/><path fill="#a3afc0" d="M117 159h27v3h-27z"/></svg></div><div id="character-area" class="pixel-opening-hana" hidden><img id="openingHanaSprite" alt="白髪の女性" src="images/characters/hana-hires/idle/01.webp"><img id="openingBubble" alt="" hidden></div><div class="pixel-opening-whiteout"></div></div><div class="room-dialog-overlay"><div class="dialog room-dialog" id="dialog" style="display:none"><div class="dialog-message-area" id="messageArea"></div><div class="dialog-log-area" id="openingLogArea" role="region" aria-label="テキスト履歴" tabindex="0" hidden></div><div class="dialog-controls"><button type="button" class="auto-button" id="openingAutoButton" aria-pressed="false">AUTO OFF</button><button type="button" class="skip-button" id="openingSkipButton" aria-pressed="false" disabled>SKIP</button><button type="button" class="log-button" id="openingLogButton" aria-pressed="false" aria-expanded="false" aria-controls="openingLogArea">LOG</button><button type="button" class="next-button" id="nextButton" aria-label="次へ">▶</button></div></div></div></div>`;

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
  return {id:original?.logId,phase:at===0?'red':at<=order('opening_04')?'black':at<order('opening_07')?'white':'room',
    hana:at>=order('opening_14')&&at<order('opening_31'),
    view:at>=order('opening_31')?'door':at>=order('opening_14')?'hana':'front',
    door:at>=order('opening_31'),open:at>=order('opening_39'),whiteout:at>=order('opening_41'),
    emotion:({'opening_18':'sadness','opening_24_response':'sadness','opening_27':'joy'})[original?.logId]||'idle',
    bubble:({'opening_18':'sweat','opening_19':'question','opening_29':'thinking'})[original?.logId]||''};
}
function updatePixelOpening(line) {
  const opening=document.querySelector('.opening'),world=document.getElementById('openingWorld');
  if(!opening||!world)return;
  const v=pixelOpeningState(line),previous=opening.dataset.view,previousPhase=opening.dataset.phase;
  if(previousPhase==='black'&&v.phase==='white')opening.dataset.eyeOpening='true';
  opening.dataset.phase=v.phase;opening.dataset.hanaVisible=String(v.hana&&!v.whiteout);opening.dataset.view=v.view;
  world.querySelector('.pixel-opening-door').classList.toggle('visible',v.door);
  world.querySelector('.pixel-opening-door').classList.toggle('open',v.open);
  world.querySelector('.pixel-opening-whiteout').classList.toggle('visible',v.whiteout);
  document.getElementById('character-area').hidden=!v.hana||v.whiteout;
  const sprite=document.getElementById('openingHanaSprite');sprite.dataset.emotion=v.emotion;
  if(v.emotion!=='idle')sprite.src='images/characters/hana-hires/idle/01.webp';
  const bubble=document.getElementById('openingBubble');bubble.hidden=!v.bubble||!v.hana;
  if(!bubble.hidden){bubble.src='images/pixel-ui/bubbles-side/right/'+v.bubble+'.png';bubble.alt=v.bubble==='question'?'疑問':v.bubble==='thinking'?'考え中':'困惑'}
  if(previous&&previous!==v.view&&!matchMedia('(prefers-reduced-motion: reduce)').matches){world.classList.remove('is-turning');void world.offsetWidth;world.classList.add('is-turning')}
  window.DesignUI?.displayLine(line,Dialogue.kindOf?.(line)||(['ハナ','花音'].includes(line.speaker)?'heroine':'narration'));
}
function startOpeningIdle() {
  const sprite=document.getElementById('openingHanaSprite');if(!sprite)return;
  const start=performance.now();let last='';
  const sequence=[[1,3800],[3,90],[4,100],[3,90],[1,150]];
  function animate(now){
    if(!sprite.isConnected)return;
    if(sprite.dataset.emotion==='idle'&&!document.hidden&&!game.querySelector('.design-overlay,.is-log-open')){
      let frame=1,t=(now-start)%4230;
      if(!matchMedia('(prefers-reduced-motion: reduce)').matches)for(const [f,ms] of sequence){if(t<ms){frame=f;break}t-=ms}
      const path='images/characters/hana-hires/idle/0'+frame+'.webp';if(path!==last||!sprite.src.endsWith(path)){sprite.src=path;last=path}
    }
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}
