"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const read=name=>fs.readFileSync(path.join(root,name),"utf8");
const game=read("late-game.js"),canon=read("SCENARIO.md"),chapter=read("scenario/06_room6.md");
function section(start,end){
 const a=game.indexOf(start),b=game.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,"script section "+start);
 return game.slice(a,b);
}
const intro=section("  window.showSixthRoom=function(savedState){","  function r6MapMarkup(){");
const after=section('    line("r6_after_001"','  ];\n  function r6RevealExit(){');
const winning=section("  function r6Complete(){","  // ---------- Room 7 ----------");
test("new room entry remembers the bunny painting without disclosing Hana's identity",()=>{
 const ordered=["r6_intro_01","r6_intro_thought_01","r6_intro_thought_02","r6_intro_glance_01","r6_intro_hana_01","r6_intro_reply_01","r6_intro_entry_03","r6_intro_02","r6_intro_03"];
 let at=-1;
 for(const id of ordered){const i=intro.indexOf('line("'+id+'"');assert.ok(i>at,"order "+id);at=i;}
 for(const text of ["……さっきの絵。","ハナさんは、あの絵のことを知っていた。","いえ……何でもありません"])assert.ok(intro.includes(text));
 assert.ok(!intro.includes("花音"));
 assert.ok(intro.includes('r6_intro_01","ト書き","足元の床は白い。並んだ扉は、どれもよく似た形をしている。'));
});
test("the H2 white-out celebrates the solve before the final visual transition",()=>{
 const ids=["r6_complete_01","r6_complete_02","r6_complete_03","r6_complete_achieve_01","r6_complete_achieve_02","r6_complete_04","r6_complete_05","r6_final_lavender"];
 let at=-1;
 for(const id of ids){let i=winning.indexOf('line("'+id+'"');assert.ok(i>at,"order "+id);at=i;}
 assert.ok(winning.includes("……全部、白になった"));
 assert.ok(winning.includes("……よし、これで"));
 assert.ok(!winning.includes("これで！"));
 assert.ok(winning.includes("room6State.memorySeen=true;room6State.completed=true"));
});
test("the post-recollection scene keeps existing log IDs and offers Hana gratitude without an accusation",()=>{
 const logIds=[...after.matchAll(/line\("([^"]+)"/g)].map(m=>m[1]);
 for(let n=1;n<=19;n++)assert.ok(logIds.includes("r6_after_"+String(n).padStart(3,"0")),"preserve old log entry "+n);
 assert.ok(logIds.includes("r6_after_hana_tired_01"));
 assert.equal(new Set(logIds).size,logIds.length);
 const steps=["視界が、元の部屋に戻る。","隣に立つハナさんを見る。","どこか疲れているように見えた。","……ハナさん","……ここまで、ありがとうございました","どういたしまして","聞きたいことは、まだある。","……次に行きましょう","僕はハナさんと一緒に、次の扉へ向かった。"];
 let at=-1;for(const step of steps){let i=after.indexOf(step,at+1);assert.ok(i>at,step);at=i;}
 assert.ok(!after.includes("きっと、ハナさんは――"));
});
test("the door is revealed precisely at the return narration, never during the memory",()=>{
 let lines,onEntry,shown=0;
 const ctx={
  line:(id,speaker,text)=>({logId:id,speaker,text}),
  R6_MEMORY_AND_AFTER:[{logId:"r6_memory_full_086"},{logId:"r6_after_001"}],
  showRoomDialog:(entries,_done,callback)=>{lines=entries;onEntry=callback;},
  r6RevealExit:()=>{shown++}
 };
 vm.runInNewContext(winning+"\nthis.r6CompleteTest=r6Complete;",ctx);
 ctx.r6CompleteTest();
 assert.ok(lines.some(x=>x.logId==="r6_final_lavender"));
 assert.equal(shown,0);
 onEntry({logId:"r6_memory_full_086"});
 assert.equal(shown,0,"not while a memory scene is showing");
 onEntry({logId:"r6_after_001"});
 assert.equal(shown,1,"when the newly visible door is described");
 assert.ok(game.includes("door.disabled=true"),"the door stays inaccessible during dialogue");
 assert.ok(game.includes("room6State.completed=true;r6ExitRevealed=true;saveGame()"),"completion still persists");
});
test("canonical script and both chapter manuscripts reflect the same stable plot",()=>{
 for(const text of ["……さっきの絵。","ハナさんは、あの絵のことを知っていた。","……全部、白になった","……ここまで、ありがとうございました","聞きたいことは、まだある。","……次に行きましょう"]){
  for(const [file,doc] of [["SCENARIO.md",canon],["scenario/06_room6.md",chapter],["scenario/FULL_SCENARIO.md",read("scenario/FULL_SCENARIO.md")]]){
   assert.ok(doc.includes(text),file+" missing "+text);
  }
 }
 for(const key of ["r6_food_04","r6_map_14","r6_hana_why_03","r6_memory_full_085","r6_final_lavender","r6_final_signal"])assert.ok(game.includes(key),"preserved "+key);
 assert.ok(game.includes("if(room6State.mapEvent)choices.push({id:'why-help'"),"previous optional question survives");
 const html=read("index.html"),version=(html.match(/href="style\.css\?v=(\d{8}-[a-z0-9-]+)"/)||[])[1];
 assert.ok(version&&html.includes("late-game.js?v="+version),"cache tag refers to the new JS file");
});
