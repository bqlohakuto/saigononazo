const game=document.getElementById("game");
const SAVE_KEY="saigononazo-save-v1",SETTINGS_KEY="saigononazo-settings-v1";
const defaultSettings={volume:70,textSpeed:45};
let playerName="";
let openingIndex=0;
let currentScene="opening";
let roomStates={};
let room2State;
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
  }
  return saved;
 }
 return {VERSION,normalize,create};
})();
// SAVE_DATA_END

function loadSettings(){
 try{return {...defaultSettings,...JSON.parse(localStorage.getItem(SETTINGS_KEY))}}catch{return {...defaultSettings}}
}

function applySettings(){
 GameAudio.setVolume(Number(settings.volume)/100);
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
 const saved=SaveData.create({playerName,currentScene,openingIndex,rooms:roomStates,logs:GameLog.list()});
 localStorage.setItem(SAVE_KEY,JSON.stringify(saved));
}

function clearSave(){
 localStorage.removeItem(SAVE_KEY);
 GameLog.restore();
 firstRoomState=undefined;
 room2State=undefined;
 openingIndex=0;
 currentScene="opening";
 roomStates={};
}

function recordLog(line){
 GameLog.record(line);
 saveGame();
}

// Direct displays (mail, status, puzzle results) use the same registration path.
function showLoggedText(element,text,logId,logType="investigation",logColor="#333333"){
 element.textContent=text;
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
 game.innerHTML=`<div class="title-screen title-home"><h1 class="title-logo"><img src="images/ui/title-logo.jpg" alt="最後の謎が解けるまで"></h1><div class="title-menu"><button id="startButton" aria-label="はじめる"><img src="images/ui/menu-start.jpg" alt=""></button><button id="continueButton" aria-label="つづきから" ${hasSave?"":"disabled"}><img src="images/ui/menu-continue.jpg" alt=""></button><button id="settingsButton" aria-label="設定"><img src="images/ui/menu-settings.jpg" alt=""></button><button id="commentButton" aria-label="？？？" disabled><img src="images/ui/menu-locked.jpg" alt=""></button></div><p class="title-notice" aria-live="polite">${notice}</p></div>`;
 document.getElementById("startButton").addEventListener("click",showNameInput);
 document.getElementById("continueButton").addEventListener("click",resumeGame);
 document.getElementById("settingsButton").addEventListener("click",showSettings);
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
 };
 const load=loaders[saved.currentScene];
 if(!load){showTitle("このセーブデータは現在のバージョンでは再開できません。");return}
 GameAudio.stopAll();
 playerName=saved.playerName||"主人公";
 openingIndex=saved.opening.index;
 currentScene=saved.currentScene;
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
 setTimeout(showFirstRoom,1200);
}

let firstRoomState;
const firstRoomWalls=[
 {id:"front",label:"正面",background:"images/background/room01/room01_front.png"},
 {id:"right",label:"右の壁",background:"images/background/room01/room01_right.png"},
 {id:"back",label:"後ろの壁",background:"images/background/room01/room01_back.png"},
 {id:"left",label:"左の壁",background:"images/background/room01/room01_left.png"}
];

