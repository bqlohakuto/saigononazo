const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../ending-credits.js'),'utf8');
const w={};vm.runInNewContext(source,{window:w});
const frame=w.EndingCredits.frameAt;
test('eleven individually approved roles occupy the whole staff sequence',()=>{
 const roles=['PLANNING','STORY / SCENARIO','PUZZLE DESIGN','GAME DESIGN','VISUAL DESIGN','GRAPHIC PRODUCTION','UI DESIGN','BACKGROUND MUSIC','SOUND EFFECTS','ENDING SONG','CREATED BY'];
 roles.forEach((role,i)=>{const f=frame(i*132/11+7);assert.equal(f.role,role);assert.equal(f.name,({5:'ChatGPT',7:'Gemini',8:'効果音ラボ',9:'こたえあわせ'}[i]||'八上白兎'));assert.equal(f.opacity,1)});
 assert.equal(frame(131).kind,'credit');assert.equal(frame(132).kind,'gap');
});
test('title erases three characters before writing the exact ending, then thanks through piano tail',()=>{
 assert.equal(frame(138).name,'最後の謎が解けるまで');
 assert.equal(frame(144.6).name,'最後の謎が解けるま');
 assert.equal(frame(145.1).name,'最後の謎が解ける');
 assert.equal(frame(146).name,'最後の謎が解け');
 assert.equal(frame(147.1).name,'最後の謎が解けて');
 assert.equal(frame(148).name,'最後の謎が解けても');
 assert.equal(frame(154).name,'最後の謎が解けても');
 assert.equal(frame(160).name,'THANKS FOR PLAYING.');
 assert.equal(frame(166.243208).opacity,0);
 assert.equal(frame(148*170/166.243208,170).name,'最後の謎が解けても');
});
