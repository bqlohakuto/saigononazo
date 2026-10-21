"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const root=path.resolve(__dirname,"..");
const code=fs.readFileSync(path.join(root,"room2.js"),"utf8");
const chapter=fs.readFileSync(path.join(root,"scenario","02_room2.md"),"utf8");
const full=fs.readFileSync(path.join(root,"scenario","FULL_SCENARIO.md"),"utf8");

function harness(overrides={}){
 const calls={choices:[],dialogues:[],notices:[],saves:0,boundary:0};
 const sandbox={
  room2State:{doorInspected:false,deskInspected:true,unlocked:true,...overrides},
  showRoomDialog(lines,done){calls.dialogues.push({ids:Array.from(lines,line=>line.logId),done})},
  showRoomNotice(text,id){calls.notices.push({text,id})},
  saveGame(){calls.saves++},
  showThirdRoomBoundary(){calls.boundary++}
 };
 vm.runInNewContext(code+"\nthis.__inspect=inspectSecondRoomDoor;",sandbox);
 sandbox.showRoomChoices=(options)=>{calls.choices.push(Array.from(options,item=>({label:item.label,onSelect:item.onSelect})))};
 return {calls,state:sandbox.room2State,inspect:()=>sandbox.__inspect()};
}

test("No.124: inspecting the unlocked door immediately opens exactly two options",()=>{
 for(const doorInspected of [false,true]){
  const {calls,inspect}=harness({doorInspected});
  inspect();
  assert.equal(calls.choices.length,1,"Choices appear without waiting for dialogue");
  assert.deepEqual(calls.choices[0].map(opt=>opt.label),["次の部屋へ向かう","もう少し調べる"]);
  assert.equal(calls.dialogues.length,0,"The old door-is-open line must not appear");
  assert.equal(calls.saves,0,"Simply examining the already-open door changes nothing");
 }
});

test("No.124: 'next room' retains original two transition lines and boundary callback",()=>{
 const {calls,inspect}=harness();
 inspect();
 calls.choices[0][0].onSelect();
 assert.equal(calls.dialogues.length,1,"Selecting next room still starts the story transition");
 assert.deepEqual(calls.dialogues[0].ids,["room2_room3_transition_01","room2_room3_transition_02"]);
 assert.equal(calls.boundary,0,"Third room is entered only after finishing the transition");
 calls.dialogues[0].done();
 assert.equal(calls.boundary,1,"Finishing the original narration reaches the third room");
});

test("No.125: staying returns silently without changing the cleared room state",()=>{
 const h=harness({unlocked:true,doorInspected:true,deskInspected:true,challengeBest:3,attempts:2});
 h.inspect();
 h.calls.choices[0][1].onSelect();
 assert.equal(h.calls.notices.length,0,"No status message should be displayed");
 assert.equal(h.calls.dialogues.length,0,"No novel text advance is needed");
 assert.equal(h.calls.saves,0,"Staying does not alter saved progress");
 assert.equal(h.calls.boundary,0,"Staying does not trigger the next room");
 assert.equal(h.state.unlocked,true);
 assert.equal(h.state.attempts,2);
 assert.equal(h.state.challengeBest,3);
});

test("No.124: uncleared door interactions remain unchanged",()=>{
 const uncleared=harness({unlocked:false,doorInspected:false});
 uncleared.inspect();
 assert.equal(uncleared.calls.choices.length,0);
 assert.deepEqual(uncleared.calls.dialogues[0].ids,["room2_door_01","room2_door_02","room2_door_03","room2_door_04"]);
 assert.equal(uncleared.state.doorInspected,true);
 assert.equal(uncleared.calls.saves,1);
 const examined=harness({unlocked:false,doorInspected:true});
 examined.inspect();
 assert.equal(examined.calls.choices.length,0);
 assert.deepEqual(examined.calls.notices,[{text:"『正しい組み合わせを導け』",id:"room2_door_again"}]);
});

