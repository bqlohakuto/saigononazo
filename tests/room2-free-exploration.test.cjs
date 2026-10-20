"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const root=path.join(__dirname,"..");
const source=fs.readFileSync(path.join(root,"room2.js"),"utf8");
const chapter=fs.readFileSync(path.join(root,"scenario","02_room2.md"),"utf8");
const complete=fs.readFileSync(path.join(root,"scenario","FULL_SCENARIO.md"),"utf8");

function makeRoom(){
 const blocks={disabled:true};
 const calls={dialog:[],notice:[],saves:0};
 const sandbox={
  room2State:{doorInspected:false,deskInspected:false,unlocked:false},
  document:{getElementById(id){
   if(id!=="r2Blocks")throw new Error("Unexpected object: "+id);
   return blocks;
  }},
  saveGame(){calls.saves++;},
  showRoomDialog(lines){calls.dialog.push(Array.from(lines,line=>line.logId));},
  showRoomNotice(message,id){calls.notice.push({message,id});}
 };
 vm.runInNewContext(source+"\nthis.__inspectSecondRoomDesk=inspectSecondRoomDesk;this.__inspectSecondRoomDoor=inspectSecondRoomDoor;",sandbox);
 return {sandbox,blocks,calls};
}

test("No.110: desk can be inspected first without marking door inspected",()=>{
 const {sandbox,blocks,calls}=makeRoom();
 sandbox.__inspectSecondRoomDesk();
 assert.equal(sandbox.room2State.doorInspected,false);
 assert.equal(sandbox.room2State.deskInspected,true);
 assert.equal(blocks.disabled,false);
 assert.equal(calls.dialog.length,1,"Desk inspection dialogue is preserved");
 assert.equal(calls.notice.length,0,"No gate notice or forced door event");
 assert.ok(calls.saves>=1,"Desk inspection is saved");
});

test("No.110: examining door before desk remains supported",()=>{
 const {sandbox,blocks,calls}=makeRoom();
 sandbox.__inspectSecondRoomDoor();
 assert.equal(sandbox.room2State.doorInspected,true);
 assert.equal(sandbox.room2State.deskInspected,false);
 sandbox.__inspectSecondRoomDesk();
 assert.equal(sandbox.room2State.deskInspected,true);
 assert.equal(blocks.disabled,false);
 assert.equal(calls.dialog.length,2);
 assert.equal(calls.notice.length,0);
});

test("No.110: chapter and full manuscript preserve unrestricted order",()=>{
 for(const passage of [chapter,complete]){
  assert.match(passage,/【校閲No\.110・案1 採用】/);
  assert.match(passage,/扉と机をどちらからでも調査できる/);
 }
 assert.doesNotMatch(source,/room2_desk_locked|まずは正面の扉を調べよう/);
});
