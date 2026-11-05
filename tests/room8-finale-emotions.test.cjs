"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const src=read("late-game.js");
function block(begin,end){
 const a=src.indexOf(begin),b=src.indexOf(end,a+begin.length);
 assert.ok(a>=0&&b>a,"missing dialogue block: "+begin);
 return src.slice(a,b);
}
function lines(code){
 return [...code.matchAll(/line\("([^"]+)","([^"]+)","((?:\\.|[^"\\])*)"(?:,\{[^)]*?\})?\)/g)]
  .map(m=>({id:m[1],speaker:m[2],text:JSON.parse('"'+m[3]+'"')}));
}
const intro=lines(block("function r8Intro(){","const found=lines.findIndex(entry=>entry.logId===room8State.introLogId)"));
const epi=lines(block("function r8Epilogue(){","const found=lines.findIndex(entry=>entry.logId===room8State.epilogueLogId)"));
const solved=lines(block("function r8SolvedDialogue(){","const found=lines.findIndex(entry=>entry.logId===room8State.finalTalkLogId)"));
const byId=(a,id)=>{const found=a.find(x=>x.id===id);assert.ok(found,"missing "+id);return found};
const at=(a,id)=>{const i=a.findIndex(x=>x.id===id);assert.ok(i>=0,id);return i};
test("Room 8 recognition takes place after Hana confirms her identity, before the memory-chat",()=>{
 const ids=["r8_reunion_22","r8_reunion_23","r8_reunion_24","r8_recognition_walk","r8_recognition_voice","r8_recognition_reason","r8_recognition_answer","r8_recognition_together","r8_reunion_25"];
 for(let i=1;i<ids.length;i++)assert.ok(at(intro,ids[i])>at(intro,ids[i-1]),ids[i]+" follows "+ids[i-1]);
 assert.equal(byId(intro,"r8_recognition_walk").text,"何度も隣を歩いた。");
 assert.equal(byId(intro,"r8_recognition_voice").text,"何度も声を聞いた。");
 assert.equal(byId(intro,"r8_recognition_reason").text,"ずっと懐かしいと感じていた理由が、ようやくわかった。");
 assert.equal(byId(intro,"r8_recognition_answer").text,"……そうだったんだ");
 assert.equal(byId(intro,"r8_recognition_together").text,"ずっと、一緒にいてくれたんだね");
 assert.ok(at(intro,"r8_recognition_together")<at(intro,"r8_memories_01"));
});
test("only the protagonist's restrained urgency changes as furniture and Hana disappear",()=>{
 const ids=["r8_stand_03","r8_046","r8_047","r8_048","r8_049","r8_disappear_resolve","r8_last_paper","r8_last_reach"];
 for(let i=1;i<ids.length;i++)assert.ok(at(intro,ids[i])>at(intro,ids[i-1]),ids[i]);
 assert.equal(byId(intro,"r8_048").text,"……待って");
 assert.equal(byId(intro,"r8_049").text,"手を伸ばした先には、もう誰もいなかった。");
 assert.equal(byId(intro,"r8_disappear_resolve").text,"……まだ、終わってない");
 assert.equal(byId(intro,"r8_last_paper").text,"机の上に、一枚の紙が置かれている。");
 assert.equal(byId(intro,"r8_last_reach").text,"その紙へ、ゆっくりと手を伸ばした。");
 for(const id of ["r8_048","r8_disappear_resolve"])assert.ok(!/[!！]/.test(byId(intro,id).text));
 const visuals=read("room8-visuals.js");
 assert.ok(visuals.includes("['r8_047',null]"),"the last furniture stage stays blank");
 assert.ok(src.includes('const goneIndex=lines.findIndex(entry=>entry.logId===\'r8_049\')'));
 assert.ok(src.includes('if(index>=at("r8_047"))return 3'));
 assert.ok(src.includes("room8State.introLogId=lines[index].logId"),"progress remains authored-ID based");
});
test("game creation lasts several beats and ends on the original vow",()=>{
 const ids=["r8_epilogue_08","r8_epilogue_create_01","r8_epilogue_create_02","r8_epilogue_create_03","r8_epilogue_create_04","r8_epilogue_create_05","r8_epilogue_create_06","r8_epilogue_09"];
 for(let i=1;i<ids.length;i++)assert.ok(at(epi,ids[i])>at(epi,ids[i-1]),ids[i]);
 assert.equal(byId(epi,"r8_epilogue_create_04").text,"……相変わらず、クマみたいだな");
 assert.equal(byId(epi,"r8_epilogue_09").text,"彼女が作った謎を、今度は僕が届けていく。");
 assert.equal(new Set(epi.map(x=>x.id)).size,epi.length,"each new and original epilogue log has a unique ID");
 assert.ok(src.includes("room8State.epilogueLogId=lines[index].logId"),"epilogue remains save-resumable");
 assert.ok(src.includes('const placeFor=index=>index>=5?"home":"hospital"'),"the hospital/home distinction is stable");
});
test("Kanon's voice, the name answer and the original farewell are retained",()=>{
 assert.equal(byId(solved,"r8_solve_01").text,"……花音");
 assert.equal(byId(solved,"r8_solve_03").text,"正解！");
 assert.equal(byId(solved,"r8_solve_15").text,"本当に……大好きだよ");
 assert.equal(byId(solved,"r8_solve_43").text,"最後の謎が解けても、僕たちの謎解きは終わらない");
 assert.equal(byId(solved,"r8_solve_44").text,"花音が作った謎を、今度は僕がみんなに届ける");
 const farewell=block("function r8Farewell(){","function r8AfterSolved(){");
 assert.ok(farewell.includes('line("r8_end_03","花音","じゃあね、"+(playerName||"主人公")'));
 assert.ok(src.includes('["花音","かのん","カノン"].includes(value)'));
 assert.ok(src.includes("showEighthRoom(roomStates.room08)"),"room 7 can still enter room 8");
});
test("all three production manuscripts and frontend cache reflect the approved Room 8 finale",()=>{
 const docs=["SCENARIO.md","scenario/08_final.md","scenario/FULL_SCENARIO.md"];
 for(const name of docs){
  const doc=read(name);
  for(const phrase of ["何度も隣を歩いた。","ずっと、一緒にいてくれたんだね","手を伸ばした先には、もう誰もいなかった。","……まだ、終わってない","思うように動かない仕掛けを、何度も作り直す。","……相変わらず、クマみたいだな","彼女が作った謎を、今度は僕が届けていく。"]){
   assert.ok(doc.includes(phrase),name+" missing "+phrase);
  }
  assert.ok(doc.includes("クマかと思ったやつ。"),name+" must retain the original Room 5 rabbit joke");
  assert.ok(!doc.includes("耳が四本あるやつ。"),name+" must not preserve the retired variant");
 }
 const html=read("index.html");
 const version=(html.match(/href="style\.css\?v=(\d{8}-[a-z0-9-]+)"/)||[])[1];
 assert.ok(version&&html.includes("late-game.js?v="+version),"the game runs the updated JS");
});
