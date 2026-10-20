const game=document.getElementById("game");
const SAVE_KEY="saigononazo-save-v1",SETTINGS_KEY="saigononazo-settings-v1";
const defaultSettings={volume:70,bgmVolume:70,seVolume:70,textSpeed:45,instantText:false,soundCaptions:false};
let playerName="";
let openingIndex=0;
let currentScene="opening";
let roomStates={};
let room2State;
let room3State;
let room4State;
let room5State;
let room6State;
let room7State;
let room8State;
let settings=loadSettings();
const FADE_TIME=3000;

// SAVE_DATA_START
const SaveData=(()=>{
 const VERSION=2;
 const isObject=value=>!!value&&typeof value==="object"&&!Array.isArray(value);
 const cleanIndex=value=>Number.isInteger(value)&&value>=0?value:0;
 const cleanLogs=value=>Array.isArray(value)?value:[];
 const cleanRooms=value=>{
  if(!isObject(value))return {};
  return Object.fromEntries(Object.entries(value).filter(([,state])=>isObject(state)).map(([id,state])=>[id,{...state}]));
 };
 function normalize(raw){
  if(!isObject(raw))return null;
  if(raw.saveVersion===VERSION){
   if(typeof raw.currentScene!=="string"||!raw.currentScene)return null;
   return {
    saveVersion:VERSION,
    playerName:typeof raw.playerName==="string"?raw.playerName:"",
    currentScene:raw.currentScene,
    opening:{index:cleanIndex(raw.opening?.index)},
    rooms:cleanRooms(raw.rooms),
    logs:cleanLogs(raw.logs)
   };
  }
  if(raw.scene==="opening"){
   return {
    saveVersion:VERSION,
    playerName:typeof raw.playerName==="string"?raw.playerName:"",
    currentScene:"opening",
    opening:{index:cleanIndex(raw.openingIndex)},
    rooms:{},
    logs:cleanLogs(raw.logs)
   };
  }
  if(raw.scene==="firstRoom"){
   return {
    saveVersion:VERSION,
    playerName:typeof raw.playerName==="string"?raw.playerName:"",
    currentScene:"room01",
    opening:{index:0},
    rooms:{room01:isObject(raw.state)?{...raw.state}:{}},
    logs:cleanLogs(raw.logs)
   };
  }
  if(raw.scene==="room2"){
   return {
    saveVersion:VERSION,
    playerName:typeof raw.playerName==="string"?raw.playerName:"",
    currentScene:"room02",
    opening:{index:0},
    rooms:{room02:isObject(raw.state)?{...raw.state}:{}},
    logs:cleanLogs(raw.logs)
   };
  }
  if(raw.scene==="room3"){
   return {saveVersion:VERSION,playerName:typeof raw.playerName==="string"?raw.playerName:"",currentScene:"room03",opening:{index:0},rooms:{room03:isObject(raw.state)?{...raw.state}:{}},logs:cleanLogs(raw.logs)};
  }
  if(raw.scene==="room4"){
   return {saveVersion:VERSION,playerName:typeof raw.playerName==="string"?raw.playerName:"",currentScene:"room04",opening:{index:0},rooms:{room04:isObject(raw.state)?{...raw.state}:{}},logs:cleanLogs(raw.logs)};
  }
  return null;
 }
 function create({playerName="",currentScene="opening",openingIndex=0,rooms={},logs=[]}={}){
  const saved={
   saveVersion:VERSION,
   playerName:typeof playerName==="string"?playerName:"",
   currentScene,
   opening:{index:cleanIndex(openingIndex)},
   rooms:cleanRooms(rooms),
   logs:cleanLogs(logs)
  };
  // Temporary aliases keep the current first-room build and older tooling compatible.
  // v2 readers always use currentScene/opening/rooms as the canonical source.
  if(currentScene==="opening"){
   saved.scene="opening";
   saved.openingIndex=saved.opening.index;
  }else if(currentScene==="room01"){
   saved.scene="firstRoom";
   saved.state={...(saved.rooms.room01||{})};
  }else if(currentScene==="room02"){
   saved.scene="room2";
   saved.state={...(saved.rooms.room02||{})};
  }else if(currentScene==="room03"){
   saved.scene="room3";
   saved.state={...(saved.rooms.room03||{})};
  }else if(currentScene==="room04"){
   saved.scene="room4";
   saved.state={...(saved.rooms.room04||{})};
  }
  return saved;
 }
 return {VERSION,normalize,create};
})();
// SAVE_DATA_END

function loadSettings(){
 try{const raw=JSON.parse(localStorage.getItem(SETTINGS_KEY))||{};return {...defaultSettings,bgmVolume:raw.volume??70,seVolume:raw.volume??70,...raw}}catch{return {...defaultSettings}}
}

function applySettings(){
 GameAudio.setVolume(1);
 GameAudio.setCategoryVolumes?.(Number(settings.bgmVolume)/100,Number(settings.seVolume)/100);
}

function saveSettings(){
 localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));
 applySettings();
}

function readSavedGame(){
 try{return SaveData.normalize(JSON.parse(localStorage.getItem(SAVE_KEY)))}catch{return null}
}

function serializeFirstRoomState(state=firstRoomState){
 if(!state)return null;
 return {...state,openedInbox:[...(state.openedInbox||[])],openedSent:[...(state.openedSent||[])]};
}

function saveGame(){
 if(firstRoomState)roomStates.room01=serializeFirstRoomState();
 if(room2State)roomStates.room02={...room2State,answer:room2State.answer.map(piece=>({...piece})),guess:room2State.guess.map(piece=>({...piece})),history:room2State.history.map(entry=>({...entry,guess:entry.guess.map(piece=>({...piece}))}))};
 if(room3State)roomStates.room03={...room3State};
 if(room5State)roomStates.room05={...room5State};
 if(room6State)roomStates.room06={...room6State,visited:Array.isArray(room6State.visited)?[...room6State.visited]:[],moves:Array.isArray(room6State.moves)?[...room6State.moves]:[]};
 if(room7State)roomStates.room07={...room7State,order:Array.isArray(room7State.order)?[...room7State.order]:[]};
 if(room8State)roomStates.room08={...room8State};
 if(room4State)roomStates.room04={...room4State,angles:Array.isArray(room4State.angles)?[...room4State.angles]:[0,0,0,0,0],rainbow:Array.isArray(room4State.rainbow)?[...room4State.rainbow]:[]};
 const saved=SaveData.create({playerName,currentScene,openingIndex,rooms:roomStates,logs:GameLog.list()});
 saved.slotMeta={savedAt:new Date().toISOString(),preview:window.DesignUI?.savePreview()||""};
 localStorage.setItem(SAVE_KEY,JSON.stringify(saved));
}

