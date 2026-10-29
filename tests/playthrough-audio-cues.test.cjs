const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../script.js'),'utf8');
test('instrument cue follows the first expanded sentence, and yields to the recollection',()=>{
 const events=[];
 const ctx={currentScene:'room02',window:{},GameAudio:{syncSceneMusic(){},play:id=>events.push(['play',id]),fadeOut:(id,ms)=>events.push(['fade',id,ms])},GameLog:{record(){}},saveGame(){}};
 const start=source.indexOf('const dialogueSoundCues='),end=source.indexOf('// Direct displays',start);
 vm.runInNewContext(source.slice(start,end),ctx);
 ctx.recordLog({logId:'room2_after_correct_06_01'});
 ctx.recordLog({logId:'room2_after_correct_06_02'});
 ctx.recordLog({logId:'room2_memory_001_01'});
 assert.deepEqual(events,[['play','memoryBand'],['fade','memoryBand',1000]]);
});
