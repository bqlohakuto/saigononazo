const R4_ANGLES=[0,0,0,0,0],R4_INITIAL=[2,1,0,3,2],R4_PANEL_KEYS=["star","lightPuzzle","meteors","wall","box"],R4_RAINBOW=["青O","赤M","紫S","黄T","藍R","橙E","緑E"];
let r4HanaGazeObserver;
function r4Count(){return [room4State.wall,room4State.box,room4State.star,room4State.lightPuzzle,room4State.meteors].filter(Boolean).length}
function r4All(){return r4Count()===5}
function r4Correct(){return r4All()&&room4State.angles.every((v,i)=>v===R4_ANGLES[i])}
function showFourthRoom(savedState){
 r4HanaGazeObserver?.disconnect();r4HanaGazeObserver=null;
 Dialogue.stop();firstRoomState=undefined;room2State=undefined;room3State=undefined;currentScene="room04";
 room4State={door:false,wall:false,box:false,star:false,lightPuzzle:false,meteors:false,angles:[...R4_INITIAL],panelRotationVersion:1,rainbow:[...R4_RAINBOW],lightOn:false,completed:false,memorySeen:false,nextRoomTransitionSeen:false,hanaSleepSeen:false,standInspected:false,highlightEnabled:true,view:"front",...savedState};
 if(!Array.isArray(room4State.angles)||room4State.angles.length!==5)room4State.angles=[...R4_INITIAL];
 if(savedState&&savedState.panelRotationVersion!==1){
  const legacy=[90,270,180,0,90];
  room4State.angles=R4_PANEL_KEYS.map((key,i)=>room4State[key]?((Number(room4State.angles[i])-legacy[i]+360)%360)/90:R4_INITIAL[i]);
 }
 room4State.angles=room4State.angles.map((v,i)=>Number.isInteger(v)&&v>=0&&v<4?v:R4_INITIAL[i]);room4State.panelRotationVersion=1;
 if(!Array.isArray(room4State.rainbow)||room4State.rainbow.length!==7||room4State.rainbow.slice().sort().join("|")!==R4_RAINBOW.slice().sort().join("|"))room4State.rainbow=[...R4_RAINBOW];
 game.innerHTML=`<main class="room room-four room4-arriving ${room4State.completed?"is-restored":""}" aria-label="第四の部屋"><header class="room-header"><p class="room-label">第四の部屋</p><p class="room-color-status">${room4State.completed?"記憶を取り戻した部屋":"天文展示室"}</p></header><div class="room-stage-wrap"><section class="room-stage room4-stage"><img id="r4Background" class="room4-background-art" alt="" aria-hidden="true"><div class="room4-shared-door" aria-hidden="true"></div>${r4FlowerBoard()}<img id="r4LightOverlay" class="room4-light-overlay" src="images/background/room04/room04_light.webp" alt="" aria-hidden="true"><div id="r4Projection" class="r4-projection"></div><button class="object r4obj r4door" id="r4Door"><span>扉</span></button><button class="object r4obj r4light" id="r4Light"><span>ライト</span></button><button class="object r4obj r4stand" id="r4Stand"><span>パネル台</span></button><button class="object r4obj r4const" id="r4Const"><span>星座一覧</span></button><button class="object r4obj r4flowers" id="r4Flowers"><span>12星座の花</span></button><button class="object r4obj r4moon" id="r4Moon"><span>世界の月の見立て</span></button><button class="object r4obj r4meteor" id="r4Meteor"><span>流れ星</span></button><button class="object r4obj r4p1" id="r4P1"><span>謎1</span></button><button class="object r4obj r4p2" id="r4P2"><span>謎2</span></button><button class="object r4obj r4p3" id="r4P3"><span>謎3</span></button><button class="object r4obj r4wall" id="r4Wall" ${room4State.wall?"disabled":""}><span>壁の透明板</span></button><button class="object r4obj r4box" id="r4Box"><span>質問箱</span></button><button class="object r4obj r4hana" id="r4Hana"><i class="r4-hana-look-pose" aria-hidden="true"></i><span>ハナ</span></button></section></div><nav class="room-navigation"><button id="r4TurnLeft" class="nav-arrow" aria-label="左を向く">◀</button><button id="r4TurnRight" class="nav-arrow" aria-label="右を向く">▶</button></nav></main>`;
 [["r4Door",r4Door],["r4Light",r4Light],["r4Stand",r4Stand],["r4Const",r4Const],["r4Flowers",r4FlowerNotice],["r4Moon",r4Moon],["r4Meteor",r4Meteor],["r4P1",r4P1],["r4P2",r4P2],["r4P3",r4P3],["r4Wall",r4Wall],["r4Box",r4Box],["r4Hana",r4Hana]].forEach(([id,fn])=>document.getElementById(id).addEventListener("click",fn));
 document.getElementById("r4TurnLeft").onclick=()=>turnFourthRoom(-1);
 document.getElementById("r4TurnRight").onclick=()=>turnFourthRoom(1);
 renderFourthRoomView();r4Projection();
 if(savedState){showRoomNotice("続きから再開しました。","r4resume","narration");if(room4State.nextRoomTransitionSeen)setTimeout(r4NextPlaceholder,150);else if(room4State.completed&&!room4State.memorySeen)setTimeout(r4Memory,150)}else showRoomDialog(room4IntroLines,()=>r4SetHanaLookUp(false),(line)=>{
  // Match the existing narration: Hana looks up from r4i06 to r4i09.
  // expandScenario adds _01/_02 suffixes; compare the original introduction beat.
  r4SetHanaLookUp(/^r4i0[6-9](?:_\d+)?$/.test(line.logId||""));
 });
 if(window.GameplayUI)GameplayUI.installRoom({sceneId:"room04",title:"第四の部屋",objective:()=>room4State.completed?"次の部屋へ進む":r4All()?"5枚のパネルの向きを合わせる":"5枚のガラスパネルを集める",onCompanion:r4Hana,getHighlights:()=>!!room4State.highlightEnabled,setHighlights:v=>{room4State.highlightEnabled=!!v;saveGame()}});
 r4ObserveHanaGazePose();
 saveGame();
}
function r4ObserveHanaGazePose(){
 const stage=game.querySelector(".room-four .room-stage-wrap");
 if(!stage||typeof ResizeObserver==="undefined")return;
 // The shared room UI can resize this container after the first pose is shown,
 // without firing window.resize. Keep both poses aligned as that layout settles.
 const observer=new ResizeObserver(()=>{
  if(!stage.isConnected){
   observer.disconnect();
   if(r4HanaGazeObserver===observer)r4HanaGazeObserver=null;
   return;
  }
  r4SyncHanaGazePose();
 });
 r4HanaGazeObserver=observer;
 observer.observe(stage);
}
function r4SyncHanaGazePose(){
 const hana=game.querySelector(".room4-stage #r4Hana"),pose=hana?.querySelector(".r4-hana-look-pose");
 if(!pose)return;
 // WebKit resolves container units differently for children and pseudo-elements.
 // Match the rendered idle sprite, including its foot anchor, in either engine.
 const idle=getComputedStyle(hana,"::before"),height=parseFloat(idle.height);
 if(!Number.isFinite(height)||height<=0)return;
 pose.style.width=idle.width;
 pose.style.height=idle.height;
 pose.style.bottom=idle.bottom;
 pose.style.backgroundSize='contain';
}
window.addEventListener("resize",r4SyncHanaGazePose);
function r4SetHanaLookUp(active){
 r4SyncHanaGazePose();
 game.querySelector(".room4-stage #r4Hana")?.classList.toggle("is-looking-up",!!active);
}
// View is presentation-only; existing puzzle rules and dialogue remain unchanged.
const ROOM4_VIEWS=["front","right","back","left"];
function renderFourthRoomView(){
 const view=ROOM4_VIEWS.includes(room4State.view)?room4State.view:"front";
 room4State.view=view;const stage=game.querySelector(".room4-stage");if(!stage)return;
 stage.dataset.view=view;
 document.getElementById("r4Background").src=`images/background/room04/room04_${view}.webp`;
 const targets={front:["r4Door","r4Wall","r4Box","r4Hana"],right:["r4Const","r4Flowers","r4P1"],back:["r4Meteor","r4Moon","r4P2","r4P3"],left:["r4Light","r4Stand"]};
 for(const b of stage.querySelectorAll(".r4obj")){b.hidden=!targets[view].includes(b.id);b.setAttribute("aria-label",b.querySelector("span").textContent);}
 window.RoomExploration?.mount('room04',stage,view,room4State,{image:`images/background/room04/room04_${view}.webp`,imageAspect:16/9});
}
function turnFourthRoom(step){
 if(currentScene!=="room04"||game.querySelector(".room-dialog-overlay,.device-overlay,.design-overlay,.inspection-overlay"))return;
 const index=ROOM4_VIEWS.includes(room4State.view)?ROOM4_VIEWS.indexOf(room4State.view):0;
 room4State.view=ROOM4_VIEWS[(index+step+4)%4];renderFourthRoomView();saveGame();
}
function r4Moon(){showRoomDialog([{logId:"r4_moon_exhibit",logType:"investigation",speaker:"ト書き",text:"月の模様の展示：国旗と英語国名 POLAND / SPAIN / BELGIUM / THAILAND / ITALY など。見え方には地域・時代・伝承によって諸説があります。"}])}
function r4Door(){
 if(room4State.completed&&room4State.memorySeen){showRoomDialog([{logId:"r4open1",logType:"investigation",speaker:"ト書き",text:"扉の鍵は開いている。"},{logId:"r4open2",logType:"narration",speaker:"主人公",thought:true,text:"先へ行けば、名前のことも思い出せるかもしれない。"}],r4Exit);return}
 if(room4State.door){showRoomNotice("『散らばる星を重ね、夜空にひとつの姿を描け。』","r4drepeat","investigation");return}
 showRoomDialog(room4DoorLines,()=>{room4State.door=true;saveGame()});
}
function r4Light(){
 if(room4State.completed){showRoomNotice("おとめ座は完成している。","r4light_completed","investigation");return}
 const firstLight=!room4State.lightOn;if(firstLight){room4State.lightOn=true;saveGame()}r4Projection();
 if(r4Count()===0){if(!firstLight){showRoomNotice("ライトは点いているが、まだ星は映らない。","r4light_repeat","investigation");return}showRoomDialog([{logId:"r4le1",logType:"investigation",speaker:"ト書き",text:"スイッチを入れる。ライトが点灯し、左の壁を照らした。ただ、壁が明るく照らされただけだ。"},{logId:"r4le2",logType:"dialogue",speaker:"主人公",text:"これだけじゃ、何も起きないみたいだな"}]);return}
 if(!r4All()){showRoomNotice("集めたパネルを通して星が映ったが、まだパネルが足りない。","r4partial");return}
 if(!r4Correct()){showRoomDialog([{logId:"r4lw1",logType:"investigation",speaker:"ト書き",text:"ライトの光がパネルを通り、左の壁にいくつもの星が映し出される。"},{logId:"r4lw2",logType:"dialogue",speaker:"主人公",text:"……星は映ったけど。これじゃ、まだ何の形か分からないな"},{logId:"r4lw3",logType:"dialogue",speaker:"主人公",text:"パネルの向きが違うのかもしれない"}]);return}
 r4Complete();
}
function r4Projection(){const p=document.getElementById("r4Projection");if(!p)return;document.getElementById("r4LightOverlay").hidden=!room4State.lightOn;p.className="r4-projection"+(room4State.lightOn?" on":"")+(room4State.completed?" complete":"");p.innerHTML=room4State.lightOn?Array.from({length:r4Count()*3},(_,i)=>`<i style="--x:${10+(i*31)%78}%;--y:${12+(i*43)%72}%"></i>`).join(""):""}
function r4Stand(){
 if(game.querySelector(".device-overlay,.room-dialog-overlay,.design-overlay,.inspection-overlay"))return;
 if(room4State.completed){showRoomNotice("星座は完成している。","r4stand_complete","investigation");return}
 if(!r4All()){if(room4State.standInspected){showRoomNotice(`今は、${r4Count()}枚のガラスパネルを持っている。`,"r4stand_repeat","investigation");return}room4State.standInspected=true;saveGame();showRoomDialog([{logId:"r4s1",logType:"investigation",speaker:"ト書き",text:"ライトの前に、透明な板を差し込めそうな枠が並んでいる。数えてみると、全部で五つある。"},{logId:"r4s2",logType:"dialogue",speaker:"主人公",text:"……五枚分ってことか"},{logId:"r4s3",logType:"investigation",speaker:"ト書き",text:`今は、${r4Count()}枚のガラスパネルを持っている。`}]);return}
 const o=document.createElement("div");o.className="device-overlay r4-panel-overlay";o.innerHTML=`<section class="r4-panel-ui" aria-label="ガラスパネルの操作"><button class="device-close" aria-label="閉じる">×</button><div class="r4-panel-stack" role="img" aria-label="現在の向きで5枚を重ねた星の配置"></div><div class="r4-panels"></div><p class="r4-feedback" role="status" aria-live="polite"></p><button class="r4-shine">ライトを当てる</button></section>`;game.appendChild(o);
 const grid=o.querySelector(".r4-panels"),fb=o.querySelector(".r4-feedback"),close=activateDeviceModal(o,"r4Stand",o.querySelector(".device-close"));
 grid.innerHTML=room4State.angles.map((a,i)=>`<article><div class="r4-glass"><img src="images/exhibits/room04/virgo-panels/virgo-panel-${String(i+1).padStart(2,"0")}.svg" alt="ガラスパネル${i+1}の星" draggable="false" style="transform:rotate(${a*90}deg)"></div><button data-i="${i}" aria-label="パネル${i+1}を右に90度回す">↻</button></article>`).join("");
 const stack=o.querySelector(".r4-panel-stack");
 stack.innerHTML=room4State.angles.map((a,i)=>`<img src="images/exhibits/room04/virgo-panels/virgo-panel-${String(i+1).padStart(2,"0")}.svg" alt="" aria-hidden="true" draggable="false" style="transform:rotate(${a*90}deg)">`).join("");
 grid.querySelectorAll("[data-i]").forEach(b=>b.onclick=()=>{if(room4State.completed)return;const i=Number(b.dataset.i);if(!Number.isInteger(i)||i<0||i>=room4State.angles.length)return;room4State.angles[i]=(room4State.angles[i]+1)%4;const degrees=room4State.angles[i]*90;grid.querySelectorAll(".r4-glass img")[i].style.transform=`rotate(${degrees}deg)`;stack.children[i].style.transform=`rotate(${degrees}deg)`;fb.textContent="";saveGame()});
 o.querySelector(".r4-shine").onclick=()=>{if(room4State.completed)return;if(!room4State.lightOn){room4State.lightOn=true;saveGame()}r4Projection();if(r4Correct()){close();r4Complete()}else fb.textContent="星は映ったが、まだ何の形か分からない。"};
}
function r4Const(){showRoomDialog([{logId:"r4c1",logType:"investigation",speaker:"ト書き",text:"12星座の名前と、星の位置を示す図が並んでいる。"},{logId:"r4_final_zodiac_flowers",logType:"investigation",speaker:"ト書き",text:"隣には、12星座それぞれにまつわる花を紹介する展示も並んでいる。"},{logId:"r4c2",logType:"dialogue",speaker:"主人公",text:"これを見れば、星の形から星座を調べられそうだ"}],r4OpenZodiacExhibit)}
function r4Meteor(){showRoomDialog([{logId:"r4m1",logType:"investigation",speaker:"ト書き",text:"流れ星についての展示だ。流れ星は、宇宙空間の小さなちりや岩石が大気に飛び込み、高温になって光って見える現象らしい。地球が彗星の残したちりの中を通ると、流星群が見られることもある。"},{logId:"r4m2",logType:"dialogue",speaker:"主人公",text:"こんな小さいものが、あんなに明るく見えるんだな"}])}
function r4WordPuzzle(kind){
 if(game.querySelector(".device-overlay,.room-dialog-overlay,.design-overlay,.inspection-overlay"))return;
 const solved=kind==="STAR"?room4State.star:room4State.lightPuzzle;if(solved){showRoomNotice("この謎は解き終えている。","r4done"+kind);return}
 const o=document.createElement("div");o.className="device-overlay r4-mini-overlay";
 const body=kind==="STAR"?`<div class="r4-digits"><b class="silver">1</b><b class="white">4</b><b class="black">3</b><b class="green">2</b></div>`:`<div class="r4-flags"><span>⬜⬜⬜<br>🟥🟥🟥　<b>3</b></span><span>🟥<br>🟨🟨🟨<br>🟥　<b>4</b></span><span>⬛⬛｜🟨🟨🟨｜🟥🟥　<b>4</b></span><span>🟥<br>⬜<br>🟦🟦🟦🟦<br>⬜<br>🟥　<b>2</b></span><span>🟩🟩｜⬜｜🟥🟥　<b>2</b></span></div><p class="r4-moon">月の模様の展示：国旗と英語国名 POLAND / SPAIN / BELGIUM / THAILAND / ITALY など。見え方には地域・時代・伝承によって諸説があります。</p>`;
 o.innerHTML=`<section class="r4-mini"><button class="device-close">×</button><h2>謎 ${kind==="STAR"?"1":"2"}</h2>${body}<label>答え<input autocomplete="off"></label><button class="r4-answer">答える</button><p class="r4-feedback"></p></section>`;game.appendChild(o);const input=o.querySelector("input"),fb=o.querySelector(".r4-feedback"),close=activateDeviceModal(o,kind==="STAR"?"r4P1":"r4P2",input);
 input.addEventListener("input",()=>{fb.textContent=""});
 input.addEventListener("keydown",event=>{if(event.key==="Enter"&&!event.isComposing&&!event.repeat){event.preventDefault();o.querySelector(".r4-answer").click()}});
 o.querySelector(".r4-answer").onclick=()=>{const answer=input.value.normalize("NFKC").trim().toUpperCase();if(!answer){fb.textContent="答えを入力してください。";return}if(answer!==kind){fb.textContent=kind==="STAR"?"色の英語名と数字を使えそうだ。":"色の並びを国旗として見て、英語国名から数字の位置を読もう。";return}if(kind==="STAR")room4State.star=true;else room4State.lightPuzzle=true;saveGame();close();showRoomDialog([{logId:"r4"+kind+"ok1",logType:"dialogue",speaker:"主人公",text:`${kind}……${kind==="STAR"?"星":"光"}、か`},{logId:"r4"+kind+"ok2",logType:"investigation",speaker:"ト書き",text:"カチッ――展示ケースのロックが外れた。中から透明なパネルを取り出す。"},{logId:"r4"+kind+"ok3",logType:"narration",speaker:"システム",text:"【ガラスパネルを入手】"}],r4Refresh)};
}
function r4P1(){r4WordPuzzle("STAR")} function r4P2(){r4WordPuzzle("LIGHT")}
function r4P3(){
 if(game.querySelector(".device-overlay,.room-dialog-overlay,.design-overlay,.inspection-overlay"))return;
 if(room4State.meteors){showRoomNotice("謎3は解き終えている。","r4p3done");return}
 const o=document.createElement("div");o.className="device-overlay r4-mini-overlay r4-plate-overlay";
 o.innerHTML='<section class="r4-mini r4-plate-exhibit" aria-label="七色のプレート">'+
  '<button type="button" class="device-close" aria-label="戻る">×</button>'+
  '<div class="r4-plate-exhibit-header" aria-hidden="true"><span class="r4-plate-emblem">✧</span><h2>七色のプレート</h2><span class="r4-plate-emblem">✧</span></div>'+
  '<div class="r4-plate-rail" aria-label="七枚のプレートを並べ替える"><div class="r4-rainbow" role="group" aria-label="七色のプレート"></div></div>'+
  '<p class="r4-plate-status" role="status" aria-live="polite"></p>'+
  '</section>';
 game.appendChild(o);
 const list=o.querySelector(".r4-rainbow"),status=o.querySelector(".r4-plate-status");
 const close=activateDeviceModal(o,"r4P3",o.querySelector(".device-close"));
 const colors={
  "赤":"#ac4544","橙":"#b8773d","黄":"#dcc46f","緑":"#568d72",
  "青":"#507aaf","藍":"#505785","紫":"#8a638d"
 };
 let chosen=null,drag=null,suppressClick=false;
 const complete=()=>{
  if(room4State.rainbow.map(v=>v.slice(-1)).join("")!=="METEORS")return false;
  room4State.meteors=true;saveGame();close();
  showRoomDialog([{logId:"r4p3ok1",logType:"dialogue",speaker:"主人公",text:"METEORS……流れ星、か"},{logId:"r4p3ok2",logType:"investigation",speaker:"ト書き",text:"カチッ――展示ケースの中から透明なパネルを取り出す。"},{logId:"r4p3ok3",logType:"narration",speaker:"システム",text:"【ガラスパネルを入手】"}],r4Refresh);
  return true;
 };
 const move=(from,to)=>{
  if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<0||from>=7||to>=7||from===to)return;
  const [plate]=room4State.rainbow.splice(from,1);
  room4State.rainbow.splice(to,0,plate);
  chosen=null;saveGame();
  if(!complete())draw();
 };
 const draw=()=>{
  list.replaceChildren();
  room4State.rainbow.forEach((value,i)=>{
   const button=document.createElement("button");button.type="button";
   button.className="r4-rainbow-plate"+(chosen===i?" is-selected":"");
   button.dataset.index=String(i);
   const color=value.slice(0,-1),letter=value.slice(-1);
   button.style.setProperty("--plate-color",colors[color]||"#7a7976");
   button.setAttribute("aria-label",color+"のプレート "+letter+(chosen===i?"、選択中":""));
   button.setAttribute("aria-pressed",String(chosen===i));
   const tile=document.createElement("span");tile.className="r4-rainbow-face";
   const mark=document.createElement("b");mark.className="r4-rainbow-letter";mark.textContent=letter;
   const colorMark=document.createElement("small");colorMark.className="r4-rainbow-color";colorMark.textContent=color;
   tile.append(mark,colorMark);button.append(tile);
   button.addEventListener("click",()=>{
    if(room4State.meteors||suppressClick)return;
    if(chosen===null){chosen=i;status.textContent="";draw()}
    else if(chosen===i){chosen=null;status.textContent="";draw()}
    else move(chosen,i);
   });
   button.addEventListener("pointerdown",event=>{
    if(event.button!==0||room4State.meteors)return;
    drag={index:i,id:event.pointerId,x:event.clientX,y:event.clientY,moved:false};
    button.setPointerCapture?.(event.pointerId);
   });
   button.addEventListener("pointermove",event=>{
    if(!drag||drag.id!==event.pointerId)return;
    if(Math.hypot(event.clientX-drag.x,event.clientY-drag.y)>8)drag.moved=true;
    if(drag.moved){
     button.classList.add("is-dragging");
     button.style.setProperty("--drag-x",(event.clientX-drag.x)+"px");
     button.style.setProperty("--drag-y",(event.clientY-drag.y)+"px");
    }
   });
   button.addEventListener("pointerup",event=>{
    if(!drag||drag.id!==event.pointerId)return;
    const moved=drag.moved||Math.hypot(event.clientX-drag.x,event.clientY-drag.y)>8;
    const origin=drag.index;drag=null;
    button.classList.remove("is-dragging");
    if(!moved)return;
    // A drag is one action, never a second tap. Also works with touch pointers.
    suppressClick=true;
    event.preventDefault();
    const destination=document.elementFromPoint(event.clientX,event.clientY)?.closest(".r4-rainbow-plate");
    if(destination&&list.contains(destination))move(origin,Number(destination.dataset.index));
    window.setTimeout(()=>{suppressClick=false},0);
   });
   button.addEventListener("pointercancel",()=>{drag=null;button.classList.remove("is-dragging")});
   list.append(button);
  });
 };
 // A tap on one plate then another works on touch screens and with the keyboard.
 draw();
}
function r4Wall(){if(room4State.wall){showRoomNotice("壁の透明パネルは取り外してある。","r4wall_done","investigation");return}showRoomDialog([{logId:"r4w1",logType:"dialogue",speaker:"主人公",text:"あれ……これって。もしかして、これもパネルなんじゃ……"},{logId:"r4w2",logType:"investigation",speaker:"ト書き",text:"壁に貼られている透明な板の端に指をかけると、外れた。"},{logId:"r4w3",logType:"narration",speaker:"システム",text:"【ガラスパネルを入手】"}],()=>{room4State.wall=true;saveGame();r4Refresh()})}
function r4Box(){if(room4State.box){showRoomNotice("質問箱の透明パネルは取り外してある。","r4boxdone");return}showRoomDialog([{logId:"r4b1",logType:"investigation",speaker:"ト書き",text:"質問箱を調べる。何気なく眺めていると、一面だけ材質が違う。"},{logId:"r4b2",logType:"dialogue",speaker:"主人公",text:"……あれ？ この部分、さっきのパネルと同じじゃないか？"},{logId:"r4b3",logType:"investigation",speaker:"ト書き",text:"端に手をかけると外せそうだ。箱から透明なパネルを取り外した。"},{logId:"r4b4",logType:"narration",speaker:"システム",text:"【ガラスパネルを入手】"}],()=>{room4State.box=true;saveGame();r4Refresh()})}
function r4Refresh(){const n=document.getElementById("r4Count");if(n)n.textContent=`ガラスパネル ${r4Count()} / 5`;const w=document.getElementById("r4Wall");if(w&&room4State.wall)w.disabled=true;showRoomDialog([{logId:"r4cnt"+r4Count(),logType:"investigation",speaker:"システム",text:r4All()?"5枚のガラスパネルが揃った。ライト前の台を調べよう。":`ガラスパネルを入手した。現在 ${r4Count()} / 5 枚。`}],()=>window.DesignUI?.pickup({id:"glass-"+r4Count(),name:"ガラスパネル",art:"◇",description:"模様のある透明なガラスパネル。"}))}
function r4Hana(){
 if(!room4State.hanaSleepSeen){showRoomDialog([{logId:"r4h1",logType:"dialogue",speaker:"ハナ",text:"ふぁ……"},{logId:"r4h2",logType:"dialogue",speaker:"主人公",text:"眠いんですか？"},{logId:"r4h3",logType:"dialogue",speaker:"ハナ",text:"んー……ちょっと眠いかも"},{logId:"r4h4",logType:"dialogue",speaker:"ハナ",text:"大丈夫。謎、解こっか"}],()=>{room4State.hanaSleepSeen=true;saveGame()});return}
 if(room4State.completed){showRoomDialog([{logId:'r4_hint_done',logType:'dialogue',speaker:'ハナ',text:'星がつながったね。扉の先へ進もう。'}]);return;}
 const topics=[];
 if(!r4All())topics.push({id:'r4_panels',label:'パネルの探し方',steps:['透明なパネルは五枚必要みたい。展示の謎だけでなく、部屋そのものも見てみよう。','三つの小謎でもらえるもののほかに、正面の壁と質問箱を調べてみて。']});
 if(!room4State.star)topics.push({id:'r4_star',label:'謎1：色と数字',steps:['色の名前と、その隣の数字を一緒に使えないかな？','色の名前を英語にして、数字の番目の文字を拾ってみよう。','銀はSILVER。その一文字目はSだよ。同じ方法で、表示された順に四文字を読もう。']});
 if(!room4State.lightPuzzle)topics.push({id:'r4_light',label:'謎2：国旗と数字',steps:['国旗が表す国の名前を考えてみよう。','国名を英語にして、数字の番目の文字を拾ってみて。','ポーランドはPOLAND。その三文字目はLだよ。残りの国も同じように、表示された順に読もう。']});
 if(!room4State.meteors)topics.push({id:'r4_rainbow',label:'謎3：七つの色',steps:['七つの色が一緒に現れる、空の景色を思い浮かべてみて。','虹の色の並びに合わせて、札を並べ直してみよう。','赤・橙・黄・緑・青・藍・紫の順だよ。色に付いた文字も一緒に動かしてね。']});
 if(r4All())topics.push({id:'r4_projection',label:'五枚のパネルの使い方',steps:['左側のパネル台とライトを調べよう。重ねた星を、星座一覧と見比べてみて。','重ねる順番より、それぞれの向きが大事みたい。一枚ずつ回して、星の位置を見てみよう。','星座一覧のおとめ座を手がかりにしてみて。五枚の星が、その形を作る向きを探そう。']});
 PuzzleHints.choose('r4Hana',topics);
}
function r4Complete(){
 if(room4State.completed)return;room4State.completed=true;room4State.lightOn=true;saveGame();r4Projection();game.querySelector(".room-four")?.classList.add("is-restored");const status=game.querySelector(".room-four .room-color-status");if(status)status.textContent="記憶を取り戻した部屋";
 showRoomDialog([{logId:"r4ok1",logType:"investigation",speaker:"ト書き",text:"ライトの光が、五枚のパネルを通り抜ける。左の壁に、いくつもの星が映し出された。今までばらばらだった星が、ひとつの形を描いている。"},{logId:"r4ok2",logType:"dialogue",speaker:"主人公",text:"これ……星座だ"},{logId:"r4ok3",logType:"narration",speaker:"ト書き",text:"右の壁にある星座一覧へ目を向ける。"},{logId:"r4_final_zodiac_flowers_complete",logType:"narration",speaker:"ト書き",text:"星座一覧の隣には、12星座それぞれにまつわる花を紹介する展示が並んでいる。"},{logId:"r4ok4",logType:"dialogue",speaker:"主人公",text:"……おとめ座"},{logId:"r4ok5",logType:"narration",speaker:"ト書き",text:"もう一度、壁を見る。その瞬間――おとめ座を形作る星のひとつが、強く輝き始めた。光は次第に強くなり、辺りを白く染めていく。"},{logId:"r4ok6",logType:"dialogue",speaker:"ハナ",text:"……スピカ"},{logId:"r4ok7",logType:"dialogue",speaker:"主人公",text:"え？"},{logId:"r4ok8",logType:"narration",speaker:"ト書き",text:"ハナの方を振り返ろうとした瞬間、視界がまばゆい光に包まれた。"}],r4Memory);
}
function r4Memory(){if(room4State.memorySeen)return;showRoomDialog([...room4FlashbackLines,...room4AfterMemoryLines],()=>{room4State.memorySeen=true;saveGame();r4Exit()})}
function r4Exit(){
 if(room4State.nextRoomTransitionSeen||game.querySelector(".device-overlay,.room-dialog-overlay,.design-overlay,.inspection-overlay"))return;const o=document.createElement("div");o.className="device-overlay";o.innerHTML=`<section class="menu-panel room-exit-menu"><button class="device-close">×</button><h2>扉の先へ</h2><button id="r4Next">次の部屋へ向かう</button><button id="r4Stay">もう少し部屋を調べる</button></section>`;game.appendChild(o);const close=activateDeviceModal(o,"r4Door",o.querySelector("#r4Next"));o.querySelector("#r4Stay").onclick=close;let moving=false;o.querySelector("#r4Next").onclick=()=>{if(moving||room4State.nextRoomTransitionSeen)return;moving=true;close();showRoomDialog([{logId:"r4x1",logType:"narration",speaker:"ト書き",text:"ドアノブに手をかける。"},{logId:"r4x2",logType:"narration",speaker:"ト書き",text:"扉が開くのを待つことすら、もどかしく感じる。"},{logId:"r4x3",logType:"narration",speaker:"ト書き",text:"扉の向こうへ足を踏み出す。背後から、ハナがついてくる気配がした。"},{logId:"r4x4",logType:"narration",speaker:"ト書き",text:"振り返ることなく、そのまま先へ進んだ。"},{logId:"r4x5",logType:"narration",speaker:"ト書き",text:"視界が、まばゆい光に包まれていく。"}],()=>{room4State.nextRoomTransitionSeen=true;saveGame();r4NextPlaceholder()})};
}
function r4NextPlaceholder(){showFifthRoom(roomStates.room05)}
function showFourthRoomBoundary(){if(room3State){room3State.nextRoomTransitionSeen=true;saveGame()}Dialogue.stop();game.innerHTML=`<div class="room-transition room4-transition"><img src="images/background/room01/room01_door_halfopen.png" alt="次の部屋へ"></div>`;setTimeout(()=>{if(game.querySelector(".room4-transition"))showFourthRoom(roomStates.room04)},1100)}


function r4FlowerNotice(){showRoomDialog([{logId:"r4_final_zodiac_flowers",logType:"investigation",speaker:"ト書き",text:"隣には、12星座それぞれにまつわる花を紹介する展示も並んでいる。"}],r4OpenFlowerExhibit)}


