"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const root=path.join(__dirname,"..");
const read=name=>fs.readFileSync(path.join(root,name),"utf8");

test("A03: changing mail folders resets scroll and transient selection without clearing messages",()=>{
  const source=read("script.js");
  const first=source.indexOf(" const switchFolder=target=>{");
  const end=source.indexOf(' overlay.querySelectorAll("[data-folder]")',first);
  assert(first!==-1&&end>first,"Find actual mailbox switching implementation");
  let view=null,renders=0;
  const ctx={
    folder:"inbox",selectedMailId:"old",cursorIndex:5,
    list:{scrollTop:80},detail:{scrollTop:42,innerHTML:"old message"},
    setView(value){view=value},
    render(){renders++}
  };
  vm.runInNewContext(source.slice(first,end)+"\nthis.changeFolder=switchFolder;",ctx);
  ctx.changeFolder("sent");
  assert.equal(ctx.folder,"sent");
  assert.equal(ctx.selectedMailId,null);
  assert.equal(ctx.cursorIndex,0);
  assert.equal(ctx.list.scrollTop,0);
  assert.equal(ctx.detail.scrollTop,0);
  assert.equal(view,false);
  assert.equal(renders,1);
  ctx.list.scrollTop=90;
  ctx.changeFolder("invalid");
  assert.equal(ctx.list.scrollTop,90,"Invalid folder must not disturb the current screen");
});

test("A03: moon exhibit page changes explicitly reset the scrollable view",()=>{
  const s=read("room4.js");
  const begin=s.indexOf("function r4Moon(){");
  const end=s.indexOf("\nfunction r4Door()",begin);
  assert(begin!==-1&&end>begin);
  const section=s.slice(begin,end);
  assert.match(section,/r4-world-countries'\)\.scrollTop=0/);
  assert.match(section,/r4-world-exhibit'\)\.scrollTop=0/);
  assert.match(section,/page\+=Number\(button\.dataset\.moonStep\);render\(\)/);
});

test("A03: records tabs/details reset the view without overwriting saved game progress",()=>{
  const s=read("design-ui.js");
  const begin=s.indexOf("  function records(){");
  const end=s.indexOf("\n  function inferRoom(",begin);
  assert(begin!==-1&&end>begin);
  const section=s.slice(begin,end);
  assert.match(section,/function drawList\(\)[\s\S]*?m\.content\.replaceChildren\(\);[\s\S]*?m\.content\.scrollTop=0/);
  assert.match(section,/function detail\(index\)\{\s*footer\.hidden=true;\s*m\.content\.replaceChildren\(\);m\.content\.scrollTop=0/);
  assert.match(section,/recordPage=0;drawList\(\)/);
  assert.doesNotMatch(section,/clearSave\(|roomStates\s*=|removeItem\(/);
});
