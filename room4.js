const R4_ANGLES=[0,0,0,0,0],R4_INITIAL=[2,1,0,3,2],R4_PANEL_KEYS=["star","lightPuzzle","meteors","wall","box"],R4_RAINBOW=["青O","赤M","紫S","黄T","藍R","橙E","緑E"];
// HIP identifiers from the approved 5 glass-panel SVG partition JSON.
const R4_VIRGO_PANEL_HIPS=[[57380,69427,66249],[60030,71957,63608],[61941,72220],[65474,68520],[69701,63090]];
let r4HanaGazeObserver;
let r4MemoryBridgeTimer=null;
const R4_MEMORY_WHITE_MS=600,R4_MEMORY_DARK_MS=700,R4_MEMORY_REVEAL_MS=380;
function r4CancelMemoryBridge(){
 if(r4MemoryBridgeTimer!==null){clearTimeout(r4MemoryBridgeTimer);r4MemoryBridgeTimer=null}
 game.querySelector(".r4-memory-bridge")?.remove();
}
const R4_FAILED_LIGHT_PREVIEW_MS=1600;
let r4FailedLightTimer=null;
function r4CancelFailedLightOff(){
 if(r4FailedLightTimer!==null){clearTimeout(r4FailedLightTimer);r4FailedLightTimer=null}
}
function r4Illuminate(){
 r4CancelFailedLightOff();
 if(!room4State.lightOn){room4State.lightOn=true;saveGame()}
 r4Projection();
}
function r4ScheduleFailedLightOff(afterOff){
 r4CancelFailedLightOff();
 r4FailedLightTimer=setTimeout(()=>{
  r4FailedLightTimer=null;
  if(currentScene!=="room04"||room4State.completed||!room4State.lightOn)return;
  room4State.lightOn=false;
  r4Projection();
  saveGame();
  if(afterOff)afterOff();
 },R4_FAILED_LIGHT_PREVIEW_MS);
}
function r4Count(){return [room4State.wall,room4State.box,room4State.star,room4State.lightPuzzle,room4State.meteors].filter(Boolean).length}
function r4All(){return r4Count()===5}
function r4Mounted(i){return !!(room4State[R4_PANEL_KEYS[i]]&&room4State.mountedPanels?.[i])}
function r4AllMounted(){return R4_PANEL_KEYS.every((_,i)=>r4Mounted(i))}
function r4Correct(){return r4AllMounted()&&room4State.angles.every((v,i)=>v===R4_ANGLES[i])}
function showFourthRoom(savedState){
 r4CancelMemoryBridge();
 r4CancelFailedLightOff();
 r4HanaGazeObserver?.disconnect();r4HanaGazeObserver=null;
 Dialogue.stop();firstRoomState=undefined;room2State=undefined;room3State=undefined;currentScene="room04";GameAudio.syncSceneMusic?.(currentScene);
 room4State={door:false,wall:false,box:false,star:false,lightPuzzle:false,meteors:false,angles:[...R4_INITIAL],panelRotationVersion:1,rainbow:[...R4_RAINBOW],lightOn:false,lightUsed:false,completed:false,memorySeen:false,nextRoomTransitionSeen:false,hanaSleepSeen:false,standInspected:false,highlightEnabled:true,view:"front",...savedState};
 // A failed projection is transient, including when restoring a legacy lit save.
 if(!room4State.completed)room4State.lightOn=false;
 if(!Array.isArray(room4State.angles)||room4State.angles.length!==5)room4State.angles=[...R4_INITIAL];
 if(savedState&&savedState.panelRotationVersion!==1){
  const legacy=[90,270,180,0,90];
  room4State.angles=R4_PANEL_KEYS.map((key,i)=>room4State[key]?((Number(room4State.angles[i])-legacy[i]+360)%360)/90:R4_INITIAL[i]);
 }
 room4State.angles=room4State.angles.map((v,i)=>Number.isInteger(v)&&v>=0&&v<4?v:R4_INITIAL[i]);room4State.panelRotationVersion=1;
 // Ownership does not put a pane into the apparatus. Completed legacy saves
 // retain their finished constellation; other saves can insert owned panes.
 room4State.mountedPanels=R4_PANEL_KEYS.map((key,i)=>!!room4State[key]&&(!!room4State.completed||!!room4State.mountedPanels?.[i]));
 if(!Array.isArray(room4State.rainbow)||room4State.rainbow.length!==7||room4State.rainbow.slice().sort().join("|")!==R4_RAINBOW.slice().sort().join("|"))room4State.rainbow=[...R4_RAINBOW];
 game.innerHTML=`<main class="room room-four room4-arriving ${room4State.completed?"is-restored":""}" aria-label="第四の部屋"><header class="room-header"><p class="room-label">第四の部屋</p><p class="room-color-status">${room4State.completed?"記憶を取り戻した部屋":"星の展示室"}</p></header><div class="room-stage-wrap"><section class="room-stage room4-stage"><img id="r4Background" class="room4-background-art" alt="" aria-hidden="true"><div class="room4-shared-door" aria-hidden="true"></div>${r4FlowerBoard()}<img id="r4LightOverlay" class="room4-light-overlay" src="images/background/room04/room04_light.webp" alt="" aria-hidden="true"><div id="r4Projection" class="r4-projection"></div><button class="object r4obj r4door" id="r4Door"><span>扉</span></button><button class="object r4obj r4light" id="r4Light"><span>ライト</span></button><button class="object r4obj r4stand" id="r4Stand"><span>パネル台</span></button><button class="object r4obj r4const" id="r4Const"><span>星座一覧</span></button><button class="object r4obj r4flowers" id="r4Flowers"><span>12星座の花</span></button><button class="object r4obj r4moon" id="r4Moon"><span>世界の月の見立て</span></button><button class="object r4obj r4meteor" id="r4Meteor"><span>流れ星</span></button><button class="object r4obj r4p1" id="r4P1"><span>謎1</span></button><button class="object r4obj r4p2" id="r4P2"><span>謎2</span></button><button class="object r4obj r4p3" id="r4P3"><span>謎3</span></button><button class="object r4obj r4wall" id="r4Wall" ${room4State.wall?"disabled":""}><span>壁の透明板</span></button><button class="object r4obj r4box" id="r4Box"><span>質問箱</span></button><button class="object r4obj r4hana" id="r4Hana"><i class="r4-hana-look-pose" aria-hidden="true"></i><span>ハナ</span></button></section></div><nav class="room-navigation"><button id="r4TurnLeft" class="nav-arrow" aria-label="左を向く">◀</button><button id="r4TurnRight" class="nav-arrow" aria-label="右を向く">▶</button></nav></main>`;
 [["r4Door",r4Door],["r4Light",r4Light],["r4Stand",r4Stand],["r4Const",r4Const],["r4Flowers",r4FlowerNotice],["r4Moon",r4Moon],["r4Meteor",r4Meteor],["r4P1",r4P1],["r4P2",r4P2],["r4P3",r4P3],["r4Wall",r4Wall],["r4Box",r4Box],["r4Hana",r4Hana]].forEach(([id,fn])=>document.getElementById(id).addEventListener("click",fn));
 document.getElementById("r4TurnLeft").onclick=()=>turnFourthRoom(-1);
 document.getElementById("r4TurnRight").onclick=()=>turnFourthRoom(1);
 renderFourthRoomView();r4Projection();
 if(savedState){
  showRoomNotice("続きから再開しました。","r4resume","narration");
  // Ignore callbacks scheduled for a prior load if the scene or state changed.
  const resumedState=room4State;
  const stillResuming=()=>currentScene==="room04"&&room4State===resumedState;
  if(room4State.nextRoomTransitionSeen)setTimeout(()=>{if(stillResuming())r4NextPlaceholder()},150);
  else if(room4State.completed&&!room4State.memorySeen)setTimeout(()=>{if(stillResuming())r4Memory()},150);
 }else showRoomDialog(room4IntroLines,()=>r4SetHanaLookUp(false),(line)=>{
  // Match the existing narration: Hana looks up from r4i06 to r4i09.
  // expandScenario adds _01/_02 suffixes; compare the original introduction beat.
  r4SetHanaLookUp(/^r4i0[6-9](?:_\d+)?$/.test(line.logId||""));
 });
 if(window.GameplayUI)GameplayUI.installRoom({sceneId:"room04",title:"第四の部屋",objective:()=>room4State.completed?"次の部屋へ進む":r4All()?"ガラスパネルの向きを合わせる":"部屋を調べる",onCompanion:r4Hana,getHighlights:()=>!!room4State.highlightEnabled,setHighlights:v=>{room4State.highlightEnabled=!!v;saveGame()}});
 r4ObserveHanaGazePose();
 // Initialize immediately and once after first layout; ResizeObserver handles
 // later stage size changes without requiring a window resize event.
 r4SyncHanaGazePose();
 window.requestAnimationFrame(()=>{
  if(currentScene==="room04"&&game.querySelector(".room4-stage"))r4SyncHanaGazePose();
 });
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
 const stage=hana?.closest(".room4-stage");
 if(!pose||!stage)return;
 // Sprite sizes are local CSS pixels: the viewport scaler applies the
 // screen scale to the whole game afterwards. A bounding rectangle already
 // includes that scale and would enlarge or shrink Hana a second time.
 // Both idle and gaze receive exactly the same canvas and foot anchor.
 const width=stage.clientWidth;
 if(!Number.isFinite(width)||width<=0)return;
 // At 70% of the former scale, the visible figure is about 90% of the door height.
 // Compensate for the sprite's transparent shoe margin to keep the feet anchored.
 const spriteHeight=width*.2835,footInset=width*.04777734375;
 hana.style.setProperty("--r4-hana-width",(width*.182)+"px");
 hana.style.setProperty("--r4-hana-height",spriteHeight+"px");
 hana.style.setProperty("--r4-hana-bottom",(-footInset)+"px");
 hana.style.setProperty("--r4-hana-head-offset",(spriteHeight-footInset-spriteHeight*112/2048)+"px");
 // Idle and gaze share the four CSS variables declared just above.
 // Never cache the computed size in an inline pose style: early layout
 // updates could otherwise leave the gaze artwork one frame behind.
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
 for(const b of stage.querySelectorAll(".r4obj")){b.hidden=!targets[view].includes(b.id)||(b.id==='r4Wall'&&room4State.wall);b.setAttribute("aria-label",b.querySelector("span").textContent);}
 window.RoomExploration?.mount('room04',stage,view,room4State,{image:`images/background/room04/room04_${view}.webp`,imageAspect:16/9});
}
function turnFourthRoom(step){
 if(currentScene!=="room04"||game.querySelector(".room-dialog-overlay,.device-overlay,.design-overlay,.inspection-overlay"))return;
 const index=ROOM4_VIEWS.includes(room4State.view)?ROOM4_VIEWS.indexOf(room4State.view):0;
 room4State.view=ROOM4_VIEWS[(index+step+4)%4];renderFourthRoomView();saveGame();
}
// Count the entire flag, including coats of arms. Similar shades of each
// heraldic color are combined; the source image and measurement are documented.
// References: Poland (gov.pl), Spain (BOE Ley 39/1981), Belgium (belgium.be),
// Italy (Constitution art. 12), Thailand (ASEAN national flag construction sheet).
const R4_FLAG_COLORS={black:{hex:"#141820",name:"黒"},white:{hex:"#fffdf4",name:"白・銀"},red:{hex:"#d52f45",name:"赤"},yellow:{hex:"#f4ca45",name:"黄・金"},gold:{hex:"#d4af37",name:"金"},green:{hex:"#16855a",name:"緑"},blue:{hex:"#252960",name:"青"},pink:{hex:"#d85aac",name:"ピンク"}};
const R4_FLAG_EXHIBIT=[
 {id:"ITALY",name:"イタリア",axis:"vertical",aspect:1.5,bands:[["green",1],["white",1],["red",1]]},
 {id:"JAPAN",name:"日本",aspect:1.5,shares:[["white",1-Math.PI*.06],["red",Math.PI*.06]]},
 {id:"BELGIUM",name:"ベルギー",axis:"vertical",aspect:15/13,bands:[["black",1],["yellow",1],["red",1]]},
 {id:"POLAND",name:"ポーランド",axis:"horizontal",aspect:1.6,bands:[["white",1],["red",1]]},
 {id:"THAILAND",name:"タイ",axis:"horizontal",aspect:1.5,bands:[["red",1],["white",1],["blue",2],["white",1],["red",1]]},
 {id:"CHINA",name:"中国",flagCrop:[303,461,55,36]},
 {id:"GERMANY",name:"ドイツ",flagLabel:"ドイツの国旗（上から黒・赤・金）",axis:"horizontal",aspect:5/3,bands:[["black",1],["red",1],["gold",1]]},
 {id:"FRANCE",name:"フランス",flagCrop:[546,790,55,37]},
 {id:"UNITED KINGDOM",name:"イギリス",flagCrop:[789,790,55,37]},
 {id:"UNITED STATES",name:"アメリカ",flagCrop:[1034,790,55,37]},
 {id:"INDIA",name:"インド",flagCrop:[1278,790,55,37]},
 {id:"SPAIN",name:"スペイン",aspect:1.5,image:"images/exhibits/room04/flags/spain.svg",shares:[["red",0.520165625496],["yellow",0.45577120888],["white",0.011883840886],["black",0.00850602271],["blue",0.002046386561],["pink",0.001395801423],["green",0.000231114044]]}
];
const R4_LIGHT_CLUES=[{country:"POLAND",position:3},{country:"SPAIN",position:4},{country:"BELGIUM",position:4},{country:"THAILAND",position:2},{country:"ITALY",position:2}];
function r4FlagShares(entry){
 const shares={};
 if(entry.shares)for(const [color,fraction] of entry.shares)shares[color]=fraction;
 else if(entry.bands){const total=entry.bands.reduce((sum,band)=>sum+band[1],0);for(const [color,parts] of entry.bands)shares[color]=(shares[color]||0)+parts/total}
 // One palette order for every clue: no flag stripe order or orientation is retained.
 return Object.keys(R4_FLAG_COLORS).filter(color=>shares[color]>0).map(color=>({color,fraction:shares[color]}));
}
function r4FlagPercent(fraction){return (fraction*100).toFixed(fraction>0&&fraction<.001?2:1).replace(/\.0$/,"")+"%"}
function r4ColorRatioPuzzle(){
 return '<div class="r4-ratio-specimens" role="group" aria-label="五組の色の割合と数字">'+R4_LIGHT_CLUES.map((clue,i)=>{
  const country=R4_FLAG_EXHIBIT.find(entry=>entry.id===clue.country);
  const samples=r4FlagShares(country).map(({color,fraction})=>'<div class="r4-ratio-sample"><i aria-label="'+R4_FLAG_COLORS[color].name+'色" style="--sample-color:'+R4_FLAG_COLORS[color].hex+'"></i><span>'+r4FlagPercent(fraction)+'</span></div>').join('');
  return '<div class="r4-ratio-specimen" role="group" aria-label="'+(i+1)+'組目"><div class="r4-ratio-colors">'+samples+'</div><b class="r4-ratio-digit" aria-label="数字 '+clue.position+'">'+clue.position+'</b></div>';
 }).join('')+'</div>';
}
function r4ReferenceFlag(entry){
 if(entry.flagCrop)return r4MoonAtlasCrop(entry.flagCrop,'r4-reference-flag',entry.id+' flag');
 if(entry.image)return '<img class="r4-reference-flag" src="'+entry.image+'" alt="'+entry.name+'の国旗">';
 const width=160,height=width/entry.aspect;let shapes='';
 if(entry.bands){
  const total=entry.bands.reduce((sum,band)=>sum+band[1],0);let start=0;
  for(const [color,parts] of entry.bands){const fraction=parts/total;shapes+='<rect x="'+(entry.axis==='vertical'?start*width:0)+'" y="'+(entry.axis==='horizontal'?start*height:0)+'" width="'+(entry.axis==='vertical'?fraction*width:width)+'" height="'+(entry.axis==='horizontal'?fraction*height:height)+'" fill="'+R4_FLAG_COLORS[color].hex+'"/>';start+=fraction}
 }else if(entry.id==='JAPAN')shapes='<rect width="160" height="'+height+'" fill="'+R4_FLAG_COLORS.white.hex+'"/><circle cx="80" cy="'+height/2+'" r="'+height*.3+'" fill="'+R4_FLAG_COLORS.red.hex+'"/>';
 else shapes='<rect width="160" height="100" fill="#24699c"/><path d="M50 0h20v100H50zM0 40h160v20H0z" fill="'+R4_FLAG_COLORS.yellow.hex+'"/>';
 return '<svg class="r4-reference-flag" viewBox="0 0 '+width+' '+height+'" role="img" aria-label="'+(entry.flagLabel||entry.name+'の国旗')+'">'+shapes+'</svg>';
}
// Windows into the approved original artwork; no embedded titles or captions.
const R4_MOON_CROPS={ITALY:[1300,302,160,160],JAPAN:[77,302,160,160],BELGIUM:[76,636,160,160],POLAND:[810,302,160,160],THAILAND:[566,302,160,160],CHINA:[321,302,160,160],SPAIN:[1056,302,160,160],GERMANY:[321,636,160,160],FRANCE:[566,636,160,160],"UNITED KINGDOM":[810,636,160,160],"UNITED STATES":[1056,636,160,160],INDIA:[1300,636,160,160]};
// Short descriptions of the interpretations depicted in the accepted source atlas.
const R4_MOON_DESCRIPTIONS={
 ITALY:["カイン","月に薪を背負ったカインの姿を見るという、中世の伝承が残っています。"],
 JAPAN:["餅をつくウサギ","月の模様を、臼で餅をつくウサギの姿に見立てると言われています。"],
 BELGIUM:["カニ","大きなハサミを持つカニの姿に、月の模様を見立てる地域があります。"],
 POLAND:["パン・トファルドフスキ","月にいる人物の顔に見えるという伝承があります。図では帽子をかぶった横顔です。"],
 THAILAND:["月のウサギ","月の模様が、長い耳を持つウサギの姿に見えると言われています。"],
 CHINA:["嫦娥（じょうが）","月に住む美しい女性・嫦娥の姿に、月の模様を見立てることがあります。"],
 SPAIN:["月の人","月の模様を、人の顔に見立てることが多いと言われています。"],
 GERMANY:["シカ","枝分かれした角を持つシカの姿に、月の模様を見立てる地域があります。"],
 FRANCE:["女性の横顔","月の模様を、女性の横顔に見立てることがあります。"],
 "UNITED KINGDOM":["月の紳士","帽子をかぶった男性の横顔に見え、「月の紳士」と呼ばれることもあります。"],
 "UNITED STATES":["本を読む女性","北米の一部では、本を開いている女性の姿に見えると言われます。"],
 INDIA:["犬","月の模様を犬の姿に見立てるという、言い伝えがあります。"]
};
function r4MoonAtlasCrop(rect,className,label){
 return '<svg class="'+className+'" viewBox="'+rect.join(' ')+'" role="img" aria-label="'+label+'"><image href="images/exhibits/room04/moon-views-atlas.webp" width="1536" height="1024"/></svg>';
}
function r4Moon(){
 if(game.querySelector('.device-overlay,.room-dialog-overlay,.design-overlay,.inspection-overlay'))return;
 const overlay=document.createElement('div');overlay.className='device-overlay r4-world-overlay';
 overlay.innerHTML='<section class="r4-world-exhibit" aria-label="World moon views"><header><nav class="r4-moon-pages" aria-label="展示のページ"><button type="button" data-moon-step="-1" aria-label="前のページ">◀</button><output aria-live="polite">1 / 2</output><button type="button" data-moon-step="1" aria-label="次のページ">▶</button></nav><button type="button" class="device-close" aria-label="展示を閉じる">戻る</button></header><div class="r4-world-countries"></div></section>';
 let page=0;
 const render=()=>{
  overlay.querySelector('.r4-world-countries').innerHTML=R4_FLAG_EXHIBIT.slice(page*6,page*6+6).map(entry=>{
   const [title,description]=R4_MOON_DESCRIPTIONS[entry.id];
   return '<article class="r4-world-country">'+r4MoonAtlasCrop(R4_MOON_CROPS[entry.id],'r4-moon-illustration','Moon view in '+entry.id)+'<div class="r4-moon-copy"><div class="r4-moon-caption">'+r4ReferenceFlag(entry)+'<strong lang="en">'+entry.id+'</strong></div><h3>'+title+'</h3><p>'+description+'</p></div></article>';
  }).join('');
  overlay.querySelector('output').textContent=(page+1)+' / 2';
  overlay.querySelector('[data-moon-step="-1"]').disabled=page===0;
  overlay.querySelector('[data-moon-step="1"]').disabled=page===1;
  // A03: page changes must not retain the previous exhibit's scroll position.
  overlay.querySelector('.r4-world-countries').scrollTop=0;
  overlay.querySelector('.r4-world-exhibit').scrollTop=0;
 };
 overlay.querySelectorAll('[data-moon-step]').forEach(button=>button.addEventListener('click',()=>{page+=Number(button.dataset.moonStep);render()}));
 render();
 game.appendChild(overlay);activateDeviceModal(overlay,'r4Moon',overlay.querySelector('.device-close'));
}
function r4Door(){
 if(room4State.completed&&room4State.memorySeen){showRoomDialog([{logId:"r4open1",logType:"investigation",speaker:"ト書き",text:"扉の鍵は開いている。"},{logId:"r4open2",logType:"narration",speaker:"主人公",thought:true,text:"先へ行けば、名前のことも思い出せるかもしれない。"}],r4Exit);return}
 if(room4State.door){showRoomNotice("散らばる星を重ね、夜空にひとつの姿を描け。","r4drepeat","investigation");return}
 showRoomDialog(room4DoorLines,()=>{room4State.door=true;saveGame()});
}
function r4Light(){
 if(room4State.completed){showRoomNotice("おとめ座は完成している。","r4light_completed","investigation");return}
 const firstLight=!room4State.lightUsed;
 room4State.lightUsed=true;
 r4Illuminate();
 if(!R4_PANEL_KEYS.some((_,i)=>r4Mounted(i))){
  r4ScheduleFailedLightOff();
  if(!firstLight){showRoomNotice("ライトは点灯するが、まだ星は映らない。","r4light_repeat","investigation");return}
  showRoomDialog([{logId:"r4le1",logType:"investigation",speaker:"ト書き",text:"スイッチを入れる。ライトが点灯し、左の壁を照らした。ただ、壁が明るく照らされただけだ。"},{logId:"r4le2",logType:"dialogue",speaker:"主人公",text:"これだけじゃ、何も起きないみたいだな"}]);return;
 }
 if(!r4AllMounted()){r4ScheduleFailedLightOff();showRoomNotice("はめたパネルの星が、壁に映っている。まだ空いている枠がある。","r4partial");return}
 if(!r4Correct()){
  globalThis.GameAudio?.play?.("answerIncorrect");
  r4ScheduleFailedLightOff();
  showRoomDialog([{logId:"r4lw1",logType:"investigation",speaker:"ト書き",text:"ライトの光がパネルを通り、左の壁にいくつもの星が映し出される。"},{logId:"r4lw2",logType:"dialogue",speaker:"主人公",text:"……星は映ったけど。これじゃ、まだ何の形か分からないな"},{logId:"r4lw3",logType:"dialogue",speaker:"主人公",text:"パネルの向きが違うのかもしれない"}]);return;
 }
 r4Complete();
}
// The stand and wall share the exact coordinates used by the approved SVG panes.
function r4VirgoLayout(){
 const virgo=R4_ZODIAC.find(item=>item.id==="Vir");
 const panelByHip=new Map(R4_VIRGO_PANEL_HIPS.flatMap((list,i)=>list.map(hip=>[hip,i])));
 return {virgo,stars:virgo.stars.map(star=>({
  hip:star.hip,x:(512+(star.x-150)*2.9)*576/1024,
  y:(512+(star.y-100)*2.9)*576/1024,pane:panelByHip.get(star.hip)
 }))};
}
function r4PanelsLinked(i,j){
 return r4Mounted(i)&&r4Mounted(j)&&
  (room4State.angles[i]-R4_ANGLES[i]+4)%4===(room4State.angles[j]-R4_ANGLES[j]+4)%4;
}
function r4Projection(){
 const p=document.getElementById("r4Projection");if(!p)return;
 document.getElementById("r4LightOverlay").hidden=!room4State.lightOn;
 p.className="r4-projection"+(room4State.lightOn?" on":"")+(room4State.completed?" complete":"");
 p.innerHTML="";
 if(!room4State.lightOn)return;
 const {virgo,stars}=r4VirgoLayout();
 const points=stars.map(star=>{
  const a=room4State.angles[star.pane]*Math.PI/2,x=star.x-288,y=star.y-288;
  return {...star,x:288+x*Math.cos(a)-y*Math.sin(a),y:288+x*Math.sin(a)+y*Math.cos(a)};
 });
 const visible=points.filter(star=>r4Mounted(star.pane));
 if(!visible.length)return;
 const lines=virgo.edges.map(([i,j],edge)=>{
  const a=points[i],b=points[j];
  return r4PanelsLinked(a.pane,b.pane)?'<line data-edge="'+edge+'" x1="'+a.x.toFixed(3)+'" y1="'+a.y.toFixed(3)+'" x2="'+b.x.toFixed(3)+'" y2="'+b.y.toFixed(3)+'"/>':"";
 }).join("");
 const dots=visible.map(star=>'<circle class="r4-projected-star" data-hip="'+star.hip+'" data-pane="'+star.pane+'" cx="'+star.x.toFixed(3)+'" cy="'+star.y.toFixed(3)+'" r="'+(room4State.completed&&star.hip===65474?7:4.4)+'"/>').join("");
 p.innerHTML='<svg class="r4-projected-constellation" viewBox="64 64 448 448" role="img" aria-label="'+(room4State.completed?"おとめ座の投影":"パネルを通して映る星")+'"><g class="r4-projected-lines">'+lines+'</g><g>'+dots+'</g></svg>';
}
function r4Stand(){
 if(game.querySelector(".device-overlay,.room-dialog-overlay,.design-overlay,.inspection-overlay"))return;
 if(room4State.completed){showRoomNotice("星座は完成している。","r4stand_complete","investigation");return}
 room4State.standInspected=true;saveGame();
 const o=document.createElement("div");o.className="device-overlay r4-panel-overlay";
 o.innerHTML='<section class="r4-panel-ui r4-linked-puzzle" aria-label="ガラスパネルの操作">'+
  '<button type="button" class="device-close" aria-label="閉じる">×</button>'+
  '<button type="button" class="r4-panel-stack" aria-label="重なった星の配置" disabled></button>'+
  '<div class="r4-panels" role="group" aria-label="5枚のガラスパネルを回す"></div>'+
  '<p class="r4-feedback" role="status" aria-live="polite"></p>'+
  '<button type="button" class="r4-shine">ライトを当てる</button></section>';
 game.appendChild(o);
 const grid=o.querySelector(".r4-panels"),fb=o.querySelector(".r4-feedback"),stack=o.querySelector(".r4-panel-stack");
 const close=activateDeviceModal(o,"r4Stand",o.querySelector(".device-close"));
 // Persist only 0..3, but use cumulative turns for a clockwise 90-degree CSS transition.
 const turns=[...room4State.angles];
 const paneSource=i=>"images/exhibits/room04/virgo-panels/virgo-panel-"+String(i+1).padStart(2,"0")+".svg";
 grid.innerHTML=turns.map((angle,i)=>{
  const owned=!!room4State[R4_PANEL_KEYS[i]],mounted=r4Mounted(i);
  return '<article><button type="button" class="r4-glass r4-rotate-plate'+(mounted?' is-mounted':'')+'" data-i="'+i+
   '" aria-label="'+(!owned?'空の枠':mounted?'ガラスパネル'+(i+1)+'を右に90度回す':'ガラスパネル'+(i+1)+'をはめる')+'"'+(!owned?' disabled':'')+'>'+
   (owned?'<img src="'+paneSource(i)+'" alt="" aria-hidden="true" draggable="false" style="transform:rotate('+(angle*90)+'deg)">':'')+'</button></article>';
 }).join("");
 stack.innerHTML='<svg class="r4-constellation-lines" viewBox="0 0 576 576" preserveAspectRatio="xMidYMid meet" aria-hidden="true"></svg>'+
  turns.map((angle,i)=>'<img data-pane="'+i+'" src="'+paneSource(i)+'" alt="" aria-hidden="true" draggable="false"'+(!r4Mounted(i)?' hidden':'')+' style="transform:rotate('+(angle*90)+'deg)">').join("");
 const overlay=stack.querySelector(".r4-constellation-lines");
 // Adopted Virgo stars and edges; no changes to the five original images.
 const {virgo,stars}=r4VirgoLayout();
 const relative=i=>(room4State.angles[i]-R4_ANGLES[i]+4)%4;
 const linked=r4PanelsLinked;
 const allLinked=()=>r4AllMounted()&&room4State.angles.every((_,i)=>relative(i)===relative(0));
 const lines=new Map();
 function drawLinks(initial=false){
  for(const [index,[i,j]] of virgo.edges.entries()){
   const a=stars[i],b=stars[j],visible=linked(a.pane,b.pane);
   let line=lines.get(index);
   if(!visible){
    if(line){
     line.classList.remove("is-visible");lines.delete(index);
     window.setTimeout(()=>{if(!line.classList.contains("is-visible"))line.remove()},220);
    }
    continue;
   }
   if(!line){
    line=document.createElementNS("http://www.w3.org/2000/svg","line");
    line.classList.add("r4-constellation-edge");
    line.dataset.edge=String(index);
    line.setAttribute("x1",a.x.toFixed(3));line.setAttribute("y1",a.y.toFixed(3));
    line.setAttribute("x2",b.x.toFixed(3));line.setAttribute("y2",b.y.toFixed(3));
    line.style.transform="rotate("+(turns[a.pane]*90)+"deg)";
    overlay.append(line);lines.set(index,line);
    if(initial)line.classList.add("is-visible");
    else requestAnimationFrame(()=>{if(line.isConnected)line.classList.add("is-visible")});
   }else line.style.transform="rotate("+(turns[a.pane]*90)+"deg)";
  }
  const all=allLinked();
  stack.disabled=!all;stack.classList.toggle("can-turn-all",all);
  stack.setAttribute("aria-label",all?"星座全体を右に90度回す":"重なった星の配置");
 }
 const plateImages=turns.map((_,i)=>grid.querySelector('[data-i="'+i+'"] img'));
 const stackImages=[...stack.querySelectorAll(":scope > img")];
 const rotatePanes=indices=>{
   if(room4State.completed)return;
  for(const i of indices){
   turns[i]++;room4State.angles[i]=(room4State.angles[i]+1)%4;
   const transform="rotate("+(turns[i]*90)+"deg)";
   plateImages[i].style.transform=transform;stackImages[i].style.transform=transform;
  }
  fb.textContent="";drawLinks();r4Projection();saveGame();
 };
 grid.querySelectorAll(".r4-rotate-plate").forEach(button=>button.onclick=()=>{
  const i=Number(button.dataset.i);
  if(!room4State[R4_PANEL_KEYS[i]])return;
  if(!r4Mounted(i)){
   room4State.mountedPanels[i]=true;
   globalThis.GameAudio?.play?.("itemPlace");
   button.classList.add("is-mounted");
   button.setAttribute("aria-label","ガラスパネル"+(i+1)+"を右に90度回す");
   stackImages[i].hidden=false;
   fb.textContent="";drawLinks();r4Projection();saveGame();
  }else rotatePanes([i]);
 });
 stack.onclick=()=>{if(allLinked())rotatePanes([0,1,2,3,4])};
 drawLinks(true);
 o.querySelector(".r4-shine").onclick=()=>{
  if(room4State.completed)return;
  r4Illuminate();
  if(r4Correct()){close();r4Complete();return}
  fb.textContent=!R4_PANEL_KEYS.some((_,i)=>r4Mounted(i))?"壁が明るく照らされている。":!r4AllMounted()?"はめたパネルの星が映っている。まだ空いている枠がある。":allLinked()?"星はつながった。でも、全体の向きが違うようだ。":"星は映ったが、まだ何の形か分からない。";
  r4ScheduleFailedLightOff(()=>{
   if(o.isConnected)fb.textContent+=" ライトが消えた。向きを調整して、もう一度当ててみよう。";
  });
 };
}
function r4Const(){showRoomDialog([{logId:"r4c1",logType:"investigation",speaker:"ト書き",text:"12星座の名前と、星の位置を示す図が並んでいる。"},{logId:"r4_final_zodiac_flowers",logType:"investigation",speaker:"ト書き",text:"隣には、12星座それぞれにまつわる花を紹介する展示も並んでいる。"},{logId:"r4c2",logType:"dialogue",speaker:"主人公",text:"……十二星座が、ひとつずつ載ってるんだな"}],r4OpenZodiacExhibit)}
function r4Meteor(){showRoomDialog([{logId:"r4m1",logType:"investigation",speaker:"ト書き",text:"流れ星についての展示だ。流れ星は、宇宙空間の小さなちりや岩石が大気に飛び込み、高温になって光って見える現象らしい。地球が彗星の残したちりの中を通ると、流星群が見られることもある。"},{logId:"r4m2",logType:"dialogue",speaker:"主人公",text:"こんな小さいものが、あんなに明るく見えるんだな"}])}
function r4WordPuzzle(kind){
 if(game.querySelector(".device-overlay,.room-dialog-overlay,.design-overlay,.inspection-overlay"))return;
 const solved=kind==="STAR"?room4State.star:room4State.lightPuzzle;
 const o=document.createElement("div");o.className="device-overlay r4-mini-overlay";
 const body=kind==="STAR"?`<div class="r4-color-samples" role="group" aria-label="四色の数字の展示"><div class="r4-color-plaque silver" aria-label="銀色、1"><b>1</b></div><div class="r4-color-plaque white" aria-label="白色、4"><b>4</b></div><div class="r4-color-plaque black" aria-label="黒色、3"><b>3</b></div><div class="r4-color-plaque green" aria-label="緑色、2"><b>2</b></div></div>`:r4ColorRatioPuzzle();
 const answerView=solved?'<div class="r4-solved-answer" role="status" aria-label="解答済み"><span>'+kind+'</span></div>':'<label>答え<input autocomplete="off"></label><button class="r4-answer">答える</button><p class="r4-feedback"></p>';
 const exhibitClass=kind==="STAR"?" r4-color-exhibit":" r4-color-exhibit r4-ratio-exhibit";
 o.innerHTML=`<section class="r4-mini ${solved?"r4-mini-inspected":""}${exhibitClass}" aria-label="${kind==="STAR"?"色と数字":"色の割合"}"><button class="device-close" aria-label="閉じる">×</button>${body}${answerView}</section>`;
 game.appendChild(o);
 const input=o.querySelector("input"),fb=o.querySelector(".r4-feedback");
 const close=activateDeviceModal(o,kind==="STAR"?"r4P1":"r4P2",solved?o.querySelector(".device-close"):input);
 // Reinspection is deliberately read-only: no validation, reward, or duplicate log.
 if(solved)return;
 {
  input.placeholder=kind==="STAR"?"・・・・":"・・・・・";input.maxLength=12;input.autocapitalize="characters";
  input.setAttribute("aria-label","英字で答えを入力");
  o.querySelector(".r4-answer").textContent="解錠";
 }
 input.addEventListener("input",()=>{fb.textContent=""});
 input.addEventListener("keydown",event=>{if(event.key==="Enter"&&!event.isComposing&&!event.repeat){event.preventDefault();o.querySelector(".r4-answer").click()}});
 o.querySelector(".r4-answer").onclick=()=>{const answer=input.value.normalize("NFKC").trim().toUpperCase();if(!answer){fb.textContent="答えを入力してください。";return}if(answer!==kind){globalThis.GameAudio?.play?.("answerIncorrect");fb.textContent="鍵は開かない。";return}globalThis.GameAudio?.play?.("answerCorrect");if(kind==="STAR")room4State.star=true;else room4State.lightPuzzle=true;saveGame();close();showRoomDialog([{logId:"r4"+kind+"ok1",logType:"dialogue",speaker:"主人公",text:`${kind}……${kind==="STAR"?"星":"光"}、か`},{logId:"r4"+kind+"ok2",logType:"investigation",speaker:"ト書き",text:"カチッ――展示ケースのロックが外れた。中から透明なパネルを取り出す。"}],()=>r4Refresh(kind==="STAR"?"star":"lightPuzzle"))};
}
function r4P1(){r4WordPuzzle("STAR")} function r4P2(){r4WordPuzzle("LIGHT")}
function r4P3(){
 if(game.querySelector(".device-overlay,.room-dialog-overlay,.design-overlay,.inspection-overlay"))return;
 const solvedOnOpen=!!room4State.meteors;
 const o=document.createElement("div");o.className="device-overlay r4-mini-overlay r4-plate-overlay"+(solvedOnOpen?" is-inspection":"");
 o.innerHTML='<section class="r4-mini r4-plate-exhibit" aria-label="七色のプレート">'+
  '<button type="button" class="device-close" aria-label="戻る">×</button>'+
  '<div class="r4-plate-rail" aria-label="七枚のプレートを並べ替える"><div class="r4-rainbow" role="group" aria-label="七色のプレート"></div></div>'+
  '<p class="r4-plate-status" role="status" aria-live="polite"></p>'+
  '</section>';
 game.appendChild(o);
 const list=o.querySelector(".r4-rainbow"),status=o.querySelector(".r4-plate-status");
 let revealTimer=null,successTimer=null,dialogueStarted=false,earnedThisOpen=false;
 const finishSuccess=()=>{
  if(dialogueStarted||!earnedThisOpen||currentScene!=="room04"||!room4State.meteors)return;
  dialogueStarted=true;
  showRoomDialog([{logId:"r4p3ok1",logType:"dialogue",speaker:"主人公",text:"METEORS……流れ星、か"},{logId:"r4p3ok2",logType:"investigation",speaker:"ト書き",text:"カチッ――展示ケースの中から透明なパネルを取り出す。"}],()=>r4Refresh("meteors"));
 };
 const close=activateDeviceModal(o,"r4P3",o.querySelector(".device-close"),()=>{
  window.clearTimeout(revealTimer);
  window.clearTimeout(successTimer);
  if(earnedThisOpen)finishSuccess();
 });
 const colors={
  "赤":"#ac4544","橙":"#b8773d","黄":"#dcc46f","緑":"#568d72",
  "青":"#507aaf","藍":"#505785","紫":"#8a638d"
 };
 let chosen=null,drag=null,suppressClick=false;
 const complete=()=>{
  if(room4State.rainbow.map(v=>v.slice(-1)).join("")!=="METEORS")return false;
  // Let the player actually see the completed order before revealing it.
  earnedThisOpen=true;
  globalThis.GameAudio?.play?.("answerCorrect");
  room4State.meteors=true;saveGame();draw();
  o.classList.add("is-solved");
  revealTimer=window.setTimeout(()=>{
   if(o.isConnected)o.classList.add("is-revealing");
  },1300);
  successTimer=window.setTimeout(()=>{
   if(o.isConnected)close();
  },4700);
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
   button.dataset.plate=value;
   button.disabled=!!room4State.meteors;
   const color=value.slice(0,-1),letter=value.slice(-1);
   button.style.setProperty("--plate-color",colors[color]||"#7a7976");
   button.setAttribute("aria-label",color+"のプレート "+letter+(chosen===i?"、選択中":""));
   button.setAttribute("aria-pressed",String(chosen===i));
   const tile=document.createElement("span");tile.className="r4-rainbow-face";
   const mark=document.createElement("b");mark.className="r4-rainbow-letter";mark.textContent=letter;
   tile.append(mark);button.append(tile);
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
function r4Wall(){if(room4State.wall){showRoomNotice("壁の透明パネルは取り外してある。","r4wall_done","investigation");return}showRoomDialog([{logId:"r4w1",logType:"dialogue",speaker:"主人公",text:r4Count()===0?"……あれ？　壁に透明な板みたいなものが貼ってある……？":"あれ……これもパネルなんじゃ……？"},{logId:"r4w2",logType:"investigation",speaker:"ト書き",text:"壁に貼られている透明な板の端に指をかけると、外れた。"}],()=>{room4State.wall=true;saveGame();r4Refresh("wall")})}
function r4Box(){if(room4State.box){showRoomNotice("質問箱の透明パネルは取り外してある。","r4boxdone");return}showRoomDialog([{logId:"r4b1",logType:"investigation",speaker:"ト書き",text:"質問箱を調べる。何気なく眺めていると、一面だけ材質が違う。"},{logId:"r4b2",logType:"dialogue",speaker:"主人公",text:"……あれ？ この部分だけ、透明な板になってる……？"},{logId:"r4b3",logType:"investigation",speaker:"ト書き",text:"端に手をかけると外せそうだ。箱から透明なパネルを取り外した。"}],()=>{room4State.box=true;saveGame();r4Refresh("box")})}
function r4Refresh(key){
 const wall=document.getElementById("r4Wall");
 if(wall&&room4State.wall){wall.disabled=true;wall.hidden=true;}
 const index=R4_PANEL_KEYS.indexOf(key);
 if(index<0||!room4State[key])return;
 const number=String(index+1).padStart(2,"0");
 // Each reward shows the approved artwork corresponding to its own glass pane.
 window.DesignUI?.pickup({
  id:"glass-"+key,
  name:"ガラスパネル",
  image:"images/exhibits/room04/virgo-panels/virgo-panel-"+number+".svg",
  imageAlt:"星の模様が描かれた透明なガラスパネル",
  description:"星の模様が描かれている。"
 });
}
function r4Hana(){
 if(!room4State.hanaSleepSeen){showRoomDialog([{logId:"r4h1",logType:"dialogue",speaker:"ハナ",text:"ふぁ……"},{logId:"r4h2",logType:"dialogue",speaker:"主人公",text:"眠いんですか？"},{logId:"r4h3",logType:"dialogue",speaker:"ハナ",text:"んー……ちょっと眠いかも"},{logId:"r4h4",logType:"dialogue",speaker:"ハナ",text:"大丈夫。謎、解こっか"}],()=>{room4State.hanaSleepSeen=true;saveGame()});return}
 if(room4State.completed){showRoomDialog([{logId:'r4_hint_done',logType:'dialogue',speaker:'ハナ',text:'星がつながったね。扉の先へ進もう。'}]);return;}
 const topics=[];
 if(!r4All())topics.push({id:'r4_panels',label:'パネルの探し方',steps:['透明なパネルは五枚必要みたい。見つけたものは、一枚から台にはめられるよ。展示の謎だけでなく、部屋そのものも見てみよう。','三つの小謎でもらえるもののほかに、正面の壁と質問箱を調べてみて。']});
 if(!room4State.star)topics.push({id:'r4_star',label:'謎1：色と数字',steps:['色の名前と、その隣の数字を一緒に使えないかな？','色の名前を英語にして、数字の番目の文字を拾ってみよう。','銀はSILVER。その一文字目はSだよ。同じ方法で、表示された順に四文字を読もう。']});
 if(!room4State.lightPuzzle)topics.push({id:'r4_light',label:'謎2：色の割合',steps:['色の組み合わせと割合が表しているものを、この部屋の展示で探してみよう。','紋章の色も含めて、国旗の同じ色ごとの割合を比べてみよう。展示の国旗と見比べてみて。','国名を英語にして、下の数字の番目の文字を拾おう。白と赤が半分ずつなのは、展示の中ではポーランド。POLANDの三文字目はLだよ。']});
 if(!room4State.meteors)topics.push({id:'r4_rainbow',label:'謎3：七つの色',steps:['七つの色が一緒に現れる、空の景色を思い浮かべてみて。','虹の色の並びに合わせて、札を並べ直してみよう。','赤・橙・黄・緑・青・藍・紫の順だよ。色に付いた文字も一緒に動かしてね。']});
 if(r4All())topics.push({id:'r4_projection',label:'五枚のパネルの使い方',steps:['左側のパネル台に、手元のパネルをはめてみよう。ライトをつけて、映った星を星座一覧と見比べてみて。','重ねる順番より、それぞれの向きが大事みたい。一枚ずつ回して、星の位置を見てみよう。','星座一覧のおとめ座を手がかりにしてみて。五枚の星が、その形を作る向きを探そう。']});
 PuzzleHints.choose('r4Hana',topics);
}
function r4Complete(){
 if(room4State.completed)return;
 r4CancelFailedLightOff();
 room4State.completed=true;room4State.lightOn=true;saveGame();r4Projection();game.querySelector(".room-four")?.classList.add("is-restored");const status=game.querySelector(".room-four .room-color-status");if(status)status.textContent="記憶を取り戻した部屋";
 showRoomDialog([{logId:"r4ok1",logType:"investigation",speaker:"ト書き",text:"ライトの光が、五枚のパネルを通り抜ける。左の壁に、いくつもの星が映し出された。今までばらばらだった星が、ひとつの形を描いている。"},{logId:"r4ok2",logType:"dialogue",speaker:"主人公",text:"これ……星座だ"},{logId:"r4ok3",logType:"narration",speaker:"ト書き",text:"右の壁にある星座一覧へ目を向ける。その隣には、星座にまつわる花の絵が並んでいた。"},{logId:"r4ok4",logType:"dialogue",speaker:"主人公",text:"……おとめ座"},{logId:"r4ok5",logType:"narration",speaker:"ト書き",text:"もう一度、壁を見る。その瞬間――おとめ座を形作る星のひとつが、強く輝き始めた。光は次第に強くなり、辺りを白く染めていく。"},{logId:"r4ok6",logType:"dialogue",speaker:"ハナ",text:"……スピカ"},{logId:"r4ok7",logType:"dialogue",speaker:"主人公",text:"え？"},{logId:"r4ok8",logType:"narration",speaker:"ト書き",text:"ハナの方を振り返ろうとした瞬間、視界がまばゆい光に包まれた。"}],r4Memory);
}
function r4Memory(){
 if(room4State.memorySeen||currentScene!=="room04"||game.querySelector(".r4-memory-bridge"))return;
 const veil=document.createElement("div");
 veil.className="r4-memory-bridge is-white";
 veil.setAttribute("aria-hidden","true");
 game.appendChild(veil);
 // Finish the bright Spica flash, then darken into the real planetarium.
 r4MemoryBridgeTimer=setTimeout(()=>{
  if(currentScene!=="room04"||!veil.isConnected)return;
  veil.classList.replace("is-white","is-dark");
  r4MemoryBridgeTimer=setTimeout(()=>{
   if(currentScene!=="room04"||!veil.isConnected)return;
   const opened=showRoomDialog([...room4FlashbackLines,...room4AfterMemoryLines],()=>{
    room4State.memorySeen=true;saveGame();r4Exit();
   });
   if(!opened){r4CancelMemoryBridge();return}
   // Reveal the first recollection only after its image and dialogue are mounted.
   veil.classList.replace("is-dark","is-revealing");
   r4MemoryBridgeTimer=setTimeout(()=>{
    r4MemoryBridgeTimer=null;
    veil.remove();
   },R4_MEMORY_REVEAL_MS);
  },R4_MEMORY_DARK_MS);
 },R4_MEMORY_WHITE_MS);
}
function r4Exit(){
 if(room4State.nextRoomTransitionSeen||game.querySelector(".device-overlay,.room-dialog-overlay,.design-overlay,.inspection-overlay"))return;const o=document.createElement("div");o.className="device-overlay";o.innerHTML=`<section class="menu-panel room-exit-menu"><button class="device-close">×</button><h2>扉の先へ</h2><button id="r4Next">次の部屋へ向かう</button><button id="r4Stay">もう少し部屋を調べる</button></section>`;game.appendChild(o);const close=activateDeviceModal(o,"r4Door",o.querySelector("#r4Next"));o.querySelector("#r4Stay").onclick=close;let moving=false;o.querySelector("#r4Next").onclick=()=>{if(moving||room4State.nextRoomTransitionSeen)return;moving=true;close();showRoomDialog([{logId:"r4x1",logType:"narration",speaker:"ト書き",text:"ドアノブに手をかける。"},{logId:"r4x2",logType:"narration",speaker:"ト書き",text:"扉が開くのを待つことすら、もどかしく感じる。"},{logId:"r4x3",logType:"narration",speaker:"ト書き",text:"扉の向こうへ足を踏み出す。背後から、ハナがついてくる気配がした。"},{logId:"r4x4",logType:"narration",speaker:"ト書き",text:"振り返ることなく、そのまま先へ進んだ。"},{logId:"r4x5",logType:"narration",speaker:"ト書き",text:"視界が、まばゆい光に包まれていく。"}],()=>{room4State.nextRoomTransitionSeen=true;saveGame();r4NextPlaceholder()})};
}
function r4NextPlaceholder(){
 // The ending narration fades to white; the following room appears gradually.
 showRoomTravel(()=>showFifthRoom(roomStates.room05),{
  label:"第五の部屋へ移動",tone:"light",duration:650
 });
}
function showFourthRoomBoundary(){
 if(room3State){room3State.nextRoomTransitionSeen=true;saveGame()}
 showRoomTravel(()=>showFourthRoom(roomStates.room04),{
  label:"第四の部屋へ移動",tone:"light",duration:1100
 });
}


function r4FlowerNotice(){showRoomDialog([{logId:"r4_final_zodiac_flowers",logType:"investigation",speaker:"ト書き",text:"隣には、12星座それぞれにまつわる花を紹介する展示も並んでいる。"}],r4OpenFlowerExhibit)}



