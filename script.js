const game=document.getElementById("game");
const tinnitus=new Audio("audio/se/tinnitus.mp3");
const memoryMelody=new Audio("audio/memory_melody_piano.wav");
tinnitus.volume=.5;
memoryMelody.volume=.7;
let playerName="";
let currentScenario=[];
let currentLine=0;
let finishCurrentTyping=null;
const FLASH_TIME=1000,BLACK_TIME=1000,FADE_TIME=3000,TEXT_DELAY=2000,TYPE_SPEED=45;

function splitIntoSentences(text){
 return text.split(/\n+/).flatMap(part=>{
  const sentences=part.match(/[^。！？]+[。！？]+|[^。！？]+/g)||[];
  return sentences.map(sentence=>sentence.trim()).filter(Boolean);
 });
}

function expandScenario(lines){
 return lines.flatMap(line=>splitIntoSentences(line.text).map(text=>({...line,text})));
}

function typeText(element,text,onComplete){
 let index=0,completed=false;
 const finish=()=>{
  if(completed)return;
  completed=true;
  clearInterval(timer);
  element.textContent=text;
  if(finishCurrentTyping===finish)finishCurrentTyping=null;
  if(onComplete)onComplete();
 };
 const timer=setInterval(()=>{
  index++;
  element.textContent=text.slice(0,index);
  if(index>=text.length)finish();
 },TYPE_SPEED);
 element.textContent="";
 return finish;
}

