"use strict";
// G04: static coverage of the first-time final-name deduction.
// A human blind playthrough remains necessary for difficulty and comprehension.
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.join(__dirname,"..");
const read=name=>fs.readFileSync(path.join(root,name),"utf8");
const late=read("late-game.js");
const scenarios=["scenario.js","room2-flashback.js","room3.js","room4.js","room4-scenario.js", "late-game.js"];
const sources=scenarios.map(name=>name==="late-game.js"
  ? late.replace(/  const R8_FINAL_LOG_IDS=\[[\s\S]*?\];/,"")
  : read(name));
const match=late.match(/  const R8_FINAL_LOG_IDS=\[([\s\S]*?)\];/);
const clueIds=match?[...match[1].matchAll(/"([^"]+)"/g)].map(m=>m[1]):[];
const pairs=[
 ["room1_poster_03","room1_piano_introduction_02"],
 ["room2_memory_053_flower_01","room2_memory_003"],
 ["room3_flashback_34","room3_final_ringtone"],
 ["r4_final_zodiac_flowers","r4f01"],
 ["r5_final_flower","r5_final_humming"],
 ["r6_final_lavender","r6_final_signal"],
 ["r7_final_pressed_flower","r7_final_bremen"]
];

test("G04: every remembered room has an existing flower/sound pair in the saved-log sources",()=>{
  assert.ok(match,"Final-log clue IDs are defined");
  for(const [flower,sound] of pairs){
    for(const id of [flower,sound]){
      assert.ok(clueIds.includes(id),"Final clue list includes "+id);
      assert.ok(sources.some(source=>source.includes(id)),"A discoverable source log exists for "+id);
    }
  }
  assert.equal(new Set(clueIds).size,clueIds.length,"No clue ID is duplicated");
});

test("G04: the first concert offers flower before music as a natural ordering hint",()=>{
  assert.ok(read("scenario.js").includes("世界に一つだけの花、ドレミのうた"));
});

test("G04: the name is not stated on the final paper and record emphasis requires reading its back",()=>{
  const start=late.indexOf("  function r8Paper(){");
  const end=late.indexOf("    game.appendChild(o);",start);
  assert.ok(start>=0&&end>start);
  assert.doesNotMatch(late.slice(start,end),/花音/,"The visible paper must not spell the answer");
  assert.match(late,/function r8IsFinalClue\(entry\)\{\s*\/\/[^\n]*\n\s*if\(!room8State\.backSeen\)return false;/);
  const design=read("design-ui.js");
  const records=design.slice(design.indexOf("  function records(){"),design.indexOf("  function inferRoom(e){"));
  assert.doesNotMatch(records,/花音/,"The record navigation must not directly label the final answer");
});

test("G04: the last answer still accepts kanji, hiragana and katakana forms without auto-solving",()=>{
  assert.ok(late.includes('["花音","かのん","カノン"].includes(value)'));
  assert.ok(late.includes('room8State.solved=true;saveGame();r8SolvedDialogue()'));
});

test("G04: marked lines become directly selectable only after reading the paper back",()=>{
  const script=read("design-ui.js");
  const start=script.indexOf("      const groups=[];",script.indexOf("  function records(){"));
  const end=script.indexOf("      rows=",start);
  assert.ok(start>0&&end>start,"Use the record UI's actual grouping algorithm");
  const grouping=script.slice(start,end);
  const entries=[
    {id:"before1",room:"room03",group:"memory",type:"dialogue",text:"The start"},
    {id:"before2",room:"room03",group:"memory",type:"dialogue",text:"Another memory"},
    {id:"flower",room:"room03",group:"memory",type:"dialogue",text:"The flower clue"},
    {id:"middle",room:"room03",group:"memory",type:"dialogue",text:"The following memory"},
    {id:"sound",room:"room03",group:"memory",type:"dialogue",text:"The sound clue"},
    {id:"after",room:"room03",group:"memory",type:"dialogue",text:"The end"}
  ];
  function group(backSeen){
    const ctx={entries,recordRoom:"room03",inferRoom:e=>e.room,legacyGroup:id=>id,
      clue:e=>backSeen&&(e.id==="flower"||e.id==="sound")};
    return vm.runInNewContext(grouping+"\ngroups;",ctx);
  }
  const hidden=group(false);
  assert.equal(hidden.length,1,"Keep original conversation grouping before the final hint");
  assert.equal(hidden[0].entries.length,6);
  const visible=group(true);
  assert.deepEqual(Array.from(visible,row=>row.entries.map(e=>e.id).join(",")),
    ["before1,before2","flower","middle","sound","after"],
    "Every marked sentence has its own directly selectable record, preserving order");
});
