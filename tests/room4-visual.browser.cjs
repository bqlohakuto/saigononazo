const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const url=process.env.PUBLIC_BASE_URL||'https://bqlohakuto.github.io/saigononazo/';
const version=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8').match(/room4.js\?v=([^"']+)/)[1];
async function finish(page){
 for(let i=0;i<240&&await page.locator('.room-dialog-overlay').count();i++){
  await page.locator('#roomNextButton').click({force:true});await page.waitForTimeout(15);
 }
 assert.equal(await page.locator('.room-dialog-overlay').count(),0,'Dialogue finishes');
 // The room deliberately opens a separate "入手" modal after collecting each panel.
 // Complete that interaction before trying another exploration target.
 const pickup=page.locator('.design-overlay .design-panel[aria-label="入手"]');
 if(await pickup.count()){
  assert(await pickup.getByText('ガラスパネル',{exact:true}).count(),'Received item should be the glass panel');
  await pickup.getByRole('button',{name:'受け取る'}).click();
  await page.locator('.design-overlay').waitFor({state:'detached'});
 }
}
(async()=>{for(const spec of [{name:'desktop',engine:chromium,viewport:{width:1366,height:768},channel:'chrome'},{name:'landscape-webkit',engine:webkit,viewport:{width:852,height:393}}]){
 const browser=await spec.engine.launch({headless:true,...(spec.channel?{channel:spec.channel}:{})});
 try{
 const ctx=await browser.newContext({viewport:spec.viewport,isMobile:!spec.channel,hasTouch:!spec.channel,reducedMotion:'reduce'});
 await ctx.addInitScript(()=>localStorage.setItem('saigononazo-help-seen','1'));
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 let deployed=false;for(let i=0;i<24;i++){await page.goto(url+'?room4_review='+Date.now());if((await page.locator('script[src*="room4.js"]').getAttribute('src')).includes(version)){deployed=true;break}await page.waitForTimeout(8000)}assert(deployed,'Expected deployed version');
 const dir=path.join('artifacts/room04',spec.name);fs.mkdirSync(dir,{recursive:true});
 await page.evaluate(()=>{settings.instantText=true;showFourthRoom({})});await finish(page);
 const expected={front:['r4Door','r4Wall','r4Box','r4Hana'],right:['r4Const','r4Flowers','r4P1'],back:['r4Meteor','r4Moon','r4P2','r4P3'],left:['r4Light','r4Stand']};
 for(const view of ['front','right','back','left']){
 assert.equal(await page.locator('.room4-stage').getAttribute('data-view'),view);
 assert.deepEqual((await page.locator('.r4obj:not([hidden])').evaluateAll(bs=>bs.map(b=>b.id))).sort(),expected[view].sort());
 assert.deepEqual(await page.locator('#r4Background').evaluate(async img=>{await img.decode();return [img.naturalWidth,img.naturalHeight]}),[1672,941]);
 const stage=await page.locator('.room4-stage').boundingBox();for(const b of await page.locator('.r4obj:not([hidden])').all()){const r=await b.boundingBox();assert(r.x>=stage.x-1&&r.y>=stage.y-1&&r.x+r.width<=stage.x+stage.width+1&&r.y+r.height<=stage.y+stage.height+1,'Target within stage')}
 assert.equal(await page.locator('#r4LightOverlay').isVisible(),false,'Light starts off');
 await page.screenshot({path:path.join(dir,view+'.png')});await page.locator('#r4TurnRight').click();
 }
 await page.locator('#r4Wall').click();await finish(page);assert(await page.evaluate(()=>room4State.wall));
 await page.locator('#r4Box').click();await finish(page);assert(await page.evaluate(()=>room4State.box));
 await page.locator('#r4Door').click();await finish(page);
 await page.locator('#r4TurnRight').click();await page.locator('#r4Const').click();await finish(page);await page.locator('#r4Flowers').click();await finish(page);
 await page.locator('#r4P1').click();await page.locator('.r4-mini input').fill('STAR');await page.locator('.r4-answer').click();await finish(page);assert(await page.evaluate(()=>room4State.star));
 await page.locator('#r4TurnRight').click();await page.locator('#r4Meteor').click();await finish(page);await page.locator('#r4Moon').click();await finish(page);
 await page.locator('#r4P2').click();await page.locator('.r4-mini input').fill('LIGHT');await page.locator('.r4-answer').click();await finish(page);assert(await page.evaluate(()=>room4State.lightPuzzle));
 await page.locator('#r4P3').click();
 for(const [i,value] of ['赤M','橙E','黄T','緑E','青O','藍R','紫S'].entries()){
  let values=await page.locator('.r4-rainbow b').allTextContents(),j=values.indexOf(value);
  while(j>i){await page.locator(`.r4-rainbow button[data-i="${j}"][data-d="-1"]`).click();j--;if(!(await page.locator('.r4-mini-overlay').count()))break}
 }
 await finish(page);assert(await page.evaluate(()=>room4State.meteors));assert.equal(await page.locator('#r4Count').textContent(),'ガラスパネル 5 / 5');
 await page.locator('#r4TurnRight').click();await page.locator('#r4Light').click();await finish(page);
 assert(await page.locator('#r4LightOverlay').isVisible());assert.deepEqual(await page.locator('#r4LightOverlay').evaluate(async img=>{await img.decode();return [img.naturalWidth,img.naturalHeight]}),[1672,941]);
 await page.screenshot({path:path.join(dir,'left-light-on.png')});
 await page.evaluate(()=>{const saved=JSON.parse(JSON.stringify(room4State));showFourthRoom(saved)});await finish(page);assert.equal(await page.locator('.room4-stage').getAttribute('data-view'),'left');assert(await page.locator('#r4LightOverlay').isVisible());
 await page.locator('#r4TurnRight').click();assert.equal(await page.locator('#r4LightOverlay').isVisible(),false,'Light only appears in projection view');
 await page.locator('#r4TurnLeft').click();await page.locator('#r4Stand').click();assert(await page.locator('.room-four').evaluate(el=>el.inert));
 for(const [i,n] of [1,3,2,0,1].entries())for(let j=0;j<n;j++)await page.locator(`.r4-panels button[data-i="${i}"]`).click();
 await page.screenshot({path:path.join(dir,'panels.png')});await page.locator('.r4-shine').click();assert(await page.evaluate(()=>room4State.completed));await finish(page);assert(await page.evaluate(()=>room4State.memorySeen));
 assert.deepEqual(errors,[]);console.log(spec.name+' room 4 PASS');
 }finally{await browser.close()}
}})().catch(e=>{console.error(e);process.exit(1)});
