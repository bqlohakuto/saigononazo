const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../late-game.js'),'utf8');
function harness(first=true){
 const sounds=[],nodes=new Map(),dialogs=[];const state={booksSolved:true,firstBookOpened:first,placed:['bremen'],read:[]};
 const ctx={room7State:state,GameAudio:{play:id=>sounds.push(id)},r7Book:id=>id==='bremen'?{body:'text',animals:'animals'}:null,r7Asset:()=>'',r7Escape:x=>x,recordLog(){},saveGame(){},line:(logId)=>({logId}),showRoomDialog(lines,done,display){dialogs.push({lines,done,display})},r7Modal(){return {panel:{classList:{add(){},toggle(){return true}},querySelector(s){if(!nodes.has(s))nodes.set(s,{});return nodes.get(s)}},close(){}}},r7Shelf(){}};
 vm.runInNewContext(source.slice(source.indexOf('  function r7Read('),source.indexOf('  function r7DialMarkup(')),ctx);return {ctx,state,sounds,nodes,dialogs};
}
test('only valid opened books sound; zoom, shelf return and locked books do not',()=>{
 const h=harness();h.ctx.r7Read('missing');assert.deepEqual(h.sounds,[]);
 h.state.booksSolved=false;h.ctx.r7Read('bremen');assert.deepEqual(h.sounds,[]);
 h.state.booksSolved=true;h.state.placed=[];h.ctx.r7Read('bremen');assert.deepEqual(h.sounds,[]);
 h.state.placed=['bremen'];h.ctx.r7Read('bremen');assert.deepEqual(h.sounds,['bookPageTurn']);
 h.nodes.get('#r7Zoom').onclick({currentTarget:{setAttribute(){}}});h.nodes.get('#r7BackShelf').onclick();assert.equal(h.sounds.length,1);
});
test('first opening sounds at the cover-opening line, without doubling when the reader appears',()=>{
 const h=harness(false);h.ctx.r7Read('bremen');assert.equal(h.dialogs.length,1);assert.deepEqual(h.sounds,[]);
 const d=h.dialogs[0];d.display({logId:'r7_first_open_01'});assert.deepEqual(h.sounds,[]);
 d.display({logId:'r7_first_open_02'});assert.deepEqual(h.sounds,['bookPageTurn']);d.done();assert.equal(h.sounds.length,1);
 h.ctx.r7Read('bremen');assert.equal(h.sounds.length,2);
});
