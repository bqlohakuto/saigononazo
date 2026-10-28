"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const read=f=>fs.readFileSync(path.join(root,f),"utf8");
const puzzleText="散らばる星を重ね、夜空にひとつの姿を描け。";
const authored=vm.runInNewContext(read("room4-scenario.js")+";room4DoorLines");
const script=read("script.js");
const snippet=script.slice(script.indexOf("function splitIntoSentences("),script.indexOf("function showTitle("));
assert(snippet.includes("function expandScenario("),"The production sentence splitter is available");
const expandScenario=vm.runInNewContext(snippet+";expandScenario");

test("D02: carved Room 4 riddle does not leave a lone closing quotation mark on the next page",()=>{
 const line=authored.find(line=>line.logId==="r4d04");
 assert.equal(line.speaker,"システム");
 assert.equal(line.logType,"narration");
 assert.equal(line.text,puzzleText);
 const expanded=expandScenario([line]);
 assert.equal(expanded.length,1,"The entire engraved line must remain in one logical sentence");
 assert.equal(expanded[0].text,puzzleText);
 assert.equal(expanded[0].logId,"r4d04_01");
 assert.doesNotMatch(expanded[0].text,/[『』「」]/);
});

test("D02: returning to the door repeats the same clean riddle",()=>{
 const room=read("room4.js");
 const repeat=room.match(/showRoomNotice\("([^"]+)","r4drepeat","investigation"\)/);
 assert(repeat,"Repeated-door investigation remains available");
 assert.equal(repeat[1],puzzleText);
});

test("D02: manuscript and full scenario show the same unquoted carving",()=>{
 for(const file of ["scenario/04_room4.md","scenario/FULL_SCENARIO.md"]){
  const scenario=read(file);
  assert(scenario.includes("> **"+puzzleText+"**"),file);
  assert(!scenario.includes("『"+puzzleText+"』"),file+" must not restore standalone marks");
 }
});
