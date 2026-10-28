"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=filename=>fs.readFileSync(path.join(root,filename),"utf8");

test("D01: Room 4 has an understandable name without calling it a planetarium",()=>{
 const scene=read("room4.js"),story=read("room4-scenario.js");
 assert.match(scene,/"星の展示室"/,"The location label uses everyday language");
 assert.match(story,/logId:"r4i03"[^\n]+星をテーマにした展示室のようだ。/,"Opening narration matches the star exhibits");
 assert.doesNotMatch(scene+story,/天文展示室/,"The unfamiliar expression does not reappear");
 assert.match(story,/プラネタリウム|アナウンス/,"The separate date flashback retains its astronomical projection");
});

test("D01: original manuscripts match the approved Room 4 wording",()=>{
 for(const file of ["scenario/04_room4.md","scenario/FULL_SCENARIO.md"]){
  const content=read(file);
  assert.match(content,/部屋は星をテーマにした薄暗い展示室。/,file);
  assert.match(content,/星をテーマにした展示室のようだ。/,file);
  assert.doesNotMatch(content,/天文展示室/,file);
  assert.match(content,/回想は春（4〜5月ごろ）のプラネタリウム/,file);
 }
});

test("D01 only changes the room name; D04 constellation hint wording stays separate",()=>{
 const room=read("room4.js");
 assert.match(room,/星の形から星座を/,"D04 hint is not silently rewritten by D01");
});