function showFirstRoom(savedState){
 currentScene="room01";
 Dialogue.stop();
 GameAudio.stop("tinnitus");
 firstRoomState={doorInspected:false,doorUnlocked:false,questionSeen:false,hanaVisits:0,mailHintGiven:false,hintLevel:0,pianoAttempted:false,melodySolved:false,phoneIntroductionSeen:false,phoneReflectionSeen:false,posterInspected:false,pianoIntroductionSeen:false,nextRoomTransitionSeen:false,viewedWall:"front",...savedState,hanaIntroduced:savedState?.hanaIntroduced??Number(savedState?.hanaVisits||0)>0,openedInbox:new Set(savedState?.openedInbox||[]),openedSent:new Set(savedState?.openedSent||[])};
 if(!firstRoomWalls.some(wall=>wall.id===firstRoomState.viewedWall))firstRoomState.viewedWall="front";
 game.innerHTML=`
  <main class="room ${firstRoomState.doorUnlocked?"is-restored":""}" aria-label="第一の部屋">
   <header class="room-header"><p class="room-label">第一の部屋</p><p class="room-color-status" id="roomColorStatus">${firstRoomState.doorUnlocked?"色を取り戻した部屋":"淡い記憶の部屋"}</p></header>
   <div class="room-stage-wrap">
    <div class="room-stage" id="roomStage" role="group" aria-label="正面">
     <img class="room-background" id="roomBackground" src="${firstRoomWalls.find(wall=>wall.id===firstRoomState.viewedWall).background}" alt="" draggable="false">
     <div class="room-wall" data-wall="front" hidden>
      <button class="object door-object" id="doorButton" aria-label="正面の扉を調べる"><span>正面の扉</span></button>
      <button class="object question-object is-locked" id="questionButton" aria-label="扉の問題文を調べる" disabled><span>問題文</span></button>
      <button class="object hana-object" id="hanaButton" aria-label="ハナに話しかける"><span>ハナ</span></button>
     </div>
     <div class="room-wall" data-wall="right" hidden><button class="object" id="shelfButton" aria-label="三段棚を調べる"><span>三段棚</span></button><button class="object item-object is-locked" id="posterButton" aria-label="ポスターを調べる" disabled><img src="images/items/item_poster.png" alt="" draggable="false"><span>ポスター</span></button></div>
     <div class="room-wall" data-wall="back" hidden><button class="object" id="deskButton" aria-label="勉強机を調べる"><span>勉強机</span></button><button class="object item-object is-locked" id="phoneButton" aria-label="携帯電話を調べる" disabled><img src="images/items/phone-closed.png" alt="" draggable="false"><span>携帯電話</span></button></div>
     <div class="room-wall" data-wall="left" hidden><button class="object item-object is-locked" id="pianoButton" aria-label="ピアノを調べる" disabled><span>ピアノ</span></button></div>
    </div>
   </div>
   <nav class="room-navigation" aria-label="部屋を見回す"><button type="button" id="turnLeftButton" aria-label="左を向く">←<span>左を向く</span></button><p id="wallLabel" aria-live="polite"></p><button type="button" id="turnRightButton" aria-label="右を向く"><span>右を向く</span>→</button></nav>
   <p class="explore-status" id="exploreStatus" aria-live="polite">気になる場所をクリックしてください。</p>
  </main>`;
 document.getElementById("doorButton").addEventListener("click",inspectRoomDoor);
 document.getElementById("questionButton").addEventListener("click",showDoorQuestion);
 document.getElementById("hanaButton").addEventListener("click",talkToHana);
 document.getElementById("phoneButton").addEventListener("click",()=>inspectRoomItem("phone"));
 document.getElementById("pianoButton").addEventListener("click",()=>inspectRoomItem("piano"));
 document.getElementById("posterButton").addEventListener("click",()=>inspectRoomItem("poster"));
 document.getElementById("shelfButton").addEventListener("click",()=>inspectRoomFurniture("shelf"));
 document.getElementById("deskButton").addEventListener("click",()=>inspectRoomFurniture("desk"));
 document.getElementById("turnLeftButton").addEventListener("click",()=>turnFirstRoom(-1));
 document.getElementById("turnRightButton").addEventListener("click",()=>turnFirstRoom(1));
 renderFirstRoomWall();
 showRoomNotice("気になる場所をクリックしてください。","room1_explore_prompt","narration");
 firstRoomWalls.forEach(wall=>{const background=new Image();background.src=wall.background});
 if(firstRoomState.doorInspected||firstRoomState.questionSeen){
  const question=document.getElementById("questionButton");
  question.disabled=false;
  question.classList.remove("is-locked");
 }
 if(firstRoomState.questionSeen)unlockRoomItems();
 if(firstRoomState.doorUnlocked)document.getElementById("doorButton").classList.add("is-unlocked");
 if(savedState){
  showRoomNotice("続きから再開しました。","room1_resumed","narration");
  if(firstRoomState.melodySolved&&!firstRoomState.doorUnlocked)showFirstRoomMemory();
  else if(firstRoomState.nextRoomTransitionSeen)showNextRoomBoundary();
 }
 saveGame();
}

function renderFirstRoomWall(){
 const wall=firstRoomWalls.find(wall=>wall.id===firstRoomState.viewedWall);
 document.getElementById("roomBackground").setAttribute("src",wall.background);
 document.getElementById("roomStage").setAttribute("aria-label",wall.label);
 document.getElementById("wallLabel").textContent=wall.label;
 document.querySelectorAll(".room-wall").forEach(layer=>{layer.hidden=layer.dataset.wall!==wall.id});
}

function turnFirstRoom(direction){
 const current=firstRoomWalls.findIndex(wall=>wall.id===firstRoomState.viewedWall);
 firstRoomState.viewedWall=firstRoomWalls[(current+direction+firstRoomWalls.length)%firstRoomWalls.length].id;
 renderFirstRoomWall();
 saveGame();
}

