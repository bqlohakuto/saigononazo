// npm install jsdom; node tests/late-game-flow.test.cjs
const {JSDOM}=require(process.env.JSDOM_PATH||'jsdom');
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');

(async()=>{
  const root=path.join(__dirname,'..');
  const dom=new JSDOM('<div id="game-container"><div id="game"></div></div>',{
    url:'https://game.test/',runScripts:'outside-only',pretendToBeVisual:true
  });
  const w=dom.window,ctx=dom.getInternalVMContext();
  w.matchMedia=query=>({matches:query.includes('prefers-reduced-motion'),addEventListener(){}});
  w.scrollTo=()=>{};
  w.HTMLCanvasElement.prototype.getContext=()=>null;
  w.HTMLElement.prototype.scrollIntoView=function(){};

  for(const [,file] of fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script src="([^?]+)\?/g)){
    vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
  }

  const run=code=>vm.runInContext(code,ctx);
  const q=s=>w.document.querySelector(s);
  const click=s=>{const el=q(s);assert.ok(el,'control exists: '+s);el.click();};
  const save=()=>JSON.parse(w.localStorage.getItem('saigononazo-save-v1'));
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  function finish(){
    for(let n=0;n<800&&q('#roomNextButton');n++)click('#roomNextButton');
    assert.equal(q('#roomNextButton'),null,'dialogue should finish');
  }

  // Room 6: authored board, live map, legal Othello and late-game transition.
  click('#testRoomButton');click('[data-room="room06"]');finish();
  assert.equal(save().currentScene,'room06');
  assert.equal(q('.r6-scene').dataset.color,'white');
  assert.equal(q('.r6-map'),null,'map not revealed before handoff');
  assert.equal(w.document.querySelectorAll('[data-dest]').length,2,'A8 has only north/east exits');
  const initial=save().rooms.room06.board;
  assert.equal(initial.length,64);
  assert.deepEqual(['W','G','E'].map(c=>initial.filter(v=>v===c).length),[40,15,9]);
  for(const id of ['A7','A6','A5','A4','A3']){click('[data-dest="'+id+'"]');finish();}
  assert.equal(save().rooms.room06.interview4,true);
  assert.equal(save().rooms.room06.mapEvent,true,'map granted at sixth room including A8');
  assert.equal(w.document.querySelectorAll('[data-cell]').length,6,'unvisited rooms are absent');
  click('[data-cell="A8"]');assert.equal(q('.r6-scene').dataset.current,'A8');
  assert.equal(save().rooms.room06.visited.length,6,'fast travel does not count as new exploration');
  click('[data-dest="B8"]');finish();assert.equal(q('.r6-scene').dataset.color,'black');
  click('[data-dest="C8"]');finish();assert.equal(q('.r6-scene').dataset.color,'green');
  assert.ok(q('#r6White'));assert.equal(save().rooms.room06.greenSeen,true);
  run('showSixthRoom({introSeen:true,visited:["A8","A1","H1","H8","D1","B8"],current:"H8",interview4:true,mapEvent:true})');
  click('[data-dest="H7"]');finish();
  assert.equal(save().rooms.room06.othelloKnown,true);
  const ids=Array.from({length:64},(_,i)=>String.fromCharCode(65+i%8)+(Math.floor(i/8)+1));
  run('showSixthRoom('+JSON.stringify({introSeen:true,visited:ids,current:'D1',interview4:true,mapEvent:true,othelloKnown:true,mapComplete:true})+')');
  click('#r6Black');finish();assert.equal(save().rooms.room06.moves.length,0,'wrong turn does not modify board');
  click('#r6White');finish();assert.equal(q('.r6-scene').dataset.color,'white');
  assert.equal(q('.r6-lever').dataset.state,'white');
  click('#r6Undo');assert.deepEqual(save().rooms.room06.board,initial,'UNDO restores floor colors');
  click('#r6White');finish();click('#r6Reset');assert.deepEqual(save().rooms.room06.board,initial,'RESET restores initial board');
  const route=['D1','H4','D2','G5','G6','G3','C8','C2','H2'];
  for(let i=0;i<route.length;i++){
    if(q('.r6-scene').dataset.current!==route[i])click('[data-cell="'+route[i]+'"]');
    click(i%2===0?'#r6White':'#r6Black');finish();
    if(i===3){const saved=save().rooms.room06;run('showSixthRoom('+JSON.stringify(saved)+')');assert.deepEqual(save().rooms.room06.board,saved.board,'save/load retains flips and map');}
  }
  assert.equal(save().rooms.room06.completed,true);
  assert.ok(save().rooms.room06.board.every(c=>c==='W'));
  assert.ok(q('#r6Next'));

  // Room 7: books -> zodiac doors -> accident memory.
  click('#r6Next');await wait(720);
  assert.equal(save().currentScene,'room07');
  finish();
  const turn=view=>{for(let i=0;i<4&&save().rooms.room07.view!==view;i++)click('#r7TurnRight')};
  for(const [view,target]of [['left','r7Drawer'],['left','r7Curtain'],['left','r7Diary'],['right','r7Stack'],['right','r7Box'],['front','r7Cabinet']]){
    turn(view);click('#'+target);if(q('#r7SearchAction'))click('#r7SearchAction');click('#r7Take');finish();
  }
  turn('back');click('#r7Shelf');finish();
  for(const [id,slot]of [['ikkyu',1],['rabbit',2],['wolf',3],['monkey',5],['mitten',7],['bremen',8]]){click('[data-held="'+id+'"]');click('[data-slot="'+slot+'"]')}
  finish();assert.equal(save().rooms.room07.booksSolved,true);
  click('#r7Shelf');for(const slot of [1,2,3,5,7,8]){click('[data-slot="'+slot+'"]');finish();click('#r7BackShelf')}click('.r7-overlay .device-close');
  turn('front');click('#r7Door');finish();
  for(const zodiac of ['寅','卯','未','申','亥','酉']){
    click('#r7Dial');for(let i=0;i<12&&save().rooms.room07.selectedZodiac!==zodiac;i++)click('#r7RotateLeft');click('#r7DialDone');finish();
  }
  assert.equal(save().rooms.room07.completed,true);
  assert.equal(q('#r7Next'),null,'accident continues directly into room 8');

  // Room 8: final conversation -> real LOG highlights -> name -> ending.
  assert.equal(save().currentScene,'room08');
  await wait(100);finish();
  assert.equal(save().rooms.room08.puzzleReady,true);
  click('#r8Paper');click('#r8Back');click('.device-close');
  await wait(0);
  [...w.document.querySelectorAll('.gameplay-hud-actions button')].find(b=>b.textContent==='記録').click();
  click('.design-tabs [data-room="room07"]');
  click('.design-tabs [data-category="investigation"]');
  assert.ok(w.document.querySelectorAll('.design-record.final-clue').length>=1,'actual room-seven clues are highlighted in the current record UI');
  click('.design-panel header button');
  click('#r8Paper');
  q('#r8Answer').value='花音';
  click('#r8Submit');finish();
  assert.equal(save().rooms.room08.solved,true);
  assert.equal(save().rooms.room08.finalTalkSeen,true);
  click('#r8FinalDoor');finish();
  assert.equal(save().rooms.room08.ended,true);
  await wait(700);
  assert.ok(q('#roomNextButton'),'epilogue follows the final door');
  finish();
  assert.equal(save().rooms.room08.epilogueSeen,true);
  assert.ok(q('.ending-pc-transition'),'epilogue connects to credits');

  console.log('PASS: Room 6 live-map/legal-Othello -> Room 7 zodiac -> Room 8 final puzzle -> END.');
  await wait(30);dom.window.close();
})().catch(e=>{console.error(e);process.exitCode=1});
