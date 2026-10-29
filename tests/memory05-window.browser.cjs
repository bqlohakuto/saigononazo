const {chromium,webkit}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),base=process.env.PUBLIC_BASE_URL||'https://memory05.local/';
const out=process.env.UI_SCREENSHOT_DIR||path.join(root,'artifacts/memory05-window');
async function reach(page,id){
 const found=await page.evaluate(id=>{
  for(let n=0;n<1500;n++){
   if(GameLog.list().at(-1)?.id.startsWith(id+'_'))return true;
   if(!document.querySelector('#roomNextButton'))return false;
   Dialogue.advance();
  }
  return false;
 },id);assert(found,'Reached '+id);
}
async function fit(page){
 const result=await page.evaluate(()=>{
  const dialog=document.querySelector('.room-dialog'),portrait=dialog.querySelector('.memory-window-portrait');
  const d=dialog.getBoundingClientRect(),p=portrait.getBoundingClientRect(),g=game.getBoundingClientRect(),a=dialog.querySelector('.dialog-message-area');
  return {above:p.top<d.top,inside:p.top>=g.top&&p.left>=g.left&&p.right<=g.right&&p.bottom<=g.bottom,
   overflow:getComputedStyle(dialog).overflow,overlap:portrait.getBoundingClientRect().right>a.getBoundingClientRect().left+3,
   textScroll:a.scrollHeight>a.clientHeight+2};
 });
 assert(result.above&&result.inside,'upper body extends above window within playfield');
 assert.equal(result.overflow,'visible','head must not be clipped by the window');
 assert.equal(result.overlap,false,'portrait leaves space for text');assert.equal(result.textScroll,false,'text pages fit');
}
(async()=>{
 const desktopBrowser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 const mobileBrowser=process.env.BROWSER_EXECUTABLE?desktopBrowser:await webkit.launch({headless:true});
 fs.mkdirSync(out,{recursive:true});
 try{for(const spec of [{name:'desktop',width:1366,height:768},{name:'phone',width:852,height:393,touch:true}]){
  const browser=spec.touch?mobileBrowser:desktopBrowser;
  const ctx=await browser.newContext({viewport:{width:spec.width,height:spec.height},hasTouch:!!spec.touch,isMobile:!!spec.touch,reducedMotion:spec.touch?'reduce':'no-preference'});
  await ctx.addInitScript(()=>localStorage.setItem('saigononazo-help-seen','1'));
  const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  if(!process.env.PUBLIC_BASE_URL)await page.route(base+'**',r=>{
   const f=path.resolve(root,'.'+new URL(r.request().url()).pathname);return r.fulfill(fs.existsSync(f)?{path:fs.statSync(f).isDirectory()?path.join(f,'index.html'):f}:{status:404,body:''});
  });
  await page.goto(base,{waitUntil:'load'});
  await page.evaluate(()=>{settings.instantText=true;showFifthRoom({introSeen:true,doorUnlocked:true,codeRevealed:true});});
  await page.locator('#r5Rabbit').click();
  await reach(page,'r5m002');
  const paper=page.locator('.memory-prop[data-kind="rabbit"]');await paper.locator('img').evaluate(i=>i.decode());
  assert.match(await paper.locator('img').getAttribute('src'),/combinations\/rabbit-feather\.png$/);
  const p=await paper.boundingBox(),d=await page.locator('.room-dialog').boundingBox();assert(p.y+p.height<d.y,'complete drawing stays above conversation '+JSON.stringify({p,d}));
  await reach(page,'r5m008');await page.locator('.memory-window-portrait .memory-girl').evaluate(i=>i.decode());
  assert.match(await page.locator('#roomMessage').textContent(),/クマかと思った/);await fit(page);
  assert.equal(await page.locator('.memory-scene>.memory-girl:visible').count(),0,'no character pasted into the room');
  await page.screenshot({path:path.join(out,spec.name+'-rabbit.png')});
  await reach(page,'r5m014');assert.equal(await page.locator('.memory-window-portrait:visible').count(),1,'narration retains her');await fit(page);
  await page.locator('[data-design-log]').click();assert.equal(await page.locator('.memory-window-portrait:visible').count(),0,'portrait leaves the log readable');
  await page.locator('[data-design-log]').click();assert.equal(await page.locator('.memory-window-portrait:visible').count(),1);
  await page.getByRole('button',{name:'非表示',exact:true}).click();assert.equal(await page.locator('.memory-window-portrait:visible').count(),1);
  assert.equal(await page.locator('.room-dialog').evaluate(el=>getComputedStyle(el).boxShadow),'none','hide removes the translucent window outline');
  await page.locator('.dialogue-restore').click({position:{x:500,y:100}});
  await reach(page,'r5m038');await page.locator('.memory-girl').evaluate(i=>i.decode());await fit(page);
  await page.locator('#roomMessage').filter({hasText:'その間やめて'}).waitFor({state:'visible'});
  assert.equal(await page.locator('.memory-prop').isVisible(),false,'E08: no substitute notebook drawing');
  assert.equal(await page.locator('.memory-notebook,.memory-appliance-box').count(),0);
  await page.screenshot({path:path.join(out,spec.name+'-pout.png')});
  await reach(page,'r5m076');assert.equal(await page.locator('#roomMessage').evaluate(el=>{const copy=el.cloneNode(true);copy.querySelectorAll('button').forEach(b=>b.remove());return copy.textContent;}),'急に言われても無理だよ。');
  await reach(page,'r5m103');await page.locator('.memory-girl').evaluate(i=>i.decode());await fit(page);
  await page.screenshot({path:path.join(out,spec.name+'-morning.png')});
  await reach(page,'r5m150');await page.locator('.memory-girl').evaluate(i=>i.decode());await fit(page);
  await page.locator('#roomMessage').filter({hasText:'新しく買った家電が届いた日'}).waitFor({state:'visible'});
  assert.equal(await page.locator('.memory-prop').isVisible(),false,'E08: no substitute appliance or manual drawing');
  assert.equal(await page.locator('.memory-notebook,.memory-appliance-box').count(),0);
  await page.screenshot({path:path.join(out,spec.name+'-appliance.png')});
  await reach(page,'r5m248');await page.locator('.memory-girl').evaluate(i=>i.decode());await fit(page);
  assert.equal(await page.locator('.memory-prop[data-kind="cards"]').isVisible(),false,'recollection does not display the puzzle card overlay');
  await page.evaluate(()=>{for(let n=0;n<1800&&document.querySelector('#roomNextButton');n++)Dialogue.advance();});
  assert.equal(await page.locator('.memory-window-portrait').count(),0,'remove portrait after recollection');
  assert.equal(await page.locator('.memory-scene').count(),0);assert.deepEqual(errors,[]);
  await ctx.close();console.log('PASS '+spec.name+': full Room 5 memory, drawing visibility, window portraits, narration, revised lines and return');
 }}finally{if(mobileBrowser!==desktopBrowser)await mobileBrowser.close();await desktopBrowser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
