// Room 5 first playable slice. SVG drawings are replaceable asset placeholders.
// A collected object remains in the tray until the player chooses its frame.
const R5_DRAWINGS = {
 rabbit: '<ellipse cx="50" cy="66" rx="25" ry="22"/><ellipse cx="39" cy="28" rx="7" ry="23"/><ellipse cx="61" cy="28" rx="7" ry="23"/><circle cx="42" cy="58" r="2"/><circle cx="58" cy="58" r="2"/>',
 feather: '<path d="M20 82Q12 20 77 15Q89 67 20 82ZM20 82L69 27M36 63L32 41M48 51L70 52"/>',
 face: '<path d="M25 20Q50 8 75 20L70 66Q50 95 30 66Z"/><path d="M33 41Q39 35 44 41M56 41Q61 35 67 41M42 67Q50 61 58 67M50 42L46 57L53 57"/>',
 tail: '<path d="M68 20Q19 22 26 59Q29 83 64 78Q90 73 73 53Q60 40 57 54Q58 66 46 62Q39 40 69 39"/>',
 head: '<circle cx="50" cy="40" r="25"/><path d="M24 85Q25 63 50 63Q75 63 76 85M32 22Q50 0 68 22M39 40L42 40M58 40L61 40M43 54Q50 58 57 54"/>',
 wreath: '<circle cx="50" cy="50" r="27"/><path d="M26 32L13 28L20 43M48 23L47 8L61 18M74 38L88 35L81 51M71 70L82 82L64 82M35 74L23 87L22 69"/>',
 cup: '<path d="M24 23H76L70 61Q50 78 30 61ZM50 70V85M32 86H68M76 29Q97 31 83 52L73 55"/>',
 leg: '<path d="M37 15H61L59 46L48 72L72 83Q80 95 39 89L30 80L39 47Z"/>',
 gate: '<path d="M20 90V15H80V90M20 25H80M40 26V90M60 26V90M43 60H46M54 60H57"/>',
 mirror: '<rect x="22" y="9" width="56" height="77" rx="18"/><rect x="29" y="16" width="42" height="63" rx="13"/><path d="M35 90H65M50 86V90M37 30L57 23M40 40L64 30"/>'
};
const R5_FRAMES = ['feather','face','tail','head','wreath','cup','leg','gate'];
function r5Drawing(kind, label) {
 return `<svg viewBox="0 0 100 100" role="img" aria-label="${label}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${R5_DRAWINGS[kind]}</svg>`;
}
function r5NormalizeState(saved) {
 const state = saved && typeof saved === 'object' ? saved : {};
 return {mirrorCollected:!!(state.mirrorCollected || state.mirrorPlaced),mirrorPlaced:!!state.mirrorPlaced,highlightEnabled:state.highlightEnabled !== false};
}
function r5PlaceMirror(frame) {
 if(!room5State.mirrorCollected || room5State.mirrorPlaced || frame !== 'face')return false;
 room5State.mirrorPlaced=true;
 saveGame();
 return true;
}
function showFifthRoom(savedState) {
 Dialogue.stop();
 firstRoomState=undefined;room2State=undefined;room3State=undefined;room4State=undefined;
 currentScene='room05';room5State=r5NormalizeState(savedState);
 game.innerHTML=`<main class="room room-five" aria-label="第五の部屋"><header class="room-header"><p class="room-label">第五の部屋</p><p class="room-color-status">リビング</p></header><div class="room-stage-wrap"><section class="room-stage r5-stage"><div class="r5-wall-art" aria-hidden="true"></div><div class="r5-door-art" aria-hidden="true"></div><div class="r5-table-art" aria-hidden="true"></div><div class="r5-mirror-art ${room5State.mirrorCollected?'is-collected':''}" id="r5MirrorArt" aria-hidden="true">${r5Drawing('mirror','')}</div><button class="object r5-door" id="r5Door"><span>扉</span></button><button class="object r5-table" id="r5Table"><span>中央パネル</span></button><button class="object r5-mirror" id="r5Mirror"><span>${room5State.mirrorCollected?'姿見のあった場所':'姿見'}</span></button></section></div><nav class="room-navigation"><span></span><p id="r5Count"></p><span></span></nav><p class="explore-status" id="exploreStatus">気になる場所をタップしてください。</p></main>`;
 document.getElementById('r5Table').onclick=r5OpenBoard;
 document.getElementById('r5Mirror').onclick=r5InspectMirror;
 document.getElementById('r5Door').onclick=()=>showRoomNotice('扉はまだ開かない。','r5-door-locked');
 if(window.GameplayUI)GameplayUI.installRoom({sceneId:'room05',title:'第五の部屋',objective:()=>room5State.mirrorCollected&&!room5State.mirrorPlaced?'入手したパネルを中央の枠へ配置する':'絵のパネルを集める',getHighlights:()=>room5State.highlightEnabled,setHighlights:v=>{room5State.highlightEnabled=!!v;saveGame()}});
 const hanaButton=document.getElementById('gameplayHanaButton');
 if(hanaButton)hanaButton.disabled=true;
 r5Refresh();saveGame();
}
function r5Refresh() {
 const count=document.getElementById('r5Count');
 if(count)count.textContent=`配置済み ${room5State.mirrorPlaced?2:1} / 8`;
 document.getElementById('r5MirrorArt')?.classList.toggle('is-collected',room5State.mirrorCollected);
 const label=document.querySelector('#r5Mirror span');
 if(label)label.textContent=room5State.mirrorCollected?'姿見のあった場所':'姿見';
 window.GameplayUI?.updateObjective();
}
function r5InspectMirror() {
 if(game.querySelector('.device-overlay,.room-dialog-overlay'))return;
 if(room5State.mirrorCollected){showRoomNotice('姿見のあった場所は、空になっている。','r5-mirror-empty');return;}
 showRoomDialog([{logId:'r5-mirror-reflection',logType:'investigation',speaker:'ト書き',text:'姿見には、部屋もハナも、自分の身体も映っている。けれど、自分の顔だけが白く滲んで見えない。'}],()=>{
  const overlay=document.createElement('div');overlay.className='device-overlay r5-inspect-overlay';
  overlay.innerHTML=`<section class="r5-inspect"><button class="device-close" aria-label="閉じる">×</button><h2>姿見</h2><div class="r5-reflection" aria-hidden="true">${r5Drawing('mirror','')}<i></i></div><button class="r5-touch">鏡に触れる</button></section>`;
  game.appendChild(overlay);const close=activateDeviceModal(overlay,'r5Mirror',overlay.querySelector('.r5-touch'));
  overlay.querySelector('.r5-touch').onclick=()=>{
   close();if(room5State.mirrorCollected)return;
   room5State.mirrorCollected=true;saveGame();
   const acquiredState=room5State;
   const art=document.getElementById('r5MirrorArt');art?.classList.add('is-transforming');
   GameAudio.stopAll();
   setTimeout(()=>{if(currentScene!=='room05'||room5State!==acquiredState||!document.getElementById('r5MirrorArt'))return;r5Refresh();showRoomDialog([{logId:'r5-mirror-transform',logType:'investigation',speaker:'ト書き',text:'触れた鏡面に波紋が広がる。周囲の音が途切れ、姿見が縮み、一枚のパネルになった。'},{logId:'r5-mirror-acquired',logType:'narration',speaker:'システム',text:'【鏡のパネルを手に入れた】'}]);},650);
  };
 });
}
function r5OpenBoard() {
 if(game.querySelector('.device-overlay,.room-dialog-overlay'))return;
 const overlay=document.createElement('div');overlay.className='device-overlay r5-board-overlay';
 overlay.innerHTML=`<section class="r5-board-ui" aria-label="中央パネル"><button class="device-close" aria-label="閉じる">×</button><h2>中央パネル</h2><p>手元のパネルを選び、枠をタップしてください。ドラッグでも置けます。</p><div class="r5-frames"></div><div class="r5-tray"></div><p class="r5-feedback" role="status" aria-live="polite"></p></section>`;
 game.appendChild(overlay);activateDeviceModal(overlay,'r5Table',overlay.querySelector('.device-close'));
 const frames=overlay.querySelector('.r5-frames'),tray=overlay.querySelector('.r5-tray'),feedback=overlay.querySelector('.r5-feedback');
 let selected=false;
 const place=frame=>{
  if(!selected)return;
  if(r5PlaceMirror(frame)){selected=false;draw();feedback.textContent='鏡のパネルが枠に吸い込まれ、絵がひとつになった。';r5Refresh();}
  else{selected=false;tray.querySelector('button')?.setAttribute('aria-pressed','false');feedback.textContent='パネルは枠にはまらず、手元に戻った。';}
 };
 function draw(){
  frames.innerHTML=R5_FRAMES.map((kind,i)=>{const placed=i===0||(kind==='face'&&room5State.mirrorPlaced);return `<button class="r5-frame ${placed?'is-filled':''}" data-frame="${kind}" aria-label="枠${i+1}${placed?' 配置済み':''}" ${placed?'disabled':''}>${r5Drawing(kind,['羽の絵','顔の絵','尾の絵','頭の絵','輪の絵','杯の絵','脚の絵','門の絵'][i])}${placed?`<span class="r5-placed">${r5Drawing(i===0?'rabbit':'mirror',i===0?'うさぎのパネル':'鏡のパネル')}</span>`:''}</button>`}).join('');
  frames.querySelectorAll('[data-frame]').forEach(button=>button.onclick=()=>place(button.dataset.frame));
  tray.innerHTML=room5State.mirrorCollected&&!room5State.mirrorPlaced?`<button class="r5-tile" aria-label="鏡のパネルを選ぶ" aria-pressed="false">${r5Drawing('mirror','鏡のパネル')}<span>鏡のパネル</span></button>`:`<p>${room5State.mirrorPlaced?'鏡のパネルは配置済み。':'手元にパネルはない。'}</p>`;
  const tile=tray.querySelector('button');if(!tile)return;
  tile.onclick=()=>{selected=!selected;tile.setAttribute('aria-pressed',String(selected));feedback.textContent=selected?'置きたい枠をタップしてください。':'';};
  let drag=null;
  tile.onpointerdown=event=>{if(event.button!==0)return;drag={x:event.clientX,y:event.clientY,id:event.pointerId,moved:false};tile.setPointerCapture(event.pointerId);};
  tile.onpointermove=event=>{if(!drag)return;if(Math.hypot(event.clientX-drag.x,event.clientY-drag.y)>8){drag.moved=true;tile.classList.add('is-dragging');}};
  tile.onpointerup=event=>{if(!drag)return;const moved=drag.moved;drag=null;tile.classList.remove('is-dragging');if(!moved)return;event.preventDefault();selected=true;const target=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-frame]');place(target&&!target.disabled?target.dataset.frame:null);tile.onclick=null;setTimeout(()=>{if(tile.isConnected)tile.onclick=()=>{selected=!selected;tile.setAttribute('aria-pressed',String(selected));};},0);};
  tile.onpointercancel=()=>{drag=null;tile.classList.remove('is-dragging');};
 }
 draw();
}
