const game=document.getElementById("game");
const tinnitus=new Audio("audio/se/tinnitus.mp3");
tinnitus.volume=.5;
let playerName="";
let currentScenario=[];
let currentLine=0;
const FLASH_TIME=1000,BLACK_TIME=1000,FADE_TIME=3000,TEXT_DELAY=2000;

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
 currentScenario=scenario; currentLine=0; showLine();
 document.getElementById("nextButton").addEventListener("click",nextLine);
}
function showLine(){
 const line=currentScenario[currentLine], area=document.getElementById("messageArea");
 if(!line||!area)return;
 const cls=line.speaker==="主人公"?"player":"heroine";
 area.innerHTML=`<div class="message ${cls}">${line.text.replace(/\n/g,"<br>")}</div>`;
}
function nextLine(){
 currentLine++;
 if(currentLine>=currentScenario.length){endOpening();return}
 showLine();
}
function endOpening(){showFirstRoom()}

let firstRoomState;

function showFirstRoom(){
 firstRoomState={doorInspected:false,questionSeen:false,hanaVisits:0};
 game.innerHTML=`
  <main class="room" aria-label="第一の部屋">
   <div class="room-light" aria-hidden="true"></div>
   <p class="room-label">第一の部屋</p>
   <button class="object door-object" id="doorButton" aria-label="正面の扉を調べる"><span>正面の扉</span></button>
   <button class="object question-object is-locked" id="questionButton" aria-label="扉の問題文を調べる" disabled><span>問題文</span></button>
   <button class="object hana-object" id="hanaButton" aria-label="ハナに話しかける"><span>ハナ</span></button>
   <button class="object item-object is-locked" id="phoneButton" aria-label="スマホを調べる" disabled><span>スマホ</span></button>
   <button class="object item-object is-locked" id="pianoButton" aria-label="ピアノを調べる" disabled><span>ピアノ</span></button>
   <button class="object item-object is-locked" id="posterButton" aria-label="ポスターを調べる" disabled><span>ポスター</span></button>
   <p class="explore-status" id="exploreStatus">気になる場所をクリックしてください。</p>
  </main>`;
 document.getElementById("doorButton").addEventListener("click",inspectDoor);
 document.getElementById("questionButton").addEventListener("click",showDoorQuestion);
 document.getElementById("hanaButton").addEventListener("click",talkToHana);
 ["phoneButton","pianoButton","posterButton"].forEach(id=>{
  document.getElementById(id).addEventListener("click",()=>showRoomNotice("調べる対象を選びました。"));
 });
 showRoomDialog(firstRoomScenario.introduction);
}

function inspectDoor(){
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
 const lines=firstRoomState.questionSeen ? firstRoomScenario.hanaAfterQuestion : firstRoomScenario.hanaBeforeQuestion;
 showRoomDialog(lines);
}

function showRoomNotice(text){
 document.getElementById("exploreStatus").textContent=text;
}

function showRoomDialog(lines,onComplete){
 const overlay=document.createElement("div");
 overlay.className="room-dialog-overlay";
 overlay.innerHTML=`<div class="room-dialog"><div id="roomMessage"></div><button type="button" id="roomNextButton" aria-label="次へ">▶</button></div>`;
 game.appendChild(overlay);
 let index=0;
 const message=overlay.querySelector("#roomMessage"),next=overlay.querySelector("#roomNextButton");
 const render=()=>{
  const line=lines[index];
  const cls=line.speaker==="主人公" ? "player" : line.speaker==="システム" || line.speaker==="ト書き" || line.speaker==="問題文" ? "system" : "heroine";
  message.innerHTML=`<p class="speaker ${cls}">${line.speaker==="ト書き" ? "" : line.speaker}</p><div class="message ${cls}">${line.text.replace(/\n/g,"<br>")}</div>`;
 };
 next.addEventListener("click",()=>{
  index++;
  if(index>=lines.length){overlay.remove();if(onComplete)onComplete();return}
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
