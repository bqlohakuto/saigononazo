const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'../late-game.js'),'utf8');
function harness(start,end){
 const nodes=new Map(),sounds=[],digits=Array.from({length:10},(_,i)=>({dataset:{digit:String(i)}}));
 const overlay={isConnected:true,remove(){this.isConnected=false},querySelector(selector){if(!nodes.has(selector))nodes.set(selector,{});return nodes.get(selector)},querySelectorAll(){return digits}};
 const state={codeRevealed:true,doorUnlocked:false};
 const ctx={document:{createElement:()=>overlay},game:{appendChild(){}},activateDeviceModal(){},room5State:state,room8State:{},GameAudio:{play:id=>sounds.push(id)},saveGame(){},showRoomDialog(){},renderR5(){},line(){},r8ArmLogHint(){},r8SolvedDialogue(){}};
 vm.runInNewContext(code.slice(code.indexOf('  function '+start+'('),code.indexOf('  '+end)),ctx);
 return {ctx,nodes,sounds,digits,overlay,state};
}
test('keypad judges complete answers once; incomplete entry and a restored solved keypad stay silent',()=>{
 const h=harness('r5Keypad','function r5RabbitMemoryStart(');h.ctx.r5Keypad();
 const enter=h.nodes.get('[data-key="enter"]');enter.onclick();assert.deepEqual(h.sounds,[]);
 for(const n of [1,1,1,1])h.digits[n].onclick();enter.onclick();assert.deepEqual(h.sounds,['answerIncorrect']);
 for(const n of [8,1,9,4])h.digits[n].onclick();enter.onclick();assert.deepEqual(h.sounds,['answerIncorrect','answerCorrect']);assert.equal(h.state.doorUnlocked,true);assert.equal(h.overlay.isConnected,false);
 h.ctx.r5Keypad();assert.equal(h.sounds.length,2);
});
test('last answer plays incorrect only for a real wrong answer and keeps all accepted names quiet',()=>{
 for(const name of ['花音','かのん','カノン']){
  const h=harness('r8Paper','// G01:');h.ctx.r8Paper();const input=h.overlay.querySelector('#r8Answer'),submit=h.nodes.get('#r8Submit');
  input.value=' ';submit.onclick();assert.deepEqual(h.sounds,[]);
  input.value='wrong';submit.onclick();assert.deepEqual(h.sounds,['answerIncorrect']);
  input.value=name;submit.onclick();assert.deepEqual(h.sounds,['answerIncorrect']);assert.equal(h.ctx.room8State.solved,true);
 }
});