// These closeups only display artwork; the existing door logic runs afterward.
function inspectRoomDoor(){
 if(game.querySelector(".inspection-overlay,.room-dialog-overlay,.device-overlay"))return;
 const frames=[{label:"正面の扉（閉）",image:"images/background/room01/room01_door_closeup.png"}];
 if(firstRoomState.doorUnlocked)frames.push(
  {label:"正面の扉（半開き）",image:"images/background/room01/room01_door_halfopen.png"},
  {label:"正面の扉（全開）",image:"images/background/room01/room01_door_open.png"}
 );
 showItemInspection({container:game,item:{label:"正面の扉",frames},onContinue:inspectDoor});
}

function inspectRoomFurniture(id){
 if(game.querySelector(".inspection-overlay,.room-dialog-overlay,.device-overlay"))return;
 const items={
  shelf:{label:"三段棚",image:"images/background/room01/room01_shelf_closeup.png"},
  desk:{label:"勉強机",image:"images/background/room01/room01_desk_closeup.png"}
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
  const question=document.getElementById("questionButton");
  question.disabled=false;
  question.classList.remove("is-locked");
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
 ["phoneButton","pianoButton","posterButton"].forEach(id=>{
  const item=document.getElementById(id);
  item.disabled=false;
  item.classList.remove("is-locked");
 });
 showRoomNotice("新たに気になる場所が見つかった。","room1_items_noticed");
}

function completeHanaIntroduction(){
 firstRoomState.hanaIntroduced=true;
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
 const items={phone:{id:"phone",label:"携帯電話",image:"images/items/phone-closed.png"},piano:{id:"piano",label:"ピアノ",image:"images/background/room01/room01_keyboard_closeup.png"},poster:{id:"poster",label:"ポスター",image:"images/items/item_poster.png"}};
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
 const controls=()=>[...panel.querySelectorAll("button:not(:disabled),input:not(:disabled)")];
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
  overlay.remove();
  if(room)room.inert=wasInert;
  if(restoreFocus&&opener?.isConnected&&!opener.disabled&&!opener.closest("[hidden], [inert]"))opener.focus({preventScroll:true});
  if(restoreFocus)onClose?.();
 }
 function close(event){
  event?.stopPropagation();
  release(true);
 }
 function onKeyDown(event){
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
  if(!closed&&!panel.contains(event.target))controls()[0]?.focus({preventScroll:true});
 }
 closeButton.addEventListener("click",close);
 document.addEventListener("keydown",onKeyDown,true);
 document.addEventListener("focusin",onFocusIn,true);
 observer.observe(document.documentElement,{childList:true,subtree:true});
 (initialFocus||controls()[0])?.focus({preventScroll:true});
 return close;
}

function showPhoneScreen(){
 const overlay=document.createElement("div");
 overlay.className="device-overlay";
 overlay.innerHTML=`<section class="phone-screen" aria-label="携帯電話のメール"><header><p>メール</p><button type="button" class="device-close" aria-label="閉じる">×</button></header><div class="mail-tabs"><button type="button" data-folder="inbox" class="is-active">受信BOX</button><button type="button" data-folder="sent">送信BOX</button></div><div class="mail-list"></div><article class="mail-detail" aria-live="polite"><p>メールを選んで内容を確認する。</p></article></section>`;
 game.appendChild(overlay);
 let folder="inbox",selectedMailId=null;
 const list=overlay.querySelector(".mail-list"),detail=overlay.querySelector(".mail-detail");
 recordLog({logId:"room1_phone_select_prompt",logType:"investigation",speaker:"システム",logColor:"#222222",text:"メールを選んで内容を確認する。"});
 const render=()=>{
  overlay.querySelectorAll("[data-folder]").forEach(tab=>tab.classList.toggle("is-active",tab.dataset.folder===folder));
  list.innerHTML=firstRoomScenario.phoneMail[folder].map((mail,index)=>`<button type="button" class="mail-item${mail.id===selectedMailId?" is-selected":""}" data-index="${index}"${mail.id===selectedMailId?' aria-current="true"':""}><strong>${folder==="inbox" ? "From" : "To"}:先輩</strong><span>${mail.time}</span><small>${mail.subject}</small></button>`).join("");
  list.querySelectorAll(".mail-item").forEach(button=>button.addEventListener("click",()=>{
   const mail=firstRoomScenario.phoneMail[folder][Number(button.dataset.index)];
   selectedMailId=mail.id;
   list.querySelectorAll(".mail-item").forEach(item=>{item.classList.toggle("is-selected",item===button);item.setAttribute("aria-current",String(item===button))});
   (folder==="inbox" ? firstRoomState.openedInbox : firstRoomState.openedSent).add(mail.id);
   saveGame();
   detail.innerHTML=`<p>${folder==="inbox" ? "From" : "To"}:先輩　${mail.time}</p><h3>件名：${mail.subject}</h3><p>${mail.text.replace(/\n/g,"<br>")}</p>`;
   recordLog({...mail,speaker:"システム",logColor:"#222222",text:`${folder==="inbox" ? "From" : "To"}:先輩　${mail.time}\n件名：${mail.subject}\n${mail.text}`});
   showRoomNotice(`${folder==="inbox" ? "受信" : "送信"}メールを確認した。`,`room1_phone_${folder}_checked`);
  }));
 };
 overlay.querySelectorAll("[data-folder]").forEach(tab=>tab.addEventListener("click",()=>{folder=tab.dataset.folder;selectedMailId=null;detail.innerHTML="<p>メールを選んで内容を確認する。</p>";render()}));
 render();
 activateDeviceModal(overlay,"phoneButton",overlay.querySelector('[data-folder="inbox"]'),()=>{
  if(!firstRoomState.phoneReflectionSeen&&hasCheckedAllMail("inbox")&&hasCheckedAllMail("sent")){
   showRoomDialog(firstRoomScenario.phoneAfterAllMail,()=>{firstRoomState.phoneReflectionSeen=true;saveGame()});
  }
 });
}

