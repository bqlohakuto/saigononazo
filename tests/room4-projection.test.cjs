const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const approved=JSON.parse(fs.readFileSync(path.join(root,'images/exhibits/room04/virgo-panels/virgo-five-panels.json'),'utf8'));
function fixture(overrides={}){
 const projection={innerHTML:'',className:''},light={hidden:true};
 const state={star:true,lightPuzzle:true,meteors:true,wall:true,box:true,angles:[0,0,0,0,0],mountedPanels:[false,false,false,false,false],lightOn:true,...overrides};
 const ctx={room4State:state,window:{addEventListener(){}},document:{getElementById:id=>id==='r4Projection'?projection:light}};
 vm.createContext(ctx);
 for(const file of ['room4-zodiac.js','room4.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
 return {ctx,state,projection,light,render(){ctx.r4Projection();return projection.innerHTML}};
}
function stars(html){return [...html.matchAll(/data-hip="(\d+)" data-pane="(\d+)" cx="([^"]+)" cy="([^"]+)"/g)].map(m=>({hip:Number(m[1]),pane:Number(m[2]),x:Number(m[3]),y:Number(m[4])}));}
function edgeCount(html){return [...html.matchAll(/<line /g)].length}
test('collected but unmounted panes never project stars or satisfy the solution',()=>{
 const f=fixture();
 assert.equal(f.render(),'');assert.equal(f.light.hidden,false);assert.equal(f.ctx.r4Correct(),false);
 f.state.lightOn=false;assert.equal(f.render(),'');assert.equal(f.light.hidden,true);
});
test('only stars belonging to mounted and owned panes are projected',()=>{
 const f=fixture({mountedPanels:[true,false,false,false,false]});
 assert.deepEqual(stars(f.render()).map(s=>s.hip).sort((a,b)=>a-b),approved.panels[0].stars.map(s=>s.hip).sort((a,b)=>a-b));
 assert.equal(edgeCount(f.projection.innerHTML),0);
 f.state.star=false;assert.equal(f.render(),'');
});
test('the completed zero-angle projection matches all 12 approved SVG stars',()=>{
 const f=fixture({mountedPanels:[true,true,true,true,true]});
 const rendered=stars(f.render());
 assert.equal(rendered.length,12);assert.equal(edgeCount(f.projection.innerHTML),12);assert.equal(f.ctx.r4Correct(),true);
 for(const panel of approved.panels)for(const star of panel.stars){
  const actual=rendered.find(s=>s.hip===star.hip);
  assert.ok(Math.abs(actual.x-star.x*576/1024)<.002,'SVG x coordinate must match '+star.hip);
  assert.ok(Math.abs(actual.y-star.y*576/1024)<.002,'SVG y coordinate must match '+star.hip);
 }
});
test('wall projection rotates with the panes and shares relative connection rules',()=>{
 const f=fixture({mountedPanels:[true,true,true,true,true]});
 const aligned=stars(f.render());
 f.state.angles=[1,1,1,1,1];
 const rotated=stars(f.render());assert.equal(edgeCount(f.projection.innerHTML),12);assert.equal(f.ctx.r4Correct(),false);
 for(const star of aligned){const actual=rotated.find(s=>s.hip===star.hip);assert.ok(Math.abs(actual.x-(576-star.y))<.002);assert.ok(Math.abs(actual.y-star.x)<.002);}
 f.state.angles[0]=2;
 assert.ok(edgeCount(f.render())<12,'Turning one pane breaks only its mismatched connections');
});
test('the completion glow belongs to Spica rather than an arbitrary point',()=>{
 const f=fixture({mountedPanels:[true,true,true,true,true],completed:true});
 assert.match(f.render(),/data-hip="65474"[^>]* r="7"/);
 assert.match(f.projection.className,/complete/);
});