function clearSave(){
 localStorage.removeItem(SAVE_KEY);
 GameLog.restore();
 firstRoomState=undefined;
 room2State=undefined;
 room3State=undefined;
 room4State=undefined;
 room5State=undefined;
 room6State=undefined;
 room7State=undefined;
 room8State=undefined;
 openingIndex=0;
 currentScene="opening";
 roomStates={};
}

function recordLog(line){
 GameLog.record({...line,logRoom:line.logRoom||currentScene,logGroup:line.logGroup||window.DesignUI?.dialogueGroup||null,logTarget:line.logTarget||window.DesignUI?.inspectionTarget||null});
 saveGame();
}

// Direct displays (mail, status, puzzle results) use the same registration path.
function showLoggedText(element,text,logId,logType="investigation",logColor="#333333"){
 if(element)element.textContent=text;
 recordLog({logId,logType,text,speaker:"システム",logColor});
}

applySettings();

function splitIntoSentences(text){
 return text.split(/\n+/).flatMap(part=>{
  const sentences=part.match(/[^。！？]+[。！？]+|[^。！？]+/g)||[];
  return sentences.map(sentence=>sentence.trim()).filter(Boolean);
 });
}

function expandScenario(lines){
 return lines.flatMap(line=>splitIntoSentences(line.text).map((text,index)=>({...line,text,logId:line.logId?`${line.logId}_${String(index+1).padStart(2,"0")}`:undefined})));
}

function showTitle(notice=""){
 Dialogue.stop();
 GameAudio.stopAll();
 const hasSave=!!readSavedGame();
 game.innerHTML=`<div class="title-screen title-home title-art-loading"><h1 class="title-logo"><img src="images/ui/title-logo.jpg" alt="最後の謎が解けるまで"><span class="title-text-fallback">最後の謎が解けるまで</span></h1><div class="title-menu"><button id="startButton" aria-label="はじめる"><img src="images/ui/menu-start.jpg" alt=""></button><button id="continueButton" aria-label="つづきから" ${hasSave?"":"disabled"}><img src="images/ui/menu-continue.jpg" alt=""></button><button id="testRoomButton" aria-label="テストプレイ：部屋を選ぶ">テストプレイ</button><button id="settingsButton" aria-label="設定"><img src="images/ui/menu-settings.jpg" alt=""></button><button id="commentButton" aria-label="？？？" disabled><img src="images/ui/menu-locked.jpg" alt=""></button></div><p class="title-art-status" role="status">画像を読み込み中…</p><p class="title-notice" aria-live="polite">${notice}</p></div>`;
 const title=game.querySelector('.title-home'),background=new Image();
 background.src='images/pixel-ui/title-background-pixel.png';
 const images=[background,...title.querySelectorAll('img')];
 Promise.all(images.map(image=>image.decode?image.decode():new Promise((resolve,reject)=>{
  if(image.complete){image.naturalWidth?resolve():reject();return}
  image.addEventListener('load',resolve,{once:true});image.addEventListener('error',reject,{once:true});
 }))).then(()=>{
  if(!title.isConnected)return;
  title.classList.remove('title-art-loading');title.querySelector('.title-art-status').hidden=true;
 }).catch(()=>{
  if(!title.isConnected)return;
  title.classList.replace('title-art-loading','title-art-fallback');title.querySelector('.title-art-status').hidden=true;
 });
 document.getElementById("startButton").addEventListener("click",showNameInput);
 document.getElementById("continueButton").addEventListener("click",resumeGame);
 document.getElementById("testRoomButton").addEventListener("click",showTestRoomPicker);
 document.getElementById("settingsButton").addEventListener("click",showSettings);
}
function showTestRoomPicker(){
 const overlay=document.createElement("div");overlay.className="test-room-overlay";
 overlay.innerHTML=`<section class="test-room-panel" role="dialog" aria-modal="true" aria-label="開始する部屋を選択"><button type="button" class="device-close" aria-label="閉じる">×</button><h2>テストする部屋を選択</h2><p>選択した部屋から直接開始します。オートセーブはその部屋の進行で置き換わります。手動セーブは残ります。</p><div class="test-room-options"><button type="button" data-room="room01">第一の部屋</button><button type="button" data-room="room02">第二の部屋</button><button type="button" data-room="room03">第三の部屋</button><button type="button" data-room="room04">第四の部屋</button><button type="button" data-room="room05">第五の部屋</button><button type="button" data-room="room06">第六の部屋</button><button type="button" data-room="room07">第七の部屋</button><button type="button" data-room="room08">第八の部屋</button></div></section>`;
 game.appendChild(overlay);const close=()=>overlay.remove();overlay.querySelector(".device-close").addEventListener("click",close);overlay.addEventListener("click",event=>{if(event.target===overlay)close()});
 overlay.querySelectorAll("[data-room]").forEach(button=>button.addEventListener("click",()=>{const scene=button.dataset.room;close();startRoomTest(scene)}));
 overlay.querySelector("[data-room]")?.focus();
}
function startRoomTest(scene){
 clearSave();playerName=playerName||"主人公";
 roomStates.room06={testGuide:true};
 if(scene==="room01"){showFirstRoom();return}
 if(scene==="room02"){showSecondRoom();return}
 if(scene==="room03"){showThirdRoom();return}
 if(scene==="room04"){showFourthRoom();return}
 if(scene==="room05"){showFifthRoom();return}
 if(scene==="room06"){showSixthRoom(roomStates.room06);return}
 if(scene==="room07"){showSeventhRoom();return}
 if(scene==="room08"){showEighthRoom();return}
 showTitle("開始する部屋を選べませんでした。");
}
function showNameInput(){
 game.innerHTML=`<div class="title-screen"><h2>あなたの名前を入力してください</h2><input id="playerName" type="text" maxlength="8" placeholder="名前"><br><br><button id="decideButton">決定</button></div>`;
 document.getElementById("decideButton").addEventListener("click",()=>{clearSave();flashRed()});
}

