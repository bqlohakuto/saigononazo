const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),arch='archive/characters/hana/2026-10-15',current='images/characters/hana-current';
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
test('legacy Hana files are preserved byte-for-byte and absent from active image folders',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(root,arch,'manifest.json')));
 assert.equal(manifest.files.length,36);
 for(const f of manifest.files){assert(!fs.existsSync(path.join(root,f.originalPath)),f.originalPath+' is archived');assert.equal(hash(arch+'/'+f.originalPath),f.sha256);}
});
test('runtime has no legacy or archive character references, including fallbacks',()=>{
 for(const name of fs.readdirSync(root).filter(n=>/\.(js|css|html)$/.test(n))){
  const source=fs.readFileSync(path.join(root,name),'utf8');
  assert.doesNotMatch(source,/(?:hana-v[258]\/|hana-expressions\.png|sleeping-overlay\.webp|archive\/characters)/,name);
  for(const [,asset] of source.matchAll(/(images\/characters\/hana-current\/[\w/.-]+\.webp)/g))assert(fs.existsSync(path.join(root,asset)),name+': '+asset);
 }
});
test('every current character asset matches its manifest and full bodies share a canvas',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(root,current,'manifest.json')));
 assert.equal(manifest.assets.length,25);
 for(const f of manifest.assets){assert.equal(hash(current+'/'+f.path),f.sha256,f.path);if(f.path.startsWith('world/'))assert.deepEqual([f.width,f.height],[512,1024],f.path);}
});
