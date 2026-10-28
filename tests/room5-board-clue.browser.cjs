'use strict';
const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const base=process.env.PUBLIC_BASE_URL||'https://bqlohakuto.github.io/saigononazo/';
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const revision=html.match(/late-game[.]js[?]v=([^"']+)/)?.[1];
const specs=[
 {name:'pc-chromium',engine:chromium,viewport:{width:1366,height:768},mobile:false},
 {name:'phone-landscape-webkit',engine:webkit,viewport:{width:852,height:393},mobile:true}
];
const all=['mirror','fish','butterfly','flower','squid','chair','cannon'];
async function loadLatest(page){
 for(let n=0;n<24;n++){
  const response=await page.goto(base+'?room5_clue_e10='+Date.now(),{waitUntil:'load',timeout:60000});
  const script=await page.locator('script[src*="late-game.js"]').getAttribute('src');
  if(response?.ok()&&script?.includes(revision))return;
  await page.waitForTimeout(6000);
 }
 throw Error('Published release is not yet '+revision);
}
async function enter(page,state={}){
 await page.evaluate(s=>{settings.instantText=true;showFifthRoom({introSeen:true,...s});},state);
 await page.waitForFunction(()=>document.querySelector('#r5Scene')?.classList.contains('has-r5-background'));
}
async function readToBoard(page,out){
 const pages=[];
 for(let n=0;n<100;n++){
  if(await page.locator('.r5-board-panel').isVisible())return pages;
  await page.waitForFunction(()=>document.querySelector('#roomMessage .message')?.textContent?.length>0);
  const message=await page.locator('#roomMessage .message').textContent();pages.push(message);
  if(out&&message.includes('描かれたものを正しく数え'))await page.screenshot({path:path.join(out,'clue.png')});
  if(out&&message.includes('この丸い枠に'))await page.screenshot({path:path.join(out,'hana.png')});
  await page.locator('#roomNextButton').click();
 }
 throw Error('Dialogue did not reach the board');
}
(async()=>{
 assert(revision,'Cache revision is present');
 for(const spec of specs){
  const browser=await spec.engine.launch({headless:true,...(spec.mobile?{}:{channel:'chrome'})});
  try{
   const context=await browser.newContext({viewport:spec.viewport,isMobile:spec.mobile,hasTouch:spec.mobile,deviceScaleFactor:spec.mobile?2:1,reducedMotion:'reduce'});
   await context.addInitScript(()=>localStorage.setItem('saigononazo-help-seen','1'));
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await loadLatest(page);await enter(page);
   const out=path.join('artifacts','room05-board-clue',spec.name);fs.mkdirSync(out,{recursive:true});
   assert.equal(await page.locator('#gameplayObjectiveText').count(),0,'The existing HUD has no displayed objective');
   await page.locator('#r5Board').click();
   assert.equal(await page.locator('.r5-board-panel').count(),0,'The first dialogue precedes the board');
   assert.equal(await page.evaluate(()=>room5State.boardClueSeen),false,'A partially read conversation is not marked complete');
   const pages=await readToBoard(page,out);
   const text=pages.join('');
   for(const line of ['パネルには、短い文章が書かれている。','描かれたものを正しく数え、あるべき場所へ導け。','数えて、あるべき場所へ……？','この丸い枠に、何かをはめるのかな','部屋にも、手がかりがあるかもしれませんね。'])assert(text.includes(line),'Visible first-inspection dialogue includes '+line);
   assert.equal(await page.locator('.r5-problem').textContent(),'描かれたものを正しく数え、あるべき場所へ導け。');
   assert.equal(await page.evaluate(()=>room5State.boardClueSeen),true);
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('saigononazo-save-v1')).rooms.room05.boardClueSeen),true);
   await page.screenshot({path:path.join(out,'board.png')});
   await page.locator('.r5-board-panel .device-close').click();await page.locator('#r5Board').click();
   assert.equal(await page.locator('.room-dialog-overlay').count(),0,'Reopening does not repeat the clue');
   const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('saigononazo-save-v1')).rooms.room05);
   await page.reload({waitUntil:'load'});await enter(page,saved);await page.locator('#r5Board').click();
   assert.equal(await page.locator('.room-dialog-overlay').count(),0,'The same holds after reload');

   // The exploration order is free: even when all pieces come first, the
   // approved clue is followed by the previously authored seven-piece dialogue.
   await enter(page,{collected:all});await page.locator('#r5Board').click();
   const collectedPages=await readToBoard(page);const joined=collectedPages.join('');
   assert(joined.indexOf('描かれたものを正しく数え')>=0);
   assert(joined.indexOf('これで、全部集まりましたね。')>joined.indexOf('描かれたものを正しく数え'));
   assert.equal(await page.locator('.r5-inventory [data-tile]').count(),7);
   assert.equal(await page.evaluate(()=>room5State.boardIntroSeen&&room5State.boardClueSeen),true);

   // A save from before this change that already used the board skips the new first visit.
   await enter(page,{boardIntroSeen:true,collected:all});await page.locator('#r5Board').click();
   assert.equal(await page.locator('.room-dialog-overlay').count(),0);
   assert.equal(await page.locator('.r5-board-panel').count(),1);
   assert.deepEqual(errors,[]);
   await context.close();console.log('PASS '+spec.name+': clue, discovery order, repeat, reload and old save');
  }finally{await browser.close()}
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