function resumeGame(){
 const saved=readSavedGame();
 if(!saved){showTitle("再開できるデータがありません。");return}
 const loaders={
  opening:()=>{firstRoomState=undefined;showOpening(saved.opening.index)},
  room01:()=>showFirstRoom(saved.rooms.room01)
  ,room02:()=>showSecondRoom(saved.rooms.room02)
  ,room03:()=>showThirdRoom(saved.rooms.room03)
  ,room04:()=>showFourthRoom(saved.rooms.room04)
  ,room05:()=>showFifthRoom(saved.rooms.room05)
  ,room06:()=>showSixthRoom(saved.rooms.room06)
  ,room07:()=>showSeventhRoom(saved.rooms.room07)
  ,room08:()=>showEighthRoom(saved.rooms.room08)
 };
 const load=loaders[saved.currentScene];
 if(!load){showTitle("このセーブデータは現在のバージョンでは再開できません。");return}
 GameAudio.stopAll();
 playerName=saved.playerName||"主人公";
 openingIndex=saved.opening.index;
 currentScene=saved.currentScene;
 room5State=undefined;
 room6State=undefined;
 room7State=undefined;
 room8State=undefined;
 roomStates={...saved.rooms};
 GameLog.restore(saved.logs);
 load();
}

function showSettings(){
 const overlay=document.createElement("div");
 overlay.className="menu-overlay";
 overlay.innerHTML=`<section class="menu-panel" aria-label="せってい"><button type="button" class="device-close" aria-label="閉じる">×</button><h2>せってい</h2><label>音量 <output id="volumeValue"></output><input id="volumeInput" type="range" min="0" max="100" value="${settings.volume}"></label><label>文字送り速度 <output id="speedValue"></output><input id="speedInput" type="range" min="15" max="100" value="${settings.textSpeed}"></label><p>数値が小さいほど文字送りは速くなります。</p></section>`;
 game.appendChild(overlay);
 const volume=overlay.querySelector("#volumeInput"),speed=overlay.querySelector("#speedInput"),volumeValue=overlay.querySelector("#volumeValue"),speedValue=overlay.querySelector("#speedValue");
 const render=()=>{volumeValue.textContent=`${settings.volume}%`;speedValue.textContent=`${settings.textSpeed}ms`};
 volume.addEventListener("input",()=>{settings.volume=Number(volume.value);saveSettings();render()});
 speed.addEventListener("input",()=>{settings.textSpeed=Number(speed.value);saveSettings();render()});
 overlay.querySelector(".device-close").addEventListener("click",()=>overlay.remove());
 render();
}

// Opening rendering and progression live in opening-sequence.js.
// This shared transition remains here because it hands control to room 1.
function endOpening(){
 GameAudio.stop("tinnitus");
 setTimeout(()=>{
  showFirstRoom();
  const room=game.querySelector(".first-room");
  const veil=document.createElement("div");veil.className="first-room-entry-fade";
  veil.setAttribute("aria-hidden","true");game.append(veil);
  game.classList.add("is-entering-first-room");
  if(room)room.inert=true;
  let finished=false;
  function finish(){
   if(finished)return;finished=true;
   veil.remove();game.classList.remove("is-entering-first-room");
   if(room?.isConnected)room.inert=false;
  }
  veil.addEventListener("animationend",finish,{once:true});
  const reduced=typeof matchMedia==="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches;
  setTimeout(finish,reduced?0:1600);
 },1200);
}

let firstRoomState;
let firstRoomArtworkObserver;
const firstRoomKeyboard={image:"images/background/room01/pixel/keyboard.svg?v=20261012-piano-perspective-01",rect:[.263,.437,.472,.056]};
const firstRoomPoster={image:"images/items/item_poster.png?v=20261012-pixel-items-01",rect:[863/1536,195/1024,230/1536,326/1024],paper:true};
const firstRoomPhone={image:"images/items/phone-on-desk.png?v=20261012-thick-phone-01",rect:[942/1536,388/1024,84/1536,32/1024],phoneOnDesk:true};
const firstRoomWalls=[
 {id:"front",label:"正面",background:"images/background/room01/pixel/room01_front_fine.png"},
 {id:"right",label:"右の壁",background:"images/background/room01/pixel/room01_right_fine.png"},
 {id:"back",label:"後ろの壁",background:"images/background/room01/pixel/room01_back_fine.png"},
 {id:"left",label:"左の壁",background:"images/background/room01/pixel/room01_left_fine.png"}
];

