"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const css=fs.readFileSync(path.join(__dirname,"..","design-ui.css"),"utf8");
const rule=css.split("/* Issue #25 A07: make answers visually distinct")[1];
function rgb(hex){return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255)}
function lum(hex){
 const values=rgb(hex).map(x=>x<=.04045?x/12.92:Math.pow((x+.055)/1.055,2.4));
 return .2126*values[0]+.7152*values[1]+.0722*values[2];
}
function ratio(a,b){const l=[lum(a),lum(b)].sort((x,y)=>y-x);return (l[0]+.05)/(l[1]+.05)}
test("A07: primary answer button colors meet normal-text AA contrast",()=>{
 assert(rule,"A07 styles exist");
 for(const background of ["#ffe4ac","#e8b95f"]){
  assert(ratio(background,"#312314")>=4.5,`${background} contrast ratio ${ratio(background,"#312314").toFixed(2)}`);
 }
});
test("A07: all text-entry answer and keypad submission buttons share the cue",()=>{
 for(const selector of [
  ".design-submit","#playMelodyButton",".room3-answer-submit",".room3-final-submit",
  ".r4-mini .r4-answer",".r8-puzzle #r8Submit",'[data-key="enter"]'
 ]) assert(rule.includes(selector),selector);
 assert.match(rule,/focus-visible/);
 assert.match(rule,/:disabled/);
 assert.doesNotMatch(rule,/\.room2-submit/,"Physical Room 2 lever is intentionally unchanged");
});
