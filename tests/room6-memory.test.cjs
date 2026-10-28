const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('Room 6 recollection and connection reproduce the complete recorded script',()=>{
 const doc=fs.readFileSync('SCENARIO.md','utf8').split('## 第6の部屋（2026-10-06 確定内容）')[1].split('## 第7の部屋')[0];
 const parse=text=>[...text.matchAll(/【([^】]+)】\s*\n(.*?)(?=\n【|$)/gs)].map(m=>({speaker:m[1],text:m[2].trim()}));
 const expected=[...parse(doc.split('### 回想\n')[1].split('### 第6終了')[0]),...parse(doc.split('### 第6終了・第7への接続\n')[1].split('\n---')[0])];
 const source=fs.readFileSync('late-game.js','utf8'),start=source.indexOf('  const R6_MEMORY_AND_AFTER='),end=source.indexOf('  function r6Complete',start);
 const context=vm.createContext({line:(logId,speaker,text,extra={})=>({logId,speaker,text,...extra})});
 vm.runInContext(source.slice(start,end)+';globalThis.entries=R6_MEMORY_AND_AFTER',context);
 const entries=Array.from(context.entries),actual=entries.filter(e=>e.logId!=='r6_final_signal').map(e=>({speaker:e.speaker,text:e.text}));
 assert.deepEqual(actual,expected);assert.equal(expected.length,106);
 assert.equal(new Set(entries.map(e=>e.logId)).size,entries.length);
 assert(entries.filter(e=>e.speaker==='主人公・心の声').every(e=>e.thought));
 const signal=entries.findIndex(e=>e.logId==='r6_final_signal');assert(entries[signal-1].text.startsWith('夜道。'));
 assert(!source.includes('pending("第6回想'));
});

test('Room 6 adopted first-person recollection text agrees with the manuscript',()=>{
 const script=fs.readFileSync('SCENARIO.md','utf8').split('## 第6の部屋（2026-10-06 確定内容）')[1].split('## 第7の部屋')[0];
 const runtime=fs.readFileSync('late-game.js','utf8');
 for(const approved of [
  '玄関の扉を開け、部屋に入る。',
  '僕はそのままソファに腰を下ろす。',
  '夜道の景色が、ゆっくりと遠ざかっていく。',
  '確かな根拠はない。'
 ]){
  assert(script.includes(approved),'Approved manuscript keeps: '+approved);
  assert(runtime.includes(approved),'Playable dialogue keeps: '+approved);
 }
});

test('F09: the reconciliation memory describes emotional distance without changing the speakers or sequence',()=>{
 const source=fs.readFileSync('late-game.js','utf8'),manuscript=fs.readFileSync('SCENARIO.md','utf8'),room6=fs.readFileSync('scenario/06_room6.md','utf8');
 const ordered=[
  ['r6_memory_full_021','最近、私に怒ってる？'],
  ['r6_memory_full_022','……え？'],
  ['r6_memory_full_023','一緒にいるのに、なんだか遠くに感じるから。'],
  ['r6_memory_full_024','■■に怒ってるわけじゃないよ。'],
  ['r6_memory_full_025','じゃあ、何に怒ってるの？']
 ];
 let previous=-1;
 for(const [id,text] of ordered){
  const at=source.indexOf('line("'+id+'"',previous+1);
  assert(at>previous,'the scene retains dialogue order for '+id);
  assert(source.slice(at,at+180).includes(text),'approved wording is preserved for '+id);
  previous=at;
 }
 assert(source.includes('line("r6_memory_full_023","彼女","一緒にいるのに、なんだか遠くに感じるから。")'));
 assert(manuscript.includes('一緒にいるのに、なんだか遠くに感じるから。'));
 assert(room6.includes('一緒にいるのに、なんだか遠くに感じるから。'));
 assert(!source.includes('なんか、ずっと遠いから。'));
 assert(!manuscript.includes('なんか、ずっと遠いから。'));
 assert(!room6.includes('なんか、ずっと遠いから。'));
});