function showTitle(){
 game.innerHTML=`<div class="title-screen"><h1>最後の謎が解けるまで</h1><button id="startButton">はじめる</button></div>`;
 document.getElementById("startButton").addEventListener("click",showNameInput);
}
function showNameInput(){
 game.innerHTML=`<div class="title-screen"><h2>あなたの名前を入力してください</h2><input id="playerName" type="text" maxlength="8" placeholder="名前"><br><br><button id="decideButton">決定</button></div>`;
 document.getElementById("decideButton").addEventListener("click",flashRed);
}
function flashRed(){
 playerName=document.getElementById("playerName").value.trim()||"主人公";
 game.innerHTML=`<div class="flash"></div>`;
 tinnitus.currentTime=0;
 tinnitus.play();
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
function showOpening(){
 game.innerHTML=`<div class="opening"><div id="character-area"></div><div class="dialog" id="dialog" style="display:none"><div id="messageArea"></div><button id="nextButton">▶</button></div></div>`;
 setTimeout(()=>{
  const dialog=document.getElementById("dialog");
  if(!dialog)return;
  dialog.style.display="block";
  startScenario(openingScenario);
 },FADE_TIME+TEXT_DELAY);
}
function startScenario(scenario){
 if(finishCurrentTyping)finishCurrentTyping();
 currentScenario=expandScenario(scenario); currentLine=0; showLine();
 document.getElementById("nextButton").addEventListener("click",nextLine);
}
function showLine(){
 const line=currentScenario[currentLine], area=document.getElementById("messageArea");
 if(!line||!area)return;
 const cls=line.speaker==="主人公"?"player":"heroine";
 area.innerHTML=`<div class="message ${cls}"></div>`;
 finishCurrentTyping=typeText(area.firstElementChild,line.text);
}
function nextLine(){
 if(finishCurrentTyping){finishCurrentTyping();return}
 currentLine++;
 if(currentLine>=currentScenario.length){endOpening();return}
 showLine();
}
function endOpening(){showFirstRoom()}

let firstRoomState;

function showFirstRoom(){
 firstRoomState={doorInspected:false,doorUnlocked:false,questionSeen:false,hanaVisits:0,mailHintGiven:false,pianoAttempted:false,melodySolved:false,openedInbox:new Set(),openedSent:new Set()};
 game.innerHTML=`
  <main class="room" aria-label="第一の部屋">
   <div class="room-light" aria-hidden="true"></div>
   <p class="room-label">第一の部屋</p>
   <button class="object door-object" id="doorButton" aria-label="正面の扉を調べる"><span>正面の扉</span></button>
   <button class="object question-object is-locked" id="questionButton" aria-label="扉の問題文を調べる" disabled><span>問題文</span></button>
   <button class="object hana-object" id="hanaButton" aria-label="ハナに話しかける"><span>ハナ</span></button>
   <button class="object item-object is-locked" id="phoneButton" aria-label="携帯電話を調べる" disabled><span>携帯電話</span></button>
   <button class="object item-object is-locked" id="pianoButton" aria-label="ピアノを調べる" disabled><span>ピアノ</span></button>
   <button class="object item-object is-locked" id="posterButton" aria-label="ポスターを調べる" disabled><span>ポスター</span></button>
   <p class="explore-status" id="exploreStatus">気になる場所をクリックしてください。</p>
  </main>`;
 document.getElementById("doorButton").addEventListener("click",inspectDoor);
 document.getElementById("questionButton").addEventListener("click",showDoorQuestion);
 document.getElementById("hanaButton").addEventListener("click",talkToHana);
 document.getElementById("phoneButton").addEventListener("click",showPhoneScreen);
 document.getElementById("pianoButton").addEventListener("click",showPianoScreen);
 document.getElementById("posterButton").addEventListener("click",showPoster);
 showRoomDialog(firstRoomScenario.introduction);
}

function inspectDoor(){
 if(firstRoomState.doorUnlocked){
  showRoomNotice("扉の鍵が開いている。");
  return;
 }
 if(firstRoomState.doorInspected){
  showRoomNotice("扉は鍵がかかっている。問題文を調べてみよう。");
  return;
 }
 showRoomDialog([
  {speaker:"ト書き",text:"まず、目についた扉を調べた。"},
  {speaker:"ト書き",text:"ドアノブを回そうとしたが、鍵が閉まっているようだ。"}
 ],()=>{
  firstRoomState.doorInspected=true;
  const question=document.getElementById("questionButton");
  question.disabled=false;
  question.classList.remove("is-locked");
  document.getElementById("exploreStatus").textContent="扉に書かれた問題文が気になる。";
 });
}

function showDoorQuestion(){
 showRoomDialog([{speaker:"問題文",text:"会話に隠された音楽を奏でよ"}],()=>{
  if(!firstRoomState.questionSeen){
   firstRoomState.questionSeen=true;
   unlockRoomItems();
  }
 });
}

function unlockRoomItems(){
 ["phoneButton","pianoButton","posterButton"].forEach(id=>{
  const item=document.getElementById(id);
  item.disabled=false;
  item.classList.remove("is-locked");
 });
 document.getElementById("exploreStatus").textContent="新たに気になる場所が見つかった。";
}

function talkToHana(){
 firstRoomState.hanaVisits++;
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

function showPoster(){
 showRoomDialog([
  {speaker:"ポスター",text:"○○中学校吹奏楽部 演奏会"},
  {speaker:"ポスター",text:"小さなお子さんも楽しめる！"},
  {speaker:"ポスター",text:"演奏曲\n・ドレミの歌\n・ほか"}
 ]);
}

function showPhoneScreen(){
 const overlay=document.createElement("div");
 overlay.className="device-overlay";
 overlay.innerHTML=`<section class="phone-screen" aria-label="携帯電話のメール"><header><p>メール</p><button type="button" class="device-close" aria-label="閉じる">×</button></header><div class="mail-tabs"><button type="button" data-folder="inbox" class="is-active">受信BOX</button><button type="button" data-folder="sent">送信BOX</button></div><div class="mail-list"></div><article class="mail-detail" aria-live="polite"><p>メールを選んで内容を確認する。</p></article></section>`;
 game.appendChild(overlay);
 let folder="inbox";
 const list=overlay.querySelector(".mail-list"),detail=overlay.querySelector(".mail-detail");
 const render=()=>{
  overlay.querySelectorAll("[data-folder]").forEach(tab=>tab.classList.toggle("is-active",tab.dataset.folder===folder));
  list.innerHTML=firstRoomScenario.phoneMail[folder].map((mail,index)=>`<button type="button" class="mail-item" data-index="${index}"><strong>${folder==="inbox" ? "差出人" : "宛先"}：${mail.from||mail.to}</strong><span>${mail.time}</span><small>${mail.subject}</small></button>`).join("");
  list.querySelectorAll(".mail-item").forEach(button=>button.addEventListener("click",()=>{
   const mail=firstRoomScenario.phoneMail[folder][Number(button.dataset.index)];
   (folder==="inbox" ? firstRoomState.openedInbox : firstRoomState.openedSent).add(mail.id);
   detail.innerHTML=`<p>${folder==="inbox" ? "差出人" : "宛先"}：${mail.from||mail.to}　${mail.time}</p><h3>${mail.subject}</h3><p>${mail.text.replace(/\n/g,"<br>")}</p>`;
   showRoomNotice(`${folder==="inbox" ? "受信" : "送信"}メールを確認した。`);
  }));
 };
 overlay.querySelectorAll("[data-folder]").forEach(tab=>tab.addEventListener("click",()=>{folder=tab.dataset.folder;detail.innerHTML="<p>メールを選んで内容を確認する。</p>";render()}));
 overlay.querySelector(".device-close").addEventListener("click",()=>overlay.remove());
 render();
}

function showPianoScreen(){
 const overlay=document.createElement("div");
 overlay.className="device-overlay";
 overlay.innerHTML=`<section class="piano-screen" aria-label="ピアノ"><button type="button" class="device-close" aria-label="閉じる">×</button><h2>ピアノ</h2><p>演奏する譜面を入力する。</p><label>音階<input id="melodyInput" type="text" inputmode="text" autocomplete="off" placeholder="例：ドレミ" aria-label="演奏する音階"></label><p class="piano-result" aria-live="polite"></p><button type="button" id="playMelodyButton">演奏する</button></section>`;
 game.appendChild(overlay);
 const input=overlay.querySelector("#melodyInput"),result=overlay.querySelector(".piano-result"),button=overlay.querySelector("#playMelodyButton");
 let solved=false;
 const finish=()=>{
  overlay.remove();
  showRoomDialog([
   {speaker:"ト書き",text:"ピアノが、吹奏楽で演奏した曲の一部を奏でた。"},
   {speaker:"ト書き",text:"中学時代の思い出の一部が、浮かび上がる。"},
   {speaker:"主人公",text:"今のは？僕の記憶？？"}
  ],unlockFirstRoomDoor);
 };
 button.addEventListener("click",()=>{
  if(solved){finish();return}
  firstRoomState.pianoAttempted=true;
  const melody=input.value.replace(/[\s、。・,]/g,"");
  if(melody!=="ソラファミドレドミシ"||!hasCheckedAllMail("inbox")||!hasCheckedAllMail("sent")){
   result.textContent="違うようだ。";
   return;
  }
  solved=true;
  firstRoomState.melodySolved=true;
  memoryMelody.currentTime=0;
  memoryMelody.play().catch(()=>{});
  result.textContent="ピアノが、懐かしいメロディを奏でた。";
  input.disabled=true;
  button.textContent="続ける";
 });
 overlay.querySelector(".device-close").addEventListener("click",()=>overlay.remove());
}

function unlockFirstRoomDoor(){
 firstRoomState.doorUnlocked=true;
 document.getElementById("doorButton").classList.add("is-unlocked");
 showRoomNotice("扉の鍵が開いた。 ");
}

function showRoomNotice(text){
 document.getElementById("exploreStatus").textContent=text;
}

function showRoomDialog(lines,onComplete){
 const overlay=document.createElement("div");
 overlay.className="room-dialog-overlay";
 overlay.innerHTML=`<div class="room-dialog"><div id="roomMessage"></div><button type="button" id="roomNextButton" aria-label="次へ">▶</button></div>`;
 game.appendChild(overlay);
 const roomLines=expandScenario(lines);
 let index=0,finishRoomTyping=null;
 const message=overlay.querySelector("#roomMessage"),next=overlay.querySelector("#roomNextButton");
 const render=()=>{
  const line=roomLines[index];
  const cls=line.speaker==="主人公" ? "player" : line.speaker==="システム" || line.speaker==="ト書き" || line.speaker==="問題文" ? "system" : "heroine";
  message.innerHTML=`<p class="speaker ${cls}">${line.speaker==="ト書き" ? "" : line.speaker}</p><div class="message ${cls}"></div>`;
  finishRoomTyping=typeText(message.querySelector(".message"),line.text,()=>{finishRoomTyping=null});
 };
 next.addEventListener("click",()=>{
  if(finishRoomTyping){finishRoomTyping();finishRoomTyping=null;return}
  index++;
  if(index>=roomLines.length){overlay.remove();if(onComplete)onComplete();return}
  render();
 });
 render();
}
showTitle();

let lastTouchEnd=0;
document.addEventListener("touchend",event=>{
 const now=Date.now();
 if(now-lastTouchEnd<=300)event.preventDefault();
 lastTouchEnd=now;
},{passive:false});
["gesturestart","gesturechange","gestureend"].forEach(type=>{
 document.addEventListener(type,e=>e.preventDefault());
});
