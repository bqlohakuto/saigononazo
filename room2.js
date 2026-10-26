// 第二の部屋。素材画像は room02/ 以下へ差し替えられるようCSS上の仮背景で構成。
const ROOM2_SYMBOLS=["〇","△","□","×","＋"];
const ROOM2_COLORS=["赤","青"];
const ROOM2_DIALOGUES={
 "0H":[["見事に全部違うね！","嬉しそうに言わないでください……"],["おっ、ちょっと反応したね！","……この結果、覚えておきます"],["おっ、何かわかりそう？","うーん、もう少し考えてみます"],["ふふっ、どう？　手応えはある？","まだ何とも言えません。少し整理してみます"],["わっ、こんな判定もあるんだ！","……ちょっと悩ましいですね"],["えーっ！　これはこれですごくない？","……褒められてる気がしないんですけど"]],
 "1H":[["おっ、1つHITだね！","……この結果も手がかりになりそうです"],["おっ、これはどうかな？","……次の手を考えてみます"],["ふふっ、次はどうする？","……もう少し慎重に考えてみます"],["ん？　これは気になる結果だね！","……もう一度、判定を見てみます"],["おおっ！　なんだか惜しそう！","もう一度、考えてみます"]],
 "2H":[["あれ、考え込んじゃった？","……ちょっと、考えに夢中になってました"],["ふふっ、こういうのって楽しいよね","はい、ちょっと楽しくなってきました"],["おっ、考えがいのある結果だね！","……簡単にはいかないですね"],["おっ、いい感じじゃない？","……少し、わかってきた気がします"]],
 "3H":[["おっ、3つHITだね！","……これは、じっくり考えたいですね"],["3つHIT！　いい感じだね！","もう少しでわかりそうな気がします"],["3つHIT！　かなり近づいたね！","もう一度、判定を見直してみます"]],
 "4H":[["4つHIT！　あと少しだね！","ここまで来たなら、もう一度考えてみます"]]
};

function room2RandomAnswer(){
 const symbols=[...ROOM2_SYMBOLS];
 for(let i=symbols.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[symbols[i],symbols[j]]=[symbols[j],symbols[i]]}
 return symbols.map(symbol=>({symbol,color:ROOM2_COLORS[Math.floor(Math.random()*2)]}));
}
function showSecondRoom(savedState){
 Dialogue.stop();firstRoomState=undefined;currentScene="room02";GameAudio.syncSceneMusic?.(currentScene);
 room2State={doorInspected:false,deskInspected:false,hanaHints:0,answer:room2RandomAnswer(),guess:[],attempts:0,run:1,history:[],unlocked:false,flashbackSeen:false,challengeActive:false,challengeCleared:false,challengeBest:null,highlightEnabled:true,leftmostHintRevealed:false,secretHerbFound:false,...savedState};
 if(!Array.isArray(room2State.answer)||room2State.answer.length!==5||!Array.isArray(room2State.guess))room2State={...room2State,answer:room2RandomAnswer(),guess:[]};
 if(!Array.isArray(room2State.history))room2State.history=[];
 room2State.leftmostHintRevealed=room2State.leftmostHintRevealed===true;
 room2State.challengeActive=room2State.unlocked===true&&room2State.challengeActive===true;
 room2State.challengeCleared=room2State.challengeCleared===true;
 room2State.challengeBest=Number.isInteger(room2State.challengeBest)&&room2State.challengeBest>=1&&room2State.challengeBest<=8?room2State.challengeBest:null;
 game.innerHTML=`<main class="room room-two room2-arriving ${room2State.unlocked?"is-restored":""}" aria-label="第二の部屋">
  <header class="room-header"><p class="room-label">第二の部屋</p><p class="room-color-status">${room2State.unlocked?"色を取り戻した部屋":"淡い記憶の部屋"}</p></header>
  <div class="room-stage-wrap"><section class="room-stage room2-stage" aria-label="第二の部屋">
   <img class="room2-background-art" src="images/background/room02/room02_bg_nodesk.png?v=20261013-room02-clean-alpha-01" alt="" aria-hidden="true" draggable="false" decoding="async">
   <button class="room2-secret-dresser" id="r2Dresser" type="button" aria-label="左のタンスを調べる"></button>
   <button class="object room2-object room2-door" id="r2Door"><span>正面の扉</span></button>
   <button class="object room2-object room2-table" id="r2Desk"><span>机</span></button>
   <button class="object room2-object room2-blocks" id="r2Blocks" ${room2State.deskInspected?"":"disabled"}><span>${room2State.challengeActive?"チャレンジ再開":"ブロックと記録枠"}</span></button>
   <button class="object room2-object room2-hana" id="r2Hana"><span>ハナ</span></button>
   <img class="room2-desk-foreground-art" src="images/background/room02/room02_desk_foreground.png?v=20261013-room02-clean-alpha-01" alt="" aria-hidden="true" draggable="false" decoding="async">
  </section></div>
  <div class="room-navigation" aria-hidden="true"></div><p class="explore-status" id="exploreStatus">気になる場所をクリックしてください。</p>
 </main>`;
 document.getElementById("r2Dresser").addEventListener("click",()=>inspectSecondRoomDresser());
 document.getElementById("r2Door").addEventListener("click",()=>inspectSecondRoomDoor());
 document.getElementById("r2Desk").addEventListener("click",()=>inspectSecondRoomDesk());
 document.getElementById("r2Blocks").addEventListener("click",()=>room2State.unlocked&&!room2State.challengeActive?showRoom2ChallengeMenu():showSecondRoomPuzzle());
 document.getElementById("r2Hana").addEventListener("click",()=>showSecondRoomHana());
 window.RoomExploration?.mount('room02',game.querySelector('.room2-stage'),'front',room2State,{image:'images/background/room02/room02_bg_nodesk.png',imageAspect:16/9});
 const memoryProgress=room2SavedMemoryProgress(savedState);
 if(!savedState){showRoomDialog(room2IntroLines)} else if(savedState.nextRoomTransitionSeen){showThirdRoomBoundary()}
 else if(memoryProgress?.phase==="correct"){handleRoom2Correct(()=>{},memoryProgress)}
 else if(memoryProgress){completeRoom2(memoryProgress)}
 if(window.GameplayUI)GameplayUI.installRoom({sceneId:"room02",title:"第二の部屋",objective:()=>room2State.unlocked?"扉を調べて次へ進む":"部屋を調べる",onCompanion:showSecondRoomHana,getHighlights:()=>!!room2State.highlightEnabled,setHighlights:enabled=>{room2State.highlightEnabled=!!enabled;saveGame()}});
 saveGame();
}

