"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const root=path.join(__dirname,"..");
const script=fs.readFileSync(path.join(root,"room2.js"),"utf8");
const chapter=fs.readFileSync(path.join(root,"scenario","02_room2.md"),"utf8");
const full=fs.readFileSync(path.join(root,"scenario","FULL_SCENARIO.md"),"utf8");
const expected="今度は、どんな部屋なんだろうね";
const retired="今度はあれが謎みたいだね";
const sandbox={};
vm.runInNewContext(script+"\nthis.__room2IntroLines=room2IntroLines;",sandbox);
const intro=Array.from(sandbox.__room2IntroLines,entry=>({id:entry.logId,speaker:entry.speaker,text:entry.text}));

test("No.109: actual Room 2 introduction uses the approved non-leading Hana line",()=>{
 const line=intro.find(x=>x.id==="room2_intro_04");
 assert.ok(line);
 assert.equal(line.speaker,"ハナ");
 assert.equal(line.text,expected);
 assert.equal(intro.filter(x=>x.speaker==="ハナ").length,1);
 assert.ok(intro.some(x=>x.text.includes("机の上には、何かが並べられているようだ")));
 assert.ok(!script.includes(retired),"retired leading hint must not appear in the game");
});

test("No.109: standalone and combined manuscripts match the exact implementation",()=>{
 const chapterIntro=chapter.split("## 導入")[1].split("## 調査")[0];
 const fullIntro=full.split("<!-- source: scenario/02_room2.md -->")[1].split("## 導入")[1].split("## 調査")[0];
 for(const passage of [chapterIntro,fullIntro]){
  assert.ok(passage.includes("**ハナ**  \n「"+expected+"」"));
  assert.ok(!passage.includes(retired));
  assert.match(passage,/【校閲No\.109・案1 採用】/);
 }
});
