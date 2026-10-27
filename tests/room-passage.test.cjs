"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");

function travelHarness(){
 const source=read("script.js"),start=source.indexOf("function showRoomTravel("),end=source.indexOf("function showNextRoomBoundary()",start);
 assert(start>=0&&end>start,"Find the shared transition helper");
 let screen=null,activeRoom=null;
 const timers=[],sounds=[];
 const document={
  createElement(tag){
   const node={
    tagName:tag,className:"",isConnected:false,children:[],attributes:{},
    style:{setProperty(key,val){this[key]=val}},
    appendChild(child){this.children.push(child)},
    setAttribute(k,v){this.attributes[k]=v},
    addEventListener(){}
   };
   return node;
  }
 };
 const game={
  replaceChildren(newNode){
   if(screen)screen.isConnected=false;
   screen=newNode;screen.isConnected=true;
  },
  querySelector(selector){return selector===".room"?activeRoom:null}
 };
 const ctx={document,game,GameAudio:{play(name){sounds.push(name)}},Dialogue:{stop(){}},window:{setTimeout(fn,ms){timers.push({fn,ms})}}};
 const travel=vm.runInNewContext(source.slice(start,end)+"\nshowRoomTravel;",ctx);
 return {travel,timers,sounds,game,get screen(){return screen},set room(node){activeRoom=node}};
}

test("A05: the Room 1 door art remains exclusive to the first doorway",()=>{
 const t=travelHarness();
 let called=0;
 t.travel(()=>called++,{label:"第二の部屋",image:"images/background/room01/pixel/room01_door_halfopen.png",duration:1100});
 assert.match(t.screen.className,/room-transition-illustrated/);
 assert.equal(t.screen.children[0].tagName,"img");
 assert.match(t.screen.children[0].src,/room01_door_halfopen\.png$/);
 assert.equal(t.screen.attributes["aria-label"],"第二の部屋");
 assert.deepEqual(t.sounds,["doorOpen"]);
 assert.equal(t.timers[0].ms,1100);
 t.timers[0].fn();
 assert.equal(called,1);
});

test("A05: other passages have no misleading room artwork and preserve destination timing",()=>{
 const t=travelHarness();
 let called=0;
 t.travel(()=>called++,{label:"第四の部屋",tone:"light",duration:650});
 assert.match(t.screen.className,/room-transition-abstract room-transition-light/);
 assert.equal(t.screen.children[0].tagName,"span");
 assert.equal(t.screen.style["--room-passage-ms"],"650ms");
 assert.equal(t.timers[0].ms,650);
 t.room={classList:{values:new Set(),add(v){this.values.add(v)},remove(v){this.values.delete(v)}},addEventListener(){}};
 t.timers[0].fn();
 assert.equal(called,1);
 assert(t.room.classList.values.has("room-entry-fade"),"New room fades in");
});

test("A05: a cancelled or replaced transition cannot change the current room",()=>{
 const t=travelHarness();
 let called=0;
 t.travel(()=>called++);
 t.screen.isConnected=false;
 t.timers[0].fn();
 assert.equal(called,0);
});

test("A05: the existing story gates and critical timing remain connected",()=>{
 const first=read("script.js"),second=read("room3.js"),fourth=read("room4.js"),late=read("late-game.js"),css=read("design-ui.css");
 assert.match(first,/showRoomTravel\(\(\)=>showSecondRoom\(roomStates\.room02\)/);
 assert.match(second,/showRoomTravel\(\(\)=>showThirdRoom\(roomStates\.room03\)/);
 assert.doesNotMatch(second,/room01_door_halfopen\.png/);
 assert.match(fourth,/showRoomTravel\(\(\)=>showFourthRoom\(roomStates\.room04\)/);
 assert.match(fourth,/showRoomTravel\(\(\)=>showFifthRoom\(roomStates\.room05\)/);
 assert.doesNotMatch(fourth,/room01_door_halfopen\.png/);
 assert.match(late,/showRoomTravel\(next,\{label,duration:650\}\)/);
 assert.match(late,/room7State\.completed=true;saveGame\(\);[\s\S]*?showEighthRoom\(roomStates\.room08\);[\s\S]*?game\.classList\.add\("room-entry-from-dark"\)/);
 assert.match(css,/@keyframes roomPassageFade/);
 assert.match(css, /prefers-reduced-motion:reduce/);
});
