// 第三の部屋。文字盤は2026-10-13にユーザーが提示した10×10を使用。
const ROOM3_CHAT_MESSAGES=[
 {sender:"先輩",letter:"O",face:"(-_-)"},{sender:"主人公",letter:"N",face:"|-・)"},{sender:"先輩",letter:"A",face:"(・u |"},{sender:"主人公",letter:"J",face:"(•ω-v)"},{sender:"先輩",letter:"I",face:"|｡･)"},
 {sender:"主人公",letter:"M",face:"(-_|"},{sender:"先輩",letter:"O",face:"(-_-)"},{sender:"主人公",letter:"J",face:"(•ω-v)"},{sender:"先輩",letter:"I",face:"|｡･)"},{sender:"主人公",letter:"N",face:"|-・)"},
 {sender:"先輩",letter:"O",face:"(-_-)"},{sender:"主人公",letter:"A",face:"(・u |"},{sender:"先輩",letter:"I",face:"|｡･)"},{sender:"主人公",letter:"D",face:"(v・・)"},{sender:"先輩",letter:"A",face:"(・u |"}
];
const ROOM3_MORSE={"A":"・－","B":"－・・・","C":"－・－・","D":"－・・","E":"・","F":"・・－・","G":"－－・","H":"・・・・","I":"・・","J":"・－－－","K":"－・－","L":"・－・・","M":"－－","N":"－・","O":"－－－","P":"・－－・","Q":"－－・－","R":"・－・","S":"・・・","T":"－","U":"・・－","V":"・・・－","W":"・－－","X":"－・・－","Y":"－・－－","Z":"－－・・"};
const ROOM3_BOARD=[["ラ","ヘ","ヨ","ソ","ヒ","ロ","コ","モ","ノ","チ"],["チ","イ","ヘ","ニ","ロ","サ","ケ","ラ","ミ","フ"],["ナ","ロ","ラ","キ","ル","ヤ","ツ","ト","イ","メ"],["ラ","ソ","ソ","モ","ソ","ア","ケ","ワ","イ","ネ"],["テ","ヘ","フ","ナ","イ","ニ","ワ","モ","ト","ク"],["ル","ミ","ナ","ユ","キ","ス","シ","ネ","レ","ホ"],["ウ","ハ","フ","ワ","ミ","マ","テ","ア","ル","ハ"],["フ","ヘ","モ","ア","ト","オ","リ","フ","ニ","ヨ"],["ヌ","ヘ","ヨ","ニ","ヨ","ヒ","ム","マ","ト","レ"],["ツ","チ","ヒ","ワ","フ","エ","ク","ノ","ヨ","ヒ"]];const room3IntroLines=[
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
 {logId:"room3_flashback_04",logType:"narration",speaker:"ト書き",text:"送信してしばらくすると、スマートフォンが震える。画面には、先輩からの着信が表示されていた。"},{logId:"room3_final_ringtone",logType:"narration",speaker:"ト書き",text:"短い着信音が、部屋に響く。"},{logId:"room3_flashback_04_call",logType:"narration",speaker:"ト書き",text:"僕は通話に出た。"},
 {logId:"room3_flashback_05",logType:"dialogue",speaker:"先輩",text:"おー！ きれいじゃん。ちゃんと片付いてる！"},
 {logId:"room3_flashback_06",logType:"dialogue",speaker:"主人公",text:"ありがとうございます"},
 {logId:"room3_flashback_07",logType:"dialogue",speaker:"先輩",text:"……でもさ。なんか、女の子ウケ狙ってない？"},
 {logId:"room3_flashback_08",logType:"dialogue",speaker:"主人公",text:"なっ、そんなことないですよ"},
 {logId:"room3_flashback_09",logType:"dialogue",speaker:"先輩",text:"ほんとかな～？ 女の子連れ込もうとしてるんじゃないの～～？"},
 {logId:"room3_flashback_10",logType:"dialogue",speaker:"主人公",text:"しませんって！！"},
 {logId:"room3_flashback_11",logType:"narration",speaker:"ト書き",text:"思わず、声が大きくなる。"},
 {logId:"room3_flashback_12",logType:"dialogue",speaker:"主人公",text:"僕、この部屋にあげるのは先輩だけって決めてますから！"},
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
 {logId:"room3_flashback_27",logType:"dialogue",speaker:"主人公",text:"桜並木……"},
 {logId:"room3_flashback_28",logType:"dialogue",speaker:"先輩",text:"駅から少し歩いたところ"},
 {logId:"room3_flashback_28_reply",logType:"dialogue",speaker:"主人公",text:"あ、多分わかります"},
 {logId:"room3_flashback_29",logType:"dialogue",speaker:"先輩",text:"ほんと？ 迷ったら連絡して"},
 {logId:"room3_flashback_30",logType:"dialogue",speaker:"主人公",text:"はい！"},
 {logId:"room3_flashback_31",logType:"narration",speaker:"ト書き",text:"通話を切る。スマートフォンを握ったまま、大きく息を吐いた。"},
 {logId:"room3_flashback_32",logType:"dialogue",speaker:"主人公",text:"……何言ってんだ、僕"},
 {logId:"room3_flashback_33",logType:"narration",speaker:"ト書き",text:"けれど、もう引き返すつもりはなかった。――しばらくして。教えてもらった川沿いに着く。川に沿って、満開に近い桜がどこまでも続いていた。"},
 {logId:"room3_flashback_34",logType:"narration",speaker:"ト書き",text:"街灯に照らされた桜の花が、夜の川沿いを淡く彩っている。風が吹くたび、花びらが数枚、ゆっくりと舞い落ちる。四月に入ったばかりの夜は、まだ少し肌寒い。桜並木の下で、先輩を待っていた。"},
 {logId:"room3_flashback_35",logType:"narration",speaker:"ト書き",text:"少しすると、先輩が少し小走りでこちらに近づいてきた。"},
 {logId:"room3_flashback_36",logType:"dialogue",speaker:"先輩",text:"ごめん、待った？"},
 {logId:"room3_flashback_37",logType:"dialogue",speaker:"主人公",text:"いえ、僕も今来たところです"},
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
 {logId:"room3_flashback_61",logType:"dialogue",speaker:"主人公",text:"僕、ずっと思ってたんです。先輩と会えなかった間、ずっと。次に会ったら、もう離れたくないって。先輩には、いつも隣にいてほしいって思ったんです。先輩は、僕にとってそれだけ大切な人なんです。"},
 {logId:"room3_flashback_62",logType:"dialogue",speaker:"先輩",text:"……それって、つまりどういうこと？"},
 {logId:"room3_flashback_63",logType:"narration",speaker:"ト書き",text:"先輩は、僕が何を言いたいのか分かっているようだった。少しからかうような笑みを浮かべながら、まっすぐこちらを見ている。"},
 {logId:"room3_flashback_64",logType:"dialogue",speaker:"主人公",text:"僕と……付き合ってください"},
 {logId:"room3_flashback_65",logType:"dialogue",speaker:"先輩",text:"……遅いよ"},
 {logId:"room3_flashback_66",logType:"dialogue",speaker:"主人公",text:"え？"},
 {logId:"room3_flashback_67",logType:"dialogue",speaker:"先輩",text:"ずっと待ってたんだから、その言葉"},
 {logId:"room3_flashback_68",logType:"narration",speaker:"ト書き",text:"先輩が、こちらに左手を差し出す。"},
 {logId:"room3_flashback_69",logType:"dialogue",speaker:"先輩",text:"こちらこそ。私と付き合ってください"},
 {logId:"room3_flashback_70",logType:"dialogue",speaker:"主人公",text:"！……はい！ お願いします！"},
 {logId:"room3_flashback_71",logType:"narration",speaker:"ト書き",text:"僕は右手で、差し出された先輩の左手を握る。そのまま二人で、桜並木を歩き続けた。四月の夜は、肌寒かったはずなのに。繋いだ右手のぬくもりだけは、いつまでもはっきりと感じていた。"},
 {logId:"room3_flashback_72",logType:"narration",speaker:"ト書き",text:"――回想終了。"}
];
const room3AfterMemoryLines=[
 {logId:"room3_after_01",logType:"narration",speaker:"ト書き",text:"視界が、元の部屋に戻る。"},
 {logId:"room3_after_02",logType:"dialogue",speaker:"主人公",text:"……"},
 {logId:"room3_after_03",logType:"narration",speaker:"ト書き",text:"右手を見る。もう誰とも繋いではいない。それでも、あのときのぬくもりがまだ残っているような気がした。"},
 {logId:"room3_after_04",logType:"dialogue",speaker:"主人公",text:"……思い出した"},
 {logId:"room3_after_05",logType:"dialogue",speaker:"主人公",text:"あの人と……付き合い始めた日のこと"},
 {logId:"room3_after_06",logType:"dialogue",speaker:"ハナ",text:"そっか……"},
 {logId:"room3_after_07",logType:"narration",speaker:"ト書き",text:"ハナは、少し嬉しそうに笑った。"},
 {logId:"room3_after_08",logType:"dialogue",speaker:"ハナ",text:"ちゃんと思い出せたんだね"},
 {logId:"room3_after_09",logType:"dialogue",speaker:"主人公",text:"はい"},
 {logId:"room3_after_10",logType:"dialogue",speaker:"主人公",text:"……なんだか、すごく大事なことだった気がします"},
 {logId:"room3_after_11",logType:"dialogue",speaker:"ハナ",text:"うん。きっと、大事な思い出だよ"},
 {logId:"room3_after_12",logType:"narration",speaker:"ト書き",text:"一瞬だけ、ハナが懐かしそうに目を細めたように見えた。"},
 {logId:"room3_after_13",logType:"narration",speaker:"主人公",thought:true,text:"鍵は開いた。次の部屋に行こう。"}
];
const room3NextRoomLines=[
 {logId:"room3_exit_01",logType:"narration",speaker:"ト書き",text:"僕はドアノブに手を伸ばした。"},
 {logId:"room3_exit_02",logType:"narration",speaker:"ト書き",text:"開けようとすると、また扉はひとりでに開いた。"},
 {logId:"room3_exit_03",logType:"narration",speaker:"ト書き",text:"扉の向こうへ、身体が吸い込まれていくような感覚に襲われる。"},
 {logId:"room3_exit_04",logType:"narration",speaker:"ト書き",text:"視界が、まばゆい光に包まれていく。"}
];
function showThirdRoom(savedState){
 Dialogue.stop();firstRoomState=undefined;room2State=undefined;currentScene="room03";
 room3State={view:"front",doorInspected:false,deskInspected:false,bedInspected:false,shelfInspected:false,trumpetInspected:false,phoneInspected:false,chatRead:false,morseSolved:false,puzzleAttempts:0,hanaVisits:0,hintLevel:0,unlocked:false,highlightEnabled:true,memorySeen:false,morseChartNoticeSeen:false,morseChartLogged:false,nextRoomTransitionSeen:false,...savedState};
 if(room3State.unlocked)room3State.morseSolved=true;
 game.innerHTML=`<main class="room room-three room3-arriving ${room3State.unlocked?"is-restored":""}" aria-label="第三の部屋">
  <header class="room-header"><p class="room-label">第三の部屋</p><p class="room-color-status">${room3State.unlocked?"記憶を取り戻した部屋":"大学時代の自室"}</p></header>
  <div class="room-stage-wrap"><section class="room-stage room3-stage" aria-label="大学時代の自室">
   <img class="room3-background-art" id="r3Background" src="images/background/room03/room03_front.webp" alt="" aria-hidden="true"><div class="room3-shared-door" aria-hidden="true"></div><div class="room3-sleeping-hana" aria-hidden="true"><span class="sleep-head"></span><span class="sleep-body"></span><span class="sleep-legs"></span></div><div class="room3-sleep-shoes" aria-hidden="true"></div><button type="button" class="object room3-object room3-sleep-target" id="r3SleepingHana" aria-label="眠っているハナ"><span>ハナ</span></button>
   <button class="object room3-object room3-door" id="r3Door"><span>扉</span></button><button class="object room3-object room3-bed" id="r3Bed"><span>ベッド</span></button>
   <button class="object room3-object room3-desk" id="r3Desk" ${room3State.doorInspected?"":"disabled"}><span>机</span></button><button class="object room3-object room3-phone" id="r3Phone" ${room3State.deskInspected?"":"disabled"}><span>スマートフォン</span></button>
   <button class="object room3-object room3-shelf" id="r3Shelf" ${room3State.doorInspected?"":"disabled"}><span>小さな棚</span></button><button class="object room3-object room3-trumpet" id="r3Trumpet"><span>トランペット</span></button><button class="object room3-object room3-hana" id="r3Hana"><span>ハナ</span></button>
  </section></div><nav class="room-navigation" aria-label="部屋を見回す"><button type="button" id="r3TurnLeft" aria-label="左を向く">◀</button><button type="button" id="r3TurnRight" aria-label="右を向く">▶</button></nav><p class="explore-status" id="exploreStatus" aria-live="polite"></p>
 </main>`;
 document.getElementById("r3TurnLeft").addEventListener("click",()=>turnThirdRoom(-1));
 document.getElementById("r3TurnRight").addEventListener("click",()=>turnThirdRoom(1));
 renderThirdRoomView();
 document.getElementById("r3Door").addEventListener("click",inspectThirdRoomDoor);
 document.getElementById("r3Desk").addEventListener("click",inspectThirdRoomDesk);
 document.getElementById("r3Phone").addEventListener("click",showThirdRoomChat);
 document.getElementById("r3SleepingHana").addEventListener("click",inspectThirdRoomBed);
 document.getElementById("r3Bed").addEventListener("click",inspectThirdRoomBed);
 document.getElementById("r3Shelf").addEventListener("click",inspectThirdRoomShelf);
 document.getElementById("r3Trumpet").addEventListener("click",inspectThirdRoomTrumpet);
 document.getElementById("r3Hana").addEventListener("click",showThirdRoomHana);
 if(savedState){
  showRoomNotice("続きから再開しました。","room3_resumed","narration");
  if(room3State.nextRoomTransitionSeen)setTimeout(showFourthRoomBoundary,150);
  else if(room3State.unlocked&&!room3State.memorySeen)setTimeout(playThirdRoomMemory,150);
 }else showRoomDialog(room3IntroLines);
 if(window.GameplayUI)GameplayUI.installRoom({sceneId:"room03",title:"第三の部屋",objective:()=>room3State.unlocked?"開いた扉の先へ進む":"扉の謎を解く",onCompanion:showThirdRoomHana,getHighlights:()=>!!room3State.highlightEnabled,setHighlights:enabled=>{room3State.highlightEnabled=!!enabled;saveGame()}});
 saveGame();
}
// Presentation state only; investigation gates and puzzle rules remain unchanged.
const ROOM3_VIEWS=["front","right","back","left"];
function renderThirdRoomView(){
 const view=ROOM3_VIEWS.includes(room3State.view)?room3State.view:"front";
 room3State.view=view;
 const stage=game.querySelector(".room3-stage");if(!stage)return;
 stage.dataset.view=view;
 stage.classList.toggle("hana-asleep",!room3State.bedInspected);
 document.getElementById("r3Background").src=`images/background/room03/room03_${view}.webp`;
 const targets={front:room3State.bedInspected?["r3Door","r3Hana"]:["r3Door"],right:["r3Desk","r3Phone"],back:["r3Shelf","r3Trumpet"],left:room3State.bedInspected?["r3Bed"]:["r3Bed","r3SleepingHana"]};
 for(const button of stage.querySelectorAll(".room3-object")){button.hidden=!targets[view].includes(button.id);button.setAttribute("aria-label",button.querySelector("span").textContent);}
 window.RoomExploration?.mount('room03',stage,view,room3State,{image:`images/background/room03/room03_${view}.webp`,imageAspect:16/9});
}
function turnThirdRoom(step){
 if(currentScene!=="room03"||game.querySelector(".room-dialog-overlay,.device-overlay,.design-overlay,.inspection-overlay"))return;
 const index=ROOM3_VIEWS.includes(room3State.view)?ROOM3_VIEWS.indexOf(room3State.view):0;
 room3State.view=ROOM3_VIEWS[(index+step+4)%4];renderThirdRoomView();saveGame();
}

