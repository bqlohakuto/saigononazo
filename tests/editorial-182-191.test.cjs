"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {test}=require("node:test");
const code=fs.readFileSync(path.join(__dirname,"..","room4.js"),"utf8");
const chapter=fs.readFileSync(path.join(__dirname,"..","scenario","04_room4.md"),"utf8");
const combined=fs.readFileSync(path.join(__dirname,"..","scenario","FULL_SCENARIO.md"),"utf8");

function sandboxWith(methods,scope={}){
 const sandbox={window:{addEventListener(){}},room4State:{},...scope};
 vm.runInNewContext(code+";"+methods.map(n=>"this.__"+n+"="+n+";").join(""),sandbox);
 return sandbox;
}

function panelHarness(){
 const nodes=Array.from({length:5},(_,i)=>({dataset:{i:String(i)},onclick:null}));
 const imgs=Array.from({length:5},()=>({style:{}}));
 const stack={children:Array.from({length:5},()=>({style:{}})),innerHTML:""};
 const grid={innerHTML:"",querySelectorAll(selector){
  if(selector==="[data-i]")return nodes;
  if(selector===".r4-glass img")return imgs;
  return [];
 }};
 const feedback={textContent:""};
 const shine={onclick:null};
 const overlay={querySelector(selector){
  return {".r4-panels":grid,".r4-feedback":feedback,
    ".r4-panel-stack":stack,".r4-shine":shine,
    ".device-close":{}}[selector];
 }};
 const stage={
  wall:true,box:true,star:true,lightPuzzle:true,meteors:true,
  angles:[2,1,0,3,2],completed:false,lightOn:true
 };
 const projection={className:"",innerHTML:""};
 const lightOverlay={hidden:false};
 let saves=0,dialogs=0,closed=0,notices=0,created=0;
 const s=sandboxWith(["r4Stand"],{
  room4State:stage,
  game:{querySelector(){return null},appendChild(){}},
  document:{
   createElement(){created++;return overlay},
   getElementById(id){
    return id==="r4Projection"?projection:id==="r4LightOverlay"?lightOverlay:null;
   }
  },
  saveGame(){saves++},
  showRoomDialog(){dialogs++},
  showRoomNotice(){notices++},
  activateDeviceModal(){return ()=>closed++}
 });
 s.__r4Stand();
 return {s,stage,nodes,imgs,stack,shine,feedback,metrics:()=>({saves,dialogs,closed,notices,created})};
}

test("No.182: invalid view turns from the front and saves exactly once",()=>{
 const state={view:"unknown"};let saves=0,renders=0;
 const s=sandboxWith(["turnFourthRoom"],{
  room4State:state,currentScene:"room04",
  game:{querySelector(){return null}},
  renderFourthRoomView(){renders++},saveGame(){saves++}
 });
 s.__turnFourthRoom(1);
 assert.equal(state.view,"right");assert.equal(saves,1);assert.equal(renders,1);
});

test("No.183: revisiting the uncompleted door uses a concise notice",()=>{
 const notices=[];let saves=0;
 const s=sandboxWith(["r4Door"],{
  room4State:{door:true,completed:false},
  showRoomNotice(...args){notices.push(args)},
  showRoomDialog(){throw Error("Initial dialogue must not replay")},
  saveGame(){saves++}
 });
 s.__r4Door();
 assert.equal(notices.length,1);
 assert.equal(notices[0][0],"『散らばる星を重ね、夜空にひとつの姿を描け。』");
 assert.equal(saves,0);
});

test("No.184: completed light checks do not replay projection or saving",()=>{
 const notices=[];let saves=0;
 const s=sandboxWith(["r4Light"],{
  room4State:{completed:true,lightOn:true},
  showRoomNotice(t){notices.push(t)},
  r4Projection(){throw Error("Completed light must not redraw")},
  saveGame(){saves++}
 });
 s.__r4Light();
 assert.deepEqual(notices,["おとめ座は完成している。"]);
 assert.equal(saves,0);
});

