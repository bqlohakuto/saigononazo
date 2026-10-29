const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..');
const out=process.env.UI_SCREENSHOT_DIR||path.join(root,'artifacts/playthrough-review');fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({headless:true,channel:'chrome'});const p=await b.newPage({viewport:process.env.SMALL_VIEWPORT?{width:852,height:393}:{width:1366,height:768}}),errors=[],missing=[];p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()===404)missing.push(r.url())});await p.addInitScript(()=>{localStorage.setItem('saigononazo-help-seen','1');localStorage.setItem('saigononazo-settings-v1',JSON.stringify({instantText:true}))});await p.route('https://review.local/**',async r=>{const f=path.resolve(root,decodeURIComponent(new URL(r.request().url()).pathname).slice(1)||'index.html');if(!f.startsWith(root.replaceAll('/',path.sep)+path.sep)||!fs.existsSync(f))return r.fulfill({status:404,body:''});await r.fulfill({path:f})});await p.goto('https://review.local/?preview=1');
async function shot(name,code){await p.evaluate(()=>{Dialogue.stop();document.querySelectorAll('.room-dialog-overlay,.design-overlay,.device-overlay').forEach(x=>x.remove())});await p.evaluate(code);await p.waitForTimeout(1000);await p.screenshot({path:path.join(out,name+'.png')});console.log(name+' rendered')}
await shot('room3','showThirdRoom({introSeen:true,bedInspected:true,doorInspected:true,view:"right"})');
await shot('counter','showFifthRoom({introSeen:true,view:"right"})');
assert.equal(await p.locator('img[src*="optional-room05-tea-tin"]').count(),1);
await shot('dining','showFifthRoom({introSeen:true,view:"left"})');
await shot('map','showSixthRoom({introSeen:true,mapEvent:true,mapComplete:true,othelloKnown:true,mapOpen:true,mapExpanded:true})');
const fits=await p.locator('.r6-map-scroll').evaluate(x=>({h:x.clientHeight,sh:x.scrollHeight,w:x.clientWidth,sw:x.scrollWidth}));assert(fits.sh<=fits.h+1&&fits.sw<=fits.w+1,JSON.stringify(fits));
await shot('memory7','currentScene="room07"; showRoomDialog([{logId:"r7_mem_monkey_10",speaker:"先輩",logType:"dialogue",text:"確認"}])');assert.equal(await p.locator('.memory-notebook').count(),0);
await p.locator('.design-controls button').filter({hasText:'設定'}).click();assert.equal(await p.locator('.design-settings').count(),1);await p.locator('.design-panel>header button').click();
await shot('planetarium','currentScene="room04";showRoomDialog([{logId:"r4f10",speaker:"ト書き",text:"驚いて、もう一度先輩を見る。"}])');assert((await p.locator('.memory-background').getAttribute('src')).includes('quiet-hand'));
await shot('bubble','showFirstRoom({doorInspected:true,questionSeen:true,hanaIntroduced:true});showRoomDialog([{logId:"review_hana",speaker:"ハナ",text:"やった！",expression:"happy"}])');assert.equal(await p.locator('.hana-emotion-bubble').count(),1);
await p.evaluate(()=>{Dialogue.stop();document.querySelector('.room-dialog-overlay').remove();showFirstRoom({doorInspected:true,questionSeen:true,hanaIntroduced:true})});await p.locator('#hanaButton').click();await p.waitForTimeout(100);assert.equal(await p.locator('#hanaButton').evaluate(x=>x.classList.contains('is-investigated')),false);await p.locator('.hana-choice-menu .device-close').click();
await shot('puzzle5','showFifthRoom({introSeen:true,boardClueSeen:true,boardIntroSeen:true,collected:["mirror","fish","butterfly","flower","squid","chair","cannon"]})');await p.locator('#r5Board').click();
const wrong={mirror:'尾',fish:'面',butterfly:'頭',flower:'輪',squid:'杯',chair:'脚',cannon:'門'};for(const [id,c]of Object.entries(wrong)){await p.locator('[data-tile="'+id+'"]').click();await p.locator('[data-counter="'+c+'"]').click();}assert.equal(await p.evaluate(()=>Object.keys(room5State.placed).length),0);
const correct={mirror:'面',fish:'尾',butterfly:'頭',flower:'輪',squid:'杯',chair:'脚',cannon:'門'};for(const [id,c]of Object.entries(correct)){await p.locator('[data-tile="'+id+'"]').click();await p.locator('[data-counter="'+c+'"]').click();}await p.locator('.room-dialog-overlay').waitFor();assert.equal(await p.evaluate(()=>room5State.codeRevealed),true);await p.screenshot({path:path.join(out,'correct-dialogue.png')});
await shot('expressions','showFirstRoom({doorInspected:true,questionSeen:true,hanaIntroduced:true});showRoomDialog(["happy","thought","surprise","concern","serious","sleepy"].map((expression,i)=>({logId:"review_expression_"+i,speaker:"ハナ",text:"表情の確認",expression})))');
for(const name of ['happy','thought','surprise','concern','serious','sleepy']){
 await p.waitForFunction(n=>document.querySelector('.hana-portrait')?.dataset.displayedExpression===n,name);
 assert((await p.locator('#hanaButton').evaluate(x=>getComputedStyle(x,'::before').backgroundImage)).includes('/expressions/'+name+'.webp'));
 await p.screenshot({path:path.join(out,'expression-'+name+'.png')});await p.locator('#roomNextButton').click();
}
await shot('final-door' ,'showEighthRoom({solved:true,introSeen:true,finalTalkSeen:true})');
await shot('cleared-title','localStorage.setItem("saigononazo-guide-unlocked-v1","1");showTitle()');assert((await p.locator('.title-logo img').getAttribute('src')).includes('title-cleared'));
await p.evaluate(()=>showNameInput());await p.locator('#playerName').fill('テスト');await p.locator('#decideButton').click();assert.equal(await p.locator('#decideButton').isDisabled(),true);await p.waitForTimeout(1000);assert.equal(await p.locator('#decideButton').count(),1);await p.waitForTimeout(1200);assert.equal(await p.locator('.opening').count(),1);
assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);await b.close();console.log('All review browser checks passed')})().catch(e=>{console.error(e);process.exit(1)});