function inspectThirdRoomDoor(){
 if(room3State.unlocked){
  if(!room3State.memorySeen){playThirdRoomMemory();return}
  showThirdRoomExitChoice();return
 }
 if(room3State.doorInspected){showRoomNotice("『顔に隠された合図を読み、隠された想いを言葉にせよ』","room3_door_repeat","investigation");return}
 room3State.doorInspected=true;saveGame();document.getElementById("r3Desk").disabled=false;document.getElementById("r3Shelf").disabled=false;
 showRoomDialog([{logId:"room3_door_01",logType:"investigation",speaker:"ト書き",text:"扉には『顔に隠された合図を読み、隠された想いを言葉にせよ』と書かれている。"},{logId:"room3_door_02",logType:"dialogue",speaker:"主人公",text:"顔に隠された合図……？"},{logId:"room3_door_03",logType:"dialogue",speaker:"主人公",text:"今回も、この部屋のどこかに手がかりがあるんだろうな。"}]);
}
function inspectThirdRoomDesk(){
 if(room3State.deskInspected){showRoomNotice("黒い天板の机だ。スマートフォンがある。","room3_desk_repeat","investigation");return}
 room3State.deskInspected=true;saveGame();document.getElementById("r3Phone").disabled=false;document.getElementById("r3Board").disabled=false;
 showRoomDialog([{logId:"room3_desk_01",logType:"investigation",speaker:"ト書き",text:"黒い天板の机だ。一人で組み立てるのに2時間かかったことを思い出す。"},{logId:"room3_desk_02",logType:"narration",speaker:"主人公",thought:true,text:"どうして、そんなことを覚えているんだろう。"},{logId:"room3_desk_03",logType:"investigation",speaker:"ト書き",text:"机の上にはスマートフォンが置かれている。"}]);
}
function room3ReplyIsCorrect(text,stage){
 const answer=(text||"").normalize("NFKC").trim().replace(/[\s　、。・]/gu,"");
 if(stage==="morse"){
  const letters=answer.toUpperCase();
  return letters==="ONAJIMOJINOAIDA"||["同じ文字の間","同じ文字のあいだ","オナジモジノアイダ","おなじもじのあいだ"].includes(answer);
 }
 const kana=answer.replace(/[ぁ-ゖ]/gu,char=>String.fromCharCode(char.charCodeAt(0)+0x60));
 return kana==="イツモトナリニ"||kana==="イツモ隣ニ";
}
function showThirdRoomChat(){
 if(!room3State.deskInspected||game.querySelector(".device-overlay,.room-dialog-overlay,.design-overlay,.inspection-overlay"))return;
 if(!Array.isArray(room3State.phoneReplies))room3State.phoneReplies=[];
 const overlay=document.createElement("div");overlay.className="device-overlay room3-chat-overlay";
 overlay.innerHTML='<section class="r3-chat-workspace" role="dialog" aria-modal="true" aria-label="先輩とのトークと資料">'+
  '<div class="room3-chat-panel r3-handset"><div class="r3-phone-speaker" aria-hidden="true"></div>'+
   '<div class="r3-phone-lcd"><div class="r3-phone-status" aria-hidden="true"><span>▮▮▮</span><span>▰</span></div>'+
    '<header class="r3-app-header"><button type="button" class="device-close" aria-label="トークを閉じる">◀</button><h2>先輩</h2><span class="r3-header-spacer" aria-hidden="true"></span></header>'+
    '<div class="r3-chat-scroll" tabindex="0" role="region" aria-label="先輩との会話をスクロール"></div>'+
    '<form class="r3-reply-form" aria-label="先輩に返信する"><input class="r3-reply-input" type="text" aria-label="返信の本文" placeholder="返信を入力" autocomplete="off" enterkeyhint="send"><button class="r3-reply-send" type="submit" aria-label="返信を送る">送信</button></form>'+
   '</div><div class="r3-phone-home" aria-hidden="true"></div></div>'+
  '<aside class="r3-companion-sheet" aria-label="トークと一緒に見る資料">'+
   '<div class="r3-companion-tabs"><button type="button" class="r3-show-morse">モールス対応表</button><button type="button" class="r3-show-letterboard">届いた画像</button></div>'+
   '<div class="r3-companion-content"><div class="r3-inline-morse r3-morse-chart" hidden><div class="r3-morse-grid" role="list" aria-label="AからZのモールス信号対応表"></div><p class="r3-morse-legend">・ 短点　　－ 長点</p></div>'+
   '<div class="r3-large-letterboard" hidden><img src="images/items/room03-chat-letterboard.svg" alt="先輩から送られた10行10列の文字盤"></div>'+
   '<div class="r3-no-attachment" aria-hidden="true"></div></div>'+
  '</aside></section>';
 game.appendChild(overlay);
 const stream=overlay.querySelector(".r3-chat-scroll"),form=overlay.querySelector(".r3-reply-form"),
  input=overlay.querySelector(".r3-reply-input"),send=overlay.querySelector(".r3-reply-send"),
  chart=overlay.querySelector(".r3-inline-morse"),grid=chart.querySelector(".r3-morse-grid"),
  largeBoard=overlay.querySelector(".r3-large-letterboard"),empty=overlay.querySelector(".r3-no-attachment"),
  chartTab=overlay.querySelector(".r3-show-morse"),boardTab=overlay.querySelector(".r3-show-letterboard");
 // Preserve the same A-Z reference from the shelf and keep it beside the phone.
 for(const [letter,code] of Object.entries(ROOM3_MORSE)){
  const cell=document.createElement("div");cell.className="r3-morse-cell";
  cell.setAttribute("role","listitem");cell.setAttribute("aria-label",letter+" "+code);
  const label=document.createElement("strong");label.textContent=letter;label.setAttribute("aria-hidden","true");
  const signals=document.createElement("span");signals.className="r3-morse-code";
  for(const mark of code){const signal=document.createElement("i");signal.className=mark==="・"?"morse-dot":"morse-dash";signals.appendChild(signal)}
  cell.append(label,signals);grid.appendChild(cell);
 }
 let referenceMode=room3State.morseSolved?"letterboard":"morse";
 const showReference=mode=>{
  referenceMode=mode;
  const canChart=room3State.shelfInspected,canBoard=room3State.morseSolved;
  chartTab.disabled=!canChart;boardTab.disabled=!canBoard;
  if(referenceMode==="morse"&&!canChart)referenceMode=canBoard?"letterboard":"none";
  if(referenceMode==="letterboard"&&!canBoard)referenceMode=canChart?"morse":"none";
  chart.hidden=referenceMode!=="morse";
  largeBoard.hidden=referenceMode!=="letterboard";
  empty.hidden=referenceMode!=="none";
  chartTab.setAttribute("aria-pressed",String(referenceMode==="morse"));
  boardTab.setAttribute("aria-pressed",String(referenceMode==="letterboard"));
 };
 chartTab.addEventListener("click",()=>showReference("morse"));
 boardTab.addEventListener("click",()=>showReference("letterboard"));
 const scrollToBottom=()=>{stream.scrollTop=stream.scrollHeight};
 const appendMessage=(sender,message,index)=>{
  const article=document.createElement("article");
  article.className=(index===undefined?"r3-text-message":"room3-chat-message")+" "+(sender==="先輩"?"senpai":"player");
  article.setAttribute("aria-label",index===undefined?sender:(index+1)+"通目、"+sender);
  const name=document.createElement("small");name.textContent=sender;
  const bubble=document.createElement("p");bubble.textContent=message;
  article.append(name,bubble);stream.appendChild(article);return article;
 };
 const appendPhoto=()=>{
  const article=document.createElement("article");article.className="r3-photo-message senpai";
  const name=document.createElement("small");name.textContent="先輩";
  const button=document.createElement("button");button.type="button";button.className="r3-board-preview";button.setAttribute("aria-label","届いた文字盤画像を拡大して見る");
  const img=document.createElement("img");img.src="images/items/room03-chat-letterboard.svg";img.alt="10行10列の文字盤画像";
  button.appendChild(img);button.addEventListener("click",()=>showReference("letterboard"));
  article.append(name,button);stream.appendChild(article);
 };
 [["先輩","ねえ、暇だから変なことしよ"],["主人公","今講義中なんですけど"],["先輩","今から顔文字だけで会話する！"],["主人公","今はスタンプもあるのにですか？絶対会話にならないですよw"]].forEach(([sender,message])=>appendMessage(sender,message));
 const divider=document.createElement("p");divider.className="room3-chat-context";divider.textContent="顔文字のやり取り";stream.appendChild(divider);
 ROOM3_CHAT_MESSAGES.forEach((item,index)=>appendMessage(item.sender,item.face,index));
 [["主人公","やっぱり何言ってるのかわかりません"],["先輩","はい負け〜！"],["主人公","勝負だったんですか！？どんなルール！？"]].forEach(([sender,message])=>appendMessage(sender,message));
 let boardAlreadyReceived=false;
 const receiveBoard=()=>{
  if(boardAlreadyReceived)return;boardAlreadyReceived=true;
  appendMessage("先輩","じゃあ、これはどう？");
  appendPhoto();
 };
 for(const reply of room3State.phoneReplies){
  if(!reply||typeof reply.text!=="string")continue;
  appendMessage("主人公",reply.text);
  if(reply.stage==="morse"&&reply.correct){receiveBoard()}
  else if(!reply.correct)appendMessage("先輩","んー、もう一度考えてみて");
 }
 if(room3State.morseSolved)receiveBoard();
 showReference(referenceMode);
 scrollToBottom();
 let solvedTransition=false;
 const close=activateDeviceModal(overlay,"r3Phone",overlay.querySelector(".device-close"),()=>{
  if(!room3State.chatRead){room3State.chatRead=true;room3State.phoneInspected=true}
  saveGame();
  if(room3State.unlocked&&!room3State.memorySeen&&!solvedTransition){
   solvedTransition=true;playThirdRoomMemory();
  }
 });
 form.addEventListener("submit",event=>{
  event.preventDefault();
  if(room3State.unlocked)return;
  const reply=input.value.trim();if(!reply)return;
  const stage=room3State.morseSolved?"final":"morse";
  const correct=room3ReplyIsCorrect(reply,stage);
  room3State.phoneReplies.push({stage,text:reply,correct});
  room3State.chatRead=true;room3State.phoneInspected=true;
  appendMessage("主人公",reply);input.value="";
  if(correct&&stage==="morse"){
   room3State.morseSolved=true;receiveBoard();
   showReference("letterboard");
  }else if(correct&&stage==="final"){
   room3State.unlocked=true;
   send.disabled=true;input.disabled=true;
   const room=game.querySelector(".room-three");room?.classList.add("is-restored");
   const status=room?.querySelector(".room-color-status");if(status)status.textContent="記憶を取り戻した部屋";
   saveGame();scrollToBottom();
   // Keep the final sent reply visible before the memory starts.
   window.setTimeout(()=>{if(overlay.isConnected)close()},650);
   return;
  }else{
   appendMessage("先輩","んー、もう一度考えてみて");
  }
  saveGame();scrollToBottom();
 });
 if(room3State.unlocked){form.hidden=true}
}
function inspectThirdRoomBed(){
 if(room3State.bedInspected){showRoomNotice("ベッドには、特に変わったところはない。","room3_bed_repeat","investigation");return}
 const lines=[{logId:"room3_bed_01",logType:"dialogue",speaker:"主人公",text:"ハナさん、何寝てるんですか。"},{logId:"room3_bed_02",logType:"dialogue",speaker:"ハナ",text:"スー、スー……"},{logId:"room3_bed_03",logType:"dialogue",speaker:"主人公",text:"ハナさん？？"},{logId:"room3_bed_04",logType:"dialogue",speaker:"ハナ",text:"あ、ごめんごめん。頭使ったら眠くなっちゃって。"},{logId:"room3_bed_05",logType:"dialogue",speaker:"主人公",text:"はあ……起きてください。手伝ってくれるんですよね。"},{logId:"room3_bed_06",logType:"investigation",speaker:"ト書き",text:"ハナにどいてもらい、ベッドを調べる。特に変わったところはない。"}];
 showRoomDialog(lines,()=>{room3State.bedInspected=true;renderThirdRoomView();saveGame()});
}
function inspectThirdRoomShelf(){
 if(room3State.shelfInspected){showThirdRoomMorseChart();return}
 room3State.shelfInspected=true;saveGame();
 showRoomDialog([{logId:"room3_shelf_01",logType:"investigation",speaker:"ト書き",text:"小さな棚には、漫画や講義のテキストが並んでいる。"},{logId:"room3_shelf_02",logType:"investigation",speaker:"ト書き",text:"その間に、点と線で書かれたモールス信号の対応表が挟まっている。"},{logId:"room3_shelf_03_voice",logType:"dialogue",speaker:"主人公",text:"トン、トーン……。あれ、長い方は『ツー』って読むんだっけ。"}],showThirdRoomMorseChart);
}
function showThirdRoomMorseChart(){
 if(!room3State.shelfInspected||game.querySelector(".device-overlay,.room-dialog-overlay,.design-overlay,.inspection-overlay"))return;
 const overlay=document.createElement("div");overlay.className="device-overlay r3-morse-overlay";
 overlay.innerHTML=`<section class="r3-morse-chart" role="dialog" aria-modal="true" aria-label="AからZのモールス信号対応表"><header><h2>モールス信号対応表</h2><button type="button" class="device-close" aria-label="対応表を閉じる">閉じる</button></header><div class="r3-morse-grid" role="list" aria-label="アルファベット26文字"></div><p class="r3-morse-legend">・ 短点　　－ 長点</p></section>`;
 game.appendChild(overlay);
 const grid=overlay.querySelector(".r3-morse-grid");
 for(const [letter,code] of Object.entries(ROOM3_MORSE)){
  const cell=document.createElement("div");cell.className="r3-morse-cell";cell.dataset.letter=letter;cell.setAttribute("role","listitem");cell.setAttribute("aria-label",`${letter} ${code}`);
  const label=document.createElement("strong");label.textContent=letter;label.setAttribute("aria-hidden","true");
  const signals=document.createElement("span");signals.className="r3-morse-code";signals.dataset.code=code;signals.setAttribute("aria-hidden","true");
  for(const mark of code){const symbol=document.createElement("i");symbol.className=mark==="・"?"morse-dot":"morse-dash";signals.appendChild(symbol)}
  cell.append(label,signals);grid.appendChild(cell);
 }
 if(!room3State.morseChartLogged){recordLog({logId:"room3_shelf_03",logType:"narration",speaker:"システム",text:`対応表：${Object.entries(ROOM3_MORSE).map(([letter,code])=>`${letter}=${code}`).join("　")}`,logGroup:"room3_shelf",logTarget:"小さな棚"});room3State.morseChartLogged=true;saveGame()}
 activateDeviceModal(overlay,"r3Shelf",overlay.querySelector(".device-close"),()=>{if(room3State.morseChartNoticeSeen)return;room3State.morseChartNoticeSeen=true;saveGame();showRoomNotice("モールス信号の対応表を記録した。","room3_morse_chart")});
}
// The answer is now typed as a reply in the chat, never into a separate puzzle dialog.
function showThirdRoomPuzzle(){
 showThirdRoomChat();
}
function playThirdRoomMemory(){
 if(room3State.memorySeen)return;
 showRoomDialog([...room3FlashbackLines,...room3AfterMemoryLines],()=>{room3State.memorySeen=true;saveGame()});
}
function showThirdRoomExitChoice(){
 if(game.querySelector(".device-overlay,.room-dialog-overlay"))return;
 const overlay=document.createElement("div");overlay.className="device-overlay";
 overlay.innerHTML=`<section class="menu-panel room-exit-menu" aria-label="第四の部屋へ進む"><button type="button" class="device-close" aria-label="閉じる">×</button><h2>どうする？</h2><button type="button" id="room3NextButton">次の部屋へ向かう</button><button type="button" id="room3StayButton">もう少し部屋を調べてみる</button></section>`;game.appendChild(overlay);
 const close=activateDeviceModal(overlay,"r3Door",overlay.querySelector("#room3NextButton"));
 overlay.querySelector("#room3StayButton").addEventListener("click",()=>close());
 overlay.querySelector("#room3NextButton").addEventListener("click",()=>{close();showRoomDialog(room3NextRoomLines,()=>{room3State.nextRoomTransitionSeen=true;saveGame();showFourthRoomBoundary()})});
}
function inspectThirdRoomTrumpet(){
 if(room3State.trumpetInspected){showRoomNotice("記憶の中で使っていたものと同じトランペットだ。","room3_trumpet_repeat","investigation");return}
 room3State.trumpetInspected=true;saveGame();showRoomDialog([{logId:"room3_trumpet_01",logType:"investigation",speaker:"ト書き",text:"大学生になった主人公の部屋に置かれたトランペット。"},{logId:"room3_trumpet_02",logType:"narration",speaker:"主人公",thought:true,text:"記憶の中で使っていたものと同じだ。"}]);
}
function showThirdRoomHana(){
 if(game.querySelector(".inspection-overlay,.room-dialog-overlay,.device-overlay"))return;
 if(!room3State.bedInspected){inspectThirdRoomBed();return;}
 if(!room3State.unlocked){
  const id=!room3State.chatRead||!room3State.shelfInspected?'r3_search':room3State.morseSolved?'r3_board':'r3_faces';
  const hints={
   r3_search:['扉の言葉と、机の上のスマートフォンを見比べてみよう。','顔文字を読む助けになるものが、棚にないかな？ スマートフォンと棚、両方を確かめてみて。'],
   r3_faces:['顔文字の表情より、点と線の形に注目してみて。','一通の顔文字が、一つのアルファベットに対応しているよ。棚のモールス対応表と見比べよう。','最初の「(-_-)」は、横線が三本でOになるよ。同じように十五通を上から読み、つながった文字をローマ字として読んでみて。'],
   r3_board:['読み取った言葉は、文字盤から文字を探すための指示みたい。','同じ文字で、一文字だけを挟んでいる場所を探そう。横だけでなく、縦や斜めも見てみて。','たとえば二行二列の「イ」は、斜めの「ラ」と「ラ」に挟まれているよ。見つかった七文字を、盤面の上から順に読んでみて。']
  };
  PuzzleHints.show(id,'r3Hana',hints[id]);return;
 }
 const line=(id,speaker,text)=>({logId:id,logType:"dialogue",speaker,text});
 let lines;
 if(room3State.unlocked){
  lines=[
   line("room3_hana_clear_01","ハナ","ちゃんと思い出せたみたいだね。"),
   line("room3_hana_clear_02","主人公","はい。……大切な記憶でした。"),
   line("room3_hana_clear_03","ハナ","うん。大事にしてね。")
  ];
 }
 showRoomDialog(lines);
}function showThirdRoomBoundary(){
 room2State.nextRoomTransitionSeen=true;saveGame();Dialogue.stop();game.innerHTML=`<div class="room-transition room3-transition" aria-label="第三の部屋へ移動"><img src="images/background/room01/room01_door_halfopen.png" alt="扉を通って次の部屋へ"></div>`;
 setTimeout(()=>{if(game.querySelector(".room3-transition"))showThirdRoom(roomStates.room03)},1100);
}