test("No.185: already removed wall panel responds without duplicate pickup",()=>{
 const notices=[];let dialogues=0,saves=0;
 const s=sandboxWith(["r4Wall"],{
  room4State:{wall:true},
  showRoomNotice(t){notices.push(t)},
  showRoomDialog(){dialogues++},saveGame(){saves++}
 });
 s.__r4Wall();
 assert.deepEqual(notices,["壁の透明パネルは取り外してある。"]);
 assert.equal(dialogues,0);assert.equal(saves,0);
});

test("No.186: invalid panel numbers do not rotate or save",()=>{
 const h=panelHarness();
 const old=h.stage.angles.slice();
 const button=h.nodes[0];
 for(const value of ["-1","5","bad","0.5"]){
  button.dataset.i=value;button.onclick();
 }
 assert.deepEqual(h.stage.angles,old);
 assert.equal(h.metrics().saves,0);
 assert.equal(h.feedback.textContent,"");
});

test("No.187: panel rotation wraps visual degrees to match saved angles",()=>{
 const h=panelHarness();
 const button=h.nodes[0];
 button.onclick();
 assert.equal(h.stage.angles[0],3);
 assert.equal(h.imgs[0].style.transform,"rotate(270deg)");
 button.onclick();
 assert.equal(h.stage.angles[0],0);
 assert.equal(h.imgs[0].style.transform,"rotate(0deg)");
 assert.equal(h.stack.children[0].style.transform,"rotate(0deg)");
 assert.equal(h.metrics().saves,2);
});

test("No.188: stale rotation buttons cannot change completed puzzles",()=>{
 const h=panelHarness(),before=h.stage.angles.slice();
 h.stage.completed=true;
 h.nodes[0].onclick();
 assert.deepEqual(h.stage.angles,before);
 assert.equal(h.metrics().saves,0);
});

test("No.189: stale shine buttons cannot re-run a completed puzzle",()=>{
 const h=panelHarness();
 h.stage.completed=true;
 h.shine.onclick();
 assert.equal(h.metrics().saves,0);
 assert.equal(h.metrics().closed,0);
 assert.equal(h.metrics().dialogs,0);
});

test("No.190: exit choice respects design and inspection overlays",()=>{
 for(const selected of [".design-overlay",".inspection-overlay"]){
  let created=0;
  const s=sandboxWith(["r4Exit"],{
   game:{querySelector(selector){return selector.includes(selected)?{}:null}},
   document:{createElement(){created++;return {}}},
   showRoomDialog(){throw Error("Exit dialogue must not run")}
  });
  s.__r4Exit();
  assert.equal(created,0);
 }
});

test("No.191: repeated next clicks trigger only one exit narration",()=>{
 let created=0,dialogs=0,closed=0;
 const nodes={"#r4Next":{onclick:null},"#r4Stay":{onclick:null},".device-close":{}};
 const o={querySelector(selector){return nodes[selector]??null}};
 const s=sandboxWith(["r4Exit"],{
  room4State:{nextRoomTransitionSeen:false},
  game:{querySelector(){return null},appendChild(){}},
  document:{createElement(){created++;return o}},
  activateDeviceModal(){return ()=>closed++},
  showRoomDialog(){dialogs++},
  saveGame(){throw Error("Transition only saves after dialogue")}
 });
 s.__r4Exit();
 nodes["#r4Next"].onclick();
 nodes["#r4Next"].onclick();
 assert.equal(created,1);
 assert.equal(dialogs,1);
 assert.equal(closed,1);
});

test("No.182-191: chapter and combined manuscript contain all ten adopted notes",()=>{
 for(let n=182;n<=191;n++){
  const marker=`【校閲No.${n}・推奨案 採用】`;
  assert.ok(chapter.includes(marker),`Chapter is missing No.${n}`);
  assert.ok(combined.includes(marker),`Combined manuscript is missing No.${n}`);
 }
});
