// npm install jsdom; node tests/late-game-flow.test.cjs
const {JSDOM}=require(process.env.JSDOM_PATH||'jsdom');
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');

(async()=>{
  const root=path.join(__dirname,'..');
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
    const pages=[];
    for(let n=0;n<800&&q('#roomNextButton');n++){
      pages.push(q('#roomMessage .message')?.textContent||'');
      click('#roomNextButton');
    }
    assert.equal(q('#roomNextButton'),null,'dialogue should finish');
    return pages;
  }

  // Room 6: authored board, live map, legal Othello and late-game transition.
  click('#testRoomButton');click('[data-room="room06"]');
  const entryPages=finish();
  const entryText=entryPages.join('').replace(/\s+/g,'');
  assert(entryText.includes('足元の床は白い。並んだ扉は、どれもよく似た形をしている。'),'the entry describes only visible doors');
  assert(!entryText.includes('同じような空間が続いている'),'unvisited rooms are not spoiled on entry');
  assert(!entryText.includes('……最初に入った部屋と、似た造りですね。'),'the discovery is not made until after moving');
  assert.ok(q('#r6TestGuide'));
  const guideState=save().rooms.room06;
  click('#r6TestGuide');assert.equal(w.document.querySelectorAll('.r6-test-guide tbody tr').length,9);
  assert.equal(q('.r6-test-guide tbody tr:last-child td:nth-child(2)').textContent,'H2');
  click('.r6-test-guide .device-close');assert.deepEqual(save().rooms.room06,guideState);
  run('showSixthRoom('+JSON.stringify(guideState)+')');assert.ok(q('#r6TestGuide'),'test guide survives saved state');
  assert.equal(save().currentScene,'room06');
  assert.equal(q('.r6-scene').dataset.color,'white');
  assert.equal(q('.r6-map'),null,'map not revealed before handoff');
  assert.equal(w.document.querySelectorAll('[data-dest]').length,2,'A8 has only north/east exits');
  // Animated travel locks repeated input and resumes dialogue only after arrival.
  w.matchMedia=()=>({matches:false,addEventListener(){}});
  click('[data-dest="A7"]');click('[data-dest="B8"]');
  assert.ok(q('.r6-travel-shade'));
  assert.equal(save().rooms.room06.current,'A8','background switches only under darkness');
  assert.equal(q('.r6-space').dataset.travel,'north');
  assert.equal(q('.r6-travel-label').textContent,'正面の部屋へ');
  await wait(270);assert.equal(save().rooms.room06.current,'A7');
  click('[data-dest="B7"]');assert.equal(save().rooms.room06.current,'A7','input remains locked during fade-in');
  await wait(360);assert.equal(q('.r6-travel-shade'),null);
  const a7Pages=finish();
  const a7Text=a7Pages.join('').replace(/\s+/g,'');
  const notice='……最初に入った部屋と、似た造りですね。',reply='うん。壁も扉も、ほとんど同じみたい。';
  assert(a7Text.includes(notice),'the comparison is made only after entering A7');
  assert(a7Text.indexOf(reply)>a7Text.indexOf(notice),'Hana confirms the similarity after the protagonist notices');
  assert.equal(save().rooms.room06.visited.length,2,'one click sequence creates one visit');
  click('[data-dest="B7"]');run('showSixthRoom({introSeen:true})');await wait(650);
  assert.equal(save().rooms.room06.current,'A8','loading a room cancels stale travel timers');
  assert.equal(q('.room-dialog-overlay'),null,'stale travel cannot open a dialogue');
  w.matchMedia=query=>({matches:query.includes('prefers-reduced-motion'),addEventListener(){}});
  const initial=save().rooms.room06.board;
  click('#gameplayHanaButton');assert.ok(q('[data-r6-hint="exploration"]'));assert.equal(q('[data-r6-hint="hint-1"]'),null);
  click('[data-r6-hint="exploration"]');
  const explorationHint=finish().join('').replace(/\s+/g,'');
  assert(explorationHint.includes('まだ通っていない扉を進んでみよう。部屋の様子をよく確かめてみて。'),'F02 early hint remains discovery-neutral');
  assert(!explorationHint.includes('床の色が違う部屋')&&!explorationHint.includes('端まで'),'F02 early hint does not reveal structure or color');
  assert.equal(initial.length,64);
  assert.deepEqual(['W','G','E'].map(c=>initial.filter(v=>v===c).length),[40,15,9]);
  for(const id of ['A7','A6','A5','A4','A3']){
    click('[data-dest="'+id+'"]');
    const pages=finish();
    if(id==='A5'){
      const script=pages.join('').replace(/\s+/g,'');
      const question='前に思い出した、あの人の好物って……アジの南蛮漬けでしたっけ？';
      assert(script.includes(question),'F03: the fourth room asks about the remembered person');
      assert(script.indexOf('レンコンだよ')>script.indexOf(question),'F03: Hana gives the remembered answer immediately');
      assert(!script.includes('ハナさんが好きなのって'),'F03: question does not assert Hana told her own preferences');
    }
    if(id==='A3'){
      const script=pages.join('').replace(/\s+/g,'');
      const question='この謎、ハナさんが作ったんですか？';
      const correction='……その地図は、わたしが作ったよ';
      const deflection='……ほら、まだ行ってない部屋もあるし。もう少し見てみよ？';
      assert(script.includes(question),'F05: author question appears on sixth visited room');
      assert(script.indexOf(correction)>script.indexOf(question),'F05: Hana avoids claiming the whole puzzle');
      assert(script.indexOf(deflection)>script.indexOf(correction),'F05: Hana redirects gently after answering about the map');
      assert(!script.includes('地図を使って、探索を進めよう'),'F05: old procedural line does not appear');
    }
  }
  assert.equal(save().rooms.room06.interview4,true);
  assert.equal(save().rooms.room06.mapEvent,true,'map granted at sixth room including A8');
  assert.equal(w.document.querySelectorAll('[data-cell]').length,6,'unvisited rooms are absent');
  click('[data-cell="A8"]');assert.equal(q('.r6-scene').dataset.current,'A8');
  assert.equal(save().rooms.room06.visited.length,6,'fast travel does not count as new exploration');
  click('[data-dest="B8"]');
  const firstBlack=finish().join('').replace(/\s+/g,'');
  assert(firstBlack.includes('……ここは、床が黒いんですね。'),'first black room is observed');
  assert(firstBlack.includes('うん。白い部屋とは違うね。'),'Hana reacts to black floor');
  assert.equal(q('.r6-scene').dataset.color,'black');
  click('[data-dest="C8"]');
  const firstGreen=finish().join('').replace(/\s+/g,'');
  assert(firstGreen.includes('……この部屋は、床が緑色なんですね。'),'first green room is observed');
  assert(firstGreen.includes('そうだね。何かあるのかな？'),'Hana reacts without explaining the lever');
  assert.equal(q('.r6-scene').dataset.color,'green');
  assert.ok(q('#r6White'));assert.equal(save().rooms.room06.greenSeen,true);
  run('showSixthRoom({introSeen:true,visited:["A8","A1","H1","H8","D1","B8"],current:"H8",interview4:true,mapEvent:true})');
  click('[data-dest="H7"]');finish();
  assert.equal(save().rooms.room06.othelloKnown,true);
  assert.equal(save().rooms.room06.mapComplete,true);
  assert.equal(w.document.querySelectorAll('[data-cell]').length,64,'Hana reveals all rooms after discovery');
  assert.equal(save().rooms.room06.visited.includes('G6'),false);
  click('[data-cell="G6"]');assert.equal(save().rooms.room06.current,'G6','newly revealed unvisited room is reachable from map');
  assert.equal(save().rooms.room06.visited.includes('G6'),true);
  const ids=Array.from({length:64},(_,i)=>String.fromCharCode(65+i%8)+(Math.floor(i/8)+1));
  run('showSixthRoom('+JSON.stringify({introSeen:true,visited:ids,current:'D1',interview4:true,mapEvent:true,othelloKnown:true,mapComplete:true})+')');
  assert.equal(q('#r6TestGuide'),null,'normal play does not show the test solution');
  click('#gameplayHanaButton');assert.equal(q('[data-r6-hint="exploration"]'),null);assert.equal(q('[data-r6-hint="hint-2"]'),null);click('[data-r6-hint="hint-1"]');finish();
  for(const level of [2,3]){click('#gameplayHanaButton');click('[data-r6-hint="hint-'+level+'"]');finish();}
  assert.equal(save().rooms.room06.hintLevel,3);
  run('showSixthRoom('+JSON.stringify(save().rooms.room06)+')');
  click('#gameplayHanaButton');click('[data-r6-hint="next-move"]');finish();
  assert.equal(save().rooms.room06.moves.length,0,'hint does not place a stone');
  click('#r6Black');finish();assert.equal(save().rooms.room06.moves.length,0,'wrong turn does not modify board');
  click('#r6White');finish();assert.equal(q('.r6-scene').dataset.color,'white');
  click('#gameplayHanaButton');click('[data-r6-hint="next-move"]');finish();
  assert.equal(save().rooms.room06.moves.length,1,'specific hint does not change a played board');
  assert.equal(q('.r6-lever').dataset.state,'white');
  click('#r6Undo');assert.deepEqual(save().rooms.room06.board,initial,'UNDO restores floor colors');
  click('#r6White');finish();click('#r6Reset');assert.deepEqual(save().rooms.room06.board,initial,'RESET restores initial board');
  const route=['D1','H4','D2','G5','G6','G3','C8','C2','H2'];
  for(let i=0;i<route.length;i++){
    if(q('.r6-scene').dataset.current!==route[i])click('[data-cell="'+route[i]+'"]');
    click(i%2===0?'#r6White':'#r6Black');
    if(i===8){run('showSixthRoom('+JSON.stringify(save().rooms.room06)+')');assert.ok(q('#roomNextButton'),'interrupted winning recollection resumes after load');}
    finish();
    if(i===3){const saved=save().rooms.room06;run('showSixthRoom('+JSON.stringify(saved)+')');assert.deepEqual(save().rooms.room06.board,saved.board,'save/load retains flips and map');}
  }
  assert.equal(save().rooms.room06.completed,true);
  assert.ok(save().rooms.room06.board.every(c=>c==='W'));
  assert.ok(q('#r6Next'));

  click('#r6Next');await wait(720);assert.equal(save().currentScene,'room07');

  // Alternate route: black -> green -> a later white room; no A7/B8-specific trigger.
  run('showSixthRoom({introSeen:true})');
  click('[data-dest="B8"]');
  const altBlack=finish().join('');
  assert(altBlack.includes('……ここは、床が黒いんですね。'),'black is observed at first arrival');
  click('[data-dest="C8"]');
  const altGreen=finish().join('');
  assert(altGreen.includes('……この部屋は、床が緑色なんですね。'),'green is observed at first arrival');
  click('[data-dest="D8"]');
  const altWhite=finish().join('');
  assert(altWhite.includes('……最初に入った部屋と、似た造りですね。'),'first additional white room may be D8');
  assert(altWhite.includes('前に思い出した、あの人の好物って……'),'fourth unique room interview remains reachable');
  const altSaved=save().rooms.room06;
  run('showSixthRoom('+JSON.stringify(altSaved)+')'); // reload after all three colors were seen
  for(const dest of ['C8','B8','A8','A7']){
    click('[data-dest="'+dest+'"]');
    const again=finish().join('');
    assert(!again.includes('……この部屋は、床が緑色なんですね。'),'green reaction does not repeat');
    assert(!again.includes('……ここは、床が黒いんですね。'),'black reaction does not repeat');
    assert(!again.includes('……最初に入った部屋と、似た造りですね。'),'white reaction does not repeat');
  }
  assert.equal(save().rooms.room06.current,'A7','non-hardcoded color reactions allow later A7 arrival');
  console.log('PASS: Room 6 live map, first white/black/green encounter per route, doors, Othello, save/load and chapter transition.');
  // Flush UI mutation observers and audio microtasks before closing JSDOM.
  run('Dialogue.stop()');
  await wait(150);
  dom.window.close();
})().catch(e=>{console.error(e);process.exitCode=1});

