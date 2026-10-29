"use strict";
// Issue #25 H02: earned clues remain gated by actual investigations/answers.
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const root=path.join(__dirname,"..");
const read=name=>fs.readFileSync(path.join(root,name),"utf8");
const late=read("late-game.js");
const design=read("design-ui.js");
function section(from,to){
 const start=late.indexOf(from),end=late.indexOf(to,start);
 assert(start>=0&&end>start,"Found live code: "+from);
 return late.slice(start,end);
}

test("H02 Room 5: a completed board does not log the code before its display stage",()=>{
 const complete=section("  function r5CompleteBoard(inline){","  function r5Keypad(){");
 assert.match(complete,/if\(inline\)inline\(lines\);else showRoomDialog\(lines,renderR5\);/);
 assert.doesNotMatch(complete,/lines\.forEach\(recordLog\)/);
 const animation=section("    function playBoardCompletion(lines){","    function select(id){");
 assert.match(animation,/showRoomDialog\(lines\.slice\(0,7\)/);
 assert.doesNotMatch(animation,/recordLog/);
 const followup=section("  function r5PlayDoorReveal(lines,showMissedDigits){","  function r5ButterflyHintIfNeeded(inline){");
 assert.match(followup,/showRoomDialog\(lines\.slice\(showMissedDigits\?4:7\)/);
 assert.doesNotMatch(followup,/recordLog/);
 assert.match(late,/room5State\.codeRevealed\?"盤が完成した"/);
});
test("H02 Room 6: the test-only route stays unavailable on normal saves",()=>{
 const normalize=section("  function normalizeR6(saved){","  let r6Moving=false");
 assert.match(normalize,/testGuide:!!s\.testGuide/);
 const display=section("  function renderR6(){","  function r6Neighbor(a,b){");
 assert.match(display,/room6State\.testGuide\?'<button class="r6-test-guide-button"/);
 const guide=section("  function r6ShowTestGuide(){","  window.showSixthRoom=function(savedState){");
 assert.match(guide,/if\(r6Busy\(\)\|\|!room6State\.testGuide\)return/);
 const hints=section("  function r6Hana(){","  function r6ShowTestGuide(){");
 assert.match(hints,/room6State\.othelloKnown\?hints\.slice/);
 assert.match(hints,/if\(room6State\.othelloKnown&&room6State\.hintLevel>=3\)/);
});
test("H02 Room 7: bookshelf book contents cannot appear before arrangement success",()=>{
 const opening=section("  function r7Read(","  function r7DialMarkup(interactive){");
 assert.match(opening,/if\(!book\|\|!room7State\.booksSolved\|\|!room7State\.placed\.includes\(id\)\)return;/);
 assert.match(opening,/recordLog\(\{logId:id==='bremen'/);
 const shelf=section("  function r7Shelf(selectedId){","  function r7BooksGlow(){");
 assert.match(shelf,/if\(placed\)\{\s*if\(room7State\.booksSolved\)\{m\.close\(\);r7Read\(placed\.id\);return\}/);
 assert.match(shelf,/if\(justSolved\)\{m\.close\(\);renderR7\(\);r7BooksGlow\(\);return\}/);
});
test("H02 Room 8: neither the HUD nor final-paper front gives away the answer",()=>{
 const puzzle=section("  function r8PuzzleRoom(){","  function r8Paper(){");
 assert.match(puzzle,/setHud\("room08","最後の謎",\(\)=>"机の上の紙を調べる"/);
 assert.doesNotMatch(puzzle,/彼女の名前を思い出す/);
 const paper=section("  function r8Paper(){","    game.appendChild(o);");
 assert.doesNotMatch(paper,/花音|かのん|カノン/);
 assert.match(paper,/class="r8-back '\+\(room8State\.backSeen\?"show":""\)/);
 assert.match(read("late-game.css"),/\.r8-back\{display:none[^}]*\}\.r8-back\.show\{display:block\}/);
});
test("H02 Room 8: past-log markers activate only after turning over the final paper",()=>{
 const ids=section("  const R8_FINAL_LOG_IDS=[","  function r8IsFinalClue(entry){");
 const gate=section("  function r8IsFinalClue(entry){","  function r8ArmLogHint(){");
 const state={backSeen:false};
 const ctx={room8State:state};
 const fn=vm.runInNewContext(ids+"\n"+gate+"\nr8IsFinalClue;",ctx);
 const note={id:"r7_books_glow_flower"};
 assert.equal(fn(note),false,"Clues are unmarked before the paper back is read");
 state.backSeen=true;
 assert.equal(fn(note),true,"Previously discovered clues become highlighted after reading");
 assert.equal(fn({id:"r8_solve_03"}),false,"The answer is not made into a hint");
 assert.match(design,/function clue\(entry\)\{return !!roomStates\.room08\?\.backSeen&&!!config\?\.highlightLogEntry\?\.\(entry\)\}/);
});
test("H02: public answer guide is locked without an epilogue or author preview",()=>{
 const guide=read("puzzle-explanations.js"),game=read("script.js");
 assert.match(game,/const AUTHOR_PREVIEW=new URLSearchParams\(window\.location\.search\)\.get\("preview"\)==="1"/);
 assert.match(guide,/return completed\?\.ended===true && completed\.epilogueSeen===true/);
 assert.match(guide,/const enabled = \(\) => TEST_MODE \|\| localStorage\.getItem\(UNLOCK_KEY\) === "1" \|\| completedSave\(\)/);
 assert.match(guide,/if\(!home \|\| home\.querySelector\("#puzzleGuideButton"\) \|\| !enabled\(\)\) return/);
});
