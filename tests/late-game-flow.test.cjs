// npm install jsdom; node tests/late-game-flow.test.cjs
const {JSDOM}=require(process.env.JSDOM_PATH||'jsdom');
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');

(async()=>{
  const root=path.join(__dirname,'..');
  // G02: only the records modal opts into native vertical/horizontal scrolling.
  const recordCss=fs.readFileSync(path.join(root,'design-ui.css'),'utf8');
  assert.match(recordCss, /design-panel\\[aria-label="記録"\\] \\.design-content\\{overflow-y:auto/, 'record list has native vertical scrolling');
  assert.match(recordCss, /design-panel\\[aria-label="記録"\\] \\.design-page\\{overflow-y:auto/, 'record detail can scroll when its text exceeds the viewport');
  assert.match(recordCss, /design-panel\\[aria-label="記録"\\] \\.design-tabs\\{[^}]*overflow-x:auto/, 'small landscape screens can swipe between room tabs');
  const dom=new JSDOM('<div id="game-container"><div id="game"></div></div>',{
    url:'https://game.test/?preview=1',runScripts:'outside-only',pretendToBeVisual:true
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
  click('#r6Next');
  assert.equal(save().currentScene,'room06','F10: door inspection does not immediately leave Room 6');
  finish();
  assert.ok(q('[data-r6-exit="proceed"]'),'F10: inspection offers the explicit next-room action');
  click('[data-r6-exit="proceed"]');await wait(720);
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
    const before=save().rooms.room07.doorIndex;
    click('#r7Dial');
    for(let i=0;i<12&&save().rooms.room07.selectedZodiac!==zodiac;i++)click('#r7RotateLeft');
    click('#r7DialDone');
    assert.equal(save().rooms.room07.doorIndex,before,'dial selection alone does not submit the answer');
    click('#r7Door');
    assert.equal(save().rooms.room07.doorIndex,before+1,'the matching door opens when touched');
    if(zodiac!=='酉'){
      assert.ok(q('.r7-scene.is-door-opening'),'correct answer gives visible door response');
      await wait(1200);
      if(zodiac==='寅')assert.equal(q('.memory-scene')?.dataset.location,'r7tiger','the first answer opens its approved recollection');
      if(zodiac==='卯')assert.equal(q('.memory-scene')?.dataset.location,'r7rabbit','the second answer opens its approved recollection');
      if(zodiac==='未')assert.equal(q('.memory-scene')?.dataset.location,'r7sheep','the third answer opens its approved recollection');
      if(zodiac==='申')assert.equal(q('.memory-scene')?.dataset.location,'r7monkey','the fourth answer opens its approved recollection');
    }
    finish();
  }
  assert.equal(save().rooms.room07.completed,true);
  assert.equal(q('#r7Next'),null,'accident continues directly into room 8');

  // Room 8: final conversation -> real LOG highlights -> name -> ending.
  assert.equal(save().currentScene,'room08');
  await wait(100);finish();
  assert.equal(save().rooms.room08.puzzleReady,true);
  // G01: before reading the back, no past memory is marked as a final clue.
  assert.equal(save().rooms.room08.backSeen,false);
  click('#r8Paper');click('.device-close');
  [...w.document.querySelectorAll('.gameplay-hud-actions button')].find(b=>b.textContent==='記録').click();
  click('.design-tabs [data-room="room07"]');
  click('.design-tabs [data-category="investigation"]');
  assert.equal(w.document.querySelectorAll('.design-record.final-clue').length,0,'records do not spoil the last puzzle before the back is read');
  click('.design-panel header button');
  // A read of the back enables restrained markers on existing, discovered logs.
  click('#r8Paper');click('#r8Back');
  assert.equal(save().rooms.room08.backSeen,true,'the paper-back hint is saved');
  click('.device-close');
  await wait(0);
  [...w.document.querySelectorAll('.gameplay-hud-actions button')].find(b=>b.textContent==='記録').click();
  click('.design-tabs [data-room="room07"]');
  click('.design-tabs [data-category="investigation"]');
  assert.ok(w.document.querySelectorAll('.design-record.final-clue').length>=1,'actual room-seven memories are marked after reading the hint');
  const clueRow=q('.design-record.final-clue');
  assert.ok(clueRow.textContent.startsWith('● '),'clue marker is visual, not a written answer');
  // G02: opening a long record keeps the existing detail and back-to-list controls.
  clueRow.click();
  assert.ok(q('.design-page.final-clue'),'the memory detail remains accessible');
  assert.ok(q('.design-pager'),'the existing page buttons are retained');
  click('.design-actions button');
  assert.ok(q('.design-record.final-clue'),'returning to the list retains the G01 marker');
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
