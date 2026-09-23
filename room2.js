// 第二の部屋。素材画像は room02/ 以下へ差し替えられるようCSS上の仮背景で構成。
const ROOM2_SYMBOLS=["〇","□","△","×","＋"];
const ROOM2_COLORS=["赤","青"];
const ROOM2_DIALOGUES={
 "0H":[["見事に全部違うね！","嬉しそうに言わないでください……"],["一個は入ってる！","でも場所は全部違うんですよね……"],["二個見つけたね","ここから場所を探せばいいのか"],["三つも合ってるよ！","位置が全部違うのが困りますけどね"],["ほとんど合ってる！","なのに一つもヒットじゃないんですね……"],["全部ある！","全部場所が違う……逆にすごいですね"]],
 "1H":[["まず一個！","どれが当たりなのか、見極めないとですね"],["一個ぴったり、もう一個もどこかにいるね","少しずつ絞れそうです"],["いい感じじゃない？","まだ動かすところが多いですけどね"],["かなり近いよ！","四つは使われてるってことか……"],["もう全部見つかってるじゃん！","あとは並べ方だけですね"]],
 "2H":[["二つ当たり！","二つはこの位置で合ってる……どれだろう"],["半分くらい見えてきたね","ちょっと楽しくなってきました"],["あと一個見つければ全部だね","問題は、どれが動くかです"],["五つ全部あるよ！","あとは配置だけってことですね"]],
 "3H":[["三つも正解！","残り二つに集中できますね"],["あとちょっと！","一個は場所違い……もう一個は色が違うのか"],["全部そろってるよ！","あとは位置を直せば正解ですね"]],
 "4H":[["あと一個！","……これ、最後の記号の色が違うだけじゃ？"]]
};

