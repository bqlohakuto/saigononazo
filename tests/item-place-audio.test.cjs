const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8'),r2=read('room2.js'),r4=read('room4.js'),late=read('late-game.js');
test('token placement sounds on real placement, move and swap, never invalid or identical drops',()=>{
 const sounds=[],ctx={ROOM2_SYMBOLS:['A','B'],ROOM2_COLORS:['red','blue'],room2State:{guess:Array(5).fill(null)},GameAudio:{play:id=>sounds.push(id)},feedback:{},saveGame(){},render(){}};
 const a=r2.indexOf('  const dropToken='),b=r2.indexOf('  const attachDrag=',a);vm.runInNewContext(r2.slice(a,b)+';this.drop=dropToken;',ctx);
 ctx.drop({symbol:'bad',color:'red'},0);ctx.drop({symbol:'A',color:'red'},-1);assert.deepEqual(sounds,[]);
 ctx.drop({symbol:'A',color:'red'},0);ctx.drop({symbol:'A',color:'red'},0,0);assert.equal(sounds.length,1);
 ctx.drop({symbol:'B',color:'blue'},1);ctx.drop({symbol:'A',color:'red'},1,0);assert.equal(sounds.length,3);
 assert.equal(ctx.room2State.guess[0].symbol,'B');assert.equal(ctx.room2State.guess[1].symbol,'A');
});
test('glass pane sounds only on mounting, not rotation or an unowned pane',()=>{
 const sounds=[],state={pane:true,mountedPanels:[false]},button={dataset:{i:'0'},classList:{add(){}},setAttribute(){}};
 const ctx={room4State:state,R4_PANEL_KEYS:['pane'],r4Mounted:i=>state.mountedPanels[i],GameAudio:{play:id=>sounds.push(id)},grid:{querySelectorAll:()=>[button]},stackImages:[{}],fb:{},drawLinks(){},r4Projection(){},saveGame(){},rotatePanes(){}};
 const a=r4.indexOf(' grid.querySelectorAll(".r4-rotate-plate")'),b=r4.indexOf(' stack.onclick=',a);vm.runInNewContext(r4.slice(a,b),ctx);
 button.onclick();button.onclick();assert.deepEqual(sounds,['itemPlace']);state.pane=false;button.onclick();assert.equal(sounds.length,1);
});
test('panel placement sounds only after all placement gates accept a panel',()=>{
 for(const invalid of [null,'busy','complete','occupied','unselected','unowned','already']){
  const sounds=[],board={codeRevealed:invalid==='complete',collected:invalid==='unowned'?[]:['tile'],placed:invalid==='already'?{tile:'other'}:{}};
  const ctx={valid:()=>invalid!=='busy',completionPlaying:false,feedback:{},boardState:board,R5_ART_COUNTER:{slot:true},placedAt:()=>invalid==='occupied',selected:invalid==='unselected'?null:'tile',r5PlacedCount:()=>2,reduced:()=>true,GameAudio:{play:id=>sounds.push(id)},saveGame(){},drawSlots(){},drawTray(){},r5RefreshWall(){},grid:{querySelector:()=>null},tray:{querySelector:()=>null},panel:{querySelector:()=>null},say(){},line(){},r5ButterflyHintIfNeeded(){}};
  const a=late.indexOf('    function place(counter){'),b=late.indexOf('    const help=panel.querySelector',a);vm.runInNewContext(late.slice(a,b),ctx);ctx.place('slot');assert.deepEqual(sounds,invalid?[]:['itemPlace']);
 }
});
