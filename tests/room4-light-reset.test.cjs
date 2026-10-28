"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const roomSource=fs.readFileSync(path.join(__dirname,"..","room4.js"),"utf8");

function fixture(){
 const timers=new Map();
 let timerId=0,saves=0,renders=0;
 const room4State={
  star:true,lightPuzzle:true,meteors:true,wall:true,box:true,
  angles:[2,1,0,3,2],mountedPanels:[true,true,true,true,true],
  lightOn:false,completed:false
 };
 const ctx={
  room4State,currentScene:"room04",window:{},
  saveGame:()=>{saves++},
  setTimeout:(fn,delay)=>{const id=++timerId;timers.set(id,{fn,delay});return id},
  clearTimeout:id=>timers.delete(id),
  showRoomDialog:()=>{},showRoomNotice:()=>{}
 };
 vm.createContext(ctx);vm.runInContext(roomSource,ctx);
 ctx.r4Projection=()=>{renders++};
 return {
  ctx,room4State,timers,
  get saves(){return saves},
  get renders(){return renders},
  advance(){
   assert.equal(timers.size,1,"Exactly one preview timer is scheduled");
   const [id,timer]=[...timers.entries()][0];
   timers.delete(id);timer.fn();return timer.delay;
  }
 };
}

test("D05: wrong direct light preview turns off without changing angles or mounting",()=>{
 const f=fixture();
 const angles=f.room4State.angles.slice(),mounted=f.room4State.mountedPanels.slice();
 f.ctx.r4Light();
 assert.equal(f.room4State.lightOn,true,"Failure first lights the projection");
 assert.equal(f.timers.size,1);
 assert.equal(f.advance(),1600,"Preview remains visible briefly");
 assert.equal(f.room4State.lightOn,false,"Failure turns the light off");
 assert.deepEqual(f.room4State.angles,angles);
 assert.deepEqual(f.room4State.mountedPanels,mounted);
 assert.ok(f.saves>=2,"Both lit and unlit states are persisted");
 f.ctx.r4Light();
 assert.equal(f.room4State.lightOn,true,"Can retry without reconstructing panes");
 f.advance();
 assert.equal(f.room4State.lightOn,false);
});

test("D05: new attempt cancels the previous preview timeout",()=>{
 const f=fixture();
 f.ctx.r4Illuminate();
 f.ctx.r4ScheduleFailedLightOff();
 const old=[...f.timers.values()][0].fn;
 f.ctx.r4Illuminate();
 assert.equal(f.timers.size,0,"Starting another beam cancels the old timeout");
 f.ctx.r4ScheduleFailedLightOff();
 old();
 assert.equal(f.room4State.lightOn,true,"The cancelled timeout cannot turn off the new preview in real event-loop scheduling");
 f.advance();
 assert.equal(f.room4State.lightOn,false);
});
