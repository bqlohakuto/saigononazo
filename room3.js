// 第三の部屋。原稿にない画像はCSSの仮素材、未確定の盤面配置は後から差し替える。
const ROOM3_CHAT_MESSAGES=[
 {sender:"先輩",letter:"O",face:"(-_-)"},{sender:"主人公",letter:"N",face:"|-・)"},{sender:"先輩",letter:"A",face:"(・u |"},{sender:"主人公",letter:"J",face:"(•ω-v)"},{sender:"先輩",letter:"I",face:"|｡･)"},
 {sender:"主人公",letter:"M",face:"(-_|"},{sender:"先輩",letter:"O",face:"(-_-)"},{sender:"主人公",letter:"J",face:"(•ω-v)"},{sender:"先輩",letter:"I",face:"|｡･)"},{sender:"主人公",letter:"N",face:"|-・)"},
 {sender:"先輩",letter:"O",face:"(-_-)"},{sender:"主人公",letter:"A",face:"(・u |"},{sender:"先輩",letter:"I",face:"|｡･)"},{sender:"主人公",letter:"D",face:"(v・・)"},{sender:"先輩",letter:"A",face:"(・u |"}
];
const ROOM3_MORSE={O:"－－－",N:"－・",A:"・－",J:"・－－－",I:"・・",M:"－－",D:"－・・"};
const ROOM3_BOARD=[
 ["ラ","ヘ","ヨ","ソ","ヒ","ロ","コ","モ","ノ","チ"],
 ["チ","イ","ヘ","ニ","ロ","サ","ケ","ラ","ミ","フ"],
 ["ナ","ロ","ラ","キ","ル","ヤ","ツ","ト","イ","メ"],
 ["ラ","ソ","ソ","モ","ソ","ア","ケ","ワ","イ","ネ"],
 ["テ","ヘ","フ","ナ","イ","ニ","ワ","モ","ト","ク"],
 ["ル","ミ","ナ","ユ","キ","ス","シ","ネ","レ","ホ"],
 ["ウ","ハ","フ","ワ","ミ","マ","テ","ア","ル","ハ"],
 ["フ","ヘ","モ","ア","ト","オ","リ","フ","ニ","ヨ"],
 ["ヌ","ヘ","ヨ","ニ","ヨ","ヒ","ム","マ","ト","レ"],
 ["ツ","チ","ヒ","ワ","フ","エ","ク","ノ","ヨ","ヒ"]
];
const room3IntroLines=[
 {logId:"room3_intro_01",logType:"narration",speaker:"ト書き",text:"視界が開ける。正面には、これまでと同じ扉。部屋の中には、ベッドと机、それから小さな棚だけが置かれていた。"},
 {logId:"room3_intro_02",logType:"dialogue",speaker:"主人公",text:"……殺風景な部屋だな"},
 {logId:"room3_intro_03",logType:"narration",speaker:"ト書き",text:"部屋の中を見回す。"},
 {logId:"room3_intro_04",logType:"dialogue",speaker:"主人公",text:"ん……？ どこか、見覚えがある。"},
 {logId:"room3_intro_05",logType:"dialogue",speaker:"主人公",text:"大学で一人暮らしを始めたときの部屋に、似てるような……"},
 {logId:"room3_intro_06",logType:"dialogue",speaker:"ハナ",text:"これ、君のじゃない？"},
 {logId:"room3_intro_07",logType:"dialogue",speaker:"主人公",text:"……本当だ。記憶の中で使っていたトランペットと同じだ。じゃあ、やっぱりここは……僕の部屋だ。"},
 {logId:"room3_intro_08",logType:"narration",speaker:"主人公",thought:true,text:"ハナさんは、どうしてこれが僕のものだって分かったんだ？ やっぱり、僕のことを知っているのか……？"}
];

