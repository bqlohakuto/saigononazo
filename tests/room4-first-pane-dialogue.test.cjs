"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const source=fs.readFileSync(path.join(root,"room4.js"),"utf8");
const firstLine="……あれ？　壁に透明な板みたいなものが貼ってある……？";
const laterLine="あれ……これもパネルなんじゃ……？";

function inspectWall(owned={}){
  const state={star:false,lightPuzzle:false,meteors:false,wall:false,box:false,...owned};
  const calls={dialogs:[],notices:[],pickups:[],saved:0};
  const wallButton={disabled:false};
  const context={
    room4State:state,
    window:{addEventListener(){},DesignUI:{pickup(item){calls.pickups.push(item)}}},
    document:{getElementById(id){return id==="r4Wall"?wallButton:null}},
    showRoomDialog(lines,done){calls.dialogs.push({lines:Array.from(lines,line=>({logId:line.logId,logType:line.logType,speaker:line.speaker,text:line.text})),done})},
    showRoomNotice(...args){calls.notices.push(args)},
    saveGame(){calls.saved++}
  };
  vm.createContext(context);vm.runInContext(source,context);
  context.r4Wall();
  return {context,state,calls,wallButton};
}

test("D03: discovering the wall's very first pane does not imply any previous panel",()=>{
  const x=inspectWall();
  assert.equal(x.calls.dialogs.length,1);
  assert.deepEqual(x.calls.dialogs[0].lines.map(line=>line.logId),["r4w1","r4w2"]);
  assert.equal(x.calls.dialogs[0].lines[0].text,firstLine);
  assert.doesNotMatch(x.calls.dialogs[0].lines[0].text,/これも|さっき|パネル/);
  assert.equal(x.calls.dialogs[0].lines[1].text,"壁に貼られている透明な板の端に指をかけると、外れた。");
  assert.equal(x.state.wall,false,"The pane is not collected until its dialogue finishes");
  x.calls.dialogs[0].done();
  assert.equal(x.state.wall,true);
  assert.equal(x.calls.saved,1);
  assert.equal(x.wallButton.disabled,true);
  assert.equal(x.calls.pickups.length,1);
  assert.equal(x.calls.pickups[0].image,"images/exhibits/room04/virgo-panels/virgo-panel-04.svg");
  x.context.r4Wall();
  assert.equal(x.calls.dialogs.length,1,"Reinspection does not restart first discovery");
  assert.equal(x.calls.notices.length,1);
});

for(const key of ["star","lightPuzzle","meteors","box"]){
  test("D03: prior "+key+" pane permits the word 'also' without changing collection",()=>{
    const x=inspectWall({[key]:true});
    assert.equal(x.calls.dialogs[0].lines[0].text,laterLine);
    x.calls.dialogs[0].done();
    assert.equal(x.state[key],true,"Previously acquired pane stays acquired");
    assert.equal(x.state.wall,true);
    assert.equal(x.calls.saved,1);
    assert.equal(x.calls.pickups[0].image,"images/exhibits/room04/virgo-panels/virgo-panel-04.svg");
  });
}

test("D03: scripts and manuscripts never assume the question box was discovered second",()=>{
 const docPaths=["scenario/04_room4.md","scenario/FULL_SCENARIO.md"];
 for(const file of docPaths){
  const text=fs.readFileSync(path.join(root,file),"utf8");
  const wall=text.slice(text.indexOf("### 壁"),text.indexOf("### 質問箱",text.indexOf("### 壁")));
  assert(wall.includes(firstLine),file+" documents first-pane dialogue");
  assert(wall.includes(laterLine),file+" documents later-pane dialogue");
  assert(!text.includes("さっきのパネルと同じじゃないか"),file+" must not prescribe acquisition order");
 }
 assert.match(source,/logId:"r4b2"[^\n]+この部分だけ、透明な板になってる/,"Box dialogue remains order-neutral");
});
