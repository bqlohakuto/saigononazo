"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const source=fs.readFileSync(path.join(root,"room3.js"),"utf8");
const sandbox={};
vm.runInNewContext(source+"\nthis.thirdMemory={flashback:room3FlashbackLines,after:room3AfterMemoryLines};",sandbox);
const after=Array.from(sandbox.thirdMemory.after,x=>({id:x.logId,who:x.speaker,text:x.text}));
function observeTrumpet(state){
 let recorded;
 const ctx={room3State:{trumpetInspected:false,bedInspected:true,trumpetAwakeTalkSeen:false,...state},
  saveGame(){},showRoomDialog(lines){recorded=Array.from(lines,x=>({id:x.logId,who:x.speaker,text:x.text}));},
  showRoomNotice(){throw Error("No repeated notice expected")} };
 vm.runInNewContext(source+"\ninspectThirdRoomTrumpet();",ctx);
 return {lines:recorded,state:ctx.room3State};
}
test("Hana acts as a memory guide when the trumpet is inspected after waking her",()=>{
 const {lines,state}=observeTrumpet({});
 assert.equal(state.trumpetInspected,true);
 assert.equal(state.trumpetAwakeTalkSeen,true);
 assert.ok(lines.some(x=>x.who==="ハナ"&&x.text==="ちゃんと覚えてるんだね"));
 assert.ok(lines.some(x=>x.who==="主人公"&&x.text==="やっぱりここは、僕が住んでいた部屋なのかもしれません"));
 assert.ok(!lines.some(x=>/ハナさんは、どうして|僕のことを知っているのか/.test(x.text)));
});
test("inspecting the trumpet before waking Hana avoids rediscovery",()=>{
 const {lines}=observeTrumpet({trumpetInspected:true});
 assert.equal(lines.some(x=>x.id==="room3_trumpet_01"),false);
 assert.ok(lines.some(x=>x.text==="……はい。記憶の中で使っていたものと同じです"));
 assert.ok(lines.some(x=>x.text==="ちゃんと覚えてるんだね"));
});
test("the confession is unchanged and its emotional aftermath keeps the senior unidentified",()=>{
 const flash=Array.from(sandbox.thirdMemory.flashback,x=>x.text);
 assert.ok(flash.some(x=>x.includes("いつも隣にいてほしい")));
 assert.ok(flash.some(x=>x.includes("……遅いよ")));
 assert.ok(flash.some(x=>x.includes("左手を差し出す")));
 assert.ok(after.some(x=>x.text==="あの人と……付き合い始めた日のことです"));
 assert.ok(after.some(x=>x.text==="名前は、まだ思い出せないんですけど"));
 assert.ok(after.some(x=>x.text==="大切な思い出だね"));
 assert.ok(after.some(x=>x.text==="ハナは、優しく微笑んだ。"));
 assert.ok(!after.some(x=>/懐かしそうに目を細め/.test(x.text)));
 assert.equal(after.at(-1).id,"room3_after_13");
 assert.equal(after.at(-1).text,"鍵は開いた。次の部屋に行こう。");
});
test("the approved dialogue is synchronized across both chapter manuscripts",()=>{
 for(const file of ["scenario/03_room3.md","scenario/FULL_SCENARIO.md"]){
  const md=fs.readFileSync(path.join(root,file),"utf8");
  const start=md.indexOf("# 第3の部屋｜大学1年・顔文字モールスと告白");
  const end=md.indexOf("## 校閲No.143〜151",start);
  assert.ok(start>=0&&end>start);
  const chapter=md.slice(start,end);
  assert.ok(chapter.includes("第2の部屋で先輩への恋心に気づいたあとの物語"));
  for(const phrase of ["ちゃんと覚えてるんだね","やっぱりここは、僕が住んでいた部屋なのかもしれません","名前は、まだ思い出せないんですけど","ハナは、優しく微笑んだ。"])
   assert.ok(chapter.includes(phrase),file+" missing "+phrase);
  assert.ok(!chapter.includes("ハナさんは、どうしてこれが僕のものだって分かったんだ？"));
 }
});
test("room 3 answer logic and shared static asset version are not regressed",()=>{
 assert.ok(source.includes('letters==="ONAJIMOJINOAIDA"'));
 assert.ok(source.includes('kana==="イツモトナリニ"'));
 const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
 assert.ok(html.includes('room3.js?v=20261104-narrative-v3'));
 const versions=[...html.matchAll(/(?:href|src)="[^"]+\.(?:css|js)\?v=(\d{8}-[a-z0-9-]+)"/g)].map(x=>x[1]);
 assert.ok(versions.length>20);
 assert.equal(new Set(versions).size,1);
});
