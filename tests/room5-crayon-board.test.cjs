const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
test('room 5 crayon composite uses existing correct-placement state',()=>{
 const game=read('late-game.js');
 assert.match(game,/room5State\.placed\[placedId\]=counter/);
 assert.match(game,/data-counter/);
 assert.match(game,/r5-doodle-board/);
 assert.match(game,/placedId\?'':counterSketch\(slot\)/);
 assert.match(game,/const xs=\[14\.5,37\.5,60\.5,83\.5\]/);
 assert.match(game,/const R5_TARGET=\{mirror:"面",fish:"尾",butterfly:"頭",flower:"輪",squid:"杯",chair:"脚",cannon:"門"\}/);
});
test('room 5 composite art is present and is a WebP picture',()=>{
 const b=fs.readFileSync(path.join(__dirname,'../images/background/room05/crayon-board-preview.webp'));
 assert.equal(b.subarray(0,4).toString(),'RIFF');
 assert.equal(b.subarray(8,12).toString(),'WEBP');
 assert.ok(b.length>3000);
 assert.match(read('room5.css'),/crayon-board-preview\.webp/);
});
