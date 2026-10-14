// npm install jsdom; node tests/late-game-flow.test.cjs
const {JSDOM}=require(process.env.JSDOM_PATH||'jsdom');
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');

(async()=>{
  const root=path.join(__dirname,'..');
  const dom=new JSDOM('<div id="game-container"><div id="game"></div></div>',{
    url:'https://game.test/',runScripts:'outside-only',pretendToBeVisual:true
  });
  const w=dom.window,ctx=dom.getInternalVMContext();
  w.matchMedia=()=>({matches:false,addEventListener(){}});
  w.scrollTo=()=>{};
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

  // Room 6: use confirmed discovery conditions, then the documented test route.
  click('#testRoomButton');click('[data-room="room06"]');
  assert.equal(save().currentScene,'room06');
  assert.equal(w.document.querySelectorAll('.r6-cell').length,64);
  run('showSixthRoom({visited:["A8","A1","H1","H8"],current:"H8",greenSeen:true,interview4:true,mapEvent:true})');
  click('[data-cell="H7"]');finish();
  assert.equal(save().rooms.room06.othelloKnown,true);
  click('#r6Play');
  click('[data-move="D1"]');finish();
  for(const move of ['H4','D2','G5','G6','G3','C8','C2','H2']) click('[data-move="'+move+'"]');
  finish();
  assert.equal(save().rooms.room06.completed,true);
  assert.ok(q('#r6Next'));

  // Room 7: books -> zodiac doors -> accident memory.
  click('#r6Next');await wait(720);
  assert.equal(save().currentScene,'room07');
  for(const id of ['ikkyu','rabbit','wolf','monkey','pigs','bremen']) click('[data-book="'+id+'"]');
  finish();
  assert.equal(save().rooms.room07.booksSolved,true);
  for(const z of ['寅','卯','未','申','亥','酉']){click('[data-zodiac="'+z+'"]');finish();}
  assert.equal(save().rooms.room07.completed,true);
  assert.ok(q('#r7Next'));

  // Room 8: final conversation -> real LOG highlights -> name -> ending.
  click('#r7Next');await wait(720);
  assert.equal(save().currentScene,'room08');
  await wait(100);finish();
  assert.equal(save().rooms.room08.puzzleReady,true);
  click('#r8Paper');click('#r8Back');click('.device-close');
  click('#gameplayLogButton');
  assert.ok(w.document.querySelectorAll('.gameplay-log-row.final-clue').length>=4,'final clue rows should be highlighted');
  click('.gameplay-panel-close');
  click('#r8Paper');
  q('#r8Answer').value='花音';
  click('#r8Submit');finish();
  assert.equal(save().rooms.room08.solved,true);
  assert.equal(save().rooms.room08.finalTalkSeen,true);
  click('#r8FinalDoor');finish();
  assert.equal(save().rooms.room08.ended,true);
  assert.equal(q('.late-ending h1').textContent,'END');

  console.log('PASS: Room 6 discovery/test route -> Room 7 zodiac -> Room 8 final puzzle -> END.');
  dom.window.close();
})().catch(e=>{console.error(e);process.exitCode=1});
