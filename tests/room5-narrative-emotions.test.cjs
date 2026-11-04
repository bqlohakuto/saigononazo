"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const source=read("late-game.js");
const chapter=read("scenario/05_room5.md");
const full=read("scenario/FULL_SCENARIO.md");
function passage(start,end){
 const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,"missing passage "+start);
 return source.slice(a,b);
}
const intro=passage("if(!room5State.introSeen){","function r5Notice(");
const mirror=passage('if(id==="mirror"){','}else if(id==="fish"){');
const solved=passage("function r5CompleteBoard(inline){","function r5Keypad(){");
function lineIds(src){
 return [...src.matchAll(/line\("([^"]+)",/g)].map(m=>m[1]);
}
function textFor(src,id){
 const marker='line("'+id+'",';
 const i=src.indexOf(marker);
 assert.ok(i>=0,"missing "+id);
 const rest=src.slice(i);
 const m=rest.match(/^line\("(?:[^"]+)",(?:"(?:[^"]+)",)?"(?:\\.|[^"\\])*"/);
 assert.ok(m,"missing dialogue "+id);
 return m[0];
}
test("the first visit recalls the living room and moves the protagonist to investigate",()=>{
 const ids=lineIds(intro);
 for(const key of ["r5_intro_01","r5_intro_02","r5_intro_name_01","r5_intro_03","r5_intro_04","r5_intro_05","r5_intro_06","r5_intro_07","r5_intro_08"])
  assert.ok(ids.includes(key),"existing log ID "+key+" must remain");
 for(const key of ["r5_intro_memory_01","r5_intro_hana_01","r5_intro_explore_01"])
  assert.ok(ids.includes(key),"new log "+key+" must be recorded");
 const i=ids.indexOf("r5_intro_04");
 assert.deepEqual(ids.slice(i,i+6),["r5_intro_04","r5_intro_memory_01","r5_intro_05","r5_intro_06","r5_intro_hana_01","r5_intro_explore_01"]);
 for(const text of ["不思議と見覚えがあるような気がした","……この感じ、どこかで……","……調べてみます。何か思い出せるかもしれません"])assert.ok(intro.includes(text));
});
test("mirror discovery expresses unease then retains the magical transformation and pickup",()=>{
 const ids=lineIds(mirror);
 for(let n=1;n<=17;n++)assert.ok(ids.includes("r5_mirror_"+String(n).padStart(2,"0")),"stable mirror ID "+n);
 assert.ok(ids.includes("r5_get_mirror"));
 const lines=["姿見には、部屋の様子が映っている","……え？","……顔だけ、見えない？","……本当だね","……どうして……","もう一度、鏡を見つめる。けれど、何も変わらなかった","鏡面に、水面のような波紋が広がる","【鏡のパネルを手に入れた】"];
 let at=-1;for(const text of lines){const i=mirror.indexOf(text);assert.ok(i>at,"ordered mirror beat: "+text);at=i}
 assert.ok(!mirror.includes("自分の顔もはっきり"));
});
test("all eight counter pictures reveal 8194 while the protagonist stays measured",()=>{
 const ids=lineIds(solved);
 for(let n=1;n<=9;n++)assert.ok(ids.includes("r5_board_complete_"+String(n).padStart(2,"0")));
 for(const id of ["r5_board_complete_digits","r5_board_complete_fitted","r5_board_complete_realize"])assert.ok(ids.includes(id));
 assert.ok(solved.includes("room5State.codeRevealed=true;saveGame()"));
 assert.ok(solved.includes('GameAudio.play("answerCorrect")'));
 const expected=["最後のパネルが丸枠にはまった","……全部、はまった","八つの絵が一斉に淡く光る","……あ","8194","……なるほど、こういう仕組みだったんですね","正面の扉に、四桁のテンキーが現れる","これで、先に進めそうですね","うん、そうだね"];
 let at=-1;for(const text of expected){const i=solved.indexOf(text);assert.ok(i>at,"ordered completion beat: "+text);at=i}
 assert.ok(!solved.includes("！"));
});
test("living-room memories and the hint toward Hana remain untouched",()=>{
 assert.ok(source.includes('line("r5_final_flower"'));
 assert.ok(source.includes('line("r5_final_humming"'));
 assert.ok(source.includes('line("r5m300","ト書き","それが僕たちの日常だった。"'));
 assert.ok(source.includes('line("r5_after_06","主人公","この絵って、ハナさんが描いたんですか？"'));
 assert.ok(source.includes('if(value!=="8194")'));
 assert.ok(source.includes('room5State.doorUnlocked=true;saveGame()'));
});
test("current chapter and combined manuscript reflect each agreed reaction",()=>{
 const start=full.indexOf("<!-- source: scenario/05_room5.md -->");
 const end=full.indexOf("<!-- source:",start+1);
 assert.ok(start>=0&&end>start);
 const excerpt=full.slice(start,end);
 for(const t of ["……この感じ、どこかで……","……顔だけ、見えない？","……全部、はまった","これで、先に進めそうですね"]){
  assert.ok(chapter.includes(t),"chapter missing "+t);
  assert.ok(excerpt.includes(t),"combined missing "+t);
 }
 const html=read("index.html");
 const version=(html.match(/href="style\.css\?v=(\d{8}-[a-z0-9-]+)"/)||[])[1];
 assert.ok(version);
 assert.ok(html.includes("late-game.js?v="+version));
});