function showFirstRoom(savedState){
 currentScene="room01";
 firstRoomArtworkObserver?.disconnect();
 Dialogue.stop();
 GameAudio.stop("tinnitus");
 firstRoomState={doorInspected:false,doorUnlocked:false,questionSeen:false,hanaVisits:0,mailHintGiven:false,hintLevel:0,pianoAttempted:false,melodySolved:false,phoneIntroductionSeen:false,phoneReflectionSeen:false,posterInspected:false,pianoIntroductionSeen:false,nextRoomTransitionSeen:false,viewedWall:"front",highlightEnabled:true,...savedState,hanaIntroduced:savedState?.hanaIntroduced??Number(savedState?.hanaVisits||0)>0,openedInbox:new Set(savedState?.openedInbox||[]),openedSent:new Set(savedState?.openedSent||[])};
 if(!canExploreFirstRoom()||!firstRoomWalls.some(wall=>wall.id===firstRoomState.viewedWall))firstRoomState.viewedWall="front";
 game.innerHTML=`
  <main class="room first-room ${firstRoomState.doorUnlocked?"is-restored":""}" aria-label="第一の部屋">
   <header class="room-header"><p class="room-label">第一の部屋</p><p class="room-color-status" id="roomColorStatus">${firstRoomState.doorUnlocked?"色を取り戻した部屋":"淡い記憶の部屋"}</p></header>
   <div class="room-stage-wrap">
    <div class="room-stage" id="roomStage" role="group" aria-label="正面">
     <img class="room-background" id="roomBackground" src="${firstRoomWalls.find(wall=>wall.id===firstRoomState.viewedWall).background}" alt="" draggable="false">
     <img class="first-room-keyboard" id="roomKeyboard" src="${firstRoomKeyboard.image}" alt="" draggable="false" hidden>
     <div class="room-wall" data-wall="front" hidden>
      <button class="object door-object" id="doorButton" aria-label="正面の扉を調べる"><span>正面の扉</span></button>
      <button class="object hana-object" id="hanaButton" aria-label="ハナに話しかける"><span>ハナ</span></button>
     </div>
     <div class="room-wall" data-wall="right" hidden><button class="object" id="shelfButton" aria-label="三段棚を調べる"><span>三段棚</span></button><button class="object item-object is-locked" id="posterButton" aria-label="ポスターを調べる" disabled><span class="first-room-poster-paper"><img src="images/items/item_poster.png?v=20261012-pixel-items-01" alt="" draggable="false"></span><span>ポスター</span></button></div>
     <div class="room-wall" data-wall="back" hidden><button class="object" id="deskButton" aria-label="勉強机を調べる"><span>勉強机</span></button><button class="object item-object phone-on-desk is-locked" id="phoneButton" aria-label="携帯電話を調べる" disabled><img src="images/items/phone-on-desk.png?v=20261012-thick-phone-01" alt="" draggable="false"><span>携帯電話</span></button></div>
     <div class="room-wall" data-wall="left" hidden><button class="object item-object is-locked" id="pianoButton" aria-label="ピアノを調べる" disabled><span>ピアノ</span></button></div>
    </div>
   </div>
   <nav class="room-navigation" aria-label="部屋を見回す"><button type="button" id="turnLeftButton" aria-label="左を向く">←<span>左を向く</span></button><button type="button" id="turnRightButton" aria-label="右を向く"><span>右を向く</span>→</button></nav>
   <p class="explore-status" id="exploreStatus" aria-live="polite"></p>
  </main>`;
 document.getElementById("doorButton").addEventListener("click",inspectRoomDoor);
 document.getElementById("hanaButton").addEventListener("click",talkToHana);
 document.getElementById("phoneButton").addEventListener("click",()=>inspectRoomItem("phone"));
 document.getElementById("pianoButton").addEventListener("click",()=>inspectRoomItem("piano"));
 document.getElementById("posterButton").addEventListener("click",()=>inspectRoomItem("poster"));
 document.getElementById("shelfButton").addEventListener("click",()=>inspectRoomFurniture("shelf"));
 document.getElementById("deskButton").addEventListener("click",()=>inspectRoomFurniture("desk"));
 document.getElementById("turnLeftButton").addEventListener("click",()=>turnFirstRoom(-1));
 document.getElementById("turnRightButton").addEventListener("click",()=>turnFirstRoom(1));
 if(typeof ResizeObserver!=="undefined"){firstRoomArtworkObserver=new ResizeObserver(positionFirstRoomKeyboard);firstRoomArtworkObserver.observe(document.getElementById("roomStage"))}
 renderFirstRoomWall();
 firstRoomWalls.forEach(wall=>{const background=new Image();background.src=wall.background});
 if(firstRoomState.questionSeen)unlockRoomItems();
 if(firstRoomState.doorUnlocked)document.getElementById("doorButton").classList.add("is-unlocked");
 if(savedState){
  showRoomNotice("続きから再開しました。","room1_resumed","narration");
  if(firstRoomState.melodySolved&&!firstRoomState.doorUnlocked)showFirstRoomMemory();
  else if(firstRoomState.nextRoomTransitionSeen)showNextRoomBoundary();
 }
 saveGame();
}

function positionFirstRoomKeyboard(){
 const stage=document.getElementById("roomStage"),keyboard=document.getElementById("roomKeyboard");
 if(!stage||!keyboard)return;
 const scale=Math.max(stage.clientWidth/1536,stage.clientHeight/1024);
 const artWidth=1536*scale,artHeight=1024*scale;
 const placements={posterButton:[834/1536,164/1024,290/1536,388/1024],phoneButton:firstRoomPhone.rect};
 for(const [id,[x,y,w,h]] of Object.entries(placements)){
  const el=document.getElementById(id);if(!el)continue;
  Object.assign(el.style,{left:`${(stage.clientWidth-artWidth)/2+x*artWidth}px`,top:`${(stage.clientHeight-artHeight)/2+y*artHeight}px`,width:`${w*artWidth}px`,height:`${h*artHeight}px`,bottom:"auto"});
 }
 keyboard.hidden=firstRoomState.viewedWall!=="left";
 if(keyboard.hidden)return;
 const width=stage.clientWidth,height=stage.clientHeight;

 const [x,y,w,h]=firstRoomKeyboard.rect;
 Object.assign(keyboard.style,{left:`${(width-artWidth)/2+x*artWidth}px`,top:`${(height-artHeight)/2+y*artHeight}px`,width:`${w*artWidth}px`,height:`${h*artHeight}px`});
}

function canExploreFirstRoom(){
 return firstRoomState.questionSeen&&firstRoomState.hanaIntroduced;
}
function refreshFirstRoomNavigation(){
 for(const id of ["turnLeftButton","turnRightButton"]){
  const button=document.getElementById(id);if(button)button.disabled=!canExploreFirstRoom();
 }
}

function renderFirstRoomWall(){
 refreshFirstRoomNavigation();
 const wall=firstRoomWalls.find(wall=>wall.id===firstRoomState.viewedWall);
 document.getElementById("roomBackground").setAttribute("src",wall.background);
 document.getElementById("roomStage").setAttribute("aria-label",wall.label);
 positionFirstRoomKeyboard();
 document.querySelectorAll(".room-wall").forEach(layer=>{layer.hidden=layer.dataset.wall!==wall.id});
}

function turnFirstRoom(direction){
 if(!canExploreFirstRoom()||game.querySelector(".inspection-overlay,.room-dialog-overlay,.device-overlay"))return;
 const current=firstRoomWalls.findIndex(wall=>wall.id===firstRoomState.viewedWall);
 firstRoomState.viewedWall=firstRoomWalls[(current+direction+firstRoomWalls.length)%firstRoomWalls.length].id;
 renderFirstRoomWall();
 saveGame();
}

// Investigate the door in place, without a separate artwork preview.
function inspectRoomDoor(){
 if(game.querySelector(".inspection-overlay,.room-dialog-overlay,.device-overlay"))return;
 inspectDoor();
}

function inspectRoomFurniture(id){
 if(game.querySelector(".inspection-overlay,.room-dialog-overlay,.device-overlay"))return;
 const items={
  shelf:{label:"三段棚",image:firstRoomWalls[1].background,crop:[.26,.15,.20,.63]},
  desk:{label:"勉強机",image:firstRoomWalls[2].background,crop:[.56,.34,.18,.135],layers:[firstRoomPhone]}
 };
 if(items[id])showItemInspection({container:game,item:items[id]});
}

