const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),r2=fs.readFileSync(path.join(root,'room2.js'),'utf8').replace(/\r/g,''),late=fs.readFileSync(path.join(root,'late-game.js'),'utf8');
const list={remove(){},add(){}};
function room2(){
 const sounds=[],timers=[];const ctx={GameAudio:{play:id=>sounds.push(id)},isChallenge:false,pendingMemo:false,pendingResolution:null,room2State:{guess:Array(5).fill({symbol:'x',color:'red'}),answer:[],history:[],attempts:0},overlay:{isConnected:true,querySelector:()=>({classList:list})},feedback:{},room2HasSubmittedGuess:()=>false,room2Evaluate:()=>({hit:5,blow:0}),digital:{classList:list},digitalHit:{},digitalBlow:{},saveGame(){},render(){},window:{setTimeout(fn,ms){timers.push({fn,ms});return timers.length;}}};
 const marker='overlay.querySelector(".room2-submit").addEventListener("click",()=>{',a=r2.indexOf(marker)+marker.length,b=r2.indexOf('\n });\n render();',a);assert(a>=marker.length&&b>a);
 vm.runInNewContext('this.submit=()=>{'+r2.slice(a,b)+'\n};',ctx);return {ctx,sounds,timers};
}
test('room-two lever is silent for incomplete, duplicate, busy and exhausted submissions',()=>{
 for(const invalid of ['incomplete','duplicate','busy','resolution','exhausted']){
  const h=room2();if(invalid==='incomplete')h.ctx.room2State.guess=[];
  if(invalid==='duplicate')h.ctx.room2HasSubmittedGuess=()=>true;
  if(invalid==='busy')h.ctx.pendingMemo=true;
  if(invalid==='resolution')h.ctx.pendingResolution=()=>{};
  if(invalid==='exhausted'){h.ctx.isChallenge=true;h.ctx.room2State.attempts=8;}
  h.ctx.submit();assert.deepEqual(h.sounds,[]);assert.equal(h.timers.length,0);
 }
});
test('room-two lever plays once before the unchanged 340ms result and a repeat is ignored',()=>{
 const h=room2();h.ctx.submit();assert.deepEqual(h.sounds,['leverPull']);assert.equal(h.ctx.room2State.attempts,1);
 h.ctx.submit();assert.deepEqual(h.sounds,['leverPull']);
 const display=h.timers.find(t=>t.ms===340);assert(display);display.fn();assert.deepEqual(h.sounds,['leverPull','answerCorrect']);
});
test('room-six accepted moves play once including reduced motion; rejected moves stay silent',()=>{
 for(const reduced of [true,false])for(const invalid of [null,'busy','completed','unknown','limit','turn','illegal']){
  const sounds=[],ctx={room6State:{completed:invalid==='completed',othelloKnown:invalid!=='unknown',moves:invalid==='limit'?Array(9).fill({}):[],board:['E'],current:'A1'},r6Busy:()=>invalid==='busy',r6Place:()=>invalid==='illegal'?null:['W'],GameAudio:{play:id=>sounds.push(id)},showRoomDialog(){},line(){},saveGame(){},renderR6(){},window:{matchMedia:()=>({matches:reduced})},r6Index:()=>0,r6Color:()=>'',game:{querySelector:()=>null,querySelectorAll:()=>[]},r6FlipGeneration:0,setTimeout(){}};
  vm.runInNewContext(late.slice(late.indexOf('  function r6Move('),late.indexOf('  const R6_MEMORY_AND_AFTER=')),ctx);
  ctx.r6Move(invalid==='turn'?'G':'W');assert.deepEqual(sounds,invalid?[]:['leverPull']);
 }
});