function showRoomChoices(choices){
 const overlay=document.createElement("div");overlay.className="device-overlay room2-choice-overlay";
 overlay.innerHTML=`<section class="menu-panel room-exit-menu room2-choice-panel" role="dialog" aria-modal="true" aria-label="扉の行き先を選ぶ"><button type="button" class="device-close" aria-label="閉じる">×</button><div class="room2-choice-options">${choices.map((choice,index)=>`<button type="button" data-choice="${index}">${choice.label}</button>`).join("")}</div></section>`;
 game.appendChild(overlay);
 // Use the same Escape/Tab focus trap and opener restoration as other puzzle windows.
 const close=activateDeviceModal(overlay,"r2Door",overlay.querySelector("[data-choice]"));
 overlay.querySelectorAll("[data-choice]").forEach(button=>button.addEventListener("click",()=>{const choice=choices[Number(button.dataset.choice)];close();choice.onSelect()}));
}

const room2IntroLines=[
 {logId:"room2_intro_01",logType:"narration",speaker:"ト書き",text:"光が薄れ、視界が戻る。そこは、また別の部屋だった。正面には一枚の扉。中央には机が一つ。"},
 {logId:"room2_intro_02",logType:"narration",speaker:"主人公",thought:true,text:"今度は、ずいぶん何もない部屋だな……"},
 {logId:"room2_intro_03",logType:"narration",speaker:"ト書き",text:"机の上には、何かが並べられているようだ。"},
 {logId:"room2_intro_04",logType:"dialogue",speaker:"ハナ",text:"今度は、どんな部屋なんだろうね"}
];
function inspectSecondRoomDoor(){
 if(room2State.unlocked){showRoomChoices([
  {label:"次の部屋へ向かう",onSelect:()=>showRoomDialog([
   {logId:"room2_room3_transition_01",logType:"narration",speaker:"主人公",text:"僕はドアノブに手を伸ばした。"},
   {logId:"room2_room3_transition_02",logType:"narration",speaker:"ト書き",text:"開けようとすると、また扉はひとりでに開いた。扉の向こうへ、身体が吸い込まれていくような感覚に襲われる。視界が、まばゆい光に包まれていく。"}
  ],showThirdRoomBoundary)},
  {label:"もう少し調べる",onSelect:()=>{}}
 ]);return}
 if(room2State.doorInspected){showRoomNotice("『正しい組み合わせを導け』","room2_door_again");return}
 room2State.doorInspected=true;saveGame();
 showRoomDialog([
  {logId:"room2_door_01",logType:"investigation",speaker:"ト書き",text:"木製の扉だ。ドアノブを回してみた。"},
  {logId:"room2_door_02",logType:"investigation",speaker:"主人公",text:"やっぱり開かないか"},
  {logId:"room2_door_03",logType:"investigation",speaker:"ト書き",text:"鍵がかかっているようだ。扉には文字が刻まれている。『正しい組み合わせを導け』"},
  {logId:"room2_door_04",logType:"dialogue",speaker:"主人公",text:"正しい組み合わせ……？　どういう意味だろう"}
 ]);
}
// Hidden exploration point: it does not use the shared .object marker style.
function inspectSecondRoomDresser(){
 if(room2State.secretHerbFound){
  showRoomDialog([
   {logId:"room2_dresser_repeat_01",logType:"investigation",speaker:"ト書き",text:"タンスを調べた"},
   {logId:"room2_dresser_repeat_02",logType:"investigation",speaker:"ト書き",text:"もう何も入っていない。"}
  ]);
  return;
 }
 room2State.secretHerbFound=true;
 saveGame();
 showRoomDialog([
  {logId:"room2_dresser_01",logType:"investigation",speaker:"ト書き",text:"タンスを調べた"},
  {logId:"room2_dresser_02",logType:"investigation",speaker:"ト書き",text:"やくそうを手に入れた"},
  {logId:"room2_dresser_03",logType:"narration",speaker:"主人公",thought:true,text:"これは一体？？"}
 ]);
}
function inspectSecondRoomDesk(){
 if(room2State.deskInspected){
  if(room2State.unlocked&&!room2State.challengeActive)showRoom2ChallengeMenu();
  else showSecondRoomPuzzle();
  return;
 }
 room2State.deskInspected=true;saveGame();document.getElementById("r2Blocks").disabled=false;
 showRoomDialog([
  {logId:"room2_desk_01",logType:"investigation",speaker:"ト書き",text:"机の上には、〇、△、□、×、＋の記号が書かれたブロックが置かれている。それぞれ、赤と青の2色がある。"},
  {logId:"room2_desk_02",logType:"investigation",speaker:"ト書き",text:"その奥には、ブロックをはめ込めそうな5つの枠が並んでいた。枠の横には『HIT』『BLOW』と書かれた表示がある。"},
  {logId:"room2_desk_03",logType:"narration",speaker:"主人公",thought:true,text:"このブロックを、枠にはめればいいのか……？"}
 ],()=>{if(currentScene==="room02")showSecondRoomPuzzle()});
}
function syncRoom2BlocksLabel(){
 const button=document.getElementById?.("r2Blocks");
 const label=button?.querySelector?.("span");
 if(label)label.textContent=room2State.challengeActive?"チャレンジ再開":"ブロックと記録枠";
}
function showRoom2ChallengeMenu(){
 if(!room2State.unlocked||room2State.challengeActive)return;
 const best=room2State.challengeBest===null?"自己ベスト：未達成":`自己ベスト：${room2State.challengeBest}回。`;
 const overlay=document.createElement("div");overlay.className="device-overlay room2-start-overlay";
 overlay.innerHTML=`<section class="room2-result-panel room2-start-panel" role="dialog" aria-modal="true" aria-label="8回チャレンジの開始">
  <button type="button" class="device-close" aria-label="部屋に戻る">×</button>
  <p class="room2-result-kicker">8回チャレンジ</p>
  <h2 class="room2-result-title">挑戦してみる？</h2>
  <p class="room2-result-attempts">8回以内に正しい組み合わせを導こう。</p>
  <p class="room2-result-best">${best}</p>
  <p class="room2-result-note">何度でも挑戦できる。</p>
  <div class="room2-result-actions">
   <button type="button" class="room2-start-confirm">挑戦する</button>
   <button type="button" class="room2-start-return">部屋に戻る</button>
  </div>
 </section>`;
 game.appendChild(overlay);
 recordLog({logId:"room2_challenge_offer",logType:"investigation",speaker:"ト書き",text:`8回チャレンジ。8回以内に正解を目指す。何度でも再挑戦できる。${best}`});
 const close=activateDeviceModal(overlay,"r2Blocks",overlay.querySelector(".room2-start-confirm"));
 overlay.querySelector(".room2-start-confirm").addEventListener("click",()=>{close();beginRoom2Challenge()});
 overlay.querySelector(".room2-start-return").addEventListener("click",close);
}
function beginRoom2Challenge(){
 room2State.challengeActive=true;room2State.answer=room2RandomAnswer();
 room2State.guess=[];room2State.history=[];room2State.attempts=0;
 room2State.leftmostHintRevealed=false;room2State.run=(room2State.run||1)+1;
 syncRoom2BlocksLabel();saveGame();showSecondRoomPuzzle();
}
function room2ChallengeResultInfo(success,attempts,best,newRecord){
 const title=success?"チャレンジ達成！":"今回は達成できなかった";
 const detail=success?`${attempts}回で正解した。`:`8回の挑戦が終わった。`;
 const bestText=best===null?"自己ベスト：未達成":newRecord?`自己ベスト更新！　${best}回！`:`自己ベスト：${best}回。`;
 const note=success?"次はもっと少ない回数でも挑戦できる。":"何度でも再挑戦できる。";
 const logText=success?`8回チャレンジ達成！\n${detail}\n${bestText}`:`${detail}\n今回は正解に届かなかった。\n${bestText}`;
 return {success,title,detail,bestText,note,logText};
}
function showRoom2ChallengeResult(info){
 const overlay=document.createElement("div");overlay.className="device-overlay room2-result-overlay";
 overlay.innerHTML=`<section class="room2-result-panel" role="dialog" aria-modal="true" aria-label="8回チャレンジの結果">
  <button type="button" class="device-close" aria-label="部屋に戻る">×</button>
  <p class="room2-result-kicker">8回チャレンジ</p>
  <h2 class="room2-result-title">${info.title}</h2>
  <p class="room2-result-attempts">${info.detail}</p>
  <p class="room2-result-best">${info.bestText}</p>
  <p class="room2-result-note">${info.note}</p>
  <div class="room2-result-actions">
   <button type="button" class="room2-result-retry">もう一度挑戦する</button>
   <button type="button" class="room2-result-return">部屋に戻る</button>
  </div>
 </section>`;
 game.appendChild(overlay);
 const close=activateDeviceModal(overlay,"r2Blocks",overlay.querySelector(".room2-result-retry"));
 overlay.querySelector(".room2-result-retry").addEventListener("click",()=>{close();beginRoom2Challenge()});
 overlay.querySelector(".room2-result-return").addEventListener("click",close);
}
function finishRoom2Challenge(close,success){
 const attempts=room2State.attempts;
 const previousBest=room2State.challengeBest;
 const newRecord=success&&(previousBest===null||attempts<previousBest);
 room2State.challengeActive=false;
 syncRoom2BlocksLabel();
 if(success){
  room2State.challengeCleared=true;
  room2State.challengeBest=room2State.challengeBest===null?attempts:Math.min(room2State.challengeBest,attempts);
 }
 saveGame();close();
 const info=room2ChallengeResultInfo(success,attempts,room2State.challengeBest,newRecord);
 recordLog({logId:`room2_challenge_result_${room2State.run}`,logType:"investigation",speaker:"ト書き",text:info.logText});
 showRoom2ChallengeResult(info);
}
function room2ChallengeCounterInfo(attempts){
 const used=Number.isInteger(attempts)?Math.min(8,Math.max(0,attempts)):0;
 return {used,remaining:8-used};
}
// The one-time leftmost clue is earned only when one of the first five
// judgements already establishes all five symbol/color combinations.
function room2ShouldRevealLeftmostHint(history,attempts){
 if(!Array.isArray(history)||!Number.isInteger(attempts)||attempts<5||history.length<5)return false;
 const firstFive=history.slice(0,5);
 if(firstFive.some(entry=>entry?.hit===5&&entry?.blow===0))return false;
 return firstFive.some(entry=>
  Number.isInteger(entry?.hit)&&Number.isInteger(entry?.blow)&&
  entry.hit>=0&&entry.blow>=0&&entry.hit<5&&entry.hit+entry.blow===5
 );
}
function showRoom2AbandonConfirm(overlay,closePuzzle,clearReactionTimer){
 const puzzle=overlay.querySelector(".room2-puzzle");
 if(!puzzle||puzzle.querySelector(".room2-abandon-confirm"))return;
 const prompt=document.createElement("div");prompt.className="room2-abandon-confirm";
 prompt.setAttribute("role","alertdialog");
 prompt.setAttribute("aria-modal","true");
 prompt.setAttribute("aria-label","8回チャレンジを終了しますか");
 prompt.innerHTML=`<div class="room2-abandon-panel">
  <p class="room2-result-kicker">8回チャレンジ</p>
  <h2>今回の挑戦を終了しますか？</h2>
  <p>回答と判定履歴はリセットされます。<br>自己ベストは残ります。</p>
  <div class="room2-result-actions">
   <button type="button" class="room2-abandon-accept">終了する</button>
   <button type="button" class="room2-abandon-continue">挑戦を続ける</button>
  </div>
 </div>`;
 const originalFocus=document.activeElement;
 const suspended=[...puzzle.children].map(node=>({node,inert:node.inert,hidden:node.getAttribute("aria-hidden")}));
 suspended.forEach(({node})=>{node.inert=true;node.setAttribute("aria-hidden","true")});
 puzzle.appendChild(prompt);
 const cancel=()=>{
  window.removeEventListener("keydown",onEscape,true);
  prompt.remove();
  suspended.forEach(({node,inert,hidden})=>{node.inert=inert;if(hidden===null)node.removeAttribute("aria-hidden");else node.setAttribute("aria-hidden",hidden)});
  if(originalFocus?.isConnected&&!originalFocus.closest("[inert]"))originalFocus.focus({preventScroll:true});
 };
 function onEscape(event){
  if(event.key!=="Escape")return;
  event.preventDefault();event.stopImmediatePropagation();cancel();
 }
 window.addEventListener("keydown",onEscape,true);
 prompt.querySelector(".room2-abandon-continue").addEventListener("click",cancel);
 prompt.querySelector(".room2-abandon-accept").addEventListener("click",()=>{
  cancel();
  clearReactionTimer();
  room2State.challengeActive=false;
  syncRoom2BlocksLabel();
  room2State.guess=[];room2State.history=[];room2State.attempts=0;
  room2State.leftmostHintRevealed=false;
  saveGame();
  recordLog({logId:`room2_challenge_abandoned_${room2State.run}`,logType:"investigation",speaker:"ト書き",text:"今回のチャレンジを終了した。自己ベストは残る。"});
  closePuzzle();
 });
 prompt.querySelector(".room2-abandon-continue").focus({preventScroll:true});
}

