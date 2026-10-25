const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../late-game.js'),'utf8');
test('both refrigerator doors choose the sound for their new state',()=>{
 const plays=[],stops=[],buttons={};let renders=0,saves=0;
 const ctx=vm.createContext({document:{getElementById:id=>buttons[id]??={}},room5State:{fridgeUpperOpen:false,fridgeLowerOpen:false},GameAudio:{play:id=>plays.push(id),stop:id=>stops.push(id)},saveGame:()=>saves++,renderR5:()=>renders++});
 for(const part of ['Upper','Lower']){
  const row=source.split('\n').find(row=>row.includes('document.getElementById("r5Fridge'+part+'").onclick='));
  assert.ok(row);vm.runInContext(row,ctx);
  buttons['r5Fridge'+part].onclick();buttons['r5Fridge'+part].onclick();
 }
 assert.deepEqual(plays,['fridgeOpen','fridgeClose','fridgeOpen','fridgeClose']);
 assert.deepEqual(stops,['fridgeClose','fridgeOpen','fridgeClose','fridgeOpen']);assert.equal(saves,4);assert.equal(renders,4);
});
test('only accepted room-six movement requests one three-step sound, including reduced motion',()=>{
 const plays=[];let busy=false;
 const state={current:'A8',visited:['A8'],edges:[],board:Array(64).fill('W'),seenColors:['W'],mapEvent:false};
 const ctx=vm.createContext({room6State:state,window:{matchMedia:()=>({matches:true})},GameAudio:{play:id=>plays.push(id)},r6Busy:()=>busy,r6Valid:id=>['A8','A7','B8'].includes(id),r6Neighbor:(a,b)=>a!==b,r6Index:()=>0,saveGame(){},renderR6(){},r6Arrival(){},r6CheckDiscovery(){},showRoomDialog(){},line(){},r6Interview4(){},r6MapEvent(){}});
 const begin=source.indexOf('  function r6Travel('),end=source.indexOf('  function r6Interview4(',begin);
 vm.runInContext(source.slice(begin,end),ctx);
 vm.runInContext("r6Visit('A8');r6Visit('invalid');r6Visit('A7',true)",ctx);assert.equal(plays.length,0);
 busy=true;vm.runInContext("r6Visit('A7')",ctx);assert.equal(plays.length,0);
 busy=false;vm.runInContext("r6Visit('A7')",ctx);assert.deepEqual(plays,['footsteps']);assert.equal(state.current,'A7');
 state.mapEvent=true;vm.runInContext("r6Visit('A8',true)",ctx);assert.deepEqual(plays,['footsteps','footsteps']);
});
