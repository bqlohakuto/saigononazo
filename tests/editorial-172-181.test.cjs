"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {test}=require("node:test");

const code=fs.readFileSync(path.join(__dirname,"..","room4.js"),"utf8");
const chapter=fs.readFileSync(path.join(__dirname,"..","scenario","04_room4.md"),"utf8");
const combined=fs.readFileSync(path.join(__dirname,"..","scenario","FULL_SCENARIO.md"),"utf8");

function rainbowHarness(initial={},blocked=false){
 let buttons=[];
 const list={
  set innerHTML(value){
   this.markup=value;
   buttons=Array.from({length:7},(_,i)=>[-1,1].map(direction=>({
    dataset:{i:String(i),d:String(direction)},onclick:null
   }))).flat();
  },
  querySelectorAll(){return buttons}
 };
 const overlay={querySelector(selector){
  if(selector===".r4-rainbow")return list;
  return {className:""};
 }};
 const state={meteors:false,rainbow:["青O","赤M","紫S","黄T","藍R","橙E","緑E"],...initial};
 let saves=0,dialogues=0,closed=0,created=0,notices=0;
 const sandbox={
  room4State:state,
  window:{addEventListener(){}},
  game:{querySelector(){return blocked?{}:null},appendChild(){}},
  document:{createElement(){created++;return overlay}},
  showRoomNotice(){notices++},
  showRoomDialog(lines,done){dialogues++},
  activateDeviceModal(){return ()=>closed++},
  saveGame(){saves++}
 };
 vm.runInNewContext(code+";this.__open=r4P3;",sandbox);
 sandbox.__open();
 return {state,list,buttons:()=>buttons,metrics:()=>({saves,dialogues,closed,created,notices})};
}

function simpleStage(){
 const panel={innerHTML:"",className:"",children:[]};
 const glass={style:{}};
 const grid={innerHTML:"",querySelectorAll(selector){return selector===".r4-glass img"?[glass,glass,glass,glass,glass]:[]}};
 const shine={onclick:null},feedback={textContent:""},closeButton={};
 const overlay={querySelector(selector){
  return {
   ".r4-panels":grid,
   ".r4-panel-stack":panel,
   ".r4-feedback":feedback,
   ".r4-shine":shine,
   ".device-close":closeButton
  }[selector];
 }};
 let saves=0,notices=[],dialogs=0,created=0,closed=0;
 const state={
  wall:true,box:true,star:true,lightPuzzle:true,meteors:true,
  angles:[2,1,0,3,2],lightOn:true,completed:false,
  standInspected:false
 };
 const projection={className:"",innerHTML:""},lightOverlay={hidden:true};
 const sandbox={
  room4State:state,
  window:{addEventListener(){}},
  game:{querySelector(){return null},appendChild(){}},
  document:{createElement(){created++;return overlay},getElementById(id){
   return id==="r4Projection"?projection:id==="r4LightOverlay"?lightOverlay:null;
  }},
  saveGame(){saves++},
  showRoomDialog(){dialogs++},
  showRoomNotice(text){notices.push(text)},
  activateDeviceModal(){return ()=>closed++}
 };
 vm.runInNewContext(code+";this.__stand=r4Stand;",sandbox);
 return {state,overlay,shine,run:()=>sandbox.__stand(),
  metrics:()=>({saves,notices,dialogs,created,closed})};
}

function lightHarness(stateOverrides={}){
 const state={wall:false,box:false,star:false,lightPuzzle:false,meteors:false,
  lightOn:false,completed:false,...stateOverrides};
 const projection={className:"",innerHTML:""},lightOverlay={hidden:true};
 const lines=[],notices=[];let saves=0;
 const sandbox={
  room4State:state,
  window:{addEventListener(){}},
  document:{getElementById(id){
   return id==="r4Projection"?projection:id==="r4LightOverlay"?lightOverlay:null;
  }},
  showRoomDialog(dialogues){lines.push(dialogues)},
  showRoomNotice(text){notices.push(text)},
  saveGame(){saves++},
  game:{querySelector(){return null}}
 };
 vm.runInNewContext(code+";this.__light=r4Light;",sandbox);
 return {state,activate:()=>sandbox.__light(),counts:()=>({saves,dialogues:lines.length,notices,projection:projection.className})};
}

test("No.172: rainbow puzzle does not overlap another modal",()=>{
 const h=rainbowHarness({},true);
 assert.equal(h.metrics().created,0);
 assert.equal(h.metrics().notices,0);
});

