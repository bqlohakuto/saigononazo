const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../late-game.js'),'utf8');
function handler(id,ctx){const row=source.split('\n').find(x=>x.includes("game.querySelector('#"+id+"')?.addEventListener('click'"));assert(row);vm.runInNewContext(row,{...ctx,game:{querySelector:()=>({addEventListener(_event,fn){ctx.run=fn;}})}});return ctx.run;}
test('only accepted map opening unfolds; closing clicks softly and zoom uses no unfold',()=>{
 const sounds=[],state={mapOpen:false,mapExpanded:false};let busy=false,saves=0,renders=0;
 const ctx={room6State:state,r6Busy:()=>busy,GameAudio:{play:id=>sounds.push(id)},saveGame(){saves++},renderR6(){renders++}};
 const toggle=handler('r6MapToggle',ctx),expand=handler('r6MapExpand',ctx);
 busy=true;toggle();expand();assert.deepEqual(sounds,[]);assert.equal(saves,0);
 busy=false;toggle();assert.deepEqual(sounds,['mapUnfold']);assert.equal(state.mapOpen,true);
 expand();expand();assert.equal(sounds.length,1);
 toggle();assert.deepEqual(sounds,['mapUnfold','uiClick']);assert.equal(state.mapOpen,false);
 assert.equal(saves,4);assert.equal(renders,4);
});
