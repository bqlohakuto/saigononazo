"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const src = fs.readFileSync(path.join(root, "room2-after-flashback.js"), "utf8");
const sandbox = {};
vm.runInNewContext(src + "\nthis.lines = room2AfterFlashbackContent;", sandbox);
const lines = Array.from(sandbox.lines, x => ({id:x.logId,speaker:x.speaker,text:x.text}));

test("flashback return preserves its 17 stable log IDs for resumed saves", () => {
  assert.equal(lines.length, 17);
  assert.deepEqual(lines.map(x=>x.id), Array.from({length:17},(_,i)=>"room2_after_memory_"+String(i+1).padStart(3,"0")));
  assert.equal(lines[0].text, "視界が、ゆっくりと元の部屋へ戻っていく。");
  assert.equal(lines[2].text, "ガチャッ。");
});

test("second memory progresses from an unidentified senior to recognized affection, not Hana's identity", () => {
  const words=lines.map(x=>x.text);
  const missing=words.indexOf("あの先輩のこと、まだ思い出せないんです");
  const feeling=words.indexOf("でも、会えなくなるのが嫌だった。その気持ちは、はっきり覚えていて……");
  const response=words.indexOf("きっと、すごく大切な人だったんだね");
  assert.ok(missing>0 && missing<feeling && feeling<response);
  assert.ok(!words.some(x=>x.includes("ハナさんって、もしかして")));
  assert.ok(words.includes("うん。一緒に探していこう"));
});

test("standalone and full manuscripts match the new dialogue and omit the retired exchange", () => {
  for(const name of ["scenario/02_room2.md","scenario/FULL_SCENARIO.md"]){
    const md=fs.readFileSync(path.join(root,name),"utf8");
    const scene=md.split("### 回想終了・現在の部屋へ")[1].split("## 開錠後")[0];
    for(const x of lines.slice(4)) assert.ok(scene.includes(x.text), name+" missing "+x.id);
    assert.ok(!scene.includes("ハナさんって、もしかして"), name+" has the retired revelation cue");
  }
});

test("game calls the existing room 2 return scene and busts cache for its new text",()=>{
  const room=fs.readFileSync(path.join(root,"room2.js"),"utf8");
  const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
  assert.ok(room.includes("...room2AfterFlashbackContent.map"));
  const version=(html.match(/href="style\.css\?v=(\d{8}-[a-z0-9-]+)"/)||[])[1];
  assert.ok(version, "shared asset cache version must exist");
  assert.ok(html.includes(`room2-after-flashback.js?v=${version}`));
});
