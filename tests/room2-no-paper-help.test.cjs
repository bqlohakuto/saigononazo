"use strict";

const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const script=fs.readFileSync(path.join(root,"room2.js"),"utf8");
const chapter=fs.readFileSync(path.join(root,"scenario","02_room2.md"),"utf8");
const full=fs.readFileSync(path.join(root,"scenario","FULL_SCENARIO.md"),"utf8");
const browserTest=fs.readFileSync(path.join(__dirname,"room2-visual.browser.cjs"),"utf8");

test("No.108: Room 2 uses optional question-mark help, not a collectible paper",()=>{
  assert.match(script,/<details class="room2-board-help">/);
  assert.match(script,/<summary title="操作方法・ルール" aria-label="操作方法・ルールを確認">？<\/summary>/);
  assert.match(script,/room2-board-help/);
  assert.doesNotMatch(script,/sheetFound|room2-hint-paper|ルール紙/);
  assert.match(browserTest,/Instructions can be revealed if requested/);
  assert.match(browserTest,/Help starts closed/);
  assert.match(browserTest,/Duplicated rules button is removed/);
  assert.doesNotMatch(browserTest,/sheetFound/);
});

test("No.108: chapter and full manuscript do not contain a paper discovery",()=>{
  const chapterInvestigation=chapter.split("## 調査")[1].split("## 判定後の会話")[0];
  assert.ok(chapterInvestigation,"Room 2 investigation chapter is available");
  assert.doesNotMatch(chapterInvestigation,/ルール紙|一枚の紙|「……紙？」|紙には、この謎のルール/);
  assert.match(chapterInvestigation,/ブロックと記録枠を調べる/);
  assert.match(chapterInvestigation,/「？」を押した場合のみ/);
  const part=full.split("<!-- source: scenario/02_room2.md -->")[1].split("<!-- source: scenario/02_room2_hit_blow.md -->")[0];
  assert.ok(part);
  assert.match(part,/【校閲No.108・案1 採用】/);
  assert.doesNotMatch(part,/ルール紙|一枚の紙|「……紙？」/);
});
