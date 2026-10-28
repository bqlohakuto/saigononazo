"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,".."),read=f=>fs.readFileSync(path.join(root,f),"utf8");
const names=["mirror","fish","butterfly","flower","squid","chair","cannon"];

test("E03: every collectible opens its own approved large panel image",()=>{
 const source=read("late-game.js");
 assert.match(source,/window\.DesignUI\?\.pickup\(\{id,name:item\[1\]\+"のパネル",image:"images\/background\/room05\/panels\/"\+id\+"\.webp"/);
 assert.doesNotMatch(source,/pickup\(\{id,name:item\[1\]\+"のパネル",art:/,"Old text-only acquisition must not return");
 for(const id of names){
  const filepath=path.join(root,"images/background/room05/panels",id+".webp");
  const buf=fs.readFileSync(filepath);
  assert(buf.length>1000,id+" is not a placeholder image");
  assert.equal(buf.toString("ascii",0,4),"RIFF",id+" has a valid WebP container");
  assert.equal(buf.toString("ascii",8,12),"WEBP",id+" is a WebP image");
 }
});

test("E03: shared pickup component displays image and keeps a visible Close action",()=>{
 const ui=read("design-ui.js");
 assert.match(ui,/if\(item\.image\)\s*\{/);
 assert.match(ui,/art\.className='design-pickup-image'/);
 assert.match(ui,/art\.src=item\.image/);
 assert.match(ui,/m\.content\.append\(button\('閉じる',m\.close\)\)/);
 const css=read("design-ui.css");
 assert.match(css,/#game \.design-pickup-panel \.design-pickup-image\[src\*="\/room05\/panels\/"\]/);
 assert.match(css,/background:#faf6eb/,"Room 5 paper reveal is distinct from the glass pane style");
 assert.match(css,/height:min\(325px,56cqh\)/,"The collected item gets ample presentation space");
});
