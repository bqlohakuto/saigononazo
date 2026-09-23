// 第三の部屋。原稿にない画像はCSSの仮素材、未確定の盤面配置は後から差し替える。
const ROOM3_CHAT_MESSAGES=[
 {sender:"先輩",letter:"O",face:"(-_-)"},{sender:"主人公",letter:"N",face:"|-・)"},{sender:"先輩",letter:"A",face:"(・u |"},{sender:"主人公",letter:"J",face:"(•ω-v)"},{sender:"先輩",letter:"I",face:"|｡･)"},
 {sender:"主人公",letter:"M",face:"(-_|"},{sender:"先輩",letter:"O",face:"(-_-)"},{sender:"主人公",letter:"J",face:"(•ω-v)"},{sender:"先輩",letter:"I",face:"|｡･)"},{sender:"主人公",letter:"N",face:"|-・)"},
 {sender:"先輩",letter:"O",face:"(-_-)"},{sender:"主人公",letter:"A",face:"(・u |"},{sender:"先輩",letter:"I",face:"|｡･)"},{sender:"主人公",letter:"D",face:"(v・・)"},{sender:"先輩",letter:"A",face:"(・u |"}
];
const ROOM3_MORSE={O:"－－－",N:"－・",A:"・－",J:"・－－－",I:"・・",M:"－－",D:"－・・"};
const ROOM3_BOARD=[
 ["A","イ","A","B","ツ","B","C","モ","C","・"],
 ["D","ト","D","E","ナ","E","F","リ","F","・"],
 ["G","ニ","G","・","・","・","・","・","・","・"],
 ...Array.from({length:7},()=>Array.from({length:10},()=>"・"))
];const room3IntroLines=[
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
 {logId:"room3_flashback_01",logType:"narration",speaker:"ト書き",text:"引っ越しを終えて、ようやく部屋の片付けも落ち着いた。段ボールもほとんど片付き、殺風景だった部屋も少しだけ生活感が出てきた。"},
 {logId:"room3_flashback_02",logType:"narration",speaker:"ト書き",text:"主人公は部屋を見回すと、スマートフォンを取り出して一枚写真を撮った。その写真を、先輩に送る。【トーク画面】"},
 {logId:"room3_flashback_03",logType:"dialogue",speaker:"主人公",text:"先輩、見てください！ 僕の部屋、完成しました！"},
 {logId:"room3_flashback_04",logType:"narration",speaker:"ト書き",text:"送信してしばらくすると、スマートフォンが震える。画面には、先輩からの着信が表示されていた。通話に出る。"},
 {logId:"room3_flashback_05",logType:"dialogue",speaker:"先輩",text:"おー！ きれいじゃん。ちゃんと片付いてる！"},
 {logId:"room3_flashback_06",logType:"dialogue",speaker:"主人公",text:"ありがとうございます"},
 {logId:"room3_flashback_07",logType:"dialogue",speaker:"先輩",text:"……でもさ。なんか、女の子ウケ狙ってない？"},
 {logId:"room3_flashback_08",logType:"dialogue",speaker:"主人公",text:"なっ、そんなことないですよ"},
 {logId:"room3_flashback_09",logType:"dialogue",speaker:"先輩",text:"ほんとかな～？ 女の子連れ込もうとしてるんじゃないの～～？"},
 {logId:"room3_flashback_10",logType:"dialogue",speaker:"主人公",text:"しませんって！！"},
 {logId:"room3_flashback_11",logType:"narration",speaker:"ト書き",text:"思わず、声が大きくなる。"},
 {logId:"room3_flashback_12",logType:"dialogue",speaker:"主人公",text:"俺、この部屋にあげるのは先輩だけって決めてますから！"},
 {logId:"room3_flashback_13",logType:"dialogue",speaker:"先輩",text:"…………。……何それ。…………。"},
 {logId:"room3_flashback_14",logType:"narration",speaker:"ト書き",text:"言ってから、自分が何を口にしたのかに気づく。"},
 {logId:"room3_flashback_15",logType:"dialogue",speaker:"主人公",text:"いや……えっと……"},
 {logId:"room3_flashback_16",logType:"dialogue",speaker:"先輩",text:"…………"},
 {logId:"room3_flashback_17",logType:"narration",speaker:"ト書き",text:"少しの沈黙。心臓の音だけが、やけに大きく聞こえる。"},
 {logId:"room3_flashback_18",logType:"dialogue",speaker:"主人公",text:"……先輩"},
 {logId:"room3_flashback_19",logType:"dialogue",speaker:"先輩",text:"ん？"},
 {logId:"room3_flashback_20",logType:"dialogue",speaker:"主人公",text:"今から……会えませんか"},
 {logId:"room3_flashback_21",logType:"dialogue",speaker:"先輩",text:"今から？"},
 {logId:"room3_flashback_22",logType:"dialogue",speaker:"主人公",text:"はい"},
 {logId:"room3_flashback_23",logType:"narration",speaker:"ト書き",text:"少しだけ間が空く。"},
 {logId:"room3_flashback_24",logType:"dialogue",speaker:"先輩",text:"……いいよ"},
 {logId:"room3_flashback_25",logType:"narration",speaker:"ト書き",text:"もう一度、短い間があった。"},
 {logId:"room3_flashback_26",logType:"dialogue",speaker:"先輩",text:"じゃあ、川沿いの桜並木でいい？ 場所、わかる？"},
 {logId:"room3_flashback_27",logType:"dialogue",speaker:"主人公",text:"桜並木……。あ、たぶん分かります"},
 {logId:"room3_flashback_28",logType:"dialogue",speaker:"先輩",text:"駅から少し歩いたところ。桜がずっと並んでるところがあるんだけど"},
 {logId:"room3_flashback_29",logType:"dialogue",speaker:"先輩",text:"ほんと？ 迷ったら連絡して"},
 {logId:"room3_flashback_30",logType:"dialogue",speaker:"主人公",text:"はい！"},
 {logId:"room3_flashback_31",logType:"narration",speaker:"ト書き",text:"通話を切る。スマートフォンを握ったまま、大きく息を吐いた。"},
 {logId:"room3_flashback_32",logType:"dialogue",speaker:"主人公",text:"……何言ってんだ、俺"},
 {logId:"room3_flashback_33",logType:"narration",speaker:"ト書き",text:"けれど、もう引き返すつもりはなかった。――しばらくして。教えてもらった川沿いに着く。川に沿って、満開に近い桜がどこまでも続いていた。"},
 {logId:"room3_flashback_34",logType:"narration",speaker:"ト書き",text:"街灯に照らされた桜の花が、夜の川沿いを淡く彩っている。風が吹くたび、花びらが数枚、ゆっくりと舞い落ちる。四月に入ったばかりの夜は、まだ少し肌寒い。桜並木の下で、先輩を待っていた。"},
 {logId:"room3_flashback_35",logType:"narration",speaker:"ト書き",text:"少しすると、先輩が少し小走りでこちらに近づいてきた。"},
 {logId:"room3_flashback_36",logType:"dialogue",speaker:"先輩",text:"ごめん、待った？"},
 {logId:"room3_flashback_37",logType:"dialogue",speaker:"主人公",text:"いえ、俺も今来たところです"},
 {logId:"room3_flashback_38",logType:"dialogue",speaker:"先輩",text:"ほんと？ ……って、なんだかデートの会話みたい"},
 {logId:"room3_flashback_39",logType:"narration",speaker:"ト書き",text:"少し息を整えながら、先輩がこちらを見る。"},
 {logId:"room3_flashback_40",logType:"dialogue",speaker:"先輩",text:"……寒くない？"},
 {logId:"room3_flashback_41",logType:"dialogue",speaker:"主人公",text:"少しだけ"},
 {logId:"room3_flashback_42",logType:"dialogue",speaker:"先輩",text:"じゃあ、歩こっか"},
 {logId:"room3_flashback_43",logType:"dialogue",speaker:"主人公",text:"はい"},
 {logId:"room3_flashback_44",logType:"narration",speaker:"ト書き",text:"二人で、桜並木に沿って歩き始めた。"},
 {logId:"room3_flashback_45",logType:"dialogue",speaker:"先輩",text:"ひさしぶりだね"},
 {logId:"room3_flashback_46",logType:"dialogue",speaker:"主人公",text:"そうですね"},
 {logId:"room3_flashback_47",logType:"dialogue",speaker:"先輩",text:"背、伸びたよね"},
 {logId:"room3_flashback_48",logType:"dialogue",speaker:"主人公",text:"はい。やっと先輩より高くなりました"},
 {logId:"room3_flashback_49",logType:"dialogue",speaker:"先輩",text:"……桜、綺麗だね"},
 {logId:"room3_flashback_50",logType:"dialogue",speaker:"主人公",text:"そうですね"},
 {logId:"room3_flashback_51",logType:"narration",speaker:"ト書き",text:"……。"},
 {logId:"room3_flashback_52",logType:"dialogue",speaker:"先輩",text:"……。"},
 {logId:"room3_flashback_53",logType:"narration",speaker:"ト書き",text:"しばらく、無言のまま歩く。"},
 {logId:"room3_flashback_54",logType:"dialogue",speaker:"先輩",text:"ねえ！！"},
 {logId:"room3_flashback_55",logType:"dialogue",speaker:"主人公",text:"！？"},
 {logId:"room3_flashback_56",logType:"dialogue",speaker:"先輩",text:"話があって会いたいって言ったの、そっちだよね！？"},
 {logId:"room3_flashback_57",logType:"dialogue",speaker:"主人公",text:"……はい"},
 {logId:"room3_flashback_58",logType:"narration",speaker:"ト書き",text:"ゆっくりと、大きく深呼吸をした。"},
 {logId:"room3_flashback_59",logType:"dialogue",speaker:"主人公",text:"先輩"},
 {logId:"room3_flashback_60",logType:"dialogue",speaker:"先輩",text:"うん"},
 {logId:"room3_flashback_61",logType:"dialogue",speaker:"主人公",text:"俺、ずっと思ってたんです。先輩と会えなかった間、ずっと。次に会ったら、もう離れたくないって。先輩には、いつも隣にいてほしいって思ったんです。先輩は、俺にとってそれだけ大切な人なんです。"},
 {logId:"room3_flashback_62",logType:"dialogue",speaker:"先輩",text:"……それって、つまりどういうこと？"},
 {logId:"room3_flashback_63",logType:"narration",speaker:"ト書き",text:"先輩は、俺が何を言いたいのか分かっているようだった。少しからかうような笑みを浮かべながら、まっすぐこちらを見ている。"},
 {logId:"room3_flashback_64",logType:"dialogue",speaker:"主人公",text:"俺と……付き合ってください"},
 {logId:"room3_flashback_65",logType:"dialogue",speaker:"先輩",text:"……遅いよ"},
 {logId:"room3_flashback_66",logType:"dialogue",speaker:"主人公",text:"え？"},
 {logId:"room3_flashback_67",logType:"dialogue",speaker:"先輩",text:"ずっと待ってたんだから、その言葉"},
 {logId:"room3_flashback_68",logType:"narration",speaker:"ト書き",text:"先輩が、こちらに手を差し出す。"},
 {logId:"room3_flashback_69",logType:"dialogue",speaker:"先輩",text:"こちらこそ。私と付き合ってください"},
 {logId:"room3_flashback_70",logType:"dialogue",speaker:"主人公",text:"！……はい！ お願いします！"},
 {logId:"room3_flashback_71",logType:"narration",speaker:"ト書き",text:"差し出された手を握る。そのまま二人で、桜並木を歩き続けた。四月の夜は、肌寒かったはずなのに。繋いだ右手のぬくもりだけは、いつまでもはっきりと感じていた。"},
 {logId:"room3_flashback_72",logType:"narration",speaker:"ト書き",text:"――回想終了。"}
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
 overlay.innerHTML=`<section class="room3-puzzle-panel" role="dialog" aria-modal="true" aria-label="顔文字と文字盤の謎"><button type="button" class="device-close" aria-label="閉じる">×</button><h2>顔に隠された合図</h2><p class="room3-puzzle-instruction"></p><div class="room3-morse-entry"><label>モールス信号の答え<input class="room3-answer-input" type="text" autocomplete="off" placeholder="アルファベットまたは日本語"></label><button type="button" class="room3-answer-submit">確認</button></div><div class="room3-letterboard" role="grid" aria-label="テスト用の仮10行10列文字盤"></div><div class="room3-final-entry" hidden><label>隠された想い<input class="room3-final-input" type="text" autocomplete="off" placeholder="ひらがなで入力"></label><button type="button" class="room3-final-submit">答える</button></div><p class="room3-puzzle-feedback" role="status" aria-live="polite"></p><p class="room3-puzzle-note">※盤面配置・画像はテスト用の仮素材です。確定シナリオ・素材に合わせて差し替えます。</p></section>`;game.appendChild(overlay);
 const close=activateDeviceModal(overlay,"r3Board",overlay.querySelector(".room3-answer-input"));const instruction=overlay.querySelector(".room3-puzzle-instruction"),entry=overlay.querySelector(".room3-morse-entry"),board=overlay.querySelector(".room3-letterboard"),finalEntry=overlay.querySelector(".room3-final-entry"),feedback=overlay.querySelector(".room3-puzzle-feedback");
 const render=()=>{entry.hidden=room3State.morseSolved;board.hidden=!room3State.morseSolved;finalEntry.hidden=!room3State.morseSolved||room3State.unlocked;instruction.textContent=room3State.morseSolved?"仮の盤面で「同じ文字の間」を読み取る。配置と操作は正式稿に合わせて差し替えます。":"顔文字を対応表でモールスに直し、15通を上から読んで答えを入力しよう。";board.innerHTML=ROOM3_BOARD.map((row,rowIndex)=>`<div class="room3-board-row" role="row">${row.map((value,columnIndex)=>`<span role="gridcell" aria-label="${rowIndex+1}行${columnIndex+1}列 ${value}">${value}</span>`).join("")}</div>`).join("");if(room3State.unlocked)feedback.textContent="正解！『いつも隣に』という想いが伝わった。"};
 overlay.querySelector(".room3-answer-submit").addEventListener("click",()=>{const answer=overlay.querySelector(".room3-answer-input").value.trim().toUpperCase().replace(/[\s　、。・]/gu,"");room3State.puzzleAttempts++;if(answer==="ONAJIMOJINOAIDA"||answer==="同じ文字の間"||answer==="同じ文字のあいだ"){room3State.morseSolved=true;feedback.textContent="『同じ文字の間』……文字盤を調べよう。";saveGame();render()}else feedback.textContent="顔文字とモールス対応表を、もう一度見比べてみよう。"});
 overlay.querySelector(".room3-final-submit").addEventListener("click",()=>{const answer=overlay.querySelector(".room3-final-input").value.trim().replace(/[\s　、。・]/gu,"").replace(/[ぁ-ゖ]/gu,char=>String.fromCharCode(char.charCodeAt(0)+0x60));room3State.puzzleAttempts++;if(answer==="イツモトナリニ"||answer==="いつも隣に"){room3State.unlocked=true;saveGame();render();close();const room=game.querySelector(".room-three");room?.classList.add("is-restored");const status=room?.querySelector(".room-color-status");if(status)status.textContent="記憶を取り戻した部屋";showRoomDialog(room3FlashbackLines,()=>{room3State.memorySeen=true;saveGame()})}else feedback.textContent="文字盤から読み取った言葉を入力しよう。"});
 render();
}
function inspectThirdRoomTrumpet(){
 room3State.trumpetInspected=true;saveGame();showRoomDialog([{logId:"room3_trumpet_01",logType:"investigation",speaker:"ト書き",text:"大学生になった主人公の部屋に置かれたトランペット。"},{logId:"room3_trumpet_02",logType:"narration",speaker:"主人公",thought:true,text:"記憶の中で使っていたものと同じだ。"}]);
}
function showThirdRoomHana(){
 if(game.querySelector(".inspection-overlay,.room-dialog-overlay,.device-overlay"))return;
 showRoomNotice("ハナの追加会話・ヒントは、正式シナリオに合わせて追加します。","room3_hana_pending","system");
}function showThirdRoomBoundary(){
 room2State.nextRoomTransitionSeen=true;saveGame();Dialogue.stop();game.innerHTML=`<div class="room-transition room3-transition" aria-label="第三の部屋へ移動"><img src="images/background/room01/room01_door_halfopen.png" alt="扉を通って次の部屋へ"></div>`;
 setTimeout(()=>{if(game.querySelector(".room3-transition"))showThirdRoom(roomStates.room03)},1100);
}
