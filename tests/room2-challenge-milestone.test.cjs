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
const sandbox={};
vm.runInNewContext(code+"\nthis.__getReaction=room2JudgeReactionLines;this.__dialogues=ROOM2_DIALOGUES;this.__getMilestone=room2MilestoneLines;",sandbox);
const reaction=(hit,blow,attempt,challenge)=>Array.from(sandbox.__getReaction({hit,blow},attempt,challenge),line=>({speaker:line.speaker,text:line.text,logId:line.logId}));
const expected=new Map([
 [4,[["ハナ","あと4回だね。焦らずいこう！"],["主人公","はい。今までの判定を整理してみます"]]],
 [6,[["ハナ","あと2回……！　結果を見直してみよう"],["主人公","……そうですね。慎重に考えます"]]],
 [7,[["ハナ","あと1回……！　落ち着いていこう"],["主人公","はい。今までの結果を見直します"]]]
]);

test("No.115: challenge attempts four, six and seven replace normal judgement with just two special lines",()=>{
 for(const [attempt,lines] of expected){
  for(const [hit,blow] of [[0,0],[1,1],[3,0],[4,0]]){
   const shown=reaction(hit,blow,attempt,true);
   assert.equal(shown.length,2,"Only two combined lines should be displayed");
   assert.deepEqual(shown.map(row=>[row.speaker,row.text]),lines);
   assert.deepEqual(shown.map(row=>row.logId),["room2_attempt_"+attempt+"_0","room2_attempt_"+attempt+"_1"]);
   assert.ok(!shown.some(row=>row.logId.includes("judge")),"The regular judgement must not be appended");
  }
 }
});

test("No.115: ordinary turns and all main-story results retain their original two judgement lines",()=>{
 for(const challenge of [false,true]){
  for(const attempt of [1,2,3,4,5,6,7,8]){
   if(challenge&&expected.has(attempt))continue;
   const result=reaction(2,1,attempt,challenge);
   assert.equal(result.length,2);
   assert.deepEqual(result.map(line=>line.text),Array.from(sandbox.__dialogues["2H"][1]));
   assert.deepEqual(result.map(line=>line.speaker),["ハナ","主人公"]);
   assert.ok(result.every(line=>line.logId.startsWith("room2_judge_"+attempt+"_")));
  }
 }
});

test("No.115: the success path takes precedence and the eighth unsuccessful attempt still finishes the challenge",()=>{
 const success=code.indexOf("if(result.hit===5){");
 const reactions=code.indexOf("const reaction=(specialTurn||!alreadyShown)?room2JudgeReactionLines");
 assert.ok(success>=0&&reactions>success,"A correct fifth HIT bypasses milestone text");
 assert.match(code,/pendingResolution=result.hit===5/);
 assert.match(code,/const challengeFailed=isChallenge&&room2State.attempts>=8;/);
 assert.match(code,/showReaction\(reaction,challengeFailed\?finishPendingResolution:null\)/);
 assert.equal(reaction(1,2,8,true).length,2);
});

test("No.115: standalone and full manuscripts contain exact approved milestone lines",()=>{
 for(const text of [chapter,full]){
  assert.match(text,/【校閲No\.115・案1 採用】/);
  assert.match(text,/4・6・7回目の不正解時は通常の判定会話を追加せず/);
  for(const [turn,lines] of expected){
   assert.ok(text.includes(turn+"回目・不正解"),"Missing turn "+turn);
   for(const [,line] of lines)assert.ok(text.includes("「"+line+"」"),"Missing actual milestone line");
  }
 }
});
