"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const room4=fs.readFileSync(path.join(__dirname,"..","room4.js"),"utf8");
const room5=fs.readFileSync(path.join(__dirname,"..","room5.js"),"utf8");
const chapters=["04_room4.md","05_room5.md","FULL_SCENARIO.md"].map(name=>fs.readFileSync(path.join(__dirname,"..","scenario",name),"utf8"));

function runtime(source,sandbox,functions) {
 vm.runInNewContext(source+";"+functions.map(name=>"this.__"+name+"="+name+";").join("")+"this.__setScene=value=>{currentScene=value;};",sandbox);
 return sandbox;
}
function mirrorHarness(){
 let created=0,saves=0,closes=0,stops=0,pending=null,timed=null;
 const dialogues=[],notices=[];
 const touch={onclick:null},classes=[];
 const art={classList:{add(name){classes.push("+"+name)},remove(name){classes.push("-"+name)},toggle(){}}};
 const overlay={querySelector(selector){return selector===".r5-touch"?touch:{}}};
 const state={mirrorCollected:false,mirrorPlaced:false};
 const sandbox={
  currentScene:"room05",room5State:state,window:{},
  game:{querySelector(){return null},appendChild(){}},
  document:{
   createElement(){created++;return overlay},
   getElementById(id){return id==="r5MirrorArt"?art:null},
   querySelector(){return null}
  },
  showRoomDialog(lines,done){dialogues.push(lines);pending=done},
  showRoomNotice(...args){notices.push(args)},
  activateDeviceModal(){return ()=>closes++},
  saveGame(){saves++},
  GameAudio:{stopAll(){stops++}},
  setTimeout(fn){timed=fn}
 };
 runtime(room5,sandbox,["r5InspectMirror"]);
 return {sandbox,state,touch,art,classes,inspect:()=>sandbox.__r5InspectMirror(),
  completeDialogue:()=>pending?.(),finishAnimation:()=>timed?.(),
  metrics:()=>({created,saves,closes,stops,dialogues:dialogues.length,notices:notices.length})};
}
function boardHarness(){
 const calls={created:0,saves:0,disabled:0};
 const feedback={textContent:""};
 const tile={
  onclick:null,onpointerdown:null,onpointermove:null,onpointerup:null,onpointercancel:null,
  pressed:"false",isConnected:false,
  setAttribute(name,val){if(name==="aria-pressed")this.pressed=val},
  setPointerCapture(){},
  classList:{active:false,add(){this.active=true},remove(){this.active=false}}
 };
 const frameElements=[{dataset:{frame:"face"},onclick:null,disabled:false},
  {dataset:{frame:"tail"},onclick:null,disabled:false}];
 const frames={innerHTML:"",querySelectorAll(){return frameElements}};
 const tray={innerHTML:"",querySelector(selector){return selector==="button"?tile:null}};
 const overlay={querySelector(selector){
  return {".r5-frames":frames,".r5-tray":tray,".r5-feedback":feedback,
    ".device-close":{}}[selector]||null;
 }};
 const state={mirrorCollected:true,mirrorPlaced:false};
 const sandbox={
  currentScene:"room05",room5State:state,window:{},
  game:{querySelector(){return null},appendChild(){}},
  document:{createElement(){calls.created++;return overlay},elementFromPoint(){return null}},
  activateDeviceModal(){return ()=>{}},
  saveGame(){calls.saves++},
  setTimeout(){}
 };
 runtime(room5,sandbox,["r5OpenBoard"]);
 sandbox.__r5OpenBoard();
 return {calls,feedback,tile,state,frames,frameElements,sandbox};
}

test("No.192: a started fourth-room exit does not reopen a choice",()=>{
 let created=0;
 const s={room4State:{nextRoomTransitionSeen:true},window:{addEventListener(){}},
  game:{querySelector(){return null}},document:{createElement(){created++;return {}}}};
 runtime(room4,s,["r4Exit"]);s.__r4Exit();
 assert.equal(created,0);
});

test("No.193: malformed array saves do not set the mirror state",()=>{
 const s={};
 runtime(room5,s,["r5NormalizeState"]);
 const fromArray=s.__r5NormalizeState(Object.assign([], {mirrorCollected:true,mirrorPlaced:true}));
 assert.equal(fromArray.mirrorCollected,false);
 assert.equal(fromArray.mirrorPlaced,false);
 const restored=s.__r5NormalizeState({mirrorPlaced:true});
 assert.equal(restored.mirrorCollected,true);
});

