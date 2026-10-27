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
  assert.equal(saved().doorIndex,i+1);
  if(i<5){assert.equal(q('#roomNextButton'),null,'no intermediate memory or door-opening dialogue');assert.equal(saved().completed,false);if(i===2){const midway=saved();run('showSeventhRoom('+JSON.stringify(midway)+')');assert.deepEqual(saved(),midway,'partial zodiac sequence survives reload');}}
  else finish();
 }
 assert.ok(!run('GameLog.list()').some(x=>x.text.includes('具体的な短い記憶')),'no pending intermediate memories');
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

