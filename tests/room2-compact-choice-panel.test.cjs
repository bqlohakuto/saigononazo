"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const root=path.resolve(__dirname,"..");
const code=fs.readFileSync(path.join(root,"room2.js"),"utf8");
const css=fs.readFileSync(path.join(root,"style.css"),"utf8");
const chapter=fs.readFileSync(path.join(root,"scenario","02_room2.md"),"utf8");
const full=fs.readFileSync(path.join(root,"scenario","FULL_SCENARIO.md"),"utf8");

function harness(){
 const calls={closed:0,selected:[],overlay:null,focused:0};
 const room={inert:false};
 const closeButton={addEventListener(_event,callback){this.click=callback}};
 const choiceButtons=[0,1].map(index=>({
  dataset:{choice:String(index)},addEventListener(_event,callback){this.click=callback},
  focus(){calls.focused++}
 }));
 const overlay={
  className:"",innerHTML:"",
  querySelector(selector){
   if(selector===".device-close")return closeButton;
   if(selector==="[data-choice]")return choiceButtons[0];
   throw Error("Unexpected selector "+selector);
  },
  querySelectorAll(selector){assert.equal(selector,"[data-choice]");return choiceButtons},
  remove(){calls.closed++;calls.overlay=null}
 };
 const game={
  querySelector(selector){assert.equal(selector,".room");return room},
  appendChild(el){assert.equal(el,overlay);calls.overlay=el}
 };
 const sandbox={document:{createElement(tag){assert.equal(tag,"div");return overlay}},game};
 const start=code.indexOf("function showRoomChoices(choices){");
 const end=code.indexOf("const room2IntroLines=",start);
 assert.ok(start>=0&&end>start);
 vm.runInNewContext(code.slice(start,end)+"\nthis.__show=showRoomChoices;",sandbox);
 const open=()=>sandbox.__show([
  {label:"次の部屋へ向かう",onSelect(){calls.selected.push("next")}},
  {label:"もう少し部屋をしらべてみる",onSelect(){calls.selected.push("stay")}}
 ]);
 return {calls,room,overlay,closeButton,choiceButtons,open};
}

test("No.127: compact cleared-door choice panel contains only the two options and close",()=>{
 const h=harness();h.open();
 assert.equal(h.room.inert,true);
 assert.equal(h.overlay.className,"device-overlay room2-choice-overlay");
 const html=h.overlay.innerHTML;
 assert.match(html,/class="menu-panel room-exit-menu room2-choice-panel"/);
 assert.match(html,/role="dialog" aria-modal="true" aria-label="扉の行き先を選ぶ"/);
 assert.doesNotMatch(html,/<h2|どうする？/);
 assert.match(html,/class="room2-choice-options"/);
 assert.equal((html.match(/data-choice=/g)||[]).length,2);
 assert.ok(html.indexOf("次の部屋へ向かう")<html.indexOf("もう少し部屋をしらべてみる"));
 assert.match(html,/aria-label="閉じる"/);
 assert.equal(h.calls.focused,1,"The first actual choice gets keyboard focus");
});

test("No.127: stay and next actions close the panel and preserve the original choice order",()=>{
 for(const index of [0,1]){
  const h=harness();h.open();
  h.choiceButtons[index].click();
  assert.deepEqual(h.calls.selected,[index===0?"next":"stay"]);
  assert.equal(h.calls.closed,1);
  assert.equal(h.room.inert,false);
  assert.equal(h.calls.overlay,null);
 }
});

test("No.127: closing the choice panel cancels without performing either action",()=>{
 const h=harness();h.open();
 h.closeButton.click();
 assert.equal(h.calls.closed,1);
 assert.deepEqual(h.calls.selected,[]);
 assert.equal(h.room.inert,false);
});

test("No.127: compact panel styles target only the Room 2 choices and landscape layout",()=>{
 assert.match(css,/#game \.room2-choice-overlay \.room2-choice-panel/);
 assert.match(css,/#game \.room2-choice-panel \.room2-choice-options/);
 assert.match(css,/grid-template-columns:minmax\(0,1fr\)/);
 assert.match(css,/max-height:min\(88dvh,450px\)/);
 assert.match(css,/@media\(max-height:500px\)/);
 assert.match(css,/overflow-wrap:anywhere/);
});

test("No.127: scenario sources match approved heading-free display",()=>{
 for(const text of [chapter,full]){
  assert.match(text,/【校閲No\.127・案1 採用】/);
  assert.match(text,/「どうする？」の見出しを取り除く/);
  assert.match(text,/閉じるボタン、移動・探索継続の挙動/);
 }
});
