// Full player flow and saved-state migration for the room-seven library.
const {JSDOM}=require(process.env.JSDOM_PATH||'jsdom');
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
(async()=>{
 const root=path.join(__dirname,'..'),dom=new JSDOM('<div id="game-container"><div id="game"></div></div>',{url:'https://game.test/',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,ctx=dom.getInternalVMContext();w.matchMedia=query=>({matches:query.includes('prefers-reduced-motion'),addEventListener(){}});w.scrollTo=()=>{};w.HTMLCanvasElement.prototype.getContext=()=>null;w.HTMLElement.prototype.scrollIntoView=function(){};
 for(const [,file]of fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script src="([^?]+)\?/g))vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
 const run=s=>vm.runInContext(s,ctx),q=s=>w.document.querySelector(s),click=s=>{assert.ok(q(s),'control '+s);q(s).click()},saved=()=>JSON.parse(w.localStorage.getItem('saigononazo-save-v1')).rooms.room07;
 const finish=()=>{for(let n=0;n<500&&q('#roomNextButton');n++)click('#roomNextButton');assert.equal(q('#roomNextButton'),null, q('#roomNextButton')?'dialogue remains: '+q('#roomMessage')?.textContent+' disabled='+q('#roomNextButton').disabled:'')};
 run('settings.instantText=true;showSeventhRoom({})');finish();
 assert.ok(run('GameLog.list()').some(x=>x.text==='隣を見ると、これまでと同じようにハナさんがいる。'));
 assert.ok(!run('GameLog.list()').some(x=>x.speaker==='問題文'),'puzzle waits for door inspection');
 assert.equal(q('.r7-scene').dataset.view,'front');assert.ok(q('#r7Dial'));assert.equal(w.document.querySelectorAll('[data-zodiac]').length,0,'one door instead of twelve');
 click('#r7Door');finish();assert.equal(saved().doorIndex,0,'unplaced books prevent accidental progress');
 const turn=view=>{for(let i=0;i<4&&saved().view!==view;i++)click('#r7TurnRight');assert.equal(saved().view,view)};
 click('#r7Hana');finish();assert.ok(run('GameLog.list()').some(x=>x.text==='心配してくれてありがとう。'));
 turn('back');click('#r7Shelf');finish();click('.r7-overlay .device-close');
 assert.equal(saved().shelfExamined,true);click('#r7Shelf');
 assert.equal(q('#roomMessage').textContent.includes('本棚の一段に、ところどころ空きがある。'),true);finish();click('.r7-overlay .device-close');
 const take=(view,target)=>{turn(view);click(target);if(q('#r7SearchAction'))click('#r7SearchAction');assert.ok(q('#r7Take'));click('#r7Take');assert.equal(q('.r7-open-book'),null,'collected book cannot be read early');assert.equal(q('#r7UseBook'),null,'no direct shelf shortcut after pickup');assert.equal(q('.r7-cover-view'),null,'pickup shows text only');finish()};
 take('left','#r7Drawer');take('left','#r7Curtain');take('left','#r7Diary');take('right','#r7Stack');take('right','#r7Box');take('front','#r7Cabinet');
 assert.deepEqual(saved().collected,['ikkyu','rabbit','wolf','monkey','mitten','bremen']);
 const before=saved();run('showSeventhRoom('+JSON.stringify(before)+')');assert.deepEqual(saved(),before,'exploration survives reload');
 const pickupLog=run('GameLog.list()');assert.ok(pickupLog.some(x=>x.text==='少し気になったので、ひとまず持っておくことにした。'));assert.ok(pickupLog.some(x=>x.text==='謎に関係しているのかもしれない。'));assert.equal(pickupLog.filter(x=>x.text==='中を開こうとしたが、開けない。').length,0,'Books are not automatically opened during pickup');
 turn('back');click('#r7Shelf');finish();assert.ok(run('GameLog.list()').some(x=>x.text==='持っている本も、ここに並んでいたのかな。'));assert.equal(w.document.querySelectorAll('.r7-slot.is-filled').length,4,'four fixed books initially');
 click('[data-slot="0"]');assert.match(q('.r7-shelf-status').textContent,/赤ずきん/);assert.equal(q('.r7-open-book'),null,'fixed books only show title');
 // Any empty slot accepts a book without revealing whether its position is correct.
 click('[data-held="bremen"]');click('[data-slot="1"]');assert.equal(saved().placed.length,1);assert.equal(saved().slots[1],'bremen');assert.equal(saved().booksSolved,false);assert.equal(q('.r7-open-book'),null);
 for(const [id,slot]of [['mitten',7],['monkey',5],['wolf',3],['rabbit',2],['ikkyu',8]]){click('[data-held="'+id+'"]');click('[data-slot="'+slot+'"]');assert.equal(saved().booksSolved,false,'wrong complete order stays locked')}
 assert.equal(saved().placed.length,6);assert.equal(q('.r7-books-glow'),null);assert.match(q('.r7-shelf-status').textContent,/本は開かない/);
 const wrong=saved();click('.r7-overlay .device-close');run('showSeventhRoom('+JSON.stringify(wrong)+')');assert.deepEqual(saved(),wrong,'wrong full arrangement survives reload');click('#r7Shelf');finish();
 click('[data-slot="1"]');assert.equal(saved().placed.length,5);assert.equal(q('.r7-open-book'),null,'taking an unsolved book out never opens it');
 click('[data-slot="8"]');assert.equal(saved().placed.length,4);click('[data-slot="1"]');click('[data-held="bremen"]');click('[data-slot="8"]');
 assert.ok(q('.r7-books-glow'),'correct complete arrangement pulses once');finish();
 assert.equal(saved().booksSolved,true);assert.deepEqual(saved().order,['ikkyu','rabbit','wolf','monkey','mitten','bremen']);
 const log=run('GameLog.list()');assert.ok(log.some(x=>x.text==='棚に並んだ本が、一瞬、淡く光った。'));assert.ok(!log.some(x=>x.text==='寅、卯、未、申、亥、酉'),'no automatic solution spoiler');
 click('#r7Shelf');
 for(const slot of [1,2,3,5,7,8]){click('[data-slot="'+slot+'"]');finish();assert.ok(q('.r7-open-book'));assert.equal(q('.r7-reader h2'),null,'no title on opened spread');click('#r7Zoom');assert.ok(q('.is-zoomed'));click('#r7BackShelf')}
 assert.equal(saved().read.length,6);assert.equal(run('GameLog.list()').filter(x=>x.text==='……開いた。').length,1,'first-opening narration only once');click('.r7-overlay .device-close');
 const snapshot=saved();run('showSeventhRoom('+JSON.stringify(snapshot)+')');assert.deepEqual(saved(),snapshot,'placement and reading persist');
 turn('front');click('#r7Dial');click('#r7RotateLeft');assert.equal(saved().selectedZodiac,'丑');assert.ok(q('.r7-fixed-pointer'));click('#r7DialDone');click('#r7Door');assert.equal(saved().doorIndex,0,'wrong zodiac does not advance');
 for(const [i,target]of ['寅','卯','未','申','亥','酉'].entries()){
  click('#r7Dial');for(let n=0;n<12&&saved().selectedZodiac!==target;n++)click('#r7RotateLeft');assert.equal(saved().selectedZodiac,target);click('#r7DialDone');
  assert.equal(saved().doorIndex,i,'selecting a zodiac only adjusts the mechanism');
  click('#r7Door');
  assert.equal(saved().doorIndex,i+1,'touching the door commits the selected answer');
  if(i<5){assert.ok(q('.r7-scene.is-door-opening'),'each intermediate correct door reacts visibly');assert.equal(q('.r7-door-feedback').textContent,'扉が開き、静かに閉じた。');assert.equal(q('#roomNextButton'),null,'memory waits for the door animation');assert.equal(saved().completed,false);
    if(i===0){
      assert.equal(saved().shortMemory.zodiac,'寅','the accepted answer persists the pending memory before animation completes');
      const duringDoor=saved();run('showSeventhRoom('+JSON.stringify(duringDoor)+')');
      assert.equal(q('.memory-scene').dataset.location,'r7tiger','reloading during the door starts the memory');
      assert.equal(q('.memory-background').getAttribute('src'),'images/background/memories/room01/walk-home.png');
      for(let n=0;n<30&&!saved().shortMemory.progress?.logId.startsWith('r7_mem_tiger_05');n++)click('#roomNextButton');
      assert.match(q('#roomMessage').textContent,/いえ、別に/,'the approved answer conceals his feelings');
      const halfway=saved();assert.ok(halfway.shortMemory.progress.logId.startsWith('r7_mem_tiger_05'));
      run('showSeventhRoom('+JSON.stringify(halfway)+')');
      assert.equal(saved().shortMemory.progress.logId,halfway.shortMemory.progress.logId,'reload resumes the displayed line');
      assert.match(q('#roomMessage').textContent,/いえ、別に/);
      finish();assert.equal(saved().shortMemory,null,'finishing the memory returns to the puzzle');
      assert.equal(saved().doorIndex,1);assert.equal(q('.memory-scene'),null);
    }else if(i===1){
      assert.equal(saved().shortMemory.zodiac,'卯','the second answer persists its pending memory');
      await new Promise(resolve=>setTimeout(resolve,1200));
      assert.equal(q('.memory-scene').dataset.location,'r7rabbit','the door opens the 2011 memory');
      assert.equal(q('.memory-background').getAttribute('src'),'images/background/memories/room02/music-room-paperwork.png');
      assert.equal(q('.memory-girl').hidden,true,'the senior is speaking by phone, not in the room');
      for(let n=0;n<50&&!saved().shortMemory.progress?.logId.startsWith('r7_mem_rabbit_09');n++)click('#roomNextButton');
      const halfway=saved();assert.ok(halfway.shortMemory.progress.logId.startsWith('r7_mem_rabbit_09'));
      assert.match(q('#roomMessage').textContent,/それが、まだ悩んでいて/);
      run('showSeventhRoom('+JSON.stringify(halfway)+')');
      assert.equal(saved().shortMemory.progress.logId,halfway.shortMemory.progress.logId,'the phone conversation resumes at the same line');
      assert.match(q('#roomMessage').textContent,/それが、まだ悩んでいて/);
      finish();assert.equal(saved().shortMemory,null,'finishing the phone conversation returns to the puzzle');
      assert.equal(saved().doorIndex,2);assert.equal(q('.memory-scene'),null);
      assert.ok(run('GameLog.list()').some(x=>x.text.includes('自分のために決めたかった')),'the approved independent choice reaches the log');
    }else if(i===2){
      assert.equal(saved().shortMemory.zodiac,'未','the third answer persists its pending memory before the door animation ends');
      const duringDoor=saved();run('showSeventhRoom('+JSON.stringify(duringDoor)+')');
      assert.equal(q('.memory-scene').dataset.location,'r7sheep','reloading during the door opens the 2015 memory');
      assert.equal(q('.memory-background').getAttribute('src'),'images/background/memories/room05/kitchen-evening.png');
      assert.equal(q('#game').dataset.memoryStage,'revealed');
      assert.ok(q('.room-dialog .memory-window-portrait .memory-girl'),'the heroine uses the Room 5 dialogue portrait');
      for(let n=0;n<80&&!saved().shortMemory.progress?.logId.startsWith('r7_mem_sheep_16');n++)click('#roomNextButton');
      const halfway=saved();assert.ok(halfway.shortMemory.progress.logId.startsWith('r7_mem_sheep_16'));
      assert.match(q('#roomMessage').textContent,/今まで別々の部屋/);
      run('showSeventhRoom('+JSON.stringify(halfway)+')');
      assert.equal(saved().shortMemory.progress.logId,halfway.shortMemory.progress.logId,'the 2015 memory resumes at the same line');
      assert.match(q('#roomMessage').textContent,/今まで別々の部屋/);
      assert.ok(q('.room-dialog .memory-window-portrait .memory-girl'));
      finish();assert.equal(saved().shortMemory,null,'finishing the memory returns to the puzzle');
      assert.equal(saved().doorIndex,3);assert.equal(q('.memory-scene'),null);
      assert.equal(q('.memory-window-portrait'),null);
      assert.ok(run('GameLog.list()').some(x=>x.text.includes('少しだけ自分たちの場所に見えた')),'the memory reaches its approved ending');
    }else if(i===3){
      assert.equal(saved().shortMemory.zodiac,'申','the fourth answer persists its pending memory');
      await new Promise(resolve=>setTimeout(resolve,1200));
      assert.equal(q('.memory-scene').dataset.location,'r7monkey','the door opens the 2016 memory');
      assert.equal(q('.memory-background').getAttribute('src'),'images/background/memories/room05/dining-night.png');
      assert.equal(q('#game').dataset.memoryStage,'expressive');
      assert.ok(q('.room-dialog .memory-window-portrait .memory-girl'));
      assert.equal(q('.memory-prop').dataset.kind,'notebook');assert.equal(q('.memory-prop').hidden,false);
      for(let n=0;n<80&&!saved().shortMemory.progress?.logId.startsWith('r7_mem_monkey_16');n++)click('#roomNextButton');
      const halfway=saved();assert.ok(halfway.shortMemory.progress.logId.startsWith('r7_mem_monkey_16'));
      assert.match(q('#roomMessage').textContent,/うん/);
      run('showSeventhRoom('+JSON.stringify(halfway)+')');
      assert.equal(saved().shortMemory.progress.logId,halfway.shortMemory.progress.logId,'the 2016 memory resumes at the same line');
      assert.equal(q('.memory-prop').hidden,false,'the notebook remains open after resuming');
      for(let n=0;n<60&&!saved().shortMemory.progress?.logId.startsWith('r7_mem_monkey_22_02');n++)click('#roomNextButton');
      assert.ok(saved().shortMemory.progress.logId.startsWith('r7_mem_monkey_22_02'));
      assert.match(q('#roomMessage').textContent,/彼女はノートを閉じ/);
      assert.equal(q('.memory-prop').hidden,true,'the open notebook is removed when she closes it');
      finish();assert.equal(saved().shortMemory,null,'finishing the memory returns to the puzzle');
      assert.equal(saved().doorIndex,4);assert.equal(q('.memory-scene'),null);
      assert.equal(q('.memory-window-portrait'),null);
      assert.ok(run('GameLog.list()').some(x=>x.text.includes('家に帰って言葉を交わせること')),'the memory reaches its approved ending');
    }
    else await new Promise(resolve=>setTimeout(resolve,1200));}
  else finish();
 }
 assert.ok(!run('GameLog.list()').some(x=>x.text.includes('具体的な短い記憶')),'no pending intermediate memories');
 assert.ok(!run('GameLog.list()').some(x=>/^r7_mem_(tiger|rabbit|sheep|monkey)_/.test(x.id)&&x.type==='narration'&&x.text.includes('主人公')),'short recollections use first-person narration');
 assert.equal(saved().completed,true);assert.equal(q('#r7Next'),null,'no return to library after the accident');assert.equal(run('currentScene'),'room08');assert.ok(q('#r8Paper'));
 // Old saves preserve completed book sequence, including the retired pigs id.
 run('showSeventhRoom({introSeen:true,order:["ikkyu","rabbit","wolf","monkey","pigs","bremen"],booksSolved:true,doorIndex:3})');assert.equal(saved().placed.length,6);assert.ok(saved().collected.includes('mitten'));assert.equal(saved().doorIndex,3);
 run('showSeventhRoom({introSeen:true,order:["pigs","ikkyu"]})');assert.deepEqual(saved().collected,['mitten','ikkyu']);assert.equal(saved().placed.length,0);
 // A save made on entering the final memory must replay it rather than dead-end.
 run('showSeventhRoom({introSeen:true,booksSolved:true,doorIndex:6})');finish();assert.equal(saved().completed,true);
 // New saves reject unknown/duplicate books and out-of-range dial progress.
 run('showSeventhRoom({libraryVersion:1,introSeen:true,collected:["bad","ikkyu","ikkyu"],placed:["wolf"],read:["wolf"],doorIndex:99})');assert.deepEqual(saved().collected,['ikkyu']);assert.equal(saved().placed.length,0);assert.equal(saved().doorIndex,0);
 run('showSeventhRoom({libraryVersion:1,introSeen:true,collected:["bremen"],placed:["bremen"],read:["bremen"]})');assert.equal(saved().slots[8],'bremen');assert.equal(saved().booksSolved,false);assert.equal(saved().read.length,0,'old partial saves cannot read before full solution');
 run('showSeventhRoom({libraryVersion:2,introSeen:true,collected:["ikkyu","rabbit"],slots:{0:"ikkyu",1:"ikkyu",2:"ikkyu",3:"bad"},booksSolved:true,doorIndex:4})');assert.deepEqual(saved().slots,{1:'ikkyu'});assert.equal(saved().doorIndex,0,'corrupt slot data cannot unlock dial');
 for(const book of run('Room7LibraryUI.items()'))assert.ok(book.name);
 console.log('PASS room7: six searches, inventory, four fixed books, wrong/correct returns, all six reads, twelve-position dial, save/load, migration, accident memory and room8.');await new Promise(r=>setTimeout(r,30));dom.window.close();
})().catch(e=>{console.error(e);process.exitCode=1});

