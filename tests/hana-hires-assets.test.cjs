const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),base='images/characters/hana-hires/';
const manifest=JSON.parse(fs.readFileSync(path.join(root,base,'manifest.json')));
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
test('approved high-resolution idle and portrait files match the manifest',()=>{
 assert.equal(manifest.assets.length,5);
 for(const a of manifest.assets){assert.equal(hash(base+a.path),a.sha256,a.path);if(a.path.startsWith('idle/'))assert.deepEqual([a.width,a.height],[1024,2048]);}
 assert.equal(hash(base+'idle/01.webp'),hash(base+'idle/02.webp'));
 assert.deepEqual(manifest.quality.canvas,[1024,2048]);
 assert.equal(manifest.quality.interiorAlphaMin,255);
 assert.equal(manifest.quality.bodyPixelDifferences,0);
 assert.equal(manifest.quality.alphaPixelDifferences,0);
});
test('retired body variants are archived exactly and cannot reappear in runtime fallbacks',()=>{
 const archive='archive/characters/hana/2026-10-15-hires-idle/';
 const retired=JSON.parse(fs.readFileSync(path.join(root,archive,'manifest.json'))).files;
 assert.equal(retired.length,15);
 const runtime=fs.readdirSync(root).filter(f=>/\.(js|css|html)$/.test(f)).map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n');
 for(const a of retired){assert(!fs.existsSync(path.join(root,a.originalPath)));assert.equal(hash(archive+a.originalPath),a.sha256);assert(!runtime.includes(a.originalPath),a.originalPath);}
 assert(!runtime.includes('hana-current/world/\'+name+'),'No dynamic old body expression paths');
});
