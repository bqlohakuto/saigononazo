const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../room3.js'),'utf8');
const rows=['ラヘヨソヒロコモノチ','チイヘニロサケラミフ','ナロラキルヤツトイメ','ラソソモソアケワイネ','テヘフナイニワモトク','ルミナユキスシネレホ','ウハフワミマテアルハ','フヘモアトオリフニヨ','ヌヘヨニヨヒムマトレ','ツチヒワフエクノヨヒ'];
test('User letterboard remains exact and yields only the intended seven central letters in all directions',()=>{
 const board=JSON.parse(vm.runInNewContext(src+';JSON.stringify(ROOM3_BOARD)'));
 assert.deepEqual(board.map(r=>r.join('')),rows);assert.equal(board.length,10);assert(board.every(r=>r.length===10));
 const hits=[];
 for(let r=0;r<10;r++)for(let c=0;c<10;c++)for(const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]]){
 const rr=r+2*dr,cc=c+2*dc;
 if(rr>=0&&rr<10&&cc>=0&&cc<10&&board[r][c]===board[rr][cc])hits.push({r:r+dr,c:c+dc,letter:board[r+dr][c+dc]});
 }
 hits.sort((a,b)=>a.r-b.r||a.c-b.c);
 assert.equal(hits.length,7);assert.equal(hits.map(h=>h.letter).join(''),'イツモトナリニ');
 assert.deepEqual(hits.map(h=>[h.r+1,h.c+1]),[[2,2],[3,7],[4,4],[5,9],[6,3],[8,7],[9,4]]);
});