test("No.194-195: inspection and design overlays block the mirror and board",()=>{
 for(const selector of [".design-overlay",".inspection-overlay"]){
  const s={room5State:{mirrorCollected:false},currentScene:"room05",game:{
   querySelector(query){return query.includes(selector)?{}:null}
  },document:{createElement(){throw Error("Overlay must not be created")}},
  showRoomDialog(){throw Error("Dialogue must not open")}};
  runtime(room5,s,["r5InspectMirror","r5OpenBoard"]);
  s.__r5InspectMirror();s.__r5OpenBoard();
 }
});

test("No.196: a stale inspection callback cannot open a mirror overlay",()=>{
 const h=mirrorHarness();
 h.inspect();
 h.sandbox.__setScene("room04");
 h.completeDialogue();
 assert.equal(h.metrics().created,0);
 h.sandbox.__setScene("room05");
 h.state.mirrorCollected=true;
 h.completeDialogue();
 assert.equal(h.metrics().created,0);
});

test("No.197: stale touches do not close or collect the mirror",()=>{
 const h=mirrorHarness();h.inspect();h.completeDialogue();
 h.sandbox.__setScene("room04");h.touch.onclick();
 assert.equal(h.metrics().closes,0);
 assert.equal(h.metrics().saves,0);
 h.sandbox.__setScene("room05");h.touch.onclick();
 assert.equal(h.state.mirrorCollected,true);
 assert.equal(h.metrics().closes,1);
 assert.equal(h.metrics().saves,1);
 h.touch.onclick();
 assert.equal(h.metrics().saves,1);
});

test("No.198: the temporary mirror animation is removed on completion",()=>{
 const h=mirrorHarness();h.inspect();h.completeDialogue();h.touch.onclick();
 assert.ok(h.classes.includes("+is-transforming"));
 h.finishAnimation();
 assert.ok(h.classes.includes("-is-transforming"));
 assert.equal(h.metrics().dialogues,2);
});

test("No.199: placing a collected mirror from another scene is ignored",()=>{
 let saves=0;const state={mirrorCollected:true,mirrorPlaced:false};
 const s={room5State:state,currentScene:"room04",saveGame(){saves++}};
 runtime(room5,s,["r5PlaceMirror"]);
 assert.equal(s.__r5PlaceMirror("face"),false);
 assert.equal(saves,0);
 s.__setScene("room05");
 assert.equal(s.__r5PlaceMirror("face"),true);
 assert.equal(state.mirrorPlaced,true);
 assert.equal(saves,1);
});

test("No.200: dropping the tile outside a frame clears selection silently",()=>{
 const h=boardHarness();
 h.tile.onclick();
 assert.equal(h.tile.pressed,"true");
 h.tile.onpointerdown({button:0,pointerId:5,clientX:10,clientY:10});
 h.tile.onpointermove({pointerId:5,clientX:40,clientY:40});
 h.tile.onpointerup({pointerId:5,clientX:40,clientY:40,preventDefault(){}});
 assert.equal(h.tile.pressed,"false");
 assert.equal(h.feedback.textContent,"");
 assert.equal(h.state.mirrorPlaced,false);
 assert.equal(h.calls.saves,0);
});

test("No.201: a different pointer cannot move, finish, or cancel the drag",()=>{
 const h=boardHarness();
 h.tile.onpointerdown({button:0,pointerId:5,clientX:10,clientY:10});
 h.tile.onpointermove({pointerId:6,clientX:50,clientY:50});
 assert.equal(h.tile.classList.active,false);
 h.tile.onpointerup({pointerId:6,clientX:50,clientY:50,preventDefault(){}});
 h.tile.onpointercancel({pointerId:6});
 h.tile.onpointermove({pointerId:5,clientX:50,clientY:50});
 assert.equal(h.tile.classList.active,true);
 h.tile.onpointercancel({pointerId:5});
 assert.equal(h.tile.classList.active,false);
 assert.equal(h.calls.saves,0);
});

test("No.192-201: the two chapter scripts and combined script record ten fixes",()=>{
 for(let n=192;n<=201;n++){
  const marker=`【校閲No.${n}・推奨案 採用】`;
  assert.ok(chapters[n===192?0:1].includes(marker));
  assert.ok(chapters[2].includes(marker));
 }
});
