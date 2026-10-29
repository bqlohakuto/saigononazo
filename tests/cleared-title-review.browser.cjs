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
   if(cleared)localStorage.setItem('saigononazo-guide-unlocked-v1','1');
  },spec.cleared);
  if(spec.fail)await page.route('**/title-cleared-background-v2.png*',route=>route.abort());
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('.title-home:not(.title-art-loading)',{timeout:20000});
  await page.evaluate(()=>document.fonts.ready);
  const h1=page.locator('.title-logo');
  if(spec.cleared){
   assert.equal(await h1.locator('img').getAttribute('src'),'images/ui/title-cleared-logo.jpg');
   assert.equal(await h1.locator('img').getAttribute('alt'),'最後の謎が解けても');
   if(!spec.fail){
    assert.equal(await h1.evaluate(el=>getComputedStyle(el).filter),'none');
    assert.match(await h1.locator('img').evaluate(el=>getComputedStyle(el).filter),/cleared-title-ink/);
    assert.equal(await page.locator('.title-menu').evaluate(el=>getComputedStyle(el).mixBlendMode),'normal');
   }
   assert(await page.locator('.title-cleared').count());
   if(spec.fail){
    assert(await page.locator('.title-art-fallback').count());
    assert.equal(await h1.evaluate(el=>getComputedStyle(el).filter),'none','fallback text must not be inverted to black');
    assert.equal(await h1.locator('.title-text-fallback').innerText(),'最後の謎が解けても');
    const guide=page.locator('#puzzleGuideButton');
    await guide.waitFor();
    assert.equal(await guide.innerText(),'謎の解説');
    assert.equal(await guide.evaluate(el=>getComputedStyle(el,'::after').content),'none');
   }
   else assert((await page.locator('.title-home').evaluate(el=>el.style.backgroundImage)).includes('title-cleared-background-v2.png'));
  }else{
   assert.equal(await h1.locator('img').getAttribute('alt'),'最後の謎が解けるまで');
   assert.equal(await page.locator('.title-cleared').count(),0);
  }
  const titleBox=await h1.boundingBox(),menuBox=await page.locator('.title-menu').boundingBox();
  const gameBox=await page.locator('#game').boundingBox();
  assert(titleBox&&menuBox&&gameBox);
  assert(titleBox.x>=gameBox.x-1&&titleBox.x+titleBox.width<=gameBox.x+gameBox.width+1,'title remains in game');
  assert(titleBox.y+titleBox.height<menuBox.y,'title and menu do not overlap');
  fs.mkdirSync('artifacts/title-clear-review',{recursive:true});
  await page.screenshot({path:`artifacts/title-clear-review/${spec.name}.png`});
  await page.locator('#settingsButton').click();
  assert(await page.locator('#game').innerText().then(s=>s.includes('設定')));
  assert.deepEqual(errors,[]);
  console.log('PASS',spec.name,JSON.stringify({titleBox,menuBox,gameBox}));
  await context.close();await browser.close();
 }
})().catch(e=>{console.error(e);process.exitCode=1});
