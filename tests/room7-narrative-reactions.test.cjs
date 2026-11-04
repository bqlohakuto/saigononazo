"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const src=read("late-game.js");
const range=(start,end)=>{const i=src.indexOf(start),j=src.indexOf(end,i+start.length);assert.ok(i>=0&&j>i,"source range: "+start);return src.slice(i,j);};
const line=(logId,speaker,text,extra={})=>({logId,speaker,text,...extra});
test("Room 7 introduction remembers the previous gratitude and distinguishes inner monologue",()=>{
 const code=range("  const R7_TEXT={","  function r7Objective(){");
 const ctx={line};
 vm.runInNewContext(code+"\nthis.intro=r7Lines('intro');this.hana=r7Lines('hana');",ctx);
 const intro=Array.from(ctx.intro);
 const txt=intro.map(x=>x.text);
 const expected=["……図書室、でしょうか","本がたくさんあるね","……さっきは、ありがとうと言えた","でも、まだ聞けていないことがある","……調べてみましょう","ハナは小さく頷いた。"];
 let at=-1;for(const phrase of expected){const i=txt.indexOf(phrase);assert.ok(i>at,phrase);at=i}
 for(const x of intro.filter(x=>x.speaker==="主人公・心の声"))assert.equal(x.thought,true);
 assert.ok(!intro.some(x=>x.speaker==="主人公"&&/[！!]/.test(x.text)));
 assert.ok(Array.from(ctx.hana).some(x=>x.text.includes("心配してくれてありがとう。")),"preserve existing Hana fatigue dialogue");
});
test("correct shelf arrangement still highlights the pressed-flower bookmark after a modest celebration",()=>{
 const code=range("  function r7BooksGlow(){","  function r7Read(id,playTurn=true){");
 const displayed=[];
 const context={line,game:{querySelector:()=>({classList:{add(){},remove(){}}})},setTimeout(){},showRoomDialog:items=>displayed.push(...items)};
 vm.runInNewContext(code+"\nthis.glow=r7BooksGlow;",context);
 context.glow();
 const ids=displayed.map(x=>x.logId);
 for(const old of ["r7_books_glow_01","r7_books_glow_02","r7_books_glow_03","r7_books_glow_flower","r7_books_glow_04"])assert.ok(ids.includes(old),"stable clue log "+old);
 assert.deepEqual(displayed.filter(x=>x.speaker==="主人公").map(x=>x.text),["……あ、光った","……よし、並びは合ってたみたいですね","……さっきの本も、開けるかもしれない"]);
 assert.ok(displayed.some(x=>x.text.includes("押し花の栞")));
 assert.ok(displayed.some(x=>x.speaker==="ハナ"&&x.text==="……うん、そうみたい"));
 assert.ok(!displayed.some(x=>x.speaker==="主人公"&&/[！!]/.test(x.text)));
});
test("five original short memories are not rewritten and append resumable library-return reactions",()=>{
 const code=range("  const R7_SHORT_MEMORIES={","  let r7DoorBusy=false");
 const ctx={line};
 vm.runInNewContext(code+"\nthis.memories=R7_SHORT_MEMORIES;this.withReturn=r7ShortMemoryWithReturn;",ctx);
 const cases=[
 ["寅","tiger",20,"……こんな約束もしてたんだ"],
 ["卯","rabbit",18,"……あの時、そんな話をしてたな"],
 ["未","sheep",26,"……あのマグカップ、懐かしいな"],
 ["申","monkey",25,"……少しずつ、元に戻っていったんだ"],
 ["亥","boar",28,"……こんなことも、覚えてなかったんだな"]
 ];
 for(const [z,k,n,expected]of cases){
  const base=Array.from(ctx.memories[z]),actual=Array.from(ctx.withReturn(z));
  assert.equal(base.length,n,"keep authored memory length "+z);
  assert.equal(actual.length,n+2);
  assert.deepEqual(actual.slice(0,n).map(x=>({id:x.logId,text:x.text})),base.map(x=>({id:x.logId,text:x.text})));
  assert.equal(actual[n].logId,"r7_return_"+k+"_01");
  assert.equal(actual[n].text,"視界が、図書室に戻る。");
  assert.equal(actual[n+1].logId,"r7_return_"+k+"_02");
  assert.equal(actual[n+1].text,expected);
 }
 const rooster=Array.from(ctx.withReturn("酉"));
 assert.equal(rooster.length,22,"final departure does not return to the library");
 assert.ok(rooster.every(x=>!x.logId.startsWith("r7_return_")));
 assert.ok(src.includes("expandScenario(r7ShortMemoryWithReturn(zodiac))"),"the resumed memory includes return-dialogue IDs");
 assert.ok(src.includes("lines=pending&&r7ShortMemoryWithReturn(pending.zodiac)"),"the displayed memory includes return-dialogue IDs");
 assert.ok(src.includes("if(pending.zodiac==='酉')r7LastTransition();"),"the final scene still advances to the accident");
});
test("Rooster prelude increases suspense without altering the accident flashback",()=>{
 const door=range("  function r7Door(z){","  function r7Memory(){");
 const beats=["r7_last_dial_ready","r7_last_touch","r7_last_resolve","r7_last_01","r7_last_before_memory","r7_last_recognize","r7_last_enter"];
 let prev=-1;for(const id of beats){const i=door.indexOf("line('"+id+"'");assert.ok(i>prev,"last door beat "+id);prev=i}
 assert.ok(door.includes("……これで、最後だ"));
 assert.ok(door.includes("……この景色は……"));
 assert.ok(door.includes("],r7PlayShortMemory);"));
 assert.ok(door.includes("],r7Memory);"));
 const accident=range("  function r7Memory(){","  // ---------- Room 8 ----------");
 for(const txt of ["今日の最後の謎、面白かったな","水族館とか？","ねえ、次の休みさ――","■■！","視界が、赤く染まる","r7_mem_37"])assert.ok(accident.includes(txt));
 assert.ok(accident.includes("showEighthRoom(roomStates.room08)"),"still transitions to Room 8");
});
test("current chapter, canon and combined script retain the same clues and approved wording",()=>{
 const chapter=read("scenario/07_room7.md"),canon=read("SCENARIO.md"),full=read("scenario/FULL_SCENARIO.md");
 for(const t of ["……図書室、でしょうか","……さっきは、ありがとうと言えた","……よし、並びは合ってたみたいですね","……こんな約束もしてたんだ","……あのマグカップ、懐かしいな","……これで、最後だ","……この景色は……"]){
  assert.ok(chapter.includes(t),"chapter missing "+t);
  assert.ok(canon.includes(t),"canon missing "+t);
  assert.ok(full.includes(t),"full missing "+t);
 }
 assert.ok(chapter.includes("赤ずきん → 一休さん → ウサギとカメ"));
 assert.ok(chapter.includes("ブレーメンの音楽隊 → ラプンツェル"));
 assert.ok(chapter.includes("押し花の栞"));
 assert.ok(src.includes("r7_final_bremen")&&src.includes("r7_final_pressed_flower"));
 assert.ok(src.includes("id==='pigs'?'mitten':id"),"old saves migrate to the approved mitten book");
 const index=read("index.html"),version=(index.match(/href="style\.css\?v=(\d{8}-[a-z0-9-]+)"/)||[])[1];
 assert.ok(version&&index.includes("late-game.js?v="+version));
});
