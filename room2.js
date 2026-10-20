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
 Dialogue.stop();firstRoomState=undefined;currentScene="room02";
 room2State={doorInspected:false,deskInspected:false,hanaHints:0,answer:room2RandomAnswer(),guess:[],attempts:0,run:1,history:[],unlocked:false,flashbackSeen:false,challengeActive:false,challengeCleared:false,challengeBest:null,highlightEnabled:true,leftmostHintRevealed:false,...savedState};
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
   <button class="object room2-object room2-door" id="r2Door"><span>正面の扉</span></button>
   <button class="object room2-object room2-table" id="r2Desk"><span>机</span></button>
   <button class="object room2-object room2-blocks" id="r2Blocks" ${room2State.deskInspected?"":"disabled"}><span>ブロックと記録枠</span></button>
   <button class="object room2-object room2-hana" id="r2Hana"><span>ハナ</span></button>
   <img class="room2-desk-foreground-art" src="images/background/room02/room02_desk_foreground.png?v=20261013-room02-clean-alpha-01" alt="" aria-hidden="true" draggable="false" decoding="async">
  </section></div>
  <div class="room-navigation" aria-hidden="true"></div><p class="explore-status" id="exploreStatus">気になる場所をクリックしてください。</p>
 </main>`;
 document.getElementById("r2Door").addEventListener("click",()=>inspectSecondRoomDoor());
 document.getElementById("r2Desk").addEventListener("click",()=>inspectSecondRoomDesk());
 document.getElementById("r2Blocks").addEventListener("click",()=>room2State.unlocked&&!room2State.challengeActive?showRoom2ChallengeMenu():showSecondRoomPuzzle());
 document.getElementById("r2Hana").addEventListener("click",()=>showSecondRoomHana());
 if(!savedState){showRoomDialog(room2IntroLines)} else if(savedState.nextRoomTransitionSeen){showThirdRoomBoundary()}else {showRoomNotice("続きから再開しました。","room2_resumed")}
 if(window.GameplayUI)GameplayUI.installRoom({sceneId:"room02",title:"第二の部屋",objective:()=>room2State.unlocked?"扉を調べて次へ進む":"部屋を調べる",onCompanion:showSecondRoomHana,getHighlights:()=>!!room2State.highlightEnabled,setHighlights:enabled=>{room2State.highlightEnabled=!!enabled;saveGame()}});
 saveGame();
}

function showRoomChoices(choices){
 const room=game.querySelector(".room");if(room)room.inert=true;
 const overlay=document.createElement("div");overlay.className="device-overlay room2-choice-overlay";
 overlay.innerHTML=`<section class="menu-panel room-exit-menu" role="dialog" aria-modal="true" aria-label="選択肢"><button type="button" class="device-close" aria-label="閉じる">×</button><h2>どうする？</h2>${choices.map((choice,index)=>`<button type="button" data-choice="${index}">${choice.label}</button>`).join("")}</section>`;
 game.appendChild(overlay);let closed=false;
 const close=()=>{if(closed)return;closed=true;overlay.remove();if(room)room.inert=false};
 overlay.querySelector(".device-close").addEventListener("click",close);
 overlay.querySelectorAll("[data-choice]").forEach(button=>button.addEventListener("click",()=>{const choice=choices[Number(button.dataset.choice)];close();choice.onSelect()}));
 overlay.querySelector("[data-choice]")?.focus();
}

const room2IntroLines=[
 {logId:"room2_intro_01",logType:"narration",speaker:"ト書き",text:"視界を覆っていた光が、ゆっくりと薄れていく。目を開けると、また別の部屋に立っていた。正面には、一枚の扉。部屋の中央には、机が一つ置かれている。それ以外には、目立ったものはほとんどない。"},
 {logId:"room2_intro_02",logType:"narration",speaker:"主人公",thought:true,text:"今度は、ずいぶん何もない部屋だな……"},
 {logId:"room2_intro_03",logType:"narration",speaker:"ト書き",text:"机の上には、何かが並べられているようだ。"},
 {logId:"room2_intro_04",logType:"dialogue",speaker:"ハナ",text:"今度は、どんな部屋なんだろうね"}
];
function inspectSecondRoomDoor(){
 if(room2State.unlocked){showRoomDialog([{logId:"room2_next_door_01",logType:"investigation",speaker:"ト書き",text:"扉は開いている。このまま先へ進めそうだ。"}],()=>showRoomChoices([
  {label:"次の部屋へ向かう",onSelect:()=>showRoomDialog([
   {logId:"room2_room3_transition_01",logType:"narration",speaker:"主人公",text:"僕はドアノブに手を伸ばした。"},
   {logId:"room2_room3_transition_02",logType:"narration",speaker:"ト書き",text:"開けようとすると、また扉はひとりでに開いた。扉の向こうへ、身体が吸い込まれていくような感覚に襲われる。視界が、まばゆい光に包まれていく。"}
  ],showThirdRoomBoundary)},
  {label:"もう少し部屋をしらべてみる",onSelect:()=>showRoomNotice("まだ何か調べられるかもしれない。","room2_transition_stay")}
 ]));return}
 if(room2State.doorInspected){showRoomNotice("扉には『正しい組み合わせを導け』と刻まれている。","room2_door_again");return}
 room2State.doorInspected=true;saveGame();
 showRoomDialog([
  {logId:"room2_door_01",logType:"investigation",speaker:"ト書き",text:"木製の扉だ。ドアノブを回してみた。"},
  {logId:"room2_door_02",logType:"investigation",speaker:"主人公",text:"やっぱり開かないか"},
  {logId:"room2_door_03",logType:"investigation",speaker:"ト書き",text:"鍵がかかっているようだ。扉には文字が刻まれている。『正しい組み合わせを導け』"},
  {logId:"room2_door_04",logType:"dialogue",speaker:"主人公",text:"正しい組み合わせ……？　どういう意味だろう"}
 ]);
}
function inspectSecondRoomDesk(){
 if(!room2State.deskInspected){room2State.deskInspected=true;saveGame();document.getElementById("r2Blocks").disabled=false}
 showRoomDialog([
  {logId:"room2_desk_01",logType:"investigation",speaker:"ト書き",text:"机の上には、〇、△、□、×、＋の記号が書かれたブロックが置かれている。それぞれ、赤と青の2色がある。"},
  {logId:"room2_desk_02",logType:"investigation",speaker:"ト書き",text:"その奥には、ブロックをはめ込めそうな5つの枠が並んでいた。枠の横には『HIT』『BLOW』と書かれた表示がある。"},
  {logId:"room2_desk_03",logType:"narration",speaker:"主人公",thought:true,text:"このブロックを、枠にはめればいいのか……？"}
 ]);
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
 saveGame();showSecondRoomPuzzle();
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
function showSecondRoomPuzzle(){
 if(room2State.challengeActive&&room2State.attempts>=8){finishRoom2Challenge(()=>{},false);return}
 const isChallenge=room2State.challengeActive===true;
 const counterMarkup=isChallenge?`<section class="room2-attempt-counter" role="status" aria-live="polite" aria-label="チャレンジの残り回数"><div class="room2-attempt-summary"><span class="room2-attempt-used">解答 0 / 8 回</span><strong class="room2-attempt-left">残り8回</strong></div><div class="room2-attempt-track" aria-hidden="true">${Array.from({length:8},()=>'<span class="room2-attempt-step"></span>').join("")}</div></section>`:"";
 const overlay=document.createElement("div");overlay.className="device-overlay room2-puzzle-overlay";
 overlay.innerHTML=`<section class="room2-puzzle" role="dialog" aria-modal="true" aria-label="HITとBLOWの謎"><button class="device-close" aria-label="閉じる">×</button><h2>${isChallenge?"8回チャレンジ":"記号と色を並べる"}</h2><details class="room2-board-help"><summary title="操作方法・ルール" aria-label="操作方法・ルールを確認">？</summary><div class="room2-rule"><p>【駒の操作】</p><p>〇、△、□、×、＋の5種類の記号を5つの枠に一つずつ配置する。記号の色は赤・青から選べる。同じ記号・同じ色を選び直すと外れ、同じ記号の色違いを選ぶと色が変わる。配置済みの枠を2つ選ぶと位置を入れ替えられる。</p><p>【判定】</p><p>答えと記号・色・位置がすべて一致するとHIT。記号と色が一致し、位置だけが異なるとBLOW。判定後も駒はそのまま残るので、配置を変えて次の解答を試せる。同じ配置の再解答では回数を消費しない。</p><p>【挑戦条件】</p><p>${isChallenge?"8回以内に5枠すべてを一致させれば達成。8回目までに正解できなければ今回の挑戦は終了する。何度でも再挑戦できる。":"判定結果を手がかりに正しい組み合わせを導き出せ。回数制限はない。"}</p></div></details>${counterMarkup}<div class="room2-answer-slots" role="group" aria-label="回答"></div><div class="room2-palette" role="group" aria-label="駒のパレット"></div><div class="room2-puzzle-actions"><button type="button" class="room2-clear">配置をクリア</button><button type="button" class="room2-submit">解答</button><button type="button" class="room2-leftmost-request" hidden>左端のヒントを見る</button>${isChallenge?`<button type="button" class="room2-abandon">挑戦をやめる</button>`:""}</div><aside class="room2-sidebar" aria-label="判定履歴と会話"><p class="room2-feedback" aria-live="polite"></p><p class="room2-leftmost-hint" aria-live="polite" hidden></p><section class="room2-reaction" hidden aria-label="判定後の会話"><div class="room2-reaction-top"><strong class="room2-reaction-title">会話</strong><button type="button" class="room2-reaction-skip" aria-label="会話の表示を閉じる">×</button></div><div class="room2-reaction-lines" role="log" aria-live="polite"></div></section><div class="room2-history" aria-label="これまでの判定"></div></aside></section>`;
 game.appendChild(overlay);
 const slots=overlay.querySelector(".room2-answer-slots"),palette=overlay.querySelector(".room2-palette"),history=overlay.querySelector(".room2-history"),feedback=overlay.querySelector(".room2-feedback"),hint=overlay.querySelector(".room2-leftmost-hint"),hintRequest=overlay.querySelector(".room2-leftmost-request"),reactionPanel=overlay.querySelector(".room2-reaction");let selectedSlot=null,lastPlacedSlot=null;
 let reactionTimer=null;
 const clearReactionTimer=()=>{if(reactionTimer!==null){window.clearTimeout(reactionTimer);reactionTimer=null}};
 const close=activateDeviceModal(overlay,"r2Blocks",overlay.querySelector(".device-close"),clearReactionTimer);
 if(isChallenge)overlay.querySelector(".room2-abandon").addEventListener("click",()=>{
  close();
  showRoomDialog([{
   logId:`room2_challenge_quit_confirm_${room2State.run}`,logType:"investigation",speaker:"ト書き",
   text:"今回のチャレンジを終了しますか？　現在の解答と判定履歴は消えます。自己ベストは残ります。"
  }],()=>showRoomChoices([
   {label:"挑戦をやめる",onSelect:()=>{
    room2State.challengeActive=false;
    room2State.guess=[];room2State.history=[];room2State.attempts=0;
    room2State.leftmostHintRevealed=false;
    saveGame();
    showRoomNotice("今回のチャレンジを終了した。机から新たに挑戦できる。","room2_challenge_abandoned");
   }},
   {label:"挑戦を続ける",onSelect:showSecondRoomPuzzle}
  ]));
 });
 overlay.querySelector(".room2-clear").onclick=()=>{room2State.guess=[];selectedSlot=null;feedback.style.whiteSpace="pre-line";feedback.textContent="配置をクリアしました。\n5つの枠に駒を並べてください。";saveGame();render()};
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
   const item=document.createElement("div");item.className="room2-reaction-line";
   const name=document.createElement("strong");name.className="room2-reaction-name";name.textContent=line.speaker;
   const message=document.createElement("p");message.className="room2-reaction-speech";message.textContent=line.text;
   item.append(name,message);list.append(item);
   recordLog(line);
  }
  reactionPanel.hidden=false;
  const totalChars=reactionLines.reduce((sum,line)=>sum+line.text.length,0);
  const duration=Math.min(14000,Math.max(6500,900+totalChars*55));
  reactionTimer=window.setTimeout(()=>{reactionTimer=null;if(overlay.isConnected)endReaction()},duration);
 };
 reactionPanel.querySelector(".room2-reaction-skip").addEventListener("click",()=>{
  if(!reactionPanel.hidden)endReaction();
 });
 let renderedHistoryCount=-1;
 const render=()=>{
  slots.innerHTML=ROOM2_SYMBOLS.map((_,index)=>{const piece=room2State.guess[index];return `<button type="button" class="room2-answer-slot${piece?" is-filled":""}${selectedSlot===index?" is-selected":""}${lastPlacedSlot===index?" is-snapping":""}" data-slot="${index}" aria-label="枠${index+1}${piece?` ${piece.color}${piece.symbol}`:" 空"}" aria-pressed="${selectedSlot===index}">${piece?`<i class="${piece.color==="赤"?"red":"blue"}">${piece.symbol}</i>`:``}</button>`}).join("");
  slots.querySelectorAll("[data-slot]").forEach(button=>button.addEventListener("click",()=>{const index=Number(button.dataset.slot);if(!room2State.guess[index])return;if(selectedSlot===null){selectedSlot=index}else if(selectedSlot===index){selectedSlot=null}else{[room2State.guess[selectedSlot],room2State.guess[index]]=[room2State.guess[index],room2State.guess[selectedSlot]];lastPlacedSlot=index;selectedSlot=null;saveGame()}render()}));
  palette.innerHTML=ROOM2_COLORS.flatMap(color=>ROOM2_SYMBOLS.map(symbol=>{const active=room2State.guess.some(piece=>piece.symbol===symbol&&piece.color===color);return `<button type="button" class="room2-palette-token${active?" is-active":""}" data-symbol="${symbol}" data-color="${color}" aria-pressed="${active}" aria-label="${color}${symbol}"><i class="${color==="赤"?"red":"blue"}">${symbol}</i></button>`})).join("");
  palette.querySelectorAll("[data-symbol]").forEach(button=>button.addEventListener("click",()=>{const token={symbol:button.dataset.symbol,color:button.dataset.color};const index=room2State.guess.findIndex(piece=>piece.symbol===token.symbol);if(index>=0){if(room2State.guess[index].color===token.color){room2State.guess.splice(index,1);lastPlacedSlot=null}else{room2State.guess[index]=token;lastPlacedSlot=index}}else if(room2State.guess.length<5){room2State.guess.push(token);lastPlacedSlot=room2State.guess.length-1}selectedSlot=null;feedback.textContent="";saveGame();render()}));
  const previousHistoryScroll=history.scrollTop;
  const historyCountChanged=room2State.history.length!==renderedHistoryCount;
  history.innerHTML=room2State.history.map((entry,index)=>`<div class="room2-history-row${index===room2State.history.length-1?" is-latest":""}">${isChallenge?`<small class="room2-history-turn">${index+1}回目</small>`:""}<span>${entry.guess.map(piece=>`<i class="${piece.color=== "赤"?"red":"blue"}">${piece.symbol}</i>`).join("")}</span><b>${entry.hit}H ${entry.blow}B</b></div>`).join("");
  if(historyCountChanged&&room2State.history.length>0)history.scrollTop=history.scrollHeight;
  else history.scrollTop=previousHistoryScroll;
  renderedHistoryCount=room2State.history.length;
  if(isChallenge){
   const count=room2ChallengeCounterInfo(room2State.attempts);
   overlay.querySelector(".room2-attempt-used").textContent=`解答 ${count.used} / 8 回`;
   overlay.querySelector(".room2-attempt-left").textContent=`残り${count.remaining}回`;
   overlay.querySelectorAll(".room2-attempt-step").forEach((step,index)=>step.classList.toggle("is-used",index<count.used));
  }
  overlay.querySelector(".room2-submit").disabled=room2State.guess.length!==5||(isChallenge&&room2State.attempts>=8);
  hintRequest.hidden=isChallenge||!room2ShouldRevealLeftmostHint(room2State.history,room2State.attempts)||room2State.leftmostHintRevealed||room2State.unlocked;
  hint.hidden=!room2State.leftmostHintRevealed;
  hint.textContent=room2State.leftmostHintRevealed?`開示された左端の記号：「${room2State.answer[0].symbol}」`:"";
   lastPlacedSlot=null;
 };
 hintRequest.addEventListener("click",()=>{
  if(isChallenge||!room2ShouldRevealLeftmostHint(room2State.history,room2State.attempts)||room2State.leftmostHintRevealed||room2State.unlocked)return;
  room2State.leftmostHintRevealed=true;
  saveGame();
  render();
  showReaction(room2LeftmostHintLines(room2State.run,room2State.answer[0].symbol));
 });
 overlay.querySelector(".room2-submit").addEventListener("click",()=>{
  if(isChallenge&&room2State.attempts>=8)return;
  if(room2State.guess.length!==5){feedback.textContent="5つの枠をすべて埋めてください。";return}
  if(room2HasSubmittedGuess(room2State.guess,room2State.history)){
   feedback.textContent="この配置は判定済みです。ブロックを動かしてから解答してください。";
   return;
  }
  const result=room2Evaluate(room2State.guess,room2State.answer);room2State.attempts++;
  room2State.history.push({guess:room2State.guess.map(piece=>({...piece})),...result});
  selectedSlot=null;
  saveGame();render();
  if(result.hit===5){if(isChallenge)finishRoom2Challenge(close,true);else handleRoom2Correct(close);return}
  feedback.textContent="";
  const reaction=room2JudgeReactionLines(result,room2State.attempts,isChallenge);
  const challengeFailed=isChallenge&&room2State.attempts>=8;
  if(reaction.length)showReaction(reaction,challengeFailed?()=>finishRoom2Challenge(close,false):null);
  else if(challengeFailed)finishRoom2Challenge(close,false);
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
  {logId:`room2_leftmost_hint_${run}_01`,logType:"dialogue",speaker:"ハナ",text:"左端の記号だけ、教えるね。"},
  {logId:`room2_leftmost_hint_${run}_02`,logType:"dialogue",speaker:"ハナ",text:`正解の左端にある記号は「${symbol}」だよ。色と残りの並びは、君が考えてみて。`}
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

function handleRoom2Correct(close){
 close();
 const lines=[["……解けた","主人公"],["やった！　正解だね！","ハナ"],["はい。なんとかたどり着けました","主人公"]];
 showRoomDialog(lines.map((line,index)=>({logId:`room2_correct_${index}`,logType:"dialogue",speaker:line[1],text:line[0]})),()=>completeRoom2());
}
function completeRoom2(){
 room2State.unlocked=true;room2State.flashbackSeen=true;saveGame();
 showRoomDialog([
  {logId:"room2_after_correct_01",logType:"narration",speaker:"ト書き",text:"5つのブロックをはめ終わると、装置全体がうっすらと光り始めた。"},{logId:"room2_after_correct_02",logType:"dialogue",speaker:"主人公",text:"……光ってる？"},{logId:"room2_after_correct_03",logType:"dialogue",speaker:"ハナ",text:"わっ……！"},{logId:"room2_after_correct_04",logType:"narration",speaker:"ト書き",text:"光は次第に強くなり、机から部屋全体へと広がっていく。"},{logId:"room2_after_correct_05",logType:"dialogue",speaker:"主人公",text:"これで、扉が――"},{logId:"room2_after_correct_06",logType:"narration",speaker:"ト書き",text:"言い終わるより先に、まばゆい光が視界を覆った。部屋の輪郭が、光の中へ溶けていく。どこか遠くから、楽器の音が聞こえてきた。"},{logId:"room2_after_correct_07",logType:"narration",speaker:"主人公",thought:true,text:"この音……"},{logId:"room2_after_correct_08",logType:"narration",speaker:"ト書き",text:"聞き覚えのある音に引かれるように、意識がゆっくりと遠のいていく。"},
  ...room2FlashbackContent.map(line=>({...line,logType:line.thought||line.speaker==="ト書き"?"narration":"dialogue"}))
 ],()=>showRoomDialog([
  ...room2AfterFlashbackContent.map(line=>({...line,logType:line.thought||line.speaker==="ト書き"?"narration":"dialogue"}))
 ],()=>{const door=document.getElementById("r2Door");door?.classList.add("is-unlocked");showRoomNotice("扉の鍵が開いた。机のブロックから『8回チャレンジ』にも挑戦できる。","room2_unlocked","narration")}));
}
function showSecondRoomHana(){
 if(game.querySelector(".inspection-overlay,.room-dialog-overlay,.device-overlay"))return;
 window.HanaChoiceUI?.ensureStyle?.();
 const topics=[
  {id:"room",label:"この部屋について",lines:room2State.unlocked?[
   {logId:"room2_hana_room_clear_01",logType:"dialogue",speaker:"ハナ",text:"この部屋の仕掛け、解けたね！"},
   {logId:"room2_hana_room_clear_02",logType:"dialogue",speaker:"主人公",text:"はい。次へ進めそうです"}
  ]:[
   {logId:"room2_hana_room_01",logType:"dialogue",speaker:"ハナ",text:"この部屋、何か仕掛けがありそうだね"},
   {logId:"room2_hana_room_02",logType:"dialogue",speaker:"主人公",text:"気になるところから調べてみます"}
  ]}
 ];
 if(room2State.deskInspected)topics.push({id:"rules",label:"HITとBLOWについて",lines:[{logId:"room2_hana_rules_01",logType:"dialogue",speaker:"ハナ",text:"HITは記号・色・位置が全部合っているもの。BLOWは記号と色が合っていて、位置だけ違うものだよ"},{logId:"room2_hana_rules_02",logType:"dialogue",speaker:"主人公",text:"判定を比べながら、合っている組み合わせを絞っていくんですね"}]});
 if(!room2State.unlocked&&Array.isArray(room2State.history)&&room2State.history.some(entry=>Number.isInteger(entry?.hit)&&entry.hit>=0&&entry.hit<5))topics.push({id:"hint",label:"考え方のヒント",lines:[{logId:`room2_hana_hint_${room2State.attempts}_${room2State.hanaHints}`,logType:"dialogue",speaker:"ハナ",text:"一度にたくさん変えると、どれが合っていたかわからなくなっちゃうよ。まずは一つずつ変えて、前の判定と比べてみよう"}]});
 const overlay=document.createElement("div");overlay.className="device-overlay hana-choice-overlay";
 overlay.innerHTML=`<section class="menu-panel hana-choice-menu" aria-label="ハナに聞くことを選ぶ"><button type="button" class="device-close" aria-label="閉じる">×</button><p class="hana-choice-speaker">ハナ</p><h2>どうしたの？</h2><p class="hana-choice-lead">聞きたいことを選んでください。</p><div class="hana-choice-list"></div></section>`;game.appendChild(overlay);
 const list=overlay.querySelector(".hana-choice-list");
 [...topics,{id:"cancel",label:"なんでもない",cancel:true}].forEach(topic=>{const button=document.createElement("button");button.type="button";button.className=`hana-choice-button${topic.cancel?" is-cancel":""}`;button.textContent=topic.label;button.dataset.topic=topic.id;list.appendChild(button)});
 const close=activateDeviceModal(overlay,"r2Hana",list.querySelector("button"));
 list.querySelectorAll("[data-topic]").forEach(button=>button.addEventListener("click",()=>{const topic=topics.find(item=>item.id===button.dataset.topic);close();if(!topic)return;showRoomDialog(topic.lines,()=>{room2State.hanaHints++;saveGame()})}));
}
