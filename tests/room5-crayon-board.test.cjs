const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
test('all 49 handdrawn combinations and the fixed rabbit are RGBA PNGs',()=>{
 const root=path.join(__dirname,'../images/background/room05/combinations');
 const names=['rabbit-feather',...['mirror','fish','butterfly','flower','squid','chair','cannon'].flatMap(id=>['mask','tail','head','wheel','cup','legs','gate'].map(counter=>id+'-'+counter))];
 assert.equal(fs.readdirSync(root).filter(f=>f.endsWith('.png')).length,50);
 for(const name of names){
  const b=fs.readFileSync(path.join(root,name+'.png'));
  assert.equal(b.subarray(1,4).toString(),'PNG',name);
  assert.equal(b.subarray(12,16).toString(),'IHDR',name);
  assert.ok(b.readUInt32BE(16)>=1000&&b.readUInt32BE(20)>=1000,name);
  assert.equal(b[25],6,name+' must carry RGBA transparency');
 }
});
