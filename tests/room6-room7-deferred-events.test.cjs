"use strict";
// Issue #25 H01: Room 6/7 animations must not escape their original save slot.
// Extract the live functions, rather than copying their timing logic into tests.
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"..","late-game.js"),"utf8");
function extract(begin,end){
 const first=source.indexOf(begin),last=source.indexOf(end,first);
 assert(first>=0&&last>first,"Found implementation: "+begin);
 return source.slice(first,last);
}
const room6Travel=extract("  function r6Travel(change,arrived,trip){","  function r6Visit(id,fromMap=false){");
const room6Resume=extract("  window.showSixthRoom=function(savedState){","    if(!room6State.introSeen)");
const room7Door=extract("  function r7Door(z){","  function r7LastTransition(){");
const room7Resume=extract("  window.showSeventhRoom=function(savedState){","  function r7Hotspot(id,label,rect){");
const classList=()=>({add(){},remove(){}});

function room6Harness(){
 const timers=[],events=[];
 const space={dataset:{},classList:classList()},full={inert:false};
 const game={
  classList:classList(),appendChild(){},
  querySelector(selector){
   if(selector===".r6-space")return space;
   if(selector===".r6-full")return full;
   return null;
  }
 };
 const context={
  window:{matchMedia:()=>({matches:false})},currentScene:"room06",game,
  GameAudio:{play(){},stop(){},syncSceneMusic(){}},Dialogue:{stop(){}},
  document:{createElement:()=>({classList:classList(),setAttribute(){},appendChild(){},remove(){}})},
  setTimeout(callback,delay){timers.push({callback,delay});return timers.length;},
  requestAnimationFrame(){},
  room6State:{},normalizeR6:state=>({moves:[],board:[],mapComplete:false,memorySeen:false,...state}),
  renderR6(){},saveGame(){},r6Arrival(){events.push("arrival")}
 };
 vm.runInNewContext(
  "var r6Moving=false,r6TravelGeneration=0,r6Flipping=false,r6FlipGeneration=0,r6ExitRevealed=false;\n"+
  room6Travel+"\n"+room6Resume+"}\n",context
 );
 const travel=()=>context.r6Travel(
  ()=>events.push("change"),
  ()=>events.push("arrived"),
  {direction:"right",label:"右の部屋へ",id:"B8"}
 );
 return {context,timers,events,travel};
}
test("H01 Room 6: normal travel preserves the 230ms+330ms movement and arrival",()=>{
 const h=room6Harness();h.travel();
 assert.deepEqual(h.timers.map(t=>t.delay),[230]);
 h.timers[0].callback();
 assert.deepEqual(h.events,["change"]);
 assert.deepEqual(h.timers.map(t=>t.delay),[230,330]);
 h.timers[1].callback();
 assert.deepEqual(h.events,["change","arrived","arrival"]);
});
test("H01 Room 6: switching saves before the first movement timer cancels it",()=>{
 const h=room6Harness();h.travel();
 h.context.window.showSixthRoom({introSeen:true,completed:false});
 h.timers[0].callback();
 assert.deepEqual(h.events,[],"Prior slot cannot move the newly loaded room");
});
test("H01 Room 6: switching saves between the two movement timers cancels arrival",()=>{
 const h=room6Harness();h.travel();h.timers[0].callback();
 h.context.window.showSixthRoom({introSeen:true,completed:false});
 h.timers[1].callback();
 assert.deepEqual(h.events,["change"],"Old callback cannot report arrival in the other slot");
});
test("H01 Room 6: moving to another scene invalidates pending travel",()=>{
 const h=room6Harness();h.travel();h.context.currentScene="room07";
 h.timers[0].callback();
 assert.deepEqual(h.events,[]);
});

function room7Harness(){
 const timers=[],events=[],status={textContent:""};
 const scene={classList:classList(),querySelector:s=>s===".r7-door-feedback"?status:null};
 const context={
  window:{},currentScene:"room07",room7State:{introSeen:true,doorExamined:true,booksSolved:true,completed:false,doorIndex:0},
  r7DoorBusy:false,r7DoorTimer:null,
  R7_DOORS:["寅","卯"],R7_SHORT_MEMORIES:{"寅":[{logId:"r7_mem_tiger_01"}]},
  game:{querySelector:s=>s===".r7-scene"?scene:null},
  setTimeout(callback,delay){const timer={callback,delay,cancelled:false};timers.push(timer);return timers.length;},
  clearTimeout(id){if(timers[id-1])timers[id-1].cancelled=true;},
  r7InspectDoor(){},saveGame(){},
  showRoomDialog(){},renderR7(){},Dialogue:{stop(){}},
  normalizeR7:state=>({...state}),GameAudio:{syncSceneMusic(){}},
  r7PlayShortMemory(){events.push("memory")},
  r7Memory(){events.push("accident")},
  r7Lines(){return []},showEighthRoom(){}
 };
 vm.runInNewContext(
  "var r7DoorBusy=false,r7DoorTimer=null;\n"+room7Door+"\n"+room7Resume,
  context
 );
 return {context,timers,events,open:()=>context.r7Door("寅")};
}
test("H01 Room 7: a normal correct door retains its 1150ms memory handoff",()=>{
 const h=room7Harness();h.open();
 assert.equal(h.context.room7State.doorIndex,1);
 assert.equal(h.context.room7State.shortMemory.zodiac,"寅");
 assert.equal(h.timers.length,1);
 assert.equal(h.timers[0].delay,1150);
 h.timers[0].callback();
 assert.deepEqual(h.events,["memory"]);
});
test("H01 Room 7: loading the pending memory cancels the old door timer",()=>{
 const h=room7Harness();h.open();
 const saved=JSON.parse(JSON.stringify(h.context.room7State));
 h.context.window.showSeventhRoom(saved);
 assert.equal(h.timers[0].cancelled,true);
 assert.deepEqual(h.events,["memory"],"The new slot resumes its saved memory immediately");
 h.timers[0].callback();
 assert.deepEqual(h.events,["memory"],"Old animation cannot launch a duplicate memory");
});
test("H01 Room 7: an old door timer does not advance a different save slot",()=>{
 const h=room7Harness();h.open();
 h.context.room7State={introSeen:true,doorExamined:true,booksSolved:true,completed:false,doorIndex:0};
 h.timers[0].callback();
 assert.deepEqual(h.events,[]);
 assert.equal(h.context.room7State.doorIndex,0);
});
test("H01 Room 7: an old door timer does not resume memory outside Room 7",()=>{
 const h=room7Harness();h.open();h.context.currentScene="room08";
 h.timers[0].callback();
 assert.deepEqual(h.events,[]);
});