test("No.133: recollection completion displays the approved hint and retains cleared state",()=>{
 const calls={notices:[],saves:0,opened:false};
 const sandbox={
  room2State:{unlocked:false,flashbackSeen:false,challengeActive:false,challengeBest:3},
  room2FlashbackContent:[],room2AfterFlashbackContent:[],
  saveGame(){calls.saves++},
  showRoomDialog(lines,done){if(done)done()},
  showRoomNotice(text,id,type){calls.notices.push({text,id,type})},
  document:{getElementById(id){return id==="r2Door"?{classList:{add(cls){calls.opened=cls==="is-unlocked"}}}:null}}
 };
 vm.runInNewContext(code+";this.__complete=completeRoom2;",sandbox);
 sandbox.__complete();
 assert.deepEqual(calls.notices,[{
  text:"扉の鍵が開いた。机の仕掛けは、まだ動いているようだ。",
  id:"room2_unlocked",type:"narration"
 }]);
 assert.equal(sandbox.room2State.unlocked,true);
 assert.equal(sandbox.room2State.flashbackSeen,true);
 assert.equal(sandbox.room2State.challengeBest,3);
 assert.equal(calls.saves,1);
 assert.equal(calls.opened,true);
 assert.doesNotMatch(code,/机のブロックから『8回チャレンジ』にも挑戦できる/);
});

test("No.134: cleared Hana dialogue reflects room change while preclear lines stay untouched",()=>{
 function askRoomTopic(unlocked){
  const result={saves:0,lines:null};
  const buttons=[];
  const list={
   appendChild(button){buttons.push(button)},
   querySelector(){return buttons[0]},
   querySelectorAll(){return buttons}
  };
  const overlay={querySelector(sel){return sel===".hana-choice-list"?list:null}};
  const sandbox={
   room2State:{unlocked,deskInspected:true,history:[],hanaHints:0},
   game:{querySelector(){return null},appendChild(){}},
   window:{HanaChoiceUI:{ensureStyle(){}}},
   document:{createElement(tag){
    if(tag==="div")return overlay;
    return {type:"",className:"",dataset:{},textContent:"",addEventListener(event,fn){if(event==="click")this.press=fn}};
   }},
   activateDeviceModal(){return ()=>{}},
   showRoomDialog(lines,done){result.lines=Array.from(lines,line=>({id:line.logId,speaker:line.speaker,text:line.text}));done?.()},
   saveGame(){result.saves++}
  };
  vm.runInNewContext(code+";this.__hana=showSecondRoomHana;",sandbox);
  sandbox.__hana();
  const btn=buttons.find(x=>x.textContent==="この部屋について");
  assert.ok(btn,"The room topic must remain selectable");
  btn.press();
  assert.equal(result.saves,1);
  return result.lines;
 }
 assert.deepEqual(askRoomTopic(true),[
  {id:"room2_hana_room_clear_01",speaker:"ハナ",text:"この部屋、少し雰囲気が変わったね"},
  {id:"room2_hana_room_clear_02",speaker:"主人公",text:"……はい。さっきまでとは違って見えます"}
 ]);
 assert.deepEqual(askRoomTopic(false),[
  {id:"room2_hana_room_01",speaker:"ハナ",text:"この部屋、何か仕掛けがありそうだね"},
  {id:"room2_hana_room_02",speaker:"主人公",text:"気になるところから調べてみます"}
 ]);
 for(const manuscript of [chapter,full]){
  assert.match(manuscript,/【校閲No\.134・案2 採用】/);
  assert.match(manuscript,/「この部屋、少し雰囲気が変わったね」/);
  assert.match(manuscript,/「……はい。さっきまでとは違って見えます」/);
 }
});

test("No.135: HIT and BLOW explanation remains available; player response follows clear state",()=>{
 function askRules(unlocked){
  let dialogue=null;
  const buttons=[];
  const list={appendChild(button){buttons.push(button)},querySelector(){return buttons[0]},querySelectorAll(){return buttons}};
  const overlay={querySelector(selector){return selector===".hana-choice-list"?list:null}};
  const state={unlocked,deskInspected:true,history:[],hanaHints:0};
  let saves=0;
  const sandbox={
   room2State:state,
   game:{querySelector(){return null},appendChild(){}},
   window:{HanaChoiceUI:{ensureStyle(){}}},
   document:{createElement(tag){
    return tag==="div"?overlay:{type:"",className:"",dataset:{},textContent:"",addEventListener(event,fn){if(event==="click")this.press=fn}};
   }},
   activateDeviceModal(){return ()=>{}},
   showRoomDialog(lines,done){
    dialogue=Array.from(lines,line=>({logId:line.logId,speaker:line.speaker,text:line.text}));
    if(done)done();
   },
   saveGame(){saves++}
  };
  vm.runInNewContext(code+";this.__showHana=showSecondRoomHana;",sandbox);
  sandbox.__showHana();
  const button=buttons.find(item=>item.textContent==="HITとBLOWについて");
  assert.ok(button,"HIT/BLOW topic remains available after inspecting desk");
  button.press();
  assert.equal(saves,1);
  return dialogue;
 }
 const pre=askRules(false),post=askRules(true);
 assert.deepEqual(pre,[
  {logId:"room2_hana_rules_01",speaker:"ハナ",text:"HITは記号・色・位置が全部合っているもの。BLOWは記号と色が合っていて、位置だけ違うものだよ"},
  {logId:"room2_hana_rules_02",speaker:"主人公",text:"判定を比べながら、合っている組み合わせを絞っていくんですね"}
 ]);
 assert.deepEqual(post,[
  {logId:"room2_hana_rules_01",speaker:"ハナ",text:"HITは記号・色・位置が全部合っているもの。BLOWは記号と色が合っていて、位置だけ違うものだよ"},
  {logId:"room2_hana_rules_02",speaker:"主人公",text:"はい。判定を比べるのが大切でしたね"}
 ]);
 for(const manuscript of [chapter,full]){
  assert.ok(manuscript.includes("【校閲No.135・案2 採用】"));
  assert.ok(manuscript.includes("「はい。判定を比べるのが大切でしたね」"));
 }
});

