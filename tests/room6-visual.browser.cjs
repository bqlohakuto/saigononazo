const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const root=path.resolve(__dirname,'..'),base=process.env.PUBLIC_BASE_URL||'https://room6.local/';
const mobileEngine=process.env.R6_MOBILE_ENGINE==='chromium'?chromium:webkit;
(async()=>{
 for(const spec of [{name:'pc',engine:chromium,viewport:{width:1366,height:768}},{name:'landscape',engine:mobileEngine,viewport:{width:852,height:393},mobile:true}]){
  const browser=await spec.engine.launch({headless:true});
  try{
   const ctx=await browser.newContext({viewport:spec.viewport,isMobile:!!spec.mobile,hasTouch:!!spec.mobile,reducedMotion:'reduce'});
   await ctx.addInitScript(()=>localStorage.setItem('saigononazo-help-seen','1'));
   const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   if(!process.env.PUBLIC_BASE_URL)await page.route('https://room6.local/**',route=>{
    const file=path.resolve(root,decodeURIComponent(new URL(route.request().url()).pathname).replace(/^\//,'')||'index.html');
    return route.fulfill(file.startsWith(root+path.sep)&&fs.existsSync(file)?{path:file}:{status:404,body:''});
   });
   await page.goto(base+'?r6review='+Date.now(),{waitUntil:'load'});
   const assets=['white','black','green','clean-room-v2','walls','inner','lever-neutral','lever-white','lever-black','map-paper-v2'];
   await page.evaluate(async names=>{for(const n of names){const im=new Image();im.src='images/background/room06/'+n+'.webp';await im.decode();if(im.naturalWidth<100)throw new Error('bad asset '+n)}},assets);
   const finish=()=>page.evaluate(()=>{for(let i=0;i<800&&document.querySelector('#roomNextButton');i++)document.querySelector('#roomNextButton').click()});
   await page.evaluate(()=>{settings.instantText=true;showSixthRoom({introSeen:true})});
   assert.equal(await page.locator('[data-dest]').count(),2);assert.equal(await page.locator('.r6-map').count(),0);
   const scene=await page.locator('.r6-scene').boundingBox();assert(scene.width>600&&scene.height>250);
   const dir=path.join('artifacts','room06',spec.name);fs.mkdirSync(dir,{recursive:true});
   await page.evaluate(()=>startRoomTest('room06'));await finish();
   await page.locator('#r6TestGuide').click();
   assert.equal(await page.locator('.r6-test-guide tbody tr').count(),9);
   const guideBox=await page.locator('.r6-test-guide').boundingBox();assert(guideBox.y>=0&&guideBox.y+guideBox.height<=spec.viewport.height+1);
   await page.screenshot({path:path.join(dir,'test-solution.png')});
   await page.locator('.r6-test-guide .device-close').click();
   await page.evaluate(()=>showSixthRoom({introSeen:true}));assert.equal(await page.locator('#r6TestGuide').count(),0);
   await page.screenshot({path:path.join(dir,'a8-white.png')});
   assert((await page.locator('.r6-floor').evaluate(el=>getComputedStyle(el).backgroundImage)).includes('clean-room-v2.webp'));
   for(const id of ['D4','H1','D1']){
    await page.evaluate(id=>showSixthRoom({introSeen:true,current:id}),id);
    await page.screenshot({path:path.join(dir,'clean-room-'+id+'.png')});
   }
   await page.evaluate(()=>showSixthRoom({introSeen:true}));
   await page.emulateMedia({reducedMotion:'no-preference'});
   await page.mouse.click(scene.x+scene.width*.5,scene.y+scene.height*.38);
   await page.waitForSelector('.r6-travel-shade');
   assert(await page.locator('.r6-full').evaluate(el=>el.inert),'room input locked while travelling');
   assert.equal(await page.locator('.r6-space').getAttribute('data-travel'),'north');
   assert.equal(await page.locator('.r6-travel-label').innerText(),'正面の部屋へ');
   await page.waitForTimeout(100);
   assert.notEqual(await page.locator('.r6-space').evaluate(el=>getComputedStyle(el).transform),'none');
   await page.screenshot({path:path.join(dir,'travel-fade.png')});
   await page.waitForSelector('.r6-travel-shade',{state:'detached'});await finish();
   assert.equal(await page.locator('.r6-scene').getAttribute('data-current'),'A7');
   await page.emulateMedia({reducedMotion:'reduce'});
   await page.evaluate(()=>showSixthRoom({introSeen:true}));
   const doorClick=async side=>{const b=await page.locator('.r6-scene').boundingBox();const points={north:[.50,.38],east:[.92,.45],west:[.07,.45],south:[.50,.96]};const [x,y]=points[side];await page.mouse.click(b.x+b.width*x,b.y+b.height*y);await finish()};
   await doorClick('east');assert.equal(await page.locator('.r6-scene').getAttribute('data-current'),'B8');
   await doorClick('east');assert.equal(await page.locator('.r6-scene').getAttribute('data-current'),'C8');
   assert.equal(await page.locator('.r6-scene').getAttribute('data-color'),'green');
   await page.evaluate(()=>showSixthRoom({introSeen:true,current:'C8',visited:['A8','B8','C8','C7','C6','C5'],mapEvent:true,interview4:true,edges:[['A8','B8'],['B8','C8'],['C8','C7'],['C7','C6'],['C6','C5']]}));
   assert.equal(await page.locator('[data-cell]').count(),6);
   await page.locator('[data-cell="A8"]').click();assert.equal(await page.locator('.r6-scene').getAttribute('data-current'),'A8');
   await doorClick('east');assert.equal(await page.locator('.r6-scene').getAttribute('data-current'),'B8');
   assert.equal(await page.locator('.r6-map').count(),1,'map remains open while using door');
   await page.locator('[data-cell="C8"]').click();await page.screenshot({path:path.join(dir,'green-live-map.png')});
   await page.evaluate(()=>showSixthRoom({introSeen:true,current:'H8',visited:['A8','B8','D1','A1','H1','H8'],mapEvent:true,interview4:true}));
   await doorClick('north');
   assert(await page.evaluate(()=>room6State.othelloKnown&&room6State.mapComplete),'discovery conversation reveals full map');
   assert.equal(await page.locator('[data-cell]').count(),64);
   assert(!(await page.evaluate(()=>room6State.visited.includes('G6'))));
   await page.locator('[data-cell="G6"]').click();await finish();
   assert.equal(await page.locator('.r6-scene').getAttribute('data-current'),'G6','revealed unvisited room can be selected');
   await page.screenshot({path:path.join(dir,'revealed-full-map.png')});
   const all=Array.from({length:64},(_,i)=>String.fromCharCode(65+i%8)+(Math.floor(i/8)+1));
   await page.evaluate(ids=>showSixthRoom({introSeen:true,current:'D1',visited:ids,mapEvent:true,interview4:true,othelloKnown:true,mapComplete:true}),all);
   const paper=await page.locator('.r6-map-paper').boundingBox();assert(paper.x>=scene.x&&paper.y>=scene.y&&paper.x+paper.width<=scene.x+scene.width+1&&paper.y+paper.height<=scene.y+scene.height+1,'map within game');
   const grid=await page.locator('.r6-map').boundingBox();
   assert(grid.x>=paper.x&&grid.x+grid.width<=paper.x+paper.width,'map cells remain on paper');
   const hana=await page.locator('#r6Hana').boundingBox();assert(hana.x>scene.x+scene.width*.6,'Hana retains right-side placement');
   assert(paper.x+paper.width<hana.x,'compact map never covers Hana');
   const wall=await page.locator('#r6WallText').boundingBox();assert(paper.y+paper.height<wall.y,'map keeps wall writing readable');
   assert(hana.y+hana.height<scene.y+scene.height*.82,'feet remain grounded in the middle of the room');
   assert(hana.height>scene.height*.55,'Hana has adult scale beside the doors');
   assert.equal(await page.locator('.r6-map-location').innerText(),'現在地 D1');
   await page.screenshot({path:path.join(dir,'full-map.png')});
   // Same-color rooms and every exit remain distinguishable without a dialogue.
   await page.emulateMedia({reducedMotion:'no-preference'});
   await page.evaluate(ids=>showSixthRoom({introSeen:true,current:'D4',visited:ids,mapEvent:true,mapComplete:true,othelloKnown:true,interview4:true}),all);
   for(const [direction,destination] of [['north','D3'],['east','E3'],['south','E4'],['west','D4']]){
    const b=await page.locator('.r6-scene').boundingBox();const points={north:[.5,.38],east:[.92,.45],west:[.07,.45],south:[.5,.96]};const [x,y]=points[direction];
    const prior=await page.locator('.r6-scene').getAttribute('data-current');
    await page.mouse.click(b.x+b.width*x,b.y+b.height*y);
    assert.equal(await page.locator('.r6-space').getAttribute('data-travel'),direction);
    await page.waitForSelector('.r6-travel-shade',{state:'detached'});
    assert.equal(await page.locator('.r6-scene').getAttribute('data-current'),destination);
    assert.equal(await page.locator('.r6-arrival').innerText(),prior+' → '+destination);
    assert.equal(await page.locator('.r6-cell.current.just-arrived').getAttribute('data-cell'),destination);
   }
   await page.locator('[data-cell="H4"]').click();await page.waitForSelector('.r6-travel-shade',{state:'detached'});
   assert.equal(await page.locator('.r6-scene').getAttribute('data-current'),'H4');
   assert.equal(await page.locator('.r6-arrival').innerText(),'D4 → H4');
   await page.screenshot({path:path.join(dir,'map-arrival.png')});
   await page.emulateMedia({reducedMotion:'reduce'});
   await page.evaluate(ids=>showSixthRoom({introSeen:true,current:'D1',visited:ids,mapEvent:true,mapComplete:true,othelloKnown:true,interview4:true}),all);
   await page.locator('#r6Hana').click();
   assert.equal(await page.locator('[data-r6-hint="mechanism"]').count(),0);
   await page.screenshot({path:path.join(dir,'hint-menu.png')});
   for(const level of [1,2,3]){
    if(level>1)await page.locator('#r6Hana').click();
    await page.waitForTimeout(300);
    await page.locator('[data-r6-hint="hint-'+level+'"]').click();await finish();
   }
   await page.locator('#r6Hana').click();await page.waitForTimeout(300);await page.locator('[data-r6-hint="next-move"]').click();
   assert((await page.locator('#roomMessage').innerText()).includes('D1'));
   await page.screenshot({path:path.join(dir,'specific-hint.png')});await finish();
   assert.equal(await page.evaluate(()=>room6State.moves.length),0);
   await page.locator('#r6White').click();await finish();assert.equal(await page.locator('.r6-scene').getAttribute('data-color'),'white');assert.equal(await page.locator('.r6-lever').getAttribute('data-state'),'white');
   await page.locator('#r6Undo').click();assert.equal(await page.locator('.r6-scene').getAttribute('data-color'),'green');
   await page.locator('#r6White').click();await finish();
   await page.locator('[data-cell="H4"]').click();await page.locator('#r6Black').click();assert.equal(await page.locator('.r6-scene').getAttribute('data-color'),'black');
   await page.screenshot({path:path.join(dir,'black-selected.png')});
   await page.locator('#r6MapExpand').click();await page.screenshot({path:path.join(dir,'expanded-map.png')});
   await page.locator('#r6MapToggle').click();assert.equal(await page.locator('.r6-map').count(),0);await page.locator('#r6MapToggle').click();
   for(const [i,id] of ['D2','G5','G6','G3','C8','C2','H2'].entries()){
    await page.evaluate(()=>{room6State.mapExpanded=false;showSixthRoom(room6State)});
    await page.locator('[data-cell="'+id+'"]').click();await page.locator(i%2===0?'#r6White':'#r6Black').click();
    if(id==='H2'){
     await page.evaluate(()=>{for(let n=0;n<800&&document.querySelector('#roomNextButton')&&!document.querySelector('#roomMessage')?.textContent.includes('今日ね、新しいの');n++)document.querySelector('#roomNextButton').click()});
     assert((await page.locator('#roomMessage').innerText()).includes('今日ね、新しいの'));
     assert.equal(await page.locator('.room-dialog-overlay').getAttribute('data-memory-stage'),'expressive');
     await page.screenshot({path:path.join(dir,'memory-first-half.png')});
    }
    await finish();
   }
   assert(await page.evaluate(()=>room6State.completed&&room6State.board.every(c=>c==='W')));
   assert.equal(await page.locator('#r6Next').count(),1);
   assert.deepEqual(errors,[]);console.log('PASS',spec.name,'assets, fixed-view exits, map travel, 9 moves and completion');
  }finally{await browser.close()}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
