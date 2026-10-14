const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
function state(id){const ctx=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(root,'scenario.js'),'utf8')+fs.readFileSync(path.join(root,'opening-sequence.js'),'utf8'),ctx);return JSON.parse(vm.runInContext(`JSON.stringify(pixelOpeningState({logId:${JSON.stringify(id)}}))`,ctx));}
test('paginated opening and resumed source IDs retain camera and door state',()=>{
 assert.equal(state('opening_03_01').phase,'black');
 assert.equal(state('opening_04_01').phase,'black');
 assert.equal(state('opening_05_01').phase,'white');
 assert.equal(state('opening_07_01').phase,'room');
 assert.equal(state('opening_12_01').hana,false,'voice from behind must not reveal Hana early');
 assert.equal(state('opening_14_01').hana,true);
 assert.equal(state('opening_30_01').view,'hana');
 assert.equal(state('opening_31_01').view,'door');
 assert.equal(state('opening_38_01').open,false);
 assert.equal(state('opening_39_01').open,true);
 assert.equal(state('opening_41_01').whiteout,true);
 assert.equal(state('opening_24_response_01').emotion,'sadness','longest LOG ID must beat opening_24 prefix');
});
test('all prototype opening and character assets are vendored locally',()=>{
 const assets=['white-room.png','title-background-pixel.png',...['01','02','03','04'].map(f=>'hana-v8/idle/'+f+'.png'),...['neutral','joy','anger','sadness','laughter','surprise','confused','thinking','sleepy'].flatMap(n=>['hana-v8/'+n+'.png','hana-v5/portraits/'+n+'.png']),...['question','sweat','thinking'].map(n=>'bubbles-side/right/'+n+'.png')];
 for(const asset of assets)assert(fs.existsSync(path.join(root,'images/pixel-ui',asset)),asset);
});
