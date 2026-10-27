"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const root=path.resolve(__dirname,"..");
const source=fs.readFileSync(path.join(root,"design-ui.js"),"utf8");
const chapter=fs.readFileSync(path.join(root,"scenario","02_room2.md"),"utf8");
const compiled=fs.readFileSync(path.join(root,"scenario","FULL_SCENARIO.md"),"utf8");
const statement=source.split("\n").find(line=>line.includes("game.querySelectorAll('.device-overlay section').forEach("));
assert.ok(statement,"Expected shared overlay decoration logic");

function decorate(section){
 const button=(title,handler,css)=>({title,handler,css});
 const game={querySelectorAll(query){assert.equal(query,".device-overlay section");return [section]}};
 const help=()=>{};
 vm.runInNewContext(statement,{game,button,help});
 return section.added;
}
function fakeSection({door=false,choice=false,puzzle=false,already=false}={}){
 const section={
  added:[],
  matches(selector){assert.equal(selector,".room-exit-menu,.r4-ratio-exhibit,.r5-handdrawn-panel");return door},
  querySelector(selector){
   if(selector===".design-op-button")return already||this.added.length>0?{}:null;
   if(selector==="[data-choice]")return choice?{}:null;
   if(selector==="input,.room2-palette,.r4-panels,.r5-counter-grid,.r6-othello,.room3-letterboard")return puzzle?{}:null;
   throw Error("unexpected selector: "+selector);
  },
  append(node){this.added.push(node)}
 };
 return section;
}

test("No.126: door choice menu never gains redundant operation help",()=>{
 for(const puzzle of [false,true]){
  const section=fakeSection({door:true,choice:true,puzzle});
  assert.equal(decorate(section).length,0);
 }
});

test("No.126: simple data-choice menus remain uncluttered even if they contain an input",()=>{
 const section=fakeSection({choice:true,puzzle:true});
 assert.equal(decorate(section).length,0);
});

test("No.126: actual puzzle devices retain exactly one operation help control",()=>{
 const puzzle=fakeSection({puzzle:true});
 decorate(puzzle);
 assert.equal(puzzle.added.length,1);
 assert.equal(puzzle.added[0].title,"操作説明");
 assert.equal(puzzle.added[0].css,"design-op-button");
 decorate(puzzle);
 assert.equal(puzzle.added.length,1,"Rerender must not duplicate the button");
 const existing=fakeSection({puzzle:true,already:true});
 assert.equal(decorate(existing).length,0);
});

test("No.126: ordinary static sections without an interactive device are unchanged",()=>{
 const plain=fakeSection();
 assert.equal(decorate(plain).length,0);
});

test("No.126: both manuscripts distinguish simple menus from puzzle operation help",()=>{
 for(const text of [chapter,compiled]){
  assert.match(text,/【校閲No\.126・案1 採用】/);
  assert.match(text,/「操作説明」ボタンを追加しない/);
  assert.match(text,/ブロックを操作する謎解き画面の操作説明は従来どおり使える/);
 }
});
