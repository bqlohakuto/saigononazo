// Room 4 visual cue must follow expanded dialogue log IDs, not bare source IDs.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const dir=path.join(__dirname,'..');
const js=fs.readFileSync(path.join(dir,'room4.js'),'utf8');
const css=fs.readFileSync(path.join(dir,'design-ui.css'),'utf8');
const intro=fs.readFileSync(path.join(dir,'room4-scenario.js'),'utf8');
assert.match(intro,/logId:"r4i06"/);
assert.match(intro,/logId:"r4i09"/);
assert.match(js,/r4SetHanaLookUp\(/);
assert.match(js,/r4-hana-look-pose/);
const start=js.indexOf('r4SetHanaLookUp(/^');
assert(start>=0,'Expected a regular-expression-driven pose trigger');
const finish=js.indexOf(';',start);
assert(finish>start,'The trigger expression must end in a semicolon');
const expression=js.slice(start,finish+1);
function shouldLookUp(logId) {
 let state=null;
 const r4SetHanaLookUp=active=>{state=active};
 new Function('line','r4SetHanaLookUp',expression)({logId},r4SetHanaLookUp);
 return state;
}
for(const id of ['r4i06_01','r4i06_02','r4i07_01','r4i08_01','r4i09_01','r4i06']){
 assert.equal(shouldLookUp(id),true,id+' activates pose');
}
for(const id of ['r4i05_01','r4i10_01','r4i11_01','r4d01_01','r3i06_01','']){
 assert.equal(shouldLookUp(id),false,id+' does not activate pose');
}
assert(css.includes('r4HanaLookUp'),'Dedicated gaze motion CSS present');
assert(css.includes('prefers-reduced-motion:reduce'),'Reduced-motion support present');
assert.match(css,/\.r4hana\.is-looking-up \.r4-hana-look-pose/);
console.log('Room 4 ceiling-gaze trigger and CSS source checks passed');

assert.match(css,/images\/characters\/hana-hires\/poses\/look-up-left\.webp/);
assert(!css.includes('clip-path:inset(30%'),'No cut-and-tilt head workaround');

assert(!css.includes("hana-current/world/look-up/"),"Retired gaze frames are never displayed");
