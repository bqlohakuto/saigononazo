"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const read=file=>fs.readFileSync(path.join(__dirname,"..",file),"utf8");

function resumeHarness(room,state){
  const source=read(room===3?"room3.js":"room4.js");
  const marker=room===3?"function showThirdRoom(savedState)":"function showFourthRoom(savedState)";
  const beginning=source.indexOf(marker);
  const start=source.indexOf("if(savedState){",beginning);
  const end=source.indexOf("if(window.GameplayUI)",start);
  assert.ok(beginning>=0&&start>beginning&&end>start, "Extract the real saved-state resume branch");
  const timers=[],calls=[],roomKey="room"+String(room).padStart(2,"0");
  const sandbox={
    savedState:{...state},currentScene:roomKey,
    room3State:room===3?state:undefined,room4State:room===4?state:undefined,
    showRoomNotice(){},showRoomDialog(){},
    showFourthRoomBoundary(){calls.push("transition")},
    playThirdRoomMemory(){calls.push("memory")},
    r4NextPlaceholder(){calls.push("transition")},
    r4Memory(){calls.push("memory")},
    setTimeout(callback,ms){timers.push({callback,ms});return timers.length}
  };
  vm.runInNewContext(source.slice(start,end),sandbox);
  assert.equal(timers.length,1,"A saved pending event schedules exactly one callback");
  assert.equal(timers[0].ms,150);
  return {sandbox,timers,calls,fire(){timers[0].callback()}};
}

for(const room of [3,4]){
  for(const kind of ["transition","memory"]){
    const state=room===3?
      (kind==="transition"?{nextRoomTransitionSeen:true}:{unlocked:true,memorySeen:false}):
      (kind==="transition"?{nextRoomTransitionSeen:true}:{completed:true,memorySeen:false});
    test(`H01 Room ${room}: pending ${kind} resume cannot run after another load or title`,()=>{
      const h=resumeHarness(room,state);
      h.sandbox.currentScene="title";
      h.fire();
      assert.deepEqual(h.calls,[],"No old deferred callback after leaving the room");
      const second=resumeHarness(room,state);
      second.sandbox[room===3?"room3State":"room4State"]={...state};
      second.fire();
      assert.deepEqual(second.calls,[],"Loading another slot of the same room cancels the old callback");
    });
    test(`H01 Room ${room}: pending ${kind} resumes normally in the original scene`,()=>{
      const h=resumeHarness(room,state);
      h.fire();
      assert.deepEqual(h.calls,[kind],"The saved transition or memory remains playable");
    });
  }
}

function openingTransitionHarness(){
  const source=read("script.js");
  const start=source.indexOf("function endOpening(){");
  const end=source.indexOf("\nlet firstRoomState;",start);
  assert.ok(start>=0&&end>start,"Extract the actual opening-to-first-room transition");
  const timers=[],calls=[],microtasks=[];
  const opening={isConnected:true},room={isConnected:true,inert:false};
  const styles=new Set();
  const game={
    querySelector(selector){
      if(selector===".opening")return opening.isConnected?opening:null;
      if(selector===".first-room")return room;
      return null;
    },
    append(){},
    classList:{add(value){styles.add(value)},remove(value){styles.delete(value)}}
  };
  const context={
    currentScene:"opening",game,roomStates:{},
    GameAudio:{stop(name){calls.push("sound:"+name)}},
    Dialogue:{suspend(){},resume(){}},
    setTimeout(callback,delay){timers.push({callback,delay});return timers.length},
    queueMicrotask(callback){microtasks.push(callback)},
    showFirstRoom(){calls.push("first-room");context.currentScene="room01"},
    document:{createElement(){return {setAttribute(){},addEventListener(){},remove(){},className:""}}},
    matchMedia:()=>({matches:false})
  };
  vm.runInNewContext(source.slice(start,end)+"\nendOpening();",context);
  assert.equal(timers[0].delay,1200,"Opening retains its authored transition duration");
  return {context,opening,timers,calls,fire(){timers[0].callback()}};
}

test("H01 opening: cancelled transition cannot overwrite a loaded save of another room",()=>{
  const h=openingTransitionHarness();
  h.context.currentScene="room07";
  h.opening.isConnected=false;
  h.fire();
  assert.equal(h.calls.filter(c=>c==="first-room").length,0,"The old opening callback does not reset the loaded room");
});

test("H01 opening: loading another slot of the opening does not inherit the old transition",()=>{
  const h=openingTransitionHarness();
  h.opening.isConnected=false;
  h.context.roomStates={};
  h.fire();
  assert.equal(h.calls.filter(c=>c==="first-room").length,0,"The prior opening instance cannot finish the new slot");
});

test("H01 opening: normal opening still reaches the first room",()=>{
  const h=openingTransitionHarness();
  h.fire();
  assert.equal(h.calls.filter(c=>c==="first-room").length,1);
  assert.equal(h.context.currentScene,"room01");
  assert.equal(h.timers[1].delay,1600,"The first-room entry fade stays unchanged");
});