test("No.136: revised thinking hint appears only after a non-correct judgment",()=>{
 function askHint({unlocked=false,history=[]}={}){
  const buttons=[];
  let dialogue=null;
  const list={appendChild(button){buttons.push(button)},querySelector(){return buttons[0]},querySelectorAll(){return buttons}};
  const overlay={querySelector(selector){return selector===".hana-choice-list"?list:null}};
  const state={unlocked,deskInspected:true,history,attempts:history.length,hanaHints:2};
  let saves=0;
  const sandbox={
   room2State:state,
   game:{querySelector(){return null},appendChild(){}},
   window:{HanaChoiceUI:{ensureStyle(){}}},
   document:{createElement(tag){
    if(tag==="div")return overlay;
    return {type:"",className:"",dataset:{},textContent:"",addEventListener(event,fn){if(event==="click")this.press=fn}};
   }},
   activateDeviceModal(){return ()=>{}},
   showRoomDialog(lines,done){
    dialogue=Array.from(lines,line=>({logId:line.logId,speaker:line.speaker,text:line.text}));
    if(done)done();
   },
   saveGame(){saves++}
  };
  vm.runInNewContext(code+";this.__hana=showSecondRoomHana;",sandbox);
  sandbox.__hana();
  const button=buttons.find(item=>item.textContent==="考え方のヒント");
  if(button)button.press();
  return {available:!!button,dialogue,saves,hints:state.hanaHints};
 }
 const notYet=askHint(),shown=askHint({history:[{hit:1,blow:2}]}),cleared=askHint({unlocked:true,history:[{hit:1,blow:2}]});
 assert.equal(notYet.available,false,"Do not offer hint before any wrong answer");
 assert.equal(cleared.available,false,"Do not offer thinking hint after clearing");
 assert.equal(shown.available,true,"Offer after wrong answer");
 assert.deepEqual(shown.dialogue,[{
  logId:"room2_hana_hint_1_2",speaker:"ハナ",
  text:"一度にたくさん変えると、変化がわかりにくいよ。少しずつ動かして、前の判定と比べてみよう"
 }]);
 assert.equal(shown.saves,1);
 assert.equal(shown.hints,3);
 for(const manuscript of [chapter,full]){
  assert.ok(manuscript.includes("【校閲No.136・案2 採用】"));
  assert.ok(manuscript.includes("「一度にたくさん変えると、変化がわかりにくいよ。少しずつ動かして、前の判定と比べてみよう」"));
 }
 assert.doesNotMatch(code,/どれが合っていたかわからなくなっちゃうよ/);
});