function room2RandomAnswer(){
 const symbols=[...ROOM2_SYMBOLS];
 for(let i=symbols.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[symbols[i],symbols[j]]=[symbols[j],symbols[i]]}
 return symbols.map(symbol=>({symbol,color:ROOM2_COLORS[Math.floor(Math.random()*2)]}));
}
function showSecondRoom(savedState){
 Dialogue.stop();firstRoomState=undefined;currentScene="room02";
 room2State={doorInspected:false,deskInspected:false,sheetFound:false,hanaHints:0,answer:room2RandomAnswer(),guess:[],attempts:0,run:1,history:[],unlocked:false,flashbackSeen:false,...savedState};
 if(!Array.isArray(room2State.answer)||room2State.answer.length!==5||!Array.isArray(room2State.guess))room2State={...room2State,answer:room2RandomAnswer(),guess:[]};
 if(!Array.isArray(room2State.history))room2State.history=[];
 game.innerHTML=`<main class="room room-two ${room2State.unlocked?"is-restored":""}" aria-label="第二の部屋">
  <header class="room-header"><p class="room-label">第二の部屋</p><p class="room-color-status">${room2State.unlocked?"色を取り戻した部屋":"淡い記憶の部屋"}</p></header>
  <div class="room-stage-wrap"><section class="room-stage room2-stage" aria-label="第二の部屋">
   <div class="room2-door-art" aria-hidden="true"></div><div class="room2-desk-art" aria-hidden="true"></div><div class="room2-window-light" aria-hidden="true"></div>
   <button class="object room2-object room2-door" id="r2Door"><span>正面の扉</span></button>
   <button class="object room2-object room2-table" id="r2Desk"><span>机</span></button>
   <button class="object room2-object room2-blocks" id="r2Blocks" ${room2State.deskInspected?"":"disabled"}><span>ブロックと記録枠</span></button>
   <button class="object room2-object room2-hana" id="r2Hana"><span>ハナ</span></button>
  </section></div>
  <nav class="room-navigation"><span></span><p>机のブロックを調べよう</p><span></span></nav><p class="explore-status" id="exploreStatus">気になる場所をクリックしてください。</p>
 </main>`;
 document.getElementById("r2Door").addEventListener("click",()=>inspectSecondRoomDoor());
 document.getElementById("r2Desk").addEventListener("click",()=>inspectSecondRoomDesk());
 document.getElementById("r2Blocks").addEventListener("click",()=>showSecondRoomPuzzle());
 document.getElementById("r2Hana").addEventListener("click",()=>showSecondRoomHana());
 if(!savedState){showRoomDialog(room2IntroLines)} else {showRoomNotice("続きから再開しました。","room2_resumed")}
 if(window.GameplayUI)GameplayUI.installRoom({sceneId:"room02",title:"第二の部屋",objective:()=>room2State.unlocked?"扉を調べて次へ進む":"机の謎を解く",onCompanion:showSecondRoomHana,getHighlights:()=>!!room2State.highlightEnabled,setHighlights:enabled=>{room2State.highlightEnabled=!!enabled;saveGame()}});
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
 {logId:"room2_intro_04",logType:"dialogue",speaker:"ハナ",text:"今度はあれが謎みたいだね"}
];
function inspectSecondRoomDoor(){
 if(room2State.unlocked){showRoomDialog([{logId:"room2_next_door_01",logType:"investigation",speaker:"ト書き",text:"扉は開いている。このまま先へ進めそうだ。"}],()=>showRoomChoices([
  {label:"次の部屋へ向かう",onSelect:()=>showRoomNotice("第三の部屋への接続を準備中です。","room2_room3_placeholder")},
  {label:"もう少し部屋をしらべてみる",onSelect:()=>showRoomNotice("まだ何か調べられるかもしれない。","room2_transition_stay")}
 ]));return}
 if(room2State.doorInspected){showRoomNotice("扉には『8回以内に、正しい組み合わせを導け』と刻まれている。","room2_door_again");return}
 room2State.doorInspected=true;saveGame();
 showRoomDialog([
  {logId:"room2_door_01",logType:"investigation",speaker:"ト書き",text:"木製の扉だ。ドアノブを回してみた。"},
  {logId:"room2_door_02",logType:"investigation",speaker:"主人公",text:"やっぱり開かないか"},
  {logId:"room2_door_03",logType:"investigation",speaker:"ト書き",text:"鍵がかかっているようだ。扉には文字が刻まれている。『8回以内に、正しい組み合わせを導け』"},
  {logId:"room2_door_04",logType:"dialogue",speaker:"主人公",text:"8回以内……？ 正しい組み合わせって、何のことだろう"}
 ]);
}
function inspectSecondRoomDesk(){
 if(!room2State.doorInspected){showRoomNotice("まずは正面の扉を調べよう。","room2_desk_locked");return}
 if(!room2State.deskInspected){room2State.deskInspected=true;saveGame();document.getElementById("r2Blocks").disabled=false}
 showRoomDialog([
  {logId:"room2_desk_01",logType:"investigation",speaker:"ト書き",text:"机の上には、〇、□、△、×、＋の記号が書かれたブロックが置かれている。それぞれ、赤と青の2色がある。"},
  {logId:"room2_desk_02",logType:"investigation",speaker:"ト書き",text:"その奥には、ブロックをはめ込めそうな5つの枠が並んでいた。枠の横には『HIT』『BLOW』と書かれた表示がある。"},
  {logId:"room2_desk_03",logType:"narration",speaker:"主人公",thought:true,text:"このブロックを、枠にはめればいいのか……？"}
 ]);
}
function showSecondRoomPuzzle(){
 const overlay=document.createElement("div");overlay.className="device-overlay room2-puzzle-overlay";
 overlay.innerHTML=`<section class="room2-puzzle" role="dialog" aria-modal="true" aria-label="HITとBLOWの謎"><button class="device-close" aria-label="閉じる">×</button><h2>記号と色を並べる</h2><p class="room2-rule">駒を選んで5枠を埋めます。同じ駒を選ぶと外れ、色違いを選ぶと色が変わります。枠を2つタップすると順番を入れ替えられます。</p><div class="room2-answer-slots" role="group" aria-label="回答"></div><div class="room2-palette" role="group" aria-label="駒のパレット"></div><div class="room2-puzzle-actions"><button type="button" class="room2-submit">判定する</button><button type="button" class="room2-hint-paper">ルールの紙</button></div><p class="room2-feedback" aria-live="polite"></p><div class="room2-history" aria-label="これまでの判定"></div></section>`;
 game.appendChild(overlay);
 const slots=overlay.querySelector(".room2-answer-slots"),palette=overlay.querySelector(".room2-palette"),history=overlay.querySelector(".room2-history"),feedback=overlay.querySelector(".room2-feedback");let selectedSlot=null;
 const close=()=>overlay.remove();overlay.querySelector(".device-close").addEventListener("click",close);
 const render=()=>{
  slots.innerHTML=ROOM2_SYMBOLS.map((_,index)=>{const piece=room2State.guess[index];return `<button type="button" class="room2-answer-slot${selectedSlot===index?" is-selected":""}" data-slot="${index}" aria-label="枠${index+1}${piece?` ${piece.color}${piece.symbol}`:" 空"}" aria-pressed="${selectedSlot===index}">${piece?`<i class="${piece.color==="赤"?"red":"blue"}">${piece.symbol}</i>`:`<span>枠${index+1}</span>`}</button>`}).join("");
  slots.querySelectorAll("[data-slot]").forEach(button=>button.addEventListener("click",()=>{const index=Number(button.dataset.slot);if(!room2State.guess[index])return;if(selectedSlot===null){selectedSlot=index}else if(selectedSlot===index){selectedSlot=null}else{[room2State.guess[selectedSlot],room2State.guess[index]]=[room2State.guess[index],room2State.guess[selectedSlot]];selectedSlot=null;saveGame()}render()}));
  palette.innerHTML=ROOM2_COLORS.flatMap(color=>ROOM2_SYMBOLS.map(symbol=>{const active=room2State.guess.some(piece=>piece.symbol===symbol&&piece.color===color);return `<button type="button" class="room2-palette-token${active?" is-active":""}" data-symbol="${symbol}" data-color="${color}" aria-pressed="${active}" aria-label="${color}${symbol}"><i class="${color==="赤"?"red":"blue"}">${symbol}</i><small>${color}</small></button>`})).join("");
  palette.querySelectorAll("[data-symbol]").forEach(button=>button.addEventListener("click",()=>{const token={symbol:button.dataset.symbol,color:button.dataset.color};const index=room2State.guess.findIndex(piece=>piece.symbol===token.symbol);if(index>=0){if(room2State.guess[index].color===token.color)room2State.guess.splice(index,1);else room2State.guess[index]=token}else if(room2State.guess.length<5)room2State.guess.push(token);selectedSlot=null;feedback.textContent=room2State.guess.length===5?"":"5つの枠をすべて埋めてください。";saveGame();render()}));
  history.innerHTML=room2State.history.map(entry=>`<div class="room2-history-row"><span>${entry.guess.map(piece=>`<i class="${piece.color=== "赤"?"red":"blue"}">${piece.symbol}</i>`).join("")}</span><b>${entry.hit}H ${entry.blow}B</b></div>`).join("");
 };
 overlay.querySelector(".room2-hint-paper").addEventListener("click",()=>{close();showRoomDialog([
  {logId:"room2_rules_01",logType:"investigation",speaker:"紙",text:"ルール"},
  {logId:"room2_rules_02",logType:"investigation",speaker:"紙",text:"〇、□、△、×、＋の5種類の記号を、5つの枠に一つずつ配置する。それぞれの記号には、赤か青のどちらかの色を選ぶ。"},
  {logId:"room2_rules_03",logType:"investigation",speaker:"紙",text:"答えと記号・色・位置のすべてが一致しているものをHITとする。記号と色は正しいが、位置が違うものをBLOWとする。判定結果を手がかりに正しい組み合わせを導き出せ。8回以内に正解すればクリア。"},
  {logId:"room2_rules_04",logType:"dialogue",speaker:"主人公",text:"なるほど……このブロックを組み合わせて、正解を探すってことか"}
 ],()=>showSecondRoomPuzzle())});
 overlay.querySelector(".room2-submit").addEventListener("click",()=>{
  if(room2State.guess.length!==5){feedback.textContent="5つの枠をすべて埋めてください。";return}
  const result=room2Evaluate(room2State.guess,room2State.answer);room2State.attempts++;
  room2State.history.push({guess:room2State.guess.map(piece=>({...piece})),...result});room2State.guess=[];saveGame();render();
  if(result.hit===5){handleRoom2Correct(close,feedback);return}
  feedback.textContent=`${result.hit} HIT　${result.blow} BLOW　（${room2State.attempts}回目）`;
  const pair=ROOM2_DIALOGUES[`${result.hit}H`]?.[result.blow];
  const reaction=pair?.map((text,index)=>({logId:`room2_judge_${room2State.attempts}_${result.hit}_${result.blow}_${index}`,logType:"dialogue",speaker:index===0?"ハナ":"主人公",text}))||[];
  const followUp=room2State.attempts===8?handleRoom2Limit:room2State.attempts===4||room2State.attempts===6||room2State.attempts===7?()=>showRoomDialog(room2MilestoneLines(room2State.attempts)):null;
  if(reaction.length||followUp){close();showRoomDialog(reaction,followUp||undefined)}
 });
 render();overlay.querySelector(".device-close").focus();
}
function room2Evaluate(guess,answer){
 let hit=0,blow=0;
 guess.forEach((piece,index)=>{const target=answer[index];if(piece.symbol===target.symbol&&piece.color===target.color){hit++;return}if(answer.some((candidate,candidateIndex)=>candidateIndex!==index&&candidate.symbol===piece.symbol&&candidate.color===piece.color))blow++});
 return {hit,blow};
}
function room2MilestoneLines(attempt){
 const sets={4:[["あと4回だね","ハナ"],["もう半分使ったんですね……","主人公"],["でも、最初よりかなり絞れてるんじゃない？","ハナ"],["焦らず、今までの結果を見ながら考えてみよう！","ハナ"],["……そうですね。まだ大丈夫です","主人公"]],6:[["あと2回……！","ハナ"],["さすがに、ちょっと緊張してきました","主人公"],["ここまで来たら、適当に変えちゃダメだよ！","ハナ"],["今までのヒットとブローをもう一回見て、確実なところから考えよう","ハナ"],["……一度整理してみます","主人公"]],7:[["あと一回……！","ハナ"],["ハナさんのほうが緊張してません？","主人公"],["だって、ここまで一緒に考えてきたんだもん！","ハナ"],["大丈夫。最後まで一緒に考えるから","ハナ"],["わかりました。これで決めます","主人公"]]};
 return sets[attempt].map((line,index)=>({logId:`room2_attempt_${attempt}_${index}`,logType:"dialogue",speaker:line[1],text:line[0]}));
}
function handleRoom2Limit(){
 if(room2State.run===1){showRoomDialog([
  {logId:"room2_limit_first_01",logType:"dialogue",speaker:"主人公",text:"……終わった"},{logId:"room2_limit_first_02",logType:"dialogue",speaker:"ハナ",text:"終わってないよ？"},{logId:"room2_limit_first_03",logType:"dialogue",speaker:"主人公",text:"え？"},{logId:"room2_limit_first_04",logType:"dialogue",speaker:"ハナ",text:"解けるまでやればいいじゃん。わたしも一緒に考えるから"},{logId:"room2_limit_first_05",logType:"dialogue",speaker:"主人公",text:"……それ、ルールとしていいんですか？"},{logId:"room2_limit_first_06",logType:"dialogue",speaker:"ハナ",text:"いいのいいの！"}
  ]);return}
 showRoomDialog([{logId:"room2_retry_limit_01",logType:"dialogue",speaker:"ハナ",text:"うーん……8回使っちゃったね"},{logId:"room2_retry_limit_02",logType:"dialogue",speaker:"主人公",text:"あと少しだと思うんですけど……"},{logId:"room2_retry_limit_03",logType:"dialogue",speaker:"ハナ",text:"ここまでの結果を使って、このまま続けてもいいし、一回リセットして最初からやり直してもいいよ"}],()=>showRoomChoices([
  {label:"このまま続ける",onSelect:()=>showSecondRoomPuzzle()},
  {label:"答えをリセットして、もう一度挑戦する",onSelect:resetRoom2Challenge}
 ]));
}
function resetRoom2Challenge(){room2State.run++;room2State.answer=room2RandomAnswer();room2State.attempts=0;room2State.history=[];room2State.guess=[];saveGame();showRoomDialog([{logId:`room2_retry_start_${room2State.run}`,logType:"narration",speaker:"システム",text:"問題がリセットされました。"}]);}
function handleRoom2Correct(close,feedback){
 const attempts=room2State.attempts;
 if(attempts>8){close();showRoomDialog([
  {logId:"room2_solution_01",logType:"dialogue",speaker:"ハナ",text:"なんとか解けたね！"},{logId:"room2_solution_02",logType:"dialogue",speaker:"主人公",text:"でも、これじゃクリアにはならないんですよね"},{logId:"room2_solution_03",logType:"dialogue",speaker:"ハナ",text:"そうだね。8回以内にクリアするには、効率よく選択肢を絞っていく必要がありそう"},{logId:"room2_solution_04",logType:"dialogue",speaker:"ハナ",text:"まずは、5個の色を全部当てるのがいいと思うな！"},{logId:"room2_solution_05",logType:"dialogue",speaker:"主人公",text:"色からですか？"},{logId:"room2_solution_06",logType:"dialogue",speaker:"ハナ",text:"うん！ あと、変えるのは一つずつがいいよ！一気に何個も変えちゃうと、変えたうちのどれが正解だったのかわからなくなっちゃうからね"},{logId:"room2_solution_07",logType:"dialogue",speaker:"主人公",text:"一つずつ変えて、結果を比べる……"},{logId:"room2_solution_08",logType:"dialogue",speaker:"ハナ",text:"そうそう！例えば、一つだけ色を変えてブローが増えたら、変えたあとの色が合ってるってこと。逆にブローが減ったら、元の色のほうが正しかったって考えられるよね"},{logId:"room2_solution_09",logType:"dialogue",speaker:"ハナ",text:"それに、色を変えてヒットが増えたなら――"},{logId:"room2_solution_10",logType:"dialogue",speaker:"主人公",text:"その色で、場所も合ってる"},{logId:"room2_solution_11",logType:"dialogue",speaker:"ハナ",text:"正解！そうやって一個ずつ確かめていけば、かなり絞れると思うよ"},{logId:"room2_solution_12",logType:"dialogue",speaker:"主人公",text:"最初からそうやって考えればよかった……"},{logId:"room2_solution_13",logType:"dialogue",speaker:"ハナ",text:"一回やってみたからわかったんだよ。じゃあ、答えを変えてもう一回！今度は8回以内ね！"},{logId:"room2_solution_14",logType:"dialogue",speaker:"主人公",text:"……はい。今度こそ"}
  ],resetRoom2Challenge);return}
 close();const lines=attempts<=4?[["…解けた","主人公"],["えっ！すごい！はやい！","ハナ"],["運がよかっただけです…","主人公"]]:attempts<=6?[["正解！","ハナ"],["解けました","主人公"],["余裕あったね！すごいよ！","ハナ"]]:[["正解！","ハナ"],["……やっと解けた","主人公"],["お疲れさま！難しかったね！","ハナ"]];
 showRoomDialog(lines.map((line,index)=>({logId:`room2_correct_${index}`,logType:"dialogue",speaker:line[1],text:line[0]})),()=>completeRoom2());
}
function completeRoom2(){
 room2State.unlocked=true;room2State.flashbackSeen=true;saveGame();
 showRoomDialog([
  {logId:"room2_after_correct_01",logType:"narration",speaker:"ト書き",text:"5つのブロックをはめ終わると、装置全体がうっすらと光り始めた。"},{logId:"room2_after_correct_02",logType:"dialogue",speaker:"主人公",text:"……光ってる？"},{logId:"room2_after_correct_03",logType:"dialogue",speaker:"ハナ",text:"わっ……！"},{logId:"room2_after_correct_04",logType:"narration",speaker:"ト書き",text:"光は次第に強くなり、机から部屋全体へと広がっていく。"},{logId:"room2_after_correct_05",logType:"dialogue",speaker:"主人公",text:"これで、扉が――"},{logId:"room2_after_correct_06",logType:"narration",speaker:"ト書き",text:"言い終わるより先に、まばゆい光が視界を覆った。部屋の輪郭が、光の中へ溶けていく。どこか遠くから、楽器の音が聞こえてきた。"},{logId:"room2_after_correct_07",logType:"narration",speaker:"主人公",thought:true,text:"この音……"},{logId:"room2_after_correct_08",logType:"narration",speaker:"ト書き",text:"聞き覚えのある音に引かれるように、意識がゆっくりと遠のいていく。"},
  ...room2FlashbackContent.map(line=>({...line,logType:line.thought||line.speaker==="ト書き"?"narration":"dialogue"}))
 ],()=>showRoomDialog([
  ...room2AfterFlashbackContent.map(line=>({...line,logType:line.thought||line.speaker==="ト書き"?"narration":"dialogue"}))
 ],()=>{const door=document.getElementById("r2Door");door?.classList.add("is-unlocked");showRoomNotice("扉の鍵が開いた。","room2_unlocked","narration")}));
}
function showSecondRoomHana(){
 room2State.hanaHints++;saveGame();
 const lines=room2State.hanaHints===1?[
  {logId:"room2_hana_01",logType:"dialogue",speaker:"ハナ",text:"今度はあれが謎みたいだね"},
  {logId:"room2_hana_02",logType:"dialogue",speaker:"ハナ",text:"扉の言葉と机のブロック、どっちも見てみよう"}
 ]:[{logId:`room2_hana_repeat_${room2State.hanaHints}`,logType:"dialogue",speaker:"ハナ",text:"HITは記号・色・位置が全部合っているもの。BLOWは記号と色が合っていて、位置だけ違うものだよ"}];
 showRoomDialog(lines);
}
