const game=document.getElementById("game");
const SAVE_KEY="saigononazo-save-v1",SETTINGS_KEY="saigononazo-settings-v1";
const defaultSettings={volume:70,textSpeed:45};
let playerName="";
let openingIndex=0;
let settings=loadSettings();
const FLASH_TIME=1000,BLACK_TIME=1000,FADE_TIME=3000,TEXT_DELAY=2000;

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
 try{return JSON.parse(localStorage.getItem(SAVE_KEY))}catch{return null}
}

function saveGame(){
 const saved={playerName,logs:GameLog.list()};
 if(firstRoomState){
  Object.assign(saved,{scene:"firstRoom",state:{...firstRoomState,openedInbox:[...firstRoomState.openedInbox],openedSent:[...firstRoomState.openedSent]}});
 }else{Object.assign(saved,{scene:"opening",openingIndex})}
 localStorage.setItem(SAVE_KEY,JSON.stringify(saved));
}

function clearSave(){localStorage.removeItem(SAVE_KEY);GameLog.restore();firstRoomState=undefined;openingIndex=0}

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
 game.innerHTML=`<div class="title-screen"><h1>最後の謎が解けるまで</h1><div class="title-menu"><button id="startButton">はじめから</button><button id="continueButton" ${hasSave?"":"disabled"}>つづきから</button><button id="settingsButton">せってい</button><button id="commentButton">作者のコメント</button></div><p class="title-notice" aria-live="polite">${notice}</p></div>`;
 document.getElementById("startButton").addEventListener("click",showNameInput);
 document.getElementById("continueButton").addEventListener("click",resumeGame);
 document.getElementById("settingsButton").addEventListener("click",showSettings);
 document.getElementById("commentButton").addEventListener("click",showAuthorComment);
}
function showNameInput(){
 game.innerHTML=`<div class="title-screen"><h2>あなたの名前を入力してください</h2><input id="playerName" type="text" maxlength="8" placeholder="名前"><br><br><button id="decideButton">決定</button></div>`;
 document.getElementById("decideButton").addEventListener("click",()=>{clearSave();flashRed()});
}