function showSecondRoomPuzzle(){
 if(room2State.challengeActive&&room2State.attempts>=8){finishRoom2Challenge(()=>{},false);return}
 // Retain five fixed wells; older packed saves are upgraded without losing positions.
 room2State.guess=Array.from({length:5},(_,index)=>{
  const piece=Array.isArray(room2State.guess)?room2State.guess[index]:null;
  return piece&&ROOM2_SYMBOLS.includes(piece.symbol)&&ROOM2_COLORS.includes(piece.color)?{symbol:piece.symbol,color:piece.color}:null;
 });
 const isChallenge=room2State.challengeActive===true;
 const counterMarkup=isChallenge?`<section class="room2-attempt-counter" role="status" aria-live="polite" aria-label="チャレンジの残り回数"><div class="room2-attempt-summary"><span class="room2-attempt-used">解答 0 / 8 回</span><strong class="room2-attempt-left">残り8回</strong></div><div class="room2-attempt-track" aria-hidden="true">${Array.from({length:8},()=>'<span class="room2-attempt-step"></span>').join("")}</div></section>`:"";
 const overlay=document.createElement("div");overlay.className="device-overlay room2-puzzle-overlay";
 overlay.innerHTML=`<section class="room2-puzzle room2-immersive-board ${isChallenge?"room2-challenge-board":"room2-standard-board"}" role="dialog" aria-modal="true" aria-label="HITとBLOWの謎">${isChallenge?'<button type="button" class="device-close room2-pause" aria-label="一時中断" title="回答と判定履歴を保持して部屋に戻る">一時中断</button>':'<button type="button" class="device-close" aria-label="閉じる">×</button>'}<h2 class="room2-immersive-heading">${isChallenge?"8回チャレンジ":"記号と色を並べる"}</h2><details class="room2-board-help"><summary title="操作方法・ルール" aria-label="操作方法・ルールを確認">？</summary><div class="room2-rule"><p>【駒の操作】</p><p>赤と青の駒から記号を選び、好きな穴を押してはめ込む。置いた駒は下のトレーからなくなる。盤上の駒を2つ続けて押すと位置を交換でき、同じ駒を2度押すと取り外してトレーに戻せる。マウスではドラッグでも移動できる。色を変えたい時は別の色の駒を選んで置き直そう。</p><p>【判定】</p><p>5つの駒を置いたら、盤の右側にあるレバーを倒す。答えと記号・色・位置がすべて一致するとHIT。記号と色が一致し、位置だけが異なるとBLOW。判定後も駒はそのまま残るので、配置を変えて次の解答を試せる。装置の表示窓に結果が出たあと、主人公が隣の記録用紙に書き写す。同じ配置の再解答では回数を消費しない。</p><p>【挑戦条件】</p><p>${isChallenge?"8回以内に5枠すべてを一致させれば達成。8回目までに正解できなければ今回の挑戦は終了する。何度でも再挑戦できる。":"判定結果を手がかりに正しい組み合わせを導き出せ。回数制限はない。"}</p></div></details><div class="room2-wood-workbench" aria-label="机に置かれた木の仕掛け"><div class="room2-answer-slots" role="group" aria-label="回答"></div><div class="room2-bench-ridge" aria-hidden="true"></div><div class="room2-palette" role="group" aria-label="手元の駒"></div><div class="room2-puzzle-actions"><button type="button" class="room2-clear">駒を戻す</button><button type="button" class="room2-leftmost-request" hidden>左端を調べる</button>${isChallenge?`<button type="button" class="room2-abandon">挑戦をやめる</button>`:""}</div><div class="room2-digital-readout" role="status" aria-live="polite" aria-atomic="true" aria-label="判定装置のデジタル表示"><div class="room2-digital-row"><span>HIT</span><output class="room2-digital-hit">--</output></div><div class="room2-digital-row"><span>BLOW</span><output class="room2-digital-blow">--</output></div></div><button type="button" class="room2-submit room2-physical-lever" aria-label="判定レバーを倒す" title="5つの駒をはめたらレバーを動かす"><span class="room2-lever-mount" aria-hidden="true"><span class="room2-lever-track"></span><span class="room2-lever-arm"><span class="room2-lever-grip"></span></span><span class="room2-lever-pivot"></span></span></button></div><aside class="room2-sidebar" aria-label="机に置かれた判定メモ">${counterMarkup}<div class="room2-paper-heading" aria-hidden="true">判定の記録</div><p class="room2-feedback" aria-live="polite"></p><p class="room2-leftmost-hint" aria-live="polite" hidden></p><section class="room2-reaction" hidden aria-label="判定後の会話" role="status" aria-live="polite"><div class="room2-reaction-lines"></div></section><div class="room2-history" aria-label="これまでの判定"></div></aside></section>`;
 game.appendChild(overlay);
 // The nonblocking conversation floats over the paper ledger inside its sidebar.
 const slots=overlay.querySelector(".room2-answer-slots"),palette=overlay.querySelector(".room2-palette"),history=overlay.querySelector(".room2-history"),feedback=overlay.querySelector(".room2-feedback"),hint=overlay.querySelector(".room2-leftmost-hint"),hintRequest=overlay.querySelector(".room2-leftmost-request"),reactionPanel=overlay.querySelector(".room2-reaction");let selectedSlot=null,lastPlacedSlot=null,heldToken=null;
 const digital=overlay.querySelector(".room2-digital-readout");
 const digitalHit=digital.querySelector(".room2-digital-hit"),digitalBlow=digital.querySelector(".room2-digital-blow");
 let reactionTimer=null,screenTimer=null,memoTimer=null,resolutionTimer=null;
 let visibleHistoryCount=room2State.history.length,pendingMemo=false,pendingResolution=null,newlyWrittenCount=-1;
 const clearReactionTimer=()=>{if(reactionTimer!==null){window.clearTimeout(reactionTimer);reactionTimer=null}};
 const clearPuzzleTimers=()=>{
  clearReactionTimer();
  if(screenTimer!==null){window.clearTimeout(screenTimer);screenTimer=null}
  if(memoTimer!==null){window.clearTimeout(memoTimer);memoTimer=null}
  if(resolutionTimer!==null){window.clearTimeout(resolutionTimer);resolutionTimer=null}
 };
 const finishPendingResolution=()=>{const finish=pendingResolution;pendingResolution=null;finish?.()};
 const onClosePuzzle=()=>{
  clearPuzzleTimers();
  // Persisted results survive a close midway through the writing animation;
  // a solved or exhausted run also completes normally.
  finishPendingResolution();
 };
 const close=activateDeviceModal(overlay,"r2Blocks",overlay.querySelector(".device-close"),onClosePuzzle);
 const lastJudgement=room2State.history.at(-1);
 if(lastJudgement){
  digitalHit.textContent=String(lastJudgement.hit);digitalBlow.textContent=String(lastJudgement.blow);
  digital.classList.add("has-result");
 }
 if(isChallenge)overlay.querySelector(".room2-abandon").addEventListener("click",()=>showRoom2AbandonConfirm(overlay,close,()=>{clearReactionTimer();pendingResolution=null}));
 overlay.querySelector(".room2-clear").onclick=()=>{if(!room2State.guess.some(Boolean))return;room2State.guess=Array(5).fill(null);selectedSlot=null;heldToken=null;feedback.textContent="";saveGame();render()};
 let reactionDone=null;
 const endReaction=()=>{
  clearReactionTimer();reactionPanel.hidden=true;
  const done=reactionDone;reactionDone=null;done?.();
 };
 const showReaction=(lines,onDone)=>{
  clearReactionTimer();reactionDone=onDone;
  const reactionLines=lines||[];
  if(!reactionLines.length){endReaction();return}
  const list=reactionPanel.querySelector(".room2-reaction-lines");
  list.replaceChildren();
  for(const line of reactionLines){
   const item=document.createElement("div");item.className="room2-reaction-line "+(line.speaker==="ハナ"?"is-hana":"is-protagonist");
   const name=document.createElement("strong");name.className="room2-reaction-name";name.textContent=line.speaker;
   const message=document.createElement("p");message.className="room2-reaction-speech";message.textContent=line.text;
   item.append(name,message);list.append(item);
   recordLog(line);
  }
  reactionPanel.hidden=false;
  const totalChars=reactionLines.reduce((sum,line)=>sum+line.text.length,0);
  const duration=Math.min(10500,Math.max(6000,3000+totalChars*85));
  reactionTimer=window.setTimeout(()=>{reactionTimer=null;if(overlay.isConnected)endReaction()},duration);
 };
 let renderedHistoryCount=-1;
 const render=()=>{
  // A physical token is picked up first, then placed in a hole. Drag-and-drop is
  // an enhancement on desktop; two taps always work on phones and keyboards.
  const dropToken=(token,index,sourceSlot=null)=>{
   if(!token||!ROOM2_SYMBOLS.includes(token.symbol)||!ROOM2_COLORS.includes(token.color))return;
   if(!Number.isInteger(index)||index<0||index>=5)return;
   const guess=room2State.guess;
   // A board piece moves or swaps; a tray piece replaces a target well.
   if(Number.isInteger(sourceSlot)&&sourceSlot>=0&&sourceSlot<5&&
      guess[sourceSlot]?.symbol===token.symbol&&guess[sourceSlot]?.color===token.color){
    [guess[sourceSlot],guess[index]]=[guess[index],guess[sourceSlot]];
   }else{
    // Exactly one token per symbol may be placed. Restoring an earlier colour
    // or replacing an occupied well makes its old piece available below.
    const previous=guess.findIndex(piece=>piece?.symbol===token.symbol);
    if(previous>=0&&previous!==index)guess[previous]=null;
    guess[index]={symbol:token.symbol,color:token.color};
   }
   selectedSlot=null;heldToken=null;lastPlacedSlot=index;feedback.textContent="";
   saveGame();render();
  };
  const attachDrag=(button,payload)=>{
   button.draggable=true;
   button.addEventListener("dragstart",event=>{
    if(!event.dataTransfer)return;
    event.dataTransfer.effectAllowed="move";
    event.dataTransfer.setData("text/plain",JSON.stringify(payload));
   });
  };
  slots.innerHTML=ROOM2_SYMBOLS.map((_,index)=>{
   const piece=room2State.guess[index];
   const marked=selectedSlot===index;
   return `<button type="button" class="room2-answer-slot${piece?" is-filled":""}${marked?" is-selected":""}${lastPlacedSlot===index?" is-snapping":""}" data-slot="${index}" aria-label="穴${index+1}${piece?` ${piece.color}${piece.symbol}。2回押すと取り外す`:" 空。駒を選んでから押す"}" aria-pressed="${marked}">${piece?`<i class="${piece.color==="赤"?"red":"blue"}">${piece.symbol}</i>`:""}</button>`;
  }).join("");
  slots.querySelectorAll("[data-slot]").forEach(button=>{
   const index=Number(button.dataset.slot);
   const piece=room2State.guess[index];
   if(piece)attachDrag(button,{symbol:piece.symbol,color:piece.color,sourceSlot:index});
   button.addEventListener("click",()=>{
    if(heldToken){dropToken(heldToken,index);return}
    if(selectedSlot===null){
     if(!room2State.guess[index])return;
     selectedSlot=index;
    }else if(selectedSlot===index){
     room2State.guess[index]=null;selectedSlot=null;
     feedback.textContent="";saveGame();
    }else{
     [room2State.guess[selectedSlot],room2State.guess[index]]=[room2State.guess[index],room2State.guess[selectedSlot]];
     lastPlacedSlot=index;selectedSlot=null;feedback.textContent="";saveGame();
    }
    render();
   });
   button.addEventListener("dragover",event=>{event.preventDefault();if(event.dataTransfer)event.dataTransfer.dropEffect="move";button.classList.add("room2-drop-target")});
   button.addEventListener("dragleave",()=>button.classList.remove("room2-drop-target"));
   button.addEventListener("drop",event=>{
    event.preventDefault();button.classList.remove("room2-drop-target");
    try{
     const data=JSON.parse(event.dataTransfer.getData("text/plain"));
     dropToken(data,index,data.sourceSlot);
    }catch(_){}
   });
  });
  // Keep ten visible recess positions without leaving duplicate physical tokens.
  palette.innerHTML=ROOM2_COLORS.flatMap(color=>ROOM2_SYMBOLS.map(symbol=>{
   const active=room2State.guess.some(piece=>piece?.symbol===symbol&&piece?.color===color);
   if(active)return `<span class="room2-palette-empty" aria-hidden="true"></span>`;
   const held=heldToken?.symbol===symbol&&heldToken?.color===color;
   return `<button type="button" class="room2-palette-token${held?" is-held":""}" data-symbol="${symbol}" data-color="${color}" aria-pressed="${held}" aria-label="${color}${symbol}の駒を手に取る"><i class="${color==="赤"?"red":"blue"}">${symbol}</i></button>`;
  })).join("");
  palette.querySelectorAll("[data-symbol]").forEach(button=>{
   const token={symbol:button.dataset.symbol,color:button.dataset.color};
   attachDrag(button,token);
   button.addEventListener("click",()=>{
    heldToken=heldToken?.symbol===token.symbol&&heldToken?.color===token.color?null:token;
    selectedSlot=null;feedback.textContent="";render();
   });
  });
  const previousHistoryScroll=history.scrollTop;
  const displayedHistory=room2State.history.slice(0,visibleHistoryCount);
  const historyCountChanged=displayedHistory.length!==renderedHistoryCount;
  history.innerHTML=displayedHistory.map((entry,index)=>`<div class="room2-history-row${index===displayedHistory.length-1?" is-latest":""}${index===newlyWrittenCount-1?" is-newly-written":""}">${isChallenge?`<small class="room2-history-turn">${index+1}回目</small>`:""}<span>${entry.guess.map(piece=>`<i class="${piece.color=== "赤"?"red":"blue"}">${piece.symbol}</i>`).join("")}</span><b>${entry.hit}H ${entry.blow}B</b></div>`).join("");
  if(historyCountChanged&&displayedHistory.length>0)history.scrollTop=history.scrollHeight;
  else history.scrollTop=previousHistoryScroll;
  renderedHistoryCount=displayedHistory.length;
  newlyWrittenCount=-1;
  if(isChallenge){
   const count=room2ChallengeCounterInfo(room2State.attempts);
   overlay.querySelector(".room2-attempt-used").textContent=`解答 ${count.used} / 8 回`;
   overlay.querySelector(".room2-attempt-left").textContent=`残り${count.remaining}回`;
   overlay.querySelectorAll(".room2-attempt-step").forEach((step,index)=>step.classList.toggle("is-used",index<count.used));
  }
  overlay.querySelector(".room2-clear").disabled=!room2State.guess.some(Boolean);
   overlay.querySelector(".room2-submit").disabled=pendingMemo||Boolean(pendingResolution)||room2State.guess.some(piece=>!piece)||(isChallenge&&room2State.attempts>=8);
   overlay.querySelector(".room2-submit").classList.toggle("is-ready",!overlay.querySelector(".room2-submit").disabled);
  hintRequest.hidden=isChallenge||!room2ShouldRevealLeftmostHint(room2State.history,room2State.attempts)||room2State.leftmostHintRevealed||room2State.unlocked;
  hint.hidden=!room2State.leftmostHintRevealed;
  hint.textContent=room2State.leftmostHintRevealed?`左端の記号：${room2State.answer[0].symbol}`:"";
   lastPlacedSlot=null;
 };
 hintRequest.addEventListener("click",()=>{
  if(isChallenge||!room2ShouldRevealLeftmostHint(room2State.history,room2State.attempts)||room2State.leftmostHintRevealed||room2State.unlocked)return;
  room2State.leftmostHintRevealed=true;
  saveGame();
  render();
  showReaction(room2LeftmostHintLines(room2State.run,room2State.answer[0].symbol));
 });
 overlay.querySelector(".room2-submit").addEventListener("animationend",event=>{if(event.animationName==="room2LeverPull")event.currentTarget.classList.remove("is-pulling")});
 overlay.querySelector(".room2-submit").addEventListener("click",()=>{
  if(isChallenge&&room2State.attempts>=8)return;
  const physicalLever=overlay.querySelector(".room2-submit");
  physicalLever.classList.remove("is-pulling");
  void physicalLever.offsetWidth;
  physicalLever.classList.add("is-pulling");
  if(room2State.guess.length!==5||room2State.guess.some(piece=>!piece)){feedback.textContent="5つの枠をすべて埋めてください。";return}
  if(room2HasSubmittedGuess(room2State.guess,room2State.history)){
   feedback.textContent="この配置は判定済みです。";
   return;
  }
  const result=room2Evaluate(room2State.guess,room2State.answer);room2State.attempts++;
  // The state is saved immediately; the paper entry is revealed later.
  const beforeCount=room2State.history.length;
  room2State.history.push({guess:room2State.guess.map(piece=>({...piece})),...result});
  selectedSlot=null;pendingMemo=true;visibleHistoryCount=beforeCount;
  feedback.textContent="";
  digital.classList.remove("has-result");
  digital.classList.add("is-scanning");
  digitalHit.textContent="--";digitalBlow.textContent="--";
  const challengeFailed=isChallenge&&room2State.attempts>=8;
  pendingResolution=result.hit===5
   ?()=>{if(isChallenge)finishRoom2Challenge(close,true);else handleRoom2Correct(close)}
   :challengeFailed?()=>finishRoom2Challenge(close,false):null;
  saveGame();render();
  // The machine reveals its digits before anything is written on paper.
  screenTimer=window.setTimeout(()=>{
   screenTimer=null;if(!overlay.isConnected)return;
   digitalHit.textContent=String(result.hit);
   digitalBlow.textContent=String(result.blow);
   digital.classList.remove("is-scanning");digital.classList.add("has-result");
  },340);
  memoTimer=window.setTimeout(()=>{
   memoTimer=null;if(!overlay.isConnected)return;
   pendingMemo=false;newlyWrittenCount=room2State.history.length;
   visibleHistoryCount=room2State.history.length;render();
   if(result.hit===5){
    // The freshly written paper remains visible before the room changes.
    resolutionTimer=window.setTimeout(()=>{
     resolutionTimer=null;if(overlay.isConnected)finishPendingResolution();
    },850);
    return;
   }
   const reaction=room2JudgeReactionLines(result,room2State.attempts,isChallenge);
   if(reaction.length)showReaction(reaction,challengeFailed?finishPendingResolution:null);
   else if(challengeFailed)finishPendingResolution();
  },1250);
 });
 render();
 overlay.querySelector(".device-close").focus();
}
function room2HasSubmittedGuess(guess,history){
 return Array.isArray(history)&&history.some(entry=>
  Array.isArray(entry.guess)&&entry.guess.length===guess.length&&
  entry.guess.every((piece,index)=>piece.symbol===guess[index]?.symbol&&piece.color===guess[index]?.color)
 );
}
function room2Evaluate(guess,answer){
 let hit=0,blow=0;
 guess.forEach((piece,index)=>{const target=answer[index];if(piece.symbol===target.symbol&&piece.color===target.color){hit++;return}if(answer.some((candidate,candidateIndex)=>candidateIndex!==index&&candidate.symbol===piece.symbol&&candidate.color===piece.color))blow++});
 return {hit,blow};
}
function room2LeftmostHintLines(run,symbol){
 return [
  {logId:`room2_leftmost_hint_${run}_01`,logType:"dialogue",speaker:"ハナ",text:`左端は「${symbol}」だよ。色と残りは、君が考えてみてね`}
 ];
}
function room2JudgeReactionLines(result,attempt,isChallenge){
 if(isChallenge&&[4,6,7].includes(attempt))return room2MilestoneLines(attempt);
 const pair=ROOM2_DIALOGUES[`${result.hit}H`]?.[result.blow];
 return pair?.map((text,index)=>({logId:`room2_judge_${attempt}_${result.hit}_${result.blow}_${index}`,logType:"dialogue",speaker:index===0?"ハナ":"主人公",text}))||[];
}
function room2MilestoneLines(attempt){
 const sets={
  4:[["あと4回だね。焦らずいこう！","ハナ"],["はい。今までの判定を整理してみます","主人公"]],
  6:[["あと2回……！　結果を見直してみよう","ハナ"],["……そうですね。慎重に考えます","主人公"]],
  7:[["あと1回……！　落ち着いていこう","ハナ"],["はい。今までの結果を見直します","主人公"]]
 };
 return (sets[attempt]||[]).map((line,index)=>({logId:`room2_attempt_${attempt}_${index}`,logType:"dialogue",speaker:line[1],text:line[0]}));
}