test("No.139: clear removes only current blocks with no message and preserves history",()=>{
 const clearLine=code.split("\n").find(line=>line.includes('overlay.querySelector(".room2-clear").onclick=()=>{'));
 assert.ok(clearLine,"The in-game clear handler must remain available");
 const clearBody=clearLine.slice(clearLine.indexOf("=>{")+3,clearLine.lastIndexOf("};"));
 for(const challengeActive of [false,true]){
  const originalHistory=[{guess:[{symbol:"〇",color:"赤"}],hit:1,blow:0}];
  const previousAnswer=[{symbol:"〇",color:"赤"}];
  const state={
   guess:[{symbol:"△",color:"青"},{symbol:"□",color:"赤"}],
   history:originalHistory,attempts:4,unlocked:challengeActive,
   challengeActive,answer:previousAnswer,leftmostHintRevealed:!challengeActive,
   challengeBest:3,run:2
  };
  const feedback={textContent:"この配置は判定済みです。"};
  const calls={saves:0,renders:0};
  const sandbox={
   room2State:state,feedback,selectedSlot:1,
   saveGame(){calls.saves++},render(){calls.renders++}
  };
  vm.runInNewContext("(()=>{"+clearBody+"})()",sandbox);
  assert.equal(state.guess.length,0,"All placed blocks should be removed");
  assert.equal(sandbox.selectedSlot,null);
  assert.equal(feedback.textContent,"","No clear confirmation or stale feedback should remain");
  assert.equal(state.history,originalHistory,"Existing judgment history must not be reset");
  assert.equal(state.attempts,4,"Used attempts must not change");
  assert.equal(state.answer,previousAnswer,"Answer remains unchanged");
  assert.equal(state.leftmostHintRevealed,!challengeActive);
  assert.equal(state.challengeBest,3,"Challenge records stay intact");
  assert.deepEqual(calls,{saves:1,renders:1});
 }
 assert.doesNotMatch(code,/配置をクリアしました。/);
 for(const text of [chapter,full]){
  assert.ok(text.includes("【校閲No.139・案3 採用】"));
  assert.ok(text.includes("説明文は表示しない"));
 }
});

test("No.140: repeated answer displays only a concise notice and consumes no attempt",()=>{
 const start=code.indexOf("if(room2HasSubmittedGuess(room2State.guess,room2State.history)){");
 const end=code.indexOf("const result=room2Evaluate(",start);
 assert.ok(start>=0&&end>start,"Repeated-answer guard is present before evaluation");
 const guard=code.slice(start,end);
 const guess=[
  {symbol:"〇",color:"赤"},
  {symbol:"△",color:"青"},
  {symbol:"□",color:"赤"},
  {symbol:"×",color:"青"},
  {symbol:"＋",color:"赤"}
 ];
 const state={guess,history:[{guess:guess.map(x=>({...x})),hit:1,blow:2}],attempts:4,unlocked:false};
 const feedback={textContent:"以前の案内"};
 const sandbox={room2State:state,feedback};
 vm.runInNewContext(code+";this.__guard=()=>{"+guard+"return 'fresh';};",sandbox);
 const result=sandbox.__guard();
 assert.equal(result,undefined,"Duplicate submission exits without evaluation");
 assert.equal(feedback.textContent,"この配置は判定済みです。");
 assert.equal(state.attempts,4,"Duplicate answer does not consume an attempt");
 assert.equal(state.history.length,1,"Duplicate answer does not append history");
 assert.equal(state.guess,guess,"Blocks do not move");
 assert.ok(end>start,"Only fresh guesses reach room2Evaluate");
 feedback.textContent="";
 state.guess=guess.map((x,i)=>i===0?{...x,color:"青"}:x);
 assert.equal(sandbox.__guard(),"fresh","Changed arrangement may be evaluated");
 assert.equal(feedback.textContent,"","No duplicate warning for fresh guesses");
 assert.doesNotMatch(code,/ブロックを動かしてから解答してください/);
 for(const text of [chapter,full]){
  assert.ok(text.includes("【校閲No.140・案2 採用】"));
  assert.ok(text.includes("「この配置は判定済みです。」"));
 }
});

test("No.124: manuscript, combined manuscript and runtime agree on the adopted behavior",()=>{
 for(const text of [chapter,full]){
  assert.match(text,/【校閲No\.124・案1 採用】/);
  assert.match(text,/【校閲No\.125・案1 採用】/);
  assert.match(text,/通知は表示しない/);
  assert.match(text,/確認文を挟まず、そのまま/);
  assert.match(text,/次の部屋へ向かう/);
  assert.match(text,/もう少し調べる/);
  assert.match(text,/【校閲No\.131・案1 採用】/);
  assert.match(text,/【校閲No\.132・案1 採用】/);
  assert.match(text,/【校閲No\.133・案2 採用】/);
  assert.match(text,/探索画面への新たな「次へ」ボタンや探索メニュー内の移動項目は追加しない/);
 }
 assert.doesNotMatch(code,/room2_transition_stay/);
 assert.doesNotMatch(code,/まだ何か調べられるかもしれない。/);
 assert.doesNotMatch(code,/room2_next_door_01/);
 assert.match(code,/room2_room3_transition_01/);
 assert.match(code,/room2_room3_transition_02/);
});