function inspectDoor(){
 if(firstRoomState.doorUnlocked){
  showRoomDialog(firstRoomScenario.unlockedDoor,showUnlockedDoorChoices);
  return;
 }
 if(firstRoomState.doorInspected){
  showDoorQuestion();
  return;
 }
 showRoomDialog([...firstRoomScenario.doorIntroduction,...firstRoomScenario.doorQuestion],()=>{
  firstRoomState.doorInspected=true;
  firstRoomState.questionSeen=true;
  unlockRoomItems();
  saveGame();
 });
}

function showDoorQuestion(){
 showRoomDialog(firstRoomScenario.doorRepeat,()=>{
  if(!firstRoomState.questionSeen){
   firstRoomState.questionSeen=true;
   unlockRoomItems();
   saveGame();
  }
 });
}

function unlockRoomItems(){
 refreshFirstRoomNavigation();
 ["phoneButton","pianoButton","posterButton"].forEach(id=>{
  const item=document.getElementById(id);
  item.disabled=false;
  item.classList.remove("is-locked");
 });
}

function completeHanaIntroduction(){
 firstRoomState.hanaIntroduced=true;
 refreshFirstRoomNavigation();
 firstRoomState.hanaVisits=Number(firstRoomState.hanaVisits||0)+1;
 saveGame();
 window.HanaIdentity?.refresh?.();
}

function talkToHana(){
 // The topic menu in hana-choice.js owns normal interaction.
 const introduced=firstRoomState.hanaIntroduced;
 showRoomDialog(introduced?firstRoomScenario.hanaRoom:firstRoomScenario.hanaFirst,()=>{
  if(!introduced)completeHanaIntroduction();
  else{firstRoomState.hanaVisits++;saveGame()}
 });
}

function hasCheckedAllMail(folder){
 const mail=firstRoomScenario.phoneMail[folder];
 const checked=folder==="inbox" ? firstRoomState.openedInbox : folder==="sent" ? firstRoomState.openedSent : null;
 return !!checked&&Array.isArray(mail)&&mail.every(item=>checked.has(item.id));
}

function inspectRoomItem(id){
 if(!firstRoomState.questionSeen||game.querySelector(".inspection-overlay,.room-dialog-overlay,.device-overlay"))return;
 const items={phone:{id:"phone",label:"携帯電話",image:"images/items/phone-on-desk.png?v=20261012-thick-phone-01"},piano:{id:"piano",label:"ピアノ",image:firstRoomWalls[3].background,crop:[.21,.20,.58,.64],layers:[firstRoomKeyboard]},poster:{id:"poster",label:"ポスター",image:firstRoomPoster.image}};
 const item=items[id];if(!item)return;
 showItemInspection({container:game,item,onContinue:()=>{
  if(id==="phone"){
   if(firstRoomState.phoneIntroductionSeen){showPhoneScreen();return}
   showRoomDialog(firstRoomScenario.phoneIntroduction,()=>{
    firstRoomState.phoneIntroductionSeen=true;
    saveGame();
    showPhoneScreen();
   });
  }else if(id==="piano"){inspectPiano()}else{showPoster()}
 }});
}

function showPoster(){
 showRoomDialog(firstRoomScenario.poster,()=>{firstRoomState.posterInspected=true;saveGame()});
}

function inspectPiano(){
 if(firstRoomState.pianoIntroductionSeen){showPianoScreen();return}
 showRoomDialog(firstRoomScenario.pianoIntroduction,()=>{
  firstRoomState.pianoIntroductionSeen=true;
  saveGame();
  showPianoScreen();
 });
}

function activateDeviceModal(overlay,openerId,initialFocus,onClose){
 const room=game.querySelector(".room"),opener=document.getElementById(openerId);
 const wasInert=room?.inert||false;
 if(room)room.inert=true;
 const panel=overlay.querySelector("section"),closeButton=overlay.querySelector(".device-close");
 panel.setAttribute("role","dialog");
 panel.setAttribute("aria-modal","true");
 const controls=()=>[...panel.querySelectorAll("button:not(:disabled),input:not(:disabled)")].filter(el=>!el.closest("[hidden], [inert]"));
 let closed=false;
 const observer=new MutationObserver(()=>{
  if(!overlay.isConnected)release(false);
 });
 function release(restoreFocus){
  if(closed)return;
  closed=true;
  observer.disconnect();
  document.removeEventListener("keydown",onKeyDown,true);
  document.removeEventListener("focusin",onFocusIn,true);
  closeButton.removeEventListener("click",close);
  overlay.removeEventListener("click",onBackdropClick);
  overlay.remove();
  if(room)room.inert=wasInert;
  if(restoreFocus&&opener?.isConnected&&!opener.disabled&&!opener.closest("[hidden], [inert]"))opener.focus({preventScroll:true});
  if(restoreFocus)onClose?.();
 }
 function close(event){
  event?.stopPropagation();
  release(true);
 }
 function onBackdropClick(event){
  if(event.target===overlay)close(event);
 }
 function onKeyDown(event){
  if(game.querySelector(".design-overlay,.save-slot-overlay"))return;
  if(event.key==="Escape"){
   event.preventDefault();event.stopImmediatePropagation();close();
  }else if(event.key==="Tab"){
   event.preventDefault();event.stopImmediatePropagation();
   const buttons=controls(),index=buttons.indexOf(document.activeElement);
   const target=index<0?(event.shiftKey?buttons.length-1:0):(index+(event.shiftKey?-1:1)+buttons.length)%buttons.length;
   buttons[target]?.focus({preventScroll:true});
  }
 }
 function onFocusIn(event){
  if(game.querySelector(".design-overlay,.save-slot-overlay"))return;
  if(!closed&&!panel.contains(event.target))controls()[0]?.focus({preventScroll:true});
 }
 closeButton.addEventListener("click",close);
 overlay.addEventListener("click",onBackdropClick);
 document.addEventListener("keydown",onKeyDown,true);
 document.addEventListener("focusin",onFocusIn,true);
 observer.observe(document.documentElement,{childList:true,subtree:true});
 // Opening a puzzle must not activate text entry or the mobile keyboard.
 const preferred=initialFocus||controls()[0];
 const entry=preferred?.matches("input,textarea,[contenteditable]:not([contenteditable='false'])");
 (entry?closeButton:preferred)?.focus({preventScroll:true});
 return close;
}

