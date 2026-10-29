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
