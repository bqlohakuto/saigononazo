const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
function harness(state={},logs=[]){
 const script=fs.readFileSync(path.join(root,'script.js'),'utf8');
 const split=script.slice(script.indexOf('function splitIntoSentences('),script.indexOf('function showTitle('));
 let dialog,saves=0;
 // Memory progress updates a light overlay; give the unit harness a minimal DOM.
 const stage={light:null,querySelector(){return this.light},appendChild(node){this.light=node}};
 const document={createElement(){return {dataset:{},setAttribute(){},remove(){stage.light=null}}}};
 const context=vm.createContext({game:stage,document,GameLog:{list:()=>logs},saveGame(){saves++},showRoomDialog(lines,complete,display,options){dialog={lines,complete,options}}});
 vm.runInContext(split+'\n'+fs.readFileSync(path.join(root,'room3.js'),'utf8'),context);
 context.room3State={unlocked:true,memorySeen:false,...state};
 return {context,get dialog(){return dialog},get saves(){return saves},run:code=>vm.runInContext(code,context)};
}
test('Room 3 retains the displayed sentence and inner page through save serialization',()=>{
 const h=harness();h.run('playThirdRoomMemory()');
 h.dialog.options.onProgress({logId:'room3_flashback_61_03',uiPage:1});
 const saved=JSON.parse(JSON.stringify(h.context.room3State));
 const loaded=harness(saved);loaded.run('playThirdRoomMemory()');
 assert.equal(loaded.dialog.options.resume.logId,'room3_flashback_61_03');
 assert.equal(loaded.dialog.options.resume.uiPage,1);
 assert.equal(loaded.context.room3State.memorySeen,false);
});
test('Legacy Room 3 memory and aftermath saves recover despite load notices',()=>{
 for(const id of ['room3_flashback_05_01','room3_flashback_36_01','room3_after_05_01']){
  const h=harness({},[{id:'room3_flashback_01_01'},{id},{id:'room3_resumed'}]);
  h.run('playThirdRoomMemory()');
  assert.equal(h.dialog.options.resume.logId,id);
  assert.equal(h.dialog.options.resume.uiPage,0);
 }
});
test('Unknown cursor IDs and malformed pages recover safely; completed or locked memories do not resume',()=>{
 const h=harness({memoryProgress:{logId:'deleted-line',uiPage:99}},[{id:'room3_flashback_05_01'}]);
 assert.equal(h.run('room3SavedMemoryProgress()').logId,'room3_flashback_05_01');
 for(const uiPage of [-1,1.5,'2',null]){
  h.context.room3State.memoryProgress={logId:'room3_flashback_05_01',uiPage};
  assert.equal(h.run('room3SavedMemoryProgress()').uiPage,0);
 }
 h.context.room3State.memorySeen=true;assert.equal(h.run('room3SavedMemoryProgress()'),null);
 h.context.room3State.memorySeen=false;h.context.room3State.unlocked=false;assert.equal(h.run('room3SavedMemoryProgress()'),null);
 assert.equal(harness().run('room3SavedMemoryProgress()'),null);
});
test('Only completing the entire memory and return conversation clears the cursor',()=>{
 const h=harness({memoryProgress:{logId:'room3_after_05_01',uiPage:0}});
 h.run('playThirdRoomMemory()');
 assert.equal(h.context.room3State.memorySeen,false);
 assert.equal(h.saves,0);
 h.dialog.complete();
 assert.equal(h.context.room3State.memorySeen,true);
 assert.equal(h.context.room3State.memoryProgress,undefined);
 assert.equal(h.saves,1);
 h.run('playThirdRoomMemory()');assert.equal(h.saves,1);
});
