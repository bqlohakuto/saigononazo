// The authored dialogue, save resume, and image loading must select the same art.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'late-game.js'),'utf8');
function linesBetween(start,end){
  const begin=source.indexOf(start),finish=source.indexOf(end,begin);
  assert.ok(begin>=0&&finish>begin,'authored dialogue section exists');
  return [...source.slice(begin,finish).matchAll(/line\("([^"]+)"/g)].map(m=>({logId:m[1]}));
}
const intro=linesBetween('function r8Intro(){','const found=lines.findIndex(entry=>entry.logId===room8State.introLogId)');
const solved=linesBetween('function r8SolvedDialogue(){','const found=lines.findIndex(entry=>entry.logId===room8State.finalTalkLogId)');
const ending=linesBetween('function r8Farewell(){','const found=lines.findIndex(entry=>entry.logId===room8State.finalEndLogId)');
const raf=[],timers=[];
class Element{
  constructor(tag){
    this.tagName=tag;this.dataset={};this.children=[];this.parentNode=null;this._classes=new Set();
    this.style={values:{},setProperty:(k,v)=>{this.style.values[k]=v}};
    this.classList={add:c=>this._classes.add(c),remove:c=>this._classes.delete(c),contains:c=>this._classes.has(c)};
  }
  set className(value){this._classes=new Set(value.split(/\s+/).filter(Boolean))}
  get isConnected(){return !!(this._connected||this.parentNode?.isConnected)}
  setAttribute(){}
  appendChild(child){child.parentNode=this;this.children.push(child);return child}
  remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(node=>node!==this);this.parentNode=null}
  closest(selector){return selector==='#game'?game:null}
  querySelector(selector){return selector==='.r8-story-art'?this.children.find(el=>el.classList.contains('r8-story-art'))||null:null}
  querySelectorAll(selector){return selector==='.r8-story-frame.is-visible'?this.children.filter(el=>el.classList.contains('r8-story-frame')&&el.classList.contains('is-visible')):[]}
}
const dialog=new Element('div');
const game={querySelector:selector=>selector==='.room-dialog-overlay'?dialog:null};
const stage=new Element('section');stage._connected=true;
class PreloadedImage{decode(){return Promise.resolve()}}
const context={window:{},Image:PreloadedImage,document:{createElement:tag=>new Element(tag)},setTimeout:(fn,ms)=>{timers.push({fn,ms})},requestAnimationFrame:fn=>{raf.push(fn)}};
vm.runInNewContext(fs.readFileSync(path.join(root,'room8-visuals.js'),'utf8'),context,{filename:'room8-visuals.js'});
const visual=context.window.Room8Visuals;
const at=(lines,id)=>{const i=lines.findIndex(line=>line.logId===id);assert.ok(i>=0,`missing ${id}`);return i};
const introAt=id=>visual.intro(intro,at(intro,id));
const solvedAt=id=>visual.solved(solved,at(solved,id));
assert.equal(introAt('r8_entry_04').key,'overview');
assert.equal(introAt('r8_reunion_19').key,'white');
assert.equal(introAt('r8_reunion_21').key,'brown');
assert.equal(introAt('r8_reunion_21').duration,1800);
assert.equal(introAt('r8_memories_04').key,'pout');
assert.equal(introAt('r8_memories_10').key,'smile');
assert.equal(introAt('r8_023').key,'serious');
assert.equal(introAt('r8_041').key,'fading');
assert.equal(introAt('r8_043').key,'request');
assert.equal(introAt('r8_stand_03').glow,'soft');
assert.equal(introAt('r8_046').glow,'white');
assert.equal(introAt('r8_047').key,null);
assert.equal(solvedAt('r8_solve_03').key,null,'name is spoken before she reappears');
assert.equal(solvedAt('r8_return_02').key,'reunion');
assert.equal(solvedAt('r8_return_04').key,'warm');
assert.equal(solvedAt('r8_solve_22').key,'fragile');
assert.equal(solvedAt('r8_solve_27').key,'surprised');
assert.equal(solvedAt('r8_solve_31').key,'holding');
assert.equal(solvedAt('r8_solve_37').key,'tears');
assert.equal(visual.ending(ending,at(ending,'r8_end_02')).key,'farewell');
assert.equal(visual.ending(ending,at(ending,'r8_end_02_light')).glow,'soft');
assert.equal(visual.ending(ending,at(ending,'r8_end_05')).glow,'white');
for(const file of Object.values(visual.frames))assert.ok(fs.existsSync(path.join(root,'images/background/room08/dialogue',file)),`missing frame ${file}`);

// An uncached or out-of-order image must not flash the room or replace a newer scene.
visual.apply(stage,{key:'white',hidePortrait:true,duration:300,glow:'none'},true);
let layer=stage.querySelector('.r8-story-art'),white=layer.children[0];white.onload();
assert.ok(white.classList.contains('is-visible'));
assert.equal(dialog.dataset.r8Pov,'true');
visual.apply(stage,{key:'brown',hidePortrait:true,duration:1800,glow:'none'});
let brown=layer.children.at(-1);
assert.ok(white.classList.contains('is-visible'),'old frame remains while brown loads');
assert.equal(brown.style.values['--r8-art-duration'],'1800ms');
brown.onload();while(raf.length)raf.shift()();
assert.ok(white.classList.contains('is-visible'),'old frame stays opaque underneath the fade');
assert.ok(brown.classList.contains('is-visible'));
assert.equal(timers.at(-1).ms,1900);
timers.splice(0).forEach(t=>t.fn());
assert.ok(!white.isConnected&&brown.isConnected,'old frame is removed after the fade');
visual.apply(stage,{key:'pout',hidePortrait:true,duration:300,glow:'none'});
const stale=layer.children.at(-1);
visual.apply(stage,{key:'serious',hidePortrait:true,duration:300,glow:'none'});
const current=layer.children.at(-1);stale.onload();
assert.ok(!stale.isConnected,'late old image cannot replace a newer request');
current.onerror();assert.ok(brown.isConnected,'failed image leaves the last visible frame');
visual.apply(stage,{key:'serious',hidePortrait:true,duration:300,glow:'none'});
assert.notEqual(layer.children.at(-1),current,'failed image is retried');
visual.apply(stage,{key:null,hidePortrait:true,duration:300,glow:'none'});
assert.equal(stage.dataset.r8Visual,'none');assert.equal(stage.querySelector('.r8-story-art'),null);
console.log('PASS room8 art: dialogue mapping, two-second hair fade, furniture dissolve, farewell, stale image loads and retry.');
