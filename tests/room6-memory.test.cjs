const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('Room 6 recollection and connection reproduce the complete recorded script',()=>{
 const doc=fs.readFileSync('SCENARIO.md','utf8').split('## 第6の部屋（2026-10-06 確定内容）')[1].split('## 第7の部屋')[0];
 const parse=text=>[...text.matchAll(/【([^】]+)】\s*\n(.*?)(?=\n【|$)/gs)].map(m=>({speaker:m[1],text:m[2].trim()}));
 const expected=[...parse(doc.split('### 回想\n')[1].split('### 第6終了')[0]),...parse(doc.split('### 第6終了・第7への接続\n')[1].split('\n---')[0])];
 const source=fs.readFileSync('late-game.js','utf8'),start=source.indexOf('  const R6_MEMORY_AND_AFTER='),end=source.indexOf('  function r6Complete',start);
 const context=vm.createContext({line:(logId,speaker,text,extra={})=>({logId,speaker,text,...extra})});
 vm.runInContext(source.slice(start,end)+';globalThis.entries=R6_MEMORY_AND_AFTER',context);
 const entries=Array.from(context.entries),actual=entries.filter(e=>e.logId!=='r6_final_signal').map(e=>({speaker:e.speaker,text:e.text}));
 assert.deepEqual(actual,expected);assert.equal(expected.length,105);
 assert.equal(new Set(entries.map(e=>e.logId)).size,entries.length);
 assert(entries.filter(e=>e.speaker==='主人公・心の声').every(e=>e.thought));
 const signal=entries.findIndex(e=>e.logId==='r6_final_signal');assert(entries[signal-1].text.startsWith('夜道。'));
 assert(!source.includes('pending("第6回想'));
});
