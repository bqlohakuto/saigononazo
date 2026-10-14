const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('late-game.js','utf8');
const start=source.indexOf('  const R6_INITIAL='),end=source.indexOf('  function normalizeR6',start);
const context=vm.createContext({});vm.runInContext(source.slice(start,end)+';globalThis.api={initial:R6_INITIAL,place:r6Place,replay:r6Replay};',context);const {initial,place,replay}=context.api;
test('authored 64-cell board matches scenario and admits exactly 12 nine-move solutions',()=>{
 const doc=fs.readFileSync('SCENARIO.md','utf8').split('初期配置（○＝白、●＝黒、・＝緑／空き）：')[1];
 const rows=doc.split('\n').filter(x=>/^[1-8]   /.test(x)).slice(0,8);
 const expected=rows.flatMap(x=>[...x].filter(c=>'○●・'.includes(c))).map(c=>({'○':'W','●':'G','・':'E'})[c]).join('');assert.equal(initial,expected);
 const solutions=[];
 function visit(board,route){if(route.length===9){if(board.every(c=>c==='W'))solutions.push(route);return}
  board.forEach((v,i)=>{if(v!=='E')return;const id=String.fromCharCode(65+i%8)+(Math.floor(i/8)+1),next=place(board,id,route.length%2===0?'W':'G');if(next)visit(next,[...route,id]);});}
 visit(initial.split(''),[]);assert.equal(solutions.length,12);assert(solutions.every(r=>r[8]==='H2'));
 for(const route of solutions){const r=replay(route);assert.equal(r.moves.length,9);assert(r.board.every(c=>c==='W'));}
 assert.equal(place(initial.split(''),'A8','W'),null);assert.equal(place(initial.split(''),'Z9','W'),null);
});
