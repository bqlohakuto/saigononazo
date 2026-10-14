const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const base=process.env.PUBLIC_BASE_URL||'https://bqlohakuto.github.io/saigononazo/';
(async()=>{
 for(const spec of [{name:'pc',engine:chromium,viewport:{width:1366,height:768}},{name:'landscape',engine:webkit,viewport:{width:852,height:393},mobile:true}]){
  const browser=await spec.engine.launch({headless:true});
  try{
   const ctx=await browser.newContext({viewport:spec.viewport,isMobile:!!spec.mobile,hasTouch:!!spec.mobile,reducedMotion:'reduce'});
   await ctx.addInitScript(()=>localStorage.setItem('saigononazo-help-seen','1'));
   const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'?r6review='+Date.now(),{waitUntil:'load'});
   const assets=['white','black','green','walls','inner','lever-neutral','lever-white','lever-black','map-paper'];
   await page.evaluate(async names=>{for(const n of names){const im=new Image();im.src='images/background/room06/'+n+'.webp';await im.decode();if(im.naturalWidth<100)throw new Error('bad asset '+n)}},assets);
   const finish=()=>page.evaluate(()=>{for(let i=0;i<800&&document.querySelector('#roomNextButton');i++)document.querySelector('#roomNextButton').click()});
   await page.evaluate(()=>{settings.instantText=true;showSixthRoom({introSeen:true})});
   assert.equal(await page.locator('[data-dest]').count(),2);assert.equal(await page.locator('.r6-map').count(),0);
   const scene=await page.locator('.r6-scene').boundingBox();assert(scene.width>600&&scene.height>250);
   const dir=path.join('artifacts','room06',spec.name);fs.mkdirSync(dir,{recursive:true});
   await page.screenshot({path:path.join(dir,'a8-white.png')});
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
   const all=Array.from({length:64},(_,i)=>String.fromCharCode(65+i%8)+(Math.floor(i/8)+1));
   await page.evaluate(ids=>showSixthRoom({introSeen:true,current:'D1',visited:ids,mapEvent:true,interview4:true,othelloKnown:true}),all);
   const paper=await page.locator('.r6-map-paper').boundingBox();assert(paper.x>=scene.x&&paper.y>=scene.y&&paper.x+paper.width<=scene.x+scene.width+1&&paper.y+paper.height<=scene.y+scene.height+1,'map within game');
   await page.screenshot({path:path.join(dir,'full-map.png')});
   await page.locator('#r6White').click();await finish();assert.equal(await page.locator('.r6-scene').getAttribute('data-color'),'white');assert.equal(await page.locator('.r6-lever').getAttribute('data-state'),'white');
   await page.locator('#r6Undo').click();assert.equal(await page.locator('.r6-scene').getAttribute('data-color'),'green');
   await page.locator('#r6White').click();await finish();
   await page.locator('[data-cell="H4"]').click();await page.locator('#r6Black').click();assert.equal(await page.locator('.r6-scene').getAttribute('data-color'),'black');
   await page.screenshot({path:path.join(dir,'black-selected.png')});
   await page.locator('#r6MapExpand').click();await page.screenshot({path:path.join(dir,'expanded-map.png')});
   await page.locator('#r6MapToggle').click();assert.equal(await page.locator('.r6-map').count(),0);await page.locator('#r6MapToggle').click();
   for(const [i,id] of ['D2','G5','G6','G3','C8','C2','H2'].entries()){
    await page.evaluate(()=>{room6State.mapExpanded=false;showSixthRoom(room6State)});
    await page.locator('[data-cell="'+id+'"]').click();await page.locator(i%2===0?'#r6White':'#r6Black').click();await finish();
   }
   assert(await page.evaluate(()=>room6State.completed&&room6State.board.every(c=>c==='W')));
   assert.equal(await page.locator('#r6Next').count(),1);
   assert.deepEqual(errors,[]);console.log('PASS',spec.name,'assets, fixed-view exits, map travel, 9 moves and completion');
  }finally{await browser.close()}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
