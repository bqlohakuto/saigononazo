"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const root=path.join(__dirname,"..");
const code=fs.readFileSync(path.join(root,"room2.js"),"utf8");
const manuscript=fs.readFileSync(path.join(root,"scenario","02_room2_hit_blow.md"),"utf8");
const mainScenario=fs.readFileSync(path.join(root,"scenario","02_room2.md"),"utf8");
const fullScenario=fs.readFileSync(path.join(root,"scenario","FULL_SCENARIO.md"),"utf8");
const sandbox={};
vm.runInNewContext(code+"\nthis.__room2Dialogues=ROOM2_DIALOGUES;",sandbox);
const authored=sandbox.__room2Dialogues;

function dialogueRows(markdown){
 const result=new Map();
 const wrongLines=markdown.split("## 5 HIT｜本編正解時")[0];
 for(const line of wrongLines.split("\n")){
  const m=line.match(/^\|\s*(\d)H(\d)B\s*\|\s*ハナ「([^」]*)」 主人公「([^」]*)」\s*\|\s*$/);
  if(!m)continue;
  const key=m[1]+"H"+m[2]+"B";
  assert.equal(result.has(key),false,"Duplicate judgement row: "+key);
  result.set(key,[m[3],m[4]]);
 }
 return result;
}

test("all nineteen incorrect-judgement dialogues exactly match the game",()=>{
 const rows=dialogueRows(manuscript);
 assert.equal(rows.size,19,"The five symbols admit nineteen non-success judgements");
 for(let hit=0;hit<=4;hit++){
  const pairs=authored[hit+"H"];
  assert.equal(pairs.length,[6,5,4,3,1][hit]);
  for(let blow=0;blow<pairs.length;blow++){
   const key=hit+"H"+blow+"B";
   assert.ok(rows.has(key),"Missing "+key);
   assert.deepEqual(rows.get(key),Array.from(pairs[blow]),"Mismatch for "+key);
  }
 }
});

test("combined manuscript and chapter note match the adopted judge content",()=>{
 const fullRows=dialogueRows(fullScenario.split("<!-- source: scenario/02_room2_hit_blow.md -->")[1]||"");
 assert.deepEqual([...fullRows],[...dialogueRows(manuscript)]);
 assert.match(mainScenario,/【校閲No\.107・案1 採用】/);
 assert.match(manuscript,/【校閲No\.107・案1 採用】/);
 assert.ok(manuscript.includes("5H0B（回答回数による分岐なし）"));
});