function resumeGame(){
 const saved=readSavedGame();
 if(!saved||!["firstRoom","opening"].includes(saved.scene)){showTitle("再開できるデータがありません。");return}
 GameAudio.stopAll();
 playerName=saved.playerName||"主人公";
 GameLog.restore(saved.logs);
 if(saved.scene==="opening"){
  firstRoomState=undefined;
  showOpening(saved.openingIndex);
  document.querySelector(".opening").classList.add("fade-in");
  return;
 }
 showFirstRoom(saved.state);
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

function showAuthorComment(){
 const overlay=document.createElement("div");
 overlay.className="menu-overlay";
 overlay.innerHTML=`<section class="menu-panel author-comment"><button type="button" class="device-close" aria-label="閉じる">×</button><h2>作者のコメント</h2><p>準備中です。</p></section>`;
 game.appendChild(overlay);
 overlay.querySelector(".device-close").addEventListener("click",()=>overlay.remove());
}
function flashRed(){
 playerName=document.getElementById("playerName").value.trim()||"主人公";
 game.innerHTML=`<div class="flash"></div>`;
 GameAudio.stopAll();
 GameAudio.play("tinnitus");
 setTimeout(showBlack,FLASH_TIME);
}
function showBlack(){
 game.innerHTML=`<div class="black"></div>`;
 setTimeout(showFade,BLACK_TIME);
}
function showFade(){
 showOpening();
 document.querySelector(".opening").classList.add("fade-in");
}
function showOpening(startIndex=0){
 game.innerHTML=`<div class="opening"><div id="character-area"></div><div class="dialog" id="dialog" style="display:none"><div class="dialog-message-area" id="messageArea"></div><div class="dialog-log-area" id="openingLogArea" role="region" aria-label="テキスト履歴" tabindex="0" hidden></div><div class="dialog-controls"><button type="button" class="auto-button" id="openingAutoButton" aria-pressed="false">AUTO OFF</button><button type="button" class="log-button" id="openingLogButton" aria-pressed="false" aria-expanded="false" aria-controls="openingLogArea">LOG</button><button type="button" class="next-button" id="nextButton" aria-label="次へ">▶</button></div></div></div>`;
 setTimeout(()=>{
  const dialog=document.getElementById("dialog");
  if(!dialog)return;
  GameAudio.stop("tinnitus");
  dialog.style.display="flex";
  startScenario(openingScenario,startIndex);
 },FADE_TIME+TEXT_DELAY);
}
function startScenario(scenario,startIndex=0){
 Dialogue.start({lines:expandScenario(scenario),startIndex,messageArea:document.getElementById("messageArea"),nextButton:document.getElementById("nextButton"),autoButton:document.getElementById("openingAutoButton"),logButton:document.getElementById("openingLogButton"),logArea:document.getElementById("openingLogArea"),dialog:document.getElementById("dialog"),getTextSpeed:()=>settings.textSpeed,onDisplay:(line,index)=>{openingIndex=index;recordLog(line)},onComplete:endOpening});
}
function endOpening(){
 GameAudio.stop("tinnitus");
 GameAudio.play("doorOpen");
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
 Dialogue.stop();
 GameAudio.stop("tinnitus");
 firstRoomState={doorInspected:false,doorUnlocked:false,questionSeen:false,hanaVisits:0,mailHintGiven:false,pianoAttempted:false,melodySolved:false,phoneIntroductionSeen:false,viewedWall:"front",...savedState,openedInbox:new Set(savedState?.openedInbox||[]),openedSent:new Set(savedState?.openedSent||[])};
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
     <div class="room-wall" data-wall="right" hidden><button class="object" id="shelfButton" aria-label="三段棚を調べる"><span>三段棚</span></button><button class="object item-object is-locked" id="posterButton" aria-label="ポスターを調べる" disabled><span>ポスター</span></button></div>
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
 }else{showRoomDialog(firstRoomScenario.introduction)}
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
  showRoomNotice("扉の鍵が開いている。","room1_door_open_checked");
  return;
 }
 if(firstRoomState.doorInspected){
  showRoomNotice("扉は鍵がかかっている。問題文を調べてみよう。","room1_door_locked_checked");
  return;
 }
 showRoomDialog([
  {logId:"room1_door_first_01",logType:"investigation",speaker:"ト書き",text:"まず、目についた扉を調べた。"},
  {logId:"room1_door_first_02",logType:"investigation",speaker:"ト書き",text:"ドアノブを回そうとしたが、鍵が閉まっているようだ。"}
 ],()=>{
  firstRoomState.doorInspected=true;
  const question=document.getElementById("questionButton");
  question.disabled=false;
  question.classList.remove("is-locked");
  showRoomNotice("扉に書かれた問題文が気になる。","room1_door_question_noticed");
  saveGame();
 });
}