const room3FlashbackLines=[
 {logId:"room3_memory_01",logType:"narration",speaker:"ト書き",text:"片付けを終えた四月上旬。主人公は新しい部屋の写真を先輩へ送った。"},
 {logId:"room3_memory_02",logType:"dialogue",speaker:"先輩",text:"一人暮らしを始めたばかりなのに、もう女の子を連れ込むの？"},
 {logId:"room3_memory_03",logType:"dialogue",speaker:"主人公",text:"俺、この部屋にあげるのは先輩だけって決めてますから！"},
 {logId:"room3_memory_04",logType:"narration",speaker:"主人公",thought:true,text:"口にしてから、自分の一人称が「俺」に変わっていたことに気づく。"},
 {logId:"room3_memory_05",logType:"dialogue",speaker:"主人公",text:"先輩。会いたいです。"},
 {logId:"room3_memory_06",logType:"dialogue",speaker:"先輩",text:"じゃあ、川沿いの桜並木で会おうか。"},
 {logId:"room3_memory_07",logType:"narration",speaker:"ト書き",text:"四月上旬の夜桜。並んで歩きながら、主人公はなかなか話を切り出せずにいた。"},
 {logId:"room3_memory_08",logType:"dialogue",speaker:"先輩",text:"さっきからどうしたの？ 言いたいことがあるんでしょ。"},
 {logId:"room3_memory_09",logType:"dialogue",speaker:"主人公",text:"次に会ったら、もう離れたくない。いつも隣にいてほしい。俺と付き合ってください。"},
 {logId:"room3_memory_10",logType:"dialogue",speaker:"先輩",text:"遅いよ。ずっと待ってた。こちらこそ、私と付き合ってください。"},
 {logId:"room3_memory_11",logType:"narration",speaker:"ト書き",text:"二人は手をつないで桜並木を歩き出した。右手に伝わるぬくもりが、記憶を満たしていく。"}
];
const room3AfterMemoryLines=[
 {logId:"room3_after_memory_01",logType:"dialogue",speaker:"主人公",text:"ハナさんと付き合い始めた日のことを思い出しました。"},
 {logId:"room3_after_memory_02",logType:"dialogue",speaker:"ハナ",text:"そっか……思い出せたんだね。よかった。"},
 {logId:"room3_after_memory_03",logType:"narration",speaker:"ト書き",text:"ハナは嬉しそうに応じ、一瞬、懐かしそうに目を細めた。扉の鍵は開いている。"}
];function showThirdRoom(savedState){
 Dialogue.stop();firstRoomState=undefined;room2State=undefined;currentScene="room03";
 room3State={doorInspected:false,deskInspected:false,bedInspected:false,shelfInspected:false,trumpetInspected:false,phoneInspected:false,chatRead:false,morseSolved:false,puzzleAttempts:0,hanaVisits:0,hintLevel:0,unlocked:false,highlightEnabled:true,memorySeen:false,...savedState};
 game.innerHTML=`<main class="room room-three room3-arriving ${room3State.unlocked?"is-restored":""}" aria-label="第三の部屋">
  <header class="room-header"><p class="room-label">第三の部屋</p><p class="room-color-status">${room3State.unlocked?"記憶を取り戻した部屋":"大学時代の自室"}</p></header>
  <div class="room-stage-wrap"><section class="room-stage room3-stage" aria-label="大学時代の自室">
   <div class="room3-bed-art" aria-hidden="true"></div><div class="room3-desk-art" aria-hidden="true"></div><div class="room3-shelf-art" aria-hidden="true"></div><div class="room3-trumpet-art" aria-hidden="true">♬</div>
   <button class="object room3-object room3-door" id="r3Door"><span>扉</span></button><button class="object room3-object room3-bed" id="r3Bed"><span>ベッド</span></button>
   <button class="object room3-object room3-desk" id="r3Desk" ${room3State.doorInspected?"":"disabled"}><span>机</span></button><button class="object room3-object room3-phone" id="r3Phone" ${room3State.deskInspected?"":"disabled"}><span>スマートフォン</span></button><button class="object room3-object room3-board" id="r3Board" ${room3State.deskInspected?"":"disabled"}><span>文字盤</span></button>
   <button class="object room3-object room3-shelf" id="r3Shelf" ${room3State.doorInspected?"":"disabled"}><span>小さな棚</span></button><button class="object room3-object room3-trumpet" id="r3Trumpet"><span>トランペット</span></button><button class="object room3-object room3-hana" id="r3Hana"><span>ハナ</span></button>
  </section></div><nav class="room-navigation"><span></span><p>部屋を調べよう</p><span></span></nav><p class="explore-status" id="exploreStatus" aria-live="polite">気になる場所をクリックしてください。</p>
 </main>`;
 document.getElementById("r3Door").addEventListener("click",inspectThirdRoomDoor);
 document.getElementById("r3Desk").addEventListener("click",inspectThirdRoomDesk);
 document.getElementById("r3Phone").addEventListener("click",showThirdRoomChat);
 document.getElementById("r3Board").addEventListener("click",showThirdRoomPuzzle);
 document.getElementById("r3Bed").addEventListener("click",inspectThirdRoomBed);
 document.getElementById("r3Shelf").addEventListener("click",inspectThirdRoomShelf);
 document.getElementById("r3Trumpet").addEventListener("click",inspectThirdRoomTrumpet);
 document.getElementById("r3Hana").addEventListener("click",showThirdRoomHana);
 if(savedState)showRoomNotice("続きから再開しました。","room3_resumed","narration");else showRoomDialog(room3IntroLines);
 if(window.GameplayUI)GameplayUI.installRoom({sceneId:"room03",title:"第三の部屋",objective:()=>room3State.unlocked?"開いた扉の先へ進む":"扉の謎を解く",onCompanion:showThirdRoomHana,getHighlights:()=>!!room3State.highlightEnabled,setHighlights:enabled=>{room3State.highlightEnabled=!!enabled;saveGame()}});
 saveGame();
}
function inspectThirdRoomDoor(){
 if(room3State.unlocked){showRoomDialog([{logId:"room3_door_open",logType:"investigation",speaker:"ト書き",text:"扉の鍵は開いている。先へ進めそうだ。"}]);return}
 room3State.doorInspected=true;saveGame();document.getElementById("r3Desk").disabled=false;document.getElementById("r3Shelf").disabled=false;
 showRoomDialog([{logId:"room3_door_01",logType:"investigation",speaker:"ト書き",text:"扉には『顔に隠された合図を読み、隠された想いを言葉にせよ』と書かれている。"},{logId:"room3_door_02",logType:"dialogue",speaker:"主人公",text:"顔に隠された合図……？"},{logId:"room3_door_03",logType:"dialogue",speaker:"主人公",text:"今回も、この部屋のどこかに手がかりがあるんだろうな。"}]);
}
function inspectThirdRoomDesk(){
 room3State.deskInspected=true;saveGame();document.getElementById("r3Phone").disabled=false;document.getElementById("r3Board").disabled=false;
 showRoomDialog([{logId:"room3_desk_01",logType:"investigation",speaker:"ト書き",text:"黒い天板の机だ。一人で組み立てるのに2時間かかったことを思い出す。"},{logId:"room3_desk_02",logType:"narration",speaker:"主人公",thought:true,text:"どうして、そんなことを覚えているんだろう。"},{logId:"room3_desk_03",logType:"investigation",speaker:"ト書き",text:"机の上にはスマートフォンが置かれている。"}]);
}
function showThirdRoomChat(){
 if(!room3State.deskInspected)return;
 const overlay=document.createElement("div");overlay.className="device-overlay room3-chat-overlay";
 overlay.innerHTML=`<section class="room3-chat-panel" role="dialog" aria-modal="true" aria-label="先輩とのトーク"><header><h2>トーク</h2><button type="button" class="device-close" aria-label="閉じる">×</button></header><div class="room3-chat-copy"><p>先輩「ねえ、暇だから変なことしよ」</p><p>主人公「今講義中なんですけど」</p><p>先輩「今から顔文字だけで会話する！」</p><p>主人公「今はスタンプもあるのにですか？絶対会話にならないですよw」</p></div><p class="room3-chat-context">顔文字のやり取り（上から順番）</p><div class="room3-chat-list"></div><div class="room3-chat-copy"><p>主人公「やっぱり何言ってるのかわかりません」</p><p>先輩「はい負け〜！」</p><p>主人公「勝負だったんですか！？どんなルール！？」</p></div></section>`;game.appendChild(overlay);
 const list=overlay.querySelector(".room3-chat-list");list.innerHTML=ROOM3_CHAT_MESSAGES.map((item,index)=>`<article class="room3-chat-message ${item.sender==="先輩"?"senpai":"player"}" aria-label="${index+1}通目、${item.sender}"><small>${item.sender}</small><p>${item.face}</p></article>`).join("");
 const close=()=>{overlay.remove();if(!room3State.chatRead){room3State.chatRead=true;room3State.phoneInspected=true;saveGame();showRoomNotice("顔文字のやり取りを確認した。","room3_chat_read")}};
 overlay.querySelector(".device-close").addEventListener("click",close);overlay.addEventListener("click",event=>{if(event.target===overlay)close()});
}
function inspectThirdRoomBed(){
 const lines=room3State.bedInspected?[{logId:"room3_bed_repeat",logType:"investigation",speaker:"ト書き",text:"ベッドには、特に変わったところはない。"}]:[{logId:"room3_bed_01",logType:"dialogue",speaker:"主人公",text:"ハナさん、何寝てるんですか。"},{logId:"room3_bed_02",logType:"dialogue",speaker:"ハナ",text:"スー、スー……"},{logId:"room3_bed_03",logType:"dialogue",speaker:"主人公",text:"ハナさん？？"},{logId:"room3_bed_04",logType:"dialogue",speaker:"ハナ",text:"あ、ごめんごめん。頭使ったら眠くなっちゃって。"},{logId:"room3_bed_05",logType:"dialogue",speaker:"主人公",text:"はあ……起きてください。手伝ってくれるんですよね。"},{logId:"room3_bed_06",logType:"investigation",speaker:"ト書き",text:"ハナにどいてもらい、ベッドを調べる。特に変わったところはない。"}];
 showRoomDialog(lines,()=>{room3State.bedInspected=true;saveGame()});
}
function inspectThirdRoomShelf(){
 room3State.shelfInspected=true;saveGame();
 showRoomDialog([{logId:"room3_shelf_01",logType:"investigation",speaker:"ト書き",text:"小さな棚には、漫画や講義のテキストが並んでいる。"},{logId:"room3_shelf_02",logType:"investigation",speaker:"ト書き",text:"その間に、点と線で書かれたモールス信号の対応表が挟まっている。"},{logId:"room3_shelf_03",logType:"narration",speaker:"システム",text:`対応表：${Object.entries(ROOM3_MORSE).map(([letter,code])=>`${letter}=${code}`).join("　")}`}],()=>showRoomNotice("モールス信号の対応表を記録した。","room3_morse_chart"));
}
function showThirdRoomPuzzle(){
 if(!room3State.doorInspected){showRoomNotice("先に扉の問題文を確認しよう。","room3_puzzle_door_gate");return}
 if(!room3State.chatRead){showRoomNotice("机のスマートフォンに、顔文字の手がかりがありそうだ。","room3_puzzle_chat_gate");return}
 if(!room3State.shelfInspected){showRoomNotice("モールス信号の対応表を探そう。","room3_puzzle_chart_gate");return}
 const overlay=document.createElement("div");overlay.className="device-overlay room3-puzzle-overlay";
 overlay.innerHTML=`<section class="room3-puzzle-panel" role="dialog" aria-modal="true" aria-label="顔文字と文字盤の謎"><button type="button" class="device-close" aria-label="閉じる">×</button><h2>顔に隠された合図</h2><p class="room3-puzzle-instruction"></p><div class="room3-morse-entry"><label>モールス信号の答え<input class="room3-answer-input" type="text" autocomplete="off" placeholder="アルファベットまたは日本語"></label><button type="button" class="room3-answer-submit">確認</button></div><div class="room3-letterboard" role="grid" aria-label="シナリオ原稿の10行10列文字盤"></div><div class="room3-final-entry" hidden><label>隠された想い<input class="room3-final-input" type="text" autocomplete="off" placeholder="ひらがなで入力"></label><button type="button" class="room3-final-submit">答える</button></div><p class="room3-puzzle-feedback" role="status" aria-live="polite"></p><p class="room3-puzzle-note">※文字配置はシナリオ原稿に基づきます。背景や表示素材は仮のため後から差し替えできます。</p></section>`;game.appendChild(overlay);
 const close=activateDeviceModal(overlay,"r3Board",overlay.querySelector(".room3-answer-input"));const instruction=overlay.querySelector(".room3-puzzle-instruction"),entry=overlay.querySelector(".room3-morse-entry"),board=overlay.querySelector(".room3-letterboard"),finalEntry=overlay.querySelector(".room3-final-entry"),feedback=overlay.querySelector(".room3-puzzle-feedback");
 const render=()=>{entry.hidden=room3State.morseSolved;board.hidden=!room3State.morseSolved;finalEntry.hidden=!room3State.morseSolved||room3State.unlocked;instruction.textContent=room3State.morseSolved?"『同じ文字の間』を手掛かりに、同じ文字にはさまれたマスを探し、上の行から読もう。":"顔文字を対応表でモールスに直し、15通を上から読んで答えを入力しよう。";board.innerHTML=ROOM3_BOARD.map((row,rowIndex)=>`<div class="room3-board-row" role="row">${row.map((value,columnIndex)=>`<span role="gridcell" aria-label="${rowIndex+1}行${columnIndex+1}列 ${value}">${value}</span>`).join("")}</div>`).join("");if(room3State.unlocked)feedback.textContent="正解！『いつも隣に』という想いが伝わった。"};
 overlay.querySelector(".room3-answer-submit").addEventListener("click",()=>{const answer=overlay.querySelector(".room3-answer-input").value.trim().toUpperCase().replace(/[\s　、。・]/gu,"");room3State.puzzleAttempts++;if(answer==="ONAJIMOJINOAIDA"||answer==="同じ文字の間"||answer==="同じ文字のあいだ"){room3State.morseSolved=true;feedback.textContent="『同じ文字の間』……文字盤を調べよう。";saveGame();render()}else feedback.textContent="顔文字とモールス対応表を、もう一度見比べてみよう。"});
 overlay.querySelector(".room3-final-submit").addEventListener("click",()=>{const answer=overlay.querySelector(".room3-final-input").value.trim().replace(/[\s　、。・]/gu,"").replace(/[ぁ-ゖ]/gu,char=>String.fromCharCode(char.charCodeAt(0)+0x60));room3State.puzzleAttempts++;if(answer==="イツモトナリニ"||answer==="いつも隣に"){room3State.unlocked=true;saveGame();render();close();const room=game.querySelector(".room-three");room?.classList.add("is-restored");const status=room?.querySelector(".room-color-status");if(status)status.textContent="記憶を取り戻した部屋";showRoomDialog([{logId:"room3_correct_01",logType:"dialogue",speaker:"主人公",text:"いつも隣に……。"},{logId:"room3_correct_02",logType:"narration",speaker:"ト書き",text:"顔文字に隠されていた言葉が、胸の奥にしまわれていた想いを呼び起こす。"}],()=>{room3State.memorySeen=true;saveGame();showRoomDialog(room3FlashbackLines,()=>showRoomDialog(room3AfterMemoryLines))})}else feedback.textContent="文字盤から読み取った言葉を入力しよう。"});
 render();
}
function inspectThirdRoomTrumpet(){
 room3State.trumpetInspected=true;saveGame();showRoomDialog([{logId:"room3_trumpet_01",logType:"investigation",speaker:"ト書き",text:"大学生になった主人公の部屋に置かれたトランペット。"},{logId:"room3_trumpet_02",logType:"narration",speaker:"主人公",thought:true,text:"記憶の中で使っていたものと同じだ。"}]);
}
function showThirdRoomHana(){
 if(game.querySelector(".inspection-overlay,.room-dialog-overlay,.device-overlay"))return;window.HanaChoiceUI?.ensureStyle?.();
 const topics=[{id:"room",label:"この部屋について",lines:[{logId:"room3_hana_room",logType:"dialogue",speaker:"ハナ",text:"ここは君が大学生のときに住んでいた部屋みたいだね"}]},{id:"puzzle",label:"扉の謎について",lines:[{logId:"room3_hana_puzzle",logType:"dialogue",speaker:"ハナ",text:"スマートフォンのトークと、部屋のどこかにある手がかりを見比べてみよう"}]}];
 if(!room3State.unlocked){
  const hints=["まずは扉の言葉を確認してみよう。","「顔に隠された合図」に注目して、この部屋の顔を探そう。","顔文字には別の読み方があるみたい。読む手掛かりが部屋にないかな。","信号そのものじゃなくて、モールス信号を表現するものを探してみよう。トン・トーン……ふふっ。","最初の顔文字「(-_-)」の横棒三つ。ツー、ツー、ツー……表の O と同じだよ。","暗号文で同じ文字に挟まれたマスを横・縦・斜めに探して、上の行から読んでみよう。"];
  const hintIndex=Math.min(room3State.hintLevel,hints.length-1);
  topics.push({id:"hint",label:"ヒント",lines:[{logId:"room3_hana_hint_"+(hintIndex+1),logType:"dialogue",speaker:"ハナ",text:hints[hintIndex]}],onComplete:()=>{room3State.hintLevel=Math.min(room3State.hintLevel+1,hints.length-1)}});
 } const overlay=document.createElement("div");overlay.className="device-overlay hana-choice-overlay";overlay.innerHTML=`<section class="menu-panel hana-choice-menu" aria-label="ハナに聞くことを選ぶ"><button type="button" class="device-close" aria-label="閉じる">×</button><p class="hana-choice-speaker">ハナ</p><h2>どうしたの？</h2><p class="hana-choice-lead">聞きたいことを選んでください。</p><div class="hana-choice-list"></div></section>`;game.appendChild(overlay);const list=overlay.querySelector(".hana-choice-list");
 [...topics,{id:"cancel",label:"なんでもない",cancel:true}].forEach(topic=>{const button=document.createElement("button");button.type="button";button.className=`hana-choice-button${topic.cancel?" is-cancel":""}`;button.textContent=topic.label;button.dataset.topic=topic.id;list.appendChild(button)});
 const close=activateDeviceModal(overlay,"r3Hana",list.querySelector("button"));list.querySelectorAll("[data-topic]").forEach(button=>button.addEventListener("click",()=>{const topic=topics.find(item=>item.id===button.dataset.topic);close();if(topic)showRoomDialog(topic.lines,()=>{room3State.hanaVisits++;topic.onComplete?.();saveGame()})}));
}
function showThirdRoomBoundary(){
 room2State.nextRoomTransitionSeen=true;saveGame();Dialogue.stop();game.innerHTML=`<div class="room-transition room3-transition" aria-label="第三の部屋へ移動"><img src="images/background/room01/room01_door_halfopen.png" alt="扉を通って次の部屋へ"></div>`;
 setTimeout(()=>{if(game.querySelector(".room3-transition"))showThirdRoom(roomStates.room03)},1100);
}
