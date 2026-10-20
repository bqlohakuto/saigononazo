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
 room2State={doorInspected:false,deskInspected:false,sheetFound:false,hanaHints:0,answer:room2RandomAnswer(),guess:[],attempts:0,run:1,history:[],unlocked:false,flashbackSeen:false,challengeActive:false,challengeCleared:false,challengeBest:null,highlightEnabled:true,leftmostHintRevealed:false,...savedState};
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
 if(!room2State.doorInspected){showRoomNotice("まずは正面の扉を調べよう。","room2_desk_locked");return}
 if(!room2State.deskInspected){room2State.deskInspected=true;saveGame();document.getElementById("r2Blocks").disabled=false}
 showRoomDialog([
  {logId:"room2_desk_01",logType:"investigation",speaker:"ト書き",text:"机の上には、〇、△、□、×、＋の記号が書かれたブロックが置かれている。それぞれ、赤と青の2色がある。"},
  {logId:"room2_desk_02",logType:"investigation",speaker:"ト書き",text:"その奥には、ブロックをはめ込めそうな5つの枠が並んでいた。枠の横には『HIT』『BLOW』と書かれた表示がある。"},
  {logId:"room2_desk_03",logType:"narration",speaker:"主人公",thought:true,text:"このブロックを、枠にはめればいいのか……？"}
 ]);
}
function showRoom2ChallengeMenu(){
 if(!room2State.unlocked)return;
 const message=room2State.challengeBest!==null?`8回チャレンジ達成済み。\n自己ベスト：${room2State.challengeBest}回。\n何度でも再挑戦できる。`:"机のブロックを使い、8回以内に正しい組み合わせを導き出す挑戦ができる。\n何度でも挑戦できる。";
 showRoomDialog([{logId:"room2_challenge_offer",logType:"investigation",speaker:"ト書き",text:message}],()=>showRoomChoices([
  {label:"8回チャレンジに挑戦する",onSelect:beginRoom2Challenge},
  {label:"今はやめる",onSelect:()=>showRoomNotice("先へ進むこともできる。","room2_challenge_skip")}
 ]));
}
function beginRoom2Challenge(){
 room2State.challengeActive=true;room2State.answer=room2RandomAnswer();
 room2State.guess=[];room2State.history=[];room2State.attempts=0;
 room2State.leftmostHintRevealed=false;room2State.run=(room2State.run||1)+1;
 saveGame();showSecondRoomPuzzle();
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
 const message=success?`8回チャレンジ達成！\n${attempts}回で正解した。\n${newRecord?`自己ベスト更新！　${attempts}回！`:`自己ベスト：${room2State.challengeBest}回。`}`:"8回の挑戦が終わった。\n今回は正解に届かなかった。\nブロックを並べ直せば、もう一度挑戦できる。";
 showRoomDialog([{logId:`room2_challenge_result_${room2State.run}`,logType:"investigation",speaker:"ト書き",text:message}],()=>showRoomChoices([
  {label:"もう一度挑戦する",onSelect:beginRoom2Challenge},
  {label:"部屋に戻る",onSelect:()=>showRoomNotice("机からいつでも再挑戦できる。","room2_challenge_return")}
 ]));
}
function room2ChallengeCounterInfo(attempts){
 const used=Number.isInteger(attempts)?Math.min(8,Math.max(0,attempts)):0;
 return {used,remaining:8-used};
}
function showSecondRoomPuzzle(){
 if(room2State.challengeActive&&room2State.attempts>=8){finishRoom2Challenge(()=>{},false);return}
 const isChallenge=room2State.challengeActive===true;
 const counterMarkup=isChallenge?`<section class="room2-attempt-counter" role="status" aria-live="polite" aria-label="チャレンジの残り回数"><div class="room2-attempt-summary"><span class="room2-attempt-used">解答 0 / 8 回</span><strong class="room2-attempt-left">残り8回</strong></div><div class="room2-attempt-track" aria-hidden="true">${Array.from({length:8},()=>'<span class="room2-attempt-step"></span>').join("")}</div></section>`:"";
 const overlay=document.createElement("div");overlay.className="device-overlay room2-puzzle-overlay";
 overlay.innerHTML=`<section class="room2-puzzle" role="dialog" aria-modal="true" aria-label="HITとBLOWの謎"><button class="device-close" aria-label="閉じる">×</button><h2>${isChallenge?"8回チャレンジ":"記号と色を並べる"}</h2><details class="room2-board-help"><summary title="操作方法・ルール" aria-label="操作方法・ルールを確認">？</summary><div class="room2-rule"><p>【駒の操作】</p><p>〇、△、□、×、＋の5種類の記号を5つの枠に一つずつ配置する。記号の色は赤・青から選べる。同じ記号・同じ色を選び直すと外れ、同じ記号の色違いを選ぶと色が変わる。配置済みの枠を2つ選ぶと位置を入れ替えられる。</p><p>【判定】</p><p>答えと記号・色・位置がすべて一致するとHIT。記号と色が一致し、位置だけが異なるとBLOW。</p><p>【挑戦条件】</p><p>${isChallenge?"8回以内に5枠すべてを一致させれば達成。8回目までに正解できなければ今回の挑戦は終了する。何度でも再挑戦できる。":"判定結果を手がかりに正しい組み合わせを導き出せ。回数制限はない。"}</p></div></details>${counterMarkup}<div class="room2-answer-slots" role="group" aria-label="回答"></div><div class="room2-palette" role="group" aria-label="駒のパレット"></div><div class="room2-puzzle-actions"><button type="button" class="room2-clear">配置をクリア</button><button type="button" class="room2-submit">解答</button><button type="button" class="room2-leftmost-request" hidden>左端のヒントを見る</button>${isChallenge?`<button type="button" class="room2-abandon">挑戦をやめる</button>`:""}</div><p class="room2-feedback" aria-live="polite"></p><p class="room2-leftmost-hint" aria-live="polite" hidden></p><section class="room2-reaction" hidden aria-live="polite" aria-label="判定後の会話"><div class="room2-reaction-top"><p class="room2-reaction-speaker"></p><button type="button" class="room2-reaction-skip" aria-label="この会話をスキップ">スキップ »</button></div><p class="room2-reaction-text"></p><div class="room2-reaction-auto" aria-hidden="true"><span></span></div></section><div class="room2-history" aria-label="これまでの判定"></div></section>`;
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
 let reactionLines=[],reactionIndex=0,reactionDone=null;
 const setGuessEnabled=enabled=>overlay.querySelectorAll(".room2-answer-slot,.room2-palette-token,.room2-submit,.room2-leftmost-request,.room2-clear,.room2-abandon").forEach(button=>button.disabled=!enabled||(button.classList.contains("room2-submit")&&room2State.guess.length!==5));
 const endReaction=()=>{
  clearReactionTimer();reactionPanel.hidden=true;setGuessEnabled(true);
  const done=reactionDone;reactionDone=null;reactionLines=[];done?.();
 };
 const showReactionLine=()=>{
  if(!overlay.isConnected){clearReactionTimer();return}
  const line=reactionLines[reactionIndex];
  reactionPanel.querySelector(".room2-reaction-speaker").textContent=line.speaker;
  reactionPanel.querySelector(".room2-reaction-text").textContent=line.text;
  const auto= reactionPanel.querySelector(".room2-reaction-auto span");
  const delay=Math.min(3200,Math.max(1600,1000+line.text.length*50));
  auto.style.animation="none";void auto.offsetWidth;
  auto.style.animation=`room2DialogueProgress ${delay}ms linear forwards`;
  recordLog(line);
  clearReactionTimer();reactionTimer=window.setTimeout(()=>{
   reactionTimer=null;if(!overlay.isConnected)return;
   if(reactionIndex+1<reactionLines.length){reactionIndex++;showReactionLine()}else endReaction();
  },delay);
 };
 const showReaction=(lines,onDone)=>{
  clearReactionTimer();reactionLines=lines||[];reactionDone=onDone;reactionIndex=0;
  if(!reactionLines.length){endReaction();return}
  setGuessEnabled(false);reactionPanel.hidden=false;showReactionLine();
  reactionPanel.scrollIntoView?.({block:"nearest",behavior:"smooth"});
 };
 reactionPanel.querySelector(".room2-reaction-skip").addEventListener("click",()=>{
  if(reactionPanel.hidden)return;
  for(let i=reactionIndex+1;i<reactionLines.length;i++)recordLog(reactionLines[i]);
  endReaction();
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
  overlay.querySelector(".room2-submit").disabled=room2State.guess.length!==5;
  hintRequest.hidden=isChallenge||room2State.attempts<5||room2State.leftmostHintRevealed||room2State.unlocked;
  hint.hidden=!room2State.leftmostHintRevealed;
  hint.textContent=room2State.leftmostHintRevealed?`開示された左端の記号：「${room2State.answer[0].symbol}」`:"";
   lastPlacedSlot=null;
 };
 hintRequest.addEventListener("click",()=>{
  if(isChallenge||room2State.attempts<5||room2State.leftmostHintRevealed||room2State.unlocked)return;
  room2State.leftmostHintRevealed=true;
  saveGame();
  render();
  showReaction(room2LeftmostHintLines(room2State.run,room2State.answer[0].symbol));
 });
 overlay.querySelector(".room2-submit").addEventListener("click",()=>{
  if(room2State.guess.length!==5){feedback.textContent="5つの枠をすべて埋めてください。";return}
  const result=room2Evaluate(room2State.guess,room2State.answer);room2State.attempts++;
  room2State.history.push({guess:room2State.guess.map(piece=>({...piece})),...result});room2State.guess=[];
  saveGame();render();
  if(result.hit===5){if(isChallenge)finishRoom2Challenge(close,true);else handleRoom2Correct(close);return}
  feedback.textContent=`${result.hit} HIT　${result.blow} BLOW${isChallenge?`　（${room2State.attempts}/8回）`:""}`;
  const pair=ROOM2_DIALOGUES[`${result.hit}H`]?.[result.blow];
  const reaction=pair?.map((text,index)=>({logId:`room2_judge_${room2State.attempts}_${result.hit}_${result.blow}_${index}`,logType:"dialogue",speaker:index===0?"ハナ":"主人公",text}))||[];
  const milestone=isChallenge&&[4,6,7].includes(room2State.attempts)?room2MilestoneLines(room2State.attempts):[];
  const challengeFailed=isChallenge&&room2State.attempts>=8;
  if(reaction.length||milestone.length)showReaction([...reaction,...milestone],challengeFailed?()=>finishRoom2Challenge(close,false):null);
  else if(challengeFailed)finishRoom2Challenge(close,false);
 });
 render();
 overlay.querySelector(".device-close").focus();
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
function room2MilestoneLines(attempt){
 const sets={4:[["あと4回だね","ハナ"],["もう半分使ったんですね……","主人公"],["でも、ここからが勝負だね！","ハナ"],["焦らず、今までの結果を見ながら考えてみよう！","ハナ"],["……そうですね。まだ大丈夫です","主人公"]],6:[["あと2回……！","ハナ"],["さすがに、ちょっと緊張してきました","主人公"],["うん、わたしも！　でも、落ち着いていこう！","ハナ"],["今までのヒットとブローをもう一回見て、確実なところから考えよう","ハナ"],["……一度整理してみます","主人公"]],7:[["あと一回……！","ハナ"],["ハナさんのほうが緊張してません？","主人公"],["だって、ここまで一緒に考えてきたんだもん！","ハナ"],["大丈夫。最後まで一緒に考えるから","ハナ"],["はい。最後の一手、慎重に考えます","主人公"]]};
 return sets[attempt].map((line,index)=>({logId:`room2_attempt_${attempt}_${index}`,logType:"dialogue",speaker:line[1],text:line[0]}));
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
  {id:"room",label:"この部屋について",lines:[{logId:"room2_hana_room_01",logType:"dialogue",speaker:"ハナ",text:"机のブロックを使って、扉の鍵を開けるみたいだね"},{logId:"room2_hana_room_02",logType:"dialogue",speaker:"主人公",text:"扉の言葉と机の記録を見て、順番を考えればよさそうですね"}]},
  {id:"rules",label:"HITとBLOWについて",lines:[{logId:"room2_hana_rules_01",logType:"dialogue",speaker:"ハナ",text:"HITは記号・色・位置が全部合っているもの。BLOWは記号と色が合っていて、位置だけ違うものだよ"},{logId:"room2_hana_rules_02",logType:"dialogue",speaker:"主人公",text:"判定を比べながら、合っている組み合わせを絞っていくんですね"}]}
 ];
 if(!room2State.unlocked)topics.push({id:"hint",label:"考え方のヒント",lines:[{logId:`room2_hana_hint_${room2State.attempts}_${room2State.hanaHints}`,logType:"dialogue",speaker:"ハナ",text:"一度にたくさん変えると、どれが合っていたかわからなくなっちゃうよ。まずは一つずつ変えて、前の判定と比べてみよう"}]});
 const overlay=document.createElement("div");overlay.className="device-overlay hana-choice-overlay";
 overlay.innerHTML=`<section class="menu-panel hana-choice-menu" aria-label="ハナに聞くことを選ぶ"><button type="button" class="device-close" aria-label="閉じる">×</button><p class="hana-choice-speaker">ハナ</p><h2>どうしたの？</h2><p class="hana-choice-lead">聞きたいことを選んでください。</p><div class="hana-choice-list"></div></section>`;game.appendChild(overlay);
 const list=overlay.querySelector(".hana-choice-list");
 [...topics,{id:"cancel",label:"なんでもない",cancel:true}].forEach(topic=>{const button=document.createElement("button");button.type="button";button.className=`hana-choice-button${topic.cancel?" is-cancel":""}`;button.textContent=topic.label;button.dataset.topic=topic.id;list.appendChild(button)});
 const close=activateDeviceModal(overlay,"r2Hana",list.querySelector("button"));
 list.querySelectorAll("[data-topic]").forEach(button=>button.addEventListener("click",()=>{const topic=topics.find(item=>item.id===button.dataset.topic);close();if(!topic)return;showRoomDialog(topic.lines,()=>{room2State.hanaHints++;saveGame()})}));
}
