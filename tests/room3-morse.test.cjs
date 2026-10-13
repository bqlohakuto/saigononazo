const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../room3.js'),'utf8');
// ITU-R M.1677-1, Annex 1, 1.1.1: international Latin alphabet, not Wabun.
const expected=['.-','-...','-.-.','-..','.','..-.','--.','....','..','.---','-.-','.-..','--','-.','---','.--.','--.-','.-.','...','-','..-','...-','.--','-..-','-.--','--..'];
test('Room 3 includes the correct and unique international Morse codes for all A–Z',()=>{
 const data=JSON.parse(vm.runInNewContext(source+';JSON.stringify(ROOM3_MORSE)'));
 assert.deepEqual(Object.keys(data),Array.from({length:26},(_,i)=>String.fromCharCode(65+i)));
 const codes=Object.values(data).map(c=>c.replaceAll('・','.').replaceAll('－','-'));
 assert.deepEqual(codes,expected);assert.equal(new Set(codes).size,26);
});
