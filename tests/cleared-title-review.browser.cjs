const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');

(async()=>{
 for(const spec of [
  {name:'pc-clear',engine:chromium,viewport:{width:1366,height:768},cleared:true},
  {name:'phone-clear',engine:webkit,viewport:{width:852,height:393},cleared:true,mobile:true},
  {name:'pc-normal',engine:chromium,viewport:{width:1366,height:768},cleared:false},
  {name:'fallback-clear',engine:chromium,viewport:{width:852,height:393},cleared:true,fail:true},
 ]){
  const browser=await spec.engine.launch({headless:true});
  const context=await browser.newContext({viewport:spec.viewport,isMobile:!!spec.mobile,hasTouch:!!spec.mobile});
  const page=await context.newPage(), errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(cleared=>{
   localStorage.clear();
   localStorage.setItem('saigononazo-first-visit-notice-v1','accepted');
   if(cleared)localStorage.setItem('saigononazo-guide-unlocked-v1','1');
  },spec.cleared);
  if(spec.fail)await page.route('**/title-cleared-background-v2.png*',route=>route.abort());
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('.title-home:not(.title-art-loading)',{timeout:20000});
  await page.evaluate(()=>document.fonts.ready);
  const h1=page.locator('.title-logo');
  if(spec.cleared){
   assert.equal(await h1.locator('img').getAttribute('src'),'images/ui/title-logo.jpg');
   assert.equal(await h1.locator('img').getAttribute('alt'),'最後の謎が解けるまで');
   if(!spec.fail){
    assert.equal(await h1.evaluate(el=>getComputedStyle(el).filter),'none');
    assert.equal(await h1.locator('img').evaluate(el=>getComputedStyle(el).filter),'none');
    assert.equal(await page.locator('.title-menu').evaluate(el=>getComputedStyle(el).mixBlendMode),'screen');
   }
   assert(await page.locator('.title-cleared').count());
   if(spec.fail){
    assert(await page.locator('.title-art-fallback').count());
    assert.equal(await h1.evaluate(el=>getComputedStyle(el).filter),'none','fallback text must not be inverted to black');
    assert.equal(await h1.locator('.title-text-fallback').innerText(),'最後の謎が解けるまで');
    assert.equal(await page.locator('#commentButton').getAttribute('aria-label'),'あとがき');
   }
   else assert((await page.locator('.title-home').evaluate(el=>el.style.backgroundImage)).includes('title-cleared-background-v2.png'));
  }else{
   assert.equal(await h1.locator('img').getAttribute('alt'),'最後の謎が解けるまで');
   assert.equal(await page.locator('.title-cleared').count(),0);
  }
  const titleBox=await h1.boundingBox(),menuBox=await page.locator('.title-menu').boundingBox();
  const gameBox=await page.locator('#game').boundingBox();
  const trigger=page.locator('#titleCommunityButton');
  const overlay=page.locator('#titleCommunityOverlay');
  assert.equal(await trigger.count(),1,'subtle author contact control is present on both titles');
  assert.equal(await trigger.innerText(),'作者・お問い合わせ');
  assert.equal(await trigger.getAttribute('aria-haspopup'),'dialog');
  assert.equal(await overlay.isVisible(),false,'social details are not printed over the title art');
  const contactBox=await trigger.boundingBox();
  assert(titleBox&&menuBox&&gameBox&&contactBox);
  assert(titleBox.x>=gameBox.x-1&&titleBox.x+titleBox.width<=gameBox.x+gameBox.width+1,'title remains in game');
  assert(titleBox.y+titleBox.height<menuBox.y,'title and menu do not overlap');
  assert(contactBox.x>=menuBox.x+menuBox.width-1,'author contact must not cover the handwritten menu');
  assert(contactBox.x>=gameBox.x-1&&contactBox.y>=gameBox.y-1&&contactBox.x+contactBox.width<=gameBox.x+gameBox.width+1&&contactBox.y+contactBox.height<=gameBox.y+gameBox.height+1,'author control stays in game');
  if(spec.cleared){
    const reset=page.locator('#resetProgressButton');
    await reset.waitFor({state:'visible'});
    const resetBox=await reset.boundingBox();
    assert(contactBox.y+contactBox.height<resetBox.y,'author control stays above the reset button');
  }
  await trigger.click();
  await overlay.waitFor({state:'visible'});
  assert.equal(await trigger.getAttribute('aria-expanded'),'true');
  const profile=overlay.locator('.title-community-account');
  assert.equal(await profile.getAttribute('href'),'https://x.com/arissa_juno');
  assert.equal(await profile.getAttribute('target'),'_blank');
  assert.match(await profile.getAttribute('rel'),/noopener/);
  assert.match(await overlay.innerText(),/質問・不具合報告は、XのDMまで/);
  assert.match(await overlay.innerText(),/#最後の謎が解けるまで/);
  await page.keyboard.press('Escape');
  assert.equal(await overlay.isVisible(),false,'Escape closes the optional notice');
  assert.equal(await trigger.getAttribute('aria-expanded'),'false');
  assert.equal(await trigger.evaluate(el=>el===document.activeElement),true,'focus returns to author control');
  fs.mkdirSync('artifacts/title-clear-review',{recursive:true});
  await page.screenshot({path:`artifacts/title-clear-review/${spec.name}.png`});
  if(spec.cleared&&!spec.fail){
   const clip={x:Math.round(gameBox.x+gameBox.width*.85),y:Math.round(gameBox.y+gameBox.height*.8),width:8,height:8};
   const withTitle=await page.screenshot({clip});
   await h1.evaluate(el=>el.style.visibility='hidden');
   const withoutTitle=await page.screenshot({clip});
   assert(withTitle.equals(withoutTitle),'title filter must not paint white bands outside the logo');
   await h1.evaluate(el=>el.style.visibility='');
  }
  assert.equal(await page.locator('.title-menu #puzzleGuideButton').count(),0);
  if(spec.cleared){
   const afterword=page.locator('#commentButton');
   assert.equal(await afterword.getAttribute('aria-label'),'あとがき');
   assert.equal(await afterword.locator('img').getAttribute('src'),'images/ui/menu-afterword.jpg');
   if(!spec.fail){
    for(const image of await page.locator('.title-menu img').all()){
     assert(await image.isVisible(),'handwritten menu artwork is visible');
    }
   }
   await afterword.click();
   assert(await page.locator('.afterword').count());
   await page.locator('#puzzleGuideButton').click();
   assert(await page.locator('.pguide:not(.afterword)').count());
   await page.locator('#pguideNext').click();
   assert.match(await page.locator('.pguide-index').innerText(),/第2/);
   await page.locator('#pguideBack').click();
   await page.locator('#afterwordBack').click();
  }else assert(await page.locator('#commentButton').isDisabled());
  await page.locator('#settingsButton').click();
  assert(await page.locator('#game').innerText().then(s=>s.includes('設定')));
  assert.deepEqual(errors,[]);
  console.log('PASS',spec.name,JSON.stringify({titleBox,menuBox,gameBox}));
  await context.close();await browser.close();
 }
})().catch(e=>{console.error(e);process.exitCode=1});
