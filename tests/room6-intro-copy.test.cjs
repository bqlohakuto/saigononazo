"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const game=read("late-game.js");
const manuscript=read("SCENARIO.md");

test("B01: Room 6 first narration matches its visible multi-door room",()=>{
  assert.match(game,/line\("r6_intro_entry_02","ト書き","小さな部屋だった。床も壁も明るい色で、四方には隣の部屋へ続く扉がある。"/);
  assert.match(game,/line\("r6_intro_01","ト書き","足元の床は白い。どの扉の先にも、同じような空間が続いているようだ。"/);
  assert.match(game,/r6-door r6-door-/,"The room draws actual doors");
  assert.doesNotMatch(game,/ずいぶん何もないですね|家具らしいものは何もない/);
});

test("B01: manuscript no longer contradicts the room or repeats the wall inscription",()=>{
  const start=manuscript.indexOf("## 第6の部屋");
  assert(start>=0);
  const introStart=manuscript.indexOf("### 導入",start);
  assert(introStart>start);
  const nextHeading=manuscript.indexOf("### ",introStart+5);
  const tail=manuscript.slice(introStart,nextHeading<0?undefined:nextHeading);
  assert.match(tail,/小さな部屋だった。床も壁も明るい色で、四方には隣の部屋へ続く扉がある。/);
  assert.doesNotMatch(tail,/ずいぶん何もないですね|家具らしいものは何もない/);
  assert.equal((tail.match(/壁の一角に、短い言葉が刻まれていた。/g)||[]).length,1);
});
