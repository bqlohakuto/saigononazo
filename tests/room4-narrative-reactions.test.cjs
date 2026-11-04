"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const read=f=>fs.readFileSync(path.join(root,f),"utf8");
const code=read("room4.js"),scenario=read("room4-scenario.js");
const ctx=vm.createContext({window:{addEventListener(){}}});
vm.runInContext(code+"\nthis.getWordLines=r4WordSuccessLines;",ctx);
vm.runInContext(scenario+"\nthis.afterLines=room4AfterMemoryLines;this.flashbackLines=room4FlashbackLines;",ctx);
const normalize=items=>Array.from(items,x=>({id:x.logId,who:x.speaker,text:x.text}));
test("STAR and LIGHT reward scenes react without exclamation marks and keep the original log IDs",()=>{
 for(const kind of ["STAR","LIGHT"]){
  const lines=normalize(ctx.getWordLines(kind));
  assert.equal(lines.length,kind==="STAR"?5:6);
  assert.ok(lines.some(x=>x.id==="r4"+kind+"ok1"));
  assert.ok(lines.some(x=>x.id==="r4"+kind+"ok2"));
  assert.equal(lines.at(-1).text,"中から透明なパネルを取り出す。");
  assert.ok(!lines.some(x=>x.who==="主人公"&&/[!！]/.test(x.text)));
 }
 const star=normalize(ctx.getWordLines("STAR")).map(x=>x.text);
 assert.deepEqual(star,["……よし、合ってた","STAR……星、か","カチッ――展示ケースのロックが外れた。","お、開いた","中から透明なパネルを取り出す。"]);
 const light=normalize(ctx.getWordLines("LIGHT")).map(x=>x.text);
 assert.ok(light.includes("……なるほど、そういうことか"));
 assert.ok(light.includes("LIGHT……光、か"));
 assert.ok(light.includes("よし、これも正解だな"));
});
test("METEORS triggers one animated reward and a contained, calm reaction",()=>{
 assert.ok(code.includes('logId:"r4p3ok1"'));
 assert.ok(code.includes('logId:"r4p3ok2"'));
 assert.ok(code.includes("七色のプレートが、正しい順番に並んだ。"));
 assert.ok(code.includes("……あ、そろった"));
 assert.ok(code.includes("METEORS……流れ星、か"));
 assert.ok(code.includes("……よし、できた"));
 assert.ok(code.includes('if(dialogueStarted||!earnedThisOpen||currentScene!=="room04"||!room4State.meteors)return;'));
 assert.ok(code.includes("room4State.meteors=true;saveGame();draw();"));
});
test("completed constellation celebrates success without losing the mandatory final flower clue",()=>{
 const calls=[];
 ctx.room4State={completed:false,lightOn:false};
 ctx.game={querySelector(){return null}};
 ctx.saveGame=()=>{};
 ctx.r4CancelFailedLightOff=()=>{};
 ctx.r4Projection=()=>{};
 ctx.showRoomDialog=(lines,callback)=>calls.push({lines:normalize(lines),callback});
 ctx.r4Complete();
 assert.equal(calls.length,1);
 assert.equal(ctx.room4State.completed,true);
 const lines=calls[0].lines;
 const named=id=>lines.find(x=>x.id===id);
 assert.equal(named("r4ok2").text,"……あ");
 assert.equal(named("r4ok2_hana").text,"ハナさん、見てください");
 assert.equal(named("r4ok2_success").text,"……できた");
 assert.equal(named("r4ok3").text,"右の壁にある星座一覧へ目を向ける。その隣には、星座にまつわる花の絵が並んでいた。");
 assert.equal(named("r4ok4").text,"これ……おとめ座だ");
 assert.equal(named("r4ok6").text,"……スピカ");
 assert.equal(named("r4ok7").text,"スピカ……？");
 assert.ok(!lines.some(x=>x.who==="主人公"&&/[!！]/.test(x.text)));
 assert.equal(typeof calls[0].callback,"function");
 ctx.r4Complete();
 assert.equal(calls.length,1,"completion cannot trigger twice");
});
test("after-memory scene links the missing names to urgency without changing the date narrative",()=>{
 const after=normalize(ctx.afterLines);
 const memories=normalize(ctx.flashbackLines);
 const words=after.map(x=>x.text);
 assert.ok(words.indexOf("でも、今の記憶では……確かに呼んだんです")<words.indexOf("……焦らなくてもいいんだよ"));
 assert.ok(words.indexOf("……焦らなくてもいいんだよ")<words.indexOf("……次の部屋に行きましょう"));
 assert.ok(words.includes("あの人の名前……まだ思い出せないんです"));
 assert.equal(after.at(-1).id,"r4a16");
 for(let i=1;i<=15;i++)assert.ok(after.some(x=>x.id==="r4a"+String(i).padStart(2,"0")),"stable log ID r4a"+i);
 assert.ok(!words.includes("今までは全部思い出せたのに……"));
 assert.ok(memories.some(x=>x.text.includes("さん付けなんだ")));
 assert.ok(memories.some(x=>x.text.includes("記憶の中でも……僕たちの名前だけが抜け落ちてる")));
});
test("chapter and combined manuscripts include all approved reactions",()=>{
 const chapter=read("scenario/04_room4.md"),combined=read("scenario/FULL_SCENARIO.md");
 for(const phrase of ["……よし、合ってた","よし、これも正解だな","……あ、そろった","ハナさん、見てください","呼び合ったはずの名前だけが記憶の中でも欠落している","焦らなくてもいいんだよ"]){
  assert.ok(chapter.includes(phrase),"chapter missing "+phrase);
  assert.ok(combined.includes(phrase),"combined missing "+phrase);
 }
 const index=read("index.html");
 const html=index;
 const version=(html.match(/href="style\.css\?v=(\d{8}-[a-z0-9-]+)"/)||[])[1];
 assert.ok(version);
 assert.ok(index.includes(`room4.js?v=${version}`));
 assert.ok(index.includes(`room4-scenario.js?v=${version}`));
});
