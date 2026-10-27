// Ensure the public game hides spoilers until the actual end credits or a completed save.
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const original=fs.readFileSync(path.join(__dirname,"..","puzzle-explanations.js"),"utf8");

function createHarness(release=true) {
  const source=original;
  assert.match(source,/const TEST_MODE = window.GameBuild\?\.preview === true;/);
  let saved=null,creditsVisible=false,mutation=null;
  const store=new Map();
  const localStorage={getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,String(value))};
  const game={querySelector(selector){return selector===".ending-credits"&&creditsVisible?{}:null}};
  class MutationObserver{constructor(callback){mutation=callback}observe(){}}
  const window={GameBuild:{preview:!release}};
  const context={window,localStorage,game,document:{querySelector(){return null}},MutationObserver,readSavedGame(){return saved}};
  vm.runInNewContext(source,context,{filename:"puzzle-explanations.js"});
  return {guide:window.PuzzleGuide,store,setSaved(value){saved=value},showCredits(){creditsVisible=true;mutation()}};
}
test("test builds retain the guide during editorial review",()=>{
  const h=createHarness(false);
  assert.equal(h.guide.isTestMode(),true);
  assert.equal(h.guide.isUnlocked(),true);
});
test("public build keeps the guide hidden before solving any room",()=>{
  const h=createHarness();
  assert.equal(h.guide.isTestMode(),false);
  assert.equal(h.guide.isUnlocked(),false);
  h.setSaved({rooms:{room08:{ended:true,epilogueSeen:false}}});
  assert.equal(h.guide.isUnlocked(),false,"Ending conversation alone does not unlock spoilers");
});
test("public build restores guide for previously completed save",()=>{
  const h=createHarness();
  h.setSaved({rooms:{room08:{ended:true,epilogueSeen:true}}});
  assert.equal(h.guide.isUnlocked(),true);
});
test("public build unlocks the guide on the real credits screen",()=>{
  const h=createHarness();
  assert.equal(h.guide.isUnlocked(),false);
  h.showCredits();
  assert.equal(h.store.get("saigononazo-guide-unlocked-v1"),undefined,"Incomplete epilogue must not unlock");
  h.setSaved({rooms:{room08:{ended:true,epilogueSeen:true}}});
  h.showCredits();
  assert.equal(h.store.get("saigononazo-guide-unlocked-v1"),"1");
  assert.equal(h.guide.isUnlocked(),true);
});