function room2SavedMemoryProgress(savedState){
 if(!savedState)return null;
 const progress=savedState.memoryProgress;
 if(progress&&["correct","memory","after"].includes(progress.phase)&&typeof progress.logId==="string"){
  return {phase:progress.phase,logId:progress.logId,uiPage:Number.isInteger(progress.uiPage)&&progress.uiPage>=0?progress.uiPage:0};
 }
 // Older builds marked the memory seen before playing it. Recover its last
 // displayed line when the completion notice has not yet been recorded.
 const logs=typeof GameLog!=="undefined"?GameLog.list():[];
 if(logs.some(entry=>entry.id==="room2_unlocked"))return null;
 const id=logs.at(-1)?.id||"";
 const phase=/^room2_correct_/.test(id)?"correct":/^room2_(?:after_correct|memory)_/.test(id)?"memory":/^room2_after_memory_/.test(id)?"after":null;
 return phase?{phase,logId:id,uiPage:0}:null;
}
function room2MemoryOptions(phase,resume){
 return {resume,onProgress:position=>{room2State.memoryProgress={phase,...position}}};
}
function handleRoom2Correct(close,resume){
 close();
 const lines=[["……解けた","主人公"],["やった！　正解だね！","ハナ"],["はい。なんとかたどり着けました","主人公"]];
 showRoomDialog(lines.map((line,index)=>({logId:`room2_correct_${index}`,logType:"dialogue",speaker:line[1],text:line[0]})),()=>completeRoom2(),undefined,room2MemoryOptions("correct",resume));
}
function completeRoom2(resume){
 room2State.unlocked=true;room2State.flashbackSeen=false;
 if(resume?.phase==="after"){showRoom2AfterMemory(resume);return}
 showRoomDialog([
  {logId:"room2_after_correct_01",logType:"narration",speaker:"ト書き",text:"5つのブロックをはめ終わると、装置全体がうっすらと光り始めた。"},{logId:"room2_after_correct_02",logType:"dialogue",speaker:"主人公",text:"……光ってる？"},{logId:"room2_after_correct_03",logType:"dialogue",speaker:"ハナ",text:"わっ……！"},{logId:"room2_after_correct_04",logType:"narration",speaker:"ト書き",text:"光は次第に強くなり、机から部屋全体へと広がっていく。"},{logId:"room2_after_correct_05",logType:"dialogue",speaker:"主人公",text:"これで、扉が――"},{logId:"room2_after_correct_06",logType:"narration",speaker:"ト書き",text:"言い終わるより先に、まばゆい光が視界を覆った。部屋の輪郭が、光の中へ溶けていく。どこか遠くから、楽器の音が聞こえてきた。"},{logId:"room2_after_correct_07",logType:"narration",speaker:"主人公",thought:true,text:"この音……"},{logId:"room2_after_correct_08",logType:"narration",speaker:"ト書き",text:"聞き覚えのある音に引かれるように、意識がゆっくりと遠のいていく。"},
  ...room2FlashbackContent.map(line=>({...line,logType:line.thought||line.speaker==="ト書き"?"narration":"dialogue"}))
 ],()=>showRoom2AfterMemory(),undefined,room2MemoryOptions("memory",resume));
}
function showRoom2AfterMemory(resume){
 showRoomDialog([
  ...room2AfterFlashbackContent.map(line=>({...line,logType:line.thought||line.speaker==="ト書き"?"narration":"dialogue"}))
 ],()=>{
  room2State.flashbackSeen=true;delete room2State.memoryProgress;saveGame();
  const door=document.getElementById("r2Door");door?.classList.add("is-unlocked");
  showRoomNotice("扉の鍵が開いた。机の仕掛けは、まだ動いているようだ。","room2_unlocked","narration");
 },undefined,room2MemoryOptions("after",resume));
}
function showSecondRoomHana(){
 if(game.querySelector(".inspection-overlay,.room-dialog-overlay,.device-overlay"))return;
 window.HanaChoiceUI?.ensureStyle?.();
 const topics=[
  {id:"room",label:"この部屋について",lines:room2State.unlocked?[
   {logId:"room2_hana_room_clear_01",logType:"dialogue",speaker:"ハナ",text:"この部屋、少し雰囲気が変わったね"},
   {logId:"room2_hana_room_clear_02",logType:"dialogue",speaker:"主人公",text:"……はい。さっきまでとは違って見えます"}
  ]:[
   {logId:"room2_hana_room_01",logType:"dialogue",speaker:"ハナ",text:"この部屋、何か仕掛けがありそうだね"},
   {logId:"room2_hana_room_02",logType:"dialogue",speaker:"主人公",text:"気になるところから調べてみます"}
  ]}
 ];
 if(room2State.deskInspected)topics.push({id:"rules",label:"HITとBLOWについて",lines:[{logId:"room2_hana_rules_01",logType:"dialogue",speaker:"ハナ",text:"HITは記号・色・位置が全部合っているもの。BLOWは記号と色が合っていて、位置だけ違うものだよ"},{logId:"room2_hana_rules_02",logType:"dialogue",speaker:"主人公",text:room2State.unlocked?"はい。判定を比べるのが大切でしたね":"判定を比べながら、合っている組み合わせを絞っていくんですね"}]});
 if(!room2State.unlocked&&room2State.deskInspected)topics.push({id:"hint",label:"考え方のヒント",hint:true});
 const overlay=document.createElement("div");overlay.className="device-overlay hana-choice-overlay";
 overlay.innerHTML=`<section class="menu-panel hana-choice-menu" aria-label="ハナに聞くことを選ぶ"><button type="button" class="device-close" aria-label="閉じる">×</button><p class="hana-choice-speaker">ハナ</p><h2>どうしたの？</h2><div class="hana-choice-list"></div></section>`;game.appendChild(overlay);
 const list=overlay.querySelector(".hana-choice-list");
 [...topics,{id:"cancel",label:"なんでもない",cancel:true}].forEach(topic=>{const button=document.createElement("button");button.type="button";button.className=`hana-choice-button${topic.cancel?" is-cancel":""}`;button.textContent=topic.label;button.dataset.topic=topic.id;list.appendChild(button)});
 const close=activateDeviceModal(overlay,"r2Hana",list.querySelector("button"));
 list.querySelectorAll("[data-topic]").forEach(button=>button.addEventListener("click",()=>{const topic=topics.find(item=>item.id===button.dataset.topic);close();if(!topic)return;if(topic.hint){PuzzleHints.show('r2_strategy','r2Hana',[
  '判定は、どの記号が合っているかまでは教えてくれないんだ。一度に全部変えず、前の結果と比べてみよう。',
  'HITとBLOWを足すと、位置に関係なく、色が合っている記号の数になるよ。並びはそのまま、一つだけ赤と青を入れ替えて比べてみて。',
  '合計が一つ増えたら、変えた記号は今の色が正解。減ったら元の色だよ。色がわかったら固定して、位置を交換しながらHITの変化を比べよう。'
 ]);return;}showRoomDialog(topic.lines,()=>{room2State.hanaHints++;saveGame()})}));
}