function showDoorQuestion(){
 showRoomDialog([{logId:"room1_door_question_01",logType:"investigation",speaker:"問題文",text:"会話に隠された音楽を奏でよ"}],()=>{
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

function talkToHana(){
 firstRoomState.hanaVisits++;
 saveGame();
 if(firstRoomState.hanaVisits===1){showRoomDialog(firstRoomScenario.hanaFirst);return}
 if(hasCheckedAllMail("inbox")&&!hasCheckedAllMail("sent")&&firstRoomState.pianoAttempted&&!firstRoomState.mailHintGiven){
  firstRoomState.mailHintGiven=true;
  showRoomDialog(firstRoomScenario.hanaMailHint);
  return;
 }
 const lines=firstRoomState.questionSeen ? firstRoomScenario.hanaAfterQuestion : firstRoomScenario.hanaBeforeQuestion;
 showRoomDialog(lines);
}

function hasCheckedAllMail(folder){
 const checked=folder==="inbox" ? firstRoomState.openedInbox : firstRoomState.openedSent;
 return checked.size===firstRoomScenario.phoneMail[folder].length;
}

function inspectRoomItem(id){
 if(!firstRoomState.questionSeen||game.querySelector(".inspection-overlay,.room-dialog-overlay,.device-overlay"))return;
 const items={phone:{id:"phone",label:"携帯電話",image:"images/items/phone-closed.png"},piano:{id:"piano",label:"ピアノ",image:"images/background/room01/room01_keyboard_closeup.png"},poster:{id:"poster",label:"ポスター",image:"images/background/room01/room01_poster_closeup.png"}};
 const item=items[id];if(!item)return;
 showItemInspection({container:game,item,onContinue:()=>{
  if(id==="phone"){
   if(firstRoomState.phoneIntroductionSeen){showPhoneScreen();return}
   showRoomDialog(firstRoomScenario.phoneIntroduction,()=>{
    firstRoomState.phoneIntroductionSeen=true;
    saveGame();
    showPhoneScreen();
   });
  }else if(id==="piano"){showPianoScreen()}else{showPoster()}
 }});
}

function showPoster(){
 showRoomDialog([
  {logId:"room1_poster_01",logType:"investigation",speaker:"ポスター",text:"○○中学校吹奏楽部 演奏会"},
  {logId:"room1_poster_02",logType:"investigation",speaker:"ポスター",text:"小さなお子さんも楽しめる！"},
  {logId:"room1_poster_03",logType:"investigation",speaker:"ポスター",text:"演奏曲\n・ドレミの歌\n・ほか"}
 ]);
}

function activateDeviceModal(overlay,openerId,initialFocus){
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
 let folder="inbox";
 const list=overlay.querySelector(".mail-list"),detail=overlay.querySelector(".mail-detail");
 recordLog({logId:"room1_phone_select_prompt",logType:"investigation",speaker:"システム",logColor:"#222222",text:"メールを選んで内容を確認する。"});
 const render=()=>{
  overlay.querySelectorAll("[data-folder]").forEach(tab=>tab.classList.toggle("is-active",tab.dataset.folder===folder));
  list.innerHTML=firstRoomScenario.phoneMail[folder].map((mail,index)=>`<button type="button" class="mail-item" data-index="${index}"><strong>${folder==="inbox" ? "差出人" : "宛先"}：${mail.from||mail.to}</strong><span>${mail.time}</span><small>${mail.subject}</small></button>`).join("");
  list.querySelectorAll(".mail-item").forEach(button=>button.addEventListener("click",()=>{
   const mail=firstRoomScenario.phoneMail[folder][Number(button.dataset.index)];
   (folder==="inbox" ? firstRoomState.openedInbox : firstRoomState.openedSent).add(mail.id);
   saveGame();
   detail.innerHTML=`<p>${folder==="inbox" ? "差出人" : "宛先"}：${mail.from||mail.to}　${mail.time}</p><h3>${mail.subject}</h3><p>${mail.text.replace(/\n/g,"<br>")}</p>`;
   recordLog({...mail,speaker:"システム",logColor:"#222222",text:`${folder==="inbox" ? "差出人" : "宛先"}：${mail.from||mail.to}　${mail.time}\n${mail.subject}\n${mail.text}`});
   showRoomNotice(`${folder==="inbox" ? "受信" : "送信"}メールを確認した。`,`room1_phone_${folder}_checked`);
  }));
 };
 overlay.querySelectorAll("[data-folder]").forEach(tab=>tab.addEventListener("click",()=>{folder=tab.dataset.folder;detail.innerHTML="<p>メールを選んで内容を確認する。</p>";render()}));
 render();
 activateDeviceModal(overlay,"phoneButton",overlay.querySelector('[data-folder="inbox"]'));
}

function showPianoScreen(){
 if(firstRoomState.melodySolved&&!firstRoomState.doorUnlocked){showFirstRoomMemory();return}
 const overlay=document.createElement("div");
 overlay.className="device-overlay";
 overlay.innerHTML=`<section class="piano-screen" aria-label="ピアノ"><button type="button" class="device-close" aria-label="閉じる">×</button><h2>ピアノ</h2><p>演奏する譜面を入力する。</p><label>音階<input id="melodyInput" type="text" inputmode="text" autocomplete="off" placeholder="例：ドレミ" aria-label="演奏する音階"></label><p class="piano-result" aria-live="polite"></p><button type="button" id="playMelodyButton">演奏する</button></section>`;
 game.appendChild(overlay);
 recordLog({logId:"room1_piano_prompt",logType:"investigation",speaker:"システム",logColor:"#222222",text:"演奏する譜面を入力する。"});
 const input=overlay.querySelector("#melodyInput"),result=overlay.querySelector(".piano-result"),button=overlay.querySelector("#playMelodyButton");
 const close=activateDeviceModal(overlay,"pianoButton",input);
 let solved=false;
 const finish=()=>{
  close();
  showFirstRoomMemory();
 };
 button.addEventListener("click",()=>{
  if(solved){finish();return}
  firstRoomState.pianoAttempted=true;
  saveGame();
  const melody=input.value.replace(/[\s、。・,]/g,"");
  if(melody!=="ソラファミドレドミシ"||!hasCheckedAllMail("inbox")||!hasCheckedAllMail("sent")){
   showLoggedText(result,"違うようだ。","room1_piano_incorrect","investigation","#8f1c1c");
   return;
  }
  solved=true;
  firstRoomState.melodySolved=true;
  saveGame();
  GameAudio.play("memoryMelody");
  showLoggedText(result,"ピアノが、懐かしいメロディを奏でた。","room1_piano_correct","investigation","#8f1c1c");
  input.disabled=true;
  button.textContent="続ける";
 });
}

function showFirstRoomMemory(){
 showRoomDialog([
  {logId:"room1_memory_01",logType:"narration",speaker:"ト書き",text:"ピアノが、吹奏楽で演奏した曲の一部を奏でた。"},
  {logId:"room1_memory_02",logType:"narration",speaker:"ト書き",text:"中学時代の思い出の一部が、浮かび上がる。"},
  {logId:"room1_memory_03",logType:"dialogue",speaker:"主人公",text:"今のは？僕の記憶？？"}
 ],unlockFirstRoomDoor);
}

function unlockFirstRoomDoor(){
 firstRoomState.doorUnlocked=true;
 saveGame();
 document.getElementById("doorButton").classList.add("is-unlocked");
 document.querySelector(".room").classList.add("is-restored");
 document.getElementById("roomColorStatus").textContent="色を取り戻した部屋";
 showRoomNotice("扉の鍵が開いた。 ","room1_door_unlocked","narration");
}

function showRoomNotice(text,logId,logType="investigation"){
 showLoggedText(document.getElementById("exploreStatus"),text,logId,logType,"#5f675a");
}

function showRoomDialog(lines,onComplete){
 const opener=document.activeElement;
 const room=game.querySelector(".room");
 if(room)room.inert=true;
 const overlay=document.createElement("div");
 overlay.className="room-dialog-overlay";
 overlay.innerHTML=`<section class="room-dialog" role="dialog" aria-modal="true" aria-label="会話"><div class="dialog-message-area" id="roomMessage"></div><div class="dialog-log-area" id="roomLogArea" role="region" aria-label="テキスト履歴" tabindex="0" hidden></div><div class="dialog-controls"><button type="button" class="auto-button" id="roomAutoButton" aria-pressed="false">AUTO OFF</button><button type="button" class="log-button" id="roomLogButton" aria-pressed="false" aria-expanded="false" aria-controls="roomLogArea">LOG</button><button type="button" class="next-button" id="roomNextButton" aria-label="次へ">▶</button></div></section>`;
 game.appendChild(overlay);
 const next=overlay.querySelector("#roomNextButton"),auto=overlay.querySelector("#roomAutoButton"),log=overlay.querySelector("#roomLogButton"),logArea=overlay.querySelector("#roomLogArea");
 overlay.addEventListener("keydown",event=>{
  if(event.key!=="Tab")return;
  const controls=[...overlay.querySelectorAll("[tabindex],button")].filter(control=>!control.hidden&&!control.disabled);
  const first=controls[0],last=controls[controls.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
 });
 Dialogue.start({lines:expandScenario(lines),messageArea:overlay.querySelector("#roomMessage"),nextButton:next,autoButton:auto,logButton:log,logArea,dialog:overlay.querySelector(".room-dialog"),onDisplay:recordLog,getTextSpeed:()=>settings.textSpeed,onComplete:()=>{
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