function showPianoScreen(){
 if(firstRoomState.melodySolved&&!firstRoomState.doorUnlocked){showFirstRoomMemory();return}
 const overlay=document.createElement("div");
 overlay.className="device-overlay";
 overlay.innerHTML=`<section class="piano-screen" aria-label="ピアノ"><button type="button" class="device-close" aria-label="閉じる">×</button><h2>ピアノ</h2><p>8音の音階を入力する。</p><label>音階<input id="melodyInput" type="text" inputmode="text" autocomplete="off" placeholder="例：ドレミ" aria-label="演奏する8音の音階"></label><p class="piano-result" aria-live="polite"></p><button type="button" id="playMelodyButton">演奏する</button></section>`;
 game.appendChild(overlay);
 recordLog({logId:"room1_piano_prompt",logType:"investigation",speaker:"システム",logColor:"#222222",text:"8音の音階を入力する。"});
 const input=overlay.querySelector("#melodyInput"),result=overlay.querySelector(".piano-result"),button=overlay.querySelector("#playMelodyButton");
 const close=activateDeviceModal(overlay,"pianoButton",input,()=>{
  if(firstRoomState.melodySolved&&!firstRoomState.doorUnlocked)showFirstRoomMemory();
 });
 let solved=false;
 const finish=()=>{
  close();
 };
 button.addEventListener("click",()=>{
  if(solved){finish();return}
  firstRoomState.pianoAttempted=true;
  saveGame();
  const melody=input.value.replace(/[\s、。・,]/g,"");
  if(melody!==firstRoomScenario.melody.join("")||!hasCheckedAllMail("inbox")||!hasCheckedAllMail("sent")){
   showLoggedText(result,firstRoomScenario.pianoIncorrect.map(line=>line.text).join("\n"),"room1_piano_incorrect","investigation","#8f1c1c");
   return;
  }
  solved=true;
  firstRoomState.melodySolved=true;
  saveGame();
  GameAudio.play("memoryMelody");
  showLoggedText(result,`${firstRoomScenario.melody.join("・")}♪`,"room1_piano_correct","investigation","#8f1c1c");
  input.disabled=true;
  button.textContent=firstRoomState.doorUnlocked?"閉じる":"続ける";
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
 // The completed transition now enters the authored second room.
 showSecondRoom(roomStates.room02);
}

function showRoomNotice(text,logId,logType="investigation"){
 showLoggedText(document.getElementById("exploreStatus"),text,logId,logType,"#5f675a");
}

function showRoomDialog(lines,onComplete,onDisplay){
 const opener=document.activeElement;
 const room=game.querySelector(".room");
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
  recordLog(line);
  if(onDisplay)onDisplay(line,index);
 },getTextSpeed:()=>settings.textSpeed,onComplete:()=>{
  overlay.remove();
  if(room)room.inert=false;
  if(opener?.isConnected&&!opener.disabled)opener.focus({preventScroll:true});
  if(onComplete)onComplete();
 }});
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
