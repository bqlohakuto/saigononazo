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
  assert.match(game,/line\("r6_intro_01","ト書き","足元の床は白い。並んだ扉は、どれもよく似た形をしている。"/);
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

test("F01: unseen rooms are not described until the player enters another room",()=>{
  const introStart=game.indexOf('window.showSixthRoom=function');
  const introEnd=game.indexOf('function r6MapMarkup()',introStart);
  const intro=game.slice(introStart,introEnd);
  assert(introStart>=0&&introEnd>introStart);
  assert.doesNotMatch(intro,/どの扉の先にも、同じような空間が続いているようだ/);
  assert.match(intro,/line\("r6_intro_01","ト書き","足元の床は白い。並んだ扉は、どれもよく似た形をしている。"/);

  const arrivalStart=game.indexOf('const arrived=()=>',game.indexOf('function r6Visit('));
  const arrivalEnd=game.indexOf('const direction=',arrivalStart);
  const arrival=game.slice(arrivalStart,arrivalEnd);
  assert(arrivalStart>=0&&arrivalEnd>arrivalStart);
  assert.match(arrival,/if\(fresh&&id==='A7'\)/,'A7 reaction only occurs after a new room is entered');
  assert.match(arrival,/line\('r6_a7','主人公','……さっきの部屋と、似た造りですね。'\)/);
  assert.match(arrival,/line\('r6_a7_h','ハナ','うん。壁も扉も、ほとんど同じみたい。'\)/);

  const start=manuscript.indexOf('## 第6の部屋');
  const section=manuscript.slice(start,manuscript.indexOf('### 盤面・移動の前提',start));
  assert(section.includes('足元の床は白い。並んだ扉は、どれもよく似た形をしている。'));
  assert(section.includes('……さっきの部屋と、似た造りですね。'));
});

test("F02: pre-discovery objective and Hana's hint stay exploratory until evidence is found",()=>{
  const goal=game.match(/const r6Objective=\(\)=>[^;]+;/)?.[0];
  assert(goal,'room objective is defined');
  assert(goal.includes('"扉をたどって、部屋の手がかりを探す"'));
  assert(!goal.includes('構造と床の色を確かめる'),'objective must not reveal the intended observations');
  assert(goal.includes('room6State.othelloKnown?"9手で最後の黒を消す"'),'post-discovery goal remains unchanged');
  const before=game.slice(game.indexOf('const choices=room6State.othelloKnown?'),game.indexOf('choices.push({id:\'cancel\''));
  assert(before.includes("text:'まだ通っていない扉を進んでみよう。部屋の様子をよく確かめてみて。'"));
  assert(!before.includes('端まで行けるところや、床の色が違う部屋'),'no early structural or color clue');
  assert(game.includes('if(extremes&&colors&&!room6State.othelloKnown)'),'both board and color discoveries remain required');
});
