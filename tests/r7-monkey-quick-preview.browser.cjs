const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const out=path.join(root,'artifacts','monkey-quick');
const specs=[{name:'desktop',width:1366,height:768},{name:'phone-landscape',width:852,height:393,touch:true},{name:'small-landscape',width:667,height:375,touch:true}];
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 for(const spec of specs){
  const browser=await chromium.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:spec.width,height:spec.height},isMobile:!!spec.touch,hasTouch:!!spec.touch});
   await context.addInitScript(()=>{localStorage.setItem('saigononazo-help-seen','1');localStorage.setItem('saigononazo-settings-v1',JSON.stringify({instantText:true}))});
   const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(10000);
   await p.route('https://room7.local/**',async route=>{const rel=decodeURIComponent(new URL(route.request().url()).pathname).replace(/^\//,'')||'index.html';const file=path.resolve(root,rel);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){await route.fulfill({status:404,body:''});return}await route.fulfill({path:file})});
   await p.goto('https://room7.local/?preview=1',{waitUntil:'load'});
   await p.evaluate(()=>window.showSeventhRoom({introSeen:true,booksSolved:true,doorIndex:4,shortMemory:{zodiac:'申',progress:{logId:'r7_mem_monkey_16_01',uiPage:0}}}));
   await p.locator('.memory-scene[data-location="r7monkey"]').waitFor();
   await p.locator('.memory-background').evaluate(im=>im.decode());await p.locator('.memory-window-portrait .memory-girl').evaluate(im=>im.decode());
   await p.waitForTimeout(700);assert.equal(await p.locator('.memory-prop[data-kind="notebook"]').isVisible(),true);
   await p.screenshot({path:path.join(out,spec.name+'-open.png')});
   const state=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('saigononazo-save-v1')).rooms.room07);
   for(let n=0;n<60&&!(await state()).shortMemory.progress?.logId.startsWith('r7_mem_monkey_22_02');n++)await p.locator('#roomNextButton').click();
   assert.match(await p.locator('#roomMessage').textContent(),/彼女はノートを閉じ/);assert.equal(await p.locator('.memory-prop').isHidden(),true);
   await p.screenshot({path:path.join(out,spec.name+'-closed.png')});assert.deepEqual(errors,[]);console.log('PASS '+spec.name);
  }finally{await browser.close()}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