function showPhoneScreen(){
 const overlay=document.createElement("div");
 overlay.className="device-overlay flip-phone-overlay";
 const hardwareButtons = [
  ["soft-left","左ソフトキー：一覧へ戻る・閉じる"],
  ["soft-right","右ソフトキー：受信と送信を切り替える"],
  ["mail","メールボタン：一覧へ戻る"],
  ["clear","戻るボタン：一覧へ戻る・閉じる"],
  ["up","十字キー上：前のメール"],
  ["down","十字キー下：次のメール"],
  ["left","十字キー左：受信BOX"],
  ["right","十字キー右：送信BOX"],
  ["ok","決定：メールを開く・次へ進む"],
  ["num-1","数字1：1通目のメール"],
  ["num-2","数字2：2通目のメール"],
  ["num-3","数字3：3通目のメール"],
  ["num-4","数字4：4通目のメール"]
 ].map(([action,label])=>`<button type="button" class="phone-hardware-key phone-key-${action}" data-phone-key="${action}" aria-label="${label}"></button>`).join("");
 overlay.innerHTML=`<section class="phone-screen flip-phone" aria-label="携帯電話のメール"><img class="flip-phone-body" src="images/items/phone-open-frame.png?v=20261012-flip-phone-thickness-02" alt="" draggable="false"><div class="phone-lcd"><div class="phone-status" aria-hidden="true"><span>▂▄▆　✉</span><span class="phone-clock">20:15</span><span>▰</span></div><header class="phone-lcd-title"><p>メール</p></header><div class="mail-tabs"><button type="button" data-folder="inbox" class="is-active">受信BOX</button><button type="button" data-folder="sent">送信BOX</button></div><div class="mail-list"></div><article class="mail-detail" aria-live="polite" hidden><p>メールを選んで内容を確認する。</p></article><footer class="phone-softkeys"><button type="button" class="device-close" aria-label="閉じる">閉じる</button><button type="button" class="phone-list-back" hidden>一覧へ</button><button type="button" class="phone-next-mail" hidden>次のメール</button><span class="phone-list-guide">メールを選択</span></footer></div><div class="phone-hardware-keys" aria-label="携帯電話の物理ボタン">${hardwareButtons}</div></section>`;
 game.appendChild(overlay);
 let folder="inbox",selectedMailId=null,cursorIndex=0;
 let closePhone;
 const list=overlay.querySelector(".mail-list"),detail=overlay.querySelector(".mail-detail");
 const tabs=overlay.querySelector(".mail-tabs"),back=overlay.querySelector(".phone-list-back"),next=overlay.querySelector(".phone-next-mail"),closeButton=overlay.querySelector(".device-close"),guide=overlay.querySelector(".phone-list-guide"),title=overlay.querySelector(".phone-lcd-title p");
 const setView=reading=>{
  list.hidden=reading;tabs.hidden=false;detail.hidden=!reading;back.hidden=!reading;next.hidden=!reading;closeButton.hidden=reading;guide.hidden=reading;
  title.textContent=reading?(folder==="inbox"?"受信メール":"送信メール"):"メール";
 };
 recordLog({logId:"room1_phone_select_prompt",logType:"investigation",speaker:"システム",logColor:"#222222",text:"メールを選んで内容を確認する。"});
 const markCursor=()=>{
  list.querySelectorAll(".mail-item").forEach(item=>item.classList.toggle("is-cursor",Number(item.dataset.index)===cursorIndex));
 };
 const openMail=index=>{
  const mail=firstRoomScenario.phoneMail[folder][index];if(!mail)return;
  selectedMailId=mail.id;cursorIndex=index;
  list.querySelectorAll(".mail-item").forEach(item=>{const selected=Number(item.dataset.index)===index;item.classList.toggle("is-selected",selected);item.setAttribute("aria-current",String(selected))});
  markCursor();
  (folder==="inbox" ? firstRoomState.openedInbox : firstRoomState.openedSent).add(mail.id);
  saveGame();
  detail.innerHTML=`<p>${folder==="inbox" ? "From" : "To"}:先輩　${mail.time}</p><h3>件名：${mail.subject}</h3><p>${mail.text.replace(/\n/g,"<br>")}</p>`;
  detail.scrollTop=0;overlay.querySelector(".phone-clock").textContent=mail.time;
  next.disabled=index===firstRoomScenario.phoneMail[folder].length-1;
  setView(true);back.focus({preventScroll:true});
  recordLog({...mail,speaker:"システム",logColor:"#222222",text:`${folder==="inbox" ? "From" : "To"}:先輩　${mail.time}\n件名：${mail.subject}\n${mail.text}`});
  showRoomNotice(`${folder==="inbox" ? "受信" : "送信"}メールを確認した。`,`room1_phone_${folder}_checked`);
 };
 const render=()=>{
  overlay.querySelectorAll("[data-folder]").forEach(tab=>tab.classList.toggle("is-active",tab.dataset.folder===folder));
  list.innerHTML=firstRoomScenario.phoneMail[folder].map((mail,index)=>`<button type="button" class="mail-item${mail.id===selectedMailId?" is-selected":""}" data-index="${index}"${mail.id===selectedMailId?' aria-current="true"':""}><strong>${folder==="inbox" ? "From" : "To"}:先輩</strong><span>${mail.time}</span><small>${mail.subject}</small></button>`).join("");
  list.querySelectorAll(".mail-item").forEach(button=>button.addEventListener("click",()=>openMail(Number(button.dataset.index))));
  markCursor();
 };
 const switchFolder=target=>{
  if(target!=="inbox"&&target!=="sent")return;
  folder=target;selectedMailId=null;cursorIndex=0;
  detail.innerHTML="<p>メールを選んで内容を確認する。</p>";
  setView(false);render();
 };
 overlay.querySelectorAll("[data-folder]").forEach(tab=>tab.addEventListener("click",()=>switchFolder(tab.dataset.folder)));
 back.addEventListener("click",()=>{setView(false);list.querySelector('.is-selected')?.focus({preventScroll:true})});
 next.addEventListener("click",()=>openMail(firstRoomScenario.phoneMail[folder].findIndex(mail=>mail.id===selectedMailId)+1));
 const backOrClose=()=>{
  if(!detail.hidden){setView(false);list.querySelector(".is-cursor")?.focus({preventScroll:true});}
  else closePhone?.();
 };
 const goToList=()=>{
  if(!detail.hidden)setView(false);
  list.querySelector(".is-cursor")?.focus({preventScroll:true});
 };
 const moveMail=step=>{
  const count=firstRoomScenario.phoneMail[folder].length;
  if(!count)return;
  if(!detail.hidden){
   const index=firstRoomScenario.phoneMail[folder].findIndex(mail=>mail.id===selectedMailId);
   const target=index+step;
   if(target>=0&&target<count)openMail(target);
  }else{
   cursorIndex=(cursorIndex+step+count)%count;
   markCursor();
   list.querySelector(".is-cursor")?.scrollIntoView({block:"nearest"});
  }
 };
 const confirmMail=()=>{
  if(detail.hidden)openMail(cursorIndex);
  else{
   const index=firstRoomScenario.phoneMail[folder].findIndex(mail=>mail.id===selectedMailId);
   if(index+1<firstRoomScenario.phoneMail[folder].length)openMail(index+1);
   else goToList();
  }
 };
 const pressPhoneKey=action=>{
  if(action==="up"){moveMail(-1);return;}
  if(action==="down"){moveMail(1);return;}
  if(action==="left"){switchFolder("inbox");return;}
  if(action==="right"){switchFolder("sent");return;}
  if(action==="soft-right"){switchFolder(folder==="inbox"?"sent":"inbox");return;}
  if(action==="soft-left"||action==="clear"){backOrClose();return;}
  if(action==="mail"){goToList();return;}
  if(action==="ok"){confirmMail();return;}
  if(action.startsWith("num-")){
   const index=Number(action.slice(4))-1;
   if(index>=0&&index<firstRoomScenario.phoneMail[folder].length)openMail(index);
  }
 };
 overlay.querySelectorAll("[data-phone-key]").forEach(button=>button.addEventListener("click",()=>pressPhoneKey(button.dataset.phoneKey)));
 overlay.addEventListener("keydown",event=>{
  if(!["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(event.key))return;
  event.preventDefault();
  event.stopPropagation();
  pressPhoneKey({ArrowUp:"up",ArrowDown:"down",ArrowLeft:"left",ArrowRight:"right"}[event.key]);
 });
 render();setView(false);
 closePhone=activateDeviceModal(overlay,"phoneButton",overlay.querySelector('[data-folder="inbox"]'),()=>{
  if(!firstRoomState.phoneReflectionSeen&&hasCheckedAllMail("inbox")&&hasCheckedAllMail("sent")){
   showRoomDialog(firstRoomScenario.phoneAfterAllMail,()=>{firstRoomState.phoneReflectionSeen=true;saveGame()});
  }
 });
}

function showPianoScreen(){
 if(firstRoomState.melodySolved&&!firstRoomState.doorUnlocked){showFirstRoomMemory();return}
 const overlay=document.createElement("div");
 overlay.className="device-overlay";
 const notes=["ド","レ","ミ","ファ","ソ","ラ","シ"];
 const keys=notes.map(note=>`<button type="button" class="piano-note-key" data-note="${note}" aria-label="${note}の鍵盤"><span>${note}</span></button>`).join("");
 overlay.innerHTML=`<section class="piano-screen room1-piano-panel" aria-label="ピアノ"><button type="button" class="device-close" aria-label="閉じる">×</button><h2>ピアノ</h2><p>8音の音階を入力する。</p><div class="piano-keyboard" role="group" aria-label="音階の鍵盤">${keys}<span class="piano-sharp piano-sharp-1" aria-hidden="true"></span><span class="piano-sharp piano-sharp-2" aria-hidden="true"></span><span class="piano-sharp piano-sharp-3" aria-hidden="true"></span><span class="piano-sharp piano-sharp-4" aria-hidden="true"></span><span class="piano-sharp piano-sharp-5" aria-hidden="true"></span></div><div class="piano-keyboard-tools"><button type="button" class="piano-undo">1音戻す</button><button type="button" class="piano-clear">全消去</button></div><label>音階（文字入力もできます）<input id="melodyInput" type="text" inputmode="text" autocomplete="off" placeholder="例：ドレミ" aria-label="演奏する8音の音階"></label><p class="piano-result" aria-live="polite"></p><button type="button" id="playMelodyButton">演奏する</button></section>`;
 game.appendChild(overlay);
 recordLog({logId:"room1_piano_prompt",logType:"investigation",speaker:"システム",logColor:"#222222",text:"8音の音階を入力する。"});
 const input=overlay.querySelector("#melodyInput"),result=overlay.querySelector(".piano-result"),button=overlay.querySelector("#playMelodyButton");
 const noteButtons=[...overlay.querySelectorAll(".piano-note-key")];
 const undo=overlay.querySelector(".piano-undo"),clear=overlay.querySelector(".piano-clear");
 const close=activateDeviceModal(overlay,"pianoButton",noteButtons[0],()=>{
  if(firstRoomState.melodySolved&&!firstRoomState.doorUnlocked)showFirstRoomMemory();
 });
 let solved=false;
 const normalizeMelody=value=>value.normalize("NFKC").replace(/[ぁ-ゖ]/gu,char=>String.fromCharCode(char.charCodeAt(0)+0x60)).replace(/[\s、。・,.\/|_-]/gu,"");
 const normalize=()=>normalizeMelody(input.value);
 const updateInput=value=>{
  input.value=value;
  result.textContent="";
  input.dispatchEvent(new Event("input",{bubbles:true}));
 };
 noteButtons.forEach(key=>key.addEventListener("click",()=>{
  if(solved)return;
  const melody=normalize();
  const enteredNotes=melody.match(/ファ|[ドレミソラシ]|./gu)||[];
  if(enteredNotes.length>=8)return;
  const note=key.dataset.note;
  updateInput(melody+note);
  GameAudio.playPianoNote?.(note);
 }));
 undo.addEventListener("click",()=>{
  if(solved)return;
  const melody=normalize();
  const parts=melody.match(/ファ|[ドレミソラシ]|./gu)||[];
  parts.pop();
  updateInput(parts.join(""));
 });
 clear.addEventListener("click",()=>{if(!solved)updateInput("");});
 const finish=()=>{close();};
 button.addEventListener("click",()=>{
  if(solved){finish();return}
  firstRoomState.pianoAttempted=true;
  saveGame();
  const melody=normalize();
  const melodyMatches=melody===firstRoomScenario.melody.join("");
  if(!melodyMatches){
   const guidance=firstRoomScenario.pianoIncorrect.map(line=>line.text).join("\n");
   showLoggedText(result,guidance,"room1_piano_incorrect","investigation","#8f1c1c");
   return;
  }
  solved=true;
  firstRoomState.melodySolved=true;
  saveGame();
  GameAudio.play("memoryMelody");
  showLoggedText(result,`${firstRoomScenario.melody.join("・")}♪`,"room1_piano_correct","investigation","#8f1c1c");
  input.disabled=true;
  noteButtons.forEach(key=>key.disabled=true);
  undo.disabled=true;
  clear.disabled=true;
  button.disabled=true;
  setTimeout(finish,600);
 });
}

function showFirstRoomMemory(){
 showRoomDialog(
  [...firstRoomScenario.pianoCorrect,...firstRoomScenario.memory,...firstRoomScenario.afterMemory],
  unlockFirstRoomDoor,
  line=>{
   const sourceId=line.logId?.replace(/_\d{2}$/u,"");
   if(sourceId==="room1_piano_correct_02")GameAudio.stop("memoryMelody");
   if(sourceId==="room1_piano_correct_04")GameAudio.play("memoryBand");
   if(sourceId==="room1_memory_music_room_09")GameAudio.fadeOut("memoryBand",2000);
  }
 );
}

function unlockFirstRoomDoor(){
 firstRoomState.doorUnlocked=true;
 saveGame();
 document.getElementById("doorButton").classList.add("is-unlocked");
 document.querySelector(".room").classList.add("is-restored");
 document.getElementById("roomColorStatus").textContent="色を取り戻した部屋";
 showRoomNotice("扉の鍵が開いた。 ","room1_door_unlocked","narration");
}

function showUnlockedDoorChoices(){
 const overlay=document.createElement("div");
 overlay.className="device-overlay";
 overlay.innerHTML=`<section class="menu-panel room-exit-menu" aria-label="扉の先へ進む"><button type="button" class="device-close" aria-label="閉じる">×</button><h2>どうする？</h2><button type="button" id="nextRoomButton">次の部屋へ向かう</button><button type="button" id="keepExploringButton">もう少し部屋を調べてみる</button></section>`;
 game.appendChild(overlay);
 const close=activateDeviceModal(overlay,"doorButton",overlay.querySelector("#nextRoomButton"));
 overlay.querySelector("#keepExploringButton").addEventListener("click",()=>{
  close();
  showRoomDialog(firstRoomScenario.keepExploring);
 });
 overlay.querySelector("#nextRoomButton").addEventListener("click",()=>{
  close();
  showRoomDialog(firstRoomScenario.nextRoom,()=>{
   firstRoomState.nextRoomTransitionSeen=true;
   saveGame();
   showNextRoomBoundary();
  });
 });
}

function showNextRoomBoundary(){
 // Use the half-open door as a brief transition image, never as a clickable inspection frame.
 Dialogue.stop();
 game.innerHTML=`<div class="room-transition" aria-label="扉を通って次の部屋へ"><img src="images/background/room01/pixel/room01_door_halfopen.png" alt="半開きの扉"></div>`;
 setTimeout(()=>{if(game.querySelector(".room-transition"))showSecondRoom(roomStates.room02)},1100);
}

function showRoomNotice(text,logId,logType="investigation"){
 showLoggedText(document.getElementById("exploreStatus"),text,logId,logType,"#5f675a");
}

function showRoomDialog(lines,onComplete,onDisplay){
 // Never stack dialogue overlays. Stacking disposes the older Dialogue controller
 // while leaving its overlay on screen, which makes the conversation impossible to finish.
 if(game.querySelector(".room-dialog-overlay"))return false;
 window.DesignUI?.beginDialogue(lines);
 const opener=document.activeElement;
 const room=game.querySelector(".room,.late-room");
 if(room)room.inert=true;
 const overlay=document.createElement("div");
 overlay.className="room-dialog-overlay";
 overlay.innerHTML=`<section class="room-dialog" role="dialog" aria-modal="true" aria-label="会話"><div class="dialog-message-area" id="roomMessage"></div><div class="dialog-log-area" id="roomLogArea" role="region" aria-label="テキスト履歴" tabindex="0" hidden></div><div class="dialog-controls"><button type="button" class="auto-button" id="roomAutoButton" aria-pressed="false">AUTO OFF</button><button type="button" class="skip-button" id="roomSkipButton" aria-pressed="false" disabled>SKIP</button><button type="button" class="log-button" id="roomLogButton" aria-pressed="false" aria-expanded="false" aria-controls="roomLogArea">LOG</button><button type="button" class="next-button" id="roomNextButton" aria-label="次へ">▶</button></div></section>`;
 game.appendChild(overlay);
 const next=overlay.querySelector("#roomNextButton"),auto=overlay.querySelector("#roomAutoButton"),skip=overlay.querySelector("#roomSkipButton"),log=overlay.querySelector("#roomLogButton"),logArea=overlay.querySelector("#roomLogArea");
 overlay.addEventListener("keydown",event=>{
  if(event.key!=="Tab")return;
  const controls=[...overlay.querySelectorAll("[tabindex],button")].filter(control=>!control.hidden&&!control.disabled);
  const first=controls[0],last=controls[controls.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
 });
 Dialogue.start({lines:expandScenario(lines),messageArea:overlay.querySelector("#roomMessage"),nextButton:next,autoButton:auto,skipButton:skip,logButton:log,logArea,dialog:overlay.querySelector(".room-dialog"),isRead:line=>GameLog.has(line.logId),onDisplay:(line,index)=>{
  if(!line.logSource||line.uiPage===0)recordLog(line.logSource||line);
  if(!line.logSource||line.uiPage===0){if(onDisplay)onDisplay(line.logSource||line,line.sourceIndex??index);}
 },getTextSpeed:()=>settings.instantText?0:settings.textSpeed,onComplete:()=>{
  overlay.remove();
  if(room)room.inert=false;
  if(opener?.isConnected&&!opener.disabled)opener.focus({preventScroll:true});
  window.DesignUI?.endDialogue();
  if(onComplete)onComplete();
 }});
 return true;
}
// Resume Web Audio inside a trusted tap/key gesture, including after app switching.
document.addEventListener("click",()=>{GameAudio.unlock()},{capture:true});
document.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" ")GameAudio.unlock()},{capture:true});
showTitle();

let lastTouchEnd=0;
document.addEventListener("touchend",event=>{
 if(event.target.closest?.(".dialog-log-area,.log-button")){lastTouchEnd=0;return}
 const now=Date.now();
 if(now-lastTouchEnd<=300)event.preventDefault();
 lastTouchEnd=now;
},{passive:false});
["gesturestart","gesturechange","gestureend"].forEach(type=>{
 document.addEventListener(type,e=>e.preventDefault());
});