test("No.173: boundary, invalid direction and nonnumeric moves are ignored",()=>{
 const h=rainbowHarness();
 const old=h.state.rainbow.join(",");
 const first=h.buttons()[0];first.onclick();
 const last=h.buttons().at(-1);last.onclick();
 first.dataset.i="-1";first.onclick();
 first.dataset.i="bad";first.onclick();
 first.dataset.i="3";first.dataset.d="0";first.onclick();
 assert.equal(h.state.rainbow.join(","),old);
 assert.equal(h.metrics().saves,0);
});

test("No.174: a normal rainbow move saves once",()=>{
 const h=rainbowHarness();
 h.buttons()[1].onclick();
 assert.equal(h.metrics().saves,1);
 assert.equal(h.state.meteors,false);
});

test("No.174-175: completing METEORS saves once and stale events do nothing",()=>{
 const h=rainbowHarness({rainbow:["赤M","橙E","黄T","緑E","青O","紫S","藍R"]});
 const final=h.buttons().find(b=>b.dataset.i==="5"&&b.dataset.d==="1");
 final.onclick();
 assert.equal(h.state.rainbow.map(x=>x.slice(-1)).join(""),"METEORS");
 assert.equal(h.state.meteors,true);
 assert.equal(h.metrics().saves,1);
 assert.equal(h.metrics().dialogues,1);
 assert.equal(h.metrics().closed,1);
 final.onclick();
 assert.equal(h.metrics().saves,1);
 assert.equal(h.metrics().dialogues,1);
});

test("No.176: panel stand cannot open while another overlay is present",()=>{
 let made=0;
 const sandbox={
  room4State:{completed:false},
  game:{querySelector(){return {}},appendChild(){}},
  document:{createElement(){made++;return {}}},
  window:{addEventListener(){}},
  showRoomNotice(){throw Error("Stand should not show notice")}
 };
 vm.runInNewContext(code+";this.__stand=r4Stand;",sandbox);
 sandbox.__stand();
 assert.equal(made,0);
});

test("No.177: a completed constellation locks panel rotation",()=>{
 const h=simpleStage();
 h.state.completed=true;
 h.run();
 assert.equal(h.metrics().created,0);
 assert.deepEqual(h.metrics().notices,["星座は完成している。"]);
 assert.deepEqual(h.state.angles,[2,1,0,3,2]);
 assert.equal(h.metrics().saves,0);
});

test("No.178: first incomplete stand inspection is detailed, repeats concise",()=>{
 let saves=0,dialogs=0,notices=[];
 const state={
  wall:false,box:false,star:false,lightPuzzle:false,meteors:false,
  completed:false,standInspected:false
 };
 const sandbox={
  room4State:state,
  game:{querySelector(){return null}},
  window:{addEventListener(){}},
  saveGame(){saves++},
  showRoomDialog(){dialogs++},
  showRoomNotice(text){notices.push(text)}
 };
 vm.runInNewContext(code+";this.__stand=r4Stand;",sandbox);
 sandbox.__stand();
 sandbox.__stand();
 assert.equal(dialogs,1);
 assert.deepEqual(notices,["今は、0枚のガラスパネルを持っている。"]);
 assert.equal(saves,1);
 assert.equal(state.standInspected,true);
});

test("No.179-180: lighting the empty wall saves only once and reuses a short notice",()=>{
 const h=lightHarness();
 h.activate();
 assert.equal(h.counts().saves,1);
 assert.equal(h.counts().dialogues,1);
 h.activate();
 assert.equal(h.counts().saves,1);
 assert.equal(h.counts().dialogues,1);
 assert.deepEqual(h.counts().notices,["ライトは点いているが、まだ星は映らない。"]);
});

test("No.181: repeated shine saves only when the light turns on",()=>{
 const h=simpleStage();
 h.run();
 h.shine.onclick();
 assert.equal(h.metrics().saves,0);
 assert.equal(h.metrics().created,1);
 h.state.lightOn=false;
 h.shine.onclick();
 assert.equal(h.metrics().saves,1);
 assert.equal(h.state.lightOn,true);
});

test("No.172-181: both chapter and combined manuscripts match the changes",()=>{
 for(let no=172;no<=181;no++){
  const marker=`【校閲No.${no}・推奨案 採用】`;
  assert.ok(chapter.includes(marker),`Missing chapter note ${no}`);
  assert.ok(combined.includes(marker),`Missing combined note ${no}`);
 }
});
