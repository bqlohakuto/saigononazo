"use strict";
// H01: stale Room 8 callbacks must never overwrite a newly loaded slot or title.
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const source=fs.readFileSync(path.join(__dirname,"..","late-game.js"),"utf8");

function extract(startToken,endToken){
 const start=source.indexOf(startToken),end=source.indexOf(endToken,start);
 assert.ok(start>=0&&end>start,"Extract the current Room 8 code: "+startToken);
 return source.slice(start,end);
}
function solvedResumeHarness(){
 const timers=[],calls=[];
 const game={
  screen:null,
  querySelector(selector){return selector===".r8-empty"?this.screen:null}
 };
 const sandbox={
  window:{},game,room8State:null,currentScene:"room07",
  Dialogue:{stop(){}},GameAudio:{syncSceneMusic(){}},
  saveGame(){},r8PuzzleRoom(){
   if(game.screen)game.screen.isConnected=false;
   game.screen={isConnected:true};
   calls.push("puzzle");
  },
  r8SolvedDialogue(){calls.push("solved-dialogue")},
  r8AfterSolved(){calls.push("after-solved")},
  r8Epilogue(){calls.push("epilogue")},
  r8EndScreen(){calls.push("end")},
  r8Living(){calls.push("living")},setHud(){},r8Intro(){},
  setTimeout(callback,delay){timers.push({callback,delay});return timers.length}
 };
 vm.runInNewContext(extract("  function normalizeR8(saved){","  // Four approved Room 8 background frames"),sandbox);
 sandbox.window.showEighthRoom({solved:true,finalTalkSeen:false});
 assert.equal(timers.length,1,"A solved save schedules a single continuation");
 assert.equal(timers[0].delay,80,"Preserve the existing 80ms resume delay");
 return {sandbox,game,timers,calls,fire(){timers[0].callback()}};
}
test("H01 Room 8: solved-dialogue resume starts normally",()=>{
 const h=solvedResumeHarness();
 h.fire();
 assert.deepEqual(h.calls,["puzzle","solved-dialogue"]);
});
test("H01 Room 8: pending solved-dialogue cannot interrupt another room",()=>{
 const h=solvedResumeHarness();
 h.sandbox.currentScene="room04";
 h.game.screen.isConnected=false;
 h.fire();
 assert.deepEqual(h.calls,["puzzle"]);
});
test("H01 Room 8: loading another Room 8 slot cancels the old solved-dialogue",()=>{
 const h=solvedResumeHarness();
 h.sandbox.window.showEighthRoom({solved:true,finalTalkSeen:false});
 h.fire();
 assert.deepEqual(h.calls,["puzzle","puzzle"],"Old callback must not affect newly loaded slot");
 h.timers[1].callback();
 assert.deepEqual(h.calls,["puzzle","puzzle","solved-dialogue"],"New slot continues normally");
});

function epilogueHarness(){
 const timers=[],calls=[];
 const game={
  fade:null,
  querySelector(selector){return selector===".r8-epilogue-fade"?this.fade:null}
 };
 Object.defineProperty(game,"innerHTML",{
  set(markup){
   if(game.fade)game.fade.isConnected=false;
   game.fade=markup.includes('class="r8-epilogue-fade"')?{isConnected:true}:null;
  }
 });
 const sandbox={
  game,room8State:{ended:true},currentScene:"room08",
  Dialogue:{stop(){calls.push("stop")}},
  r8Epilogue(){calls.push("epilogue")},
  setTimeout(callback,delay){timers.push({callback,delay});return timers.length}
 };
 vm.runInNewContext(extract("  function r8EpilogueFade(){","  function r8Epilogue(){"),sandbox);
 vm.runInNewContext("r8EpilogueFade()",sandbox);
 assert.equal(timers.length,1);
 assert.equal(timers[0].delay,650,"Preserve the authored 650ms fade");
 return {sandbox,game,timers,calls,fire(){timers[0].callback()}};
}
test("H01 Room 8: completed farewell fades into epilogue",()=>{
 const h=epilogueHarness();h.fire();
 assert.deepEqual(h.calls,["stop","epilogue"]);
});
test("H01 Room 8: old fade cannot open epilogue after returning to title",()=>{
 const h=epilogueHarness();
 h.sandbox.currentScene="title";
 h.game.fade.isConnected=false;
 h.fire();
 assert.deepEqual(h.calls,["stop"]);
});
test("H01 Room 8: old epilogue fade cannot replace another Room 8 save",()=>{
 const h=epilogueHarness();
 h.sandbox.room8State={ended:true};
 h.fire();
 assert.deepEqual(h.calls,["stop"]);
});
