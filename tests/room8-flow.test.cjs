// Final conversation, interrupted saves, name input and ending through real controls.
const {JSDOM}=require(process.env.JSDOM_PATH||'jsdom');
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
(async()=>{
 const root=path.join(__dirname,'..');
 const dom=new JSDOM('<div id="game-container"><div id="game"></div></div>',{url:'https://game.test/',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,ctx=dom.getInternalVMContext();
 w.matchMedia=query=>({matches:query.includes('prefers-reduced-motion'),addEventListener(){}});w.scrollTo=()=>{};
 w.HTMLCanvasElement.prototype.getContext=()=>null;w.HTMLElement.prototype.scrollIntoView=function(){};
 for(const [,file]of fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script src="([^?]+)\?/g))vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
 const run=code=>vm.runInContext(code,ctx),q=s=>w.document.querySelector(s);
 const click=s=>{assert.ok(q(s),'control '+s);q(s).click()};
 const saved=()=>JSON.parse(w.localStorage.getItem('saigononazo-save-v1'));
 const tick=()=>new Promise(r=>setTimeout(r,0));
 const finish=()=>{for(let i=0;i<1000&&q('#roomNextButton');i++)click('#roomNextButton');assert.equal(q('#roomNextButton'),null)};
 const advanceTo=id=>{for(let i=0;i<1000&&saved().rooms.room08.introLogId!==id;i++)click('#roomNextButton');assert.equal(saved().rooms.room08.introLogId,id)};
 run('settings.instantText=true;showEighthRoom({introSeen:true})');
 assert.ok(q('#roomNextButton'),'legacy introSeen save is playable');
 assert.equal(q('.r8-living').dataset.hanaPose,'seated');
 advanceTo('r8_reunion_13');
 assert.match(q('#roomMessage').textContent,/わたしのことも/);
 const midway=saved().rooms.room08;
 run('showEighthRoom('+JSON.stringify(midway)+')');
 assert.match(q('#roomMessage').textContent,/わたしのことも/,'resumes saved authored line');
 assert.equal(q('.r8-living').dataset.hanaPose,'seated');
 advanceTo('r8_stand_01');assert.equal(q('.r8-living').dataset.hanaPose,'standing');
 const standing=saved().rooms.room08;run('showEighthRoom('+JSON.stringify(standing)+')');
 assert.equal(q('.r8-living').dataset.hanaPose,'standing','pose restored with dialogue position');
 finish();assert.ok(q('#r8Paper'));assert.equal(saved().rooms.room08.puzzleReady,true);
 const logs=run('GameLog.list()');
 assert.ok(logs.some(e=>e.text==='全身に汗をかいていた。'));
 assert.ok(logs.some(e=>e.text==='僕たちは……事故に……？'));
 assert.ok(!logs.some(e=>e.text.includes('【未確定】')));
 assert.ok(!logs.some(e=>e.speaker==='花音'||e.text.includes('花音')),'name remains hidden before answer');
 click('#r8Paper');click('#r8Back');await tick();
 assert.match(q('#r8BackText').textContent,/最初の部屋/);assert.doesNotMatch(q('#r8BackText').textContent,/未確定|花音/);
 const progress=saved().rooms.room08;
 click('#r8Submit');assert.match(q('#r8Feedback').textContent,/名前を、思い出そう/);
 q('#r8Answer').value='ハナ';click('#r8Submit');assert.match(q('#r8Feedback').textContent,/この名前じゃない/);
 assert.deepEqual(saved().rooms.room08,progress,'empty/wrong answers do not consume time or progress');
 click('.device-close');run('showEighthRoom('+JSON.stringify(progress)+')');await tick();
 assert.ok(q('.late-log-pulse'),'LOG hint survives reload');
 for(const answer of ['花音','かのん','カノン']){
   run('showEighthRoom({introSeen:true,puzzleReady:true,backSeen:true})');click('#r8Paper');
   q('#r8Answer').value=answer;click('#r8Submit');finish();
   assert.equal(saved().rooms.room08.finalTalkSeen,true);assert.ok(q('#r8FinalDoor'));
 }
 click('#r8FinalDoor');finish();assert.equal(saved().rooms.room08.ended,true);assert.equal(q('.late-ending h1').textContent,'END');
 // Completed old room-seven saves should not require another door click.
 run('roomStates.room08={};showSeventhRoom({introSeen:true,booksSolved:true,completed:true,doorIndex:6})');
 assert.equal(run('currentScene'),'room08');assert.ok(q('#roomNextButton'));assert.equal(q('#r7Next'),null);finish();
 console.log('PASS room8: legacy/mid-dialogue saves, seating, hidden name, paper, retry, LOG pulse, three answer forms, END and room7 migration.');
 await new Promise(r=>setTimeout(r,30));dom.window.close();
})().catch(e=>{console.error(e);process.exitCode=1});
